import { ArrayBufferTarget, Muxer } from 'mp4-muxer';

export interface ExportReelMp4Options {
  width: number;
  height: number;
  durationSeconds: number;
  fps?: number;
  videoBitrate: number;
  audioBuffer: AudioBuffer | null;
  renderFrame: (ctx: CanvasRenderingContext2D, progress: number) => void;
  onProgress: (percent: number) => void;
  isCancelled: () => boolean;
}

interface SupportedVideoConfig {
  codec: string;
  width: number;
  height: number;
  bitrate: number;
  framerate: number;
}

interface SupportedAudioConfig {
  codec: 'mp4a.40.2';
  numberOfChannels: number;
  sampleRate: number;
  bitrate: number;
  buffer: AudioBuffer;
}

async function pickSupportedVideoConfig(
  width: number,
  height: number,
  bitrate: number,
  framerate: number
): Promise<SupportedVideoConfig | null> {
  if (typeof VideoEncoder !== 'function' || typeof VideoFrame !== 'function') {
    return null;
  }

  const is1080p = width * height > 921_600;
  const codecs = is1080p
    ? ['avc1.420028', 'avc1.4d0028', 'avc1.640028', 'avc1.42002a', 'avc1.4d002a']
    : ['avc1.42001f', 'avc1.4d001f', 'avc1.64001f', 'avc1.420028', 'avc1.4d0028'];

  for (const codec of codecs) {
    try {
      const check = await VideoEncoder.isConfigSupported({
        codec,
        width,
        height,
        bitrate,
        framerate,
        avc: { format: 'avc' },
      });
      if (check.supported) {
        return { codec, width, height, bitrate, framerate };
      }
    } catch {
      // পরবর্তী প্রোফাইল চেষ্টা করুন
    }
  }

  return null;
}

async function prepareSupportedAudioConfig(
  sourceBuffer: AudioBuffer,
  durationSeconds: number
): Promise<SupportedAudioConfig | null> {
  if (typeof AudioEncoder !== 'function' || typeof AudioData !== 'function') {
    return null;
  }

  const channels = Math.min(2, Math.max(1, sourceBuffer.numberOfChannels));
  const candidateRates = Array.from(
    new Set([sourceBuffer.sampleRate, 48_000, 44_100])
  );

  for (const sampleRate of candidateRates) {
    try {
      const check = await AudioEncoder.isConfigSupported({
        codec: 'mp4a.40.2',
        numberOfChannels: channels,
        sampleRate,
        bitrate: 128_000,
      });
      if (!check.supported) continue;

      if (sourceBuffer.sampleRate === sampleRate) {
        return {
          codec: 'mp4a.40.2',
          numberOfChannels: channels,
          sampleRate,
          bitrate: 128_000,
          buffer: sourceBuffer,
        };
      }

      if (typeof OfflineAudioContext === 'function') {
        const targetLength = Math.max(1, Math.round(durationSeconds * sampleRate));
        const offline = new OfflineAudioContext(channels, targetLength, sampleRate);
        const src = offline.createBufferSource();
        src.buffer = sourceBuffer;
        src.loop = sourceBuffer.duration > 0 && sourceBuffer.duration < durationSeconds + 0.25;
        src.connect(offline.destination);
        src.start(0);
        const resampled = await offline.startRendering();
        return {
          codec: 'mp4a.40.2',
          numberOfChannels: channels,
          sampleRate,
          bitrate: 128_000,
          buffer: resampled,
        };
      }
    } catch {
      // পরবর্তী স্যাম্পল রেট চেষ্টা করুন
    }
  }

  return null;
}

/**
 * WebCodecs + mp4-muxer ব্যবহার করে স্ট্যান্ডার্ড নন-ফ্র্যাগমেন্টেড Fast-Start MP4 তৈরি করে।
 * এতে প্রতিটি ফ্রেমের টাইমস্ট্যাম্প এবং কন্টেইনার Duration ১০০% নির্ভুল থাকে,
 * ফলে Facebook আপলোডের পর ভিডিও ১০/১৫ সেকেন্ড থেকে কেটে ৫ সেকেন্ড হয় না।
 * ব্রাউজার সমর্থন না করলে null রিটার্ন করে যাতে MediaRecorder ফ্যালব্যাক চলে।
 */
