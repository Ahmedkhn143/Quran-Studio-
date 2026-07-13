/**
 * Audio Decoder & Waveform Visualizer & Auto Surah Detector Helper
 */

import { SURAHS_DB } from "./surahs-db";

export interface DecodedAudioData {
  audioBuffer: AudioBuffer;
  peaks: number[];
  duration: number;
}

/**
 * Decodes an audio file Blob into an AudioBuffer and generates waveform amplitude peaks.
 */
export async function decodeAudioFile(file: File): Promise<DecodedAudioData> {
  const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  const arrayBuffer = await file.arrayBuffer();
  
  return new Promise((resolve, reject) => {
    audioCtx.decodeAudioData(
      arrayBuffer,
      (audioBuffer) => {
        const duration = audioBuffer.duration;
        const peaks = extractPeaks(audioBuffer, 200); // 200 points for preview waveform
        resolve({ audioBuffer, peaks, duration });
      },
      (err) => reject(err)
    );
  });
}

/**
 * Detects starting silence offset in seconds from an AudioBuffer.
 */
export function detectSilenceStart(audioBuffer: AudioBuffer, threshold = 0.015): number {
  const data = audioBuffer.getChannelData(0);
  const sampleRate = audioBuffer.sampleRate;
  for (let i = 0; i < data.length; i++) {
    if (Math.abs(data[i]) > threshold) {
      // Find sample index, convert to seconds
      const sec = i / sampleRate;
      // Subtract a small buffer (0.15s) so the audio doesn't cut in too abruptly
      return Math.max(0, parseFloat((sec - 0.15).toFixed(2)));
    }
  }
  return 0;
}


/**
 * Extracts amplitude peaks from an AudioBuffer channel.
 */
function extractPeaks(buffer: AudioBuffer, length: number): number[] {
  const data = buffer.getChannelData(0);
  const step = Math.floor(data.length / length) || 1;
  const peaks: number[] = [];

  for (let i = 0; i < length; i++) {
    let max = 0;
    const start = i * step;
    for (let j = 0; j < step && (start + j) < data.length; j++) {
      const val = Math.abs(data[start + j]);
      if (val > max) max = val;
    }
    peaks.push(max);
  }

  // Normalize peaks
  const maxPeak = Math.max(...peaks) || 1;
  return peaks.map((p) => p / maxPeak);
}

/**
 * Auto-detects the matching Surah by analyzing audio duration 
 * against historical database averages for recitations.
 */
export function detectSurahFromAudio(durationSec: number): {
  detected: boolean;
  surahNumber: number;
  confidence: number;
} {
  // Estimated duration scaling: standard Murattal recitation of Quran is roughly 4-6 seconds per Ayah.
  // We can match the audio length to the nearest Surah length in a standard recitation index.
  // Standard full Al-Faatiha is ~20-30s.
  // Let's compare duration and return the closest match.
  let bestMatch = 1;
  let minDiff = Infinity;

  // Average recitation speed: 5.5 seconds per ayah
  const avgAyahDuration = 5.5;

  for (const s of SURAHS_DB) {
    const expectedDuration = s.numberOfAyahs * avgAyahDuration;
    const diff = Math.abs(durationSec - expectedDuration);
    if (diff < minDiff) {
      minDiff = diff;
      bestMatch = s.number;
    }
  }

  const confidence = Math.max(0.1, 1 - minDiff / (durationSec || 1));

  return {
    detected: confidence > 0.5,
    surahNumber: bestMatch,
    confidence: Math.round(confidence * 100),
  };
}

/**
 * Draws the waveform peaks on a 2D Canvas.
 */
export function drawWaveform(
  canvas: HTMLCanvasElement,
  peaks: number[],
  progress = 0,
  activeRanges: { start: number; end: number }[] = []
) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const w = canvas.width;
  const h = canvas.height;
  ctx.clearRect(0, 0, w, h);

  const barWidth = w / peaks.length;
  const gap = 1;

  peaks.forEach((peak, i) => {
    const x = i * barWidth;
    const barHeight = peak * (h * 0.8);
    const y = (h - barHeight) / 2;

    const progressPct = i / peaks.length;
    
    // Determine color based on progress
    if (progressPct <= progress) {
      ctx.fillStyle = "#d4a017"; // active color (gold)
    } else {
      ctx.fillStyle = "rgba(255, 255, 255, 0.2)"; // passive color (gray)
    }

    // Highlight segments corresponding to active ayahs
    activeRanges.forEach((range) => {
      if (progressPct >= range.start && progressPct <= range.end) {
        ctx.fillStyle = progressPct <= progress ? "#10b981" : "rgba(16, 185, 129, 0.4)"; // Emerald highlight
      }
    });

    ctx.fillRect(x, y, barWidth - gap, barHeight);
  });
}
