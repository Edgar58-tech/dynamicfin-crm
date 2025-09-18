
/**
 * Manejo de almacenamiento en Supabase Storage
 * Para archivos de audio, documentos y reportes
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Cliente con permisos de servicio para operaciones administrativas
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Cliente público para operaciones generales
const supabase = createClient(
  supabaseUrl,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export interface UploadResult {
  success: boolean;
  url?: string;
  path?: string;
  error?: string;
  metadata?: {
    size: number;
    type: string;
    lastModified: number;
  };
}

export interface DownloadResult {
  success: boolean;
  url?: string;
  error?: string;
  expiresAt?: Date;
}

export interface StorageConfig {
  bucket: string;
  maxFileSize: number; // en bytes
  allowedTypes: string[];
  generateSignedUrl: boolean;
  expirationHours: number;
}

/**
 * Configuraciones por tipo de archivo
 */
export const STORAGE_CONFIGS: Record<string, StorageConfig> = {
  audio: {
    bucket: process.env.SUPABASE_AUDIO_BUCKET || 'audio-recordings',
    maxFileSize: 50 * 1024 * 1024, // 50MB
    allowedTypes: ['audio/webm', 'audio/wav', 'audio/mp3', 'audio/m4a', 'audio/ogg'],
    generateSignedUrl: true,
    expirationHours: 24,
  },
  documents: {
    bucket: process.env.SUPABASE_DOCUMENTS_BUCKET || 'documents',
    maxFileSize: 10 * 1024 * 1024, // 10MB
    allowedTypes: ['application/pdf', 'text/plain', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
    generateSignedUrl: true,
    expirationHours: 168, // 7 días
  },
  reports: {
    bucket: process.env.SUPABASE_REPORTS_BUCKET || 'reports',
    maxFileSize: 5 * 1024 * 1024, // 5MB
    allowedTypes: ['application/pdf', 'text/csv', 'application/json'],
    generateSignedUrl: true,
    expirationHours: 72, // 3 días
  },
};

/**
 * Sube un archivo a Supabase Storage
 */
export async function uploadFile(
  file: File | Buffer,
  fileName: string,
  category: 'audio' | 'documents' | 'reports' = 'audio',
  options: {
    agenciaId?: number;
    prospectoId?: number;
    vendedorId?: string;
    replace?: boolean;
  } = {}
): Promise<UploadResult> {
  try {
    const config = STORAGE_CONFIGS[category];
    
    // Validar tamaño
    const fileSize = file instanceof File ? file.size : file.length;
    if (fileSize > config.maxFileSize) {
      return {
        success: false,
        error: `El archivo excede el tamaño máximo de ${config.maxFileSize / (1024 * 1024)}MB`,
      };
    }

    // Validar tipo
    const fileType = file instanceof File ? file.type : 'application/octet-stream';
    if (config.allowedTypes.length > 0 && !config.allowedTypes.some(type => fileType.includes(type))) {
      return {
        success: false,
        error: `Tipo de archivo no permitido. Tipos válidos: ${config.allowedTypes.join(', ')}`,
      };
    }

    // Construir path del archivo
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const pathParts = [timestamp];
    
    if (options.agenciaId) pathParts.unshift(`agencia-${options.agenciaId}`);
    if (options.prospectoId) pathParts.push(`prospecto-${options.prospectoId}`);
    if (options.vendedorId) pathParts.push(`vendedor-${options.vendedorId}`);
    
    const filePath = `${pathParts.join('/')}-${fileName}`;

    // Subir archivo
    const { data, error } = await supabaseAdmin.storage
      .from(config.bucket)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: options.replace || false,
        contentType: fileType,
      });

    if (error) {
      console.error('Error subiendo archivo:', error);
      return {
        success: false,
        error: `Error al subir archivo: ${error.message}`,
      };
    }

    // Generar URL pública o firmada
    let publicUrl: string;
    if (config.generateSignedUrl) {
      const { data: signedUrlData, error: urlError } = await supabaseAdmin.storage
        .from(config.bucket)
        .createSignedUrl(data.path, config.expirationHours * 3600);

      if (urlError) {
        console.error('Error generando URL firmada:', urlError);
        // Fallback a URL pública
        const { data: publicUrlData } = supabaseAdmin.storage
          .from(config.bucket)
          .getPublicUrl(data.path);
        publicUrl = publicUrlData.publicUrl;
      } else {
        publicUrl = signedUrlData.signedUrl;
      }
    } else {
      const { data: publicUrlData } = supabaseAdmin.storage
        .from(config.bucket)
        .getPublicUrl(data.path);
      publicUrl = publicUrlData.publicUrl;
    }

    return {
      success: true,
      url: publicUrl,
      path: data.path,
      metadata: {
        size: fileSize,
        type: fileType,
        lastModified: Date.now(),
      },
    };

  } catch (error) {
    console.error('Error en uploadFile:', error);
    return {
      success: false,
      error: `Error inesperado: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

/**
 * Descarga un archivo de Supabase Storage
 */
export async function downloadFile(
  filePath: string,
  category: 'audio' | 'documents' | 'reports' = 'audio'
): Promise<DownloadResult> {
  try {
    const config = STORAGE_CONFIGS[category];

    if (config.generateSignedUrl) {
      const { data, error } = await supabaseAdmin.storage
        .from(config.bucket)
        .createSignedUrl(filePath, config.expirationHours * 3600);

      if (error) {
        console.error('Error generando URL de descarga:', error);
        return {
          success: false,
          error: `Error al generar URL: ${error.message}`,
        };
      }

      return {
        success: true,
        url: data.signedUrl,
        expiresAt: new Date(Date.now() + config.expirationHours * 3600 * 1000),
      };
    } else {
      const { data } = supabaseAdmin.storage
        .from(config.bucket)
        .getPublicUrl(filePath);

      return {
        success: true,
        url: data.publicUrl,
      };
    }

  } catch (error) {
    console.error('Error en downloadFile:', error);
    return {
      success: false,
      error: `Error inesperado: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

/**
 * Elimina un archivo de Supabase Storage
 */
export async function deleteFile(
  filePath: string,
  category: 'audio' | 'documents' | 'reports' = 'audio'
): Promise<{ success: boolean; error?: string }> {
  try {
    const config = STORAGE_CONFIGS[category];

    const { error } = await supabaseAdmin.storage
      .from(config.bucket)
      .remove([filePath]);

    if (error) {
      console.error('Error eliminando archivo:', error);
      return {
        success: false,
        error: `Error al eliminar archivo: ${error.message}`,
      };
    }

    return { success: true };

  } catch (error) {
    console.error('Error en deleteFile:', error);
    return {
      success: false,
      error: `Error inesperado: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

/**
 * Lista archivos en un bucket
 */
export async function listFiles(
  category: 'audio' | 'documents' | 'reports' = 'audio',
  options: {
    prefix?: string;
    limit?: number;
    offset?: number;
  } = {}
): Promise<{
  success: boolean;
  files?: any[];
  error?: string;
}> {
  try {
    const config = STORAGE_CONFIGS[category];
    const { limit = 100, offset = 0, prefix } = options;

    const { data, error } = await supabaseAdmin.storage
      .from(config.bucket)
      .list(prefix, {
        limit,
        offset,
        sortBy: { column: 'created_at', order: 'desc' },
      });

    if (error) {
      console.error('Error listando archivos:', error);
      return {
        success: false,
        error: `Error al listar archivos: ${error.message}`,
      };
    }

    return {
      success: true,
      files: data || [],
    };

  } catch (error) {
    console.error('Error en listFiles:', error);
    return {
      success: false,
      error: `Error inesperado: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

/**
 * Obtiene información de un archivo
 */
export async function getFileInfo(
  filePath: string,
  category: 'audio' | 'documents' | 'reports' = 'audio'
): Promise<{
  success: boolean;
  info?: any;
  error?: string;
}> {
  try {
    const config = STORAGE_CONFIGS[category];

    const { data, error } = await supabaseAdmin.storage
      .from(config.bucket)
      .list('', {
        search: filePath.split('/').pop(),
      });

    if (error) {
      console.error('Error obteniendo info del archivo:', error);
      return {
        success: false,
        error: `Error al obtener información: ${error.message}`,
      };
    }

    const fileInfo = data?.find(file => filePath.endsWith(file.name));

    return {
      success: true,
      info: fileInfo,
    };

  } catch (error) {
    console.error('Error en getFileInfo:', error);
    return {
      success: false,
      error: `Error inesperado: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

/**
 * Inicializa los buckets necesarios
 */
export async function initializeBuckets(): Promise<{
  success: boolean;
  createdBuckets?: string[];
  error?: string;
}> {
  try {
    const createdBuckets: string[] = [];

    for (const [category, config] of Object.entries(STORAGE_CONFIGS)) {
      // Verificar si el bucket existe
      const { data: buckets, error: listError } = await supabaseAdmin.storage.listBuckets();
      
      if (listError) {
        console.error('Error listando buckets:', listError);
        continue;
      }

      const bucketExists = buckets?.some(bucket => bucket.name === config.bucket);

      if (!bucketExists) {
        // Crear bucket
        const { data, error: createError } = await supabaseAdmin.storage.createBucket(config.bucket, {
          public: false,
          fileSizeLimit: config.maxFileSize,
          allowedMimeTypes: config.allowedTypes,
        });

        if (createError) {
          console.error(`Error creando bucket ${config.bucket}:`, createError);
        } else {
          createdBuckets.push(config.bucket);
          console.log(`Bucket creado: ${config.bucket}`);
        }
      }
    }

    return {
      success: true,
      createdBuckets,
    };

  } catch (error) {
    console.error('Error en initializeBuckets:', error);
    return {
      success: false,
      error: `Error inesperado: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

/**
 * Limpia archivos antiguos (housekeeping)
 */
export async function cleanupOldFiles(
  category: 'audio' | 'documents' | 'reports' = 'audio',
  daysOld: number = 30
): Promise<{
  success: boolean;
  deletedCount?: number;
  error?: string;
}> {
  try {
    const config = STORAGE_CONFIGS[category];
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    // Listar todos los archivos
    const { data: files, error: listError } = await supabaseAdmin.storage
      .from(config.bucket)
      .list('', {
        sortBy: { column: 'created_at', order: 'asc' },
      });

    if (listError) {
      return {
        success: false,
        error: `Error al listar archivos: ${listError.message}`,
      };
    }

    // Filtrar archivos antiguos
    const oldFiles = files?.filter(file => 
      new Date(file.created_at) < cutoffDate
    ) || [];

    if (oldFiles.length === 0) {
      return {
        success: true,
        deletedCount: 0,
      };
    }

    // Eliminar archivos antiguos
    const filePaths = oldFiles.map(file => file.name);
    const { error: deleteError } = await supabaseAdmin.storage
      .from(config.bucket)
      .remove(filePaths);

    if (deleteError) {
      return {
        success: false,
        error: `Error al eliminar archivos: ${deleteError.message}`,
      };
    }

    return {
      success: true,
      deletedCount: oldFiles.length,
    };

  } catch (error) {
    console.error('Error en cleanupOldFiles:', error);
    return {
      success: false,
      error: `Error inesperado: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

/**
 * Obtiene estadísticas de uso del storage
 */
export async function getStorageStats(): Promise<{
  success: boolean;
  stats?: {
    [category: string]: {
      fileCount: number;
      totalSize: number;
      oldestFile?: string;
      newestFile?: string;
    };
  };
  error?: string;
}> {
  try {
    const stats: any = {};

    for (const [category, config] of Object.entries(STORAGE_CONFIGS)) {
      const { data: files, error } = await supabaseAdmin.storage
        .from(config.bucket)
        .list('', {
          sortBy: { column: 'created_at', order: 'desc' },
        });

      if (error) {
        console.error(`Error obteniendo stats para ${category}:`, error);
        continue;
      }

      const fileCount = files?.length || 0;
      const totalSize = files?.reduce((sum, file) => sum + (file.metadata?.size || 0), 0) || 0;
      const oldestFile = files?.[files.length - 1]?.name;
      const newestFile = files?.[0]?.name;

      stats[category] = {
        fileCount,
        totalSize,
        oldestFile,
        newestFile,
      };
    }

    return {
      success: true,
      stats,
    };

  } catch (error) {
    console.error('Error en getStorageStats:', error);
    return {
      success: false,
      error: `Error inesperado: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}
