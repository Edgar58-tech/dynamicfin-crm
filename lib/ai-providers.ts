
/**
 * Configuración y manejo de múltiples proveedores de IA
 * Soporta DeepSeek, OpenAI, Anthropic Claude, y Qwen
 */

export interface AIProvider {
  name: string;
  baseURL: string;
  apiKey: string;
  models: {
    chat: string;
    transcription?: string;
  };
  costs: {
    inputPer1k: number;
    outputPer1k: number;
    transcriptionPerMinute?: number;
  };
  maxTokens: number;
  supportsTranscription: boolean;
  reliability: number; // 1-10, para failover
}

export const AI_PROVIDERS: Record<string, AIProvider> = {
  deepseek: {
    name: 'DeepSeek',
    baseURL: process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com/v1',
    apiKey: process.env.DEEPSEEK_API_KEY || '',
    models: {
      chat: 'deepseek-chat',
    },
    costs: {
      inputPer1k: parseFloat(process.env.COST_DEEPSEEK_INPUT_PER_1K || '0.0014'),
      outputPer1k: parseFloat(process.env.COST_DEEPSEEK_OUTPUT_PER_1K || '0.0028'),
    },
    maxTokens: 8192,
    supportsTranscription: false,
    reliability: 8,
  },
  
  openai: {
    name: 'OpenAI',
    baseURL: process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1',
    apiKey: process.env.OPENAI_API_KEY || '',
    models: {
      chat: 'gpt-4o-mini',
      transcription: 'whisper-1',
    },
    costs: {
      inputPer1k: parseFloat(process.env.COST_OPENAI_GPT4_INPUT_PER_1K || '0.03'),
      outputPer1k: parseFloat(process.env.COST_OPENAI_GPT4_OUTPUT_PER_1K || '0.06'),
      transcriptionPerMinute: parseFloat(process.env.COST_OPENAI_WHISPER_PER_MINUTE || '0.006'),
    },
    maxTokens: 16384,
    supportsTranscription: true,
    reliability: 9,
  },
  
  anthropic: {
    name: 'Anthropic Claude',
    baseURL: process.env.ANTHROPIC_BASE_URL || 'https://api.anthropic.com',
    apiKey: process.env.ANTHROPIC_API_KEY || '',
    models: {
      chat: 'claude-3-5-haiku-20241022',
    },
    costs: {
      inputPer1k: parseFloat(process.env.COST_ANTHROPIC_INPUT_PER_1K || '0.015'),
      outputPer1k: parseFloat(process.env.COST_ANTHROPIC_OUTPUT_PER_1K || '0.075'),
    },
    maxTokens: 8192,
    supportsTranscription: false,
    reliability: 9,
  },
  
  qwen: {
    name: 'Qwen',
    baseURL: process.env.QWEN_BASE_URL || 'https://dashscope.aliyuncs.com/api/v1',
    apiKey: process.env.QWEN_API_KEY || '',
    models: {
      chat: 'qwen-turbo',
    },
    costs: {
      inputPer1k: 0.001, // Muy económico
      outputPer1k: 0.002,
    },
    maxTokens: 8192,
    supportsTranscription: false,
    reliability: 7,
  },
};

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface ChatResponse {
  content: string;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  cost: number;
  provider: string;
}

export interface TranscriptionResponse {
  text: string;
  cost: number;
  duration: number;
  provider: string;
}

/**
 * Realiza chat completion usando el proveedor especificado
 */
export async function chatCompletion(
  provider: string,
  messages: ChatMessage[],
  options: {
    temperature?: number;
    maxTokens?: number;
    stream?: boolean;
  } = {}
): Promise<ChatResponse> {
  const aiProvider = AI_PROVIDERS[provider];
  if (!aiProvider) {
    throw new Error(`Proveedor de IA no soportado: ${provider}`);
  }

  if (!aiProvider.apiKey) {
    throw new Error(`API Key no configurada para ${aiProvider.name}`);
  }

  const {
    temperature = 0.7,
    maxTokens = aiProvider.maxTokens,
    stream = false,
  } = options;

  try {
    // Configuración específica por proveedor
    if (provider === 'anthropic') {
      return await claudeChatCompletion(aiProvider, messages, { temperature, maxTokens, stream });
    } else if (provider === 'qwen') {
      return await qwenChatCompletion(aiProvider, messages, { temperature, maxTokens, stream });
    } else {
      // OpenAI-compatible (DeepSeek, OpenAI)
      return await openaiCompatibleChat(aiProvider, messages, { temperature, maxTokens, stream });
    }
  } catch (error) {
    console.error(`Error en chat completion con ${provider}:`, error);
    throw error;
  }
}

/**
 * Realiza transcripción usando OpenAI Whisper
 */
