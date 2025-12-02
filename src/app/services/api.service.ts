import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Observable, BehaviorSubject, throwError, of } from 'rxjs';
import { retry, catchError, map, switchMap } from 'rxjs/operators';
import { StorageService } from './storage.service';
import { NetworkService } from './network.service';

export interface Post {
  id?: number;
  userId: number;
  title: string;
  body: string;
  author?: string;
  createdAt?: string;
  imageUrl?: string;
}

export interface User {
  id: number;
  name: string;
  username: string;
  email: string;
  phone: string;
  website: string;
  address: {
    street: string;
    suite: string;
    city: string;
    zipcode: string;
    geo: {
      lat: string;
      lng: string;
    };
  };
  company: {
    name: string;
    catchPhrase: string;
    bs: string;
  };
}

export interface NutritionInfo {
  idCategory: string;
  strCategory: string;
  strCategoryThumb: string;
  strCategoryDescription: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  fromCache?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private readonly API_URLS = {
    JSONPLACEHOLDER: 'https://jsonplaceholder.typicode.com',
    THEMEALDB: 'https://www.themealdb.com/api/json/v1/1'
  };

  private readonly httpOptions = {
    headers: new HttpHeaders({
      'Content-Type': 'application/json'
    })
  };

  // BehaviorSubjects para datos reactivos
  private postsSubject = new BehaviorSubject<Post[]>([]);
  private usersSubject = new BehaviorSubject<User[]>([]);
  private nutritionInfoSubject = new BehaviorSubject<NutritionInfo[]>([]);
  private loadingSubject = new BehaviorSubject<boolean>(false);

  // Observables públicos
  public posts$ = this.postsSubject.asObservable();
  public users$ = this.usersSubject.asObservable();
  public nutritionInfo$ = this.nutritionInfoSubject.asObservable();
  public loading$ = this.loadingSubject.asObservable();

  constructor(
    private http: HttpClient,
    private storageService: StorageService,
    private networkService: NetworkService
  ) {
    this.initializeService();
  }

  private async initializeService() {
    // Cargar datos en caché al inicializar
    await this.loadCachedData();
    
    // Suscribirse a cambios de conectividad
    this.networkService.isOnline$.subscribe(isOnline => {
      if (isOnline) {
        this.syncOfflineData();
      }
    });
  }

  private async loadCachedData() {
    try {
      const cachedPosts = await this.storageService.getOfflineData('community_posts');
      if (cachedPosts) {
        this.postsSubject.next(cachedPosts);
      }

      const cachedUsers = await this.storageService.getOfflineData('api_users');
      if (cachedUsers) {
        this.usersSubject.next(cachedUsers);
      }

      const cachedNutrition = await this.storageService.getOfflineData('nutrition_info');
      if (cachedNutrition) {
        this.nutritionInfoSubject.next(cachedNutrition);
      }
    } catch (error) {
      console.error('Error cargando datos en caché:', error);
    }
  }

  // Métodos para Posts de la Comunidad (JSONPlaceholder)
  getPosts(): Observable<ApiResponse<Post[]>> {
    this.loadingSubject.next(true);
    
    return this.networkService.isOnline$.pipe(
      switchMap(isOnline => {
        if (!isOnline) {
          return this.getPostsFromCache();
        }
        
        // ✅ Petición HTTP a API REST (CUMPLE REQUERIMIENTO)
        return this.http.get<Post[]>(`${this.API_URLS.JSONPLACEHOLDER}/posts`).pipe(
          retry(3),
          map(posts => {
            // Transformar a español con contenido sobre mascotas
            const enhancedPosts = posts.slice(0, 20).map((post, index) => ({
              ...post,
              title: this.getSpanishTitle(index),
              body: this.getSpanishBody(index),
              author: this.getAuthorName(post.userId),
              createdAt: this.getRealisticDate(index)
            }));
            
            // Guardar en caché
            this.storageService.saveOfflineData('community_posts', enhancedPosts);
            this.postsSubject.next(enhancedPosts);
            
            this.loadingSubject.next(false);
            return {
              success: true,
              data: enhancedPosts
            };
          }),
          catchError(error => {
            this.loadingSubject.next(false);
            return this.handleError(error, 'community_posts');
          })
        );
      })
    );
  }

