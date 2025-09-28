
import { TipoRol } from '@prisma/client';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      email: string;
      nombre: string;
      apellido?: string;
      rol: TipoRol;
      activo: boolean;
      agenciaId?: number;
      marcaId?: number;
      grupoId?: number;
      cargaProspectos?: number;
    };
  }

  interface User {
    id: string;
    email: string;
    nombre: string;
    apellido?: string;
    rol: TipoRol;
    activo: boolean;
    agenciaId?: number;
    marcaId?: number;
    grupoId?: number;
    cargaProspectos?: number;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    user: {
      id: string;
      email: string;
      nombre: string;
      apellido?: string;
      rol: TipoRol;
      activo: boolean;
      agenciaId?: number;
      marcaId?: number;
      grupoId?: number;
      cargaProspectos?: number;
    };
  }
}
