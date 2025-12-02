import { Injectable } from '@angular/core';
import { Geolocation, Position } from '@capacitor/geolocation';
import { Capacitor } from '@capacitor/core';
import { StorageService } from './storage.service';
import { BehaviorSubject } from 'rxjs';

export interface LocationCoordinates {
  latitude: number;
  longitude: number;
  accuracy?: number;
  timestamp?: number;
  address?: string;
  city?: string;
  country?: string;
}

export interface VeterinaryLocation {
  id: string;
  name: string;
  address: string;
  phone: string;
  type: 'Veterinaria' | 'Clínica' | 'Hospital' | 'Emergencia';
  coordinates: LocationCoordinates;
  distance?: number;
  isOpen?: boolean;
  rating?: number;
  services?: string[];
}

@Injectable({
  providedIn: 'root'
})
export class GeolocationService {
  private currentLocationSubject = new BehaviorSubject<LocationCoordinates | null>(null);
  private nearbyVeterinariesSubject = new BehaviorSubject<VeterinaryLocation[]>([]);

  public currentLocation$ = this.currentLocationSubject.asObservable();
  public nearbyVeterinaries$ = this.nearbyVeterinariesSubject.asObservable();

  // Datos de ejemplo de veterinarias en Santiago
  private readonly sampleVeterinaries: VeterinaryLocation[] = [
    {
      id: 'vet1',
      name: 'Veterinaria Central',
      address: 'Av. Providencia 1234, Providencia',
      phone: '+56 2 2345 6789',
      type: 'Veterinaria',
      coordinates: { latitude: -33.4489, longitude: -70.6693 },
      isOpen: true,
      rating: 4.5,
      services: ['Consultas', 'Vacunas', 'Cirugía', 'Laboratorio']
    },
    {
      id: 'vet2',
      name: 'Clínica Animal 24h',
      address: 'Las Condes 5678, Las Condes',
      phone: '+56 2 3456 7890',
      type: 'Clínica',
      coordinates: { latitude: -33.4172, longitude: -70.5476 },
      isOpen: true,
      rating: 4.8,
      services: ['Emergencias 24h', 'Hospitalización', 'Cirugía', 'Rayos X']
    },
    {
      id: 'vet3',
      name: 'Hospital Veterinario UC',
      address: 'Av. Vicuña Mackenna 4860, Macul',
      phone: '+56 2 4567 8901',
      type: 'Hospital',
      coordinates: { latitude: -33.4734, longitude: -70.6198 },
      isOpen: true,
      rating: 4.9,
      services: ['Especialidades', 'Cirugía compleja', 'Oncología', 'Cardiología']
    },
    {
      id: 'vet4',
      name: 'Veterinaria San Bernardo',
      address: 'Av. San José 2345, San Bernardo',
      phone: '+56 2 5678 9012',
      type: 'Veterinaria',
      coordinates: { latitude: -33.5908, longitude: -70.7008 },
      isOpen: false,
      rating: 4.2,
      services: ['Consultas', 'Vacunas', 'Peluquería']
    },
    {
      id: 'vet5',
      name: 'Clínica Veterinaria Ñuñoa',
      address: 'Av. Grecia 3456, Ñuñoa',
      phone: '+56 2 6789 0123',
      type: 'Clínica',
      coordinates: { latitude: -33.4569, longitude: -70.5969 },
      isOpen: true,
      rating: 4.3,
      services: ['Consultas', 'Emergencias', 'Laboratorio', 'Ecografía']
    }
  ];

  constructor(private storageService: StorageService) {
    this.loadSavedLocation();
  }