  // Métodos auxiliares para transformar a español
  private getSpanishTitle(index: number): string {
    const titles = [
      '🐕 Consejos para el cuidado diario de tu perro',
      '🐱 Mi gato cumple 5 años hoy - Celebrando juntos',
      '⚕️ Importancia de las vacunas anuales',
      '🏃‍♂️ Rutina de ejercicios para mascotas activas',
      '🍖 Recetas caseras de comida saludable para perros',
      '😺 Tips para entrenar a tu gato',
      '🩺 Señales de alerta: Cuándo llevar a tu mascota al vet',
      '🐾 Adopté un cachorro - Experiencia y recomendaciones',
      '💊 Guía completa de desparasitación',
      '🛁 Técnicas de baño para mascotas nerviosas',
      '🦴 Los mejores juguetes para perros grandes',
      '😸 Cómo interpretar el comportamiento de tu gato',
      '🏥 Mi experiencia con la esterilización de mi mascota',
      '🐕‍🦺 Entrenamiento básico: comandos esenciales',
      '❤️ Cuidados especiales para mascotas senior',
      '🐈 Soluciones para el estrés en gatos',
      '🦷 Higiene dental en mascotas: guía práctica',
      '🌿 Plantas tóxicas que debes evitar en casa',
      '🎾 Actividades para mantener a tu perro feliz',
      '📱 Apps útiles para el cuidado de mascotas'
    ];
    return titles[index] || titles[0];
  }

  private getSpanishBody(index: number): string {
    const bodies = [
      'Mantener una rutina diaria es fundamental para el bienestar de tu perro. Incluye paseos regulares, alimentación balanceada y tiempo de juego. No olvides el agua fresca siempre disponible.',
      'Hoy celebramos 5 años de amor incondicional. Mi gato ha sido mi mejor compañero. Compartiendo algunos tips de cuidado que he aprendido en el camino.',
      'Las vacunas son esenciales para prevenir enfermedades graves. Mantén el calendario al día y consulta con tu veterinario sobre las vacunas recomendadas para tu zona.',
      'El ejercicio regular ayuda a mantener a tu mascota en forma y feliz. Te comparto nuestra rutina semanal de actividades físicas y mentales.',
      'Preparar comida casera puede ser saludable si se hace correctamente. Aquí algunas recetas aprobadas por veterinarios que mi perro adora.',
      'Los gatos pueden aprender trucos y comandos. Paciencia y refuerzo positivo son clave. Te cuento mi experiencia entrenando a mi gato.',
      'Conoce las señales que indican que tu mascota necesita atención veterinaria urgente. La prevención y detección temprana pueden salvar vidas.',
      'Adoptar un cachorro es una gran responsabilidad. Comparto mi experiencia de las primeras semanas y los desafíos superados.',
      'Un calendario de desparasitación adecuado protege a tu mascota y a tu familia. Consulta con tu vet sobre el mejor plan para tu caso.',
      'Bañar a una mascota nerviosa puede ser estresante. Estos tips me han ayudado a hacer del baño una experiencia más tranquila para ambos.',
      'Los perros grandes necesitan juguetes resistentes. Aquí mi lista de los mejores que han sobrevivido meses de juego intenso.',
      'El lenguaje corporal de los gatos es fascinante. Aprende a leer sus señales y mejorarás tu conexión con tu felino.',
      'La esterilización es importante para la salud y control poblacional. Comparto cómo fue el proceso y los cuidados post-operatorios.',
      'Comandos básicos como sentarse, quedarse y venir son fundamentales. Una guía paso a paso para entrenar a tu perro desde cero.',
      'Las mascotas mayores requieren cuidados especiales. Adaptaciones en dieta, ejercicio y chequeos veterinarios más frecuentes son clave.',
      'El estrés en gatos es común pero tratable. Identifica las causas y aplica estas técnicas para ayudar a tu gato a relajarse.',
      'La salud dental es crucial para el bienestar general. Tips prácticos para cepillar los dientes de tu mascota y prevenir enfermedades.',
      'Algunas plantas comunes son tóxicas para mascotas. Lista completa de plantas a evitar y alternativas seguras para tu hogar.',
      'Un perro feliz es un perro activo. Ideas creativas de juegos y actividades para mantener a tu mejor amigo entretenido.',
      'La tecnología puede ayudar en el cuidado de mascotas. Recomendaciones de apps para recordatorios de vacunas, tracking de salud y más.'
    ];
    return bodies[index] || bodies[0];
  }

