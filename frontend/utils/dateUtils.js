// utils/dateUtils.js
/**
 * Utilitaires pour le formatage des dates
 */

/**
 * Formate une date en format local français (JJ/MM/AAAA HH:MM)
 * @param {string|Date} date - Date à formater (objet Date ou chaîne ISO)
 * @param {Object} options - Options supplémentaires de formatage
 * @returns {string} Date formatée
 */
export const formatDate = (date, options = {}) => {
    if (!date) return '';
    
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    // Vérifier si la date est valide
    if (isNaN(dateObj.getTime())) {
      return 'Date invalide';
    }
    
    const defaultOptions = { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    
    // Fusionner les options par défaut avec les options personnalisées
    const finalOptions = { ...defaultOptions, ...options };
    
    return dateObj.toLocaleDateString('fr-FR', finalOptions);
  };
  
  /**
   * Formate une date en format relatif par rapport à maintenant (il y a 2 heures, etc.)
   * @param {string|Date} date - Date à formater (objet Date ou chaîne ISO)
   * @returns {string} Texte relatif
   */
  export const formatRelativeTime = (date) => {
    if (!date) return '';
    
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    // Vérifier si la date est valide
    if (isNaN(dateObj.getTime())) {
      return 'Date invalide';
    }
    
    const now = new Date();
    const diffMs = now - dateObj;
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);
    
    // Différentes plages de temps
    if (diffSec < 60) {
      return 'À l\'instant';
    } else if (diffMin < 60) {
      return diffMin === 1 ? 'Il y a 1 minute' : `Il y a ${diffMin} minutes`;
    } else if (diffHour < 24) {
      return diffHour === 1 ? 'Il y a 1 heure' : `Il y a ${diffHour} heures`;
    } else if (diffDay < 7) {
      return diffDay === 1 ? 'Hier' : `Il y a ${diffDay} jours`;
    } else {
      return formatDate(dateObj, { hour: undefined, minute: undefined });
    }
  };
  
  /**
   * Formate une durée en minutes en format heures/minutes (1h 30min)
   * @param {number} minutes - Nombre de minutes
   * @param {boolean} short - Format court (1h30) si true
   * @returns {string} Durée formatée
   */
  export const formatDuration = (minutes, short = false) => {
    if (minutes === undefined || minutes === null) return '';
    
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    
    if (hours === 0) {
      return short ? `${mins}min` : `${mins} minute${mins > 1 ? 's' : ''}`;
    } else if (mins === 0) {
      return short ? `${hours}h` : `${hours} heure${hours > 1 ? 's' : ''}`;
    } else {
      return short 
        ? `${hours}h${mins}`
        : `${hours} heure${hours > 1 ? 's' : ''} ${mins} minute${mins > 1 ? 's' : ''}`;
    }
  };
  
  /**
   * Vérifie si une date est aujourd'hui
   * @param {string|Date} date - Date à vérifier
   * @returns {boolean} True si la date est aujourd'hui
   */
  export const isToday = (date) => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    const today = new Date();
    
    return (
      dateObj.getDate() === today.getDate() &&
      dateObj.getMonth() === today.getMonth() &&
      dateObj.getFullYear() === today.getFullYear()
    );
  };
  
  /**
   * Vérifie si une date est dans le futur
   * @param {string|Date} date - Date à vérifier
   * @returns {boolean} True si la date est dans le futur
   */
  export const isFuture = (date) => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    const now = new Date();
    
    return dateObj > now;
  };
  
  /**
   * Formate une plage horaire pour un événement (10h-11h30)
   * @param {string|Date} startDate - Date de début
   * @param {string|Date} endDate - Date de fin
   * @returns {string} Plage horaire formatée
   */
  export const formatTimeRange = (startDate, endDate) => {
    if (!startDate || !endDate) return '';
    
    const start = typeof startDate === 'string' ? new Date(startDate) : startDate;
    const end = typeof endDate === 'string' ? new Date(endDate) : endDate;
    
    // Formater l'heure de début
    const startHour = start.getHours().toString().padStart(2, '0');
    const startMin = start.getMinutes().toString().padStart(2, '0');
    
    // Formater l'heure de fin
    const endHour = end.getHours().toString().padStart(2, '0');
    const endMin = end.getMinutes().toString().padStart(2, '0');
    
    // Si même jour
    if (
      start.getDate() === end.getDate() &&
      start.getMonth() === end.getMonth() &&
      start.getFullYear() === end.getFullYear()
    ) {
      return `${startHour}h${startMin !== '00' ? startMin : ''}-${endHour}h${endMin !== '00' ? endMin : ''}`;
    } else {
      // Si jours différents
      return `${formatDate(start)} - ${formatDate(end)}`;
    }
  };
  
  export default {
    formatDate,
    formatRelativeTime,
    formatDuration,
    isToday,
    isFuture,
    formatTimeRange
  };