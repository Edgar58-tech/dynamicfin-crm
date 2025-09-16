
'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  FileText,
  Download,
  Calendar,
  BarChart3,
  PieChart,
  TrendingUp,
  FileSpreadsheet,
  Mail,
  Clock
} from 'lucide-react';
import { motion } from 'framer-motion';

interface Reporte {
  id: number;
  nombre: string;
  tipo: string;
  descripcion: string;
  frecuencia: string;
  ultimaGeneracion: string;
  estatus: string;
  tamano: string;
  formato: string;
}

export default function ReportesPage() {
  const { data: session, status } = useSession();
  const [reportes, setReportes] = useState<Reporte[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPeriodo, setSelectedPeriodo] = useState('mes_actual');
  const [selectedFormato, setSelectedFormato] = useState('pdf');

  useEffect(() => {
    // Datos simulados de reportes
    const sampleData: Reporte[] = [
      {
        id: 1,
        nombre: 'Reporte Mensual de Ventas',
        tipo: 'Ventas',
        descripcion: 'Análisis completo de ventas, metas y cumplimiento por agencia',
        frecuencia: 'Mensual',
        ultimaGeneracion: '2025-09-01',
        estatus: 'Disponible',
        tamano: '2.3 MB',
        formato: 'PDF'
      },
      {
        id: 2,
        nombre: 'Análisis SPPC - Clasificación de Prospectos',
        tipo: 'SPPC',
        descripcion: 'Distribución de prospectos por clasificación y recomendaciones',
        frecuencia: 'Semanal',
        ultimaGeneracion: '2025-09-08',
        estatus: 'Disponible',
        tamano: '1.8 MB',
        formato: 'PDF'
      },
      {
        id: 3,
        nombre: 'Reporte de Carga de Trabajo',
        tipo: 'Operativo',
        descripcion: 'Análisis de distribución de prospectos por vendedor',
        frecuencia: 'Semanal',
        ultimaGeneracion: '2025-09-08',
        estatus: 'Disponible',
        tamano: '1.2 MB',
        formato: 'Excel'
      },
      {
        id: 4,
        nombre: 'Reporte Financiero Consolidado',
        tipo: 'Financiero',
        descripcion: 'Utilidades, márgenes y análisis financiero por grupo',
        frecuencia: 'Mensual',
        ultimaGeneracion: '2025-09-01',
        estatus: 'Disponible',
        tamano: '3.1 MB',
        formato: 'PDF'
      },
      {
        id: 5,
        nombre: 'Dashboard Ejecutivo',
        tipo: 'Ejecutivo',
        descripcion: 'KPIs principales y métricas de alto nivel',
        frecuencia: 'Diario',
        ultimaGeneracion: '2025-09-09',
        estatus: 'Procesando',
        tamano: '--',
        formato: 'PDF'
      },
      {
        id: 6,
        nombre: 'Análisis de Inventario',
        tipo: 'Inventario',
        descripcion: 'Estado de inventario, rotación y disponibilidad',
        frecuencia: 'Semanal',
        ultimaGeneracion: '2025-09-08',
        estatus: 'Disponible',
        tamano: '900 KB',
        formato: 'Excel'
      }
    ];
    
    setTimeout(() => {
      setReportes(sampleData);
      setLoading(false);
    }, 500);
  }, []);

  const getTipoColor = (tipo: string) => {
    switch (tipo) {
      case 'Ventas':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'SPPC':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'Operativo':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'Financiero':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'Ejecutivo':
        return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      case 'Inventario':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getEstatusColor = (estatus: string) => {
    switch (estatus) {
      case 'Disponible':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'Procesando':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'Error':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getFormatoIcon = (formato: string) => {
    switch (formato) {
      case 'PDF':
        return <FileText className="w-4 h-4" />;
      case 'Excel':
        return <FileSpreadsheet className="w-4 h-4" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  const handleGenerarReporte = (reporteId: number) => {
    alert(`✅ Función: Generar Reporte - Generando reporte ID: ${reporteId}\n\nConfiguración:\n• Período: ${selectedPeriodo}\n• Formato: ${selectedFormato}\n\nEl reporte estará disponible en 3-5 minutos.`);
  };

  const handleDescargarReporte = (reporteId: number) => {
    alert(`✅ Función: Descargar Reporte - Descargando reporte ID: ${reporteId}\n\nEl archivo se descargará automáticamente a tu carpeta de descargas.`);
    // Simular descarga
    setTimeout(() => {
      alert('✅ Descarga completada!');
    }, 1500);
  };

  const handleEnviarReporte = (reporteId: number) => {
    const email = prompt('Ingrese email de destino:');
    if (email) {
      alert(`✅ Función: Enviar Reporte - Reporte ID: ${reporteId} enviado a: ${email}\n\nEl reporte se enviará en formato PDF con todos los datos actualizados.`);
    }
  };

  const reportesDisponibles = reportes.filter(r => r.estatus === 'Disponible').length;
  const reportesProcesando = reportes.filter(r => r.estatus === 'Procesando').length;

  if (status === 'loading' || loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-slate-200 rounded w-48 animate-pulse"></div>
        <div className="grid gap-4">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-24 bg-slate-200 rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Centro de Reportes</h1>
          <p className="text-slate-600 mt-2">Genera y descarga reportes analíticos del sistema</p>
        </div>
        <div className="flex gap-2">
          <Select value={selectedPeriodo} onValueChange={setSelectedPeriodo}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Seleccionar período" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="mes_actual">Mes Actual</SelectItem>
              <SelectItem value="mes_anterior">Mes Anterior</SelectItem>
              <SelectItem value="trimestre">Trimestre Actual</SelectItem>
              <SelectItem value="año">Año Actual</SelectItem>
              <SelectItem value="personalizado">Período Personalizado</SelectItem>
            </SelectContent>
          </Select>
          <Select value={selectedFormato} onValueChange={setSelectedFormato}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Formato" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pdf">PDF</SelectItem>
              <SelectItem value="excel">Excel</SelectItem>
              <SelectItem value="csv">CSV</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Estadísticas Rápidas */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <FileText className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{reportesDisponibles}</p>
                <p className="text-sm text-slate-600">Disponibles</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                <Clock className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{reportesProcesando}</p>
                <p className="text-sm text-slate-600">Procesando</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">24</p>
                <p className="text-sm text-slate-600">Este Mes</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">156</p>
                <p className="text-sm text-slate-600">Total Generados</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lista de Reportes */}
      <div className="grid gap-4">
        {reportes.map((reporte, index) => (
          <motion.div
            key={reporte.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.05 }}
          >
            <Card className="hover:shadow-md transition-shadow duration-200">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="flex items-center gap-2">
                        {getFormatoIcon(reporte.formato)}
                        <h3 className="text-lg font-semibold text-slate-900">
                          {reporte.nombre}
                        </h3>
                      </div>
                      <Badge className={getTipoColor(reporte.tipo)}>
                        {reporte.tipo}
                      </Badge>
                      <Badge className={getEstatusColor(reporte.estatus)}>
                        {reporte.estatus}
                      </Badge>
                    </div>
                    
                    <p className="text-slate-600 mb-4">{reporte.descripcion}</p>
                    
                    <div className="grid md:grid-cols-4 gap-4 text-sm text-slate-500">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        <span>Frecuencia: {reporte.frecuencia}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        <span>Último: {new Date(reporte.ultimaGeneracion).toLocaleDateString('es-ES')}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4" />
                        <span>Formato: {reporte.formato}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Download className="w-4 h-4" />
                        <span>Tamaño: {reporte.tamano}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex flex-col gap-2">
                    {reporte.estatus === 'Disponible' && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleDescargarReporte(reporte.id)}
                      >
                        <Download className="w-4 h-4 mr-1" />
                        Descargar
                      </Button>
                    )}
                    <Button 
                      size="sm" 
                      className="bg-blue-600 hover:bg-blue-700"
                      onClick={() => handleGenerarReporte(reporte.id)}
                      disabled={reporte.estatus === 'Procesando'}
                    >
                      <BarChart3 className="w-4 h-4 mr-1" />
                      {reporte.estatus === 'Procesando' ? 'Procesando...' : 'Generar'}
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleEnviarReporte(reporte.id)}
                    >
                      <Mail className="w-4 h-4 mr-1" />
                      Enviar
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
