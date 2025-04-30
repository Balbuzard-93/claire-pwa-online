// storageUtils.js (Version avec IndexedDB Helpers - Révisée et Complète)

// --- Constantes de Clés ---
const LS_SOBRIETY_START_DATE_KEY = 'claireAppSobrietyStartDate';
const LS_EARNED_BADGES_KEY = 'claireAppEarnedBadges';
const LS_ZEN_MODE_KEY = 'claireAppZenModeEnabled';

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
            if (!('indexedDB' in window)) {
                 console.error("IndexedDB n'est pas supporté.");
                 return reject("IndexedDB non supporté");
            }
            const request = indexedDB.open(DB_NAME, DB_VERSION);
            request.onerror = (event) => { console.error("Erreur ouverture IndexedDB:", event.target.error); dbPromise = null; reject(`Erreur ouverture IndexedDB: ${event.target.error}`); };
            request.onsuccess = (event) => { resolve(event.target.result); };
            request.onupgradeneeded = (event) => {
                console.log("Mise à niveau IndexedDB (onupgradeneeded)...");
                const db = event.target.result;
                if (!db.objectStoreNames.contains(STORES.JOURNAL)) { db.createObjectStore(STORES.JOURNAL, { keyPath: 'id', autoIncrement: true }).createIndex('timestamp', 'timestamp'); console.log(`OS ${STORES.JOURNAL} créé.`); }
                if (!db.objectStoreNames.contains(STORES.MOOD)) { db.createObjectStore(STORES.MOOD, { keyPath: 'date' }); console.log(`OS ${STORES.MOOD} créé.`); }
                if (!db.objectStoreNames.contains(STORES.ROUTINE)) { db.createObjectStore(STORES.ROUTINE, { keyPath: 'date' }); console.log(`OS ${STORES.ROUTINE} créé.`); }
                if (!db.objectStoreNames.contains(STORES.PLANNER)) { db.createObjectStore(STORES.PLANNER, { keyPath: 'date' }); console.log(`OS ${STORES.PLANNER} créé.`); }
                if (!db.objectStoreNames.contains(STORES.VICTORIES)) { db.createObjectStore(STORES.VICTORIES, { keyPath: 'id', autoIncrement: true }).createIndex('timestamp', 'timestamp'); console.log(`OS ${STORES.VICTORIES} créé.`); }
                console.log("Mise à niveau IndexedDB terminée.");
            };
             request.onblocked = (event) => { console.warn("Ouverture IndexedDB bloquée.", event); reject("Ouverture IndexedDB bloquée"); };
        });
    }
    return dbPromise;
}

/** Opération générique pour lire/écrire dans IndexedDB */
async function operateOnStore(storeName, mode = 'readonly', operation) {
    try {
        const db = await openDB();
        const transaction = db.transaction(storeName, mode);
        const store = transaction.objectStore(storeName);
        const result = await operation(store, transaction);
        return result;
    } catch (error) { console.error(`Erreur op ${mode} sur ${storeName}:`, error); throw error; }
}

// --- Fonctions Utilitaires (Date, localStorage générique) ---
export function getCurrentDateString() { const d=new Date(); return `${d.getUTCFullYear()}-${(d.getUTCMonth()+1).toString().padStart(2,'0')}-${d.getUTCDate().toString().padStart(2,'0')}`; }
function loadDataFromLS(key) { try { const d=localStorage.getItem(key); return d===null?null:JSON.parse(d); } catch(e){ console.error(`Err lecture LS (${key}):`,e); return null; } }
function saveDataToLS(key, data) { try { localStorage.setItem(key,JSON.stringify(data)); return true; } catch(e){ console.error(`Err sauvegarde LS (${key}):`,e); if(e.name === 'QuotaExceededError'||(e.code&&(e.code===22||e.code===1014||e.code===DOMException.QUOTA_EXCEEDED_ERR))){ alert(`Stockage plein.`); } else { alert(`Erreur sauvegarde.`); } return false; } }

// --- Fonctions Spécifiques Exportées ---

// ** LOCALSTORAGE **
export function getSobrietyStartDate() { try { return localStorage.getItem(LS_SOBRIETY_START_DATE_KEY); } catch (e) { console.error("Err accès date sobriété:", e); return null; } }
export function saveSobrietyStartDate(dateString) { if(typeof dateString !== 'string') return false; try { localStorage.setItem(LS_SOBRIETY_START_DATE_KEY, dateString); return true; } catch (e) { console.error("Err sauvegarde date sobriété:", e); if(e.name === 'QuotaExceededError'||(e.code&&(e.code===22||e.code===1014||e.code===DOMException.QUOTA_EXCEEDED_ERR))){alert("Stockage plein.");} else {alert("Erreur sauvegarde date.");} return false; } }
export function getEarnedBadgesFromStorage() { const d = loadDataFromLS(LS_EARNED_BADGES_KEY); return Array.isArray(d) ? d.filter(i => typeof i === 'string') : []; }
export function saveEarnedBadgesToStorage(badgeIds) { if(!Array.isArray(badgeIds)) return false; return saveDataToLS(LS_EARNED_BADGES_KEY, badgeIds); }
export function getZenModeState() { try { return localStorage.getItem(LS_ZEN_MODE_KEY) === 'true'; } catch { return false; } }
export function saveZenModeState(isEnabled) { try { localStorage.setItem(LS_ZEN_MODE_KEY, isEnabled ? 'true' : 'false'); return true; } catch (e) { console.error("Err sauvegarde Mode Zen:", e); return false; } }

