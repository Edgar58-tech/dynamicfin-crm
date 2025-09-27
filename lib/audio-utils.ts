

/**
 * Utilidades para grabación de audio y análisis en tiempo real
 * Updated for Vercel deployment compatibility - v1.3
 */

export interface AudioSettings {
  sampleRate: number
  channelCount: number
  bitsPerSecond: number
  mimeType: string
}

export interface RecordingOptions {
  echoCancellation?: boolean
  noiseSuppression?: boolean
  autoGainControl?: boolean
  deviceId?: string
}

export class AudioRecorder {
  private mediaRecorder: MediaRecorder | null = null
  private audioChunks: Blob[] = []
  private stream: MediaStream | null = null
  private isRecording = false

  constructor(private options: RecordingOptions = {}) {}

  async initialize(): Promise<void> {
    const constraints: MediaStreamConstraints = {
      audio: {
        echoCancellation: this.options.echoCancellation ?? true,
        noiseSuppression: this.options.noiseSuppression ?? true,
        autoGainControl: this.options.autoGainControl ?? true,
        ...(this.options.deviceId && { deviceId: this.options.deviceId })
      }
    }

    try {
      this.stream = await navigator.mediaDevices.getUserMedia(constraints)
    } catch (error) {
      throw new Error('Error accessing microphone: ' + (error as Error).message)
    }
  }

  start(onDataAvailable?: (chunk: Blob) => void): void {
    if (!this.stream) {
      throw new Error('AudioRecorder not initialized. Call initialize() first.')
    }

    if (this.isRecording) {
      throw new Error('Recording is already in progress')
    }

    this.audioChunks = []
    const settings = getOptimalSettings()
    
    try {
      this.mediaRecorder = new MediaRecorder(this.stream, {
        mimeType: settings.mimeType,
        bitsPerSecond: settings.bitsPerSecond
      })
    } catch (error) {
      // Fallback to default if optimal settings are not supported
      this.mediaRecorder = new MediaRecorder(this.stream)
    }

    this.mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        this.audioChunks.push(event.data)
        onDataAvailable?.(event.data)
      }
    }

    this.mediaRecorder.start(1000) // Collect data every second
    this.isRecording = true
  }

  pause(): void {
    if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
      this.mediaRecorder.pause()
    }
  }

  resume(): void {
    if (this.mediaRecorder && this.mediaRecorder.state === 'paused') {
      this.mediaRecorder.resume()
    }
  }

  async stop(): Promise<Blob> {
    return new Promise((resolve, reject) => {
      if (!this.mediaRecorder) {
        reject(new Error('No active recording'))
        return
      }

      this.mediaRecorder.onstop = () => {
        const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' })
        this.cleanup()
        resolve(audioBlob)
      }

      this.mediaRecorder.onerror = (event) => {
        this.cleanup()
        reject(new Error('Recording error: ' + (event as any).error?.message))
      }

      this.mediaRecorder.stop()
      this.isRecording = false
    })
  }

  private cleanup(): void {
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop())
      this.stream = null
    }
    this.mediaRecorder = null
    this.audioChunks = []
    this.isRecording = false
  }

  getState(): 'inactive' | 'recording' | 'paused' {
    if (!this.mediaRecorder) return 'inactive'
    return this.mediaRecorder.state
  }

  isActive(): boolean {
    return this.isRecording
  }
}

export function getOptimalSettings(): AudioSettings {
  // Check browser support for different audio formats
  const testRecorder = (mimeType: string) => {
    return typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(mimeType)
  }

  // Prefer higher quality formats when supported
  if (testRecorder('audio/webm;codecs=opus')) {
    return {
      sampleRate: 48000,
      channelCount: 1,
      bitsPerSecond: 128000,
      mimeType: 'audio/webm;codecs=opus'
    }
  }

  if (testRecorder('audio/webm')) {
    return {
      sampleRate: 44100,
      channelCount: 1,
      bitsPerSecond: 96000,
      mimeType: 'audio/webm'
    }
  }

  if (testRecorder('audio/mp4')) {
    return {
      sampleRate: 44100,
      channelCount: 1,
      bitsPerSecond: 96000,
      mimeType: 'audio/mp4'
    }
  }

  // Fallback to basic settings
  return {
    sampleRate: 44100,
    channelCount: 1,
    bitsPerSecond: 64000,
    mimeType: 'audio/webm'
  }
}

export async function getAudioDevices(): Promise<MediaDeviceInfo[]> {
  if (!navigator.mediaDevices?.enumerateDevices) {
    throw new Error('Media devices API not supported')
  }

  const devices = await navigator.mediaDevices.enumerateDevices()
  return devices.filter(device => device.kind === 'audioinput')
}

export function analyzeAudioLevel(audioData: Uint8Array): number {
  if (audioData.length === 0) return 0

  let sum = 0
  for (let i = 0; i < audioData.length; i++) {
    sum += Math.abs(audioData[i] - 128)
  }
  
  return (sum / audioData.length) / 128
}

export function detectSilence(audioLevel: number, threshold: number = 0.1): boolean {
  return audioLevel < threshold
}

// Utility function to convert audio blob to base64
export function audioBlobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const base64 = reader.result as string
      resolve(base64.split(',')[1]) // Remove data:audio/webm;base64, prefix
    }
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}

export function checkAudioSupport(): boolean {
  return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia && window.MediaRecorder);
}

// Export default class
export default AudioRecorder
der