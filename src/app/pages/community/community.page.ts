import { Component, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar,
  IonButtons,
  IonBackButton,
  IonSegment,
  IonSegmentButton,
  IonLabel,
  IonSearchbar,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardSubtitle,
  IonCardContent,
  IonButton,
  IonIcon,
  IonList,
} from '@ionic/angular/standalone';
import { FormsModule } from '@angular/forms';
import { trigger, transition, style, animate } from '@angular/animations';
import { NgForOf } from '@angular/common';

interface CommunityService {
  id: string;
  name: string;
  type: 'Veterinario' | 'Peluquería' | 'Tienda';
  address: string;
  phone: string;
  description: string;
  mapUrl: string;
}

@Component({
  selector: 'app-community',
  templateUrl: './community.page.html',
  styleUrls: ['./community.page.scss'],
  standalone: true,
  imports: [
    IonContent,
    IonHeader,
    IonTitle,
    IonToolbar,
    IonButtons,
    IonBackButton,
    IonSegment,
    IonSegmentButton,
    IonLabel,
    IonSearchbar,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardSubtitle,
    IonCardContent,
    IonButton,
    IonIcon,
    IonList,
    CommonModule,
    FormsModule,
    NgForOf,
  ],
  animations: [
    trigger('fadeIn', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(10px)' }),
        animate('350ms ease-out', style({ opacity: 1, transform: 'translateY(0)' })),
      ]),
    ]),
  ],
})
export class CommunityPage {
  readonly filter = signal<'Todos' | CommunityService['type']>('Todos');
  readonly search = signal('');

  readonly services: CommunityService[] = [
    // Veterinario
    {
      id: '1',
      name: 'Clínica Veterinaria Ñuñoa',
      type: 'Veterinario',
      address: 'Av. Irarrázaval 1784, Ñuñoa, Santiago',
      phone: '+56 2 2273 3310',
      description: 'Atención 24h, hospitalización y laboratorio propio.',
      mapUrl: 'https://maps.google.com/?q=Clínica+Veterinaria+Ñuñoa',
    },
    {
      id: '2',
      name: 'Hospital Veterinario San Bernardo',
      type: 'Veterinario',
      address: 'Av. San José 145, San Bernardo, RM',
      phone: '+56 9 8281 2525',
      description: 'Emergencias, vacunación, especialidades animales.',
      mapUrl: 'https://maps.google.com/?q=Hospital+Veterinario+San+Bernardo',
    },
    {
      id: '3',
      name: 'Veterinaria Providencia',
      type: 'Veterinario',
      address: 'Pedro de Valdivia 431, Providencia, Santiago',
      phone: '+56 2 2234 2234',
      description: 'Consultas, rayos X, laboratorio y farmacia.',
      mapUrl: 'https://maps.google.com/?q=Veterinaria+Providencia',
    },
    // Peluquería
    {
      id: '4',
      name: 'Pet Spa Santiago',
      type: 'Peluquería',
      address: 'Av. Apoquindo 4501, Las Condes, Santiago',
      phone: '+56 2 2219 5700',
      description: 'Baño, corte y spa para perros y gatos.',
      mapUrl: 'https://maps.google.com/?q=Pet+Spa+Santiago',
    },
    {
      id: '5',
      name: 'Peluquería Canina La Reina',
      type: 'Peluquería',
      address: 'María Monvel 9899, La Reina, Santiago',
      phone: '+56 9 8493 3568',
      description: 'Corte, baño y tratamientos antipulgas.',
      mapUrl: 'https://maps.google.com/?q=Peluquería+Canina+La+Reina',
    },
    {
      id: '6',
      name: 'Grooming Chile Spa',
      type: 'Peluquería',
      address: 'Av. Los Leones 1233, Providencia, Santiago',
      phone: '+56 9 8855 4477',
      description: 'Grooming profesional y spa relajante.',
      mapUrl: 'https://maps.google.com/?q=Grooming+Chile+Spa',
    },
    // Tienda
    {
      id: '7',
      name: 'Mascotas Chile Store',
      type: 'Tienda',
      address: 'Manquehue Sur 31, Las Condes, Santiago',
      phone: '+56 2 2224 6633',
      description: 'Alimentos, accesorios y juguetes para mascotas.',
      mapUrl: 'https://maps.google.com/?q=Mascotas+Chile+Store',
    },
    {
      id: '8',
      name: 'Pet Lovers Providencia',
      type: 'Tienda',
      address: 'Av. Providencia 2354, Providencia, Santiago',
      phone: '+56 2 2711 2233',
      description: 'Tienda y delivery de productos para todo tipo de mascotas.',
      mapUrl: 'https://maps.google.com/?q=Pet+Lovers+Providencia',
    },
    {
      id: '9',
      name: 'Tienda Animal Sur',
      type: 'Tienda',
      address: 'Av. Matta 4670, Santiago',
      phone: '+56 2 2555 9876',
      description: 'Alimentos premium, medicamentos y accesorios.',
      mapUrl: 'https://maps.google.com/?q=Tienda+Animal+Sur',
    },
  ];

  readonly filteredServices = computed(() => {
    const filter = this.filter();
    const search = this.search().toLowerCase();
    return this.services.filter((service) => {
      const matchType = filter === 'Todos' || service.type === filter;
      const matchSearch =
        !search ||
        service.name.toLowerCase().includes(search) ||
        service.address.toLowerCase().includes(search);
      return matchType && matchSearch;
    });
  });

  setFilter(value: any): void {
    const parsed = (String(value) as 'Todos' | CommunityService['type']) ?? 'Todos';
    this.filter.set(parsed);
  }

  updateSearch(event: CustomEvent): void {
    const value = (event.detail.value as string) ?? '';
    this.search.set(value);
  }

  openMaps(url: string): void {
    if (typeof window === 'undefined') {
      return;
    }
    window.open(url, '_blank');
  }

  call(phone: string): void {
    if (typeof window === 'undefined') {
      return;
    }
    window.open(`tel:${phone}`, '_blank');
  }

  trackByService(_index: number, service: CommunityService): string {
    return service.id;
  }
}
