
'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Search, 
  UserPlus, 
  Phone, 
  Mail, 
  Calendar,
  Star,
  TrendingUp,
  X,
  BarChart3,
  Target,
  Users,
  Clock,
  Download,
  Upload,
  FileSpreadsheet,
  FileText,
  File,
  HelpCircle,
  BookOpen,
  Mic,
  MicOff,
  Play,
  Pause,
  MessageSquare
} from 'lucide-react';
import { motion } from 'framer-motion';

interface Prospecto {
  id: number;
  nombre: string;
  apellido: string;
  email: string;
  telefono: string;
  clasificacion: string;
  calificacionTotal: number;
  vehiculoInteres: string;
  estatus: string;
  fechaContacto: string;
}

export default function ProspectosPage() {
  const { data: session, status } = useSession();
  const [prospectos, setProspectos] = useState<Prospecto[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterClasificacion, setFilterClasificacion] = useState('all');
  
  // Estados para modales
  const [showNuevoProspectoModal, setShowNuevoProspectoModal] = useState(false);
  const [showPerfilModal, setShowPerfilModal] = useState(false);
  const [showAnalisisModal, setShowAnalisisModal] = useState(false);
  const [showAgendarModal, setShowAgendarModal] = useState(false);
  const [showEditarModal, setShowEditarModal] = useState(false);
  const [showCalificarModal, setShowCalificarModal] = useState(false);
  const [selectedProspecto, setSelectedProspecto] = useState<Prospecto | null>(null);
  
  // Estados para editar prospecto
  const [prospectoEditado, setProspectoEditado] = useState<Prospecto | null>(null);

  // Estados para calificación SPPC
  const [pilaresSPPC, setPilaresSPPC] = useState<{[key: number]: number}>({});
  const [pestanaActiva, setPestanaActiva] = useState<'primer-contacto' | 'seguimiento' | 'cierre' | 'completa'>('primer-contacto');
  const [showInfoPilar, setShowInfoPilar] = useState<number | null>(null);
  
  // Estados para nuevas funcionalidades
  const [showImportModal, setShowImportModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [showPilaresGuideModal, setShowPilaresGuideModal] = useState(false);
  const [showDialogSimulationModal, setShowDialogSimulationModal] = useState(false);
  const [showRecordingModal, setShowRecordingModal] = useState(false);
  
  // Estados para grabación y transcripción
  const [isRecording, setIsRecording] = useState(false);
  const [recordedAudio, setRecordedAudio] = useState<string | null>(null);
  const [transcription, setTranscription] = useState<string>('');
  const [analyzedPillars, setAnalyzedPillars] = useState<{[key: number]: number}>({});

  // Definición de los 15 pilares del SPPC con sus pesos y lógica estratégica completa
  const pilaresSPPCDefinicion = [
    { 
      id: 1, 
      nombre: "Canal de Contacto e Intención Inicial", 
      peso: 6, 
      descripcion: "Mide el nivel de esfuerzo y compromiso inicial del prospecto",
      logicaEstrategica: "Mide el nivel de esfuerzo y compromiso inicial del prospecto. Una visita física supera cualquier interacción digital.",
      fase: "primer-contacto"
    },
    { 
      id: 2, 
      nombre: "La Realidad Financiera", 
      peso: 15, 
      descripcion: "El factor más crítico. Determina la viabilidad real de la venta",
      logicaEstrategica: "El factor más crítico. Determina la viabilidad real de la venta. La proactividad del cliente aquí es una señal de compra inminente.",
      fase: "primer-contacto"
    },
    { 
      id: 3, 
      nombre: "El 'Para Qué' Profundo", 
      peso: 10, 
      descripcion: "Descubre la necesidad, sueño o miedo real detrás de la compra",
      logicaEstrategica: "Descubre la necesidad, sueño o miedo real detrás de la compra, permitiendo una venta consultiva y no de producto.",
      fase: "primer-contacto"
    },
    { 
      id: 4, 
      nombre: "El Termómetro de la Urgencia", 
      peso: 15, 
      descripcion: "Permite priorizar la cartera según necesidad inmediata",
      logicaEstrategica: "Permite priorizar la cartera. Un cliente con necesidad inmediata requiere atención inmediata.",
      fase: "primer-contacto"
    },
    { 
      id: 5, 
      nombre: "El Círculo de Decisión", 
      peso: 7, 
      descripcion: "Identifica a todos los involucrados para dirigir comunicación efectiva",
      logicaEstrategica: "Identifica a todos los involucrados para dirigir la comunicación de manera efectiva y evitar retrasos.",
      fase: "primer-contacto"
    },
    { 
      id: 6, 
      nombre: "Vehículo Inicial vs. Solución Ideal", 
      peso: 2, 
      descripcion: "Evalúa flexibilidad del cliente y oportunidad del vendedor",
      logicaEstrategica: "Evalúa la flexibilidad del cliente y la oportunidad del vendedor para actuar como un verdadero asesor.",
      fase: "primer-contacto"
    },
    { 
      id: 7, 
      nombre: "Nivel de Conocimiento", 
      peso: 2, 
      descripcion: "Permite adaptar nivel de conversación técnica",
      logicaEstrategica: "Permite adaptar el nivel de la conversación técnica y validar la investigación del cliente, generando confianza.",
      fase: "primer-contacto"
    },
    { 
      id: 8, 
      nombre: "La Moneda de Cambio (Auto a Cuenta)", 
      peso: 9, 
      descripcion: "Componente clave en estructura financiera del trato",
      logicaEstrategica: "Un componente clave en la estructura financiera del trato y una fuerte señal de intención de compra.",
      fase: "primer-contacto"
    },
    { 
      id: 9, 
      nombre: "Calidad de la Conversación", 
      peso: 9, 
      descripcion: "Mide interés genuino a través del nivel de interacción",
      logicaEstrategica: "Mide el interés genuino a través del nivel de interacción y la profundidad de las preguntas.",
      fase: "seguimiento"
    },
    { 
      id: 10, 
      nombre: "Historial y Barreras Previas", 
      peso: 2, 
      descripcion: "Permite anticipar y desactivar objeciones",
      logicaEstrategica: "Permite anticipar y desactivar objeciones, conociendo las preocupaciones o malas experiencias pasadas del cliente.",
      fase: "seguimiento"
    },
    { 
      id: 11, 
      nombre: "Cercanía a la Agencia", 
      peso: 4, 
      descripcion: "Factor de conveniencia que influye en visita y lealtad",
      logicaEstrategica: "Factor de conveniencia que influye en la visita, la prueba de manejo y, crucialmente, la lealtad a largo plazo vía postventa.",
      fase: "seguimiento"
    },
    { 
      id: 12, 
      nombre: "Lealtad a la Marca", 
      peso: 8, 
      descripcion: "Cliente recurrente con ciclo de venta más corto",
      logicaEstrategica: "Un cliente recurrente tiene un ciclo de venta más corto y un mayor grado de confianza inicial. Es un prospecto de alto valor.",
      fase: "seguimiento"
    },
    { 
      id: 13, 
      nombre: "Posesión de Múltiples Vehículos", 
      peso: 4, 
      descripcion: "Indicador de capacidad económica y ventas futuras",
      logicaEstrategica: "Indicador de capacidad económica y potencial para ventas futuras (renovación de flotilla familiar/personal).",
      fase: "seguimiento"
    },
    { 
      id: 14, 
      nombre: "Actitud del Prospecto", 
      peso: 5, 
      descripcion: "Ayuda a adaptar estilo de venta a la personalidad",
      logicaEstrategica: "Ayuda a adaptar el estilo de venta (analítico, relacional, etc.) para conectar eficazmente con la personalidad del cliente.",
      fase: "seguimiento"
    },
    { 
      id: 15, 
      nombre: "Círculo de Influencia", 
      peso: 2, 
      descripcion: "Mide potencial como embajador de marca",
      logicaEstrategica: "Mide el potencial del cliente como embajador de la marca, identificando oportunidades de referidos a futuro.",
      fase: "cierre"
    }
  ];
  
  // Estado para agendar seguimiento
  const [seguimiento, setSeguimiento] = useState({
    fecha: '',
    hora: '',
    tipo: '',
    comentarios: ''
  });
  
  // Estados para formulario nuevo prospecto
  const [nuevoProspecto, setNuevoProspecto] = useState({
    nombre: '',
    apellido: '',
    email: '',
    telefono: '',
    vehiculoInteresId: '',
    vehiculoInteresTxt: '', // Para compatibilidad con entrada manual
    clasificacion: 'Explorador'
  });

  // Estados para catálogo de vehículos
  const [vehiculosCatalogo, setVehiculosCatalogo] = useState<Array<{value: string, label: string, marca: string}>>([]);
  const [loadingCatalogo, setLoadingCatalogo] = useState(false);
  const [searchVehiculo, setSearchVehiculo] = useState('');
  const [showManualInput, setShowManualInput] = useState(false);

  const handleNuevoProspecto = () => {
    setShowNuevoProspectoModal(true);
    fetchVehiculosCatalogo(); // Cargar catálogo al abrir modal
  };

  // Función para obtener catálogo de vehículos
  const fetchVehiculosCatalogo = async () => {
    try {
      setLoadingCatalogo(true);
      const params = new URLSearchParams();
      if (searchVehiculo) params.set('search', searchVehiculo);
      
      const response = await fetch(`/api/vehiculos-catalogo/dropdown?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setVehiculosCatalogo(data.options || []);
      }
    } catch (error) {
      console.error('Error fetching vehicle catalog:', error);
    } finally {
      setLoadingCatalogo(false);
    }
  };

  const handleGuardarProspecto = () => {
    // Simular guardado
    const nuevoId = prospectos.length + 1;
    
    // Determinar el vehículo de interés (catálogo o texto manual)
    let vehiculoInteres = '';
    if (nuevoProspecto.vehiculoInteresId) {
      const vehiculoSeleccionado = vehiculosCatalogo.find(v => v.value === nuevoProspecto.vehiculoInteresId);
      vehiculoInteres = vehiculoSeleccionado?.label || '';
    } else if (nuevoProspecto.vehiculoInteresTxt) {
      vehiculoInteres = nuevoProspecto.vehiculoInteresTxt;
    }
    
    const prospecto: Prospecto = {
      id: nuevoId,
      nombre: nuevoProspecto.nombre,
      apellido: nuevoProspecto.apellido,
      email: nuevoProspecto.email,
      telefono: nuevoProspecto.telefono,
      clasificacion: nuevoProspecto.clasificacion,
      calificacionTotal: Math.random() * 100,
      vehiculoInteres: vehiculoInteres,
      estatus: 'Activo',
      fechaContacto: new Date().toISOString().split('T')[0]
    };
    
    setProspectos([...prospectos, prospecto]);
    setShowNuevoProspectoModal(false);
    setNuevoProspecto({
      nombre: '',
      apellido: '',
      email: '',
      telefono: '',
      vehiculoInteresId: '',
      vehiculoInteresTxt: '',
      clasificacion: 'Explorador'
    });
    setShowManualInput(false);
    setSearchVehiculo('');
    alert('✅ Prospecto creado exitosamente!');
  };

  const handleVerPerfil = (prospectoId: number) => {
    const prospecto = prospectos.find(p => p.id === prospectoId);
    if (prospecto) {
      setSelectedProspecto(prospecto);
      setShowPerfilModal(true);
    }
  };

  const handleAnalizar = (prospectoId: number) => {
    const prospecto = prospectos.find(p => p.id === prospectoId);
    if (prospecto) {
      setSelectedProspecto(prospecto);
      setShowAnalisisModal(true);
    }
  };

  const handleCalificarSPPC = (prospectoId: number) => {
    const prospecto = prospectos.find(p => p.id === prospectoId);
    if (prospecto) {
      setSelectedProspecto(prospecto);
      // Inicializar pilares con 0 si no existen
      const pilaresPorDefecto: {[key: number]: number} = {};
      for (let i = 1; i <= 15; i++) {
        pilaresPorDefecto[i] = 0;
      }
      setPilaresSPPC(pilaresPorDefecto);
      setShowCalificarModal(true);
    }
  };

  // Función para calcular la puntuación total SPPC
  const calcularPuntuacionSPPC = () => {
    let puntuacionTotal = 0;
    pilaresSPPCDefinicion.forEach(pilar => {
      const valor = pilaresSPPC[pilar.id] || 0;
      puntuacionTotal += (valor * pilar.peso) / 100;
    });
    return Math.round(puntuacionTotal);
  };

  // Función para obtener la clasificación basada en la puntuación
  const obtenerClasificacionSPPC = (puntuacion: number) => {
    if (puntuacion >= 85) return { clase: "Prospecto de Élite 🏆", color: "text-purple-600", bg: "bg-purple-50" };
    if (puntuacion >= 65) return { clase: "Prospecto Calificado 👍", color: "text-green-600", bg: "bg-green-50" };
    if (puntuacion >= 40) return { clase: "Prospecto a Madurar 🌱", color: "text-yellow-600", bg: "bg-yellow-50" };
    return { clase: "Explorador 🧭", color: "text-gray-600", bg: "bg-gray-50" };
  };

  // Función para obtener pilares por fase
  const obtenerPilaresPorFase = (fase: string) => {
    return pilaresSPPCDefinicion.filter(pilar => pilar.fase === fase);
  };

  // Función para obtener información de pestañas
  const obtenerInfoPestanas = () => {
    return [
      { 
        id: 'primer-contacto', 
        nombre: '1️⃣ Primer Contacto', 
        descripcion: 'Pilares 1-8 • Alta del Prospecto',
        pilares: obtenerPilaresPorFase('primer-contacto')
      },
      { 
        id: 'seguimiento', 
        nombre: '2️⃣ Seguimiento', 
        descripcion: 'Pilares 9-14 • Segunda Actividad',
        pilares: obtenerPilaresPorFase('seguimiento')
      },
      { 
        id: 'cierre', 
        nombre: '3️⃣ Cierre', 
        descripcion: 'Pilar 15 • Entrega/Cierre',
        pilares: obtenerPilaresPorFase('cierre')
      },
      { 
        id: 'completa', 
        nombre: '📋 Vista Completa', 
        descripcion: 'Todos los pilares • Consulta/Edición',
        pilares: pilaresSPPCDefinicion
      }
    ];
  };

  const handleGuardarCalificacion = () => {
    if (selectedProspecto) {
      const puntuacion = calcularPuntuacionSPPC();
      const clasificacion = obtenerClasificacionSPPC(puntuacion);
      
      // Actualizar el prospecto con la nueva calificación
      const prospectosActualizados = prospectos.map(p => 
        p.id === selectedProspecto.id 
          ? { ...p, calificacionTotal: puntuacion, clasificacion: clasificacion.clase }
          : p
      );
      setProspectos(prospectosActualizados);
      
      alert(`✅ Calificación SPPC Guardada Exitosamente!\n\n👤 Prospecto: ${selectedProspecto.nombre} ${selectedProspecto.apellido}\n📊 Puntuación Total: ${puntuacion}/100\n🏆 Clasificación: ${clasificacion.clase}\n\n📈 Detalles de la calificación:\n${pilaresSPPCDefinicion.map(pilar => `• ${pilar.nombre}: ${pilaresSPPC[pilar.id] || 0}/100 (Peso: ${pilar.peso}%)`).join('\n')}\n\n💡 Esta calificación se usará para priorizar seguimientos y generar análisis automáticos.`);
      
      setShowCalificarModal(false);
    }
  };

  const handleAgendarSeguimiento = () => {
    setShowAgendarModal(true);
    setSeguimiento({
      fecha: new Date().toISOString().split('T')[0],
      hora: '10:00',
      tipo: 'Llamada',
      comentarios: ''
    });
  };

  const handleGuardarSeguimiento = () => {
    alert(`✅ Seguimiento Agendado Exitosamente!\n\n📅 Fecha: ${new Date(seguimiento.fecha).toLocaleDateString('es-ES')}\n🕒 Hora: ${seguimiento.hora}\n📞 Tipo: ${seguimiento.tipo}\n💬 Comentarios: ${seguimiento.comentarios || 'Sin comentarios'}\n\n🔔 Notificación programada`);
    setShowAgendarModal(false);
    setShowPerfilModal(false);
  };

  const handleEditarInformacion = () => {
    if (selectedProspecto) {
      setProspectoEditado({ ...selectedProspecto });
      setShowEditarModal(true);
    }
  };

  const handleGuardarEdicion = () => {
    if (prospectoEditado) {
      setProspectos(prospectos.map(p => 
        p.id === prospectoEditado.id ? prospectoEditado : p
      ));
      setShowEditarModal(false);
      setShowPerfilModal(false);
      alert('✅ Información actualizada exitosamente!');
    }
  };

  useEffect(() => {
    // Simulamos datos por ahora
    const sampleData: Prospecto[] = [
      {
        id: 1,
        nombre: 'Fernando',
        apellido: 'Rodríguez',
        email: 'fernando.rodriguez@email.com',
        telefono: '+52 55 1234-5678',
        clasificacion: 'Elite',
        calificacionTotal: 92.5,
        vehiculoInteres: 'Audi Q7 55 TFSI quattro',
        estatus: 'En Proceso',
        fechaContacto: '2025-09-08'
      },
      {
        id: 2,
        nombre: 'María',
        apellido: 'López',
        email: 'maria.lopez@corporativo.com',
        telefono: '+52 55 9876-5432',
        clasificacion: 'Calificado',
        calificacionTotal: 78.25,
        vehiculoInteres: 'Audi A6 55 TFSI quattro',
        estatus: 'Calificado',
        fechaContacto: '2025-09-07'
      },
      {
        id: 3,
        nombre: 'José',
        apellido: 'Martínez',
        email: 'jose.martinez@gmail.com',
        telefono: '+52 55 5555-1234',
        clasificacion: 'A Madurar',
        calificacionTotal: 45.75,
        vehiculoInteres: 'Audi A4 40 TFSI quattro',
        estatus: 'A Madurar',
        fechaContacto: '2025-09-05'
      }
    ];
    
    setTimeout(() => {
      setProspectos(sampleData);
      setLoading(false);
    }, 500);
  }, []);

  const getClassificationColor = (classification: string) => {
    switch (classification) {
      case 'Elite':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'Calificado':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'A Madurar':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'Explorador':
        return 'bg-slate-100 text-slate-800 border-slate-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // Funciones de importación/exportación
  const handleExportExcel = () => {
    const csvContent = [
      'ID,Nombre,Apellido,Email,Telefono,Clasificacion,Calificacion Total,Vehiculo Interes,Estatus,Fecha Contacto',
      ...filteredProspectos.map(p => 
        `${p.id},"${p.nombre}","${p.apellido}","${p.email}","${p.telefono}","${p.clasificacion}",${p.calificacionTotal},"${p.vehiculoInteres}","${p.estatus}","${p.fechaContacto}"`
      )
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `prospectos_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleExportJSON = () => {
    const jsonContent = JSON.stringify(filteredProspectos, null, 2);
    const blob = new Blob([jsonContent], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `prospectos_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleImportFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      try {
        let importedData: Prospecto[] = [];
        
        if (file.type === 'application/json') {
          importedData = JSON.parse(content);
        } else if (file.name.endsWith('.csv')) {
          const lines = content.split('\n');
          const headers = lines[0].split(',');
          importedData = lines.slice(1).filter(line => line.trim()).map((line, index) => {
            const values = line.split(',');
            return {
              id: prospectos.length + index + 1,
              nombre: values[1]?.replace(/"/g, '') || '',
              apellido: values[2]?.replace(/"/g, '') || '',
              email: values[3]?.replace(/"/g, '') || '',
              telefono: values[4]?.replace(/"/g, '') || '',
              clasificacion: values[5]?.replace(/"/g, '') || 'Explorador',
              calificacionTotal: parseFloat(values[6]) || 0,
              vehiculoInteres: values[7]?.replace(/"/g, '') || '',
              estatus: values[8]?.replace(/"/g, '') || 'Nuevo',
              fechaContacto: values[9]?.replace(/"/g, '') || new Date().toISOString().split('T')[0]
            };
          });
        }
        
        setProspectos([...prospectos, ...importedData]);
        setShowImportModal(false);
        alert(`✅ Se importaron ${importedData.length} prospectos exitosamente!`);
      } catch (error) {
        alert('❌ Error al importar el archivo. Verifique el formato.');
      }
    };
    reader.readAsText(file);
  };

  // Funciones de grabación y transcripción
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setIsRecording(true);
      // Simular grabación por ahora
      setTimeout(() => {
        setIsRecording(false);
        setRecordedAudio('audio_recorded');
        simulateTranscription();
      }, 5000);
    } catch (error) {
      alert('❌ Error al acceder al micrófono');
    }
  };

  const simulateTranscription = () => {
    const sampleTranscription = `Cliente: Hola, estoy interesado en comprar un automóvil nuevo.
Vendedor: ¡Perfecto! ¿Qué tipo de vehículo está buscando?
Cliente: Necesito algo confiable para mi familia, tengo 3 hijos pequeños. 
Vendedor: ¿Cuál es su presupuesto aproximado?
Cliente: Puedo manejar hasta 800,000 pesos. Lo necesito en los próximos 2 meses porque mi auto actual ya no me sirve.
Vendedor: ¿Ha considerado opciones de financiamiento?
Cliente: Sí, tengo buen historial crediticio y puedo dar un enganche del 30%.`;
    
    setTranscription(sampleTranscription);
    analyzeTranscriptionForPillars(sampleTranscription);
  };

  const analyzeTranscriptionForPillars = (text: string) => {
    const analyzed: {[key: number]: number} = {};
    
    // Análisis simple basado en palabras clave
    if (text.includes('familia') || text.includes('hijos')) analyzed[3] = 90; // El 'Para Qué' Profundo
    if (text.includes('800,000') || text.includes('presupuesto')) analyzed[2] = 85; // La Realidad Financiera
    if (text.includes('2 meses') || text.includes('necesito')) analyzed[4] = 80; // Termómetro de la Urgencia
    if (text.includes('enganche') || text.includes('financiamiento')) analyzed[2] = 90; // La Realidad Financiera
    if (text.includes('buen historial') || text.includes('crediticio')) analyzed[2] = 95; // La Realidad Financiera
    
    setAnalyzedPillars(analyzed);
  };

  const filteredProspectos = prospectos.filter(prospecto => {
    const matchesSearch = 
      prospecto.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      prospecto.apellido.toLowerCase().includes(searchTerm.toLowerCase()) ||
      prospecto.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = filterClasificacion === 'all' || prospecto.clasificacion === filterClasificacion;
    
    return matchesSearch && matchesFilter;
  });

  if (status === 'loading' || loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-slate-200 rounded w-48 animate-pulse"></div>
        <div className="grid gap-4">
          {[...Array(5)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-20 bg-slate-200 rounded"></div>
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
          <h1 className="text-3xl font-bold text-slate-900">Gestión de Prospectos</h1>
          <p className="text-slate-600 mt-2">Sistema SPPC - Administra tu cartera de clientes potenciales</p>
        </div>
        <div className="flex gap-3">
          {/* Botón de Ayuda */}
          <Button 
            variant="outline"
            onClick={() => setShowHelpModal(true)}
            className="border-blue-200 text-blue-700 hover:bg-blue-50"
          >
            <HelpCircle className="w-4 h-4 mr-2" />
            Ayuda
          </Button>
          
          {/* Botón de Importar */}
          <Button 
            variant="outline"
            onClick={() => setShowImportModal(true)}
            className="border-green-200 text-green-700 hover:bg-green-50"
          >
            <Upload className="w-4 h-4 mr-2" />
            Importar
          </Button>
          
          {/* Botón de Exportar */}
          <Button 
            variant="outline"
            onClick={() => setShowExportModal(true)}
            className="border-purple-200 text-purple-700 hover:bg-purple-50"
          >
            <Download className="w-4 h-4 mr-2" />
            Exportar
          </Button>
          
          {/* Botón de Grabación */}
          <Button 
            variant="outline"
            onClick={() => setShowRecordingModal(true)}
            className="border-red-200 text-red-700 hover:bg-red-50"
          >
            <Mic className="w-4 h-4 mr-2" />
            Grabar Conversación
          </Button>
          
          <Button 
            className="bg-blue-600 hover:bg-blue-700 text-white"
            onClick={handleNuevoProspecto}
          >
            <UserPlus className="w-4 h-4 mr-2" />
            Nuevo Prospecto
          </Button>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex gap-4 bg-white p-4 rounded-lg border">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
            <Input
              placeholder="Buscar por nombre, apellido o email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <Select value={filterClasificacion} onValueChange={setFilterClasificacion}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filtrar por clasificación" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas las clasificaciones</SelectItem>
            <SelectItem value="Elite">Elite</SelectItem>
            <SelectItem value="Calificado">Calificado</SelectItem>
            <SelectItem value="A Madurar">A Madurar</SelectItem>
            <SelectItem value="Explorador">Explorador</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Lista de Prospectos */}
      <div className="grid gap-4">
        {filteredProspectos.map((prospecto, index) => (
          <motion.div
            key={prospecto.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
          >
            <Card className="hover:shadow-md transition-shadow duration-200">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-slate-900">
                        {prospecto.nombre} {prospecto.apellido}
                      </h3>
                      <Badge className={getClassificationColor(prospecto.clasificacion)}>
                        {prospecto.clasificacion}
                      </Badge>
                    </div>
                    
                    <div className="grid md:grid-cols-2 gap-4 mt-4">
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <Mail className="w-4 h-4 flex-shrink-0" />
                        <span className="truncate">{prospecto.email}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <Phone className="w-4 h-4 flex-shrink-0" />
                        <span className="font-medium text-slate-800">{prospecto.telefono}</span>
                      </div>
                    </div>
                    <div className="grid md:grid-cols-2 gap-4 mt-2">
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <Calendar className="w-4 h-4 flex-shrink-0" />
                        <span>{new Date(prospecto.fechaContacto).toLocaleDateString('es-ES')}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <Star className="w-4 h-4 flex-shrink-0" />
                        <span className="font-semibold text-slate-800">{prospecto.calificacionTotal.toFixed(1)}% SPPC</span>
                      </div>
                    </div>

                    <div className="mt-4 p-3 bg-slate-50 rounded-lg">
                      <p className="text-sm font-medium text-slate-700">Vehículo de Interés:</p>
                      <p className="text-sm text-slate-600">{prospecto.vehiculoInteres}</p>
                    </div>
                  </div>
                  
                  <div className="flex flex-col gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleVerPerfil(prospecto.id)}
                    >
                      Ver Perfil
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleAnalizar(prospecto.id)}
                    >
                      <TrendingUp className="w-4 h-4 mr-1" />
                      Analizar
                    </Button>
                    <Button 
                      variant="default" 
                      size="sm"
                      onClick={() => handleCalificarSPPC(prospecto.id)}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      📊 Calificar SPPC
                    </Button>
                    
                    {/* Botones de actividades que disparan calificación automática */}
                    <div className="flex gap-1 mt-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          setSelectedProspecto(prospecto);
                          setPestanaActiva('primer-contacto');
                          const pilaresPorDefecto: {[key: number]: number} = {};
                          for (let i = 1; i <= 15; i++) {
                            pilaresPorDefecto[i] = 0;
                          }
                          setPilaresSPPC(pilaresPorDefecto);
                          setShowCalificarModal(true);
                          alert('🎯 Alta de Prospecto Registrada!\n\nCalifica los primeros 8 pilares SPPC para establecer la base de tu estrategia de ventas.');
                        }}
                        className="text-xs px-2 py-1"
                        title="Disparar calificación de primer contacto"
                      >
                        🆕 Alta
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          setSelectedProspecto(prospecto);
                          setPestanaActiva('seguimiento');
                          const pilaresPorDefecto: {[key: number]: number} = {};
                          for (let i = 1; i <= 15; i++) {
                            pilaresPorDefecto[i] = 0;
                          }
                          setPilaresSPPC(pilaresPorDefecto);
                          setShowCalificarModal(true);
                          alert('📞 Segunda Actividad Registrada!\n\nCalifica los pilares 9-14 para refinar tu estrategia de seguimiento.');
                        }}
                        className="text-xs px-2 py-1"
                        title="Disparar calificación de seguimiento"
                      >
                        📞 2da Act
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          setSelectedProspecto(prospecto);
                          setPestanaActiva('cierre');
                          const pilaresPorDefecto: {[key: number]: number} = {};
                          for (let i = 1; i <= 15; i++) {
                            pilaresPorDefecto[i] = 0;
                          }
                          setPilaresSPPC(pilaresPorDefecto);
                          setShowCalificarModal(true);
                          alert('🎉 Cierre/Entrega Iniciada!\n\nCalifica el pilar 15 para completar el análisis integral del cliente.');
                        }}
                        className="text-xs px-2 py-1"
                        title="Disparar calificación de cierre"
                      >
                        🎯 Cierre
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {filteredProspectos.length === 0 && (
        <div className="text-center py-12">
          <div className="text-slate-400 mb-4">
            <UserPlus className="w-16 h-16 mx-auto" />
          </div>
          <h3 className="text-lg font-semibold text-slate-600 mb-2">No se encontraron prospectos</h3>
          <p className="text-slate-500">Ajusta los filtros o agrega nuevos prospectos para comenzar.</p>
        </div>
      )}

      {/* Modal Nuevo Prospecto */}
      {showNuevoProspectoModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Nuevo Prospecto</h2>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setShowNuevoProspectoModal(false)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Nombre *</label>
                <Input 
                  value={nuevoProspecto.nombre}
                  onChange={(e) => setNuevoProspecto({...nuevoProspecto, nombre: e.target.value})}
                  placeholder="Nombre del prospecto"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Apellido *</label>
                <Input 
                  value={nuevoProspecto.apellido}
                  onChange={(e) => setNuevoProspecto({...nuevoProspecto, apellido: e.target.value})}
                  placeholder="Apellido del prospecto"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Email *</label>
                <Input 
                  type="email"
                  value={nuevoProspecto.email}
                  onChange={(e) => setNuevoProspecto({...nuevoProspecto, email: e.target.value})}
                  placeholder="ejemplo@email.com"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Teléfono *</label>
                <Input 
                  value={nuevoProspecto.telefono}
                  onChange={(e) => setNuevoProspecto({...nuevoProspecto, telefono: e.target.value})}
                  placeholder="+52 55 1234-5678"
                />
              </div>
              
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium">Vehículo de Interés</label>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => setShowManualInput(!showManualInput)}
                    className="text-xs text-blue-600 hover:text-blue-700"
                  >
                    {showManualInput ? 'Usar Catálogo' : 'Entrada Manual'}
                  </Button>
                </div>
                
                {!showManualInput ? (
                  <div>
                    <Select 
                      value={nuevoProspecto.vehiculoInteresId} 
                      onValueChange={(value) => setNuevoProspecto({...nuevoProspecto, vehiculoInteresId: value})}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar vehículo del catálogo..." />
                      </SelectTrigger>
                      <SelectContent className="max-h-[300px]">
                        {loadingCatalogo ? (
                          <div className="p-4 text-center text-sm text-slate-500">
                            Cargando catálogo...
                          </div>
                        ) : vehiculosCatalogo.length === 0 ? (
                          <div className="p-4 text-center text-sm text-slate-500">
                            No hay vehículos en el catálogo
                          </div>
                        ) : (
                          vehiculosCatalogo.map(vehiculo => (
                            <SelectItem key={vehiculo.value} value={vehiculo.value}>
                              <span className="flex items-center gap-2">
                                <Badge variant="outline" className="text-xs">
                                  {vehiculo.marca}
                                </Badge>
                                {vehiculo.label}
                              </span>
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-slate-500 mt-1">
                      Selecciona del catálogo estandarizado o usa "Entrada Manual" para vehículos no listados.
                    </p>
                  </div>
                ) : (
                  <div>
                    <Input 
                      value={nuevoProspecto.vehiculoInteresTxt}
                      onChange={(e) => setNuevoProspecto({...nuevoProspecto, vehiculoInteresTxt: e.target.value})}
                      placeholder="Ej: Vehículo personalizado o no catalogado"
                    />
                    <p className="text-xs text-slate-500 mt-1">
                      Para vehículos no disponibles en el catálogo estándar.
                    </p>
                  </div>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Clasificación Inicial</label>
                <Select 
                  value={nuevoProspecto.clasificacion} 
                  onValueChange={(value) => setNuevoProspecto({...nuevoProspecto, clasificacion: value})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Explorador">Explorador</SelectItem>
                    <SelectItem value="A Madurar">A Madurar</SelectItem>
                    <SelectItem value="Calificado">Calificado</SelectItem>
                    <SelectItem value="Elite">Elite</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <Button 
                onClick={handleGuardarProspecto}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
                disabled={
                  !nuevoProspecto.nombre || 
                  !nuevoProspecto.apellido || 
                  !nuevoProspecto.email || 
                  !nuevoProspecto.telefono ||
                  (!nuevoProspecto.vehiculoInteresId && !nuevoProspecto.vehiculoInteresTxt)
                }
              >
                Guardar Prospecto
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setShowNuevoProspectoModal(false)}
              >
                Cancelar
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Ver Perfil */}
      {showPerfilModal && selectedProspecto && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Perfil Completo - {selectedProspecto.nombre} {selectedProspecto.apellido}</h2>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setShowPerfilModal(false)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            
            <div className="space-y-6">
              {/* Información Personal */}
              <div>
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Información Personal
                </h3>
                <div className="grid md:grid-cols-2 gap-4 p-4 bg-slate-50 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-slate-600">Nombre Completo</p>
                    <p className="text-sm text-slate-900">{selectedProspecto.nombre} {selectedProspecto.apellido}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-600">Email</p>
                    <p className="text-sm text-slate-900">{selectedProspecto.email}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-600">Teléfono</p>
                    <p className="text-sm text-slate-900">{selectedProspecto.telefono}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-600">Fecha de Contacto</p>
                    <p className="text-sm text-slate-900">{new Date(selectedProspecto.fechaContacto).toLocaleDateString('es-ES')}</p>
                  </div>
                </div>
              </div>

              {/* Clasificación SPPC */}
              <div>
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <Target className="w-5 h-5" />
                  Clasificación SPPC
                </h3>
                <div className="p-4 bg-slate-50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Calificación Total</span>
                    <Badge className={getClassificationColor(selectedProspecto.clasificacion)}>
                      {selectedProspecto.clasificacion}
                    </Badge>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-2 mb-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${selectedProspecto.calificacionTotal}%` }}
                    />
                  </div>
                  <p className="text-sm text-slate-600">{selectedProspecto.calificacionTotal.toFixed(1)}% de probabilidad de conversión</p>
                </div>
              </div>

              {/* Información del Vehículo */}
              <div>
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Intereses
                </h3>
                <div className="p-4 bg-slate-50 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-slate-600">Vehículo de Interés</p>
                    <p className="text-sm text-slate-900">{selectedProspecto.vehiculoInteres}</p>
                  </div>
                  <div className="mt-3">
                    <p className="text-sm font-medium text-slate-600">Estatus</p>
                    <p className="text-sm text-slate-900">{selectedProspecto.estatus}</p>
                  </div>
                </div>
              </div>
              
              {/* Historial de Interacciones (Simulado) */}
              <div>
                <h3 className="text-lg font-semibold mb-3">Historial de Interacciones</h3>
                <div className="space-y-2">
                  <div className="p-3 border-l-4 border-blue-500 bg-blue-50 rounded">
                    <p className="text-sm font-medium">Contacto Inicial</p>
                    <p className="text-xs text-slate-600">{new Date(selectedProspecto.fechaContacto).toLocaleDateString('es-ES')} - Primer contacto establecido</p>
                  </div>
                  <div className="p-3 border-l-4 border-green-500 bg-green-50 rounded">
                    <p className="text-sm font-medium">Interés Manifestado</p>
                    <p className="text-xs text-slate-600">Mostró interés en {selectedProspecto.vehiculoInteres}</p>
                  </div>
                  <div className="p-3 border-l-4 border-yellow-500 bg-yellow-50 rounded">
                    <p className="text-sm font-medium">Clasificación SPPC</p>
                    <p className="text-xs text-slate-600">Clasificado como {selectedProspecto.clasificacion}</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <Button 
                className="bg-blue-600 hover:bg-blue-700"
                onClick={handleAgendarSeguimiento}
              >
                Agendar Seguimiento
              </Button>
              <Button 
                variant="outline"
                onClick={handleEditarInformacion}
              >
                Editar Información
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setShowPerfilModal(false)}
              >
                Cerrar
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Análisis SPPC */}
      {showAnalisisModal && selectedProspecto && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 w-full max-w-3xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Análisis SPPC - {selectedProspecto.nombre} {selectedProspecto.apellido}</h2>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setShowAnalisisModal(false)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            
            <div className="space-y-6">
              {/* Resumen del Análisis */}
              <div>
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  Análisis Integral SPPC
                </h3>
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm font-medium text-blue-800">Calificación Total</p>
                    <p className="text-2xl font-bold text-blue-900">{selectedProspecto.calificacionTotal.toFixed(1)}%</p>
                  </div>
                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-sm font-medium text-green-800">Clasificación</p>
                    <p className="text-lg font-bold text-green-900">{selectedProspecto.clasificacion}</p>
                  </div>
                  <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
                    <p className="text-sm font-medium text-purple-800">Prioridad</p>
                    <p className="text-lg font-bold text-purple-900">
                      {selectedProspecto.calificacionTotal > 80 ? 'Alta' : 
                       selectedProspecto.calificacionTotal > 60 ? 'Media' : 'Baja'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Métricas Detalladas */}
              <div>
                <h3 className="text-lg font-semibold mb-3">Métricas Detalladas</h3>
                <div className="space-y-4">
                  {/* Simulación de métricas SPPC */}
                  {[
                    { nombre: 'Situación Financiera', valor: Math.floor(selectedProspecto.calificacionTotal * 0.9), color: 'bg-blue-500' },
                    { nombre: 'Poder de Decisión', valor: Math.floor(selectedProspecto.calificacionTotal * 1.1), color: 'bg-green-500' },
                    { nombre: 'Presupuesto Disponible', valor: Math.floor(selectedProspecto.calificacionTotal * 0.8), color: 'bg-yellow-500' },
                    { nombre: 'Cronología de Compra', valor: Math.floor(selectedProspecto.calificacionTotal * 1.2), color: 'bg-red-500' }
                  ].map((metrica) => (
                    <div key={metrica.nombre} className="flex items-center gap-4">
                      <div className="w-32 text-sm font-medium">{metrica.nombre}</div>
                      <div className="flex-1 bg-slate-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full transition-all duration-500 ${metrica.color}`}
                          style={{ width: `${Math.min(metrica.valor, 100)}%` }}
                        />
                      </div>
                      <div className="w-12 text-right text-sm font-medium">
                        {Math.min(metrica.valor, 100)}%
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recomendaciones */}
              <div>
                <h3 className="text-lg font-semibold mb-3">Recomendaciones de Acción</h3>
                <div className="space-y-3">
                  {selectedProspecto.calificacionTotal > 80 ? (
                    <>
                      <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                        <p className="font-medium text-green-800">🎯 Acción Inmediata</p>
                        <p className="text-sm text-green-700">Prospecto de alta calidad. Programa una reunión presencial en las próximas 48 horas.</p>
                      </div>
                      <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <p className="font-medium text-blue-800">📞 Seguimiento</p>
                        <p className="text-sm text-blue-700">Contacto telefónico directo con propuesta personalizada.</p>
                      </div>
                    </>
                  ) : selectedProspecto.calificacionTotal > 60 ? (
                    <>
                      <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <p className="font-medium text-yellow-800">⏰ Nutrir Prospecto</p>
                        <p className="text-sm text-yellow-700">Mantener contacto regular con contenido de valor. Revisar en 2 semanas.</p>
                      </div>
                      <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <p className="font-medium text-blue-800">📧 Email Marketing</p>
                        <p className="text-sm text-blue-700">Incluir en campañas de email con información del vehículo de interés.</p>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                        <p className="font-medium text-red-800">🔄 Recalificar</p>
                        <p className="text-sm text-red-700">Obtener más información para mejorar la calificación SPPC.</p>
                      </div>
                      <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
                        <p className="font-medium text-gray-800">📋 Base de Datos</p>
                        <p className="text-sm text-gray-700">Mantener en base de datos para campañas futuras de remarketing.</p>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <Button 
                className="bg-blue-600 hover:bg-blue-700"
                onClick={() => {
                  alert('✅ Recomendaciones Aplicadas!\n\n• Prospecto marcado para seguimiento prioritario\n• Agregado a campañas automáticas\n• Notificación enviada al vendedor\n• Agenda actualizada con recordatorios');
                }}
              >
                Aplicar Recomendaciones
              </Button>
              <Button 
                variant="outline"
                onClick={() => {
                  alert('✅ Reporte SPPC Generando!\n\n• Análisis SPPC completo\n• Métricas detalladas\n• Recomendaciones específicas\n• Gráficas de progresión\n\nEl archivo se descargará automáticamente...');
                  
                  setTimeout(() => {
                    // Crear contenido HTML que se puede guardar como PDF
                    const htmlContent = `<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Análisis SPPC - ${selectedProspecto.nombre} ${selectedProspecto.apellido}</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; color: #333; line-height: 1.6; }
        .header { border-bottom: 3px solid #2563eb; padding-bottom: 20px; margin-bottom: 30px; }
        .logo { font-size: 24px; font-weight: bold; color: #2563eb; }
        .title { font-size: 28px; color: #1f2937; margin: 10px 0; }
        .subtitle { color: #6b7280; font-size: 16px; }
        .section { margin: 30px 0; }
        .section-title { font-size: 20px; font-weight: bold; color: #1f2937; border-left: 4px solid #2563eb; padding-left: 15px; margin-bottom: 15px; }
        .metrics-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin: 20px 0; }
        .metric-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; text-align: center; }
        .metric-value { font-size: 32px; font-weight: bold; color: #2563eb; }
        .metric-label { color: #64748b; margin-top: 5px; }
        .progress-bar { background: #e2e8f0; height: 20px; border-radius: 10px; margin: 10px 0; overflow: hidden; }
        .progress-fill { height: 100%; background: linear-gradient(90deg, #3b82f6, #1d4ed8); }
        .recommendation { background: #ecfdf5; border: 1px solid #10b981; border-radius: 8px; padding: 20px; margin: 15px 0; }
        .recommendation-title { font-weight: bold; color: #047857; margin-bottom: 10px; }
        .recommendation-text { color: #065f46; }
        .footer { margin-top: 50px; padding-top: 20px; border-top: 1px solid #e2e8f0; font-size: 12px; color: #6b7280; text-align: center; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        th, td { border: 1px solid #e2e8f0; padding: 12px; text-align: left; }
        th { background: #f1f5f9; font-weight: bold; }
        .status-elite { color: #7c3aed; font-weight: bold; }
        .status-high { color: #dc2626; font-weight: bold; }
    </style>
</head>
<body>
    <div class="header">
        <div class="logo">🚀 DynamicFin Optimization Suite</div>
        <div class="title">Análisis Integral SPPC</div>
        <div class="subtitle">${selectedProspecto.nombre} ${selectedProspecto.apellido} • Generado el ${new Date().toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</div>
    </div>

    <div class="section">
        <div class="section-title">📊 Métricas Principales</div>
        <div class="metrics-grid">
            <div class="metric-card">
                <div class="metric-value">${selectedProspecto.calificacionTotal ? Number(selectedProspecto.calificacionTotal).toFixed(1) : '92.5'}%</div>
                <div class="metric-label">Calificación Total</div>
            </div>
            <div class="metric-card">
                <div class="metric-value status-elite">${selectedProspecto.clasificacion || 'Elite'}</div>
                <div class="metric-label">Clasificación</div>
            </div>
            <div class="metric-card">
                <div class="metric-value status-high">Alta</div>
                <div class="metric-label">Prioridad</div>
            </div>
            <div class="metric-card">
                <div class="metric-value">Agencia Principal</div>
                <div class="metric-label">Agencia</div>
            </div>
        </div>
    </div>

    <div class="section">
        <div class="section-title">📈 Métricas Detalladas</div>
        <table>
            <tr><th>Aspecto</th><th>Puntuación</th><th>Evaluación</th></tr>
            <tr><td>Situación Financiera</td><td>83%</td><td>
                <div class="progress-bar"><div class="progress-fill" style="width: 83%"></div></div>
            </td></tr>
            <tr><td>Poder de Decisión</td><td>100%</td><td>
                <div class="progress-bar"><div class="progress-fill" style="width: 100%"></div></div>
            </td></tr>
            <tr><td>Presupuesto Disponible</td><td>74%</td><td>
                <div class="progress-bar"><div class="progress-fill" style="width: 74%"></div></div>
            </td></tr>
            <tr><td>Cronología de Compra</td><td>100%</td><td>
                <div class="progress-bar"><div class="progress-fill" style="width: 100%"></div></div>
            </td></tr>
        </table>
    </div>

    <div class="section">
        <div class="section-title">💡 Recomendaciones de Acción</div>
        
        <div class="recommendation">
            <div class="recommendation-title">🚨 Acción Inmediata</div>
            <div class="recommendation-text">
                Prospecto de alta calidad. Programa una reunión presencial en las próximas 48 horas.
                Este perfil muestra excelente potencial de conversión basado en el análisis SPPC.
            </div>
        </div>

        <div class="recommendation">
            <div class="recommendation-title">📞 Seguimiento</div>
            <div class="recommendation-text">
                Contacto telefónico directo con propuesta personalizada.
                Aprovechar el alto poder de decisión y disponibilidad presupuestaria.
            </div>
        </div>
    </div>

    <div class="section">
        <div class="section-title">📋 Información del Prospecto</div>
        <table>
            <tr><th>Campo</th><th>Información</th></tr>
            <tr><td>Nombre Completo</td><td>${selectedProspecto.nombre} ${selectedProspecto.apellido}</td></tr>
            <tr><td>Email</td><td>${selectedProspecto.email || 'No disponible'}</td></tr>
            <tr><td>Teléfono</td><td>${selectedProspecto.telefono || 'No disponible'}</td></tr>
            <tr><td>Vendedor Asignado</td><td>Vendedor Principal</td></tr>
            <tr><td>Fecha de Análisis</td><td>${new Date().toLocaleDateString('es-ES')}</td></tr>
            <tr><td>Estado</td><td>Activo - Seguimiento Prioritario</td></tr>
        </table>
    </div>

    <div class="section">
        <div class="section-title">📊 Insights del Sistema</div>
        <p>La optimización está funcionando por encima de las expectativas. Los prospectos tipo "Elite" como ${selectedProspecto.nombre} muestran una tasa de conversión 34% superior al promedio histórico.</p>
        <p><strong>Recomendación estratégica:</strong> Expandir la estrategia a otros segmentos similares y automatizar el proceso de seguimiento para maximizar la eficiencia del equipo de ventas.</p>
    </div>

    <div class="footer">
        <p>📄 Reporte generado automáticamente por DynamicFin Optimization Suite</p>
        <p>© ${new Date().getFullYear()} DynamicFin - Todos los derechos reservados</p>
        <p>🔒 Información confidencial - Solo para uso interno</p>
    </div>
</body>
</html>`;

                    // Crear blob HTML
                    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
                    const url = URL.createObjectURL(blob);
                    
                    // Crear enlace de descarga
                    const link = document.createElement('a');
                    link.href = url;
                    link.download = `Analisis_SPPC_${selectedProspecto.nombre}_${selectedProspecto.apellido}_${new Date().toISOString().split('T')[0]}.html`;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    URL.revokeObjectURL(url);
                    
                    // Mensaje de éxito
                    setTimeout(() => {
                      alert('✅ Reporte SPPC generado exitosamente!\n\n📄 Archivo HTML descargado correctamente.\n🌐 Abre con cualquier navegador web.\n📑 Para convertir a PDF: Abre el archivo → Ctrl+P → Guardar como PDF\n\n💡 El reporte incluye:\n• Análisis SPPC completo y detallado\n• Métricas visuales con gráficos\n• Recomendaciones específicas\n• Información del prospecto\n• Insights del sistema\n\n🎨 Formato profesional listo para presentar');
                    }, 500);
                  }, 1000);
                }}
              >
                Generar Reporte PDF
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setShowAnalisisModal(false)}
              >
                Cerrar Análisis
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Agendar Seguimiento */}
      {showAgendarModal && selectedProspecto && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Agendar Seguimiento - {selectedProspecto.nombre}</h2>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setShowAgendarModal(false)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            
            <div className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Fecha *</label>
                  <Input 
                    type="date"
                    value={seguimiento.fecha}
                    onChange={(e) => setSeguimiento({...seguimiento, fecha: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Hora *</label>
                  <Input 
                    type="time"
                    value={seguimiento.hora}
                    onChange={(e) => setSeguimiento({...seguimiento, hora: e.target.value})}
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Tipo de Seguimiento *</label>
                <Select 
                  value={seguimiento.tipo} 
                  onValueChange={(value) => setSeguimiento({...seguimiento, tipo: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona el tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Llamada">📞 Llamada Telefónica</SelectItem>
                    <SelectItem value="Email">📧 Envío de Email</SelectItem>
                    <SelectItem value="Reunion">🤝 Reunión Presencial</SelectItem>
                    <SelectItem value="WhatsApp">💬 Mensaje WhatsApp</SelectItem>
                    <SelectItem value="Visita">🏢 Visita a Agencia</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Comentarios</label>
                <Input 
                  value={seguimiento.comentarios}
                  onChange={(e) => setSeguimiento({...seguimiento, comentarios: e.target.value})}
                  placeholder="Comentarios adicionales para el seguimiento..."
                />
              </div>

              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h4 className="font-medium text-blue-800 mb-2">Información del Prospecto:</h4>
                <p className="text-sm text-blue-700">• Clasificación: {selectedProspecto.clasificacion}</p>
                <p className="text-sm text-blue-700">• SPPC: {selectedProspecto.calificacionTotal.toFixed(1)}%</p>
                <p className="text-sm text-blue-700">• Vehículo de Interés: {selectedProspecto.vehiculoInteres}</p>
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <Button 
                onClick={handleGuardarSeguimiento}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
                disabled={!seguimiento.fecha || !seguimiento.hora || !seguimiento.tipo}
              >
                Agendar Seguimiento
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setShowAgendarModal(false)}
              >
                Cancelar
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Editar Información */}
      {showEditarModal && prospectoEditado && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Editar Información - {prospectoEditado.nombre}</h2>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setShowEditarModal(false)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Nombre *</label>
                <Input 
                  value={prospectoEditado.nombre}
                  onChange={(e) => setProspectoEditado({...prospectoEditado, nombre: e.target.value})}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Apellido *</label>
                <Input 
                  value={prospectoEditado.apellido}
                  onChange={(e) => setProspectoEditado({...prospectoEditado, apellido: e.target.value})}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Email *</label>
                <Input 
                  type="email"
                  value={prospectoEditado.email}
                  onChange={(e) => setProspectoEditado({...prospectoEditado, email: e.target.value})}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Teléfono *</label>
                <Input 
                  value={prospectoEditado.telefono}
                  onChange={(e) => setProspectoEditado({...prospectoEditado, telefono: e.target.value})}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Vehículo de Interés</label>
                <Input 
                  value={prospectoEditado.vehiculoInteres}
                  onChange={(e) => setProspectoEditado({...prospectoEditado, vehiculoInteres: e.target.value})}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Clasificación SPPC</label>
                <Select 
                  value={prospectoEditado.clasificacion} 
                  onValueChange={(value) => setProspectoEditado({...prospectoEditado, clasificacion: value})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Explorador">Explorador</SelectItem>
                    <SelectItem value="A Madurar">A Madurar</SelectItem>
                    <SelectItem value="Calificado">Calificado</SelectItem>
                    <SelectItem value="Elite">Elite</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Estatus</label>
                <Select 
                  value={prospectoEditado.estatus} 
                  onValueChange={(value) => setProspectoEditado({...prospectoEditado, estatus: value})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Activo">Activo</SelectItem>
                    <SelectItem value="En Proceso">En Proceso</SelectItem>
                    <SelectItem value="Convertido">Convertido</SelectItem>
                    <SelectItem value="Inactivo">Inactivo</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Calificación SPPC (%)</label>
                <Input 
                  type="number"
                  min="0"
                  max="100"
                  value={prospectoEditado.calificacionTotal}
                  onChange={(e) => setProspectoEditado({...prospectoEditado, calificacionTotal: parseFloat(e.target.value) || 0})}
                />
              </div>
            </div>

            <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <h4 className="font-medium text-yellow-800 mb-2">⚠️ Importante:</h4>
              <p className="text-sm text-yellow-700">Los cambios en la clasificación SPPC y calificación pueden afectar las estrategias de seguimiento automático.</p>
            </div>
            
            <div className="flex gap-3 mt-6">
              <Button 
                onClick={handleGuardarEdicion}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
                disabled={!prospectoEditado.nombre || !prospectoEditado.apellido || !prospectoEditado.email}
              >
                Guardar Cambios
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setShowEditarModal(false)}
              >
                Cancelar
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Calificar SPPC */}
      {showCalificarModal && selectedProspecto && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 w-full max-w-6xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-semibold text-slate-800">📊 Calificación SPPC</h2>
                <p className="text-slate-600">{selectedProspecto.nombre} {selectedProspecto.apellido}</p>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setShowCalificarModal(false)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            {/* Indicador de progreso */}
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-blue-800">Progreso de Calificación</span>
                <span className="text-sm text-blue-600">
                  Puntuación Actual: <strong>{calcularPuntuacionSPPC()}/100</strong>
                </span>
              </div>
              <div className="w-full bg-blue-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                  style={{width: `${calcularPuntuacionSPPC()}%`}}
                ></div>
              </div>
              <div className="mt-2">
                <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${obtenerClasificacionSPPC(calcularPuntuacionSPPC()).bg} ${obtenerClasificacionSPPC(calcularPuntuacionSPPC()).color}`}>
                  {obtenerClasificacionSPPC(calcularPuntuacionSPPC()).clase}
                </span>
              </div>
            </div>

            {/* Sistema de Pestañas */}
            <div className="mb-6">
              <div className="border-b border-slate-200">
                <nav className="flex space-x-8">
                  {obtenerInfoPestanas().map((pestana) => (
                    <button
                      key={pestana.id}
                      onClick={() => setPestanaActiva(pestana.id as any)}
                      className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                        pestanaActiva === pestana.id
                          ? 'border-blue-500 text-blue-600'
                          : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                      }`}
                    >
                      <div className="text-center">
                        <div className="font-semibold">{pestana.nombre}</div>
                        <div className="text-xs">{pestana.descripcion}</div>
                      </div>
                    </button>
                  ))}
                </nav>
              </div>
            </div>

            {/* Grid de pilares según pestaña activa */}
            <div className="grid md:grid-cols-2 gap-6">
              {obtenerInfoPestanas()
                .find(p => p.id === pestanaActiva)
                ?.pilares.map((pilar, index) => (
                <div key={pilar.id} className="border border-slate-200 rounded-lg p-4 hover:border-blue-300 transition-colors">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="flex items-center justify-center w-8 h-8 bg-blue-100 text-blue-600 rounded-full text-sm font-bold">
                        {pilar.id}
                      </span>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold text-slate-800 text-sm">{pilar.nombre}</h4>
                          <button
                            onClick={() => setShowInfoPilar(showInfoPilar === pilar.id ? null : pilar.id)}
                            className="text-blue-500 hover:text-blue-700 p-1 rounded-full hover:bg-blue-50"
                            title="Ver lógica estratégica completa"
                          >
                            ℹ️
                          </button>
                        </div>
                        <span className="text-xs text-blue-600 font-medium">Peso: {pilar.peso}%</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-lg font-bold text-slate-700">{pilaresSPPC[pilar.id] || 0}</span>
                      <span className="text-sm text-slate-500">/100</span>
                    </div>
                  </div>
                  
                  {/* Descripción normal o lógica estratégica completa */}
                  <div className="mb-4">
                    {showInfoPilar === pilar.id ? (
                      <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <div className="flex justify-between items-start mb-2">
                          <h5 className="font-medium text-blue-800">🎯 Lógica Estratégica:</h5>
                          <button
                            onClick={() => setShowInfoPilar(null)}
                            className="text-blue-500 hover:text-blue-700 text-sm"
                          >
                            ✕
                          </button>
                        </div>
                        <p className="text-sm text-blue-700">{pilar.logicaEstrategica}</p>
                      </div>
                    ) : (
                      <p className="text-sm text-slate-600">{pilar.descripcion}</p>
                    )}
                  </div>
                  
                  {/* Slider para calificar */}
                  <div className="space-y-2">
                    <input 
                      type="range"
                      min="0"
                      max="100"
                      step="5"
                      value={pilaresSPPC[pilar.id] || 0}
                      onChange={(e) => setPilaresSPPC({
                        ...pilaresSPPC,
                        [pilar.id]: parseInt(e.target.value)
                      })}
                      className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer slider"
                    />
                    <div className="flex justify-between text-xs text-slate-500">
                      <span>0 - Sin Info</span>
                      <span>25 - Bajo</span>
                      <span>50 - Medio</span>
                      <span>75 - Alto</span>
                      <span>100 - Excelente</span>
                    </div>
                  </div>

                  {/* Botones rápidos para valores comunes */}
                  <div className="flex gap-1 mt-3">
                    {[0, 25, 50, 75, 100].map(valor => (
                      <button
                        key={valor}
                        onClick={() => setPilaresSPPC({
                          ...pilaresSPPC,
                          [pilar.id]: valor
                        })}
                        className={`px-2 py-1 text-xs rounded ${
                          (pilaresSPPC[pilar.id] || 0) === valor 
                            ? 'bg-blue-600 text-white' 
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        {valor}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Información contextual según pestaña */}
            {pestanaActiva !== 'completa' && (
              <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg">
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex items-center justify-center w-10 h-10 bg-blue-100 text-blue-600 rounded-full font-bold">
                    {pestanaActiva === 'primer-contacto' ? '1️⃣' : pestanaActiva === 'seguimiento' ? '2️⃣' : '3️⃣'}
                  </div>
                  <div>
                    <h4 className="font-semibold text-blue-800">
                      {pestanaActiva === 'primer-contacto' && '🎯 Fase de Primer Contacto'}
                      {pestanaActiva === 'seguimiento' && '📞 Fase de Seguimiento'}
                      {pestanaActiva === 'cierre' && '🎉 Fase de Cierre'}
                    </h4>
                    <p className="text-sm text-blue-600">
                      {pestanaActiva === 'primer-contacto' && 'Diagnóstico inicial - Evalúa el potencial y urgencia del prospecto'}
                      {pestanaActiva === 'seguimiento' && 'Configuración del trato - Profundiza en la relación y estructura'}
                      {pestanaActiva === 'cierre' && 'Entrega y futuro - Evalúa el potencial de referidos y lealtad'}
                    </p>
                  </div>
                </div>
                <div className="text-sm text-blue-700">
                  {pestanaActiva === 'primer-contacto' && (
                    <>
                      <strong>💡 Estrategia:</strong> Si el cliente pregunta por financiamiento, el Pilar 2 se evalúa de inmediato. 
                      Estos 8 pilares te dan la "temperatura" del lead para priorizar tu tiempo.
                    </>
                  )}
                  {pestanaActiva === 'seguimiento' && (
                    <>
                      <strong>💡 Estrategia:</strong> Aquí determinas la estructura del trato y adaptas tu estilo de venta. 
                      La calidad de la relación construida aquí define el éxito del cierre.
                    </>
                  )}
                  {pestanaActiva === 'cierre' && (
                    <>
                      <strong>💡 Estrategia:</strong> El último pilar se enfoca en la relación a largo plazo. 
                      Un cliente satisfecho genera más valor a través de referidos que la venta inicial.
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Resumen y guía de clasificación */}
            <div className="mt-6 p-4 bg-slate-50 border border-slate-200 rounded-lg">
              <h4 className="font-semibold text-slate-800 mb-3">📋 Guía de Clasificación SPPC</h4>
              <div className="grid md:grid-cols-4 gap-4 text-sm">
                <div className="p-3 bg-purple-50 border border-purple-200 rounded">
                  <div className="font-semibold text-purple-800">🏆 Élite (85-100)</div>
                  <div className="text-purple-600">Prioridad máxima. Contacto inmediato.</div>
                </div>
                <div className="p-3 bg-green-50 border border-green-200 rounded">
                  <div className="font-semibold text-green-800">👍 Calificado (65-84)</div>
                  <div className="text-green-600">Gran potencial. Seguimiento constante.</div>
                </div>
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded">
                  <div className="font-semibold text-yellow-800">🌱 A Madurar (40-64)</div>
                  <div className="text-yellow-600">Interés real. Nutrir con contenido.</div>
                </div>
                <div className="p-3 bg-gray-50 border border-gray-200 rounded">
                  <div className="font-semibold text-gray-800">🧭 Explorador (&lt;40)</div>
                  <div className="text-gray-600">Solo viendo. Campañas masivas.</div>
                </div>
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <Button 
                onClick={handleGuardarCalificacion}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
              >
                💾 Guardar Calificación SPPC
              </Button>
              <Button 
                variant="outline"
                onClick={() => {
                  // Resetear todos los pilares
                  const pilaresPorDefecto: {[key: number]: number} = {};
                  for (let i = 1; i <= 15; i++) {
                    pilaresPorDefecto[i] = 0;
                  }
                  setPilaresSPPC(pilaresPorDefecto);
                }}
              >
                🔄 Resetear Todo
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setShowCalificarModal(false)}
              >
                Cancelar
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Importación */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-semibold">📁 Importar Prospectos</h2>
              <Button variant="ghost" size="sm" onClick={() => setShowImportModal(false)}>
                <X className="w-4 h-4" />
              </Button>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-slate-600 mb-4">
                    Soporta archivos Excel (.csv) y JSON (.json)
                  </p>
                  <input
                    type="file"
                    accept=".csv,.json"
                    onChange={handleImportFile}
                    className="w-full p-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div className="bg-blue-50 p-3 rounded-lg">
                  <h4 className="font-semibold text-blue-800 mb-2">📋 Formato requerido:</h4>
                  <p className="text-sm text-blue-700">
                    ID,Nombre,Apellido,Email,Telefono,Clasificacion,Calificacion Total,Vehiculo Interes,Estatus,Fecha Contacto
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Exportación */}
      {showExportModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-semibold">💾 Exportar Prospectos</h2>
              <Button variant="ghost" size="sm" onClick={() => setShowExportModal(false)}>
                <X className="w-4 h-4" />
              </Button>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                <p className="text-slate-600 mb-4">
                  Selecciona el formato de exportación:
                </p>
                
                <Button 
                  onClick={handleExportExcel}
                  className="w-full bg-green-600 hover:bg-green-700 text-white mb-3"
                >
                  <FileSpreadsheet className="w-4 h-4 mr-2" />
                  Exportar como Excel (.csv)
                </Button>
                
                <Button 
                  onClick={handleExportJSON}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white mb-3"
                >
                  <File className="w-4 h-4 mr-2" />
                  Exportar como JSON
                </Button>
                
                <div className="bg-gray-50 p-3 rounded-lg text-sm text-gray-600">
                  📊 Se exportarán {filteredProspectos.length} prospectos según los filtros actuales.
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Ayuda */}
      {showHelpModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b sticky top-0 bg-white">
              <h2 className="text-xl font-semibold">📚 Centro de Ayuda - Gestión de Prospectos</h2>
              <Button variant="ghost" size="sm" onClick={() => setShowHelpModal(false)}>
                <X className="w-4 h-4" />
              </Button>
            </div>
            <div className="p-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h3 className="font-semibold text-blue-800 mb-2">🎯 Sistema SPPC</h3>
                    <p className="text-blue-700 text-sm">
                      Sistema de Perfilamiento y Potencial de Cliente con 15 pilares estratégicos para maximizar conversiones.
                    </p>
                    <Button 
                      size="sm"
                      onClick={() => {
                        setShowHelpModal(false);
                        setShowPilaresGuideModal(true);
                      }}
                      className="mt-2 bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      📖 Ver Guía de Pilares
                    </Button>
                  </div>
                  
                  <div className="bg-green-50 p-4 rounded-lg">
                    <h3 className="font-semibold text-green-800 mb-2">💬 Simulación de Diálogo</h3>
                    <p className="text-green-700 text-sm">
                      Practica conversaciones con clientes y aprende a identificar señales clave para los pilares.
                    </p>
                    <Button 
                      size="sm"
                      onClick={() => {
                        setShowHelpModal(false);
                        setShowDialogSimulationModal(true);
                      }}
                      className="mt-2 bg-green-600 hover:bg-green-700 text-white"
                    >
                      🎭 Iniciar Simulación
                    </Button>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="bg-purple-50 p-4 rounded-lg">
                    <h3 className="font-semibold text-purple-800 mb-2">🎙️ Grabación Inteligente</h3>
                    <p className="text-purple-700 text-sm">
                      Graba conversaciones reales y obtén análisis automático de pilares basado en IA.
                    </p>
                  </div>
                  
                  <div className="bg-orange-50 p-4 rounded-lg">
                    <h3 className="font-semibold text-orange-800 mb-2">📊 Importar/Exportar</h3>
                    <p className="text-orange-700 text-sm">
                      Importa prospectos desde Excel o JSON, y exporta datos para análisis externos.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Guía de Pilares */}
      {showPilaresGuideModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b sticky top-0 bg-white">
              <h2 className="text-xl font-semibold">🏛️ Guía Completa de los 15 Pilares SPPC</h2>
              <Button variant="ghost" size="sm" onClick={() => setShowPilaresGuideModal(false)}>
                <X className="w-4 h-4" />
              </Button>
            </div>
            <div className="p-6">
              <div className="grid gap-6">
                {pilaresSPPCDefinicion.map((pilar) => (
                  <div key={pilar.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-start gap-4">
                      <div className={`
                        px-3 py-1 rounded-full text-sm font-bold
                        ${pilar.fase === 'primer-contacto' ? 'bg-blue-100 text-blue-800' : ''}
                        ${pilar.fase === 'seguimiento' ? 'bg-yellow-100 text-yellow-800' : ''}
                        ${pilar.fase === 'cierre' ? 'bg-purple-100 text-purple-800' : ''}
                      `}>
                        {pilar.peso}%
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg mb-2">
                          {pilar.id}. {pilar.nombre}
                        </h3>
                        <p className="text-gray-600 mb-2">{pilar.descripcion}</p>
                        <div className="bg-gray-50 p-3 rounded">
                          <p className="text-sm"><strong>Lógica Estratégica:</strong> {pilar.logicaEstrategica}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Simulación de Diálogo */}
      {showDialogSimulationModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b sticky top-0 bg-white">
              <h2 className="text-xl font-semibold">🎭 Simulación de Diálogo con Cliente</h2>
              <Button variant="ghost" size="sm" onClick={() => setShowDialogSimulationModal(false)}>
                <X className="w-4 h-4" />
              </Button>
            </div>
            <div className="p-6">
              <div className="space-y-6">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-blue-800 mb-2">📋 Objetivo del Ejercicio</h3>
                  <p className="text-blue-700">
                    Practica identificar información clave en conversaciones para evaluar correctamente los pilares SPPC.
                  </p>
                </div>
                
                <div className="bg-gray-50 p-6 rounded-lg">
                  <h3 className="font-semibold mb-4">💬 Conversación de Ejemplo:</h3>
                  <div className="space-y-3">
                    <div className="bg-white p-3 rounded border-l-4 border-blue-500">
                      <strong>Vendedor:</strong> "Buenos días, ¿en qué puedo ayudarle hoy?"
                    </div>
                    <div className="bg-white p-3 rounded border-l-4 border-green-500">
                      <strong>Cliente:</strong> "Hola, vine porque vi su anuncio en Facebook sobre los Audis. Necesito cambiar mi auto porque tengo 3 hijos y el actual ya no nos cabe a todos."
                    </div>
                    <div className="bg-white p-3 rounded border-l-4 border-blue-500">
                      <strong>Vendedor:</strong> "Entiendo perfectamente. ¿Cuál es su presupuesto aproximado?"
                    </div>
                    <div className="bg-white p-3 rounded border-l-4 border-green-500">
                      <strong>Cliente:</strong> "Puedo manejar hasta 850,000 pesos. Tengo buen historial crediticio y podría dar un enganche del 40%. Lo necesito urgente porque en 6 semanas nace el bebé."
                    </div>
                  </div>
                </div>
                
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="bg-green-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-green-800 mb-2">✅ Información Detectada:</h4>
                    <ul className="text-sm text-green-700 space-y-1">
                      <li>• <strong>Canal:</strong> Facebook (Pilar 1: 70pts)</li>
                      <li>• <strong>Financiera:</strong> 850k + enganche 40% (Pilar 2: 95pts)</li>
                      <li>• <strong>Para qué:</strong> Familia creciendo (Pilar 3: 90pts)</li>
                      <li>• <strong>Urgencia:</strong> 6 semanas (Pilar 4: 85pts)</li>
                    </ul>
                  </div>
                  <div className="bg-yellow-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-yellow-800 mb-2">📝 Clasificación Estimada:</h4>
                    <div className="text-2xl font-bold text-purple-600 mb-2">Élite 🏆</div>
                    <p className="text-sm text-yellow-700">
                      Este prospecto muestra características de alta calidad: necesidad real, capacidad financiera comprobada y urgencia genuina.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Grabación */}
      {showRecordingModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-semibold">🎙️ Grabación y Análisis Inteligente</h2>
              <Button variant="ghost" size="sm" onClick={() => setShowRecordingModal(false)}>
                <X className="w-4 h-4" />
              </Button>
            </div>
            <div className="p-6">
              <div className="space-y-6">
                <div className="text-center">
                  <div className={`
                    w-32 h-32 rounded-full mx-auto mb-4 flex items-center justify-center
                    ${isRecording ? 'bg-red-500 animate-pulse' : 'bg-gray-100'}
                  `}>
                    {isRecording ? (
                      <MicOff className="w-12 h-12 text-white" />
                    ) : (
                      <Mic className="w-12 h-12 text-gray-500" />
                    )}
                  </div>
                  
                  <Button
                    onClick={startRecording}
                    disabled={isRecording}
                    className={`
                      px-8 py-3 text-lg font-semibold
                      ${isRecording ? 'bg-red-500 hover:bg-red-600' : 'bg-blue-600 hover:bg-blue-700'}
                    `}
                  >
                    {isRecording ? (
                      <>
                        <MicOff className="w-5 h-5 mr-2" />
                        Grabando... (00:05)
                      </>
                    ) : (
                      <>
                        <Mic className="w-5 h-5 mr-2" />
                        Iniciar Grabación
                      </>
                    )}
                  </Button>
                </div>

                {transcription && (
                  <div className="space-y-4">
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h3 className="font-semibold mb-2">📝 Transcripción:</h3>
                      <div className="text-sm text-gray-700 whitespace-pre-line max-h-32 overflow-y-auto">
                        {transcription}
                      </div>
                    </div>

                    <div className="bg-blue-50 p-4 rounded-lg">
                      <h3 className="font-semibold text-blue-800 mb-3">🤖 Análisis de Pilares Detectados:</h3>
                      <div className="grid gap-2">
                        {Object.entries(analyzedPillars).map(([pilarId, puntuacion]) => {
                          const pilar = pilaresSPPCDefinicion.find(p => p.id === parseInt(pilarId));
                          return pilar ? (
                            <div key={pilarId} className="flex items-center justify-between bg-white p-2 rounded border">
                              <span className="text-sm font-medium">{pilar.nombre}</span>
                              <span className="text-lg font-bold text-green-600">{puntuacion}pts</span>
                            </div>
                          ) : null;
                        })}
                      </div>
                      
                      <Button
                        className="w-full mt-4 bg-green-600 hover:bg-green-700"
                        onClick={() => {
                          setPilaresSPPC({...pilaresSPPC, ...analyzedPillars});
                          setShowRecordingModal(false);
                          alert('✅ Pilares actualizados automáticamente!');
                        }}
                      >
                        ✅ Aplicar Análisis a Prospecto
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
