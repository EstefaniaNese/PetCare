import { TestBed } from '@angular/core/testing';
import { StorageService } from './storage.service';
import { Storage } from '@ionic/storage-angular';

describe('StorageService', () => {
  let service: StorageService;
  let mockStorage: jasmine.SpyObj<Storage>;

  beforeEach(async () => {
    mockStorage = jasmine.createSpyObj('Storage', ['create', 'get', 'set', 'remove', 'clear', 'keys']);
    mockStorage.create.and.returnValue(Promise.resolve(mockStorage));
    
    await TestBed.configureTestingModule({
      providers: [
        StorageService,
        { provide: Storage, useValue: mockStorage }
      ]
    }).compileComponents();

    service = TestBed.inject(StorageService);
    
    // Esperar inicialización
    await new Promise<void>((resolve) => {
      const subscription = service.ready$.subscribe(isReady => {
        if (isReady) {
          (service as any)._storage = mockStorage;
          subscription.unsubscribe();
          resolve();
        }
      });
    });
    
    localStorage.clear();
  });

  describe('Basic Operations', () => {
    it('should set and get a value', async () => {
      mockStorage.set.and.returnValue(Promise.resolve(undefined));
      mockStorage.get.and.returnValue(Promise.resolve('test-value'));

      await service.set('test-key', 'test-value');
      const value = await service.get('test-key');

      expect(value).toBe('test-value');
    });

    it('should remove a value', async () => {
      mockStorage.remove.and.returnValue(Promise.resolve(undefined));

      const result = await service.remove('test-key');

      expect(result).toBe(true);
    });
  });

  describe('User Preferences', () => {
    it('should get default preferences', () => {
      const preferences = service.getCurrentPreferences();

      expect(preferences.theme).toBe('auto');
      expect(preferences.language).toBe('es');
    });

    it('should update preferences', async () => {
      mockStorage.set.and.returnValue(Promise.resolve(undefined));
      mockStorage.get.and.returnValue(Promise.resolve(null));

      const result = await service.updatePreferences({ theme: 'dark' });

      expect(result).toBe(true);
      const prefs = service.getCurrentPreferences();
      expect(prefs.theme).toBe('dark');
    });
  });

  describe('Session Management', () => {
    it('should save session data', async () => {
      mockStorage.set.and.returnValue(Promise.resolve(undefined));

      const result = await service.saveSession({
        token: 'test-token',
        userId: 'user-1',
        rememberMe: true
      });

      expect(result).toBe(true);
    });

    it('should clear session', async () => {
      mockStorage.remove.and.returnValue(Promise.resolve(undefined));

      const result = await service.clearSession();

      expect(result).toBe(true);
    });
  });
});
