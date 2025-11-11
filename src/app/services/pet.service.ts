import { Injectable, OnDestroy } from '@angular/core';
import { BehaviorSubject, Subscription } from 'rxjs';
import { AuthService, User } from './auth.service';

export interface PetProfile {
  id: string;
  name: string;
  species: string;
  breed: string;
  birthDate: string;
  weight: number;
  vetName: string;
  vetPhone: string;
  notes: string;
  avatarUrl: string;
}

export interface CareReminder {
  id: string;
  title: string;
  type: CareType;
  scheduledDate: string;
  notes: string;
  completed: boolean;
  petId: string;
}

export type CareType = 'Vacuna' | 'Control' | 'Baño' | 'Alimentación' | 'Medicamento';

@Injectable({
  providedIn: 'root'
})
export class PetService implements OnDestroy {
  private readonly petSubject = new BehaviorSubject<PetProfile | null>(null);
  private readonly remindersSubject = new BehaviorSubject<CareReminder[]>([]);
  private authSubscription?: Subscription;
  private currentUserId: string | null = null;

  readonly pet$ = this.petSubject.asObservable();
  readonly reminders$ = this.remindersSubject.asObservable();

  constructor(private readonly authService: AuthService) {
    this.authSubscription = this.authService.currentUser$.subscribe((user) => {
      this.handleUserChange(user);
    });

    // Inicializar con el usuario actual si existe
    const initialUser = this.authService.getCurrentUser();
    this.handleUserChange(initialUser);
  }

  setPetProfile(pet: PetProfile): void {
    this.petSubject.next(pet);
    localStorage.setItem(this.getStorageKey('pet'), JSON.stringify(pet));
  }

  getPetProfile(): PetProfile | null {
    return this.petSubject.value;
  }

  addReminder(reminder: Omit<CareReminder, 'id' | 'completed'>): void {
    const newReminder: CareReminder = {
      ...reminder,
      id: Date.now().toString(),
      completed: false
    };

    const currentReminders = this.remindersSubject.value;
    const updatedReminders = [...currentReminders, newReminder];
    
    this.remindersSubject.next(updatedReminders);
    localStorage.setItem(this.getStorageKey('reminders'), JSON.stringify(updatedReminders));
  }

  toggleReminder(reminderId: string): void {
    const currentReminders = this.remindersSubject.value;
    const updatedReminders = currentReminders.map(reminder =>
      reminder.id === reminderId 
        ? { ...reminder, completed: !reminder.completed }
        : reminder
    );

    this.remindersSubject.next(updatedReminders);
    localStorage.setItem(this.getStorageKey('reminders'), JSON.stringify(updatedReminders));
  }

  deleteReminder(reminderId: string): void {
    const currentReminders = this.remindersSubject.value;
    const updatedReminders = currentReminders.filter(reminder => reminder.id !== reminderId);
    
    this.remindersSubject.next(updatedReminders);
    localStorage.setItem(this.getStorageKey('reminders'), JSON.stringify(updatedReminders));
  }

  private handleUserChange(user: User | null): void {
    this.currentUserId = user?.id ?? null;
    this.loadFromStorage();
  }

  private loadFromStorage(): void {
    // Si no hay usuario, limpiar datos
    if (!this.currentUserId) {
      this.petSubject.next(null);
      this.remindersSubject.next([]);
      return;
    }

    // Cargar perfil de mascota
    const savedPet = localStorage.getItem(this.getStorageKey('pet'));
    if (savedPet) {
      this.petSubject.next(JSON.parse(savedPet));
    } else {
      this.petSubject.next(null);
    }

    // Cargar recordatorios
    const savedReminders = localStorage.getItem(this.getStorageKey('reminders'));
    if (savedReminders) {
      this.remindersSubject.next(JSON.parse(savedReminders));
    } else {
      this.remindersSubject.next([]);
    }
  }

  private getStorageKey(resource: 'pet' | 'reminders'): string {
    const id = this.currentUserId ?? 'guest';
    return `petcare_${resource}_${id}`;
  }

  ngOnDestroy(): void {
    this.authSubscription?.unsubscribe();
  }
}
