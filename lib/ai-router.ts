
/**
 * Router inteligente de IA que selecciona el mejor proveedor
 * basado en el tier de servicio de la agencia y disponibilidad
 */

import { AI_PROVIDERS, getAvailableProviders, ChatMessage, ChatResponse } from './ai-providers';
import { chatCompletion } from './ai-providers';

export interface AgencyTier {
  tier: 'BASICO' | 'PROFESIONAL' | 'PREMIUM';
  preferredProviders: string[];
  fallbackProviders: string[];
  maxCostPerOperation: number;
}

export const TIER_CONFIG: Record<string, AgencyTier> = {
  BASICO: {
    tier: 'BASICO',
    preferredProviders: ['deepseek', 'qwen'], // Proveedores más económicos
    fallbackProviders: ['openai'],
    maxCostPerOperation: 0.10, // $0.10 USD máximo por operación
  },
  PROFESIONAL: {
    tier: 'PROFESIONAL', 
    preferredProviders: ['deepseek', 'openai'], // Balance costo-calidad
    fallbackProviders: ['anthropic', 'qwen'],
    maxCostPerOperation: 0.25, // $0.25 USD máximo por operación
  },
  PREMIUM: {
    tier: 'PREMIUM',
    preferredProviders: ['anthropic', 'openai'], // Mejor calidad
    fallbackProviders: ['deepseek'],
    maxCostPerOperation: 1.00, // $1.00 USD máximo por operación
  },
};

export interface ProviderSelectionResult {
  provider: string;
  reason: string;
  estimatedCost: number;
  tier: string;
}

/**
 * Selecciona el mejor proveedor basado en el tier y disponibilidad
 */
export function selectBestProvider(
  tier: string,
  operation: 'chat' | 'transcription',
  estimatedTokens: number = 1000
): ProviderSelectionResult {
  const config = TIER_CONFIG[tier] || TIER_CONFIG.BASICO;
  const availableProviders = getAvailableProviders();

  // Para transcripción, solo OpenAI está disponible por ahora
  if (operation === 'transcription') {
    if (availableProviders.includes('openai')) {
      return {
        provider: 'openai',
        reason: 'Único proveedor disponible para transcripción (Whisper)',
        estimatedCost: estimatedTokens * 0.006 / 60, // Aproximación para audio
        tier,
      };
    }
    throw new Error('No hay proveedores disponibles para transcripción');
  }

  // Para chat, intentar proveedores preferidos primero
  for (const provider of config.preferredProviders) {
    if (availableProviders.includes(provider)) {
      const aiProvider = AI_PROVIDERS[provider];
      const estimatedCost = (estimatedTokens * aiProvider.costs.inputPer1k / 1000) +
                           (estimatedTokens * 0.5 * aiProvider.costs.outputPer1k / 1000); // Asumimos respuesta 50% del input

      if (estimatedCost <= config.maxCostPerOperation) {
        return {
          provider,
          reason: `Proveedor preferido para tier ${tier}`,
          estimatedCost,
          tier,
        };
      }
    }
  }

  // Si no hay proveedores preferidos disponibles, usar fallbacks
  for (const provider of config.fallbackProviders) {
    if (availableProviders.includes(provider)) {
      const aiProvider = AI_PROVIDERS[provider];
      const estimatedCost = (estimatedTokens * aiProvider.costs.inputPer1k / 1000) +
                           (estimatedTokens * 0.5 * aiProvider.costs.outputPer1k / 1000);

      if (estimatedCost <= config.maxCostPerOperation) {
        return {
          provider,
          reason: `Proveedor de respaldo para tier ${tier}`,
          estimatedCost,
          tier,
        };
      }
    }
  }

  // Si todo falla, usar el más económico disponible
  const cheapestProvider = availableProviders.sort((a, b) => {
    const costA = AI_PROVIDERS[a].costs.inputPer1k + AI_PROVIDERS[a].costs.outputPer1k;
    const costB = AI_PROVIDERS[b].costs.inputPer1k + AI_PROVIDERS[b].costs.outputPer1k;
    return costA - costB;
  })[0];

  if (cheapestProvider) {
    const aiProvider = AI_PROVIDERS[cheapestProvider];
    const estimatedCost = (estimatedTokens * aiProvider.costs.inputPer1k / 1000) +
                         (estimatedTokens * 0.5 * aiProvider.costs.outputPer1k / 1000);

    return {
      provider: cheapestProvider,
      reason: 'Proveedor más económico disponible (failover)',
      estimatedCost,
      tier,
    };
  }

  throw new Error('No hay proveedores de IA disponibles');
}

