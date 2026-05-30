import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import * as Speech from 'expo-speech';
import { groqWhisper } from '@/lib/groq';

const WAKE_PHRASES = ['hey ghost', 'ok ghost', 'ghost'];

export function containsWakeWord(text: string): boolean {
  const t = text.toLowerCase();
  return WAKE_PHRASES.some((w) => t.includes(w));
}

export function stripWakeWord(text: string): string {
  let t = text;
  for (const w of WAKE_PHRASES) {
    t = t.replace(new RegExp(w, 'ig'), '').trim();
  }
  return t.trim();
}

let recording: Audio.Recording | null = null;

export async function startRecording(): Promise<void> {
  await Audio.requestPermissionsAsync();
  await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
  const { recording: rec } = await Audio.Recording.createAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
  recording = rec;
}

export async function stopRecordingAndTranscribe(): Promise<string> {
  if (!recording) return '';
  await recording.stopAndUnloadAsync();
  const uri = recording.getURI();
  recording = null;
  if (!uri) return '';
  const text = await groqWhisper(uri);
  return text;
}

export function speak(text: string, onDone?: () => void): void {
  Speech.speak(text, {
    language: 'en-IN',
    pitch: 1.0,
    rate: 0.95,
    onDone,
  });
}

export function stopSpeaking(): void {
  Speech.stop();
}

/** Record ~5s chunk for continuous mode */
export async function recordChunk(ms = 5000): Promise<string> {
  await startRecording();
  await new Promise((r) => setTimeout(r, ms));
  return stopRecordingAndTranscribe();
}
