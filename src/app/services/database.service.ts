import { Injectable } from '@angular/core';
import { CapacitorSQLite, SQLiteConnection, SQLiteDBConnection } from '@capacitor-community/sqlite';
import { BehaviorSubject } from 'rxjs';
import { Capacitor } from '@capacitor/core';

export interface Pet {
  id?: number;
  name: string;
  species: string;
  breed: string;
  birthDate: string;
  weight: number;
  vetName: string;
  vetPhone: string;
  notes: string;
  avatarUrl?: string;
  userId: string;
}

export interface CareReminder {
  id?: number;
  title: string;
  type: 'Vacuna' | 'Control' | 'Baño' | 'Alimentación' | 'Medicamento';
  scheduledDate: string;
  notes: string;
  completed: boolean;
  petId: number;
}

export interface EmergencyContact {
  id?: number;
  name: string;
  phone: string;
  address: string;
  type: 'Veterinaria' | 'Clínica' | 'Hospital' | 'Emergencia';
  latitude?: number;
  longitude?: number;
}

@Injectable({
  providedIn: 'root'
})
export class DatabaseService {
  private sqlite: SQLiteConnection = new SQLiteConnection(CapacitorSQLite);
  private db: SQLiteDBConnection | null = null;
  private isDbReady = new BehaviorSubject(false);
  
  // BehaviorSubjects para datos reactivos
  private petsSubject = new BehaviorSubject<Pet[]>([]);
  private remindersSubject = new BehaviorSubject<CareReminder[]>([]);
  private emergencyContactsSubject = new BehaviorSubject<EmergencyContact[]>([]);

  // Observables públicos
  public pets$ = this.petsSubject.asObservable();
  public reminders$ = this.remindersSubject.asObservable();
  public emergencyContacts$ = this.emergencyContactsSubject.asObservable();
  public dbReady$ = this.isDbReady.asObservable();

  constructor() {
    this.initializeDatabase();
  }

  private async initializeDatabase() {
    try {
      if (Capacitor.getPlatform() === 'web') {
        // Para web, usar localStorage como fallback
        this.isDbReady.next(true);
        await this.loadDataFromLocalStorage();
        return;
      }

      // Para dispositivos móviles, usar SQLite
      this.db = await this.sqlite.createConnection(
        'petcare_db',
        false,
        'no-encryption',
        1,
        false
      );

      await this.db.open();
      await this.createTables();
      await this.loadInitialData();
      
      this.isDbReady.next(true);
    } catch (error) {
      console.error('Error inicializando base de datos:', error);
      // Fallback a localStorage
      this.isDbReady.next(true);
      await this.loadDataFromLocalStorage();
    }
  }

  private async createTables() {
    if (!this.db) return;

    const createPetsTable = `
      CREATE TABLE IF NOT EXISTS pets (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        species TEXT NOT NULL,
        breed TEXT NOT NULL,
        birthDate TEXT NOT NULL,
        weight REAL NOT NULL,
        vetName TEXT NOT NULL,
        vetPhone TEXT NOT NULL,
        notes TEXT,
        avatarUrl TEXT,
        userId TEXT NOT NULL
      );
    `;

    const createRemindersTable = `
      CREATE TABLE IF NOT EXISTS care_reminders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        type TEXT NOT NULL,
        scheduledDate TEXT NOT NULL,
        notes TEXT,
        completed INTEGER DEFAULT 0,
        petId INTEGER NOT NULL,
        FOREIGN KEY (petId) REFERENCES pets (id)
      );
    `;

    const createEmergencyContactsTable = `
      CREATE TABLE IF NOT EXISTS emergency_contacts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        phone TEXT NOT NULL,
        address TEXT NOT NULL,
        type TEXT NOT NULL,
        latitude REAL,
        longitude REAL
      );
    `;

    await this.db.execute(createPetsTable);
    await this.db.execute(createRemindersTable);
    await this.db.execute(createEmergencyContactsTable);
  }

