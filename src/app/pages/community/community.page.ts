import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar,
  IonButtons,
  IonBackButton,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardSubtitle,
  IonCardContent,
  IonButton,
  IonIcon,
  IonList,
  IonSpinner,
  IonChip,
  IonLabel,
  IonFab,
  IonFabButton,
  IonAvatar,
} from '@ionic/angular/standalone';
import { trigger, transition, style, animate } from '@angular/animations';
import { Subscription } from 'rxjs';
import { ApiService, Post } from '../../services/api.service';
import { NetworkService } from '../../services/network.service';
import { UiService } from '../../services/ui.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-community',
  templateUrl: './community.page.html',
  styleUrls: ['./community.page.scss'],
  standalone: true,
  imports: [
    IonContent,
    IonHeader,
    IonTitle,
    IonToolbar,
    IonButtons,
    IonBackButton,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardSubtitle,
    IonCardContent,
    IonButton,
    IonIcon,
    IonList,
    IonSpinner,
    IonChip,
    IonLabel,
    IonFab,
    IonFabButton,
    IonAvatar,
    CommonModule,
  ],
  animations: [
    trigger('fadeIn', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(10px)' }),
        animate('350ms ease-out', style({ opacity: 1, transform: 'translateY(0)' })),
      ]),
    ]),
  ],
})
export class CommunityPage implements OnInit, OnDestroy {
  posts: Post[] = [];
  isLoading = false;
  isOnline = true;
  lastSync: Date | null = null;
  
  private subscriptions: Subscription[] = [];

  constructor(
    private apiService: ApiService,
    private networkService: NetworkService,
    private uiService: UiService,
    private authService: AuthService
  ) {}

  ngOnInit() {
    this.setupSubscriptions();
    this.loadPosts();
  }

  ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  private setupSubscriptions() {
    // Suscribirse al estado de conectividad
    const networkSub = this.networkService.isOnline$.subscribe(isOnline => {
      this.isOnline = isOnline;
    });
    this.subscriptions.push(networkSub);

    // Suscribirse a los posts
    const postsSub = this.apiService.posts$.subscribe(posts => {
      this.posts = posts;
    });
    this.subscriptions.push(postsSub);

    // Suscribirse al estado de carga
    const loadingSub = this.apiService.loading$.subscribe(isLoading => {
      this.isLoading = isLoading;
    });
    this.subscriptions.push(loadingSub);
  }

  async loadPosts() {
    try {
      this.lastSync = await this.apiService.getLastSyncInfo();
      
      const result = await this.apiService.getPosts().toPromise();
      
      if (result?.success) {
        if (result.fromCache) {
          await this.uiService.showInfoToast('Mostrando datos guardados');
        }
      } else if (result?.error) {
        await this.uiService.showErrorToast(result.error);
      }
    } catch (error) {
      console.error('Error cargando posts:', error);
      await this.uiService.showErrorToast('Error al cargar publicaciones');
    }
  }

  async refreshPosts() {
    await this.loadPosts();
  }

  async createPost() {
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) {
      await this.uiService.showErrorToast('Debes iniciar sesión para crear publicaciones');
      return;
    }

    const confirmed = await this.uiService.showConfirmAlert(
      'Nueva Publicación',
      '¿Quieres crear una nueva publicación en la comunidad?',
      'Crear',
      'Cancelar'
    );

    if (confirmed) {
      // Crear un post de ejemplo
      const newPost = {
        userId: parseInt(currentUser.id),
        title: '¡Hola comunidad!',
        body: 'Esta es una nueva publicación creada desde la app PetCare. ¡Comparte tus experiencias con tus mascotas!'
      };

      try {
        const result = await this.apiService.createPost(newPost).toPromise();
        
        if (result?.success) {
          await this.uiService.showSuccessToast('Publicación creada exitosamente');
        } else if (result?.error) {
          await this.uiService.showErrorToast(result.error);
        }
      } catch (error) {
        console.error('Error creando post:', error);
        await this.uiService.showErrorToast('Error al crear la publicación');
      }
    }
  }

  async likePost(post: Post) {
    await this.uiService.showInfoToast(`Te gusta la publicación de ${post.author}`);
  }

  async sharePost(post: Post) {
    if (navigator.share) {
      try {
        await navigator.share({
          title: post.title,
          text: post.body,
          url: window.location.href
        });
      } catch (error) {
        console.error('Error compartiendo:', error);
      }
    } else {
      await this.uiService.showInfoToast('Función de compartir no disponible');
    }
  }

  async deletePost(post: Post) {
    const confirmed = await this.uiService.showConfirmAlert(
      'Eliminar Publicación',
      '¿Estás seguro de que quieres eliminar esta publicación?',
      'Eliminar',
      'Cancelar'
    );

    if (confirmed && post.id) {
      try {
        const result = await this.apiService.deletePost(post.id).toPromise();
        
        if (result?.success) {
          await this.uiService.showSuccessToast('Publicación eliminada');
        } else if (result?.error) {
          await this.uiService.showErrorToast(result.error);
        }
      } catch (error) {
        console.error('Error eliminando post:', error);
        await this.uiService.showErrorToast('Error al eliminar la publicación');
      }
    }
  }

  canDeletePost(post: Post): boolean {
    const currentUser = this.authService.getCurrentUser();
    return currentUser ? post.userId === parseInt(currentUser.id) : false;
  }

  isFromCache(post: Post): boolean {
    // Lógica para determinar si el post viene del caché
    // Por simplicidad, asumimos que posts sin fecha de creación reciente son del caché
    if (!post.createdAt) return true;
    
    const postDate = new Date(post.createdAt);
    const now = new Date();
    const diffMinutes = (now.getTime() - postDate.getTime()) / (1000 * 60);
    
    return diffMinutes > 60; // Posts de más de 1 hora se consideran del caché
  }

  getAvatarUrl(userId: number): string {
    // Generar avatar basado en el userId
    return `https://api.dicebear.com/7.x/avataaars/svg?seed=${userId}`;
  }

  formatDate(dateString?: string): string {
    if (!dateString) return 'Fecha desconocida';
    
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMinutes < 1) return 'Ahora';
    if (diffMinutes < 60) return `Hace ${diffMinutes} min`;
    if (diffHours < 24) return `Hace ${diffHours}h`;
    if (diffDays < 7) return `Hace ${diffDays} días`;
    
    return date.toLocaleDateString('es-ES');
  }

  formatLastSync(date: Date): string {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));

    if (diffMinutes < 1) return 'Ahora';
    if (diffMinutes < 60) return `Hace ${diffMinutes} min`;
    
    return date.toLocaleTimeString('es-ES', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  }

  trackByPost(_index: number, post: Post): number | string {
    return post.id || _index;
  }
}