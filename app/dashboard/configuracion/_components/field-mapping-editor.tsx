
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { 
  ArrowRight,
  Plus,
  Trash2,
  Settings,
  Database,
  Target,
  User,
  Building,
  Save,
  RefreshCw,
  Info,
  AlertTriangle
} from 'lucide-react';

interface FieldMapping {
  id: string;
  entidad: 'prospecto' | 'vehiculo' | 'venta' | 'contacto';
  campoDynamicFin: string;
  campoCrm: string;
  tipoDato: 'string' | 'number' | 'date' | 'boolean' | 'json';
  direccionSincronizacion: 'dinamicfin_to_crm' | 'crm_to_dinamicfin' | 'bidireccional';
  requerido: boolean;
  activo: boolean;
  transformacion?: string;
  valorPorDefecto?: string;
}

interface CrmConfig {
  id: number;
  nombre: string;
  crmTipo: 'salesforce' | 'hubspot' | 'pipedrive' | 'zoho' | 'dynamics' | 'custom';
}

const CAMPOS_DYNAMICFIN = {
  prospecto: [
    { campo: 'nombre', tipo: 'string', descripcion: 'Nombre del prospecto' },
    { campo: 'apellido', tipo: 'string', descripcion: 'Apellido del prospecto' },
    { campo: 'email', tipo: 'string', descripcion: 'Email de contacto' },
    { campo: 'telefono', tipo: 'string', descripcion: 'Número telefónico' },
    { campo: 'presupuesto', tipo: 'number', descripcion: 'Presupuesto disponible' },
    { campo: 'clasificacion', tipo: 'string', descripcion: 'Clasificación SPCC' },
    { campo: 'estatus', tipo: 'string', descripcion: 'Estado del prospecto' },
    { campo: 'vehiculoInteres', tipo: 'string', descripcion: 'Vehículo de interés' },
    { campo: 'fechaContacto', tipo: 'date', descripcion: 'Fecha primer contacto' },
    { campo: 'calificacionTotal', tipo: 'number', descripcion: 'Puntuación SPCC total' }
  ],
  vehiculo: [
    { campo: 'marca', tipo: 'string', descripcion: 'Marca del vehículo' },
    { campo: 'modelo', tipo: 'string', descripcion: 'Modelo del vehículo' },
    { campo: 'year', tipo: 'number', descripcion: 'Año del vehículo' },
    { campo: 'precio', tipo: 'number', descripcion: 'Precio de venta' },
    { campo: 'version', tipo: 'string', descripcion: 'Versión/Trim' },
    { campo: 'color', tipo: 'string', descripcion: 'Color del vehículo' },
    { campo: 'kilometraje', tipo: 'number', descripcion: 'Kilometraje actual' },
    { campo: 'estatus', tipo: 'string', descripcion: 'Estado del vehículo' }
  ],
  venta: [
    { campo: 'fechaVenta', tipo: 'date', descripcion: 'Fecha de la venta' },
    { campo: 'montoVenta', tipo: 'number', descripcion: 'Monto total de venta' },
    { campo: 'vendedorId', tipo: 'string', descripcion: 'ID del vendedor' },
    { campo: 'comision', tipo: 'number', descripcion: 'Comisión generada' },
    { campo: 'metodoPago', tipo: 'string', descripcion: 'Método de pago' },
    { campo: 'financiamiento', tipo: 'boolean', descripcion: 'Con financiamiento' }
  ],
  contacto: [
    { campo: 'direccion', tipo: 'string', descripcion: 'Dirección completa' },
    { campo: 'ciudad', tipo: 'string', descripcion: 'Ciudad de residencia' },
    { campo: 'estado', tipo: 'string', descripcion: 'Estado/Provincia' },
    { campo: 'codigoPostal', tipo: 'string', descripcion: 'Código postal' },
    { campo: 'ocupacion', tipo: 'string', descripcion: 'Ocupación laboral' },
    { campo: 'empresa', tipo: 'string', descripcion: 'Empresa donde trabaja' }
  ]
};

