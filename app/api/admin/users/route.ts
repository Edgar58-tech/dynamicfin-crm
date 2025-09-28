import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { PrismaClient, TipoRol, TipoRolValues } from '@/lib/prisma-types';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Solo super admins pueden acceder
    if (session.user.rol !== 'DYNAMICFIN_ADMIN') {
      return NextResponse.json({ error: 'Permisos insuficientes' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const agenciaId = searchParams.get('agenciaId');
    const rol = searchParams.get('rol');

    switch (action) {
      case 'list':
        const filters: any = { activo: true };
        if (agenciaId) filters.agenciaId = parseInt(agenciaId);
        if (rol) filters.rol = rol as TipoRol;

        const usuarios = await prisma.user.findMany({
          where: filters,
          include: {
            agencia: {
              select: {
                nombreAgencia: true,
                marca: {
                  select: { nombreMarca: true }
                }
              }
            },
            marca: {
              select: { nombreMarca: true }
            },
            grupo: {
              select: { nombreGrupo: true }
            }
          },
          orderBy: [
            { rol: 'asc' },
            { nombre: 'asc' }
          ]
        });

        return NextResponse.json({ success: true, usuarios });

      case 'agencies':
        const agencias = await prisma.agencia.findMany({
          where: { activo: true },
          include: {
            marca: {
              select: { nombreMarca: true }
            }
          },
          orderBy: { nombreAgencia: 'asc' }
        });

        return NextResponse.json({ success: true, agencias });

      case 'marcas':
        const marcas = await prisma.marca.findMany({
          where: { activo: true },
          include: {
            grupo: {
              select: { nombreGrupo: true }
            }
          },
          orderBy: { nombreMarca: 'asc' }
        });

        return NextResponse.json({ success: true, marcas });

      case 'grupos':
        const grupos = await prisma.grupoAutomotriz.findMany({
          where: { activo: true },
          orderBy: { nombreGrupo: 'asc' }
        });

        return NextResponse.json({ success: true, grupos });

      case 'stats':
        const stats = await prisma.user.groupBy({
          by: ['rol'],
          where: { activo: true },
          _count: { id: true }
        });

        const totalUsuarios = await prisma.user.count({ where: { activo: true } });
        const usuariosInactivos = await prisma.user.count({ where: { activo: false } });

        return NextResponse.json({ 
          success: true, 
          stats: {
            totalUsuarios,
            usuariosInactivos,
            porRol: stats.reduce((acc: any, stat: any) => {
              acc[stat.rol] = stat._count.id;
              return acc;
            }, {} as Record<string, number>)
          }
        });

      default:
        return NextResponse.json({ error: 'Acción no válida' }, { status: 400 });
    }

  } catch (error) {
    console.error('Error in admin users API:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Solo super admins pueden crear usuarios
    if (session.user.rol !== 'DYNAMICFIN_ADMIN') {
      return NextResponse.json({ error: 'Permisos insuficientes' }, { status: 403 });
    }

    const body = await request.json();
    const { action } = body;

    switch (action) {
      case 'create':
        const {
          email,
          nombre,
          apellido,
          password,
          rol,
          agenciaId,
          marcaId,
          grupoId
        } = body;

        // Validaciones
        if (!email || !nombre || !password || !rol) {
          return NextResponse.json({ 
            error: 'Campos requeridos: email, nombre, password, rol' 
          }, { status: 400 });
        }

        // Verificar que el email no exista
        const existingUser = await prisma.user.findUnique({
          where: { email }
        });

        if (existingUser) {
          return NextResponse.json({ 
            error: 'Ya existe un usuario con este email' 
          }, { status: 400 });
        }

        // Validar rol
        if (!Object.values(TipoRolValues).includes(rol)) {
          return NextResponse.json({ 
            error: 'Rol no válido' 
          }, { status: 400 });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 12);

        // Crear usuario
        const nuevoUsuario = await prisma.user.create({
          data: {
            email,
            name: `${nombre} ${apellido || ''}`.trim(),
            nombre,
            apellido: apellido || null,
            password: hashedPassword,
            rol: rol as TipoRol,
            agenciaId: agenciaId ? parseInt(agenciaId) : null,
            marcaId: marcaId ? parseInt(marcaId) : null,
            grupoId: grupoId ? parseInt(grupoId) : null,
            activo: true,
          },
          include: {
            agencia: {
              select: {
                nombreAgencia: true,
                marca: { select: { nombreMarca: true } }
              }
            },
            marca: { select: { nombreMarca: true } },
            grupo: { select: { nombreGrupo: true } }
          }
        });

        // Crear alerta de nuevo usuario
        await prisma.alertaSistema.create({
          data: {
            usuarioId: session.user.id,
            tipoAlerta: 'usuario_creado',
            prioridad: 'media',
            titulo: 'Nuevo Usuario Creado',
            mensaje: `Se creó el usuario ${nuevoUsuario.nombre} (${nuevoUsuario.email}) con rol ${nuevoUsuario.rol}`,
            datos: JSON.stringify({
              usuarioCreado: nuevoUsuario.id,
              email: nuevoUsuario.email,
              rol: nuevoUsuario.rol,
              creadoPor: session.user.id
            })
          }
        });

        return NextResponse.json({ 
          success: true, 
          usuario: nuevoUsuario,
          message: 'Usuario creado exitosamente'
        });

      case 'update':
        const { userId, updateData } = body;

        if (!userId) {
          return NextResponse.json({ error: 'ID de usuario requerido' }, { status: 400 });
        }

        // No permitir actualizar super admins (excepto por otros super admins)
        const targetUser = await prisma.user.findUnique({
          where: { id: userId }
        });

        if (!targetUser) {
          return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
        }

        if (targetUser.rol === 'DYNAMICFIN_ADMIN' && session.user.id !== userId) {
          return NextResponse.json({ 
            error: 'No se pueden modificar otros super administradores' 
          }, { status: 403 });
        }

        // Preparar datos de actualización
        const dataToUpdate: any = {};
        
        if (updateData.nombre) dataToUpdate.nombre = updateData.nombre;
        if (updateData.apellido !== undefined) dataToUpdate.apellido = updateData.apellido;
        if (updateData.email) {
          // Verificar que el nuevo email no exista
          const emailExists = await prisma.user.findFirst({
            where: { 
              email: updateData.email,
              id: { not: userId }
            }
          });
          if (emailExists) {
            return NextResponse.json({ 
              error: 'El email ya está en uso por otro usuario' 
            }, { status: 400 });
          }
          dataToUpdate.email = updateData.email;
        }
        if (updateData.rol && Object.values(TipoRolValues).includes(updateData.rol)) {
          dataToUpdate.rol = updateData.rol;
        }
        if (updateData.agenciaId !== undefined) {
          dataToUpdate.agenciaId = updateData.agenciaId ? parseInt(updateData.agenciaId) : null;
        }
        if (updateData.marcaId !== undefined) {
          dataToUpdate.marcaId = updateData.marcaId ? parseInt(updateData.marcaId) : null;
        }
        if (updateData.grupoId !== undefined) {
          dataToUpdate.grupoId = updateData.grupoId ? parseInt(updateData.grupoId) : null;
        }
        if (updateData.activo !== undefined) {
          dataToUpdate.activo = updateData.activo;
        }

        // Hash nueva password si se proporciona
        if (updateData.password) {
          dataToUpdate.password = await bcrypt.hash(updateData.password, 12);
        }

        // Actualizar name si se cambió nombre o apellido
        if (updateData.nombre || updateData.apellido !== undefined) {
          const nombre = updateData.nombre || targetUser.nombre;
          const apellido = updateData.apellido !== undefined ? updateData.apellido : targetUser.apellido;
          dataToUpdate.name = `${nombre} ${apellido || ''}`.trim();
        }

        const usuarioActualizado = await prisma.user.update({
          where: { id: userId },
          data: dataToUpdate,
          include: {
            agencia: {
              select: {
                nombreAgencia: true,
                marca: { select: { nombreMarca: true } }
              }
            },
            marca: { select: { nombreMarca: true } },
            grupo: { select: { nombreGrupo: true } }
          }
        });

        return NextResponse.json({ 
          success: true, 
          usuario: usuarioActualizado,
          message: 'Usuario actualizado exitosamente'
        });

      case 'deactivate':
        const { userId: deactivateUserId, reason } = body;

        if (!deactivateUserId) {
          return NextResponse.json({ error: 'ID de usuario requerido' }, { status: 400 });
        }

        // No permitir desactivar super admins
        const userToDeactivate = await prisma.user.findUnique({
          where: { id: deactivateUserId }
        });

        if (!userToDeactivate) {
          return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
        }

        if (userToDeactivate.rol === 'DYNAMICFIN_ADMIN') {
          return NextResponse.json({ 
            error: 'No se pueden desactivar super administradores' 
          }, { status: 403 });
        }

        await prisma.user.update({
          where: { id: deactivateUserId },
          data: { activo: false }
        });

        // Crear alerta de desactivación
        await prisma.alertaSistema.create({
          data: {
            usuarioId: session.user.id,
            tipoAlerta: 'usuario_desactivado',
            prioridad: 'media',
            titulo: 'Usuario Desactivado',
            mensaje: `Se desactivó el usuario ${userToDeactivate.nombre} (${userToDeactivate.email})`,
            datos: JSON.stringify({
              usuarioDesactivado: deactivateUserId,
              reason: reason || 'Sin motivo especificado',
              desactivadoPor: session.user.id
            })
          }
        });

        return NextResponse.json({ 
          success: true,
          message: 'Usuario desactivado exitosamente'
        });

      case 'bulk-create':
        const { usuarios } = body;

        if (!Array.isArray(usuarios) || usuarios.length === 0) {
          return NextResponse.json({ 
            error: 'Se requiere un array de usuarios' 
          }, { status: 400 });
        }

        const resultados = {
          creados: 0,
          errores: [] as string[]
        };

        for (const userData of usuarios) {
          try {
            const { email, nombre, apellido, password, rol, agenciaId, marcaId, grupoId } = userData;

            // Validaciones básicas
            if (!email || !nombre || !password || !rol) {
              resultados.errores.push(`Usuario ${email || 'sin email'}: Faltan campos requeridos`);
              continue;
            }

            // Verificar email único
            const existingUser = await prisma.user.findUnique({
              where: { email }
            });

            if (existingUser) {
              resultados.errores.push(`Usuario ${email}: Email ya existe`);
              continue;
            }

            // Crear usuario
            const hashedPassword = await bcrypt.hash(password, 12);
            
            await prisma.user.create({
              data: {
                email,
                name: `${nombre} ${apellido || ''}`.trim(),
                nombre,
                apellido: apellido || null,
                password: hashedPassword,
                rol: rol as TipoRol,
                agenciaId: agenciaId ? parseInt(agenciaId) : null,
                marcaId: marcaId ? parseInt(marcaId) : null,
                grupoId: grupoId ? parseInt(grupoId) : null,
                activo: true,
              }
            });

            resultados.creados++;

          } catch (error) {
            resultados.errores.push(`Usuario ${userData.email || 'desconocido'}: ${error}`);
          }
        }

        return NextResponse.json({ 
          success: true, 
          resultados,
          message: `Proceso completado: ${resultados.creados} usuarios creados, ${resultados.errores.length} errores`
        });

      default:
        return NextResponse.json({ error: 'Acción no válida' }, { status: 400 });
    }

  } catch (error) {
    console.error('Error in admin users POST API:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
