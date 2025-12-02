import { Injectable } from '@angular/core';
import { CanActivate, Router, UrlTree } from '@angular/router';
import { Observable } from 'rxjs';
import { map, take, first } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  canActivate(): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {
    // Verificar primero si hay usuario en localStorage (verificación inmediata)
    const localUser = localStorage.getItem('petcare_user');
    if (localUser) {
      try {
        JSON.parse(localUser); // Validar que es JSON válido
        // Si hay usuario en localStorage, permitir acceso inmediatamente
        // El AuthService se encargará de cargarlo en segundo plano
        return true;
      } catch (e) {
        // Si hay error parseando, continuar con el flujo normal
      }
    }

    // Si no hay usuario en localStorage, verificar el observable del AuthService
    return this.authService.isAuthenticated$.pipe(
      first(), // Tomar el primer valor emitido
      map(isAuthenticated => {
        if (isAuthenticated) {
          return true;
        } else {
          // Redirigir al login si no está autenticado
          return this.router.createUrlTree(['/login']);
        }
      })
    );
  }
}