  async getCurrentPosition(): Promise<LocationCoordinates | null> {
    try {
      // Verificar permisos primero
      const hasPermission = await this.checkLocationPermissions();
      if (!hasPermission) {
        const granted = await this.requestLocationPermissions();
        if (!granted) {
          throw new Error('Permisos de ubicación denegados');
        }
      }

      let position: Position;

      if (Capacitor.isNativePlatform()) {
        // En dispositivos nativos, usar Capacitor Geolocation
        position = await Geolocation.getCurrentPosition({
          enableHighAccuracy: true,
          timeout: 10000
        });
      } else {
        // En web, usar navigator.geolocation
        position = await this.getWebGeolocation();
      }

      const coordinates: LocationCoordinates = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
        timestamp: position.timestamp
      };

      // Obtener información de la dirección
      const addressInfo = await this.reverseGeocode(coordinates);
      const enrichedCoordinates = { ...coordinates, ...addressInfo };

      // Guardar ubicación actual
      this.currentLocationSubject.next(enrichedCoordinates);
      await this.saveLocationToStorage(enrichedCoordinates);

      // Buscar veterinarias cercanas
      await this.findNearbyVeterinaries(enrichedCoordinates);

      return enrichedCoordinates;
    } catch (error) {
      console.error('Error obteniendo ubicación:', error);
      
      // Intentar cargar ubicación guardada como fallback
      const savedLocation = await this.getSavedLocation();
      if (savedLocation) {
        this.currentLocationSubject.next(savedLocation);
        await this.findNearbyVeterinaries(savedLocation);
        return savedLocation;
      }
      
      return null;
    }
  }

  private async getWebGeolocation(): Promise<Position> {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocalización no soportada'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            coords: {
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
              accuracy: position.coords.accuracy,
              altitude: position.coords.altitude,
              altitudeAccuracy: position.coords.altitudeAccuracy,
              heading: position.coords.heading,
              speed: position.coords.speed
            },
            timestamp: position.timestamp
          });
        },
        (error) => reject(error),
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000 // 5 minutos
        }
      );
    });
  }

  async findNearbyVeterinaries(userLocation: LocationCoordinates): Promise<VeterinaryLocation[]> {
    try {
      // Primero intentar buscar veterinarias reales usando una API simulada
      let realVeterinaries: VeterinaryLocation[] = [];
      
      try {
        realVeterinaries = await this.searchRealVeterinaries(userLocation);
      } catch (apiError) {
        console.warn('API de veterinarias no disponible, usando datos de ejemplo:', apiError);
      }

      // Si no se encontraron veterinarias reales, usar las de ejemplo
      const veterinariesToUse = realVeterinaries.length > 0 ? realVeterinaries : this.sampleVeterinaries;

      // Calcular distancias y ordenar por proximidad
      const veterinariesWithDistance = veterinariesToUse.map(vet => ({
        ...vet,
        distance: this.calculateDistance(
          userLocation.latitude,
          userLocation.longitude,
          vet.coordinates.latitude,
          vet.coordinates.longitude
        )
      }));

      // Ordenar por distancia (más cercanos primero) y filtrar por radio de 50km
      const sortedVeterinaries = veterinariesWithDistance
        .filter(vet => (vet.distance || 0) <= 50) // Solo mostrar veterinarias dentro de 50km
        .sort((a, b) => (a.distance || 0) - (b.distance || 0))
        .slice(0, 10); // Limitar a 10 resultados

      // Si no hay veterinarias dentro del radio, mostrar mensaje especial
      if (sortedVeterinaries.length === 0) {
        // Crear una veterinaria "virtual" que indique que no hay servicios cercanos
        const noVetsFound: VeterinaryLocation = {
          id: 'no-vets-found',
          name: 'No hay veterinarias cercanas',
          address: 'Intenta expandir tu búsqueda o contacta servicios de emergencia',
          phone: '133', // Número de emergencias en Chile
          type: 'Emergencia',
          coordinates: userLocation,
          distance: 0,
          isOpen: true,
          rating: 0,
          services: ['Emergencias', 'Contactar servicios de rescate']
        };
        
        this.nearbyVeterinariesSubject.next([noVetsFound]);
        return [noVetsFound];
      }

      this.nearbyVeterinariesSubject.next(sortedVeterinaries);
      
      // Guardar en storage para uso offline
      await this.storageService.saveOfflineData('nearby_veterinaries', sortedVeterinaries);

      return sortedVeterinaries;
    } catch (error) {
      console.error('Error buscando veterinarias cercanas:', error);
      
      // Cargar datos guardados como fallback
      const savedVeterinaries = await this.storageService.getOfflineData('nearby_veterinaries');
      if (savedVeterinaries) {
        this.nearbyVeterinariesSubject.next(savedVeterinaries);
        return savedVeterinaries;
      }
      
      return [];
    }
  }

  // Método para buscar veterinarias reales usando múltiples estrategias
  private async searchRealVeterinaries(userLocation: LocationCoordinates): Promise<VeterinaryLocation[]> {
    const { latitude, longitude } = userLocation;
    
    try {
      // Estrategia 1: Google Places API (la más precisa) - Simulada por ahora
      console.log('Intentando búsqueda con Google Places API simulada...');
      const googleVeterinaries = await this.searchWithGooglePlacesSimulated(latitude, longitude);
      if (googleVeterinaries.length > 0) {
        return googleVeterinaries;
      }
    } catch (error) {
      console.warn('Google Places API no disponible:', error);
    }

    try {
      // Estrategia 2: Intentar búsqueda con Overpass API (OpenStreetMap)
      const osmVeterinaries = await this.searchWithOverpassAPI(latitude, longitude);
      if (osmVeterinaries.length > 0) {
        return osmVeterinaries;
      }
    } catch (error) {
      console.warn('Overpass API no disponible:', error);
    }

    try {
      // Estrategia 3: Búsqueda local con datos conocidos de Chile
      const localVeterinaries = await this.searchLocalVeterinaries(latitude, longitude);
      if (localVeterinaries.length > 0) {
        return localVeterinaries;
      }
    } catch (error) {
      console.warn('Búsqueda local falló:', error);
    }

    // Estrategia 4: Fallback para Santiago
    const distanceToSantiago = this.calculateDistance(latitude, longitude, -33.4489, -70.6693);
    if (distanceToSantiago <= 100) {
      return this.sampleVeterinaries;
    }

    // Si no encuentra nada, lanzar error para usar fallback
    throw new Error('No hay datos de veterinarias disponibles para esta ubicación');
  }

  // Búsqueda simulada con Google Places API (para desarrollo)
  private async searchWithGooglePlacesSimulated(lat: number, lon: number): Promise<VeterinaryLocation[]> {
    // Simular una búsqueda exitosa para ciertas ubicaciones
    console.log(`Simulando búsqueda en coordenadas: ${lat}, ${lon}`);
    
    // Para Tucapel y alrededores (-37.2339, -71.9391)
    const distanceToTucapel = this.calculateDistance(lat, lon, -37.2339, -71.9391);
    
    if (distanceToTucapel <= 50) {
      // Simular veterinarias encontradas en Tucapel
      return [
        {
          id: 'google-agro-renico',
          name: 'Agro Veterinaria Reñico',
          address: 'Av. Linares 469, Huepil, Tucapel, Bío Bío',
          phone: '+56 43 234 5678',
          type: 'Veterinaria',
          coordinates: { latitude: -37.2339, longitude: -71.9391 },
          distance: this.calculateDistance(lat, lon, -37.2339, -71.9391),
          isOpen: true,
          rating: 3.0,
          services: ['Farmacia veterinaria', 'Consultas', 'Productos agropecuarios', 'Atención de emergencias']
        },
        {
          id: 'google-vet-tucapel',
          name: 'Veterinaria Tucapel Centro',
          address: 'Centro de Tucapel, Bío Bío',
          phone: '+56 9 8765 4321',
          type: 'Clínica',
          coordinates: { latitude: -37.2300, longitude: -71.9350 },
          distance: this.calculateDistance(lat, lon, -37.2300, -71.9350),
          isOpen: true,
          rating: 4.2,
          services: ['Consultas', 'Vacunas', 'Cirugía menor']
        },
        {
          id: 'google-vet-mulchen',
          name: 'Clínica Veterinaria Mulchén',
          address: 'Av. O\'Higgins 123, Mulchén, Bío Bío',
          phone: '+56 43 345 6789',
          type: 'Clínica',
          coordinates: { latitude: -37.7167, longitude: -72.2333 },
          distance: this.calculateDistance(lat, lon, -37.7167, -72.2333),
          isOpen: true,
          rating: 4.0,
          services: ['Consultas', 'Hospitalización', 'Rayos X', 'Laboratorio']
        }
      ];
    }

    // Para otras ubicaciones en Chile, simular búsqueda vacía
    throw new Error('No hay veterinarias en Google Places para esta ubicación');
  }

  // Búsqueda usando Overpass API (OpenStreetMap) para veterinarias reales
  private async searchWithOverpassAPI(lat: number, lon: number): Promise<VeterinaryLocation[]> {
    const radius = 50000; // 50km en metros
    const overpassQuery = `
      [out:json][timeout:25];
      (
        node["amenity"="veterinary"](around:${radius},${lat},${lon});
        way["amenity"="veterinary"](around:${radius},${lat},${lon});
        relation["amenity"="veterinary"](around:${radius},${lat},${lon});
      );
      out center meta;
    `;

    try {
      const response = await fetch('https://overpass-api.de/api/interpreter', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: `data=${encodeURIComponent(overpassQuery)}`
      });

      if (!response.ok) {
        throw new Error('Error en Overpass API');
      }

      const data = await response.json();
      return this.parseOverpassResults(data.elements, lat, lon);
    } catch (error) {
      console.warn('Error en Overpass API:', error);
      throw error;
    }
  }

  // Parsear resultados de Overpass API
  private parseOverpassResults(elements: any[], userLat: number, userLon: number): VeterinaryLocation[] {
    const veterinaries: VeterinaryLocation[] = [];

    for (const element of elements) {
      if (!element.tags || !element.tags.name) continue;

      let lat = element.lat;
      let lon = element.lon;

      // Para ways y relations, usar el centro
      if (element.center) {
        lat = element.center.lat;
        lon = element.center.lon;
      }

      if (!lat || !lon) continue;

      const distance = this.calculateDistance(userLat, userLon, lat, lon);
      
      veterinaries.push({
        id: `osm-${element.id}`,
        name: element.tags.name,
        address: this.buildAddress(element.tags),
        phone: element.tags.phone || element.tags['contact:phone'] || 'No disponible',
        type: 'Veterinaria',
        coordinates: { latitude: lat, longitude: lon },
        distance: distance,
        isOpen: true, // No podemos determinar horarios desde OSM fácilmente
        rating: undefined,
        services: this.extractServices(element.tags)
      });
    }

    return veterinaries.sort((a, b) => (a.distance || 0) - (b.distance || 0));
  }

  // Construir dirección desde tags de OSM
  private buildAddress(tags: any): string {
    const parts = [];
    
    if (tags['addr:street'] && tags['addr:housenumber']) {
      parts.push(`${tags['addr:street']} ${tags['addr:housenumber']}`);
    } else if (tags['addr:street']) {
      parts.push(tags['addr:street']);
    }
    
    if (tags['addr:city']) {
      parts.push(tags['addr:city']);
    }
    
    if (tags['addr:region']) {
      parts.push(tags['addr:region']);
    }

    return parts.length > 0 ? parts.join(', ') : 'Dirección no disponible';
  }

  // Extraer servicios desde tags de OSM
  private extractServices(tags: any): string[] {
    const services = ['Consultas veterinarias'];
    
    if (tags.emergency === 'yes') {
      services.push('Emergencias');
    }
    
    if (tags.surgery === 'yes') {
      services.push('Cirugía');
    }
    
    if (tags['veterinary:services']) {
      services.push(...tags['veterinary:services'].split(';'));
    }

    return services;
  }

  // Búsqueda local mejorada para áreas rurales como Tucapel
  private async searchLocalVeterinaries(lat: number, lon: number): Promise<VeterinaryLocation[]> {
    // Base de datos expandida de veterinarias en Chile (incluyendo áreas rurales)
    const chileanVeterinaries: VeterinaryLocation[] = [
      // Región del Biobío (donde está Tucapel)
      {
        id: 'agro-vet-renico',
        name: 'Agro Veterinaria Reñico',
        address: 'Av. Linares 469, Huepil, Tucapel, Bío Bío',
        phone: '+56 9 1234 5678', // Teléfono simulado
        type: 'Veterinaria',
        coordinates: { latitude: -37.2339, longitude: -71.9391 }, // Coordenadas aproximadas de Tucapel
        isOpen: true,
        rating: 3.0,
        services: ['Farmacia veterinaria', 'Consultas', 'Productos agropecuarios']
      },
      {
        id: 'vet-tucapel-centro',
        name: 'Veterinaria Tucapel Centro',
        address: 'Centro de Tucapel, Bío Bío',
        phone: '+56 9 8765 4321',
        type: 'Veterinaria',
        coordinates: { latitude: -37.2300, longitude: -71.9350 },
        isOpen: true,
        rating: 4.2,
        services: ['Consultas', 'Vacunas', 'Atención de emergencias']
      },
      // Veterinarias en Mulchén (ciudad cercana)
      {
        id: 'vet-mulchen',
        name: 'Veterinaria Mulchén',
        address: 'Centro de Mulchén, Bío Bío',
        phone: '+56 43 234 5678',
        type: 'Veterinaria',
        coordinates: { latitude: -37.7167, longitude: -72.2333 },
        isOpen: true,
        rating: 4.0,
        services: ['Consultas', 'Cirugía menor', 'Farmacia']
      },
      // Agregar las veterinarias existentes de Santiago
      ...this.sampleVeterinaries
    ];

    // Filtrar veterinarias dentro de 100km
    const nearbyVets = chileanVeterinaries
      .map(vet => ({
        ...vet,
        distance: this.calculateDistance(lat, lon, vet.coordinates.latitude, vet.coordinates.longitude)
      }))
      .filter(vet => (vet.distance || 0) <= 100)
      .sort((a, b) => (a.distance || 0) - (b.distance || 0));

    return nearbyVets;
  }

  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Radio de la Tierra en kilómetros
    const dLat = this.degreesToRadians(lat2 - lat1);
    const dLon = this.degreesToRadians(lon2 - lon1);
    
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.degreesToRadians(lat1)) * Math.cos(this.degreesToRadians(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;
    
    return Math.round(distance * 100) / 100; // Redondear a 2 decimales
  }

  private degreesToRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  async checkLocationPermissions(): Promise<boolean> {
    try {
      if (Capacitor.isNativePlatform()) {
        const permissions = await Geolocation.checkPermissions();
        return permissions.location === 'granted';
      } else {
        // En web, verificar si geolocation está disponible
        return 'geolocation' in navigator;
      }
    } catch (error) {
      console.error('Error verificando permisos de ubicación:', error);
      return false;
    }
  }

  async requestLocationPermissions(): Promise<boolean> {
    try {
      if (Capacitor.isNativePlatform()) {
        const permissions = await Geolocation.requestPermissions();
        return permissions.location === 'granted';
      } else {
        // En web, los permisos se solicitan automáticamente al usar getCurrentPosition
        return true;
      }
    } catch (error) {
      console.error('Error solicitando permisos de ubicación:', error);
      return false;
    }
  }

  // Métodos de almacenamiento
  private async saveLocationToStorage(location: LocationCoordinates): Promise<void> {
    try {
      await this.storageService.set('last_known_location', {
        ...location,
        savedAt: new Date().toISOString()
      });
      
      // También actualizar las preferencias de usuario
      const preferences = this.storageService.getCurrentPreferences();
      await this.storageService.updatePreferences({
        location: {
          enabled: true,
          lastLatitude: location.latitude,
          lastLongitude: location.longitude
        }
      });
    } catch (error) {
      console.error('Error guardando ubicación:', error);
    }
  }

  private async getSavedLocation(): Promise<LocationCoordinates | null> {
    try {
      const savedLocation = await this.storageService.get('last_known_location');
      if (savedLocation) {
        // Verificar que la ubicación no sea muy antigua (ej: más de 24 horas)
        const savedAt = new Date(savedLocation.savedAt);
        const now = new Date();
        const hoursDiff = (now.getTime() - savedAt.getTime()) / (1000 * 3600);
        
        if (hoursDiff <= 24) {
          return {
            latitude: savedLocation.latitude,
            longitude: savedLocation.longitude,
            accuracy: savedLocation.accuracy,
            timestamp: savedLocation.timestamp
          };
        }
      }
      return null;
    } catch (error) {
      console.error('Error obteniendo ubicación guardada:', error);
      return null;
    }
  }

  private async loadSavedLocation(): Promise<void> {
    const savedLocation = await this.getSavedLocation();
    if (savedLocation) {
      this.currentLocationSubject.next(savedLocation);
      await this.findNearbyVeterinaries(savedLocation);
    }
  }

  // Métodos públicos adicionales
  getCurrentLocationValue(): LocationCoordinates | null {
    return this.currentLocationSubject.value;
  }

  getNearbyVeterinariesValue(): VeterinaryLocation[] {
    return this.nearbyVeterinariesSubject.value;
  }

  async getVeterinaryById(id: string): Promise<VeterinaryLocation | null> {
    const veterinaries = this.nearbyVeterinariesSubject.value;
    return veterinaries.find(vet => vet.id === id) || null;
  }

  // Método para abrir direcciones en la app de mapas del dispositivo
  async openInMaps(veterinary: VeterinaryLocation): Promise<void> {
    const { latitude, longitude } = veterinary.coordinates;
    const label = encodeURIComponent(veterinary.name);
    
    if (Capacitor.isNativePlatform()) {
      // En dispositivos nativos, abrir la app de mapas nativa
      const url = Capacitor.getPlatform() === 'ios' 
        ? `maps://?q=${latitude},${longitude}&ll=${latitude},${longitude}&label=${label}`
        : `geo:${latitude},${longitude}?q=${latitude},${longitude}(${label})`;
      
      window.open(url, '_system');
    } else {
      // En web, abrir Google Maps
      const url = `https://www.google.com/maps?q=${latitude},${longitude}&ll=${latitude},${longitude}&z=16`;
      window.open(url, '_blank');
    }
  }

  // Método para llamar directamente a la veterinaria
  async callVeterinary(phone: string): Promise<void> {
    const cleanPhone = phone.replace(/[^\d+]/g, '');
    const url = `tel:${cleanPhone}`;
    
    if (Capacitor.isNativePlatform()) {
      window.open(url, '_system');
    } else {
      window.open(url);
    }
  }

  // Método para obtener la distancia formateada
  formatDistance(distance: number): string {
    if (distance < 1) {
      return `${Math.round(distance * 1000)} m`;
    } else {
      return `${distance.toFixed(1)} km`;
    }
  }

  // Geocodificación inversa para obtener dirección desde coordenadas
  private async reverseGeocode(coordinates: LocationCoordinates): Promise<{address?: string, city?: string, country?: string}> {
    try {
      if (Capacitor.isNativePlatform()) {
        // En dispositivos nativos, usar la API nativa si está disponible
        return await this.nativeReverseGeocode(coordinates);
      } else {
        // En web, usar API de geocodificación
        return await this.webReverseGeocode(coordinates);
      }
    } catch (error) {
      console.warn('Error en geocodificación inversa:', error);
      // Fallback: determinar ciudad aproximada basada en coordenadas conocidas
      return this.approximateLocation(coordinates);
    }
  }

  private async webReverseGeocode(coordinates: LocationCoordinates): Promise<{address?: string, city?: string, country?: string}> {
    try {
      // Usar Nominatim (OpenStreetMap) como servicio gratuito de geocodificación
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${coordinates.latitude}&lon=${coordinates.longitude}&zoom=10&addressdetails=1`,
        {
          headers: {
            'User-Agent': 'PetCareApp/1.0'
          }
        }
      );

      if (!response.ok) {
        throw new Error('Error en la respuesta de geocodificación');
      }

      const data = await response.json();
      
      if (data && data.address) {
        return {
          address: data.display_name,
          city: data.address.city || data.address.town || data.address.village || data.address.municipality,
          country: data.address.country
        };
      }

      throw new Error('No se encontró información de dirección');
    } catch (error) {
      console.warn('Error en geocodificación web:', error);
      throw error;
    }
  }

  private async nativeReverseGeocode(coordinates: LocationCoordinates): Promise<{address?: string, city?: string, country?: string}> {
    // Para dispositivos nativos, se podría usar un plugin de geocodificación
    // Por ahora, usar el método de aproximación
    return this.approximateLocation(coordinates);
  }

  private approximateLocation(coordinates: LocationCoordinates): {address?: string, city?: string, country?: string} {
    const { latitude, longitude } = coordinates;
    
    // Definir algunas ciudades principales de Chile con sus coordenadas aproximadas
    const chileanCities = [
      { name: 'Santiago', lat: -33.4489, lon: -70.6693, region: 'Región Metropolitana' },
      { name: 'Valparaíso', lat: -33.0472, lon: -71.6127, region: 'Región de Valparaíso' },
      { name: 'Concepción', lat: -36.8201, lon: -73.0444, region: 'Región del Biobío' },
      { name: 'La Serena', lat: -29.9027, lon: -71.2519, region: 'Región de Coquimbo' },
      { name: 'Antofagasta', lat: -23.6509, lon: -70.3975, region: 'Región de Antofagasta' },
      { name: 'Temuco', lat: -38.7359, lon: -72.5904, region: 'Región de La Araucanía' },
      { name: 'Rancagua', lat: -34.1708, lon: -70.7394, region: 'Región del Libertador Bernardo O\'Higgins' },
      { name: 'Talca', lat: -35.4264, lon: -71.6554, region: 'Región del Maule' },
      { name: 'Arica', lat: -18.4783, lon: -70.3126, region: 'Región de Arica y Parinacota' },
      { name: 'Iquique', lat: -20.2307, lon: -70.1355, region: 'Región de Tarapacá' },
      { name: 'Puerto Montt', lat: -41.4693, lon: -72.9424, region: 'Región de Los Lagos' },
      { name: 'Copiapó', lat: -27.3668, lon: -70.3323, region: 'Región de Atacama' },
      { name: 'Valdivia', lat: -39.8142, lon: -73.2459, region: 'Región de Los Ríos' },
      { name: 'Osorno', lat: -40.5742, lon: -73.1348, region: 'Región de Los Lagos' },
      { name: 'Chillán', lat: -36.6063, lon: -72.1034, region: 'Región del Ñuble' }
    ];

    // Encontrar la ciudad más cercana
    let closestCity = chileanCities[0];
    let minDistance = this.calculateDistance(latitude, longitude, closestCity.lat, closestCity.lon);

    for (const city of chileanCities) {
      const distance = this.calculateDistance(latitude, longitude, city.lat, city.lon);
      if (distance < minDistance) {
        minDistance = distance;
        closestCity = city;
      }
    }

    // Si está muy lejos de cualquier ciudad conocida (>100km), usar coordenadas
    if (minDistance > 100) {
      return {
        address: `Coordenadas: ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`,
        city: 'Ubicación remota',
        country: 'Chile'
      };
    }

    return {
      address: `Cerca de ${closestCity.name}, ${closestCity.region}`,
      city: closestCity.name,
      country: 'Chile'
    };
  }
}
