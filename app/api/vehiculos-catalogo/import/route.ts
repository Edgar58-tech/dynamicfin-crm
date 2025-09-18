
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { TipoRol } from '@prisma/client';
import * as XLSX from 'xlsx';

interface VehiculoImport {
  marca: string;
  modelo: string;
  year: number;
}

// POST - Importar vehículos desde Excel
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    const allowedRoles: TipoRol[] = [TipoRol.GERENTE_GENERAL, TipoRol.GERENTE_VENTAS, TipoRol.DYNAMICFIN_ADMIN];
    if (!session?.user || !allowedRoles.includes(session.user.rol as TipoRol)) {
      return NextResponse.json({ error: 'Sin permisos suficientes' }, { status: 403 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No se proporcionó archivo' }, { status: 400 });
    }

    // Validar tipo de archivo
    const validExtensions = ['.xlsx', '.xls', '.csv'];
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
    
    if (!validExtensions.includes(fileExtension)) {
      return NextResponse.json({ error: 'Tipo de archivo no soportado. Use Excel (.xlsx, .xls) o CSV (.csv)' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    let vehiculosImport: VehiculoImport[] = [];

    try {
      if (fileExtension === '.csv') {
        // Procesar CSV
        const csvData = new TextDecoder().decode(arrayBuffer);
        const lines = csvData.split('\n');
        const headers = lines[0].split(',').map(h => h.trim().toLowerCase());

        // Buscar las columnas necesarias
        const marcaIndex = headers.findIndex(h => h.includes('marca'));
        const modeloIndex = headers.findIndex(h => h.includes('modelo'));
        const yearIndex = headers.findIndex(h => h.includes('año') || h.includes('year'));

        if (marcaIndex === -1 || modeloIndex === -1 || yearIndex === -1) {
          return NextResponse.json({ 
            error: 'El archivo CSV debe contener columnas: marca, modelo, año/year' 
          }, { status: 400 });
        }

        for (let i = 1; i < lines.length; i++) {
          const line = lines[i].trim();
          if (line) {
            const values = line.split(',').map(v => v.trim().replace(/"/g, ''));
            vehiculosImport.push({
              marca: values[marcaIndex] || '',
              modelo: values[modeloIndex] || '',
              year: parseInt(values[yearIndex]) || 0
            });
          }
        }
      } else {
        // Procesar Excel
        const workbook = XLSX.read(arrayBuffer, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

        if (data.length < 2) {
          return NextResponse.json({ error: 'El archivo Excel debe contener al menos una fila de encabezados y una de datos' }, { status: 400 });
        }

        const headers = (data[0] as any[]).map(h => h?.toString().trim().toLowerCase() || '');
        const marcaIndex = headers.findIndex(h => h.includes('marca'));
        const modeloIndex = headers.findIndex(h => h.includes('modelo'));
        const yearIndex = headers.findIndex(h => h.includes('año') || h.includes('year'));

        if (marcaIndex === -1 || modeloIndex === -1 || yearIndex === -1) {
          return NextResponse.json({ 
            error: 'El archivo Excel debe contener columnas: marca, modelo, año/year' 
          }, { status: 400 });
        }

        for (let i = 1; i < data.length; i++) {
          const row = data[i] as any[];
          if (row && row.length > 0) {
            vehiculosImport.push({
              marca: row[marcaIndex]?.toString().trim() || '',
              modelo: row[modeloIndex]?.toString().trim() || '',
              year: parseInt(row[yearIndex]?.toString()) || 0
            });
          }
        }
      }

      // Validar y limpiar datos
      const vehiculosValidos: VehiculoImport[] = [];
      const errores: string[] = [];
      const currentYear = new Date().getFullYear();

      vehiculosImport.forEach((vehiculo, index) => {
        const lineNumber = index + 2; // +2 porque el index inicia en 0 y la primera línea son headers
        
        if (!vehiculo.marca) {
          errores.push(`Línea ${lineNumber}: Marca es requerida`);
          return;
        }
        
        if (!vehiculo.modelo) {
          errores.push(`Línea ${lineNumber}: Modelo es requerido`);
          return;
        }
        
        if (!vehiculo.year || vehiculo.year < 2000 || vehiculo.year > currentYear + 2) {
          errores.push(`Línea ${lineNumber}: Año debe estar entre 2000 y ${currentYear + 2}`);
          return;
        }

        vehiculosValidos.push({
          marca: vehiculo.marca.trim(),
          modelo: vehiculo.modelo.trim(),
          year: vehiculo.year
        });
      });

      if (errores.length > 0) {
        return NextResponse.json({ 
          error: 'Errores de validación encontrados', 
          errores: errores.slice(0, 10) // Limitar a 10 errores para no saturar la respuesta
        }, { status: 400 });
      }

      // Verificar duplicados y crear vehículos
      const vehiculosCreados: any[] = [];
      const vehiculosExistentes: string[] = [];

      for (const vehiculo of vehiculosValidos) {
        const existing = await prisma.vehiculoCatalogo.findFirst({
          where: {
            marca: vehiculo.marca,
            modelo: vehiculo.modelo,
            year: vehiculo.year
          }
        });

        if (existing) {
          vehiculosExistentes.push(`${vehiculo.marca} ${vehiculo.modelo} ${vehiculo.year}`);
        } else {
          const nuevoVehiculo = await prisma.vehiculoCatalogo.create({
            data: {
              marca: vehiculo.marca,
              modelo: vehiculo.modelo,
              year: vehiculo.year,
              activo: true
            }
          });
          vehiculosCreados.push(nuevoVehiculo);
        }
      }

      return NextResponse.json({
        message: 'Importación completada exitosamente',
        resumen: {
          totalProcesados: vehiculosValidos.length,
          vehiculosCreados: vehiculosCreados.length,
          vehiculosExistentes: vehiculosExistentes.length
        },
        vehiculosCreados,
        vehiculosExistentes: vehiculosExistentes.slice(0, 10) // Limitar para evitar respuestas muy grandes
      });

    } catch (parseError) {
      console.error('Error parsing file:', parseError);
      return NextResponse.json({ error: 'Error al procesar el archivo. Verifique el formato.' }, { status: 400 });
    }

  } catch (error) {
    console.error('Error importing vehicles:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
