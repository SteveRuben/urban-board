import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
}

// Obtenir l'heure sous format hh:mm
export function formatTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

// Ajouter des jours à une date
export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

// Vérifier si une date est passée
export function isPast(date: Date | string): boolean {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.getTime() < new Date().getTime();
}

// Générer un identifiant aléatoire simple
export function generateId(length = 8): string {
  return Math.random().toString(36).substring(2, 2 + length);
}

// Vérifier si un objet est vide
export function isEmpty(obj: any): boolean {
  return Object.keys(obj).length === 0;
}

// Capitaliser la première lettre d'une chaîne
export function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

