# Pruebas End-to-End (E2E) - PetCare

## Descripción

Este directorio contiene las pruebas E2E (End-to-End) de la aplicación PetCare. Las pruebas E2E validan el flujo completo de la aplicación desde la perspectiva del usuario.

## Requisitos

- Node.js instalado
- Chrome o Chromium instalado
- La aplicación debe estar ejecutándose en `http://localhost:4200`

## Configuración

Las pruebas están configuradas usando:
- **Protractor**: Framework de pruebas E2E para Angular
- **Jasmine**: Framework de testing
- **TypeScript**: Lenguaje de programación

## Ejecutar las Pruebas

### 1. Iniciar la aplicación

En una terminal, ejecuta:
```bash
npm start
# o
ng serve
```

Asegúrate de que la aplicación esté corriendo en `http://localhost:4200`

### 2. Ejecutar las pruebas E2E

En otra terminal, ejecuta:
```bash
npm run e2e
# o
ng e2e
```

## Estructura de las Pruebas

### `app.e2e-spec.ts`

Contiene las siguientes suites de pruebas:

1. **Navegación inicial y Login**
   - Redirección a login desde root
   - Visualización del formulario de login
   - Validación de credenciales incorrectas
   - Login exitoso

2. **Navegación después del login**
   - Visualización de la página home
   - Navegación a perfil de mascota
   - Navegación a calendario de cuidados
   - Navegación a emergencias

3. **Registro de usuario**
   - Navegación a página de registro
   - Visualización del formulario de registro

4. **Logout**
   - Cerrar sesión y redirección a login

5. **Rutas protegidas**
   - Redirección a login sin autenticación
   - Acceso permitido después del login

6. **404 - Not Found**
   - Manejo de rutas inválidas

## Credenciales de Prueba

Las pruebas utilizan las siguientes credenciales:
- **Email**: `test@petcare.com`
- **Password**: `123456`

## Configuración de Protractor

El archivo `protractor.conf.js` contiene la configuración:
- **Base URL**: `http://localhost:4200`
- **Browser**: Chrome (headless)
- **Timeout**: 11 segundos para scripts, 30 segundos para tests

## Solución de Problemas

### Error: "ECONNREFUSED"
- Asegúrate de que la aplicación esté corriendo en `http://localhost:4200`
- Verifica que no haya otro proceso usando el puerto 4200

### Error: "Element not found"
- Algunos elementos pueden tener selectores diferentes
- Revisa los selectores en `app.e2e-spec.ts` y ajusta según tu HTML

### Las pruebas son lentas
- Esto es normal, las pruebas E2E son más lentas que las unitarias
- Puedes aumentar los timeouts en `protractor.conf.js` si es necesario

## Notas

- Las pruebas limpian el localStorage antes de cada test
- Algunas pruebas pueden requerir ajustes según la implementación real de la UI
- Las pruebas asumen que la aplicación está en modo desarrollo

## Integración Continua

Para ejecutar en CI/CD, las pruebas se ejecutan en modo headless (sin interfaz gráfica).