  private async loadInitialData() {
    // Cargar datos iniciales si no existen
    const emergencyContacts = await this.getAllEmergencyContacts();
    if (emergencyContacts.length === 0) {
      await this.insertInitialEmergencyContacts();
    }
  }

  private async insertInitialEmergencyContacts() {
    const initialContacts: EmergencyContact[] = [
      {
        name: 'Veterinaria Central',
        phone: '+56 2 2345 6789',
        address: 'Av. Providencia 1234, Santiago',
        type: 'Veterinaria',
        latitude: -33.4489,
        longitude: -70.6693
      },
      {
        name: 'Clínica Animal 24h',
        phone: '+56 2 3456 7890',
        address: 'Las Condes 5678, Santiago',
        type: 'Clínica',
        latitude: -33.4172,
        longitude: -70.5476
      },
      {
        name: 'Hospital Veterinario UC',
        phone: '+56 2 4567 8901',
        address: 'Av. Vicuña Mackenna 4860, Santiago',
        type: 'Hospital',
        latitude: -33.4734,
        longitude: -70.6198
      }
    ];

    for (const contact of initialContacts) {
      await this.addEmergencyContact(contact);
    }
  }

  // Métodos para Mascotas
  async addPet(pet: Pet): Promise<boolean> {
    try {
      if (Capacitor.getPlatform() === 'web') {
        return this.addPetToLocalStorage(pet);
      }

      if (!this.db) return false;

      const query = `
        INSERT INTO pets (name, species, breed, birthDate, weight, vetName, vetPhone, notes, avatarUrl, userId)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      await this.db.run(query, [
        pet.name, pet.species, pet.breed, pet.birthDate,
        pet.weight, pet.vetName, pet.vetPhone, pet.notes,
        pet.avatarUrl || '', pet.userId
      ]);

      await this.loadPets();
      return true;
    } catch (error) {
      console.error('Error agregando mascota:', error);
      return false;
    }
  }

  async getPetsByUserId(userId: string): Promise<Pet[]> {
    try {
      if (Capacitor.getPlatform() === 'web') {
        return this.getPetsFromLocalStorage(userId);
      }

      if (!this.db) return [];

      const query = 'SELECT * FROM pets WHERE userId = ?';
      const result = await this.db.query(query, [userId]);
      
      return result.values || [];
    } catch (error) {
      console.error('Error obteniendo mascotas:', error);
      return [];
    }
  }

  async updatePet(pet: Pet): Promise<boolean> {
    try {
      if (Capacitor.getPlatform() === 'web') {
        return this.updatePetInLocalStorage(pet);
      }

      if (!this.db || !pet.id) return false;

      const query = `
        UPDATE pets 
        SET name = ?, species = ?, breed = ?, birthDate = ?, weight = ?, 
            vetName = ?, vetPhone = ?, notes = ?, avatarUrl = ?
        WHERE id = ?
      `;

      await this.db.run(query, [
        pet.name, pet.species, pet.breed, pet.birthDate,
        pet.weight, pet.vetName, pet.vetPhone, pet.notes,
        pet.avatarUrl || '', pet.id
      ]);

      await this.loadPets();
      return true;
    } catch (error) {
      console.error('Error actualizando mascota:', error);
      return false;
    }
  }

  async deletePet(petId: number): Promise<boolean> {
    try {
      if (Capacitor.getPlatform() === 'web') {
        return this.deletePetFromLocalStorage(petId);
      }

      if (!this.db) return false;

      // Eliminar recordatorios asociados
      await this.db.run('DELETE FROM care_reminders WHERE petId = ?', [petId]);
      
      // Eliminar mascota
      await this.db.run('DELETE FROM pets WHERE id = ?', [petId]);

      await this.loadPets();
      await this.loadReminders();
      return true;
    } catch (error) {
      console.error('Error eliminando mascota:', error);
      return false;
    }
  }

  // Métodos para Recordatorios de Cuidado
  async addReminder(reminder: CareReminder): Promise<boolean> {
    try {
      if (Capacitor.getPlatform() === 'web') {
        return this.addReminderToLocalStorage(reminder);
      }

      if (!this.db) return false;

      const query = `
        INSERT INTO care_reminders (title, type, scheduledDate, notes, completed, petId)
        VALUES (?, ?, ?, ?, ?, ?)
      `;

      await this.db.run(query, [
        reminder.title, reminder.type, reminder.scheduledDate,
        reminder.notes, reminder.completed ? 1 : 0, reminder.petId
      ]);

      await this.loadReminders();
      return true;
    } catch (error) {
      console.error('Error agregando recordatorio:', error);
      return false;
    }
  }

  async getRemindersByPetId(petId: number): Promise<CareReminder[]> {
    try {
      if (Capacitor.getPlatform() === 'web') {
        return this.getRemindersFromLocalStorage(petId);
      }

      if (!this.db) return [];

      const query = 'SELECT * FROM care_reminders WHERE petId = ? ORDER BY scheduledDate';
      const result = await this.db.query(query, [petId]);
      
      return (result.values || []).map(row => ({
        ...row,
        completed: row.completed === 1
      }));
    } catch (error) {
      console.error('Error obteniendo recordatorios:', error);
      return [];
    }
  }

  async updateReminder(reminder: CareReminder): Promise<boolean> {
    try {
      if (Capacitor.getPlatform() === 'web') {
        return this.updateReminderInLocalStorage(reminder);
      }

      if (!this.db || !reminder.id) return false;

      const query = `
        UPDATE care_reminders 
        SET title = ?, type = ?, scheduledDate = ?, notes = ?, completed = ?
        WHERE id = ?
      `;

      await this.db.run(query, [
        reminder.title, reminder.type, reminder.scheduledDate,
        reminder.notes, reminder.completed ? 1 : 0, reminder.id
      ]);

      await this.loadReminders();
      return true;
    } catch (error) {
      console.error('Error actualizando recordatorio:', error);
      return false;
    }
  }

  // Métodos para Contactos de Emergencia
  async addEmergencyContact(contact: EmergencyContact): Promise<boolean> {
    try {
      if (Capacitor.getPlatform() === 'web') {
        return this.addEmergencyContactToLocalStorage(contact);
      }

      if (!this.db) return false;

      const query = `
        INSERT INTO emergency_contacts (name, phone, address, type, latitude, longitude)
        VALUES (?, ?, ?, ?, ?, ?)
      `;

      await this.db.run(query, [
        contact.name, contact.phone, contact.address, contact.type,
        contact.latitude || null, contact.longitude || null
      ]);

      await this.loadEmergencyContacts();
      return true;
    } catch (error) {
      console.error('Error agregando contacto de emergencia:', error);
      return false;
    }
  }

  async getAllEmergencyContacts(): Promise<EmergencyContact[]> {
    try {
      if (Capacitor.getPlatform() === 'web') {
        return this.getEmergencyContactsFromLocalStorage();
      }

      if (!this.db) return [];

      const query = 'SELECT * FROM emergency_contacts ORDER BY name';
      const result = await this.db.query(query);
      
      return result.values || [];
    } catch (error) {
      console.error('Error obteniendo contactos de emergencia:', error);
      return [];
    }
  }

  // Métodos de carga para actualizar BehaviorSubjects
  private async loadPets() {
    // Este método se implementará cuando tengamos el AuthService integrado
    // Por ahora, mantener la lista vacía
    this.petsSubject.next([]);
  }

  private async loadReminders() {
    // Similar al anterior
    this.remindersSubject.next([]);
  }

  private async loadEmergencyContacts() {
    const contacts = await this.getAllEmergencyContacts();
    this.emergencyContactsSubject.next(contacts);
  }

  // Métodos fallback para localStorage (Web)
  private async loadDataFromLocalStorage() {
    const contacts = this.getEmergencyContactsFromLocalStorage();
    this.emergencyContactsSubject.next(contacts);
    
    // Cargar datos iniciales si no existen
    if (contacts.length === 0) {
      const initialContacts: EmergencyContact[] = [
        {
          id: 1,
          name: 'Veterinaria Central',
          phone: '+56 2 2345 6789',
          address: 'Av. Providencia 1234, Santiago',
          type: 'Veterinaria',
          latitude: -33.4489,
          longitude: -70.6693
        },
        {
          id: 2,
          name: 'Clínica Animal 24h',
          phone: '+56 2 3456 7890',
          address: 'Las Condes 5678, Santiago',
          type: 'Clínica',
          latitude: -33.4172,
          longitude: -70.5476
        }
      ];

      localStorage.setItem('petcare_emergency_contacts', JSON.stringify(initialContacts));
      this.emergencyContactsSubject.next(initialContacts);
    }
  }

  private addPetToLocalStorage(pet: Pet): boolean {
    try {
      const pets = this.getPetsFromLocalStorage(pet.userId);
      const newPet = { ...pet, id: Date.now() };
      pets.push(newPet);
      localStorage.setItem(`petcare_pets_${pet.userId}`, JSON.stringify(pets));
      return true;
    } catch {
      return false;
    }
  }

  private getPetsFromLocalStorage(userId: string): Pet[] {
    try {
      const pets = localStorage.getItem(`petcare_pets_${userId}`);
      return pets ? JSON.parse(pets) : [];
    } catch {
      return [];
    }
  }

  private updatePetInLocalStorage(pet: Pet): boolean {
    try {
      const pets = this.getPetsFromLocalStorage(pet.userId);
      const index = pets.findIndex(p => p.id === pet.id);
      if (index !== -1) {
        pets[index] = pet;
        localStorage.setItem(`petcare_pets_${pet.userId}`, JSON.stringify(pets));
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }

  private deletePetFromLocalStorage(petId: number): boolean {
    try {
      // Necesitaríamos el userId aquí, por simplicidad buscar en todos
      const keys = Object.keys(localStorage).filter(key => key.startsWith('petcare_pets_'));
      for (const key of keys) {
        const pets = JSON.parse(localStorage.getItem(key) || '[]');
        const filteredPets = pets.filter((p: Pet) => p.id !== petId);
        if (filteredPets.length !== pets.length) {
          localStorage.setItem(key, JSON.stringify(filteredPets));
          return true;
        }
      }
      return false;
    } catch {
      return false;
    }
  }

  private addReminderToLocalStorage(reminder: CareReminder): boolean {
    try {
      const reminders = this.getRemindersFromLocalStorage(reminder.petId);
      const newReminder = { ...reminder, id: Date.now() };
      reminders.push(newReminder);
      localStorage.setItem(`petcare_reminders_${reminder.petId}`, JSON.stringify(reminders));
      return true;
    } catch {
      return false;
    }
  }

  private getRemindersFromLocalStorage(petId: number): CareReminder[] {
    try {
      const reminders = localStorage.getItem(`petcare_reminders_${petId}`);
      return reminders ? JSON.parse(reminders) : [];
    } catch {
      return [];
    }
  }

  private updateReminderInLocalStorage(reminder: CareReminder): boolean {
    try {
      const reminders = this.getRemindersFromLocalStorage(reminder.petId);
      const index = reminders.findIndex(r => r.id === reminder.id);
      if (index !== -1) {
        reminders[index] = reminder;
        localStorage.setItem(`petcare_reminders_${reminder.petId}`, JSON.stringify(reminders));
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }

  private addEmergencyContactToLocalStorage(contact: EmergencyContact): boolean {
    try {
      const contacts = this.getEmergencyContactsFromLocalStorage();
      const newContact = { ...contact, id: Date.now() };
      contacts.push(newContact);
      localStorage.setItem('petcare_emergency_contacts', JSON.stringify(contacts));
      this.emergencyContactsSubject.next(contacts);
      return true;
    } catch {
      return false;
    }
  }

  private getEmergencyContactsFromLocalStorage(): EmergencyContact[] {
    try {
      const contacts = localStorage.getItem('petcare_emergency_contacts');
      return contacts ? JSON.parse(contacts) : [];
    } catch {
      return [];
    }
  }
}
