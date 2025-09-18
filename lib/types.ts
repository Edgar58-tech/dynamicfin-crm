
import { TipoRol } from '@prisma/client';
import { DefaultSession } from 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      rol: TipoRol;
      agenciaId?: number | null;
      marcaId?: number | null;
      grupoId?: number | null;
      agencia?: any;
      marca?: any;
      grupo?: any;
      nombre: string;
      apellido?: string | null;
    } & DefaultSession['user'];
  }

  interface User {
    rol: TipoRol;
    agenciaId?: number | null;
    marcaId?: number | null;
    grupoId?: number | null;
    agencia?: any;
    marca?: any;
    grupo?: any;
    nombre: string;
    apellido?: string | null;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    rol: TipoRol;
    agenciaId?: number | null;
    marcaId?: number | null;
    grupoId?: number | null;
    agencia?: any;
    marca?: any;
    grupo?: any;
    nombre: string;
    apellido?: string | null;
  }
}

// SPPC Classification Types
export type ClasificacionSPPC = 'Elite' | 'Calificado' | 'A Madurar' | 'Explorador';

export interface SPPCScore {
  total: number;
  clasificacion: ClasificacionSPPC;
  calificaciones: {
    pilarId: number;
    nombrePilar: string;
    puntaje: number;
    pesoEstrategico: number;
  }[];
}

export interface DashboardKPIs {
  optimizaciones: number;
  utilidadPromedio: number;
  metaMensual: number;
  vendedoresActivos: number;
  tasaConversion: number;
  prospectosProcesados: number;
}

export interface ProspectoSummary {
  elite: number;
  calificado: number;
  amadurar: number;
  explorador: number;
  total: number;
}

// Centro de Leads Types
export type OrigenLead = 'LLAMADA_ENTRANTE' | 'VISITA_SHOWROOM' | 'OTROS';
export type EstadoAsignacion = 'PENDIENTE' | 'ASIGNADO' | 'CONTACTADO';
export type EstadoProspecto = 'Nuevo' | 'PENDIENTE_CALIFICACION' | 'Contactado' | 'Calificado' | 'Perdido' | 'Vendido';
export type NivelUrgencia = 'BAJA' | 'MEDIA' | 'ALTA';
export type TipoDesbalance = 'CARGA_ALTA' | 'CARGA_DESIGUAL' | 'VENDEDOR_SOBRECARGADO';
export type EstadoAlerta = 'ACTIVA' | 'EN_PROCESO' | 'RESUELTA' | 'IGNORADA';

// Pendientes de Calificación Types
export type AlertaTiempoPendiente = 'NORMAL' | 'AMARILLA' | 'NARANJA' | 'ROJA';

export interface ProspectoPendienteCalificacion {
  id: number;
  nombre: string;
  apellido?: string;
  telefono?: string;
  email?: string;
  vehiculoInteres?: string;
  origenLead?: string;
  fechaAsignacion?: Date;
  horasEspera?: number;
  nivelUrgencia?: NivelUrgencia;
  alertaTiempo: AlertaTiempoPendiente;
  coordinadorNombre?: string;
  observaciones?: string;
}

export interface VendedorGuardiaInfo {
  id: string;
  nombre: string;
  apellido?: string;
  cargaActual: number;
  metaDelDia: number;
  activo: boolean;
  horaInicio: string;
  horaFin: string;
}

export interface EstadisticasCentroLeads {
  llamadasHoy: number;
  visitasHoy: number;
  prospectsGenerados: number;
  vendedoresGuardia: number;
  promedioAsignacion: number; // en minutos
}

export interface AlertaDesbalanceInfo {
  tipoDesbalance: TipoDesbalance;
  vendedorAfectado?: {
    id: string;
    nombre: string;
    carga: number;
  };
  diferenciaDetectada: number;
  sugerenciaAccion: string;
  fechaDeteccion: Date;
}

export interface AsignacionLeadRequest {
  prospectoId: number;
  vendedorId: string;
  prioridad: 'BAJA' | 'NORMAL' | 'ALTA' | 'URGENTE';
  metodo: 'BALANCEADO' | 'MANUAL' | 'URGENTE';
  observaciones?: string;
}
