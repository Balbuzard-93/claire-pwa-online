// storageUtils.js (Version Définitive - Pas de redéclarations)

// --- Constantes de Clés ---
const LS_SOBRIETY_START_DATE_KEY = 'claireAppSobrietyStartDate';
const LS_EARNED_BADGES_KEY = 'claireAppEarnedBadges';
const LS_ZEN_MODE_KEY = 'claireAppZenModeEnabled';
const DISTRACTIONS_LS_KEY = 'claireAppDistractionsList';

// --- Configuration IndexedDB ---
const DB_NAME = 'ClaireAppDB';
const DB_VERSION = 1; // Incrémenter seulement si on change la structure des stores ci-dessous
const STORES = {
    JOURNAL: 'journal_entries',
    MOOD: 'mood_logs',
    ROUTINE: 'daily_routines',
    PLANNER: 'daily_plans', // Assurez-vous que cette clé est unique
    VICTORIES: 'victories_log'
};

let dbPromise = null;

/** Ouvre la base de données IndexedDB */
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
                 console.log("Mise à niveau IndexedDB terminée.");
            };
            request.onblocked = (e) => { console.warn("Ouverture IDB bloquée.", e); alert("Fermez les autres onglets Clair·e et rechargez."); reject("Ouverture bloquée"); };
        });
    } return dbPromise;
}

/** Opération générique IDB */
async function operateOnStore(storeName, mode = 'readonly', operation) {
    try {
        const db = await openDB(); if (!db) throw new Error("DB non ouverte."); if (!db.objectStoreNames.contains(storeName)) throw new Error(`Store '${storeName}' inexistant.`); const transaction = db.transaction(storeName, mode); const store = transaction.objectStore(storeName);
        return new Promise((resolve, reject) => { const request = operation(store, transaction); if (!request || typeof request.then === 'function') { resolve(request); return; } request.onsuccess = (event) => resolve(event.target.result); request.onerror = (event) => reject(`Erreur requête IDB sur ${storeName}: ${event.target.error}`); if (mode === 'readwrite') { transaction.oncomplete = () => resolve(request.result); transaction.onerror = (event) => reject(`Erreur TX ${storeName} ${mode}: ${event.target.error}`); } });
    } catch (error) { console.error(`Erreur operateOnStore (${storeName}, ${mode}):`, error); throw error; }
}
async function putData(sN, d) { return operateOnStore(sN, 'readwrite', s => s.put(d)); }
async function getDataByKey(sN, k) { if(k===undefined||k===null||k==='') { console.warn(`Clé invalide pour getDataByKey (${sN}):`, k); return undefined; } return operateOnStore(sN, 'readonly', s => s.get(k)); }
async function getAllData(sN) { return operateOnStore(sN, 'readonly', s => s.getAll()); }
async function getAllKeys(sN) { return operateOnStore(sN, 'readonly', s => s.getAllKeys()); }
async function deleteDataByKey(sN, k) { return operateOnStore(sN, 'readwrite', s => s.delete(k)); }

// --- Fonctions Utilitaires (Date, localStorage générique - EXPORTÉES) ---
export function getCurrentDateString() { const d=new Date(); return `${d.getUTCFullYear()}-${(d.getUTCMonth()+1).toString().padStart(2,'0')}-${d.getUTCDate().toString().padStart(2,'0')}`; }
export function loadDataFromLS(key) { try { const d=localStorage.getItem(key); return d===null?null:JSON.parse(d); } catch(e){ console.error(`Err lecture LS (${key}):`,e); return null; } }
export function saveDataToLS(key, data) { try { localStorage.setItem(key,JSON.stringify(data)); return true; } catch(e){ console.error(`Err sauvegarde LS (${key}):`,e); if(e.name === 'QuotaExceededError'||(e.code&&(e.code===22||e.code===1014||e.code===DOMException.QUOTA_EXCEEDED_ERR))){ alert(`Stockage plein.`); } else { alert(`Erreur sauvegarde.`); } return false; } }

// --- Fonctions Spécifiques Exportées ---