const CAMPOS_CRM_SAMPLES: Record<string, Record<string, string[]>> = {
  salesforce: {
    prospecto: ['FirstName', 'LastName', 'Email', 'Phone', 'Budget__c', 'LeadScore', 'Status'],
    vehiculo: ['Make__c', 'Model__c', 'Year__c', 'Price__c', 'Trim__c'],
    venta: ['CloseDate', 'Amount', 'OwnerId', 'Commission__c'],
    contacto: ['MailingStreet', 'MailingCity', 'MailingState', 'MailingPostalCode']
  },
  hubspot: {
    prospecto: ['firstname', 'lastname', 'email', 'phone', 'budget', 'hubspotscore', 'lifecyclestage'],
    vehiculo: ['vehicle_make', 'vehicle_model', 'vehicle_year', 'vehicle_price'],
    venta: ['closedate', 'amount', 'hubspot_owner_id', 'commission'],
    contacto: ['address', 'city', 'state', 'zip', 'jobtitle', 'company']
  },
  pipedrive: {
    prospecto: ['name', 'email', 'phone', 'value', 'status'],
    vehiculo: ['custom_make', 'custom_model', 'custom_year', 'custom_price'],
    venta: ['close_time', 'value', 'user_id'],
    contacto: ['address', 'city', 'country']
  },
  zoho: {
    prospecto: ['First_Name', 'Last_Name', 'Email', 'Phone', 'Budget'],
    vehiculo: ['Make', 'Model', 'Year', 'Price'],
    venta: ['Closing_Date', 'Amount', 'Owner'],
    contacto: ['Mailing_Street', 'Mailing_City', 'Mailing_State']
  },
  dynamics: {
    prospecto: ['firstname', 'lastname', 'emailaddress1', 'telephone1', 'budgetamount'],
    vehiculo: ['make', 'model', 'year', 'price'],
    venta: ['actualclosedate', 'actualvalue', 'ownerid'],
    contacto: ['address1_line1', 'address1_city', 'address1_stateorprovince']
  },
  custom: {
    prospecto: ['name', 'email', 'phone', 'budget'],
    vehiculo: ['make', 'model', 'year', 'price'],
    venta: ['date', 'amount', 'owner'],
    contacto: ['address', 'city', 'state']
  }
};

