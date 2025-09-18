
/**
 * Utilidades para manejo de audio, grabación y compresión
 * Optimizado para grabaciones de llamadas y visitas presenciales
 */

export interface AudioRecordingOptions {
  sampleRate: number;
  channelCount: number;
  bitRate: number;
  format: 'webm' | 'wav' | 'mp3';
  maxDuration: number; // en segundos
  compression: 'none' | 'low' | 'medium' | 'high';
}

export interface AudioMetadata {
  duration: number;
  size: number;
  format: string;
  sampleRate: number;
  channels: number;
  bitRate: number;
  quality: 'EXCELENTE' | 'BUENA' | 'REGULAR' | 'MALA';
}

export interface RecordingResult {
  blob: Blob;
  metadata: AudioMetadata;
  buffer: ArrayBuffer;
}

/**
 * Configuraciones predefinidas por calidad
 */
export const AUDIO_PRESETS: Record<string, AudioRecordingOptions> = {
  mobile: {
    sampleRate: 16000,
    channelCount: 1,
    bitRate: 32000,
    format: 'webm',
    maxDuration: 3600, // 1 hora
    compression: 'medium',
  },
  desktop: {
    sampleRate: 44100,
    channelCount: 2,
    bitRate: 128000,
    format: 'webm',
    maxDuration: 7200, // 2 horas
    compression: 'low',
  },
  highQuality: {
    sampleRate: 48000,
    channelCount: 2,
    bitRate: 256000,
    format: 'wav',
    maxDuration: 3600, // 1 hora
    compression: 'none',
  },
  compressed: {
    sampleRate: 16000,
    channelCount: 1,
    bitRate: 16000,
    format: 'webm',
    maxDuration: 3600, // 1 hora  
    compression: 'high',
  },
};

/**
 * Clase para manejar grabación de audio
 */
