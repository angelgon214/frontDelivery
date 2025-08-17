import { Component, OnInit, AfterViewInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { AuthService } from '../../services/auth.service';
import { DeliveryService, DeliveryUser, NewPackage, Package } from '../../services/delivery.service';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { io, Socket } from 'socket.io-client';

// Declarar Leaflet para TypeScript cuando se usa CDN
declare var L: any;

interface DeliveryLocation {
  userId: string;
  username: string;
  latitude: number;
  longitude: number;
  timestamp: string;
}

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [
    CommonModule, 
    ReactiveFormsModule,
    HttpClientModule,
    ButtonModule, 
    CardModule, 
    TableModule, 
    TagModule,
    DialogModule,
    InputTextModule,
    SelectModule,
    ToastModule
  ],
  templateUrl: './admin-dashboard.html',
  styleUrl: './admin-dashboard.css',
  providers: [MessageService, DeliveryService]
})
export class AdminDashboardComponent implements OnInit, AfterViewInit, OnDestroy {
  map: any;
  packages: Package[] = [];
  deliveryUsers: DeliveryUser[] = [];
  showNewShipmentModal = false;
  newShipmentForm!: FormGroup;
  creatingShipment = false;
  private socket: Socket;
  private deliveryMarkers: Map<string, any> = new Map(); // Para rastrear marcadores de delivery
  
  // Agregar las opciones de prioridad
  priorityOptions = [
    { label: 'Baja', value: 'low' },
    { label: 'Media', value: 'medium' },
    { label: 'Alta', value: 'high' }
  ];
  
  constructor(
    private authService: AuthService,
    private router: Router,
    private deliveryService: DeliveryService,
    private messageService: MessageService,
    private fb: FormBuilder
  ) {
    this.initializeForm();
    
    // Inicializar Socket.IO para recibir ubicaciones
    this.socket = io('http://localhost:3000', {
      transports: ['websocket', 'polling'],
      timeout: 20000
    });
    
    this.socket.on('connect', () => {
      console.log('🔌 Admin conectado al servidor Socket.IO:', this.socket.id);
      // Unirse a la sala de administradores
      this.socket.emit('join-room', { userId: 'admin', userType: 'admin' });
    });
    
    this.socket.on('location-received', (locationData) => {
      console.log('📍 Ubicación de repartidor recibida:', locationData);
      this.updateDeliveryLocationOnMap(locationData);
      this.updateDeliveryStatus(locationData.userId, 'working');
      
      // NUEVO: Log adicional para debugging
      console.log('📊 Estado actual de deliveries:', this.deliveryUsers.map(d => ({
        id: d.id,
        username: d.username,
        status: d.status
      })));
      
      console.log('📦 Estado de paquetes con delivery asignado:', this.packages
        .filter(p => p.assigned_user)
        .map(p => ({
          packageId: p.id,
          deliveryId: p.assigned_user?.id,
          deliveryUsername: p.assigned_user?.username,
          deliveryStatus: p.assigned_user?.status
        })));
    });
    
    this.socket.on('disconnect', () => {
      console.log('❌ Admin desconectado del servidor Socket.IO');
    });
  }

  private updateDeliveryLocationOnMap(locationData: any) {
    const { userId, username, latitude, longitude, timestamp } = locationData;
    
    // Remover marcador anterior si existe
    if (this.deliveryMarkers.has(userId)) {
      this.map.removeLayer(this.deliveryMarkers.get(userId));
    }
    
    // Crear nuevo marcador para el delivery
    const deliveryIcon = L.divIcon({
      html: `
        <div class="delivery-location-marker">
          <i class="pi pi-user" style="color: #4CAF50; font-size: 16px;"></i>
          <div class="delivery-info">
            <strong>${username}</strong><br>
            <small>${this.formatTimestamp(timestamp)}</small>
          </div>
        </div>
      `,
      className: 'custom-delivery-icon',
      iconSize: [40, 40],
      iconAnchor: [20, 40]
    });
    
    const marker = L.marker([latitude, longitude], { icon: deliveryIcon })
      .addTo(this.map)
      .bindPopup(`
        <div class="delivery-popup">
          <h4>🚚 ${username}</h4>
          <p><strong>Coordenadas:</strong><br>
          Lat: ${latitude.toFixed(6)}<br>
          Lng: ${longitude.toFixed(6)}</p>
          <p><strong>Última actualización:</strong><br>
          ${this.formatTimestamp(timestamp)}</p>
        </div>
      `);
    
    // Guardar referencia del marcador
    this.deliveryMarkers.set(userId, marker);
    
    // NUEVO: Ajustar la vista del mapa para mostrar la ubicación del delivery
    // Si es el primer delivery o si está muy lejos, centrar el mapa
    const currentCenter = this.map.getCenter();
    const distance = this.map.distance([currentCenter.lat, currentCenter.lng], [latitude, longitude]);
    
    // Si la distancia es mayor a 100km o es el primer marcador, ajustar la vista
    if (distance > 100000 || this.deliveryMarkers.size === 1) {
      this.map.setView([latitude, longitude], 12);
      console.log(`🗺️ Mapa centrado en la ubicación de ${username}`);
    }
    
    // Mostrar notificación ocasional
    if (Math.random() < 0.2) { // 20% de las veces
      this.messageService.add({
        severity: 'info',
        summary: 'Ubicación actualizada',
        detail: `${username} está en movimiento`,
        life: 3000
      });
    }
  }
  
