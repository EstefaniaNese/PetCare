import { TestBed } from '@angular/core/testing';
import { PetService, PetProfile } from './pet.service';
import { AuthService } from './auth.service';
import { StorageService } from './storage.service';
import { Storage } from '@ionic/storage-angular';

describe('PetService', () => {
  let service: PetService;
  let mockStorage: jasmine.SpyObj<Storage>;

  beforeEach(async () => {
    mockStorage = jasmine.createSpyObj('Storage', ['create', 'get', 'set', 'remove', 'clear']);
    mockStorage.create.and.returnValue(Promise.resolve(mockStorage));

    await TestBed.configureTestingModule({
      providers: [
        PetService,
        AuthService,
        StorageService,
        { provide: Storage, useValue: mockStorage }
      ]
    }).compileComponents();

    service = TestBed.inject(PetService);
    localStorage.clear();
  });

  describe('setPetProfile and getPetProfile', () => {
    it('should save and retrieve pet profile', () => {
      const pet: PetProfile = {
        id: '1',
        name: 'Max',
        species: 'Perro',
        breed: 'Labrador',
        birthDate: '2020-01-15',
        weight: 25,
        vetName: 'Dr. Smith',
        vetPhone: '+56912345678',
        notes: 'Muy juguetón',
        avatarUrl: ''
      };

      service.setPetProfile(pet);
      const retrievedPet = service.getPetProfile();

      expect(retrievedPet).not.toBeNull();
      expect(retrievedPet?.name).toBe('Max');
      expect(retrievedPet?.species).toBe('Perro');
    });
  });

  describe('addReminder', () => {
    it('should add a new reminder', () => {
      const reminderData = {
        title: 'Vacuna anual',
        type: 'Vacuna' as const,
        scheduledDate: '2024-12-31',
        notes: 'Recordar llevar a la veterinaria',
        petId: '1'
      };

      service.addReminder(reminderData);

      let reminders: any[] = [];
      service.reminders$.subscribe(r => reminders = r);
      
      expect(reminders.length).toBe(1);
      expect(reminders[0].title).toBe('Vacuna anual');
    });
  });

  describe('toggleReminder', () => {
    it('should toggle reminder completion status', () => {
      // Add reminder first
      service.addReminder({
        title: 'Baño',
        type: 'Baño' as const,
        scheduledDate: '2024-12-25',
        notes: '',
        petId: '1'
      });

      let reminders: any[] = [];
      service.reminders$.subscribe(r => reminders = r);
      const reminderId = reminders[0].id;

      service.toggleReminder(reminderId);
      service.reminders$.subscribe(r => reminders = r);
      expect(reminders[0].completed).toBe(true);
    });
  });
});
