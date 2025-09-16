
import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { PrismaAdapter } from '@next-auth/prisma-adapter';
import { prisma } from '@/lib/db';
import bcrypt from 'bcryptjs';
import { TipoRol } from '@prisma/client';

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        try {
          const user = await prisma.user.findUnique({
            where: { 
              email: credentials.email,
              activo: true,
            },
            include: {
              agencia: {
                include: {
                  marca: {
                    include: {
                      grupo: true,
                    },
                  },
                },
              },
              marca: {
                include: {
                  grupo: true,
                },
              },
              grupo: true,
            },
          });

          if (!user) {
            return null;
          }

          const isPasswordValid = await bcrypt.compare(credentials.password, user.password);
          
          if (!isPasswordValid) {
            return null;
          }

          return {
            id: user.id,
            email: user.email,
            name: user.name || `${user.nombre} ${user.apellido || ''}`.trim(),
            nombre: user.nombre,
            apellido: user.apellido,
            rol: user.rol,
            agenciaId: user.agenciaId,
            marcaId: user.marcaId,
            grupoId: user.grupoId,
            agencia: user.agencia,
            marca: user.marca,
            grupo: user.grupo,
          };
        } catch (error) {
          console.error('Authentication error:', error);
          return null;
        }
      },
    }),
  ],
  session: {
    strategy: 'jwt',
    maxAge: 24 * 60 * 60, // 24 hours
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.rol = user.rol;
        token.agenciaId = user.agenciaId;
        token.marcaId = user.marcaId;
        token.grupoId = user.grupoId;
        token.agencia = user.agencia;
        token.marca = user.marca;
        token.grupo = user.grupo;
        token.nombre = user.nombre;
        token.apellido = user.apellido;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.sub as string;
        session.user.rol = token.rol as TipoRol;
        session.user.agenciaId = token.agenciaId as number;
        session.user.marcaId = token.marcaId as number;
        session.user.grupoId = token.grupoId as number;
        session.user.agencia = token.agencia as any;
        session.user.marca = token.marca as any;
        session.user.grupo = token.grupo as any;
        session.user.nombre = token.nombre as string;
        session.user.apellido = token.apellido as string;
      }
      return session;
    },
  },
  pages: {
    signIn: '/auth/login',
    error: '/auth/error',
  },
  secret: process.env.NEXTAUTH_SECRET,
};
