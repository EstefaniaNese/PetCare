import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.estefanianeira.petcare',
  appName: 'PetCare',
  webDir: 'www',
  server: {
    androidScheme: 'https'
  },
  android: {
    minWebViewVersion: 55,
    minSdkVersion: 22,
    targetSdkVersion: 34
  },
  ios: {
    // Configuración para iOS (si se agrega la plataforma)
    minVersion: '13.0'
  },
  web: {
    // Configuración para webmobile
    backgroundColor: '#ffffff',
    allowNavigation: ['*']
  }
};

export default config;