// ** LOCALSTORAGE **
export function getSobrietyStartDate() { try { return localStorage.getItem(LS_SOBRIETY_START_DATE_KEY); } catch (e) { console.error("Err accès date sobriété:", e); return null; } }
export function saveSobrietyStartDate(dateString) { if(typeof dateString !== 'string') return false; try { localStorage.setItem(LS_SOBRIETY_START_DATE_KEY, dateString); return true; } catch (e) { console.error("Err sauvegarde date sobriété:", e); if(e.name === 'QuotaExceededError'||(e.code&&(e.code===22||e.code===1014||e.code===DOMException.QUOTA_EXCEEDED_ERR))){alert("Stockage plein.");} else {alert("Erreur sauvegarde date.");} return false; } }
export function getEarnedBadgesFromStorage() { const d = loadDataFromLS(LS_EARNED_BADGES_KEY); return Array.isArray(d) ? d.filter(i => typeof i === 'string') : []; }
export function saveEarnedBadgesToStorage(badgeIds) { if(!Array.isArray(badgeIds)) return false; return saveDataToLS(LS_EARNED_BADGES_KEY, badgeIds); }
export function getZenModeState() { try { return localStorage.getItem(LS_ZEN_MODE_KEY) === 'true'; } catch { return false; } }
export function saveZenModeState(isEnabled) { try { localStorage.setItem(LS_ZEN_MODE_KEY, isEnabled ? 'true' : 'false'); return true; } catch (e) { console.error("Err sauvegarde Mode Zen:", e); return false; } }
export function getDistractions() { const data = loadDataFromLS(DISTRACTIONS_LS_KEY); return Array.isArray(data) ? data.filter(item => typeof item === 'string') : []; }
export function saveDistractions(distractionsList) { if (!Array.isArray(distractionsList)) return false; const validList = distractionsList.filter(item => typeof item === 'string' && item.trim() !== ''); return saveDataToLS(DISTRACTIONS_LS_KEY, validList); }

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

// Planificateur <<<=== ASSUREZ-VOUS QUE CES FONCTIONS SONT UNIQUES DANS LE FICHIER
export async function getPlannerForDate(dateString) {
    if(!dateString) return null;
    const data = await getDataByKey(STORES.PLANNER, dateString);
    if (data && typeof data === 'object' && Array.isArray(data.tasks)) {
        data.tasks.forEach(task => {
            if (task.subTasks && !Array.isArray(task.subTasks)) task.subTasks = [];
            else if (!task.subTasks) task.subTasks = [];
        });
        return data;
    }
    return null;
}
export async function savePlannerForDate(dateString, plannerData) {
    if(!dateString) throw new Error("Date manquante pour sauvegarde plan");
    if (plannerData === null) {
        return deleteDataByKey(STORES.PLANNER, dateString);
    } else {
        if(typeof plannerData !== 'object' || !Array.isArray(plannerData.tasks)) throw new Error("Donnée plan invalide");
        plannerData.tasks.forEach(task => { if (!Array.isArray(task.subTasks)) task.subTasks = []; });
        return putData(STORES.PLANNER, { ...plannerData, date: dateString });
    }
}

// Victoires
export async function getVictories() { return getAllData(STORES.VICTORIES); }
export async function addVictory(victoryData) { if(!victoryData||typeof victoryData!=='object'||!victoryData.text) throw new Error("Donnée victoire invalide"); return putData(STORES.VICTORIES, victoryData); }
export async function deleteVictory(victoryId) { return deleteDataByKey(STORES.VICTORIES, victoryId); }


// --- Fonction d'Export ---
export async function getAllAppData() {
    const allData = { settings: {}, journal: [], mood: [], routines: {}, plans: {}, victories: [], distractions: [] };
    try { allData.settings.sobrietyStartDate = getSobrietyStartDate(); allData.settings.earnedBadges = getEarnedBadgesFromStorage(); allData.settings.isZenModeEnabled = getZenModeState(); allData.distractions = getDistractions(); } catch(e){ console.error("Erreur lecture LS pour export:", e); }
    try {
        const db = await openDB();
        const [journal, mood, victories, routineKeys, plannerKeys] = await Promise.all([ getAllData(STORES.JOURNAL).catch(e=>[]), getAllData(STORES.MOOD).catch(e=>[]), getAllData(STORES.VICTORIES).catch(e=>[]), getAllKeys(STORES.ROUTINE).catch(e=>[]), getAllKeys(STORES.PLANNER).catch(e=>[]) ]);
        allData.journal = journal; allData.mood = mood; allData.victories = victories;
        const routinePromises = routineKeys.map(key => getDataByKey(STORES.ROUTINE, key).catch(e => null));
        const planPromises = plannerKeys.map(key => getDataByKey(STORES.PLANNER, key).catch(e => null));
        const routineResults = await Promise.all(routinePromises); routineResults.forEach(r => { if(r && r.date) allData.routines[r.date] = r; }); // Vérifier r.date
        const planResults = await Promise.all(planPromises); planResults.forEach(p => { if(p && p.date) allData.plans[p.date] = p; }); // Vérifier p.date
    } catch (error) { console.error("Erreur récup IDB pour export:", error); alert("Erreur export données IDB."); }
    return allData;
}