export async function transcribeAudio(
  audioBuffer: Buffer,
  filename: string,
  language: string = 'es'
): Promise<TranscriptionResponse> {
  const provider = AI_PROVIDERS.openai;
  
  if (!provider.apiKey) {
    throw new Error('OpenAI API Key no configurada para transcripción');
  }

  try {
    const formData = new FormData();
    formData.append('file', new Blob([audioBuffer]), filename);
    formData.append('model', provider.models.transcription || 'whisper-1');
    formData.append('language', language);
    formData.append('response_format', 'json');

    const response = await fetch(`${provider.baseURL}/audio/transcriptions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${provider.apiKey}`,
      },
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Error en transcripción: ${response.statusText}`);
    }

    const result = await response.json();
    
    // Calcular duración aproximada basada en el tamaño del archivo
    const durationMinutes = Math.ceil(audioBuffer.length / (1024 * 1024 * 0.5)); // Aproximación
    const cost = durationMinutes * (provider.costs.transcriptionPerMinute || 0.006);

    return {
      text: result.text,
      cost,
      duration: durationMinutes,
      provider: 'openai',
    };
  } catch (error) {
    console.error('Error en transcripción:', error);
    throw error;
  }
}

/**
 * OpenAI-compatible chat completion (DeepSeek, OpenAI)
 */
async function openaiCompatibleChat(
  provider: AIProvider,
  messages: ChatMessage[],
  options: any
): Promise<ChatResponse> {
  const response = await fetch(`${provider.baseURL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${provider.apiKey}`,
    },
    body: JSON.stringify({
      model: provider.models.chat,
      messages,
      temperature: options.temperature,
      max_tokens: options.maxTokens,
      stream: options.stream,
    }),
  });

  if (!response.ok) {
    throw new Error(`Error ${response.status}: ${response.statusText}`);
  }

  const result = await response.json();
  const usage = result.usage;
  const cost = (usage.prompt_tokens * provider.costs.inputPer1k / 1000) +
               (usage.completion_tokens * provider.costs.outputPer1k / 1000);

  return {
    content: result.choices[0].message.content,
    usage: {
      promptTokens: usage.prompt_tokens,
      completionTokens: usage.completion_tokens,
      totalTokens: usage.total_tokens,
    },
    cost,
    provider: provider.name,
  };
}

/**
 * Anthropic Claude chat completion
 */
async function claudeChatCompletion(
  provider: AIProvider,
  messages: ChatMessage[],
  options: any
): Promise<ChatResponse> {
  const response = await fetch(`${provider.baseURL}/v1/messages`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': provider.apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: provider.models.chat,
      messages: messages.filter(m => m.role !== 'system'),
      system: messages.find(m => m.role === 'system')?.content,
      max_tokens: options.maxTokens,
      temperature: options.temperature,
    }),
  });

  if (!response.ok) {
    throw new Error(`Error ${response.status}: ${response.statusText}`);
  }

  const result = await response.json();
  const usage = result.usage;
  const cost = (usage.input_tokens * provider.costs.inputPer1k / 1000) +
               (usage.output_tokens * provider.costs.outputPer1k / 1000);

  return {
    content: result.content[0].text,
    usage: {
      promptTokens: usage.input_tokens,
      completionTokens: usage.output_tokens,
      totalTokens: usage.input_tokens + usage.output_tokens,
    },
    cost,
    provider: provider.name,
  };
}

/**
 * Qwen chat completion
 */
async function qwenChatCompletion(
  provider: AIProvider,
  messages: ChatMessage[],
  options: any
): Promise<ChatResponse> {
  const response = await fetch(`${provider.baseURL}/services/aigc/text-generation/generation`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${provider.apiKey}`,
    },
    body: JSON.stringify({
      model: provider.models.chat,
      input: {
        messages,
      },
      parameters: {
        temperature: options.temperature,
        max_tokens: options.maxTokens,
      },
    }),
  });

  if (!response.ok) {
    throw new Error(`Error ${response.status}: ${response.statusText}`);
  }

  const result = await response.json();
  const usage = result.usage;
  const cost = (usage.input_tokens * provider.costs.inputPer1k / 1000) +
               (usage.output_tokens * provider.costs.outputPer1k / 1000);

  return {
    content: result.output.text,
    usage: {
      promptTokens: usage.input_tokens,
      completionTokens: usage.output_tokens,
      totalTokens: usage.total_tokens,
    },
    cost,
    provider: provider.name,
  };
}

/**
 * Calcula el costo estimado de una operación
 */
export function estimateCost(
  provider: string,
  operation: 'chat' | 'transcription',
  inputTokens: number = 0,
  outputTokens: number = 0,
  durationMinutes: number = 0
): number {
  const aiProvider = AI_PROVIDERS[provider];
  if (!aiProvider) return 0;

  if (operation === 'chat') {
    return (inputTokens * aiProvider.costs.inputPer1k / 1000) +
           (outputTokens * aiProvider.costs.outputPer1k / 1000);
  } else if (operation === 'transcription' && aiProvider.costs.transcriptionPerMinute) {
    return durationMinutes * aiProvider.costs.transcriptionPerMinute;
  }

  return 0;
}

/**
 * Obtiene la lista de proveedores disponibles
 */
export function getAvailableProviders(): string[] {
  return Object.keys(AI_PROVIDERS).filter(provider => AI_PROVIDERS[provider].apiKey);
}

/**
 * Obtiene el mejor proveedor para transcripción
 */
export function getBestTranscriptionProvider(): string {
  const providers = getAvailableProviders();
  const transcriptionProviders = providers.filter(p => AI_PROVIDERS[p].supportsTranscription);
  
  if (transcriptionProviders.includes('openai')) {
    return 'openai'; // OpenAI Whisper es el mejor para transcripción
  }
  
  throw new Error('No hay proveedores disponibles para transcripción');
}
