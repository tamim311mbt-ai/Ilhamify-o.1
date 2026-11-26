/**
 * Browser MediaRecorder WebM ফাইলগুলোতে প্রায়ই Segment > Info > Duration হেডার অনুপস্থিত থাকে,
 * ফলে Facebook বা প্লেয়ার ভিডিওর আসল দৈর্ঘ্য ভুলভাবে পড়ে।
 * এই ইউটিলিটি প্রথম দিকের EBML হেডার বিশ্লেষণ করে সঠিক Duration (মিলিসেকেন্ডে) যুক্ত করে।
 */

interface VintResult {
  value: number;
  length: number;
  isUnknown: boolean;
}

function readVint(bytes: Uint8Array, offset: number): VintResult | null {
  if (offset >= bytes.length) return null;
  const first = bytes[offset];
  if (first === 0) return null;

  let mask = 0x80;
  let length = 1;
  while (length <= 8 && (first & mask) === 0) {
    mask >>= 1;
    length += 1;
  }
  if (length > 8 || offset + length > bytes.length) return null;

  let value = first & ~mask;
  let allOnes = value === mask - 1;

  for (let i = 1; i < length; i += 1) {
    const b = bytes[offset + i];
    if (b !== 0xff) allOnes = false;
    value = value * 256 + b;
  }

  return { value, length, isUnknown: allOnes };
}

function readElementId(bytes: Uint8Array, offset: number): { id: number; length: number } | null {
  if (offset >= bytes.length) return null;
  const first = bytes[offset];
  if (first === 0) return null;

  let mask = 0x80;
  let length = 1;
  while (length <= 4 && (first & mask) === 0) {
    mask >>= 1;
    length += 1;
  }
  if (length > 4 || offset + length > bytes.length) return null;

  let id = 0;
  for (let i = 0; i < length; i += 1) {
    id = id * 256 + bytes[offset + i];
  }
  return { id, length };
}

function encodeVint(value: number, minLength = 1): Uint8Array<ArrayBuffer> {
  let length = minLength;
  while (length <= 8) {
    const maxVal = Math.pow(2, 7 * length) - 2;
    if (value <= maxVal) break;
    length += 1;
  }
  if (length > 8) length = 8;

  const out = new Uint8Array(new ArrayBuffer(length));
  let remaining = value;
  for (let i = length - 1; i >= 0; i -= 1) {
    out[i] = remaining & 0xff;
    remaining = Math.floor(remaining / 256);
  }
  out[0] |= 1 << (8 - length);
  return out;
}

function readUint(bytes: Uint8Array, offset: number, length: number): number {
  let val = 0;
  for (let i = 0; i < length; i += 1) {
    val = val * 256 + bytes[offset + i];
  }
  return val;
}

function writeFloat64BE(value: number): Uint8Array<ArrayBuffer> {
  const buf = new ArrayBuffer(8);
  new DataView(buf).setFloat64(0, value, false);
  return new Uint8Array(buf);
}

const ID_EBML = 0x1a45dfa3;
const ID_SEGMENT = 0x18538067;
const ID_INFO = 0x1549a966;
const ID_TIMECODE_SCALE = 0x2ad7b1;
const ID_DURATION = 0x4489;

