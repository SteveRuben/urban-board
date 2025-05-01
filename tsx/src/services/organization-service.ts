import { LogoData, TokenResponse } from '@/types';
import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
// Extension de AxiosRequestConfig pour ajouter la propriété _retry
interface RetryableRequestConfig extends AxiosRequestConfig {
  _retry?: boolean;
}

// Configuration d'axios avec les intercepteurs pour gérer automatiquement les tokens
const api: AxiosInstance = axios.create({
  baseURL: '/api'
});

// Ajouter un intercepteur pour les requêtes
api.interceptors.request.use(
    // @ts-ignore
  (config: AxiosRequestConfig): AxiosRequestConfig => {
    const token = localStorage.getItem('accessToken');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: any) => Promise.reject(error)
);

// Ajouter un intercepteur pour les réponses
api.interceptors.response.use(
  (response: AxiosResponse): AxiosResponse => response,
  async (error: any) => {
    const originalRequest = error.config as RetryableRequestConfig;
    
    // Si l'erreur est 401 (non autorisé) et que la requête n'a pas déjà été retentée
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        const refreshToken = localStorage.getItem('refreshToken');
        
        if (!refreshToken) {
          throw new Error('No refresh token available');
        }
        
        // Tenter de rafraîchir le token
        const response = await axios.post<TokenResponse>('/api/auth/refresh', {
          refresh_token: refreshToken
        });
        
        // Si le rafraîchissement a réussi
        if (response.data.tokens) {
          const { access_token, refresh_token } = response.data.tokens;
          
          // Mettre à jour les tokens
          localStorage.setItem('accessToken', access_token);
          localStorage.setItem('refreshToken', refresh_token);
          
          // Mettre à jour le header d'autorisation pour toutes les requêtes futures
          api.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;
          
          if (axios.defaults.headers.common) {
            axios.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;
          }
          
          // Retenter la requête originale avec le nouveau token
          if (originalRequest.headers) {
            originalRequest.headers['Authorization'] = `Bearer ${access_token}`;
          }
          return api(originalRequest);
        }
      } catch (refreshError) {
        console.error('Error refreshing token:', refreshError);
        
        // Rediriger vers la page de connexion
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        window.location.href = '/auth/login';
      }
    }
    
    return Promise.reject(error);
  }
);

export class OrganizationService {

     /**
       * Met à jour l'avatar de l'utilisateur
       * @param {FormData} formData - Les données du formulaire contenant l'avatar
       * @returns {Promise<LogoData>} Les données du profil mises à jour
       */
      static async uploadLogo(formData: FormData): Promise<LogoData> {
        try {
          const response = await api.post<LogoData>('/organizations/upload-logo', formData, {
            headers: {
              'Content-Type': 'multipart/form-data',
            },
          });
          return response.data;
        } catch (error) {
          console.error("Erreur lors de l'upload du logo de l'organisation':", error);
          throw error;
        }
      }

      static async createOrganization(data:any): Promise<any> {
        try {
            // Construire l'URL avec les paramètres
            let url = '/organizations';
            // Ajouter un paramètre timestamp pour éviter la mise en cache
            const params = new URLSearchParams();
            params.append('_t', Date.now().toString());
            url += `?${params.toString()}`;  // Ajouter les paramètres à l'URL (si nécessaire)
            let token = localStorage.getItem('accessToken');

            const response = await api.post<any>(url, data, {
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
              },
            });
            return response.data;
          } catch (error) {
            console.error("Erreur lors de la creation de l'organisation:", error);
            throw error;
          }
      }

}

export default OrganizationService;