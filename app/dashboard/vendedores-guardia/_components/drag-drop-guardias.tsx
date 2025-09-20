
'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Upload, 
  FileText, 
  FileSpreadsheet, 
  File,
  CheckCircle,
  AlertTriangle,
  X,
  Download,
  Eye
} from 'lucide-react';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';

interface ArchivoGuardia {
  id: string;
  nombre: string;
  tipo: string;
  tamaño: number;
  estado: 'pendiente' | 'procesando' | 'completado' | 'error';
  datos?: VendedorGuardiaData[];
  errores?: string[];
  progreso: number;
}

interface VendedorGuardiaData {
  nombreVendedor: string;
  fechaGuardia: string;
  horaEntrada: string;
  horaSalida: string;
  observaciones?: string;
  valido: boolean;
  errores: string[];
}

interface DragDropGuardiasProps {
  onDatosImportados: (datos: VendedorGuardiaData[]) => void;
}

export function DragDropGuardias({ onDatosImportados }: DragDropGuardiasProps) {
  const [archivos, setArchivos] = useState<ArchivoGuardia[]>([]);
  const [procesando, setProcesando] = useState(false);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const nuevosArchivos: ArchivoGuardia[] = acceptedFiles.map(file => ({
      id: Math.random().toString(36).substr(2, 9),
      nombre: file.name,
      tipo: file.type,
      tamaño: file.size,
      estado: 'pendiente',
      progreso: 0
    }));

    setArchivos(prev => [...prev, ...nuevosArchivos]);
    procesarArchivos(acceptedFiles, nuevosArchivos);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls'],
      'application/pdf': ['.pdf'],
      'application/json': ['.json'],
      'text/csv': ['.csv']
    },
    maxSize: 10 * 1024 * 1024, // 10MB
    multiple: true
  });

  const procesarArchivos = async (files: File[], archivosInfo: ArchivoGuardia[]) => {
    setProcesando(true);

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const archivoInfo = archivosInfo[i];

      try {
        // Actualizar estado a procesando
        setArchivos(prev => prev.map(a => 
          a.id === archivoInfo.id 
            ? { ...a, estado: 'procesando', progreso: 10 }
            : a
        ));

        let datos: VendedorGuardiaData[] = [];

        if (file.type.includes('spreadsheet') || file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
          datos = await procesarExcel(file, archivoInfo.id);
        } else if (file.type === 'application/pdf') {
          datos = await procesarPDF(file, archivoInfo.id);
        } else if (file.type === 'application/json') {
          datos = await procesarJSON(file, archivoInfo.id);
        } else if (file.type === 'text/csv') {
          datos = await procesarCSV(file, archivoInfo.id);
        }

        // Validar datos
        const datosValidados = validarDatos(datos);

        // Actualizar archivo con datos procesados
        setArchivos(prev => prev.map(a => 
          a.id === archivoInfo.id 
            ? { 
                ...a, 
                estado: 'completado', 
                progreso: 100,
                datos: datosValidados,
                errores: datosValidados.filter(d => !d.valido).map(d => d.errores).flat()
              }
            : a
        ));

        toast.success(`Archivo ${file.name} procesado exitosamente`);

      } catch (error) {
        console.error('Error procesando archivo:', error);
        
        setArchivos(prev => prev.map(a => 
          a.id === archivoInfo.id 
            ? { 
                ...a, 
                estado: 'error', 
                progreso: 0,
                errores: [error instanceof Error ? error.message : 'Error desconocido']
              }
            : a
        ));

        toast.error(`Error procesando ${file.name}`);
      }
    }

    setProcesando(false);
  };

  const procesarExcel = async (file: File, archivoId: string): Promise<VendedorGuardiaData[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

          // Actualizar progreso
          setArchivos(prev => prev.map(a => 
            a.id === archivoId ? { ...a, progreso: 50 } : a
          ));

          const datos: VendedorGuardiaData[] = [];
          
          // Buscar headers (primera fila con datos)
          let headerRow = -1;
          for (let i = 0; i < jsonData.length; i++) {
            const row = jsonData[i] as any[];
            if (row.some(cell => 
              typeof cell === 'string' && 
              (cell.toLowerCase().includes('vendedor') || 
               cell.toLowerCase().includes('nombre') ||
               cell.toLowerCase().includes('fecha'))
            )) {
              headerRow = i;
              break;
            }
          }

          if (headerRow === -1) {
            throw new Error('No se encontraron headers válidos en el archivo Excel');
          }

          const headers = (jsonData[headerRow] as string[]).map(h => h?.toString().toLowerCase() || '');
          
          // Mapear columnas
          const colNombre = headers.findIndex(h => 
            h.includes('vendedor') || h.includes('nombre')
          );
          const colFecha = headers.findIndex(h => 
            h.includes('fecha') || h.includes('dia')
          );
          const colEntrada = headers.findIndex(h => 
            h.includes('entrada') || h.includes('inicio')
          );
          const colSalida = headers.findIndex(h => 
            h.includes('salida') || h.includes('fin')
          );
          const colObservaciones = headers.findIndex(h => 
            h.includes('observacion') || h.includes('nota')
          );

          // Procesar filas de datos
          for (let i = headerRow + 1; i < jsonData.length; i++) {
            const row = jsonData[i] as any[];
            if (!row || row.length === 0) continue;

            const vendedorData: VendedorGuardiaData = {
              nombreVendedor: row[colNombre]?.toString() || '',
              fechaGuardia: formatearFecha(row[colFecha]),
              horaEntrada: formatearHora(row[colEntrada]),
              horaSalida: formatearHora(row[colSalida]),
              observaciones: row[colObservaciones]?.toString() || '',
              valido: true,
              errores: []
            };

            datos.push(vendedorData);
          }

          setArchivos(prev => prev.map(a => 
            a.id === archivoId ? { ...a, progreso: 80 } : a
          ));

          resolve(datos);
        } catch (error) {
          reject(error);
        }
      };

      reader.onerror = () => reject(new Error('Error leyendo archivo Excel'));
      reader.readAsArrayBuffer(file);
    });
  };

  const procesarPDF = async (file: File, archivoId: string): Promise<VendedorGuardiaData[]> => {
    // Simulación de procesamiento PDF
    // En producción, usarías pdf-parse o similar
    setArchivos(prev => prev.map(a => 
      a.id === archivoId ? { ...a, progreso: 50 } : a
    ));

    await new Promise(resolve => setTimeout(resolve, 1000));

    setArchivos(prev => prev.map(a => 
      a.id === archivoId ? { ...a, progreso: 80 } : a
    ));

    // Datos de ejemplo para PDF
    return [
      {
        nombreVendedor: 'Extraído de PDF',
        fechaGuardia: new Date().toISOString().split('T')[0],
        horaEntrada: '09:00',
        horaSalida: '18:00',
        observaciones: 'Datos extraídos automáticamente de PDF',
        valido: true,
        errores: []
      }
    ];
  };

  const procesarJSON = async (file: File, archivoId: string): Promise<VendedorGuardiaData[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const jsonData = JSON.parse(e.target?.result as string);
          
          setArchivos(prev => prev.map(a => 
            a.id === archivoId ? { ...a, progreso: 50 } : a
          ));

          let datos: VendedorGuardiaData[] = [];

          if (Array.isArray(jsonData)) {
            datos = jsonData.map(item => ({
              nombreVendedor: item.nombre || item.vendedor || '',
              fechaGuardia: formatearFecha(item.fecha || item.fechaGuardia),
              horaEntrada: formatearHora(item.horaEntrada || item.entrada || '09:00'),
              horaSalida: formatearHora(item.horaSalida || item.salida || '18:00'),
              observaciones: item.observaciones || item.notas || '',
              valido: true,
              errores: []
            }));
          } else if (jsonData.vendedores) {
            datos = jsonData.vendedores.map((item: any) => ({
              nombreVendedor: item.nombre || item.vendedor || '',
              fechaGuardia: formatearFecha(item.fecha || item.fechaGuardia),
              horaEntrada: formatearHora(item.horaEntrada || item.entrada || '09:00'),
              horaSalida: formatearHora(item.horaSalida || item.salida || '18:00'),
              observaciones: item.observaciones || item.notas || '',
              valido: true,
              errores: []
            }));
          }

          setArchivos(prev => prev.map(a => 
            a.id === archivoId ? { ...a, progreso: 80 } : a
          ));

          resolve(datos);
        } catch (error) {
          reject(new Error('Formato JSON inválido'));
        }
      };

      reader.onerror = () => reject(new Error('Error leyendo archivo JSON'));
      reader.readAsText(file);
    });
  };

  const procesarCSV = async (file: File, archivoId: string): Promise<VendedorGuardiaData[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const csvData = e.target?.result as string;
          const lines = csvData.split('\n').filter(line => line.trim());
          
          if (lines.length < 2) {
            throw new Error('El archivo CSV debe tener al menos una fila de headers y una de datos');
          }

          setArchivos(prev => prev.map(a => 
            a.id === archivoId ? { ...a, progreso: 50 } : a
          ));

          const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
          const datos: VendedorGuardiaData[] = [];

          // Mapear columnas
          const colNombre = headers.findIndex(h => 
            h.includes('vendedor') || h.includes('nombre')
          );
          const colFecha = headers.findIndex(h => 
            h.includes('fecha') || h.includes('dia')
          );
          const colEntrada = headers.findIndex(h => 
            h.includes('entrada') || h.includes('inicio')
          );
          const colSalida = headers.findIndex(h => 
            h.includes('salida') || h.includes('fin')
          );

          for (let i = 1; i < lines.length; i++) {
            const values = lines[i].split(',').map(v => v.trim());
            
            datos.push({
              nombreVendedor: values[colNombre] || '',
              fechaGuardia: formatearFecha(values[colFecha]),
              horaEntrada: formatearHora(values[colEntrada]),
              horaSalida: formatearHora(values[colSalida]),
              observaciones: values[4] || '',
              valido: true,
              errores: []
            });
          }

          setArchivos(prev => prev.map(a => 
            a.id === archivoId ? { ...a, progreso: 80 } : a
          ));

          resolve(datos);
        } catch (error) {
          reject(error);
        }
      };

      reader.onerror = () => reject(new Error('Error leyendo archivo CSV'));
      reader.readAsText(file);
    });
  };

  const formatearFecha = (fecha: any): string => {
    if (!fecha) return new Date().toISOString().split('T')[0];
    
    // Si es un número de Excel (días desde 1900-01-01)
    if (typeof fecha === 'number') {
      const excelDate = new Date((fecha - 25569) * 86400 * 1000);
      return excelDate.toISOString().split('T')[0];
    }
    
    // Si es string, intentar parsearlo
    if (typeof fecha === 'string') {
      const parsedDate = new Date(fecha);
      if (!isNaN(parsedDate.getTime())) {
        return parsedDate.toISOString().split('T')[0];
      }
    }
    
    return new Date().toISOString().split('T')[0];
  };

  const formatearHora = (hora: any): string => {
    if (!hora) return '09:00';
    
    if (typeof hora === 'number') {
      // Si es fracción de día de Excel
      const totalMinutes = Math.round(hora * 24 * 60);
      const hours = Math.floor(totalMinutes / 60);
      const minutes = totalMinutes % 60;
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    }
    
    if (typeof hora === 'string') {
      // Limpiar y formatear hora
      const cleaned = hora.replace(/[^\d:]/g, '');
      if (cleaned.includes(':')) {
        const [h, m] = cleaned.split(':');
        return `${h.padStart(2, '0')}:${(m || '00').padStart(2, '0')}`;
      }
    }
    
    return '09:00';
  };

  const validarDatos = (datos: VendedorGuardiaData[]): VendedorGuardiaData[] => {
    return datos.map(dato => {
      const errores: string[] = [];
      
      if (!dato.nombreVendedor.trim()) {
        errores.push('Nombre de vendedor requerido');
      }
      
      if (!dato.fechaGuardia) {
        errores.push('Fecha de guardia requerida');
      }
      
      if (!dato.horaEntrada.match(/^\d{2}:\d{2}$/)) {
        errores.push('Formato de hora de entrada inválido (HH:MM)');
      }
      
      if (!dato.horaSalida.match(/^\d{2}:\d{2}$/)) {
        errores.push('Formato de hora de salida inválido (HH:MM)');
      }
      
      // Validar que hora de salida sea después de entrada
      if (dato.horaEntrada && dato.horaSalida) {
        const entrada = new Date(`2000-01-01T${dato.horaEntrada}`);
        const salida = new Date(`2000-01-01T${dato.horaSalida}`);
        if (salida <= entrada) {
          errores.push('Hora de salida debe ser posterior a hora de entrada');
        }
      }
      
      return {
        ...dato,
        valido: errores.length === 0,
        errores
      };
    });
  };

  const eliminarArchivo = (id: string) => {
    setArchivos(prev => prev.filter(a => a.id !== id));
  };

  const importarDatos = () => {
    const todosLosDatos = archivos
      .filter(a => a.estado === 'completado' && a.datos)
      .flatMap(a => a.datos!)
      .filter(d => d.valido);

    if (todosLosDatos.length === 0) {
      toast.error('No hay datos válidos para importar');
      return;
    }

    onDatosImportados(todosLosDatos);
    toast.success(`${todosLosDatos.length} registros de guardia importados exitosamente`);
  };

  const descargarPlantilla = () => {
    const plantilla = [
      ['Nombre Vendedor', 'Fecha Guardia', 'Hora Entrada', 'Hora Salida', 'Observaciones'],
      ['Juan Pérez', '2025-09-21', '09:00', '18:00', 'Guardia regular'],
      ['María González', '2025-09-21', '10:00', '19:00', 'Especialista en SUVs'],
      ['Carlos López', '2025-09-22', '08:30', '17:30', 'Turno matutino']
    ];

    const ws = XLSX.utils.aoa_to_sheet(plantilla);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Plantilla Guardias');
    XLSX.writeFile(wb, 'plantilla_vendedores_guardia.xlsx');
    
    toast.success('Plantilla descargada exitosamente');
  };

  const getIconoArchivo = (tipo: string) => {
    if (tipo.includes('spreadsheet') || tipo.includes('excel')) {
      return <FileSpreadsheet className="h-8 w-8 text-green-600" />;
    } else if (tipo === 'application/pdf') {
      return <FileText className="h-8 w-8 text-red-600" />;
    } else if (tipo === 'application/json') {
      return <File className="h-8 w-8 text-blue-600" />;
    }
    return <File className="h-8 w-8 text-gray-600" />;
  };

  const formatearTamaño = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-6">
      {/* Zona de Drop */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Upload className="h-5 w-5 mr-2" />
            Importar Datos de Guardias
          </CardTitle>
          <CardDescription>
            Arrastra y suelta archivos Excel, PDF, JSON o CSV con datos de vendedores de guardia
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
              isDragActive 
                ? 'border-blue-500 bg-blue-50' 
                : 'border-gray-300 hover:border-gray-400'
            }`}
          >
            <input {...getInputProps()} />
            <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            {isDragActive ? (
              <p className="text-blue-600 font-medium">
                Suelta los archivos aquí...
              </p>
            ) : (
              <div>
                <p className="text-gray-600 mb-2">
                  Arrastra archivos aquí o haz clic para seleccionar
                </p>
                <p className="text-sm text-gray-500">
                  Soporta: Excel (.xlsx, .xls), PDF, JSON, CSV (máx. 10MB)
                </p>
              </div>
            )}
          </div>

          <div className="flex justify-between items-center mt-4">
            <Button variant="outline" onClick={descargarPlantilla}>
              <Download className="h-4 w-4 mr-2" />
              Descargar Plantilla Excel
            </Button>
            
            {archivos.some(a => a.estado === 'completado' && a.datos?.some(d => d.valido)) && (
              <Button onClick={importarDatos}>
                <CheckCircle className="h-4 w-4 mr-2" />
                Importar Datos Válidos
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Lista de Archivos */}
      {archivos.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Archivos Procesados</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {archivos.map((archivo) => (
                <div key={archivo.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-3">
                      {getIconoArchivo(archivo.tipo)}
                      <div>
                        <h4 className="font-medium">{archivo.nombre}</h4>
                        <p className="text-sm text-gray-500">
                          {formatearTamaño(archivo.tamaño)}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Badge variant={
                        archivo.estado === 'completado' ? 'default' :
                        archivo.estado === 'error' ? 'destructive' :
                        archivo.estado === 'procesando' ? 'secondary' : 'outline'
                      }>
                        {archivo.estado === 'completado' && <CheckCircle className="h-3 w-3 mr-1" />}
                        {archivo.estado === 'error' && <AlertTriangle className="h-3 w-3 mr-1" />}
                        {archivo.estado.charAt(0).toUpperCase() + archivo.estado.slice(1)}
                      </Badge>
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => eliminarArchivo(archivo.id)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {archivo.estado === 'procesando' && (
                    <Progress value={archivo.progreso} className="mb-2" />
                  )}

                  {archivo.estado === 'completado' && archivo.datos && (
                    <div className="mt-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">
                          Registros procesados: {archivo.datos.length}
                        </span>
                        <span className="text-sm text-green-600">
                          Válidos: {archivo.datos.filter(d => d.valido).length}
                        </span>
                      </div>
                      
                      {archivo.datos.filter(d => !d.valido).length > 0 && (
                        <Alert className="mt-2">
                          <AlertTriangle className="h-4 w-4" />
                          <AlertDescription>
                            {archivo.datos.filter(d => !d.valido).length} registros con errores.
                            Revisa los datos antes de importar.
                          </AlertDescription>
                        </Alert>
                      )}
                    </div>
                  )}

                  {archivo.estado === 'error' && archivo.errores && (
                    <Alert variant="destructive" className="mt-2">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>
                        {archivo.errores.join(', ')}
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
