// storageUtils.js (Version avec IndexedDB Helpers ET Gestion Distractions LS)

// --- Constantes de Clés ---
const LS_SOBRIETY_START_DATE_KEY = 'claireAppSobrietyStartDate';
const LS_EARNED_BADGES_KEY = 'claireAppEarnedBadges';
const LS_ZEN_MODE_KEY = 'claireAppZenModeEnabled';
const DISTRACTIONS_LS_KEY = 'claireAppDistractionsList'; // <<< CLÉ AJOUTÉE ICI

// --- Configuration IndexedDB ---
const DB_NAME = 'ClaireAppDB';
const DB_VERSION = 1; // Incrémenter seulement si on change la structure des stores ci-dessous
const STORES = {
    JOURNAL: 'journal_entries',
    MOOD: 'mood_logs',
    ROUTINE: 'daily_routines',
    PLANNER: 'daily_plans',
    VICTORIES: 'victories_log'
};

let dbPromise = null; // Promesse pour la connexion Singleton à la base

/**
 * Ouvre ou crée la base de données IndexedDB.
 * Gère la création/mise à jour des Object Stores.
 * @returns {Promise<IDBDatabase>} Une promesse résolue avec l'objet de base de données.
 */
function openDB() {
    if (!dbPromise) {
        dbPromise = new Promise((resolve, reject) => {
            if (!('indexedDB' in window)) return reject("IndexedDB non supporté");
            const request = indexedDB.open(DB_NAME, DB_VERSION);
            request.onerror = (e) => { console.error("Erreur ouverture IDB:", e.target.error); dbPromise = null; reject(e.target.error); };
            request.onsuccess = (e) => resolve(e.target.result);
            request.onupgradeneeded = (e) => {
                console.log("Upgrade IDB...");
                const db = e.target.result;
                Object.values(STORES).forEach(storeName => {
                    if (!db.objectStoreNames.contains(storeName)) {
                        let store;
                        if (storeName === STORES.JOURNAL || storeName === STORES.VICTORIES) {
                            store = db.createObjectStore(storeName, { keyPath: 'id', autoIncrement: true });
                            store.createIndex('timestamp', 'timestamp');
                        } else { // MOOD, ROUTINE, PLANNER use 'date' as key
                            store = db.createObjectStore(storeName, { keyPath: 'date' });
                        }
                        console.log(`OS ${storeName} créé.`);
                    }
                });
            };
            request.onblocked = (e) => { console.warn("Ouverture IDB bloquée.", e); reject("Ouverture bloquée"); };
        });
    }
    return dbPromise;
}

// --- Fonctions Helper pour IndexedDB (Révisées) ---

/** Opération générique pour lire/écrire dans IndexedDB */
async function operateOnStore(storeName, mode = 'readonly', operation) {
    try {
        const db = await openDB();
        if (!db) throw new Error("DB non ouverte.");
        if (!db.objectStoreNames.contains(storeName)) throw new Error(`Store '${storeName}' inexistant.`);
        const transaction = db.transaction(storeName, mode);
        const store = transaction.objectStore(storeName);
        return new Promise((resolve, reject) => {
            const request = operation(store, transaction);
            if (!request || typeof request.then === 'function') { resolve(request); return; }
            request.onsuccess = (event) => resolve(event.target.result);
            request.onerror = (event) => reject(`Erreur requête IDB sur ${storeName}: ${event.target.error}`);
            transaction.oncomplete = () => resolve(request.result); // Important pour put/delete
            transaction.onerror = (event) => reject(`Erreur TX ${storeName} ${mode}: ${event.target.error}`);
        });
    } catch (error) { console.error(`Erreur operateOnStore (${storeName}, ${mode}):`, error); throw error; }
}

