import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import * as Speech from 'expo-speech';
import { groqWhisper } from '@/lib/agents';

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

export async function startRecording(): Promise<boolean> {
  try {
    const { status } = await Audio.requestPermissionsAsync();
    if (status !== 'granted') {
      console.warn('Audio permissions not granted');
      return false;
    }

    await Audio.setAudioModeAsync({
      allowsRecordingIOS: true,
      playsInSilentModeIOS: true,
    });

    const { recording: rec } = await Audio.Recording.createAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
    recording = rec;
    return true;
  } catch (error) {
    console.error('Error starting recording:', error);
    return false;
  }
}

export async function stopRecordingAndTranscribe(): Promise<string> {
  try {
    if (!recording) {
      console.warn('No active recording to stop');
      return '';
    }

    await recording.stopAndUnloadAsync();
    const uri = recording.getURI();
    recording = null;

    if (!uri) {
      console.warn('No recording URI');
      return '';
    }

    const text = await groqWhisper(uri);
    return text;
  } catch (error) {
    console.error('Error stopping/transcribing recording:', error);
    if (recording) {
      try {
        await recording.stopAndUnloadAsync();
      } catch {}
      recording = null;
    }
    return '';
  }
}

export function speak(text: string, onDone?: () => void): void {
  try {
    Speech.speak(text, {
      language: 'en-IN',
      pitch: 1.0,
      rate: 0.95,
      onDone,
    });
  } catch (error) {
    console.error('Error speaking:', error);
    if (onDone) onDone();
  }
}

export function stopSpeaking(): void {
  try {
    Speech.stop();
  } catch (error) {
    console.error('Error stopping speech:', error);
  }
}

/** Record ~5s chunk for continuous mode */
export async function recordChunk(ms = 5000): Promise<string> {
  const started = await startRecording();
  if (!started) return '';

  await new Promise((r) => setTimeout(r, ms));
  return stopRecordingAndTranscribe();
}
