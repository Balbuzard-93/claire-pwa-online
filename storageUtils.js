// storageUtils.js (Version avec IndexedDB Helpers)

// --- Constantes de Clés ---
const LS_SOBRIETY_START_DATE_KEY = 'claireAppSobrietyStartDate'; // LS = LocalStorage
const LS_EARNED_BADGES_KEY = 'claireAppEarnedBadges';
const LS_ZEN_MODE_KEY = 'claireAppZenModeEnabled'; // Ajouté pour clarté

// --- Configuration IndexedDB ---
const DB_NAME = 'ClaireAppDB';
const DB_VERSION = 1; // Augmenter si on change la structure des stores
const STORES = {
    JOURNAL: 'journal_entries', // Entrées du journal
    MOOD: 'mood_logs',          // Logs d'humeur
    ROUTINE: 'daily_routines',  // Routines quotidiennes (clé: date YYYY-MM-DD)
    PLANNER: 'daily_plans',     // Plans quotidiens (clé: date YYYY-MM-DD)
    VICTORIES: 'victories_log'  // Journal des victoires
};

let dbPromise = null; // Promesse pour la connexion à la base

/**
 * Ouvre ou crée la base de données IndexedDB.
 * Gère la création/mise à jour des Object Stores.
 * @returns {Promise<IDBPDatabase>} Une promesse résolue avec l'objet de base de données.
 */
function openDB() {
    if (!dbPromise) {
        dbPromise = new Promise((resolve, reject) => {
            const request = indexedDB.open(DB_NAME, DB_VERSION);

            request.onerror = (event) => {
                console.error("Erreur ouverture IndexedDB:", event.target.error);
                reject("Erreur ouverture IndexedDB");
            };

            request.onsuccess = (event) => {
                console.log("IndexedDB ouvert avec succès.");
                resolve(event.target.result);
            };

            request.onupgradeneeded = (event) => {
                console.log("Mise à niveau IndexedDB nécessaire ou création...");
                const db = event.target.result;
                // Créer les Object Stores s'ils n'existent pas
                if (!db.objectStoreNames.contains(STORES.JOURNAL)) {
                    // autoIncrement pour ID unique. index 'timestamp' pour tri/recherche.
                    db.createObjectStore(STORES.JOURNAL, { keyPath: 'id', autoIncrement: true }).createIndex('timestamp', 'timestamp');
                    console.log(`Object Store ${STORES.JOURNAL} créé.`);
                }
                if (!db.objectStoreNames.contains(STORES.MOOD)) {
                    // Utiliser 'date' (YYYY-MM-DD) comme clé unique pour les logs d'humeur.
                    db.createObjectStore(STORES.MOOD, { keyPath: 'date' });
                    console.log(`Object Store ${STORES.MOOD} créé.`);
                }
                 if (!db.objectStoreNames.contains(STORES.ROUTINE)) {
                    // Utiliser 'date' (YYYY-MM-DD) comme clé unique.
                    db.createObjectStore(STORES.ROUTINE, { keyPath: 'date' });
                    console.log(`Object Store ${STORES.ROUTINE} créé.`);
                }
                 if (!db.objectStoreNames.contains(STORES.PLANNER)) {
                     // Utiliser 'date' (YYYY-MM-DD) comme clé unique.
                    db.createObjectStore(STORES.PLANNER, { keyPath: 'date' });
                    console.log(`Object Store ${STORES.PLANNER} créé.`);
                }
                if (!db.objectStoreNames.contains(STORES.VICTORIES)) {
                     // autoIncrement pour ID unique. index 'timestamp' pour tri/recherche.
                    db.createObjectStore(STORES.VICTORIES, { keyPath: 'id', autoIncrement: true }).createIndex('timestamp', 'timestamp');
                     console.log(`Object Store ${STORES.VICTORIES} créé.`);
                }
                // Ajouter d'autres stores ici si nécessaire pour futures versions
            };
        });
    }
    return dbPromise;
}

/**
 * Ajoute ou met à jour un enregistrement dans un Object Store.
 * @param {string} storeName Le nom de l'Object Store.
 * @param {object} data L'objet à ajouter/mettre à jour.
 * @returns {Promise<void>}
 */
async function putData(storeName, data) {
    try {
        const db = await openDB();
        const tx = db.transaction(storeName, 'readwrite');
        const store = tx.objectStore(storeName);
        await store.put(data);
        await tx.done; // Attendre la fin de la transaction
        // console.log(`Donnée ajoutée/mise à jour dans ${storeName}:`, data);
    } catch (error) {
        console.error(`Erreur lors de l'ajout/MAJ dans ${storeName}:`, error, data);
        throw error; // Propager l'erreur
    }
}