async function putData(storeName, data) { return operateOnStore(storeName, 'readwrite', store => store.put(data)); }
async function getDataByKey(storeName, key) { if (key===undefined||key===null||key==='') { console.warn(`Clé invalide pour getDataByKey (${storeName}):`, key); return undefined; } return operateOnStore(storeName, 'readonly', store => store.get(key)); }
async function getAllData(storeName) { return operateOnStore(storeName, 'readonly', store => store.getAll()); }
async function getAllKeys(storeName) { return operateOnStore(storeName, 'readonly', store => store.getAllKeys()); }
async function deleteDataByKey(storeName, key) { return operateOnStore(storeName, 'readwrite', store => store.delete(key)); }


// --- Fonctions Utilitaires (Date, localStorage générique - renommées) ---

export function getCurrentDateString() {
    const date = new Date();
    const year = date.getUTCFullYear();
    const month = (date.getUTCMonth() + 1).toString().padStart(2, '0');
    const day = date.getUTCDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
}

/** Charge depuis LocalStorage (interne) */
function loadDataFromLS(key) {
     try { const d=localStorage.getItem(key); return d===null?null:JSON.parse(d); } catch(e){ console.error(`Err lecture LS (${key}):`,e); return null; }
}

/** Sauvegarde vers LocalStorage (interne) */
function saveDataToLS(key, data) {
     try { localStorage.setItem(key,JSON.stringify(data)); return true; } catch(e){ console.error(`Err sauvegarde LS (${key}):`,e); if(e.name === 'QuotaExceededError'||(e.code&&(e.code===22||e.code===1014||e.code===DOMException.QUOTA_EXCEEDED_ERR))){ alert(`Stockage plein.`); } else { alert(`Erreur sauvegarde.`); } return false; }
}

// --- Fonctions Spécifiques Exportées ---

// ** LOCALSTORAGE **
export function getSobrietyStartDate() { try { return localStorage.getItem(LS_SOBRIETY_START_DATE_KEY); } catch (e) { console.error("Err accès date sobriété:", e); return null; } }
export function saveSobrietyStartDate(dateString) { if(typeof dateString !== 'string') return false; try { localStorage.setItem(LS_SOBRIETY_START_DATE_KEY, dateString); return true; } catch (e) { console.error("Err sauvegarde date sobriété:", e); if(e.name === 'QuotaExceededError'||(e.code&&(e.code===22||e.code===1014||e.code===DOMException.QUOTA_EXCEEDED_ERR))){alert("Stockage plein.");} else {alert("Erreur sauvegarde date.");} return false; } }
export function getEarnedBadgesFromStorage() { const d = loadDataFromLS(LS_EARNED_BADGES_KEY); return Array.isArray(d) ? d.filter(i => typeof i === 'string') : []; }
export function saveEarnedBadgesToStorage(badgeIds) { if(!Array.isArray(badgeIds)) return false; return saveDataToLS(LS_EARNED_BADGES_KEY, badgeIds); }
export function getZenModeState() { try { return localStorage.getItem(LS_ZEN_MODE_KEY) === 'true'; } catch { return false; } }
export function saveZenModeState(isEnabled) { try { localStorage.setItem(LS_ZEN_MODE_KEY, isEnabled ? 'true' : 'false'); return true; } catch (e) { console.error("Err sauvegarde Mode Zen:", e); return false; } }

// Distractions (Utilisation LS pour simplicité) <<<=== NOUVELLES FONCTIONS ICI
export function getDistractions() {
    const data = loadDataFromLS(DISTRACTIONS_LS_KEY);
    return Array.isArray(data) ? data.filter(item => typeof item === 'string') : [];
}
export function saveDistractions(distractionsList) {
     if (!Array.isArray(distractionsList)) return false;
     const validList = distractionsList.filter(item => typeof item === 'string' && item.trim() !== '');
    return saveDataToLS(DISTRACTIONS_LS_KEY, validList);
}


