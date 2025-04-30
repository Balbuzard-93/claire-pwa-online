// storageUtils.js  <-- THIS IS THE CORRECT CONTENT FOR THIS FILE

// --- Constantes de Clés ---
const SOBRIETY_START_DATE_KEY = 'claireAppSobrietyStartDate';
const JOURNAL_ENTRIES_KEY = 'claireAppJournalEntries';
const MOOD_ENTRIES_KEY = 'claireAppMoodEntries';
const EARNED_BADGES_KEY = 'claireAppEarnedBadges';
const DAILY_ROUTINE_KEY_PREFIX = 'claireAppDailyRoutine_';
const DAILY_PLANNER_KEY_PREFIX = 'claireAppPlanner_';
const VICTORIES_KEY = 'claireAppVictories';

// --- Fonctions Utilitaires ---

/**
 * Obtient la date du jour au format 'YYYY-MM-DD'.
 * Utilise UTC pour éviter les problèmes de fuseau horaire lors de la comparaison des dates.
 * @returns {string} La date actuelle en UTC.
 */
export function getCurrentDateString() {
    const date = new Date();
    // Format YYYY-MM-DD en UTC
    const year = date.getUTCFullYear();
    const month = (date.getUTCMonth() + 1).toString().padStart(2, '0');
    const day = date.getUTCDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
}

// --- Fonctions Génériques loadData / saveData ---

/**
 * Charge des données depuis localStorage en gérant les erreurs JSON.
 * @param {string} key - La clé de stockage.
 * @returns {any | null} Les données parsées ou null en cas d'erreur ou si non trouvé.
 */
function loadData(key) {
    try {
        const storedData = localStorage.getItem(key);
        if (storedData === null) return null;
        // Gérer le cas où les données stockées ne sont pas du JSON valide
        try {
            return JSON.parse(storedData);
        } catch (parseError) {
            console.error(`Erreur de parsing JSON pour la clé ${key}:`, parseError, "\nDonnées récupérées:", storedData);
            // Optionnel: Supprimer la donnée corrompue ?
            // localStorage.removeItem(key);
            return null;
        }
    } catch (error) {
        console.error(`Erreur lors de la lecture de localStorage (${key}):`, error);
        return null;
    }
}

/**
 * Sauvegarde des données dans localStorage en gérant les erreurs JSON et Quota.
 * @param {string} key - La clé de stockage.
 * @param {any} data - Les données à sauvegarder (seront stringifiées).
 * @returns {boolean} true si la sauvegarde a réussi, false sinon.
 */
function saveData(key, data) {
    try {
        const stringifiedData = JSON.stringify(data);
        localStorage.setItem(key, stringifiedData);
        return true;
    } catch (error) {
        console.error(`Erreur sauvegarde localStorage (${key}):`, error);
        // Vérification plus robuste des erreurs de quota
        if (error.name === 'QuotaExceededError' ||
            (error.code && (error.code === 22 || // Codes W3C
                             error.code === 1014 || // Firefox
                             error.code === DOMException.QUOTA_EXCEEDED_ERR))) { // Standard DOMException
            alert(`Erreur : Espace de stockage local plein. Impossible de sauvegarder.`);
        } else {
            alert(`Une erreur est survenue lors de la sauvegarde.`);
        }
        return false;
    }
}

// --- Fonctions Spécifiques ---
// Ajout de vérifications simples pour les données récupérées

// Sobriété
export function getSobrietyStartDate() { // <<<=== L'EXPORT EST ICI
    try {
         return localStorage.getItem(SOBRIETY_START_DATE_KEY);
    } catch (e) {
        console.error("Err accès date sobriété:", e); return null;
    }
}
export function saveSobrietyStartDate(dateString) { // <<<=== L'EXPORT EST ICI
    if(typeof dateString !== 'string') return false;
    try {
        localStorage.setItem(SOBRIETY_START_DATE_KEY, dateString); return true;
    } catch (e) {
        console.error("Err sauvegarde date sobriété:", e);
        if(e.name === 'QuotaExceededError' || (e.code && (e.code === 22 || e.code === 1014 || e.code === DOMException.QUOTA_EXCEEDED_ERR))) {
            alert("Stockage plein.");
        } else {
            alert("Erreur sauvegarde date.");
        }
        return false;
    }
}

// Journal
export function getJournalEntries() {
    const d = loadData(JOURNAL_ENTRIES_KEY);
    return Array.isArray(d) ? d.filter(i => typeof i === 'object' && i && 'timestamp' in i && typeof i.text === 'string') : [];
}
export function saveJournalEntries(entries) {
    return saveData(JOURNAL_ENTRIES_KEY, entries);
}

// Humeur
export function getMoodEntries() {
    const d = loadData(MOOD_ENTRIES_KEY);
    return Array.isArray(d) ? d.filter(i => typeof i === 'object' && i && 'date' in i && typeof i.mood === 'number') : [];
}
export function saveMoodEntries(entries) {
    return saveData(MOOD_ENTRIES_KEY, entries);
}

// Badges
export function getEarnedBadgesFromStorage() {
    const d = loadData(EARNED_BADGES_KEY);
    return Array.isArray(d) ? d.filter(i => typeof i === 'string') : [];
}
export function saveEarnedBadgesToStorage(badgeIds) {
    return saveData(EARNED_BADGES_KEY, badgeIds);
}

// Routine
export function getRoutineForDate(dateString) {
    const key = DAILY_ROUTINE_KEY_PREFIX + dateString;
    const d = loadData(key);
    return (d && typeof d === 'object' && Array.isArray(d.tasks)) ? d : null;
}
export function saveRoutineForDate(dateString, routineData) {
    const key = DAILY_ROUTINE_KEY_PREFIX + dateString;
    if (routineData === null) {
        try { localStorage.removeItem(key); return true; }
        catch (e) { console.error(`Err suppression ${key}:`, e); return false; }
    } else {
        return saveData(key, routineData);
    }
}

// Planificateur
export function getPlannerForDate(dateString) {
    const key = DAILY_PLANNER_KEY_PREFIX + dateString;
    const d = loadData(key);
    return (d && typeof d === 'object' && Array.isArray(d.tasks)) ? d : null;
}
export function savePlannerForDate(dateString, plannerData) {
    const key = DAILY_PLANNER_KEY_PREFIX + dateString;
    if (plannerData === null) {
        try { localStorage.removeItem(key); return true; }
        catch (e) { console.error(`Err suppression ${key}:`, e); return false; }
    } else {
        return saveData(key, plannerData);
    }
}

// Victoires
export function getVictories() {
    const d = loadData(VICTORIES_KEY);
    return Array.isArray(d) ? d.filter(i => typeof i === 'object' && i && 'id' in i && 'timestamp' in i && typeof i.text === 'string') : [];
}
export function saveVictories(victoriesArray) {
    return saveData(VICTORIES_KEY, victoriesArray);
}
