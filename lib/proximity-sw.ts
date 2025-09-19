

/**
 * Wrapper para interactuar con el Service Worker de proximidad desde React
 * Proporciona una interfaz limpia para registrar y comunicarse con el SW
 */

export interface ProximityServiceWorkerConfig {
  userConfig: any;
  zones: any[];
}

export interface ProximityServiceWorkerStatus {
  isActive: boolean;
  lastPosition: any;
  activeRecording: any;
  proximityZones: number;
  swVersion: string;
  timestamp: string;
}

export class ProximityServiceWorker {
  private registration: ServiceWorkerRegistration | null = null;
  private isRegistered = false;
  private messageHandlers: Map<string, (data: any) => void> = new Map();

  /**
   * Registrar service worker
   */
  async register(): Promise<boolean> {
    if (!('serviceWorker' in navigator)) {
      console.warn('Service Workers not supported');
      return false;
    }

    try {
      console.log('Registering proximity service worker...');
      
      this.registration = await navigator.serviceWorker.register('/sw-proximity.js', {
        scope: '/',
      });

      console.log('Proximity SW registered:', this.registration);

      // Esperar a que el SW esté activo
      await this.waitForActivation();

      // Configurar listeners de mensajes
      this.setupMessageListeners();

      this.isRegistered = true;
      return true;
    } catch (error) {
      console.error('Error registering proximity service worker:', error);
      return false;
    }
  }

  /**
   * Esperar a que el service worker esté activo
   */
  private async waitForActivation(): Promise<void> {
    if (!this.registration) return;

    return new Promise((resolve) => {
      if (this.registration!.active) {
        resolve();
        return;
      }

      const worker = this.registration!.installing || this.registration!.waiting;
      if (worker) {
        worker.addEventListener('statechange', () => {
          if (worker.state === 'activated') {
            resolve();
          }
        });
      }
    });
  }

  /**
   * Configurar listeners de mensajes
   */
  private setupMessageListeners(): void {
    if (!navigator.serviceWorker) return;

    navigator.serviceWorker.addEventListener('message', (event) => {
      const { type, statusType, command, data } = event.data;

      if (type === 'PROXIMITY_STATUS_UPDATE') {
        const handler = this.messageHandlers.get('status_update');
        if (handler) {
          handler({ statusType, data });
        }
      } else if (type === 'RECORDING_COMMAND') {
        const handler = this.messageHandlers.get('recording_command');
        if (handler) {
          handler({ command, data });
        }
      }
    });
  }

  /**
   * Agregar listener para mensajes del SW
   */
  onMessage(type: string, handler: (data: any) => void): void {
    this.messageHandlers.set(type, handler);
  }

  /**
   * Remover listener de mensajes
   */
  offMessage(type: string): void {
    this.messageHandlers.delete(type);
  }

  /**
   * Enviar mensaje al service worker
   */
  private async sendMessage(type: string, data?: any): Promise<any> {
    if (!this.isRegistered || !this.registration?.active) {
      throw new Error('Service worker not registered or active');
    }

    return new Promise((resolve, reject) => {
      const messageChannel = new MessageChannel();
      
      messageChannel.port1.onmessage = (event) => {
        if (event.data.success) {
          resolve(event.data.data);
        } else {
          reject(new Error(event.data.error));
        }
      };

      this.registration!.active!.postMessage(
        { type, data },
        [messageChannel.port2]
      );
    });
  }

  /**
   * Iniciar monitoreo de proximidad
   */
  async startMonitoring(config: ProximityServiceWorkerConfig): Promise<void> {
    await this.sendMessage('START_PROXIMITY_MONITORING', config);
  }

  /**
   * Detener monitoreo de proximidad
   */
  async stopMonitoring(): Promise<void> {
    await this.sendMessage('STOP_PROXIMITY_MONITORING');
  }

  /**
   * Actualizar configuración
   */
  async updateConfig(config: any): Promise<void> {
    await this.sendMessage('UPDATE_CONFIG', config);
  }