/**
 * Récupère un enregistrement par sa clé.
 * @param {string} storeName Le nom de l'Object Store.
 * @param {any} key La clé primaire de l'enregistrement.
 * @returns {Promise<object|undefined>} L'objet trouvé ou undefined.
 */
async function getDataByKey(storeName, key) {
    try {
         const db = await openDB();
         const tx = db.transaction(storeName, 'readonly');
         const store = tx.objectStore(storeName);
         const data = await store.get(key);
         await tx.done;
         return data;
    } catch (error) {
         console.error(`Erreur lecture par clé ${key} dans ${storeName}:`, error);
         throw error;
    }
}

/**
 * Récupère tous les enregistrements d'un Object Store.
 * @param {string} storeName Le nom de l'Object Store.
 * @returns {Promise<Array<object>>} Un tableau de tous les enregistrements.
 */
async function getAllData(storeName) {
     try {
         const db = await openDB();
         const tx = db.transaction(storeName, 'readonly');
         const store = tx.objectStore(storeName);
         const allData = await store.getAll();
         await tx.done;
         return allData;
     } catch (error) {
         console.error(`Erreur lecture de tout dans ${storeName}:`, error);
         throw error;
     }
}

/**
 * Supprime un enregistrement par sa clé.
 * @param {string} storeName Le nom de l'Object Store.
 * @param {any} key La clé primaire de l'enregistrement à supprimer.
 * @returns {Promise<void>}
 */
async function deleteDataByKey(storeName, key) {
     try {
         const db = await openDB();
         const tx = db.transaction(storeName, 'readwrite');
         const store = tx.objectStore(storeName);
         await store.delete(key);
         await tx.done;
         // console.log(`Donnée supprimée (clé: ${key}) de ${storeName}.`);
     } catch (error) {
         console.error(`Erreur suppression par clé ${key} dans ${storeName}:`, error);
         throw error;
     }
}

// --- Fonctions Utilitaires (Date, localStorage générique) ---