export async function exportReelMp4(options: ExportReelMp4Options): Promise<Blob | null> {
  const fps = options.fps ?? 30;
  const videoCfg = await pickSupportedVideoConfig(
    options.width,
    options.height,
    options.videoBitrate,
    fps
  );
  if (!videoCfg) return null;

  let audioCfg: SupportedAudioConfig | null = null;
  if (options.audioBuffer) {
    audioCfg = await prepareSupportedAudioConfig(options.audioBuffer, options.durationSeconds);
    // অডিও থাকা অবস্থায় ব্রাউজার AAC এনকোডার সমর্থন না করলে WebM+Opus ফ্যালব্যাকে পাঠান
    if (!audioCfg) return null;
  }

  if (options.isCancelled()) return null;

  const canvas = document.createElement('canvas');
  canvas.width = options.width;
  canvas.height = options.height;
  const ctx = canvas.getContext('2d', { alpha: false }) || canvas.getContext('2d');
  if (!ctx) return null;

  const target = new ArrayBufferTarget();
  const muxer = new Muxer({
    target,
    video: {
      codec: 'avc',
      width: options.width,
      height: options.height,
      frameRate: fps,
    },
    ...(audioCfg
      ? {
          audio: {
            codec: 'aac',
            numberOfChannels: audioCfg.numberOfChannels,
            sampleRate: audioCfg.sampleRate,
          },
        }
      : {}),
    fastStart: 'in-memory',
    firstTimestampBehavior: 'offset',
  });

  let fatalError: unknown = null;

  const videoEncoder = new VideoEncoder({
    output: (chunk, meta) => {
      muxer.addVideoChunk(chunk, meta);
    },
    error: (err) => {
      fatalError = err;
    },
  });

  let audioEncoder: AudioEncoder | null = null;

  try {
    videoEncoder.configure({
      codec: videoCfg.codec,
      width: videoCfg.width,
      height: videoCfg.height,
      bitrate: videoCfg.bitrate,
      framerate: videoCfg.framerate,
      avc: { format: 'avc' },
    });

    if (audioCfg) {
      audioEncoder = new AudioEncoder({
        output: (chunk, meta) => {
          muxer.addAudioChunk(chunk, meta);
        },
        error: (err) => {
          fatalError = err;
        },
      });
      audioEncoder.configure({
        codec: audioCfg.codec,
        numberOfChannels: audioCfg.numberOfChannels,
        sampleRate: audioCfg.sampleRate,
        bitrate: audioCfg.bitrate,
      });

      const channels = audioCfg.numberOfChannels;
      const sampleRate = audioCfg.sampleRate;
      const srcBuffer = audioCfg.buffer;
      const srcLen = srcBuffer.length;
      const totalSamples = Math.max(1, Math.round(options.durationSeconds * sampleRate));
      const fadeSamples = Math.min(Math.round(sampleRate * 0.025), Math.floor(totalSamples / 4));
      const chunkFrames = 1024;

      for (let offset = 0; offset < totalSamples; offset += chunkFrames) {
        if (options.isCancelled() || fatalError || audioEncoder.state !== 'configured') {
          break;
        }
        const count = Math.min(chunkFrames, totalSamples - offset);
        const planar = new Float32Array(count * channels);

        for (let ch = 0; ch < channels; ch += 1) {
          const srcCh = srcBuffer.getChannelData(Math.min(ch, srcBuffer.numberOfChannels - 1));
          const chBase = ch * count;
          for (let i = 0; i < count; i += 1) {
            const globalIdx = offset + i;
            let sample = srcCh[globalIdx % srcLen] ?? 0;
            const remaining = totalSamples - globalIdx;
            if (remaining < fadeSamples) {
              sample *= remaining / fadeSamples;
            }
            planar[chBase + i] = sample;
          }
        }

        const audioData = new AudioData({
          format: 'f32-planar',
          sampleRate,
          numberOfFrames: count,
          numberOfChannels: channels,
          timestamp: Math.round((offset / sampleRate) * 1_000_000),
          data: planar,
        });
        audioEncoder.encode(audioData);
        audioData.close();

        if (audioEncoder.encodeQueueSize > 32) {
          await new Promise<void>((r) => window.setTimeout(r, 4));
        }
      }
    }

    const totalFrames = Math.max(1, Math.round(options.durationSeconds * fps));
    let frameIndex = 0;

    await new Promise<void>((resolve, reject) => {
      const step = () => {
        if (options.isCancelled()) {
          resolve();
          return;
        }
        if (fatalError) {
          reject(fatalError);
          return;
        }
        if (videoEncoder.state !== 'configured') {
          reject(new Error('VideoEncoder stopped unexpectedly'));
          return;
        }

        let batch = 0;
        while (
          frameIndex < totalFrames &&
          batch < 2 &&
          videoEncoder.encodeQueueSize < 5
        ) {
          const p = totalFrames > 1 ? frameIndex / (totalFrames - 1) : 1;
          options.renderFrame(ctx, p);

          const timestamp = Math.round((frameIndex * 1_000_000) / fps);
          const nextTimestamp = Math.round(((frameIndex + 1) * 1_000_000) / fps);
          const frame = new VideoFrame(canvas, {
            timestamp,
            duration: Math.max(1, nextTimestamp - timestamp),
          });
          videoEncoder.encode(frame, { keyFrame: frameIndex % fps === 0 });
          frame.close();

          frameIndex += 1;
          batch += 1;
        }

        options.onProgress(Math.min(95, Math.round((frameIndex / totalFrames) * 95)));

        if (frameIndex < totalFrames) {
          window.requestAnimationFrame(step);
        } else {
          resolve();
        }
      };

      window.requestAnimationFrame(step);
    });

    if (options.isCancelled()) {
      return null;
    }

    if (fatalError) {
      throw fatalError;
    }

    if (videoEncoder.state === 'configured') {
      await videoEncoder.flush();
    }
    if (audioEncoder && audioEncoder.state === 'configured') {
      await audioEncoder.flush();
    }

    if (fatalError || options.isCancelled()) {
      return null;
    }

    options.onProgress(98);
    muxer.finalize();

    if (target.buffer.byteLength < 1024) {
      return null;
    }

    return new Blob([target.buffer], { type: 'video/mp4' });
  } finally {
    try {
      if (videoEncoder.state !== 'closed') videoEncoder.close();
    } catch {
      // উপেক্ষা করুন
    }
    try {
      if (audioEncoder && audioEncoder.state !== 'closed') audioEncoder.close();
    } catch {
      // উপেক্ষা করুন
    }
  }
}
