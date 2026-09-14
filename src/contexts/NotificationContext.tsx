import React, { createContext, useContext, useMemo, useState } from 'react';
import type { ReactNode } from 'react';

export type NotificationType = 'success' | 'error' | 'info';

export interface Notification {
  id: string;
  message: string;
  type: NotificationType;
  timestamp: Date;
}

interface NotificationContextData {
  notifications: Notification[];
  addNotification: (message: string, type: NotificationType) => void;
  clearNotifications: () => void;
  removeNotification: (id: string) => void;
}

const NotificationContext = createContext<NotificationContextData | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const addNotification = (message: string, type: NotificationType) => {
    // crypto.randomUUID() en vez de Math.random(): este id solo se usa como
    // key de React/identificador visual, pero Math.random() es un generador
    // pseudoaleatorio no apto para nada relacionado con seguridad, y Sonar lo
    // marca igual sin importar el uso — crypto.randomUUID() es la alternativa
    // criptográficamente segura, disponible en navegadores modernos.
    const id = crypto.randomUUID();
    setNotifications((prev) => [{ id, message, type, timestamp: new Date() }, ...prev]);
  };

  const clearNotifications = () => {
    setNotifications([]);
  };

  const removeNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const value = useMemo(
    () => ({ notifications, addNotification, clearNotifications, removeNotification }),
    [notifications],
  );

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
};

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};
