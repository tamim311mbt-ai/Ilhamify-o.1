/**
 * Browser MediaRecorder WebM ফাইলগুলোতে প্রায়ই Segment আকার unknown (-1),
 * Info > Duration অনুপস্থিত, কিংবা প্রথম Cluster Timecode শূন্যের বদলে অফসেট থাকতে পারে।
 * ফলে Facebook বা প্লেয়ার ভিডিওর আসল দৈর্ঘ্য ভুলভাবে পড়ে বা কেটে দেয়।
 * এই ইউটিলিটি EBML হেডার, Segment আকার, Duration ও Cluster Timecode ঠিক করে।
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

function writeUintInPlace(bytes: Uint8Array, offset: number, length: number, value: number) {
  let remaining = Math.max(0, Math.round(value));
  for (let i = offset + length - 1; i >= offset; i -= 1) {
    bytes[i] = remaining & 0xff;
    remaining = Math.floor(remaining / 256);
  }
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
const ID_CLUSTER = 0x1f43b675;
const ID_CLUSTER_TIMECODE = 0xe7;

function normalizeClusterTimecodesInPlace(bytes: Uint8Array, segDataStart: number) {
  let cursor = segDataStart;
  let firstTimecode: number | null = null;

  while (cursor < bytes.length) {
    const elId = readElementId(bytes, cursor);
    if (!elId) break;
    const sizeOffset = cursor + elId.length;
    const elSize = readVint(bytes, sizeOffset);
    if (!elSize) break;
    const dataStart = sizeOffset + elSize.length;

    if (elId.id === ID_CLUSTER) {
      let inner = dataStart;
      const limit = elSize.isUnknown ? bytes.length : Math.min(bytes.length, dataStart + elSize.value);
      while (inner < limit) {
        const childId = readElementId(bytes, inner);
        if (!childId) break;
        const childSizeOffset = inner + childId.length;
        const childSize = readVint(bytes, childSizeOffset);
        if (!childSize || childSize.isUnknown) break;
        const childDataStart = childSizeOffset + childSize.length;
        const childEnd = childDataStart + childSize.value;
        if (childEnd > bytes.length) break;

        if (childId.id === ID_CLUSTER_TIMECODE && childSize.value >= 1 && childSize.value <= 8) {
          const tc = readUint(bytes, childDataStart, childSize.value);
          if (firstTimecode === null) {
            firstTimecode = tc;
            if (firstTimecode === 0) {
              // প্রথম ক্লাস্টার আগে থেকেই ০ থেকে শুরু হলে কোনো পরিবর্তনের প্রয়োজন নেই
              return;
            }
          }
          if (firstTimecode > 0 && tc >= firstTimecode) {
            writeUintInPlace(bytes, childDataStart, childSize.value, tc - firstTimecode);
          }
          break;
        }
        inner = childEnd;
      }
    }

    if (elSize.isUnknown) {
      // unknown-size ক্লাস্টার হলে ভেতরে পরবর্তী ক্লাস্টার খোঁজার দরকার নেই
      if (elId.id === ID_CLUSTER) break;
      break;
    }
    const nextCursor = dataStart + elSize.value;
    if (nextCursor <= cursor) break;
    cursor = nextCursor;
  }
}

export async function fixWebmDuration(blob: Blob, durationMs: number): Promise<Blob> {
  if (!Number.isFinite(durationMs) || durationMs <= 0) return blob;

  try {
    // 64MB পর্যন্ত পুরো বাফার পড়লে Segment আকার + Duration + Cluster Timecode সব ঠিক করা যায়
    const readFull = blob.size <= 64 * 1024 * 1024;
    const sliceSize = readFull ? blob.size : Math.min(blob.size, 65536);
    const headBuffer = await blob.slice(0, sliceSize).arrayBuffer();
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

        if (readFull) {
          normalizeClusterTimecodesInPlace(bytes, segDataStart);
        }

        const scaledDuration = (durationMs * 1_000_000) / timecodeScale;

        // আগে থেকেই Duration ফিল্ড থাকলে সরাসরি একই জায়গায় লিখে দিন
        if (existingDurationOffset !== null) {
          const view = new DataView(headBuffer);
          if (existingDurationSize === 8) {
            view.setFloat64(existingDurationOffset, scaledDuration, false);
          } else {
            view.setFloat32(existingDurationOffset, scaledDuration, false);
          }
          if (segSize.isUnknown && segSize.length === 8) {
            const exactSegPayload = blob.size - segDataStart;
            bytes.set(encodeVint(exactSegPayload, 8), segSizeOffset);
          }
          return readFull
            ? new Blob([headBuffer], { type: blob.type })
            : new Blob([headBuffer, blob.slice(sliceSize)], { type: blob.type });
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

        let newSegSizeBytes: Uint8Array<ArrayBuffer>;
        if (segSize.isUnknown) {
          if (segSize.length === 8) {
            const exactSegPayload = blob.size - segDataStart + totalDelta;
            newSegSizeBytes = encodeVint(exactSegPayload, 8);
          } else {
            newSegSizeBytes = new Uint8Array(
              headBuffer.slice(segSizeOffset, segSizeOffset + segSize.length)
            );
          }
        } else {
          newSegSizeBytes = encodeVint(segSize.value + totalDelta, segSize.length);
        }

        const parts: BlobPart[] = [
          headBuffer.slice(0, segSizeOffset),
          newSegSizeBytes,
          headBuffer.slice(segDataStart, childSizeOffset),
          newInfoSizeBytes,
          headBuffer.slice(childDataStart, childEnd),
          durationElement,
          headBuffer.slice(childEnd),
        ];
        if (!readFull) {
          parts.push(blob.slice(sliceSize));
        }

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