  private updateDeliveryStatus(userId: string, status: 'working' | 'off') {
    // Actualizar el estado del delivery en la lista local
    const delivery = this.deliveryUsers.find(d => d.id === userId);
    if (delivery) {
      delivery.status = status;
    }
    
    // NUEVO: También actualizar el estado en los paquetes asignados
    this.packages.forEach(pkg => {
      if (pkg.assigned_user && pkg.assigned_user.id === userId) {
        pkg.assigned_user.status = status;
      }
    });
    
    console.log(`✅ Estado del delivery ${userId} actualizado a: ${status}`);
  }
  
  private formatTimestamp(timestamp: string): string {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) {
      return `hace ${diffInSeconds} segundos`;
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `hace ${minutes} minuto${minutes > 1 ? 's' : ''}`;
    } else {
      const hours = Math.floor(diffInSeconds / 3600);
      return `hace ${hours} hora${hours > 1 ? 's' : ''}`;
    }
  }

  private initializeForm() {
    this.newShipmentForm = this.fb.group({
      deliveryAddress: ['', [Validators.required, Validators.minLength(10)]],
      phone: [''],  // Nuevo campo
      priority: ['medium'],  // Nuevo campo con valor por defecto
      assignedTo: ['']
    });
  }

  onSubmitNewShipment() {
    if (this.newShipmentForm.valid) {
      this.creatingShipment = true;
      
      const packageData: NewPackage = {
        delivery_address: this.newShipmentForm.value.deliveryAddress,
        phone: this.newShipmentForm.value.phone || null,  // Nuevo campo
        priority: this.newShipmentForm.value.priority,  // Nuevo campo
        assigned_to: this.newShipmentForm.value.assignedTo || null,
        status: 'En transito'
      };

      this.deliveryService.createPackage(packageData).subscribe({
        next: (response) => {
          this.messageService.add({
            severity: 'success',
            summary: 'Éxito',
            detail: 'Envío creado exitosamente'
          });
          this.closeNewShipmentModal();
          this.loadPackages();
          this.creatingShipment = false;
        },
        error: (error) => {
          console.error('Error creating package:', error);
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'No se pudo crear el envío'
          });
          this.creatingShipment = false;
        }
      });
    }
  }

  ngOnInit() {
    this.loadDeliveryUsers();
    this.loadPackages();
  }

  ngAfterViewInit() {
    // Initialize map after view is ready
    setTimeout(() => {
      this.initMap();
    }, 100);
  }

  ngOnDestroy() {
    if (this.socket) {
      this.socket.disconnect();
    }
  }

  loadDeliveryUsers() {
    this.deliveryService.getDeliveryUsers().subscribe({
      next: (users) => {
        this.deliveryUsers = users;
      },
      error: (error) => {
        console.error('Error loading delivery users:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudieron cargar los usuarios delivery'
        });
      }
    });
  }

  createNewShipment() {
    console.log('Opening modal...'); // Para debug
    this.showNewShipmentModal = true;
  }

  closeNewShipmentModal() {
    this.showNewShipmentModal = false;
    this.newShipmentForm.reset();
  }

  private loadPackages() {
    this.deliveryService.getPackages().subscribe({
      next: (packages) => {
        this.packages = packages;
      },
      error: (error) => {
        console.error('Error loading packages:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudieron cargar los paquetes'
        });
      }
    });
  }

  initMap() {
    this.map = L.map('adminMap').setView([4.7110, -74.0721], 6);
  
    // Mismo cambio: solo el proveedor de tiles, Leaflet sigue siendo la librería
    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
      attribution: '© OpenStreetMap contributors © CARTO',
      subdomains: 'abcd',
      maxZoom: 19,
      timeout: 15000
    }).addTo(this.map);
  
    // MODIFICADO: Hacer los marcadores de almacén más discretos
    const deliveryPoints = [
      { lat: 4.6097, lng: -74.0817, title: 'Centro de Distribución Principal' },
      { lat: 4.6351, lng: -74.0703, title: 'Punto de Entrega Norte' },
      { lat: 4.5981, lng: -74.0758, title: 'Punto de Entrega Sur' },
      { lat: 4.6244, lng: -74.0647, title: 'Punto de Entrega Este' }
    ];
  
    deliveryPoints.forEach(point => {
      const warehouseIcon = L.divIcon({
        html: `
          <div class="warehouse-marker">
            <i class="pi pi-building" style="color: #2196F3; font-size: 12px; opacity: 0.7;"></i>
          </div>
        `,
        className: 'custom-warehouse-icon',
        iconSize: [20, 20],
        iconAnchor: [10, 10]
      });
  
      L.marker([point.lat, point.lng], { icon: warehouseIcon })
        .addTo(this.map)
        .bindPopup(`<strong>${point.title}</strong>`);
    });
  
    console.log('🗺️ Mapa inicializado - Esperando ubicaciones de repartidores...');
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