// ** INDEXEDDB **
// Journal
export async function getJournalEntries() { return getAllData(STORES.JOURNAL); }
export async function addJournalEntry(entryData) { if(!entryData||typeof entryData!=='object') throw new Error("Donnée journal invalide"); return putData(STORES.JOURNAL, entryData); }
export async function deleteJournalEntry(entryId) { return deleteDataByKey(STORES.JOURNAL, entryId); }
// Humeur
export async function getMoodEntryForDate(dateString) { return getDataByKey(STORES.MOOD, dateString); }
export async function saveMoodEntry(moodData) { if(!moodData||typeof moodData!=='object'||!moodData.date) throw new Error("Donnée humeur invalide"); return putData(STORES.MOOD, moodData); }
export async function getAllMoodEntries() { return getAllData(STORES.MOOD); }
// Routine
export async function getRoutineForDate(dateString) { const d = await getDataByKey(STORES.ROUTINE, dateString); return (d && Array.isArray(d.tasks)) ? d : null; }
export async function saveRoutineForDate(dateString, routineData) { if(!dateString) throw new Error("Date manquante routine"); if (routineData === null) { return deleteDataByKey(STORES.ROUTINE, dateString); } else { if(typeof routineData!=='object'||!Array.isArray(routineData.tasks)) throw new Error("Donnée routine invalide"); return putData(STORES.ROUTINE, { ...routineData, date: dateString }); } }
// Planificateur
export async function getPlannerForDate(dateString) { const d = await getDataByKey(STORES.PLANNER, dateString); return (d && Array.isArray(d.tasks)) ? d : null; }
export async function savePlannerForDate(dateString, plannerData) { if(!dateString) throw new Error("Date manquante plan"); if (plannerData === null) { return deleteDataByKey(STORES.PLANNER, dateString); } else { if(typeof plannerData!=='object'||!Array.isArray(plannerData.tasks)) throw new Error("Donnée plan invalide"); return putData(STORES.PLANNER, { ...plannerData, date: dateString }); } }
// Victoires
export async function getVictories() { return getAllData(STORES.VICTORIES); }
export async function addVictory(victoryData) { if(!victoryData||typeof victoryData!=='object'||!victoryData.text) throw new Error("Donnée victoire invalide"); return putData(STORES.VICTORIES, victoryData); }
export async function deleteVictory(victoryId) { return deleteDataByKey(STORES.VICTORIES, victoryId); }


// --- Fonction d'Export ---
export async function getAllAppData() {
    const allData = { settings: {}, journal: [], mood: [], routines: {}, plans: {}, victories: [], distractions: [] }; // Ajout distractions
    try {
        allData.settings.sobrietyStartDate = getSobrietyStartDate();
        allData.settings.earnedBadges = getEarnedBadgesFromStorage();
        allData.settings.isZenModeEnabled = getZenModeState();
        allData.distractions = getDistractions(); // Ajouter les distractions à l'export
    } catch(e){ console.error("Erreur lecture LS pour export:", e); }
    try {
        const db = await openDB();
        const [journal, mood, victories, routineKeys, plannerKeys] = await Promise.all([ getAllData(STORES.JOURNAL).catch(e => {console.warn("Exp: Err journal",e); return[];}), getAllData(STORES.MOOD).catch(e => {console.warn("Exp: Err mood",e); return[];}), getAllData(STORES.VICTORIES).catch(e => {console.warn("Exp: Err victoires",e); return[];}), getAllKeys(STORES.ROUTINE).catch(e => {console.warn("Exp: Err keys routine",e); return[];}), getAllKeys(STORES.PLANNER).catch(e => {console.warn("Exp: Err keys plan",e); return[];}) ]);
        allData.journal = journal; allData.mood = mood; allData.victories = victories;
        const routinePromises = routineKeys.map(key => getDataByKey(STORES.ROUTINE, key).catch(e => {console.warn(`Exp: Err routine ${key}`); return null;}));
        const planPromises = plannerKeys.map(key => getDataByKey(STORES.PLANNER, key).catch(e => {console.warn(`Exp: Err plan ${key}`); return null;}));
        const routineResults = await Promise.all(routinePromises); routineResults.forEach(r => { if(r) allData.routines[r.date] = r; });
        const planResults = await Promise.all(planPromises); planResults.forEach(p => { if(p) allData.plans[p.date] = p; });
    } catch (error) { console.error("Erreur récup IDB pour export:", error); alert("Erreur export données IDB."); }
    return allData;
}
