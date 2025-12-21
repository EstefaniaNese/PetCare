import { TestBed } from '@angular/core/testing';
import { AuthService, LoginCredentials, RegisterData } from './auth.service';
import { StorageService } from './storage.service';
import { Storage } from '@ionic/storage-angular';

describe('AuthService', () => {
  let service: AuthService;
  let mockStorage: jasmine.SpyObj<Storage>;

  beforeEach(async () => {
    mockStorage = jasmine.createSpyObj('Storage', ['create', 'get', 'set', 'remove', 'clear']);
    mockStorage.create.and.returnValue(Promise.resolve(mockStorage));
    
    await TestBed.configureTestingModule({
      providers: [
        AuthService,
        StorageService,
        { provide: Storage, useValue: mockStorage }
      ]
    }).compileComponents();

    service = TestBed.inject(AuthService);
    localStorage.clear();
  });

  describe('login', () => {
    it('should login successfully with valid credentials', async () => {
      const credentials: LoginCredentials = {
        email: 'test@petcare.com',
        password: '123456'
      };

      const result = await service.login(credentials);

      expect(result.success).toBe(true);
      expect(result.message).toBe('Inicio de sesión exitoso');
    });

    it('should fail login with invalid credentials', async () => {
      const credentials: LoginCredentials = {
        email: 'invalid@test.com',
        password: 'wrongpassword'
      };

      const result = await service.login(credentials);

      expect(result.success).toBe(false);
    });
  });

  describe('register', () => {
    it('should register a new user successfully', async () => {
      const registerData: RegisterData = {
        email: 'newuser@test.com',
        password: 'password123',
        fullName: 'New User',
        phone: '+56912345678'
      };

      const result = await service.register(registerData);

      expect(result.success).toBe(true);
      expect(service.getCurrentUser()?.email).toBe('newuser@test.com');
    });
  });

  describe('logout', () => {
    it('should clear user session on logout', async () => {
      // Login first
      await service.login({ email: 'test@petcare.com', password: '123456' });
      expect(service.getCurrentUser()).not.toBeNull();

      // Logout
      await service.logout();
      expect(service.getCurrentUser()).toBeNull();
    });
  });
});