export async function fixWebmDuration(blob: Blob, durationMs: number): Promise<Blob> {
  if (!Number.isFinite(durationMs) || durationMs <= 0) return blob;

  try {
    // EBML ও Segment > Info হেডার সাধারণত প্রথম ৬৪ কিলোবাইটের মধ্যেই থাকে
    const headSliceSize = Math.min(blob.size, 65536);
    const headBuffer = await blob.slice(0, headSliceSize).arrayBuffer();
    const bytes = new Uint8Array(headBuffer);

    let pos = 0;
    const ebmlId = readElementId(bytes, pos);
    if (!ebmlId || ebmlId.id !== ID_EBML) return blob;
    pos += ebmlId.length;
    const ebmlSize = readVint(bytes, pos);
    if (!ebmlSize) return blob;
    pos += ebmlSize.length + ebmlSize.value;

    const segId = readElementId(bytes, pos);
    if (!segId || segId.id !== ID_SEGMENT) return blob;
    const segSizeOffset = pos + segId.length;
    const segSize = readVint(bytes, segSizeOffset);
    if (!segSize) return blob;

    const segDataStart = segSizeOffset + segSize.length;
    const scanLimit = Math.min(
      bytes.length,
      segSize.isUnknown ? bytes.length : segDataStart + segSize.value
    );

    let cursor = segDataStart;
    while (cursor < scanLimit) {
      const childId = readElementId(bytes, cursor);
      if (!childId) break;
      const childSizeOffset = cursor + childId.length;
      const childSize = readVint(bytes, childSizeOffset);
      if (!childSize) break;

      const childDataStart = childSizeOffset + childSize.length;
      const childEnd = childSize.isUnknown ? scanLimit : childDataStart + childSize.value;

      if (childId.id === ID_INFO && !childSize.isUnknown && childEnd <= bytes.length) {
        let timecodeScale = 1_000_000;
        let existingDurationOffset: number | null = null;
        let existingDurationSize = 0;

        let infoCursor = childDataStart;
        while (infoCursor < childEnd) {
          const propId = readElementId(bytes, infoCursor);
          if (!propId) break;
          const propSizeOffset = infoCursor + propId.length;
          const propSize = readVint(bytes, propSizeOffset);
          if (!propSize || propSize.isUnknown) break;

          const propDataStart = propSizeOffset + propSize.length;
          const propDataEnd = propDataStart + propSize.value;
          if (propDataEnd > childEnd) break;

          if (propId.id === ID_TIMECODE_SCALE && propSize.value <= 8) {
            timecodeScale = readUint(bytes, propDataStart, propSize.value) || 1_000_000;
          } else if (propId.id === ID_DURATION && (propSize.value === 4 || propSize.value === 8)) {
            existingDurationOffset = propDataStart;
            existingDurationSize = propSize.value;
          }

          infoCursor = propDataEnd;
        }

        const scaledDuration = (durationMs * 1_000_000) / timecodeScale;

        // আগে থেকেই Duration ফিল্ড থাকলে সরাসরি একই জায়গায় লিখে দিন
        if (existingDurationOffset !== null) {
          const patchedBuf = headBuffer.slice(0);
          const view = new DataView(patchedBuf);
          if (existingDurationSize === 8) {
            view.setFloat64(existingDurationOffset, scaledDuration, false);
          } else {
            view.setFloat32(existingDurationOffset, scaledDuration, false);
          }
          return new Blob([patchedBuf, blob.slice(headSliceSize)], { type: blob.type });
        }

        // Duration এলিমেন্ট না থাকলে Info-এর শেষে ১১ বাইট যুক্ত করুন
        const durationElement = new Uint8Array(new ArrayBuffer(11));
        durationElement[0] = 0x44;
        durationElement[1] = 0x89;
        durationElement[2] = 0x88; // 8-byte float64 VINT size
        durationElement.set(writeFloat64BE(scaledDuration), 3);

        const newInfoPayloadSize = childSize.value + durationElement.length;
        const newInfoSizeBytes = encodeVint(newInfoPayloadSize, childSize.length);
        const infoSizeDelta = newInfoSizeBytes.length - childSize.length;
        const totalDelta = durationElement.length + infoSizeDelta;

        const newSegSizeBytes: Uint8Array<ArrayBuffer> = segSize.isUnknown
          ? new Uint8Array(headBuffer.slice(segSizeOffset, segSizeOffset + segSize.length))
          : encodeVint(segSize.value + totalDelta, segSize.length);

        const parts: BlobPart[] = [
          headBuffer.slice(0, segSizeOffset),
          newSegSizeBytes,
          headBuffer.slice(segDataStart, childSizeOffset),
          newInfoSizeBytes,
          headBuffer.slice(childDataStart, childEnd),
          durationElement,
          headBuffer.slice(childEnd),
          blob.slice(headSliceSize),
        ];

        return new Blob(parts, { type: blob.type });
      }

      if (childSize.isUnknown || childEnd <= cursor) break;
      cursor = childEnd;
    }
  } catch {
    // কোনো অপ্রত্যাশিত কনটেইনার হলে মূল ব্লব অপরিবর্তিত রাখুন
  }

  return blob;
}
