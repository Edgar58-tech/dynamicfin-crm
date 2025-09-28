
// Re-exportar todos los tipos de Prisma para resolver problemas de resolución de módulos
export type {
  TipoRol,
  ZonaProximidad, 
  RolePlayScenario,
  User,
  Prospecto,
  Agencia,
  GrupoAutomotriz,
  Marca,
  Pilar,
  Calificacion,
  Interaccion,
  VehiculoCatalogo,
  Vehiculo,
  MetricaVenta,
  GrabacionConversacion,
  AsignacionLead,
  VendedorGuardia,
  CrmConfiguration,
  CrmFieldMapping,
  CrmSyncLog
} from '@prisma/client';

export { PrismaClient } from '@prisma/client';

// Enum values para fácil acceso
export const TipoRolValues = {
  DIRECTOR_GENERAL: 'DIRECTOR_GENERAL',
  DIRECTOR_MARCA: 'DIRECTOR_MARCA', 
  GERENTE_GENERAL: 'GERENTE_GENERAL',
  GERENTE_VENTAS: 'GERENTE_VENTAS',
  VENDEDOR: 'VENDEDOR',
  COORDINADOR_LEADS: 'COORDINADOR_LEADS',
  CENTRO_LEADS: 'CENTRO_LEADS',
  MARKETING_DIGITAL: 'MARKETING_DIGITAL',
  TELEMARKETING: 'TELEMARKETING',
  DYNAMICFIN_ADMIN: 'DYNAMICFIN_ADMIN'
} as const;