// ** INDEXEDDB **
// Journal
export async function getJournalEntries() { return operateOnStore(STORES.JOURNAL, 'readonly', store => store.getAll()); }
export async function addJournalEntry(entryData) { if(!entryData||typeof entryData!=='object') throw new Error("Donnée journal invalide"); return operateOnStore(STORES.JOURNAL, 'readwrite', store => store.put(entryData)); }
export async function deleteJournalEntry(entryId) { return operateOnStore(STORES.JOURNAL, 'readwrite', store => store.delete(entryId)); }
// Humeur
export async function getMoodEntryForDate(dateString) { if(!dateString) return undefined; return operateOnStore(STORES.MOOD, 'readonly', store => store.get(dateString)); }
export async function saveMoodEntry(moodData) { if(!moodData||typeof moodData!=='object'||!moodData.date) throw new Error("Donnée humeur invalide"); return operateOnStore(STORES.MOOD, 'readwrite', store => store.put(moodData)); }
export async function getAllMoodEntries() { return operateOnStore(STORES.MOOD, 'readonly', store => store.getAll()); } // <<<=== EXPORT EST BIEN ICI
// Routine
export async function getRoutineForDate(dateString) { if(!dateString) return null; const d = await operateOnStore(STORES.ROUTINE, 'readonly', store => store.get(dateString)); return (d && Array.isArray(d.tasks)) ? d : null; }
export async function saveRoutineForDate(dateString, routineData) { if(!dateString) throw new Error("Date manquante routine"); if (routineData === null) { return operateOnStore(STORES.ROUTINE, 'readwrite', store => store.delete(dateString)); } else { if(typeof routineData!=='object'||!Array.isArray(routineData.tasks)) throw new Error("Donnée routine invalide"); return operateOnStore(STORES.ROUTINE, 'readwrite', store => store.put({ ...routineData, date: dateString })); } }
// Planificateur
export async function getPlannerForDate(dateString) { if(!dateString) return null; const d = await operateOnStore(STORES.PLANNER, 'readonly', store => store.get(dateString)); return (d && Array.isArray(d.tasks)) ? d : null; }
export async function savePlannerForDate(dateString, plannerData) { if(!dateString) throw new Error("Date manquante plan"); if (plannerData === null) { return operateOnStore(STORES.PLANNER, 'readwrite', store => store.delete(dateString)); } else { if(typeof plannerData!=='object'||!Array.isArray(plannerData.tasks)) throw new Error("Donnée plan invalide"); return operateOnStore(STORES.PLANNER, 'readwrite', store => store.put({ ...plannerData, date: dateString })); } }
// Victoires
export async function getVictories() { return operateOnStore(STORES.VICTORIES, 'readonly', store => store.getAll()); }
export async function addVictory(victoryData) { if(!victoryData||typeof victoryData!=='object'||!victoryData.text) throw new Error("Donnée victoire invalide"); return operateOnStore(STORES.VICTORIES, 'readwrite', store => store.put(victoryData)); }
export async function deleteVictory(victoryId) { return operateOnStore(STORES.VICTORIES, 'readwrite', store => store.delete(victoryId)); }

// --- Fonction d'Export ---
export async function getAllAppData() {
    const allData = { settings: {}, journal: [], mood: [], routines: {}, plans: {}, victories: [] };
    try { allData.settings.sobrietyStartDate = getSobrietyStartDate(); allData.settings.earnedBadges = getEarnedBadgesFromStorage(); allData.settings.isZenModeEnabled = getZenModeState(); } catch(e){}
    try {
        const db = await openDB();
        const [journal, mood, victories, routineKeys, plannerKeys] = await Promise.all([ getAllData(STORES.JOURNAL), getAllData(STORES.MOOD), getAllData(STORES.VICTORIES), operateOnStore(STORES.ROUTINE, 'readonly', s => s.getAllKeys()), operateOnStore(STORES.PLANNER, 'readonly', s => s.getAllKeys()) ]);
        allData.journal = journal; allData.mood = mood; allData.victories = victories;
        const routinePromises = routineKeys.map(key => getDataByKey(STORES.ROUTINE, key)); const planPromises = plannerKeys.map(key => getDataByKey(STORES.PLANNER, key));
        const routineResults = await Promise.all(routinePromises); routineResults.forEach(r => { if(r) allData.routines[r.date] = r; });
        const planResults = await Promise.all(planPromises); planResults.forEach(p => { if(p) allData.plans[p.date] = p; });
    } catch (error) { console.error("Erreur récup IDB pour export:", error); alert("Erreur export données IDB."); }
    return allData;
}
