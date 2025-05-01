export interface User {
  id: string;
  email: string;
  permissions?: string[];
  first_name?: string;
  last_name?: string;
  name?: string;
  avatar_url?: string;
  role: string;
  subscription?: Subscription;
  createdAt?: string;
  lastLogin?: string;
  has_organization: boolean;  // Nouveau champ
  onboarding_completed: boolean;  // Nouveau champ
  [key: string]: any;
}

export interface Subscription {
  plan: 'freemium' | 'starter' | 'pro' | 'enterprise';
  [key: string]: any;
}

export interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<LoginResult>;
  logout: () => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<RegisterResult>;
  resetPassword: (email: string) => Promise<ResetPasswordResult>;
}

export interface LoginResult {
  success: boolean;
  error?: string;
}

export interface RegisterResult {
  success: boolean;
  error?: string;
}

export interface ResetPasswordResult {
  success: boolean;
  error?: string;
} 