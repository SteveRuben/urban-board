

export default  interface Notification {
    id: string;
    title: string;
    message: string;
    type: string;
    userId?: string;
    timestamp?: string;
    read: boolean;
    reference_id?: string;
    link?: string;
    created_at?: string;
    data?: any;
    [key: string]: any;
  }

  export interface Toast {
    id: string;
    notification: Notification;
    timestamp: number;
  }

