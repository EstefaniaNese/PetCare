import { Injectable } from '@angular/core';
import { Camera, CameraResultType, CameraSource, Photo } from '@capacitor/camera';
import { Capacitor } from '@capacitor/core';
import { StorageService } from './storage.service';

export interface PhotoResult {
  success: boolean;
  photoUrl?: string;
  error?: string;
}

@Injectable({
  providedIn: 'root'
})
export class CameraService {

  constructor(private storageService: StorageService) {}

  async takePicture(): Promise<PhotoResult> {
    try {
      const image = await Camera.getPhoto({
        quality: 90,
        allowEditing: true,
        resultType: CameraResultType.Uri,
        source: CameraSource.Camera
      });

      if (image.webPath) {
        return {
          success: true,
          photoUrl: image.webPath
        };
      } else {
        return {
          success: false,
          error: 'No se pudo obtener la imagen'
        };
      }
    } catch (error) {
      console.error('Error tomando foto:', error);
      return {
        success: false,
        error: 'Error al acceder a la cámara'
      };
    }
  }

  async selectFromGallery(): Promise<PhotoResult> {
    try {
      const image = await Camera.getPhoto({
        quality: 90,
        allowEditing: true,
        resultType: CameraResultType.Uri,
        source: CameraSource.Photos
      });

      if (image.webPath) {
        return {
          success: true,
          photoUrl: image.webPath
        };
      } else {
        return {
          success: false,
          error: 'No se pudo obtener la imagen'
        };
      }
    } catch (error) {
      console.error('Error seleccionando foto:', error);
      return {
        success: false,
        error: 'Error al acceder a la galería'
      };
    }
  }

  async convertToBase64(photoUrl: string): Promise<string | null> {
    try {
      if (Capacitor.isNativePlatform()) {
        // En dispositivos nativos, leer el archivo
        const response = await fetch(photoUrl);
        const blob = await response.blob();
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });
      } else {
        // En web, la URL ya es utilizable
        return photoUrl;
      }
    } catch (error) {
      console.error('Error convirtiendo a base64:', error);
      return null;
    }
  }

  async savePhotoToStorage(photoUrl: string, key: string): Promise<boolean> {
    try {
      const base64Data = await this.convertToBase64(photoUrl);
      if (base64Data) {
        return await this.storageService.set(key, base64Data);
      }
      return false;
    } catch (error) {
      console.error('Error guardando foto:', error);
      return false;
    }
  }

  async getPhotoFromStorage(key: string): Promise<string | null> {
    try {
      return await this.storageService.get(key);
    } catch (error) {
      console.error('Error obteniendo foto:', error);
      return null;
    }
  }

  async deletePhotoFromStorage(key: string): Promise<boolean> {
    try {
      return await this.storageService.remove(key);
    } catch (error) {
      console.error('Error eliminando foto:', error);
      return false;
    }
  }

  // Método para redimensionar imagen (opcional)
  async resizeImage(photoUrl: string, maxWidth: number = 800, maxHeight: number = 600): Promise<string | null> {
    try {
      return new Promise((resolve) => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const img = new Image();
        
        img.onload = () => {
          // Calcular nuevas dimensiones manteniendo proporción
          let { width, height } = img;
          
          if (width > height) {
            if (width > maxWidth) {
              height = (height * maxWidth) / width;
              width = maxWidth;
            }
          } else {
            if (height > maxHeight) {
              width = (width * maxHeight) / height;
              height = maxHeight;
            }
          }
          
          canvas.width = width;
          canvas.height = height;
          
          // Dibujar imagen redimensionada
          ctx?.drawImage(img, 0, 0, width, height);
          
          // Convertir a base64
          resolve(canvas.toDataURL('image/jpeg', 0.8));
        };
        
        img.onerror = () => resolve(null);
        img.src = photoUrl;
      });
    } catch (error) {
      console.error('Error redimensionando imagen:', error);
      return null;
    }
  }

  // Método para verificar permisos de cámara
  async checkCameraPermissions(): Promise<boolean> {
    try {
      const permissions = await Camera.checkPermissions();
      return permissions.camera === 'granted';
    } catch (error) {
      console.error('Error verificando permisos:', error);
      return false;
    }
  }

  // Método para solicitar permisos de cámara
  async requestCameraPermissions(): Promise<boolean> {
    try {
      const permissions = await Camera.requestPermissions();
      return permissions.camera === 'granted';
    } catch (error) {
      console.error('Error solicitando permisos:', error);
      return false;
    }
  }
}