export class AudioRecorder {
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];
  private stream: MediaStream | null = null;
  private startTime: number = 0;
  private options: AudioRecordingOptions;

  constructor(options: AudioRecordingOptions = AUDIO_PRESETS.desktop) {
    this.options = options;
  }

  /**
   * Solicita permisos y inicia la grabación
   */
  async startRecording(): Promise<void> {
    try {
      // Solicitar permisos de micrófono
      this.stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: this.options.sampleRate,
          channelCount: this.options.channelCount,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        }
      });

      // Configurar MediaRecorder
      const mimeType = this.getSupportedMimeType();
      this.mediaRecorder = new MediaRecorder(this.stream, {
        mimeType,
        bitsPerSecond: this.options.bitRate,
      });

      this.audioChunks = [];
      this.startTime = Date.now();

      // Event listeners
      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.audioChunks.push(event.data);
        }
      };

      this.mediaRecorder.onerror = (error) => {
        console.error('Error en grabación:', error);
        throw new Error('Error durante la grabación');
      };

      // Iniciar grabación
      this.mediaRecorder.start(1000); // Captura cada segundo

      // Auto-stop si excede duración máxima
      setTimeout(() => {
        if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
          this.stopRecording();
        }
      }, this.options.maxDuration * 1000);

    } catch (error) {
      console.error('Error al iniciar grabación:', error);
      throw new Error('No se pudo acceder al micrófono');
    }
  }

  /**
   * Detiene la grabación y devuelve el resultado
   */
  async stopRecording(): Promise<RecordingResult> {
    return new Promise((resolve, reject) => {
      if (!this.mediaRecorder || this.mediaRecorder.state === 'inactive') {
        reject(new Error('No hay grabación activa'));
        return;
      }

      this.mediaRecorder.onstop = async () => {
        try {
          const duration = (Date.now() - this.startTime) / 1000;
          
          // Crear blob con los chunks
          const mimeType = this.getSupportedMimeType();
          const blob = new Blob(this.audioChunks, { type: mimeType });
          
          // Convertir a buffer
          const buffer = await blob.arrayBuffer();
          
          // Calcular metadata
          const metadata = this.calculateMetadata(blob, duration);
          
          // Limpiar recursos
          this.cleanupResources();
          
          resolve({ blob, metadata, buffer });
        } catch (error) {
          reject(error);
        }
      };

      this.mediaRecorder.stop();
    });
  }

  /**
   * Pausa la grabación
   */
  pauseRecording(): void {
    if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
      this.mediaRecorder.pause();
    }
  }

  /**
   * Reanuda la grabación
   */
  resumeRecording(): void {
    if (this.mediaRecorder && this.mediaRecorder.state === 'paused') {
      this.mediaRecorder.resume();
    }
  }

  /**
   * Cancela la grabación y limpia recursos
   */
  cancelRecording(): void {
    if (this.mediaRecorder) {
      this.mediaRecorder.stop();
    }
    this.cleanupResources();
  }

  /**
   * Obtiene el tipo MIME soportado por el navegador
   */
  private getSupportedMimeType(): string {
    const types = [
      'audio/webm;codecs=opus',
      'audio/webm',
      'audio/mp4',
      'audio/wav',
    ];

    for (const type of types) {
      if (MediaRecorder.isTypeSupported(type)) {
        return type;
      }
    }

    return 'audio/webm'; // Fallback
  }

  /**
   * Calcula metadata del audio
   */
  private calculateMetadata(blob: Blob, duration: number): AudioMetadata {
    const size = blob.size;
    const bitRate = (size * 8) / duration;
    
    let quality: 'EXCELENTE' | 'BUENA' | 'REGULAR' | 'MALA' = 'REGULAR';
    
    if (duration > 10 && bitRate > 64000) {
      quality = 'EXCELENTE';
    } else if (duration > 5 && bitRate > 32000) {
      quality = 'BUENA';
    } else if (duration > 2) {
      quality = 'REGULAR';
    } else {
      quality = 'MALA';
    }

    return {
      duration: Math.round(duration),
      size,
      format: this.options.format,
      sampleRate: this.options.sampleRate,
      channels: this.options.channelCount,
      bitRate: Math.round(bitRate),
      quality,
    };
  }

  /**
   * Limpia recursos de grabación
   */
  private cleanupResources(): void {
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }
    this.mediaRecorder = null;
    this.audioChunks = [];
  }

  /**
   * Verifica si la grabación está activa
   */
  get isRecording(): boolean {
    return this.mediaRecorder?.state === 'recording';
  }

  /**
   * Verifica si la grabación está pausada
   */
  get isPaused(): boolean {
    return this.mediaRecorder?.state === 'paused';
  }
}

/**
 * Comprime audio usando diferentes algoritmos
 */
export async function compressAudio(
  buffer: ArrayBuffer,
  compressionLevel: 'none' | 'low' | 'medium' | 'high' = 'medium'
): Promise<ArrayBuffer> {
  if (compressionLevel === 'none') {
    return buffer;
  }

  try {
    // Para navegador, usamos la API de Audio para compresión básica
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const audioBuffer = await audioContext.decodeAudioData(buffer.slice(0));
    
    let sampleRate = audioBuffer.sampleRate;
    let channels = audioBuffer.numberOfChannels;
    
    // Ajustar parámetros según nivel de compresión
    switch (compressionLevel) {
      case 'low':
        sampleRate = Math.min(sampleRate, 44100);
        break;
      case 'medium':
        sampleRate = Math.min(sampleRate, 22050);
        channels = 1; // Mono
        break;
      case 'high':
        sampleRate = 16000;
        channels = 1; // Mono
        break;
    }

    // Crear nuevo buffer con parámetros comprimidos
    const compressedBuffer = audioContext.createBuffer(
      channels,
      audioBuffer.length * (sampleRate / audioBuffer.sampleRate),
      sampleRate
    );

    // Copiar y reducir canales si es necesario
    for (let channel = 0; channel < channels; channel++) {
      const inputChannel = channel < audioBuffer.numberOfChannels ? channel : 0;
      const inputData = audioBuffer.getChannelData(inputChannel);
      const outputData = compressedBuffer.getChannelData(channel);
      
      for (let i = 0; i < outputData.length; i++) {
        const inputIndex = Math.floor(i * (audioBuffer.length / outputData.length));
        outputData[i] = inputData[inputIndex];
      }
    }

    // Convertir de vuelta a ArrayBuffer
    const offlineContext = new OfflineAudioContext(
      compressedBuffer.numberOfChannels,
      compressedBuffer.length,
      compressedBuffer.sampleRate
    );
    
    const source = offlineContext.createBufferSource();
    source.buffer = compressedBuffer;
    source.connect(offlineContext.destination);
    source.start();
    
    const renderedBuffer = await offlineContext.startRendering();
    
    // Convertir a WAV
    return audioBufferToWav(renderedBuffer);
    
  } catch (error) {
    console.error('Error en compresión de audio:', error);
    return buffer; // Devolver original si falla
  }
}

