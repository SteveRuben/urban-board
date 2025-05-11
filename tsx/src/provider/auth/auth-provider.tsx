// frontend/contexts/auth-context.tsx
import React, {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
//import axios from 'axios';
import { User } from "@/types/user";
import { useRouter } from "next/router";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  login: (
    email: string,
    password: string
  ) => Promise<{ success: boolean; user?: User; error?: string }>;
  logout: () => Promise<void>;
  register: (
    userData: RegisterUserData
  ) => Promise<{ success: boolean; user?: User; error?: string }>;
  isAuthenticated: boolean;
  setError: React.Dispatch<React.SetStateAction<string | null>>;
  fetchCurrentUser: () => Promise<User | null>;
  requestPasswordReset: (
    email: string
  ) => Promise<{ success: boolean; message?: string; error?: string }>;
  resetPassword: (
    token: string,
    newPassword: string
  ) => Promise<{ success: boolean; message?: string; error?: string }>;
  changePassword: (
    currentPassword: string,
    newPassword: string
  ) => Promise<{ success: boolean; message?: string; error?: string }>;
  updateUser: (updatedUserData: User) => void;
  hasPermission: (permission: string) => boolean;
}

interface AuthProviderProps {
  children: ReactNode;
}

interface RegisterUserData {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  [key: string]: any; // Pour les autres propriétés potentielles
}

interface AuthResponse {
  onboarding_required: boolean;
  user: User;
  tokens: {
    access_token: string;
    refresh_token: string;
  };
  message?: string;
}

// Créer un contexte d'authentification
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Hook personnalisé pour utiliser le contexte d'authentification
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth doit être utilisé à l'intérieur de AuthProvider");
  }
  return context;
};