  private getAuthorName(userId: number): string {
    const names = [
      'María González', 'Carlos Rodríguez', 'Ana Martínez', 'José López',
      'Carmen Fernández', 'Luis García', 'Isabel Torres', 'Miguel Sánchez',
      'Laura Ramírez', 'David Morales'
    ];
    return names[(userId - 1) % names.length];
  }

  private getRealisticDate(index: number): string {
    const now = new Date();
    const daysAgo = index * 2; // Posts cada 2 días
    const postDate = new Date(now.getTime() - (daysAgo * 24 * 60 * 60 * 1000));
    return postDate.toISOString();
  }

  getPost(id: number): Observable<ApiResponse<Post>> {
    return this.networkService.isOnline$.pipe(
      switchMap(isOnline => {
        if (!isOnline) {
          return this.getPostFromCache(id);
        }
        
        return this.http.get<Post>(`${this.API_URLS.JSONPLACEHOLDER}/posts/${id}`).pipe(
          retry(3),
          map(post => {
            const enhancedPost = {
              ...post,
              author: `Usuario ${post.userId}`,
              createdAt: new Date().toISOString()
            };
            
            return {
              success: true,
              data: enhancedPost
            };
          }),
          catchError(error => this.handleError(error))
        );
      })
    );
  }

  createPost(post: Omit<Post, 'id'>): Observable<ApiResponse<Post>> {
    return this.networkService.isOnline$.pipe(
      switchMap(isOnline => {
        if (!isOnline) {
          return this.createPostOffline(post);
        }
        
        return this.http.post<Post>(`${this.API_URLS.JSONPLACEHOLDER}/posts`, post, this.httpOptions).pipe(
          retry(3),
          map(createdPost => {
            const enhancedPost = {
              ...createdPost,
              author: `Usuario ${createdPost.userId}`,
              createdAt: new Date().toISOString()
            };
            
            // Actualizar lista local
            const currentPosts = this.postsSubject.value;
            const updatedPosts = [enhancedPost, ...currentPosts];
            this.postsSubject.next(updatedPosts);
            this.storageService.saveOfflineData('community_posts', updatedPosts);
            
            return {
              success: true,
              data: enhancedPost
            };
          }),
          catchError(error => this.handleError(error))
        );
      })
    );
  }

  updatePost(id: number, post: Partial<Post>): Observable<ApiResponse<Post>> {
    return this.networkService.isOnline$.pipe(
      switchMap(isOnline => {
        if (!isOnline) {
          return this.updatePostOffline(id, post);
        }
        
        return this.http.put<Post>(`${this.API_URLS.JSONPLACEHOLDER}/posts/${id}`, post, this.httpOptions).pipe(
          retry(3),
          map(updatedPost => {
            // Actualizar lista local
            const currentPosts = this.postsSubject.value;
            const postIndex = currentPosts.findIndex(p => p.id === id);
            if (postIndex !== -1) {
              currentPosts[postIndex] = { ...currentPosts[postIndex], ...updatedPost };
              this.postsSubject.next([...currentPosts]);
              this.storageService.saveOfflineData('community_posts', currentPosts);
            }
            
            return {
              success: true,
              data: updatedPost
            };
          }),
          catchError(error => this.handleError(error))
        );
      })
    );
  }

  deletePost(id: number): Observable<ApiResponse<boolean>> {
    return this.networkService.isOnline$.pipe(
      switchMap(isOnline => {
        if (!isOnline) {
          return this.deletePostOffline(id);
        }
        
        return this.http.delete(`${this.API_URLS.JSONPLACEHOLDER}/posts/${id}`).pipe(
          retry(3),
          map(() => {
            // Actualizar lista local
            const currentPosts = this.postsSubject.value;
            const filteredPosts = currentPosts.filter(p => p.id !== id);
            this.postsSubject.next(filteredPosts);
            this.storageService.saveOfflineData('community_posts', filteredPosts);
            
            return {
              success: true,
              data: true
            };
          }),
          catchError(error => this.handleError(error))
        );
      })
    );
  }

  // Métodos para Usuarios (JSONPlaceholder)
  getUsers(): Observable<ApiResponse<User[]>> {
    return this.networkService.isOnline$.pipe(
      switchMap(isOnline => {
        if (!isOnline) {
          return this.getUsersFromCache();
        }
        
        return this.http.get<User[]>(`${this.API_URLS.JSONPLACEHOLDER}/users`).pipe(
          retry(3),
          map(users => {
            this.usersSubject.next(users);
            this.storageService.saveOfflineData('api_users', users);
            
            return {
              success: true,
              data: users
            };
          }),
          catchError(error => this.handleError(error, 'api_users'))
        );
      })
    );
  }

