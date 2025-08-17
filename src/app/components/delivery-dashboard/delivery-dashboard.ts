import { Component, OnInit, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { DeliveryService, Package } from '../../services/delivery.service';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { DialogModule } from 'primeng/dialog';
import { SelectModule } from 'primeng/select';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { io, Socket } from 'socket.io-client';

// Declarar Leaflet para TypeScript cuando se usa CDN
declare var L: any;

@Component({
  selector: 'app-delivery-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, ButtonModule, CardModule, TableModule, TagModule, DialogModule, SelectModule, ToastModule],
  templateUrl: './delivery-dashboard.html',
  styleUrl: './delivery-dashboard.css',
  providers: [MessageService, DeliveryService]
})
export class DeliveryDashboardComponent implements OnInit, AfterViewInit {
  map: any;
  packages: Package[] = [];
  showStatusModal = false;
  updateStatusModalVisible: boolean = false;
  selectedPackage: Package | null = null;
  selectedStatus: string = '';
  private socket: Socket;
  private isSocketConnected = false;
  private currentLocationMarker: any; // Nuevo: para rastrear el marcador de ubicación actual
  statusOptions = [
    { label: 'En Tránsito', value: 'En transito' },
    { label: 'Entregado', value: 'Entregado' },
    { label: 'Regresado', value: 'Regresado' }
  ];
  
  constructor(
    private authService: AuthService,
    private router: Router,
    private deliveryService: DeliveryService,
    private messageService: MessageService
  ) {
    this.socket = io('https://backdelivery2-208787378023.northamerica-south1.run.app/', {
      transports: ['websocket', 'polling'],
      timeout: 20000,
      forceNew: true
    });
    
    // Agregar eventos de conexión para debugging
    this.socket.on('connect', () => {
      console.log('🔌 Conectado al servidor Socket.IO:', this.socket.id);
      this.isSocketConnected = true;
      
      // Unirse a la sala de delivery
      const currentUser = this.authService.getCurrentUser();
      if (currentUser) {
        this.socket.emit('join-room', { userId: currentUser.id, userType: 'delivery' });
        console.log(' Unido a la sala de delivery');
      }
    });
    
    
    this.socket.on('disconnect', () => {
      console.log(' Desconectado del servidor Socket.IO');
      this.isSocketConnected = false;
    });
    
    this.socket.on('connect_error', (error) => {
      console.error(' Error de conexión Socket.IO:', error);
      this.isSocketConnected = false;
    });
  }

  ngOnInit() {
    this.loadMyPackages();
    
    // Esperar un poco antes de iniciar el tracking para que el socket se conecte
    setTimeout(() => {
      this.startLocationTracking();
    }, 2000);
  }

  ngAfterViewInit() {
    this.initMap();
  }

  loadMyPackages() {
    const currentUser = this.authService.getCurrentUser();
    if (currentUser) {
      this.deliveryService.getDeliveryPackages(currentUser.id).subscribe({
        next: (packages) => {
          this.packages = packages;
        },
        error: (error) => {
          console.error('Error loading packages:', error);
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'No se pudieron cargar los paquetes asignados'
          });
        }
      });
    }
  }

  editPackageStatus(packageItem: Package) {
    this.selectedPackage = packageItem;
    this.selectedStatus = packageItem.status;
    this.showStatusModal = true;
  }

  openStatusModal(pkg: any) {
    this.selectedPackage = pkg;           // Asignar el paquete seleccionado
    this.selectedStatus = pkg.status;     // Inicializar el select con el estado actual
    this.updateStatusModalVisible = true; // Abrir el modal
  }

  getStatusClass(status: string) {
  switch (status) {
    case 'En transito': return 'status-in-transit';
    case 'Entregado': return 'status-delivered';
    case 'Regresado': return 'status-returned';
    default: return '';
  }
}

  updateStatus(newStatus: string) {
    if (this.selectedPackage) {
      this.deliveryService.updatePackageStatus(this.selectedPackage.id, newStatus).subscribe({
        next: (updatedPackage) => {
          this.messageService.add({
            severity: 'success',
            summary: 'Éxito',
            detail: 'Estado actualizado correctamente'
          });
          this.loadMyPackages();
          this.closeStatusModal();
        },
        error: (error) => {
          console.error('Error updating status:', error);
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'No se pudo actualizar el estado'
          });
        }
      });
    }
  }
  


  closeStatusModal() {
    this.updateStatusModalVisible = false;
    this.selectedPackage = null;
    this.selectedStatus = '';
  }

  private startLocationTracking() {
    console.log('🎯 Iniciando seguimiento de ubicación...');
    
    if (navigator.geolocation) {
      console.log('✅ Geolocalización disponible');
      
      // Hacer una primera solicitud inmediata
      this.requestLocation();
      
      // Luego cada 10 segundos
      setInterval(() => {
        this.requestLocation();
      }, 10000);
    } else {
      console.error('❌ Geolocalización no disponible en este navegador');
      this.messageService.add({
        severity: 'warn',
        summary: 'Geolocalización no disponible',
        detail: 'Tu navegador no soporta geolocalización'
      });
    }
  }

  private requestLocation() {
    console.log('📍 Solicitando ubicación...');
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        console.log('✅ Ubicación obtenida:', {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy
        });
        
        const location = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          timestamp: new Date().toISOString()
        };
        this.sendLocationUpdate(location);
      },
      (error) => {
        console.error('❌ Error obteniendo ubicación:', {
          code: error.code,
          message: error.message
        });
        
        let errorMessage = 'Error desconocido';
        switch(error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Permisos de ubicación denegados';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Ubicación no disponible';
            break;
          case error.TIMEOUT:
            errorMessage = 'Tiempo de espera agotado';
            break;
        }
        
        this.messageService.add({
          severity: 'error',
          summary: 'Error de ubicación',
          detail: errorMessage
        });
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000
      }
    );
  }

  private sendLocationUpdate(location: { latitude: number; longitude: number; timestamp: string }) {
    const currentUser = this.authService.getCurrentUser();
    
    console.log('👤 Usuario actual:', currentUser?.username);
    console.log('🔌 Socket conectado:', this.socket?.connected);
    console.log('🔌 Estado interno conectado:', this.isSocketConnected);
    
    if (currentUser && this.socket && this.socket.connected && this.isSocketConnected) {
      const locationData = {
        userId: currentUser.id,
        username: currentUser.username,
        latitude: location.latitude,
        longitude: location.longitude,
        timestamp: location.timestamp
      };
      
      console.log('📤 Enviando ubicación:', locationData);
      this.socket.emit('location-update', locationData);
      
      // Actualizar el marcador en el mapa con la ubicación actual
      this.updateCurrentLocationOnMap(location.latitude, location.longitude);
      
      // Mostrar notificación de éxito ocasionalmente
      if (Math.random() < 0.1) { // 10% de las veces
        this.messageService.add({
          severity: 'info',
          summary: 'Ubicación enviada',
          detail: `Lat: ${location.latitude.toFixed(6)}, Lng: ${location.longitude.toFixed(6)}`,
          life: 2000
        });
      }
    } else {
      console.error('❌ No se puede enviar ubicación:', {
        hasUser: !!currentUser,
        hasSocket: !!this.socket,
        socketConnected: this.socket?.connected,
        internalConnected: this.isSocketConnected
      });
      
      // Intentar reconectar si no está conectado
      if (!this.socket.connected) {
        console.log('🔄 Intentando reconectar...');
        this.socket.connect();
      }
    }
  }
  
  private updateCurrentLocationOnMap(latitude: number, longitude: number) {
    // Remover marcador anterior si existe
    if (this.currentLocationMarker) {
      this.map.removeLayer(this.currentLocationMarker);
    }
    
    // Crear icono personalizado para la ubicación actual
    const currentLocationIcon = L.divIcon({
      html: `
        <div class="current-location-marker">
          <i class="pi pi-user" style="color: #4CAF50; font-size: 18px;"></i>
          <div class="location-pulse"></div>
        </div>
      `,
      className: 'custom-current-location-icon',
      iconSize: [30, 30],
      iconAnchor: [15, 15]
    });
    
    // Crear nuevo marcador para la ubicación actual
    this.currentLocationMarker = L.marker([latitude, longitude], { icon: currentLocationIcon })
      .addTo(this.map)
      .bindPopup(`
        <div class="current-location-popup">
          <h4>📍 Mi Ubicación Actual</h4>
          <p><strong>Coordenadas:</strong><br>
          Lat: ${latitude.toFixed(6)}<br>
          Lng: ${longitude.toFixed(6)}</p>
          <p><strong>Última actualización:</strong><br>
          ${new Date().toLocaleTimeString()}</p>
        </div>
      `);
    
    // Centrar el mapa en la ubicación actual
    this.map.setView([latitude, longitude], 15);
  }

  initMap() {
    // Inicializar el mapa centrado en Colombia
    this.map = L.map('deliveryMap').setView([4.7110, -74.0721], 6);
    
    // Cambiar solo el proveedor de tiles, Leaflet sigue igual
    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
      attribution: '© OpenStreetMap contributors © CARTO',
      subdomains: 'abcd',
      maxZoom: 19,
      timeout: 15000
    }).addTo(this.map);

    // Remover los marcadores estáticos - el mapa solo mostrará la ubicación actual del delivery
    console.log('🗺️ Mapa del delivery inicializado - Esperando ubicación actual...');
  }

  agregarMarcadores() {
    const deliveryLocations = [
      { lat: 4.7110, lng: -74.0721, city: 'Bogotá', packages: 2 },
      { lat: 6.2442, lng: -75.5812, city: 'Medellín', packages: 1 },
      { lat: 3.4516, lng: -76.5320, city: 'Cali', packages: 1 },
      { lat: 10.9685, lng: -74.7813, city: 'Barranquilla', packages: 1 },
      { lat: 10.3910, lng: -75.4794, city: 'Cartagena', packages: 1 }
    ];

    deliveryLocations.forEach(location => {
      const icon = L.divIcon({
        html: `<div class="custom-marker delivery-marker">
                 <i class="pi pi-map-marker"></i>
                 <span class="marker-count">${location.packages}</span>
               </div>`,
        className: 'custom-div-icon',
        iconSize: [30, 30],
        iconAnchor: [15, 30]
      });

      L.marker([location.lat, location.lng], { icon })
        .bindPopup(`<b>${location.city}</b><br>${location.packages} entrega(s) asignada(s)`)
        .addTo(this.map);
    });
  }

  getStatusSeverity(status: string) {
    switch (status) {
      case 'En transito': return 'info';
      case 'Entregado': return 'success';
      case 'Regresado': return 'danger';
      default: return 'secondary';
    }
  }

  getStatusLabel(status: string) {
    switch (status) {
      case 'En transito': return 'En Tránsito';
      case 'Entregado': return 'Entregado';
      case 'Regresado': return 'Regresado';
      default: return status;
    }
  }

  getStatusIcon(status: string) {
    switch (status) {
      case 'En transito': return 'pi-truck';
      case 'Entregado': return 'pi-check-circle';
      case 'Regresado': return 'pi-times-circle';
      default: return 'pi-circle';
    }
  }

  getPriorityIcon(priority: string) {
    switch (priority) {
      case 'high': return 'pi-exclamation-triangle';
      case 'medium': return 'pi-minus';
      case 'low': return 'pi-arrow-down';
      default: return 'pi-circle';
    }
  }

  getPriorityLabel(priority: string) {
    switch (priority) {
      case 'high': return 'Alta';
      case 'medium': return 'Media';
      case 'low': return 'Baja';
      default: return priority;
    }
  }

  logout() {
    if (this.socket) {
      this.socket.disconnect();
    }
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
