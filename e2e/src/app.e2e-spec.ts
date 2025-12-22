import { browser, by, element, ExpectedConditions } from 'protractor';

describe('PetCare App - E2E Tests', () => {
  const baseUrl = 'http://localhost:4200';

  beforeEach(() => {
    // Limpiar localStorage antes de cada test
    browser.executeScript('window.localStorage.clear();');
    browser.executeScript('window.sessionStorage.clear();');
  });

  describe('Navegación inicial y Login', () => {
    it('should redirect to login page when accessing root', async () => {
      await browser.get('/');
      await browser.wait(ExpectedConditions.urlContains('/login'), 5000);
      expect(await browser.getCurrentUrl()).toContain('/login');
    });

    it('should display login page with form', async () => {
      await browser.get('/login');
      
      // Verificar que los campos del formulario estén presentes
      const emailInput = element(by.css('input[type="email"]'));
      const passwordInput = element(by.css('input[type="password"]'));
      const submitButton = element(by.css('button[type="submit"]'));

      expect(await emailInput.isPresent()).toBeTruthy();
      expect(await passwordInput.isPresent()).toBeTruthy();
      expect(await submitButton.isPresent()).toBeTruthy();
    });

    it('should show error message with invalid credentials', async () => {
      await browser.get('/login');
      
      const emailInput = element(by.css('input[type="email"]'));
      const passwordInput = element(by.css('input[type="password"]'));
      const submitButton = element(by.css('button[type="submit"]'));

      await emailInput.sendKeys('invalid@test.com');
      await passwordInput.sendKeys('wrongpassword');
      await submitButton.click();

      // Esperar a que aparezca el mensaje de error (toast o alert)
      await browser.sleep(2000);
      
      // Verificar que no navegó a home
      expect(await browser.getCurrentUrl()).toContain('/login');
    });

    it('should login successfully and navigate to home', async () => {
      await browser.get('/login');
      
      const emailInput = element(by.css('input[type="email"]'));
      const passwordInput = element(by.css('input[type="password"]'));
      const submitButton = element(by.css('button[type="submit"]'));

      // Usar credenciales de prueba
      await emailInput.sendKeys('test@petcare.com');
      await passwordInput.sendKeys('123456');
      await submitButton.click();

      // Esperar a que complete el login y navegue
      await browser.wait(ExpectedConditions.urlContains('/home'), 10000);
      expect(await browser.getCurrentUrl()).toContain('/home');
    });
  });

  describe('Navegación después del login', () => {
    beforeEach(async () => {
      // Login antes de cada test
      await browser.get('/login');
      const emailInput = element(by.css('input[type="email"]'));
      const passwordInput = element(by.css('input[type="password"]'));
      const submitButton = element(by.css('button[type="submit"]'));

      await emailInput.sendKeys('test@petcare.com');
      await passwordInput.sendKeys('123456');
      await submitButton.click();
      
      // Esperar a que complete el login
      await browser.wait(ExpectedConditions.urlContains('/home'), 10000);
    });

    it('should display home page after login', async () => {
      expect(await browser.getCurrentUrl()).toContain('/home');
      
      // Verificar que la página home se carga
      const pageTitle = element(by.css('ion-title'));
      expect(await pageTitle.isPresent()).toBeTruthy();
    });

    it('should navigate to pet profile page', async () => {
      await browser.get('/home');
      
      // Buscar enlace o botón para ir a perfil de mascota
      // Esto depende de cómo esté implementado en tu UI
      const petProfileLink = element(by.cssContainingText('ion-item', 'Perfil de mascota'));
      
      if (await petProfileLink.isPresent()) {
        await petProfileLink.click();
        await browser.wait(ExpectedConditions.urlContains('/pet-profile'), 5000);
        expect(await browser.getCurrentUrl()).toContain('/pet-profile');
      }
    });

    it('should navigate to care calendar page', async () => {
      await browser.get('/home');
      
      const calendarLink = element(by.cssContainingText('ion-item', 'Calendario'));
      
      if (await calendarLink.isPresent()) {
        await calendarLink.click();
        await browser.wait(ExpectedConditions.urlContains('/care-calendar'), 5000);
        expect(await browser.getCurrentUrl()).toContain('/care-calendar');
      }
    });

    it('should navigate to emergencies page', async () => {
      await browser.get('/home');
      
      const emergenciesLink = element(by.cssContainingText('ion-item', 'Emergencias'));
      
      if (await emergenciesLink.isPresent()) {
        await emergenciesLink.click();
        await browser.wait(ExpectedConditions.urlContains('/emergencies'), 5000);
        expect(await browser.getCurrentUrl()).toContain('/emergencies');
      }
    });
  });

  describe('Registro de usuario', () => {
    it('should navigate to register page from login', async () => {
      await browser.get('/login');
      
      const registerLink = element(by.cssContainingText('a', 'Registrarse'));
      
      if (await registerLink.isPresent()) {
        await registerLink.click();
        await browser.wait(ExpectedConditions.urlContains('/register'), 5000);
        expect(await browser.getCurrentUrl()).toContain('/register');
      }
    });

    it('should display register form', async () => {
      await browser.get('/register');
      
      // Verificar que el formulario de registro esté presente
      const form = element(by.css('form'));
      expect(await form.isPresent()).toBeTruthy();
    });
  });

  describe('Logout', () => {
    beforeEach(async () => {
      // Login antes de cada test
      await browser.get('/login');
      const emailInput = element(by.css('input[type="email"]'));
      const passwordInput = element(by.css('input[type="password"]'));
      const submitButton = element(by.css('button[type="submit"]'));

      await emailInput.sendKeys('test@petcare.com');
      await passwordInput.sendKeys('123456');
      await submitButton.click();
      
      await browser.wait(ExpectedConditions.urlContains('/home'), 10000);
    });

    it('should logout and redirect to login', async () => {
      await browser.get('/home');
      
      // Buscar botón de logout (puede estar en el menú)
      const logoutButton = element(by.cssContainingText('ion-button', 'Cerrar sesión'));
      
      if (await logoutButton.isPresent()) {
        await logoutButton.click();
        await browser.wait(ExpectedConditions.urlContains('/login'), 5000);
        expect(await browser.getCurrentUrl()).toContain('/login');
      }
    });
  });

  describe('Rutas protegidas', () => {
    it('should redirect to login when accessing protected route without auth', async () => {
      // Limpiar cualquier sesión
      browser.executeScript('window.localStorage.clear();');
      
      await browser.get('/home');
      await browser.wait(ExpectedConditions.urlContains('/login'), 5000);
      expect(await browser.getCurrentUrl()).toContain('/login');
    });

    it('should allow access to protected route after login', async () => {
      await browser.get('/login');
      const emailInput = element(by.css('input[type="email"]'));
      const passwordInput = element(by.css('input[type="password"]'));
      const submitButton = element(by.css('button[type="submit"]'));

      await emailInput.sendKeys('test@petcare.com');
      await passwordInput.sendKeys('123456');
      await submitButton.click();
      
      await browser.wait(ExpectedConditions.urlContains('/home'), 10000);
      
      // Intentar acceder a otra ruta protegida
      await browser.get('/pet-profile');
      await browser.wait(ExpectedConditions.urlContains('/pet-profile'), 5000);
      expect(await browser.getCurrentUrl()).toContain('/pet-profile');
    });
  });

  describe('404 - Not Found', () => {
    it('should show not found page for invalid route', async () => {
      await browser.get('/invalid-route-that-does-not-exist');
      await browser.sleep(2000);
      
      // Verificar que se muestra la página de not found
      const notFoundPage = element(by.css('app-not-found'));
      expect(await notFoundPage.isPresent()).toBeTruthy();
    });
  });
});

