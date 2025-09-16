
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
