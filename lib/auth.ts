import { NextAuthOptions, Session } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { prisma } from '@/lib/db';
import bcrypt from 'bcryptjs';
import { TipoRol } from '@prisma/client';

interface ExtendedUser {
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

// Types are declared in lib/types.ts to avoid conflicts

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        try {
          if (!credentials?.email || !credentials?.password) {
            return null;
          }

          const user = await prisma.user.findUnique({
            where: { email: credentials.email },
            select: {
              id: true,
              email: true,
              password: true,
              nombre: true,
              apellido: true,
              rol: true,
              activo: true,
              agenciaId: true,
              marcaId: true,
              grupoId: true,
              cargaProspectos: true,
            }
          });

          if (!user || !user.activo) {
            return null;
          }

          const isValidPassword = await bcrypt.compare(credentials.password, user.password);
          
          if (!isValidPassword) {
            return null;
          }

          return {
            id: user.id,
            email: user.email,
            nombre: user.nombre,
            apellido: user.apellido,
            rol: user.rol,
            activo: user.activo,
            agenciaId: user.agenciaId,
            marcaId: user.marcaId,
            grupoId: user.grupoId,
            cargaProspectos: user.cargaProspectos,
          };
        } catch (error) {
          console.error('Auth error:', error);
          return null;
        }
      }
    })
  ],
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.user = user as ExtendedUser;
      }
      return token;
    },
    async session({ session, token }) {
      if (token.user) {
        session.user = {
          ...session.user,
          ...token.user
        };
      }
      return session;
    }
  },
  pages: {
    signIn: '/auth/login',
    error: '/auth/error'
  },
  secret: process.env.NEXTAUTH_SECRET,
};