/**
 * Ejecuta chat completion con failover automático
 */
export async function smartChatCompletion(
  messages: ChatMessage[],
  tier: string,
  options: {
    temperature?: number;
    maxTokens?: number;
    stream?: boolean;
  } = {}
): Promise<ChatResponse & { providerInfo: ProviderSelectionResult }> {
  const estimatedTokens = messages.reduce((total, msg) => total + msg.content.length / 4, 0);
  
  let attempts = 0;
  const maxAttempts = 3;
  let lastError: Error | null = null;

  while (attempts < maxAttempts) {
    try {
      const selection = selectBestProvider(tier, 'chat', estimatedTokens);
      console.log(`Intento ${attempts + 1}: Usando proveedor ${selection.provider} - ${selection.reason}`);
      
      const response = await chatCompletion(selection.provider, messages, options);
      
      return {
        ...response,
        providerInfo: selection,
      };
    } catch (error) {
      console.error(`Error en intento ${attempts + 1}:`, error);
      lastError = error as Error;
      attempts++;
      
      // Si no es el último intento, esperar un poco antes del siguiente
      if (attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 1000 * attempts));
      }
    }
  }

  throw new Error(`Todos los intentos fallaron. Último error: ${lastError?.message}`);
}

/**
 * Obtiene estadísticas de uso por proveedor
 */
export interface ProviderStats {
  provider: string;
  totalRequests: number;
  totalCost: number;
  averageResponseTime: number;
  successRate: number;
  lastUsed: Date;
}

const providerStats: Record<string, ProviderStats> = {};

/**
 * Registra el uso de un proveedor para estadísticas
 */
export function recordProviderUsage(
  provider: string,
  cost: number,
  responseTime: number,
  success: boolean
) {
  if (!providerStats[provider]) {
    providerStats[provider] = {
      provider,
      totalRequests: 0,
      totalCost: 0,
      averageResponseTime: 0,
      successRate: 0,
      lastUsed: new Date(),
    };
  }

  const stats = providerStats[provider];
  stats.totalRequests++;
  stats.totalCost += cost;
  stats.averageResponseTime = (stats.averageResponseTime + responseTime) / 2;
  stats.successRate = success ? 
    (stats.successRate * (stats.totalRequests - 1) + 1) / stats.totalRequests :
    (stats.successRate * (stats.totalRequests - 1)) / stats.totalRequests;
  stats.lastUsed = new Date();
}

/**
 * Obtiene estadísticas de todos los proveedores
 */
export function getProviderStats(): ProviderStats[] {
  return Object.values(providerStats);
}

/**
 * Recomienda el mejor proveedor basado en estadísticas históricas
 */
export function recommendProvider(tier: string): string {
  const config = TIER_CONFIG[tier] || TIER_CONFIG.BASICO;
  const stats = getProviderStats();
  
  // Filtrar por proveedores disponibles y del tier
  const availableStats = stats.filter(s => 
    [...config.preferredProviders, ...config.fallbackProviders].includes(s.provider) &&
    getAvailableProviders().includes(s.provider)
  );

  if (availableStats.length === 0) {
    return selectBestProvider(tier, 'chat').provider;
  }

  // Ordenar por una combinación de success rate y cost efficiency
  const recommended = availableStats.sort((a, b) => {
    const scoreA = (a.successRate * 0.7) + ((1 / a.totalCost) * 0.3);
    const scoreB = (b.successRate * 0.7) + ((1 / b.totalCost) * 0.3);
    return scoreB - scoreA;
  })[0];

  return recommended.provider;
}

/**
 * Verifica si un proveedor está disponible y configurado
 */
export function isProviderAvailable(provider: string): boolean {
  return getAvailableProviders().includes(provider);
}

/**
 * Obtiene la configuración del tier
 */
export function getTierConfig(tier: string): AgencyTier {
  return TIER_CONFIG[tier] || TIER_CONFIG.BASICO;
}