  /**
   * Actualizar zonas
   */
  async updateZones(zones: any[]): Promise<void> {
    await this.sendMessage('UPDATE_ZONES', zones);
  }

  /**
   * Obtener estado actual
   */
  async getStatus(): Promise<ProximityServiceWorkerStatus> {
    return await this.sendMessage('GET_STATUS');
  }

  /**
   * Desregistrar service worker
   */
  async unregister(): Promise<boolean> {
    if (!this.registration) return true;

    try {
      // Detener monitoreo antes de desregistrar
      if (this.isRegistered) {
        await this.stopMonitoring();
      }

      const result = await this.registration.unregister();
      this.isRegistered = false;
      this.registration = null;
      this.messageHandlers.clear();
      
      console.log('Proximity service worker unregistered:', result);
      return result;
    } catch (error) {
      console.error('Error unregistering proximity service worker:', error);
      return false;
    }
  }

  /**
   * Verificar si el SW está registrado
   */
  get isActive(): boolean {
    return this.isRegistered && !!this.registration?.active;
  }

  /**
   * Obtener información de registro
   */
  get registrationInfo(): any {
    if (!this.registration) return null;

    return {
      scope: this.registration.scope,
      installing: !!this.registration.installing,
      waiting: !!this.registration.waiting,
      active: !!this.registration.active,
      updatefound: this.registration.onupdatefound !== null,
    };
  }
}

/**
 * Instancia singleton del service worker
 */
export const proximityServiceWorker = new ProximityServiceWorker();

/**
 * Hook para usar el service worker en React
 */
export function useProximityServiceWorker() {
  const [isRegistered, setIsRegistered] = React?.useState ? React.useState(false) : [false, () => {}];
  const [status, setStatus] = React?.useState ? React.useState<ProximityServiceWorkerStatus | null>(null) : [null, () => {}];

  React?.useEffect?.(() => {
    // Registrar service worker
    const registerSW = async () => {
      const registered = await proximityServiceWorker.register();
      setIsRegistered(registered);
    };

    registerSW();

    // Configurar listeners
    proximityServiceWorker.onMessage('status_update', (data) => {
      console.log('SW Status update:', data);
      // Actualizar estado local si es necesario
    });

    proximityServiceWorker.onMessage('recording_command', (data) => {
      console.log('SW Recording command:', data);
      // Manejar comandos de grabación
    });

    return () => {
      // Limpiar listeners
      proximityServiceWorker.offMessage('status_update');
      proximityServiceWorker.offMessage('recording_command');
    };
  }, []);

  const startMonitoring = async (config: ProximityServiceWorkerConfig) => {
    try {
      await proximityServiceWorker.startMonitoring(config);
      return true;
    } catch (error) {
      console.error('Error starting monitoring:', error);
      return false;
    }
  };

  const stopMonitoring = async () => {
    try {
      await proximityServiceWorker.stopMonitoring();
      return true;
    } catch (error) {
      console.error('Error stopping monitoring:', error);
      return false;
    }
  };

  const updateConfig = async (config: any) => {
    try {
      await proximityServiceWorker.updateConfig(config);
      return true;
    } catch (error) {
      console.error('Error updating config:', error);
      return false;
    }
  };

  const getStatus = async () => {
    try {
      const status = await proximityServiceWorker.getStatus();
      setStatus(status);
      return status;
    } catch (error) {
      console.error('Error getting status:', error);
      return null;
    }
  };

  return {
    isRegistered,
    status,
    startMonitoring,
    stopMonitoring,
    updateConfig,
    getStatus,
    serviceWorker: proximityServiceWorker,
  };
}

// Importar React para el hook (solo si está disponible)
let React: any;
try {
  React = require('react');
} catch (e) {
  // React no disponible, el hook no funcionará
  console.warn('React not available for useProximityServiceWorker hook');
}