/**
 * Convierte AudioBuffer a formato WAV
 */
function audioBufferToWav(buffer: AudioBuffer): ArrayBuffer {
  const length = buffer.length;
  const numberOfChannels = buffer.numberOfChannels;
  const sampleRate = buffer.sampleRate;
  const bitDepth = 16;
  
  const arrayBuffer = new ArrayBuffer(44 + length * numberOfChannels * (bitDepth / 8));
  const view = new DataView(arrayBuffer);
  
  // WAV header
  const writeString = (offset: number, string: string) => {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  };
  
  writeString(0, 'RIFF');
  view.setUint32(4, 36 + length * numberOfChannels * (bitDepth / 8), true);
  writeString(8, 'WAVE');
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, numberOfChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * numberOfChannels * (bitDepth / 8), true);
  view.setUint16(32, numberOfChannels * (bitDepth / 8), true);
  view.setUint16(34, bitDepth, true);
  writeString(36, 'data');
  view.setUint32(40, length * numberOfChannels * (bitDepth / 8), true);
  
  // Audio data
  let offset = 44;
  for (let i = 0; i < length; i++) {
    for (let channel = 0; channel < numberOfChannels; channel++) {
      const sample = Math.max(-1, Math.min(1, buffer.getChannelData(channel)[i]));
      view.setInt16(offset, sample * 0x7FFF, true);
      offset += 2;
    }
  }
  
  return arrayBuffer;
}

/**
 * Detecta dispositivo y recomienda configuración óptima
 */
export function getOptimalSettings(): AudioRecordingOptions {
  const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  const isSlowConnection = (navigator as any).connection?.effectiveType === 'slow-2g' || 
                          (navigator as any).connection?.effectiveType === '2g';

  if (isMobile || isSlowConnection) {
    return AUDIO_PRESETS.mobile;
  } else {
    return AUDIO_PRESETS.desktop;
  }
}

/**
 * Valida que el navegador soporte grabación
 */
export function checkAudioSupport(): {
  supported: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!navigator.mediaDevices) {
    errors.push('MediaDevices API no disponible');
  }

  if (!navigator.mediaDevices?.getUserMedia) {
    errors.push('getUserMedia no disponible');
  }

  if (!window.MediaRecorder) {
    errors.push('MediaRecorder API no disponible');
  }

  if (!window.AudioContext && !(window as any).webkitAudioContext) {
    errors.push('Web Audio API no disponible');
  }

  return {
    supported: errors.length === 0,
    errors,
  };
}

/**
 * Estima la duración del audio a partir del tamaño
 */
export function estimateAudioDuration(
  fileSize: number,
  bitRate: number = 128000
): number {
  // Duración en segundos = (tamaño en bytes * 8) / bitRate
  return Math.round((fileSize * 8) / bitRate);
}

/**
 * Formatea duración en formato MM:SS
 */
export function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Convierte tamaño de archivo a formato legible
 */
export function formatFileSize(bytes: number): string {
  const sizes = ['B', 'KB', 'MB', 'GB'];
  if (bytes === 0) return '0 B';
  
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${Math.round(bytes / Math.pow(1024, i) * 100) / 100} ${sizes[i]}`;
}