export default function FieldMappingEditor({ 
  crmConfig,
  onClose 
}: { 
  crmConfig: CrmConfig;
  onClose: () => void;
}) {
  const [mappings, setMappings] = useState<FieldMapping[]>([]);
  const [selectedEntity, setSelectedEntity] = useState<keyof typeof CAMPOS_DYNAMICFIN>('prospecto');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    // Simular carga de mappings existentes
    setTimeout(() => {
      const sampleMappings: FieldMapping[] = [
        {
          id: '1',
          entidad: 'prospecto',
          campoDynamicFin: 'nombre',
          campoCrm: crmConfig.crmTipo === 'salesforce' ? 'FirstName' : 'firstname',
          tipoDato: 'string',
          direccionSincronizacion: 'bidireccional',
          requerido: true,
          activo: true
        },
        {
          id: '2',
          entidad: 'prospecto',
          campoDynamicFin: 'email',
          campoCrm: 'Email',
          tipoDato: 'string',
          direccionSincronizacion: 'bidireccional',
          requerido: true,
          activo: true
        },
        {
          id: '3',
          entidad: 'prospecto',
          campoDynamicFin: 'presupuesto',
          campoCrm: crmConfig.crmTipo === 'salesforce' ? 'Budget__c' : 'budget',
          tipoDato: 'number',
          direccionSincronizacion: 'bidireccional',
          requerido: false,
          activo: true,
          transformacion: 'multiply_by_0.052' // MXN to USD
        }
      ];
      setMappings(sampleMappings);
      setLoading(false);
    }, 800);
  }, [crmConfig]);

  const addNewMapping = () => {
    const newMapping: FieldMapping = {
      id: Math.random().toString(36).substr(2, 9),
      entidad: selectedEntity,
      campoDynamicFin: '',
      campoCrm: '',
      tipoDato: 'string',
      direccionSincronizacion: 'bidireccional',
      requerido: false,
      activo: true
    };
    setMappings([...mappings, newMapping]);
  };

  const updateMapping = (id: string, updates: Partial<FieldMapping>) => {
    setMappings(mappings.map(m => m.id === id ? { ...m, ...updates } : m));
  };

  const deleteMapping = (id: string) => {
    setMappings(mappings.filter(m => m.id !== id));
  };

  const saveAllMappings = async () => {
    setSaving(true);
    // Simular guardado
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    alert(`✅ MAPEOS GUARDADOS EXITOSAMENTE\n\n📊 RESUMEN:\n• ${mappings.length} mapeos configurados\n• ${mappings.filter(m => m.activo).length} mapeos activos\n• ${mappings.filter(m => m.requerido).length} campos requeridos\n\n🔄 SINCRONIZACIÓN:\n• Bidireccional: ${mappings.filter(m => m.direccionSincronizacion === 'bidireccional').length}\n• Solo a CRM: ${mappings.filter(m => m.direccionSincronizacion === 'dinamicfin_to_crm').length}\n• Solo desde CRM: ${mappings.filter(m => m.direccionSincronizacion === 'crm_to_dinamicfin').length}\n\n⚡ Los cambios se aplicarán en la próxima sincronización`);
    
    setSaving(false);
  };

  const getEntityIcon = (entidad: string) => {
    switch (entidad) {
      case 'prospecto': return <User className="w-4 h-4" />;
      case 'vehiculo': return <Database className="w-4 h-4" />;
      case 'venta': return <Target className="w-4 h-4" />;
      case 'contacto': return <Building className="w-4 h-4" />;
      default: return <Database className="w-4 h-4" />;
    }
  };

  const getEntityColor = (entidad: string) => {
    switch (entidad) {
      case 'prospecto': return 'green';
      case 'vehiculo': return 'blue';
      case 'venta': return 'purple';
      case 'contacto': return 'amber';
      default: return 'slate';
    }
  };

  const filteredMappings = mappings.filter(m => m.entidad === selectedEntity);

  if (loading) {
    return (
      <Card className="h-96">
        <CardContent className="p-6 flex items-center justify-center">
          <div className="flex items-center gap-2">
            <RefreshCw className="w-5 h-5 animate-spin" />
            <span>Cargando configuración de mapeos...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5 text-blue-600" />
                Editor de Mapeo de Campos
              </CardTitle>
              <CardDescription>
                Configura la sincronización entre DynamicFin y {crmConfig.nombre} ({crmConfig.crmTipo})
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={onClose}>
                Cerrar
              </Button>
              <Button 
                onClick={saveAllMappings}
                disabled={saving}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {saving ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Guardar Cambios
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-4 gap-4">
            {Object.entries(CAMPOS_DYNAMICFIN).map(([entidad, campos]) => (
              <Button
                key={entidad}
                variant={selectedEntity === entidad ? "default" : "outline"}
                className={`h-16 flex-col gap-1 ${selectedEntity === entidad ? 'bg-blue-600' : ''}`}
                onClick={() => setSelectedEntity(entidad as keyof typeof CAMPOS_DYNAMICFIN)}
              >
                {getEntityIcon(entidad)}
                <span className="capitalize text-xs">{entidad}</span>
                <Badge 
                  variant={selectedEntity === entidad ? "secondary" : "default"}
                  className={selectedEntity === entidad ? 'bg-blue-100 text-blue-800' : ''}
                >
                  {campos.length} campos
                </Badge>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Lista de Mapeos */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 capitalize">
                {getEntityIcon(selectedEntity)}
                Mapeos de {selectedEntity}
              </CardTitle>
              <CardDescription>
                {filteredMappings.length} mapeos configurados para {selectedEntity}
              </CardDescription>
            </div>
            <Button onClick={addNewMapping} size="sm">
              <Plus className="w-4 h-4 mr-2" />
              Agregar Mapeo
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {filteredMappings.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              <Database className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No hay mapeos configurados para {selectedEntity}</p>
              <Button variant="outline" onClick={addNewMapping} className="mt-4">
                <Plus className="w-4 h-4 mr-2" />
                Crear primer mapeo
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredMappings.map((mapping) => (
                <Card key={mapping.id} className={`border-${getEntityColor(selectedEntity)}-200`}>
                  <CardContent className="p-4">
                    <div className="grid md:grid-cols-6 gap-4 items-center">
                      {/* Campo DynamicFin */}
                      <div className="space-y-2">
                        <Label className="text-xs font-medium">Campo DynamicFin</Label>
                        <Select
                          value={mapping.campoDynamicFin}
                          onValueChange={(value) => updateMapping(mapping.id, { campoDynamicFin: value })}
                        >
                          <SelectTrigger className="h-8">
                            <SelectValue placeholder="Seleccionar campo" />
                          </SelectTrigger>
                          <SelectContent>
                            {CAMPOS_DYNAMICFIN[selectedEntity].map((campo) => (
                              <SelectItem key={campo.campo} value={campo.campo}>
                                <div>
                                  <p className="font-medium">{campo.campo}</p>
                                  <p className="text-xs text-slate-500">{campo.descripcion}</p>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Flecha de dirección */}
                      <div className="flex flex-col items-center">
                        <Select
                          value={mapping.direccionSincronizacion}
                          onValueChange={(value) => updateMapping(mapping.id, { 
                            direccionSincronizacion: value as FieldMapping['direccionSincronizacion']
                          })}
                        >
                          <SelectTrigger className="h-8 w-24">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="bidireccional">
                              <div className="flex items-center gap-1">
                                <ArrowRight className="w-3 h-3" />
                                <ArrowRight className="w-3 h-3 rotate-180" />
                              </div>
                            </SelectItem>
                            <SelectItem value="dinamicfin_to_crm">
                              <ArrowRight className="w-3 h-3" />
                            </SelectItem>
                            <SelectItem value="crm_to_dinamicfin">
                              <ArrowRight className="w-3 h-3 rotate-180" />
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Campo CRM */}
                      <div className="space-y-2">
                        <Label className="text-xs font-medium">Campo {crmConfig.crmTipo}</Label>
                        <Input
                          value={mapping.campoCrm}
                          onChange={(e) => updateMapping(mapping.id, { campoCrm: e.target.value })}
                          placeholder="Nombre del campo en CRM"
                          className="h-8"
                        />
                        {CAMPOS_CRM_SAMPLES[crmConfig.crmTipo]?.[selectedEntity] && (
                          <Select onValueChange={(value) => updateMapping(mapping.id, { campoCrm: value })}>
                            <SelectTrigger className="h-6 text-xs">
                              <SelectValue placeholder="Campos comunes" />
                            </SelectTrigger>
                            <SelectContent>
                              {CAMPOS_CRM_SAMPLES[crmConfig.crmTipo][selectedEntity].map((campo) => (
                                <SelectItem key={campo} value={campo} className="text-xs">
                                  {campo}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      </div>

                      {/* Tipo de dato */}
                      <div className="space-y-2">
                        <Label className="text-xs font-medium">Tipo</Label>
                        <Select
                          value={mapping.tipoDato}
                          onValueChange={(value) => updateMapping(mapping.id, { 
                            tipoDato: value as FieldMapping['tipoDato']
                          })}
                        >
                          <SelectTrigger className="h-8">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="string">Texto</SelectItem>
                            <SelectItem value="number">Número</SelectItem>
                            <SelectItem value="date">Fecha</SelectItem>
                            <SelectItem value="boolean">Verdadero/Falso</SelectItem>
                            <SelectItem value="json">JSON</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Configuraciones */}
                      <div className="space-y-2">
                        <Label className="text-xs font-medium">Config</Label>
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-1">
                            <Switch
                              checked={mapping.requerido}
                              onCheckedChange={(checked) => updateMapping(mapping.id, { requerido: checked })}
                            />
                            <span className="text-xs">Req.</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Switch
                              checked={mapping.activo}
                              onCheckedChange={(checked) => updateMapping(mapping.id, { activo: checked })}
                            />
                            <span className="text-xs">Act.</span>
                          </div>
                        </div>
                        {mapping.transformacion && (
                          <Badge className="text-xs bg-amber-100 text-amber-800">
                            Transformado
                          </Badge>
                        )}
                      </div>

                      {/* Acciones */}
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            alert(`⚙️ CONFIGURACIÓN AVANZADA\n\n🔧 OPCIONES:\n• Transformaciones de datos\n• Validaciones personalizadas\n• Valores por defecto\n• Mapeo condicional\n\n📊 CAMPO: ${mapping.campoDynamicFin} → ${mapping.campoCrm}\n• Tipo: ${mapping.tipoDato}\n• Dirección: ${mapping.direccionSincronizacion}\n• Requerido: ${mapping.requerido ? 'Sí' : 'No'}\n\n🚀 Esta funcionalidad abrirá un editor avanzado`);
                          }}
                        >
                          <Settings className="w-3 h-3" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => deleteMapping(mapping.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>

                    {/* Transformación y valor por defecto */}
                    {(mapping.transformacion || mapping.valorPorDefecto) && (
                      <div className="mt-3 pt-3 border-t grid md:grid-cols-2 gap-4">
                        {mapping.transformacion && (
                          <div className="space-y-1">
                            <Label className="text-xs font-medium">Transformación</Label>
                            <Input
                              value={mapping.transformacion}
                              onChange={(e) => updateMapping(mapping.id, { transformacion: e.target.value })}
                              placeholder="ej: multiply_by_0.052"
                              className="h-7 text-xs"
                            />
                          </div>
                        )}
                        {mapping.valorPorDefecto && (
                          <div className="space-y-1">
                            <Label className="text-xs font-medium">Valor por Defecto</Label>
                            <Input
                              value={mapping.valorPorDefecto}
                              onChange={(e) => updateMapping(mapping.id, { valorPorDefecto: e.target.value })}
                              placeholder="Valor si campo está vacío"
                              className="h-7 text-xs"
                            />
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Información y Ayuda */}
      <Card className="border-green-200 bg-green-50">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-green-600 mt-0.5" />
            <div className="space-y-2">
              <h4 className="font-semibold text-green-800">Consejos de Configuración</h4>
              <div className="grid md:grid-cols-2 gap-4 text-sm text-green-700">
                <div>
                  <p className="font-medium">🔄 Sincronización Bidireccional:</p>
                  <p>Los datos se sincronizan en ambas direcciones automáticamente.</p>
                </div>
                <div>
                  <p className="font-medium">⚙️ Transformaciones:</p>
                  <p>Convierte datos entre formatos (ej: MXN a USD, fechas, etc.).</p>
                </div>
                <div>
                  <p className="font-medium">✅ Campos Requeridos:</p>
                  <p>La sincronización falla si estos campos están vacíos.</p>
                </div>
                <div>
                  <p className="font-medium">🎯 Mapeo Específico:</p>
                  <p>Cada CRM tiene estructura diferente de campos.</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
