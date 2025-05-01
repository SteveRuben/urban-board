export * from './notification';
export * from './user';


export interface LogoData{
    logo_url: string;
    [key: string]: any;
}

// Types
export interface PersonalInfo {
    firstName: string;
    lastName: string;
    email: string;
    jobTitle: string;
    company: string;
    phone: string;
    avatarUrl: string;
}

export interface SecurityInfo {
    lastPasswordChange: string | null;
    twoFactorEnabled: boolean;
    twoFactorMethod: 'app' | 'sms' | 'email' | null;
    loginHistory: LoginHistory[];
}


export interface PasswordForm {
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
}


export interface LoginHistory {
    id: string;
    timestamp: string;
    device: string;
    location: string;
    ipAddress: string;
    status: 'success' | 'failed';
}


export interface Integration {
    id: string;
    name: string;
    connected: boolean;
    connectionDate: string | null;
    icon: string;
}

export interface ConfirmAction {
    title: string;
    message: string;
    confirmButtonText: string;
    cancelButtonText: string;
    onConfirm: () => Promise<void>;
}

export interface TwoFactorSetupData {
    method: 'app' | 'sms' | 'email';
    qrCode?: string;
    secret?: string;
    verificationSent?: boolean;
    secretKey?: string;
    backupCodes?: string[];
}

export type TwoFactorSetupState = 'idle' | 'setup' | 'verify';

export interface NotificationPreferences {
    email: {
        newMessages: boolean;
        interviewReminders: boolean;
        weeklyReports: boolean;
        marketingEmails: boolean;
    };
    push: {
        newMessages: boolean;
        interviewReminders: boolean;
        candidateUpdates: boolean;
        teamNotifications: boolean;
    };
    desktop: {
        newMessages: boolean;
        interviewReminders: boolean;
        candidateUpdates: boolean;
        teamNotifications: boolean;
    };
}


export interface ProfileData {
    first_name?: string;
    last_name?: string;
    email?: string;
    job_title?: string;
    company?: string;
    phone?: string;
    avatar_url?: string;
    last_password_change?: string | null;
    two_factor_enabled?: boolean;
    two_factor_method?: 'app' | 'sms' | 'email' | null;
    login_history?: LoginHistoryEntry[];
    notification_preferences?: NotificationPreferences;
    integrations?: IntegrationData[];
}

export interface LoginHistoryEntry {
    id: string;
    timestamp: string;
    device: string;
    location: string;
    status: 'success' | 'failed';
    ip_address?: string;
}

export interface PasswordData {
    current_password: string;
    new_password: string;
}

export interface TwoFactorVerificationData {
    method: 'app' | 'sms' | 'email';
    code: string;
}




export interface IntegrationData {
    id: string;
    connected: boolean;
    connected_at?: string | null;
}

export interface TokenResponse {
    tokens: {
        access_token: string;
        refresh_token: string;
    };
}

export interface AuthUrlResponse {
    authUrl: string;
}

