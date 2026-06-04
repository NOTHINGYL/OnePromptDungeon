import type { FeedbackKind } from "../types/feedback";

let audioContext: AudioContext | null = null;

export function playSfx(kind: FeedbackKind, muted: boolean) {
  if (muted || typeof window === "undefined") {
    return;
  }

  const context = getAudioContext();
  if (!context) {
    return;
  }

  const now = context.currentTime;
  if (kind === "combat") playTone(context, now, 160, 0.08, "sawtooth", 0.08, 0.06);
  if (kind === "pickup") playTone(context, now, 720, 0.08, "triangle", 0.06, 0.02, 980);
  if (kind === "door") playTone(context, now, 240, 0.1, "square", 0.05, 0.03, 380);
  if (kind === "blocked") playTone(context, now, 90, 0.08, "sawtooth", 0.05, 0.02);
  if (kind === "stairs") playTone(context, now, 420, 0.12, "triangle", 0.06, 0.03, 760);
  if (kind === "shop") playTone(context, now, 520, 0.1, "triangle", 0.06, 0.03, 660);
  if (kind === "victory") {
    playTone(context, now, 523, 0.12, "triangle", 0.06, 0.02);
    playTone(context, now + 0.12, 659, 0.12, "triangle", 0.06, 0.02);
    playTone(context, now + 0.24, 784, 0.16, "triangle", 0.07, 0.02);
  }
  if (kind === "fallen") playTone(context, now, 180, 0.22, "sawtooth", 0.06, 0.06, 90);
  if (kind === "undo") playTone(context, now, 360, 0.08, "triangle", 0.04, 0.02, 240);
}

function getAudioContext() {
  const AudioContextCtor =
    window.AudioContext ||
    (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioContextCtor) {
    return null;
  }

  audioContext ??= new AudioContextCtor();
  if (audioContext.state === "suspended") {
    void audioContext.resume();
  }
  return audioContext;
}

function playTone(
  context: AudioContext,
  start: number,
  frequency: number,
  duration: number,
  type: OscillatorType,
  gainValue: number,
  attack: number,
  endFrequency?: number,
) {
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, start);
  if (endFrequency) {
    oscillator.frequency.exponentialRampToValueAtTime(endFrequency, start + duration);
  }
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(gainValue, start + attack);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  oscillator.connect(gain);
  gain.connect(context.destination);
  oscillator.start(start);
  oscillator.stop(start + duration + 0.02);
}