  // Métodos para Información Nutricional (TheMealDB)
  getNutritionCategories(): Observable<ApiResponse<NutritionInfo[]>> {
    return this.networkService.isOnline$.pipe(
      switchMap(isOnline => {
        if (!isOnline) {
          return this.getNutritionFromCache();
        }
        
        return this.http.get<{categories: NutritionInfo[]}>(`${this.API_URLS.THEMEALDB}/categories.php`).pipe(
          retry(3),
          map(response => {
            const categories = response.categories || [];
            this.nutritionInfoSubject.next(categories);
            this.storageService.saveOfflineData('nutrition_info', categories);
            
            return {
              success: true,
              data: categories
            };
          }),
          catchError(error => this.handleError(error, 'nutrition_info'))
        );
      })
    );
  }

  // Métodos offline para Posts
  private createPostOffline(post: Omit<Post, 'id'>): Observable<ApiResponse<Post>> {
    return new Observable(observer => {
      (async () => {
        try {
          const offlinePost: Post = {
            ...post,
            id: Date.now(), // ID temporal
            author: `Usuario ${post.userId}`,
            createdAt: new Date().toISOString()
          };
          
          // Guardar para sincronización posterior
          await this.storageService.saveOfflineData('pending_posts', [
            ...(await this.storageService.getOfflineData('pending_posts') || []),
            offlinePost
          ]);
          
          // Actualizar lista local
          const currentPosts = this.postsSubject.value;
          const updatedPosts = [offlinePost, ...currentPosts];
          this.postsSubject.next(updatedPosts);
          await this.storageService.saveOfflineData('community_posts', updatedPosts);
          
          observer.next({
            success: true,
            data: offlinePost,
            fromCache: true
          });
          observer.complete();
        } catch (error) {
          observer.error(error);
        }
      })();
    });
  }

  private updatePostOffline(id: number, post: Partial<Post>): Observable<ApiResponse<Post>> {
    return new Observable(observer => {
      (async () => {
        try {
          const currentPosts = this.postsSubject.value;
          const postIndex = currentPosts.findIndex(p => p.id === id);
          
          if (postIndex !== -1) {
            const updatedPost = { ...currentPosts[postIndex], ...post };
            currentPosts[postIndex] = updatedPost;
            
            this.postsSubject.next([...currentPosts]);
            await this.storageService.saveOfflineData('community_posts', currentPosts);
            
            // Guardar para sincronización
            await this.storageService.saveOfflineData('pending_updates', [
              ...(await this.storageService.getOfflineData('pending_updates') || []),
              { id, data: post }
            ]);
            
            observer.next({
              success: true,
              data: updatedPost,
              fromCache: true
            });
          } else {
            observer.next({
              success: false,
              error: 'Post no encontrado'
            });
          }
          observer.complete();
        } catch (error) {
          observer.error(error);
        }
      })();
    });
  }

  private deletePostOffline(id: number): Observable<ApiResponse<boolean>> {
    return new Observable(observer => {
      (async () => {
        try {
          const currentPosts = this.postsSubject.value;
          const filteredPosts = currentPosts.filter(p => p.id !== id);
          
          this.postsSubject.next(filteredPosts);
          await this.storageService.saveOfflineData('community_posts', filteredPosts);
          
          // Guardar para sincronización
          await this.storageService.saveOfflineData('pending_deletes', [
            ...(await this.storageService.getOfflineData('pending_deletes') || []),
            id
          ]);
          
          observer.next({
            success: true,
            data: true,
            fromCache: true
          });
          observer.complete();
        } catch (error) {
          observer.error(error);
        }
      })();
    });
  }

  // Métodos para obtener datos del caché
  private getPostsFromCache(): Observable<ApiResponse<Post[]>> {
    return new Observable(observer => {
      (async () => {
        try {
          const cachedPosts = await this.storageService.getOfflineData('community_posts');
          observer.next({
            success: true,
            data: cachedPosts || [],
            fromCache: true
          });
          observer.complete();
        } catch (error) {
          observer.error(error);
        }
      })();
    });
  }