// Fournisseur du contexte d'authentification
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [initialized, setInitialized] = useState<boolean>(false);
  const router = useRouter();

  // Fonction pour mettre à jour l'utilisateur
  const updateUser = useCallback((updatedUserData: User) => {
    setUser(updatedUserData);
  }, []);

  // Charger l'utilisateur depuis le token lors du chargement initial
  useEffect(() => {
    const loadUserFromToken = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("accessToken");

        if (!token) {
          setLoading(false);
          return;
        }

        // Configurer le token dans les en-têtes par défaut d'axios
        //axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

        // Récupérer les données utilisateur
        const userData = await fetchCurrentUser();
        setUser(userData);
      } catch (err) {
        console.error("Erreur lors du chargement de l'utilisateur:", err);
        // En cas d'erreur, supprimer le token potentiellement expiré ou invalide
        localStorage.removeItem("accessToken");
        //delete axios.defaults.headers.common['Authorization'];
        setError("Session expirée. Veuillez vous reconnecter.");
      } finally {
        setLoading(false);
        setInitialized(true);
      }
    };

    loadUserFromToken();
  }, []);

  const fetchCurrentUser = async (): Promise<User | null> => {
    try {
      const token = localStorage.getItem("accessToken");

      if (!token) {
        throw new Error("Non authentifié");
      }

      const response = await fetch("/api/auth/me", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          // Token expiré ou invalide, essayer de le rafraîchir
          const refreshed = await refreshToken();
          if (refreshed) {
            // Réessayer la requête avec le nouveau token
            return await fetchCurrentUser();
          }
          throw new Error("Session expirée");
        }
        throw new Error(
          "Erreur lors de la récupération des informations utilisateur"
        );
      }

      const data = await response.json();
      return data.user as User;
    } catch (err: any) {
      console.error("Erreur:", err);
      setError(err.message);
      return null;
    }
  };

  // Rafraîchir le token d'accès
  const refreshToken = async (): Promise<boolean> => {
    try {
      const refresh = localStorage.getItem("refreshToken");

      if (!refresh) {
        return false;
      }

      const response = await fetch("/api/auth/refresh", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ refresh_token: refresh }),
      });

      if (!response.ok) {
        // Si le refresh token est invalide, déconnecter l'utilisateur
        logout();
        return false;
      }

      const data = await response.json();

      // Mettre à jour les tokens
      localStorage.setItem("accessToken", data.tokens.access_token);
      localStorage.setItem("refreshToken", data.tokens.refresh_token);

      return true;
    } catch (err) {
      console.error("Erreur lors du rafraîchissement du token:", err);
      return false;
    }
  };

  // Fonction de connexion
  const login = async (
    email: string,
    password: string
  ): Promise<{ success: boolean; user?: User; error?: string }> => {
    try {
      setLoading(true);
      setError(null);

      console.log(email);

      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });
      console.log("response: ", response);

      const data: AuthResponse = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Erreur lors de la connexion");
      }

      // Configurer le token dans les en-têtes par défaut d'axios
      // axios.defaults.headers.common['Authorization'] = `Bearer ${data.tokens.access_token}`;
      // Stocker les tokens
      localStorage.setItem("accessToken", data.tokens.access_token);
      localStorage.setItem("refreshToken", data.tokens.refresh_token);
      // Mettre à jour l'état utilisateur
      setUser(data.user);

      if (data.user.onboarding_required) {
        router.push("/onboarding");
      } else {
        router.push("/dashboard");
      }

      return { success: true, user: data.user };
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.error ||
        "Une erreur est survenue lors de la connexion";
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  // Fonction de déconnexion
  const logout = useCallback(async (): Promise<void> => {
    try {
      setLoading(true);

      const token = localStorage.getItem("accessToken");
      if (token) {
        // Appeler l'API de déconnexion
        await fetch("/api/auth/logout", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }).catch(() => {
          // Ignorer les erreurs lors de la déconnexion
        });
      }
    } catch (err) {
      console.error("Erreur lors de la déconnexion:", err);
    } finally {
      // Supprimer les tokens et réinitialiser l'état utilisateur
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      // delete axios.defaults.headers.common['Authorization'];
      setUser(null);
      setLoading(false);

      // Rediriger vers la page de connexion
      router.push("/auth/login");
    }
  }, [router]);

  // Fonction d'inscription
  const register = async (
    userData: RegisterUserData
  ): Promise<{ success: boolean; user?: User; error?: string }> => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(userData),
      });

      const data: AuthResponse = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Erreur lors de l'inscription");
      }

      if (data.tokens) {
        localStorage.setItem("accessToken", data.tokens.access_token);
        localStorage.setItem("refreshToken", data.tokens.refresh_token);
        setUser(data.user);
      }

      // Redirection vers l'onboarding après inscription
      router.push("/onboarding");

      return { success: true, user: data.user };
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.error ||
        "Une erreur est survenue lors de l'inscription";
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  // Fonction pour demander la réinitialisation du mot de passe
  const requestPasswordReset = async (
    email: string
  ): Promise<{ success: boolean; message?: string; error?: string }> => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch("/api/auth/password-reset-request", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Erreur lors de la demande de réinitialisation"
        );
      }

      return { success: true, message: data.message };
    } catch (err: any) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  // Fonction pour réinitialiser le mot de passe
  const resetPassword = async (
    token: string,
    newPassword: string
  ): Promise<{ success: boolean; message?: string; error?: string }> => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token, new_password: newPassword }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Erreur lors de la réinitialisation du mot de passe"
        );
      }

      return { success: true, message: data.message };
    } catch (err: any) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  // Fonction pour changer le mot de passe
  const changePassword = async (
    currentPassword: string,
    newPassword: string
  ): Promise<{ success: boolean; message?: string; error?: string }> => {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem("accessToken");

      if (!token) {
        throw new Error("Non authentifié");
      }

      const response = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          current_password: currentPassword,
          new_password: newPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Erreur lors du changement de mot de passe"
        );
      }

      return { success: true, message: data.message };
    } catch (err: any) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  // Vérifier si l'utilisateur a une permission
  const hasPermission = (permission: string): boolean => {
    if (!user) return false;

    // Les administrateurs ont toutes les permissions
    if (user.role === "admin") return true;

    // Vérifier dans les permissions explicites
    if (user.permissions && user.permissions.includes(permission)) return true;

    // Vérifier les permissions basées sur le rôle
    const rolePermissions: Record<string, string[]> = {
      recruiter: ["view_candidates", "manage_interviews", "view_reports"],
      manager: [
        "view_candidates",
        "manage_interviews",
        "view_reports",
        "manage_team",
      ],
      user: ["view_own_profile"],
    };

    return rolePermissions[user.role]?.includes(permission) || false;
  };

  // Vérifier si l'utilisateur est authentifié
  const isAuthenticated = !!user;

  // Valeur du contexte qui sera fournie aux composants consommateurs
  const value: AuthContextType = {
    user,
    loading,
    error,
    login,
    logout,
    register,
    isAuthenticated,
    setError,
    fetchCurrentUser,
    requestPasswordReset,
    resetPassword,
    changePassword,
    updateUser,
    hasPermission,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
