

/**
 * Service Worker para grabación por proximidad
 * Maneja detección de ubicación y grabación automática en background
 */

const SW_VERSION = '1.0.0';
const CACHE_NAME = `proximity-sw-${SW_VERSION}`;
const PROXIMITY_CHECK_INTERVAL = 30000; // 30 segundos
const MAX_DISTANCE_METERS = 1000; // 1km máximo para verificar zonas

// Estado global del service worker
let isActive = false;
let lastPosition = null;
let proximityZones = [];
let userConfig = null;
let watchId = null;
let proximityInterval = null;
let activeRecording = null;

// Cache de recursos necesarios
const CACHE_RESOURCES = [
  '/api/proximity/zones',
  '/api/proximity/configure',
  '/api/proximity/auto-record',
  '/api/proximity/status',
];

/**
 * Instalación del service worker
 */
self.addEventListener('install', (event) => {
  console.log('[SW] Installing proximity service worker version:', SW_VERSION);
  
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] Caching resources');
      return cache.addAll(CACHE_RESOURCES);
    }).then(() => {
      console.log('[SW] Installation completed');
      return self.skipWaiting();
    })
  );
});

/**
 * Activación del service worker
 */
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating proximity service worker');
  
  event.waitUntil(
    // Limpiar caches antiguos
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('[SW] Activation completed');
      return self.clients.claim();
    })
  );
});

/**
 * Manejo de mensajes desde el cliente
 */
self.addEventListener('message', (event) => {
  const { type, data } = event.data;
  
  console.log('[SW] Received message:', type, data);
  
  switch (type) {
    case 'START_PROXIMITY_MONITORING':
      startProximityMonitoring(data);
      event.ports[0].postMessage({ success: true });
      break;
      
    case 'STOP_PROXIMITY_MONITORING':
      stopProximityMonitoring();
      event.ports[0].postMessage({ success: true });
      break;
      
    case 'UPDATE_CONFIG':
      updateConfiguration(data);
      event.ports[0].postMessage({ success: true });
      break;
      
    case 'UPDATE_ZONES':
      updateZones(data);
      event.ports[0].postMessage({ success: true });
      break;
      
    case 'GET_STATUS':
      event.ports[0].postMessage({
        success: true,
        data: getStatus(),
      });
      break;
      
    default:
      console.log('[SW] Unknown message type:', type);
      event.ports[0].postMessage({ success: false, error: 'Unknown message type' });
  }
});

/**
 * Manejo de eventos push para notificaciones
 */
self.addEventListener('push', (event) => {
  if (event.data) {
    const data = event.data.json();
    console.log('[SW] Push received:', data);
    
    const options = {
      body: data.body || 'Evento de proximidad',
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      tag: 'proximity-notification',
      requireInteraction: data.requireInteraction || false,
      actions: data.actions || [],
      data: data.data || {},
    };
    
    event.waitUntil(
      self.registration.showNotification(data.title || 'Grabación por Proximidad', options)
    );
  }
});

/**
 * Manejo de clics en notificaciones
 */
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked:', event.notification.tag);
  
  event.notification.close();
  
  if (event.action === 'confirm_recording') {
    // Confirmar inicio de grabación
    handleConfirmRecording(event.notification.data);
  } else if (event.action === 'cancel_recording') {
    // Cancelar grabación
    handleCancelRecording(event.notification.data);
  } else {
    // Abrir aplicación
    event.waitUntil(
      clients.openWindow('/dashboard')
    );
  }
});

/**
 * Iniciar monitoreo de proximidad
 */
function startProximityMonitoring(config) {
  console.log('[SW] Starting proximity monitoring with config:', config);
  
  if (isActive) {
    console.log('[SW] Proximity monitoring already active');
    return;
  }
  
  isActive = true;
  userConfig = config.userConfig || {};
  proximityZones = config.zones || [];
  
  // Verificar si hay soporte para geolocalización
  if (!navigator.geolocation) {
    console.error('[SW] Geolocation not supported');
    sendStatusUpdate('error', 'Geolocation not supported');
    return;
  }
  
  // Configurar opciones de geolocalización
  const geoOptions = {
    enableHighAccuracy: userConfig.precisonGPS === 'alta',
    timeout: 15000,
    maximumAge: 10000,
  };
  
  // Iniciar watch de posición
  watchId = navigator.geolocation.watchPosition(
    handlePositionUpdate,
    handlePositionError,
    geoOptions
  );
  
  // Configurar verificación periódica
  proximityInterval = setInterval(() => {
    checkProximityStatus();
  }, userConfig.intervaloDeteccion * 1000 || PROXIMITY_CHECK_INTERVAL);
  
  sendStatusUpdate('started', 'Proximity monitoring started');
}

