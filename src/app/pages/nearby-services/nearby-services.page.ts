import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar,
  IonButtons,
  IonBackButton,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardSubtitle,
  IonCardContent,
  IonList,
  IonLabel,
  IonIcon,
  IonChip,
  IonButton,
  IonSegment,
  IonSegmentButton,
} from '@ionic/angular/standalone';
import { trigger, transition, style, animate } from '@angular/animations';

export interface Service {
  id: string;
  name: string;
  type: 'veterinaria' | 'medico' | 'peluqueria';
  address: string;
  phone: string;
  rating: number;
  distance: number;
  isOpen: boolean;
  services: string[];
  image?: string;
}

@Component({
  selector: 'app-nearby-services',
  templateUrl: './nearby-services.page.html',
  styleUrls: ['./nearby-services.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonContent,
    IonHeader,
    IonTitle,
    IonToolbar,
    IonButtons,
    IonBackButton,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardSubtitle,
    IonCardContent,
    IonList,
    IonLabel,
    IonIcon,
    IonChip,
    IonButton,
    IonSegment,
    IonSegmentButton,
  ],
  animations: [
    trigger('fadeIn', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(10px)' }),
        animate('300ms ease-out', style({ opacity: 1, transform: 'translateY(0)' })),
      ]),
    ]),
  ],
})
export class NearbyServicesPage implements OnInit {
  selectedFilter: 'all' | 'veterinaria' | 'medico' | 'peluqueria' = 'all';
  
  allServices: Service[] = [
    // Veterinarias
    {
      id: 'vet1',
      name: 'Veterinaria Central',
      type: 'veterinaria',
      address: 'Av. Providencia 1234, Providencia',
      phone: '+56 2 2345 6789',
      rating: 4.5,
      distance: 2.3,
      isOpen: true,
      services: ['Consultas', 'Vacunas', 'Cirugía', 'Laboratorio'],
      image: 'https://via.placeholder.com/150?text=Vet1'
    },
    {
      id: 'vet2',
      name: 'Clínica Animal 24h',
      type: 'veterinaria',
      address: 'Las Condes 5678, Las Condes',
      phone: '+56 2 3456 7890',
      rating: 4.8,
      distance: 5.1,
      isOpen: true,
      services: ['Emergencias 24h', 'Hospitalización', 'Cirugía', 'Rayos X'],
      image: 'https://via.placeholder.com/150?text=Vet2'
    },
    {
      id: 'vet3',
      name: 'Hospital Veterinario UC',
      type: 'veterinaria',
      address: 'Av. Vicuña Mackenna 4860, Macul',
      phone: '+56 2 4567 8901',
      rating: 4.9,
      distance: 8.7,
      isOpen: true,
      services: ['Especialidades', 'Cirugía compleja', 'Oncología', 'Cardiología'],
      image: 'https://via.placeholder.com/150?text=Vet3'
    },
    // Médicos Veterinarios
    {
      id: 'med1',
      name: 'Dr. Carlos Méndez - Veterinario',
      type: 'medico',
      address: 'Av. Las Condes 8901, Las Condes',
      phone: '+56 9 1234 5678',
      rating: 4.7,
      distance: 3.5,
      isOpen: true,
      services: ['Consultas generales', 'Cirugía', 'Dermatología'],
      image: 'https://via.placeholder.com/150?text=Med1'
    },
    {
      id: 'med2',
      name: 'Dra. María González - Veterinaria',
      type: 'medico',
      address: 'Av. Apoquindo 2345, Las Condes',
      phone: '+56 9 2345 6789',
      rating: 4.6,
      distance: 4.2,
      isOpen: true,
      services: ['Consultas', 'Vacunación', 'Medicina preventiva'],
      image: 'https://via.placeholder.com/150?text=Med2'
    },
    {
      id: 'med3',
      name: 'Dr. Roberto Silva - Especialista',
      type: 'medico',
      address: 'Av. Providencia 3456, Providencia',
      phone: '+56 9 3456 7890',
      rating: 4.9,
      distance: 1.8,
      isOpen: false,
      services: ['Cardiología', 'Oftalmología', 'Neurología'],
      image: 'https://via.placeholder.com/150?text=Med3'
    },
    // Peluquerías
    {
      id: 'pel1',
      name: 'Peluquería Canina Happy Paws',
      type: 'peluqueria',
      address: 'Av. Providencia 1234, Providencia',
      phone: '+56 2 5678 9012',
      rating: 4.4,
      distance: 2.1,
      isOpen: true,
      services: ['Corte de pelo', 'Baño', 'Corte de uñas', 'Limpieza dental'],
      image: 'https://via.placeholder.com/150?text=Pel1'
    },
    {
      id: 'pel2',
      name: 'Spa Mascotas Premium',
      type: 'peluqueria',
      address: 'Las Condes 7890, Las Condes',
      phone: '+56 2 6789 0123',
      rating: 4.7,
      distance: 5.8,
      isOpen: true,
      services: ['Spa completo', 'Masajes', 'Aromaterapia', 'Corte premium'],
      image: 'https://via.placeholder.com/150?text=Pel2'
    },
    {
      id: 'pel3',
      name: 'Estética Animal Express',
      type: 'peluqueria',
      address: 'Av. Apoquindo 4567, Las Condes',
      phone: '+56 2 7890 1234',
      rating: 4.3,
      distance: 4.5,
      isOpen: true,
      services: ['Corte rápido', 'Baño express', 'Corte de uñas'],
      image: 'https://via.placeholder.com/150?text=Pel3'
    },
  ];

  get filteredServices(): Service[] {
    if (this.selectedFilter === 'all') {
      return this.allServices;
    }
    return this.allServices.filter(service => service.type === this.selectedFilter);
  }

  constructor() {}

  ngOnInit() {}

  onFilterChange(event: any) {
    this.selectedFilter = event.detail.value;
  }

  getServiceIcon(type: string): string {
    switch (type) {
      case 'veterinaria':
        return 'medical';
      case 'medico':
        return 'person';
      case 'peluqueria':
        return 'create-outline';
      default:
        return 'location';
    }
  }

  getServiceTypeLabel(type: string): string {
    switch (type) {
      case 'veterinaria':
        return 'Veterinaria';
      case 'medico':
        return 'Médico Veterinario';
      case 'peluqueria':
        return 'Peluquería';
      default:
        return type;
    }
  }

  callService(phone: string): void {
    window.open(`tel:${phone}`, '_blank');
  }

  openInMaps(address: string): void {
    const encodedAddress = encodeURIComponent(address);
    window.open(`https://www.google.com/maps/search/?api=1&query=${encodedAddress}`, '_blank');
  }

  formatDistance(distance: number): string {
    if (distance < 1) {
      return `${Math.round(distance * 1000)} m`;
    }
    return `${distance.toFixed(1)} km`;
  }

  trackByService(index: number, service: Service): string {
    return service.id;
  }
}