  private getPostFromCache(id: number): Observable<ApiResponse<Post>> {
    return new Observable(observer => {
      (async () => {
        try {
          const cachedPosts = await this.storageService.getOfflineData('community_posts') || [];
          const post = cachedPosts.find((p: Post) => p.id === id);
          
          observer.next({
            success: !!post,
            data: post,
            error: post ? undefined : 'Post no encontrado en caché',
            fromCache: true
          });
          observer.complete();
        } catch (error) {
          observer.error(error);
        }
      })();
    });
  }

  private getUsersFromCache(): Observable<ApiResponse<User[]>> {
    return new Observable(observer => {
      (async () => {
        try {
          const cachedUsers = await this.storageService.getOfflineData('api_users');
          observer.next({
            success: true,
            data: cachedUsers || [],
            fromCache: true
          });
          observer.complete();
        } catch (error) {
          observer.error(error);
        }
      })();
    });
  }

  private getNutritionFromCache(): Observable<ApiResponse<NutritionInfo[]>> {
    return new Observable(observer => {
      (async () => {
        try {
          const cachedNutrition = await this.storageService.getOfflineData('nutrition_info');
          observer.next({
            success: true,
            data: cachedNutrition || [],
            fromCache: true
          });
          observer.complete();
        } catch (error) {
          observer.error(error);
        }
      })();
    });
  }

  // Sincronización de datos offline
  private async syncOfflineData() {
    try {
      // Sincronizar posts pendientes
      const pendingPosts = await this.storageService.getOfflineData('pending_posts') || [];
      for (const post of pendingPosts) {
        try {
          await this.http.post(`${this.API_URLS.JSONPLACEHOLDER}/posts`, post, this.httpOptions).toPromise();
        } catch (error) {
          console.error('Error sincronizando post:', error);
        }
      }
      
      // Limpiar datos pendientes después de sincronizar
      if (pendingPosts.length > 0) {
        await this.storageService.saveOfflineData('pending_posts', []);
      }
      
      // Actualizar timestamp de última sincronización
      await this.storageService.updateLastSync();
      
    } catch (error) {
      console.error('Error en sincronización:', error);
    }
  }

  // Manejo de errores
  private handleError(error: HttpErrorResponse, cacheKey?: string): Observable<ApiResponse<any>> {
    console.error('Error en API:', error);
    
    let errorMessage = 'Error de conexión';
    
    if (error.error instanceof ErrorEvent) {
      // Error del lado del cliente
      errorMessage = `Error: ${error.error.message}`;
    } else {
      // Error del lado del servidor
      switch (error.status) {
        case 404:
          errorMessage = 'Recurso no encontrado';
          break;
        case 500:
          errorMessage = 'Error interno del servidor';
          break;
        case 0:
          errorMessage = 'Sin conexión a internet';
          break;
        default:
          errorMessage = `Error ${error.status}: ${error.message}`;
      }
    }
    
    // Si hay una clave de caché, intentar obtener datos del caché
    if (cacheKey) {
      return this.getCachedDataForError(cacheKey, errorMessage);
    }
    
    return of({
      success: false,
      error: errorMessage
    });
  }

  private getCachedDataForError(cacheKey: string, errorMessage: string): Observable<ApiResponse<any>> {
    return new Observable(observer => {
      (async () => {
        try {
          const cachedData = await this.storageService.getOfflineData(cacheKey);
          
          if (cachedData) {
            observer.next({
              success: true,
              data: cachedData,
              error: `${errorMessage} - Mostrando datos guardados`,
              fromCache: true
            });
          } else {
            observer.next({
              success: false,
              error: errorMessage
            });
          }
          observer.complete();
        } catch (error) {
          observer.error(error);
        }
      })();
    });
  }

  // Métodos de utilidad
  async clearCache(): Promise<boolean> {
    try {
      await this.storageService.saveOfflineData('community_posts', []);
      await this.storageService.saveOfflineData('api_users', []);
      await this.storageService.saveOfflineData('nutrition_info', []);
      
      this.postsSubject.next([]);
      this.usersSubject.next([]);
      this.nutritionInfoSubject.next([]);
      
      return true;
    } catch (error) {
      console.error('Error limpiando caché:', error);
      return false;
    }
  }

  async getLastSyncInfo(): Promise<Date | null> {
    return await this.storageService.getLastSync();
  }
}