/**
 * Detener monitoreo de proximidad
 */
function stopProximityMonitoring() {
  console.log('[SW] Stopping proximity monitoring');
  
  isActive = false;
  
  if (watchId !== null) {
    navigator.geolocation.clearWatch(watchId);
    watchId = null;
  }
  
  if (proximityInterval) {
    clearInterval(proximityInterval);
    proximityInterval = null;
  }
  
  // Si hay una grabación activa, finalizarla
  if (activeRecording) {
    finishRecording('system_stop');
  }
  
  sendStatusUpdate('stopped', 'Proximity monitoring stopped');
}

/**
 * Actualizar configuración
 */
function updateConfiguration(config) {
  console.log('[SW] Updating configuration:', config);
  userConfig = { ...userConfig, ...config };
  
  // Reiniciar monitoreo si está activo
  if (isActive) {
    stopProximityMonitoring();
    startProximityMonitoring({ userConfig, zones: proximityZones });
  }
}

/**
 * Actualizar zonas de proximidad
 */
function updateZones(zones) {
  console.log('[SW] Updating zones:', zones.length);
  proximityZones = zones || [];
}

/**
 * Obtener estado actual
 */
function getStatus() {
  return {
    isActive,
    lastPosition,
    activeRecording,
    proximityZones: proximityZones.length,
    swVersion: SW_VERSION,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Manejar actualización de posición
 */
function handlePositionUpdate(position) {
  const newPosition = {
    latitude: position.coords.latitude,
    longitude: position.coords.longitude,
    accuracy: position.coords.accuracy,
    timestamp: new Date().toISOString(),
  };
  
  console.log('[SW] Position updated:', newPosition);
  
  lastPosition = newPosition;
  
  // Verificar proximidad a zonas
  checkZoneProximity(newPosition);
  
  // Enviar actualización al cliente
  sendStatusUpdate('position_update', newPosition);
  
  // Log de evento
  logProximityEvent('deteccion_ubicacion', newPosition);
}

/**
 * Manejar errores de posición
 */
function handlePositionError(error) {
  console.error('[SW] Position error:', error);
  
  let message = 'Error de ubicación: ';
  switch (error.code) {
    case error.PERMISSION_DENIED:
      message += 'Permisos denegados';
      break;
    case error.POSITION_UNAVAILABLE:
      message += 'Ubicación no disponible';
      break;
    case error.TIMEOUT:
      message += 'Tiempo agotado';
      break;
    default:
      message += 'Error desconocido';
  }
  
  sendStatusUpdate('position_error', { error: message, code: error.code });
  logProximityEvent('error_gps', null, { error: message, code: error.code });
}

/**
 * Verificar proximidad a zonas
 */
function checkZoneProximity(position) {
  if (!proximityZones.length) return;
  
  let nearestZone = null;
  let minDistance = Infinity;
  
  proximityZones.forEach(zone => {
    const distance = calculateDistance(
      position.latitude,
      position.longitude,
      zone.latitud,
      zone.longitud
    );
    
    if (distance < minDistance) {
      minDistance = distance;
      nearestZone = { ...zone, distance };
    }
  });
  
  if (nearestZone && minDistance <= nearestZone.radioMetros) {
    // Estamos dentro de una zona
    if (!activeRecording) {
      handleZoneEntry(nearestZone, position);
    }
  } else if (activeRecording && minDistance > (activeRecording.zone?.radioMetros || 50)) {
    // Salimos de la zona mientras grabábamos
    handleZoneExit(position);
  }
}

/**
 * Manejar entrada a zona
 */
function handleZoneEntry(zone, position) {
  console.log('[SW] Entering zone:', zone.nombre);
  
  // Verificar si estamos en horario activo
  if (!isZoneActiveNow(zone)) {
    console.log('[SW] Zone not active at this time');
    return;
  }
  
  // Si requiere confirmación, mostrar notificación
  if (userConfig.confirmarAntes) {
    showRecordingConfirmationNotification(zone, position);
  } else {
    // Iniciar grabación automáticamente
    startAutomaticRecording(zone, position);
  }
  
  logProximityEvent('entrada_zona', position, { zonaId: zone.id, zona: zone.nombre });
}

/**
 * Manejar salida de zona
 */
function handleZoneExit(position) {
  console.log('[SW] Exiting zone');
  
  if (activeRecording) {
    finishRecording('zone_exit', position);
  }
  
  logProximityEvent('salida_zona', position, { 
    zonaId: activeRecording?.zone?.id,
    zona: activeRecording?.zone?.nombre 
  });
}

/**
 * Iniciar grabación automática
 */
function startAutomaticRecording(zone, position) {
  console.log('[SW] Starting automatic recording in zone:', zone.nombre);
  
  activeRecording = {
    id: generateRecordingId(),
    zone: zone,
    startTime: new Date().toISOString(),
    position: position,
    type: 'automatic',
  };
  
  // Enviar comando para iniciar grabación real
  sendRecordingCommand('START_RECORDING', {
    zoneId: zone.id,
    zoneName: zone.nombre,
    position: position,
    recordingId: activeRecording.id,
  });
  
  // Mostrar notificación
  showNotification(
    `🎙️ Grabación iniciada`,
    `Grabando automáticamente en ${zone.nombre}`,
    [
      { action: 'stop_recording', title: 'Detener' },
      { action: 'view_app', title: 'Ver App' },
    ]
  );
  
  sendStatusUpdate('recording_started', activeRecording);
  logProximityEvent('grabacion_iniciada', position, { zonaId: zone.id, zona: zone.nombre });
}

/**
 * Finalizar grabación
 */
function finishRecording(reason, position = null) {
  if (!activeRecording) return;
  
  console.log('[SW] Finishing recording, reason:', reason);
  
  const duration = new Date().getTime() - new Date(activeRecording.startTime).getTime();
  
  // Enviar comando para finalizar grabación real
  sendRecordingCommand('STOP_RECORDING', {
    recordingId: activeRecording.id,
    reason: reason,
    duration: Math.floor(duration / 1000),
    position: position,
  });
  
  // Mostrar notificación de finalización
  showNotification(
    '✅ Grabación finalizada',
    `Grabación en ${activeRecording.zone.nombre} completada (${Math.floor(duration / 60000)} min)`,
    [
      { action: 'view_recording', title: 'Ver Grabación' },
      { action: 'view_app', title: 'Abrir App' },
    ]
  );
  
  sendStatusUpdate('recording_finished', { ...activeRecording, duration, reason });
  logProximityEvent('grabacion_finalizada', position, { 
    zonaId: activeRecording.zone.id,
    zona: activeRecording.zone.nombre,
    duracion: Math.floor(duration / 1000),
    razon: reason 
  });
  
  activeRecording = null;
}

/**
 * Mostrar notificación de confirmación
 */
function showRecordingConfirmationNotification(zone, position) {
  showNotification(
    '📍 Zona detectada',
    `¿Iniciar grabación en ${zone.nombre}?`,
    [
      { action: 'confirm_recording', title: 'Iniciar' },
      { action: 'cancel_recording', title: 'Cancelar' },
    ],
    {
      requireInteraction: true,
      data: { zone, position },
    }
  );
}

/**
 * Mostrar notificación
 */
function showNotification(title, body, actions = [], options = {}) {
  if (!userConfig.notificacionesSonido) return;
  
  const notificationOptions = {
    body,
    icon: '/favicon.ico',
    badge: '/favicon.ico',
    tag: 'proximity-notification',
    actions,
    ...options,
  };
  
  self.registration.showNotification(title, notificationOptions);
}

/**
 * Manejar confirmación de grabación
 */
function handleConfirmRecording(data) {
  if (data && data.zone) {
    startAutomaticRecording(data.zone, data.position);
  }
}

/**
 * Manejar cancelación de grabación
 */
function handleCancelRecording(data) {
  console.log('[SW] Recording cancelled by user');
  sendStatusUpdate('recording_cancelled', data);
}

/**
 * Enviar comando de grabación al cliente
 */
function sendRecordingCommand(command, data) {
  console.log('[SW] Sending recording command:', command, data);
  
  // Enviar a todos los clientes conectados
  self.clients.matchAll().then(clients => {
    clients.forEach(client => {
      client.postMessage({
        type: 'RECORDING_COMMAND',
        command,
        data,
        timestamp: new Date().toISOString(),
      });
    });
  });
}

/**
 * Enviar actualización de estado
 */
function sendStatusUpdate(type, data) {
  console.log('[SW] Sending status update:', type, data);
  
  self.clients.matchAll().then(clients => {
    clients.forEach(client => {
      client.postMessage({
        type: 'PROXIMITY_STATUS_UPDATE',
        statusType: type,
        data,
        timestamp: new Date().toISOString(),
      });
    });
  });
}

/**
 * Log de evento de proximidad
 */
function logProximityEvent(eventType, position, additionalData = {}) {
  const logData = {
    tipoEvento: eventType,
    latitud: position?.latitude,
    longitud: position?.longitude,
    precision: position?.accuracy,
    timestamp: new Date().toISOString(),
    swVersion: SW_VERSION,
    ...additionalData,
  };
  
  console.log('[SW] Logging event:', logData);
  
  // Enviar log al servidor (cuando hay conexión)
  if (navigator.onLine) {
    fetch('/api/proximity/status', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(logData),
    }).catch(error => {
      console.error('[SW] Error logging event:', error);
      // Almacenar para reintento posterior
      storeOfflineLog(logData);
    });
  } else {
    storeOfflineLog(logData);
  }
}

/**
 * Almacenar log offline
 */
function storeOfflineLog(logData) {
  // Usar IndexedDB para almacenar logs offline
  console.log('[SW] Storing offline log:', logData);
  // TODO: Implementar almacenamiento en IndexedDB
}

/**
 * Verificar si la zona está activa ahora
 */
function isZoneActiveNow(zone) {
  const now = new Date();
  const currentDay = now.getDay(); // 0 = domingo, 1 = lunes, etc.
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();
  
  // Verificar días activos
  const activeDays = zone.diasActivos.split(',').map(d => parseInt(d));
  const dayToCheck = currentDay === 0 ? 7 : currentDay; // Convertir domingo
  
  if (!activeDays.includes(dayToCheck)) {
    return false;
  }
  
  // Verificar horarios
  if (zone.horariosActivos) {
    try {
      const schedules = JSON.parse(zone.horariosActivos);
      if (Array.isArray(schedules)) {
        return schedules.some(schedule => {
          const startTime = parseTime(schedule.inicio || '00:00');
          const endTime = parseTime(schedule.fin || '23:59');
          const currentTime = currentHour * 60 + currentMinute;
          
          return currentTime >= startTime && currentTime <= endTime;
        });
      }
    } catch (e) {
      console.error('[SW] Error parsing zone schedules:', e);
    }
  }
  
  return true; // Si no hay horarios específicos, asumir activo
}

/**
 * Parsear tiempo HH:MM a minutos
 */
function parseTime(timeStr) {
  const [hours, minutes] = timeStr.split(':').map(n => parseInt(n));
  return hours * 60 + minutes;
}

/**
 * Calcular distancia entre dos puntos
 */
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371000; // Radio de la Tierra en metros
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

/**
 * Generar ID único para grabación
 */
function generateRecordingId() {
  return `rec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Verificación periódica de estado
 */
function checkProximityStatus() {
  if (!isActive) return;
  
  // Verificar si llevamos mucho tiempo sin actualización de posición
  if (lastPosition) {
    const timeSinceLastUpdate = Date.now() - new Date(lastPosition.timestamp).getTime();
    
    if (timeSinceLastUpdate > 300000) { // 5 minutos
      console.log('[SW] No position update for 5 minutes, requesting new position');
      
      navigator.geolocation.getCurrentPosition(
        handlePositionUpdate,
        handlePositionError,
        {
          enableHighAccuracy: userConfig.precisonGPS === 'alta',
          timeout: 10000,
          maximumAge: 0,
        }
      );
    }
  }
  
  // Verificar si hay grabación activa hace mucho tiempo
  if (activeRecording) {
    const recordingDuration = Date.now() - new Date(activeRecording.startTime).getTime();
    const maxDuration = (userConfig.duracionMaxima || 3600) * 1000; // Convertir a ms
    
    if (recordingDuration > maxDuration) {
      console.log('[SW] Recording exceeded maximum duration, stopping');
      finishRecording('max_duration_exceeded');
    }
  }
}

console.log('[SW] Proximity Service Worker loaded, version:', SW_VERSION);