export function getCurrentDateString() { /* ... (inchangée) ... */
    const date = new Date();
    const year = date.getUTCFullYear();
    const month = (date.getUTCMonth() + 1).toString().padStart(2, '0');
    const day = date.getUTCDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function loadDataLS(key) { /* Renommée pour clarté */
     try { /* ... (code loadData précédent pour localStorage) ... */
         const storedData = localStorage.getItem(key);
         if (storedData === null) return null;
         try { return JSON.parse(storedData); }
         catch (parseError) { console.error(`Err parsing LS (${key}):`, parseError); return null; }
     } catch (error) { console.error(`Err lecture LS (${key}):`, error); return null; }
}

function saveDataLS(key, data) { /* Renommée pour clarté */
     try { /* ... (code saveData précédent pour localStorage) ... */
         const stringifiedData = JSON.stringify(data);
         localStorage.setItem(key, stringifiedData); return true;
     } catch (error) { console.error(`Err sauvegarde LS (${key}):`, error); if (error.name === 'QuotaExceededError' || (error.code && (error.code === 22 || error.code === 1014 || error.code === DOMException.QUOTA_EXCEEDED_ERR))) { alert(`Stockage plein.`); } else { alert(`Erreur sauvegarde.`); } return false; }
}

// --- Fonctions Spécifiques (Interface Publique) ---

// ** DONNÉES CONSERVÉES DANS localStorage **
// Sobriété
export function getSobrietyStartDate() { try { return localStorage.getItem(LS_SOBRIETY_START_DATE_KEY); } catch (e) { console.error("Err accès date sobriété:", e); return null; } }
export function saveSobrietyStartDate(dateString) { if(typeof dateString !== 'string') return false; try { localStorage.setItem(LS_SOBRIETY_START_DATE_KEY, dateString); return true; } catch (e) { console.error("Err sauvegarde date sobriété:", e); if(e.name === 'QuotaExceededError' || (e.code && (e.code === 22 || e.code === 1014 || e.code === DOMException.QUOTA_EXCEEDED_ERR))) {alert("Stockage plein.");} else {alert("Erreur sauvegarde date.");} return false; } }
// Badges
export function getEarnedBadgesFromStorage() { const d = loadDataLS(LS_EARNED_BADGES_KEY); return Array.isArray(d) ? d.filter(i => typeof i === 'string') : []; }
export function saveEarnedBadgesToStorage(badgeIds) { return saveDataLS(LS_EARNED_BADGES_KEY, badgeIds); }
// Mode Zen (ajouté pour être complet)
export function getZenModeState() { try { return localStorage.getItem(LS_ZEN_MODE_KEY) === 'true'; } catch { return false; } }
export function saveZenModeState(isEnabled) { try { localStorage.setItem(LS_ZEN_MODE_KEY, isEnabled ? 'true' : 'false'); return true; } catch (e) { console.error("Err sauvegarde Mode Zen:", e); return false; } }


// ** DONNÉES MIGRÉES VERS IndexedDB **
// Journal
export async function getJournalEntries() { return await getAllData(STORES.JOURNAL); }
export async function addJournalEntry(entryData) { /* entryData = { timestamp: string, text: string } */ await putData(STORES.JOURNAL, entryData); }
export async function deleteJournalEntry(entryId) { await deleteDataByKey(STORES.JOURNAL, entryId); } // Nécessite que les entrées aient un ID unique (autoIncrement)

// Humeur
export async function getMoodEntryForDate(dateString) { return await getDataByKey(STORES.MOOD, dateString); }
export async function saveMoodEntry(moodData) { /* moodData = { date: string, mood: number, ... } */ await putData(STORES.MOOD, moodData); }
export async function getAllMoodEntries() { return await getAllData(STORES.MOOD); } // Pour graphiques/bilans

// Routine
export async function getRoutineForDate(dateString) { return await getDataByKey(STORES.ROUTINE, dateString); }
export async function saveRoutineForDate(dateString, routineData) { if(routineData === null) { await deleteDataByKey(STORES.ROUTINE, dateString); } else { /* routineData = { date: string, tasks: [] } */ await putData(STORES.ROUTINE, { ...routineData, date: dateString }); } }

// Planificateur
export async function getPlannerForDate(dateString) { return await getDataByKey(STORES.PLANNER, dateString); }
export async function savePlannerForDate(dateString, plannerData) { if(plannerData === null) { await deleteDataByKey(STORES.PLANNER, dateString); } else { /* plannerData = { date: string, tasks: [] } */ await putData(STORES.PLANNER, { ...plannerData, date: dateString }); } }

// Victoires
export async function getVictories() { return await getAllData(STORES.VICTORIES); }
export async function addVictory(victoryData) { /* victoryData = { timestamp: string, text: string } */ await putData(STORES.VICTORIES, victoryData); }
export async function deleteVictory(victoryId) { await deleteDataByKey(STORES.VICTORIES, victoryId); }

// --- Fonction d'Export ---
/**
 * Récupère TOUTES les données de l'application (LS et IDB).
 * @returns {Promise<object>} Un objet contenant toutes les données.
 */
export async function getAllAppData() {
    const allData = {
        settings: {},
        journal: [],
        mood: [],
        routines: {}, // Stocker par date ? Ou tout ?
        plans: {},    // Idem ?
        victories: [],
        // badges déjà dans settings via LS
    };

    // Récupérer depuis LocalStorage
    allData.settings.sobrietyStartDate = getSobrietyStartDate();
    allData.settings.earnedBadges = getEarnedBadgesFromStorage();
    allData.settings.isZenModeEnabled = getZenModeState();
    // Ajouter d'autres paramètres LS ici si besoin

    // Récupérer depuis IndexedDB
    try {
        allData.journal = await getJournalEntries();
        allData.mood = await getAllMoodEntries(); // Récupérer tout l'historique
        allData.victories = await getVictories();

        // Pour routines et plans, récupérer par date est plus complexe pour un export total.
        // Solution simple : récupérer toutes les clés de routine/plan et leurs données.
        // Attention: peut être lent si beaucoup de jours stockés.
        const db = await openDB();
        const routineKeys = await db.getAllKeys(STORES.ROUTINE);
        for (const key of routineKeys) { allData.routines[key] = await getDataByKey(STORES.ROUTINE, key); }
        const plannerKeys = await db.getAllKeys(STORES.PLANNER);
        for (const key of plannerKeys) { allData.plans[key] = await getDataByKey(STORES.PLANNER, key); }

    } catch (error) {
        console.error("Erreur lors de la récupération des données IndexedDB pour l'export:", error);
        // Retourner données partielles ? Ou une erreur ?
    }

    return allData;
}
