// storageUtils.js (Version avec IndexedDB Helpers ET Gestion Distractions LS Exportée)

// --- Constantes de Clés ---
const LS_SOBRIETY_START_DATE_KEY = 'claireAppSobrietyStartDate';
const LS_EARNED_BADGES_KEY = 'claireAppEarnedBadges';
const LS_ZEN_MODE_KEY = 'claireAppZenModeEnabled';
const DISTRACTIONS_LS_KEY = 'claireAppDistractionsList'; // <<< CLÉ POUR DISTRACTIONS

// --- Configuration IndexedDB ---
const DB_NAME = 'ClaireAppDB';
const DB_VERSION = 1;
const STORES = { JOURNAL: 'journal_entries', MOOD: 'mood_logs', ROUTINE: 'daily_routines', PLANNER: 'daily_plans', VICTORIES: 'victories_log' };

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
                console.log("Upgrade IDB..."); const db = e.target.result;
                Object.values(STORES).forEach(sN=>{ if(!db.objectStoreNames.contains(sN)){ let s; if(sN===STORES.JOURNAL||sN===STORES.VICTORIES){s=db.createObjectStore(sN,{keyPath:'id',autoIncrement:true}); s.createIndex('timestamp','timestamp');} else{s=db.createObjectStore(sN,{keyPath:'date'});} console.log(`OS ${sN} créé.`);}});
            };
            request.onblocked = (e) => { console.warn("Ouverture IDB bloquée.", e); alert("Fermez les autres onglets Clair·e et rechargez."); reject("Ouverture bloquée"); };
        });
    } return dbPromise;
}

/** Opération générique IDB */
async function operateOnStore(storeName, mode = 'readonly', operation) { /* ... (code interne helper IDB inchangé) ... */
    try {
        const db = await openDB(); if (!db) throw new Error("DB non ouverte."); if (!db.objectStoreNames.contains(storeName)) throw new Error(`Store '${storeName}' inexistant.`); const transaction = db.transaction(storeName, mode); const store = transaction.objectStore(storeName);
        return new Promise((resolve, reject) => { const request = operation(store, transaction); if (!request || typeof request.then === 'function') { resolve(request); return; } request.onsuccess = (event) => resolve(event.target.result); request.onerror = (event) => reject(`Erreur requête IDB sur ${storeName}: ${event.target.error}`); if (mode === 'readwrite') { transaction.oncomplete = () => resolve(request.result); transaction.onerror = (event) => reject(`Erreur TX ${storeName} ${mode}: ${event.target.error}`); } });
    } catch (error) { console.error(`Erreur operateOnStore (${storeName}, ${mode}):`, error); throw error; }
}
async function putData(sN, d) { return operateOnStore(sN, 'readwrite', s => s.put(d)); }
async function getDataByKey(sN, k) { if(k===undefined||k===null||k==='') return undefined; return operateOnStore(sN, 'readonly', s => s.get(k)); }
async function getAllData(sN) { return operateOnStore(sN, 'readonly', s => s.getAll()); }
async function getAllKeys(sN) { return operateOnStore(sN, 'readonly', s => s.getAllKeys()); }
async function deleteDataByKey(sN, k) { return operateOnStore(sN, 'readwrite', s => s.delete(k)); }

// --- Fonctions Utilitaires (Date, localStorage générique - EXPORTÉES) ---
export function getCurrentDateString() { const d=new Date(); return `${d.getUTCFullYear()}-${(d.getUTCMonth()+1).toString().padStart(2,'0')}-${d.getUTCDate().toString().padStart(2,'0')}`; }
export function loadDataFromLS(key) { try { const d=localStorage.getItem(key); return d===null?null:JSON.parse(d); } catch(e){ console.error(`Err lecture LS (${key}):`,e); return null; } }
export function saveDataToLS(key, data) { try { localStorage.setItem(key,JSON.stringify(data)); return true; } catch(e){ console.error(`Err sauvegarde LS (${key}):`,e); if(e.name === 'QuotaExceededError'||(e.code&&(e.code===22||e.code===1014||e.code===DOMException.QUOTA_EXCEEDED_ERR))){ alert(`Stockage plein.`); } else { alert(`Erreur sauvegarde.`); } return false; } }

// --- Fonctions Spécifiques Exportées ---

// ** LOCALSTORAGE **
export function getSobrietyStartDate() { /* ... */ }
export function saveSobrietyStartDate(dateString) { /* ... */ }
export function getEarnedBadgesFromStorage() { /* ... */ }
export function saveEarnedBadgesToStorage(badgeIds) { /* ... */ }
export function getZenModeState() { /* ... */ }
export function saveZenModeState(isEnabled) { /* ... */ }
// Distractions (Utilisation LS) <<<=== FONCTIONS AJOUTÉES/EXPORTÉES ICI
export function getDistractions() { const data = loadDataFromLS(DISTRACTIONS_LS_KEY); return Array.isArray(data) ? data.filter(item => typeof item === 'string') : []; }
export function saveDistractions(distractionsList) { if (!Array.isArray(distractionsList)) return false; const validList = distractionsList.filter(item => typeof item === 'string' && item.trim() !== ''); return saveDataToLS(DISTRACTIONS_LS_KEY, validList); }

// ** INDEXEDDB **
export async function getJournalEntries() { return getAllData(STORES.JOURNAL); }
export async function addJournalEntry(entryData) { /* ... */ }
export async function deleteJournalEntry(entryId) { /* ... */ }
export async function getMoodEntryForDate(dateString) { return getDataByKey(STORES.MOOD, dateString); }
export async function saveMoodEntry(moodData) { /* ... */ }
export async function getAllMoodEntries() { return getAllData(STORES.MOOD); }
export async function getRoutineForDate(dateString) { /* ... */ }
export async function saveRoutineForDate(dateString, routineData) { /* ... */ }
export async function getPlannerForDate(dateString) { /* ... */ }
export async function savePlannerForDate(dateString, plannerData) { /* ... */ }
export async function getVictories() { return getAllData(STORES.VICTORIES); }
export async function addVictory(victoryData) { /* ... */ }
export async function deleteVictory(victoryId) { /* ... */ }

// --- Fonction d'Export ---
export async function getAllAppData() { /* ... (code existant, mais ajouter distractions) ... */
    const allData = { settings: {}, journal: [], mood: [], routines: {}, plans: {}, victories: [], distractions: [] }; // Ajout distractions
    try { allData.settings.sobrietyStartDate = getSobrietyStartDate(); allData.settings.earnedBadges = getEarnedBadgesFromStorage(); allData.settings.isZenModeEnabled = getZenModeState(); allData.distractions = getDistractions(); } catch(e){} // Ajouter appel getDistractions
    try {
        const db = await openDB(); const [journal, mood, victories, routineKeys, plannerKeys] = await Promise.all([ getAllData(STORES.JOURNAL).catch(e=>[]), getAllData(STORES.MOOD).catch(e=>[]), getAllData(STORES.VICTORIES).catch(e=>[]), getAllKeys(STORES.ROUTINE).catch(e=>[]), getAllKeys(STORES.PLANNER).catch(e=>[]) ]);
        allData.journal = journal; allData.mood = mood; allData.victories = victories;
        const routinePromises = routineKeys.map(key => getDataByKey(STORES.ROUTINE, key).catch(e => null)); const planPromises = plannerKeys.map(key => getDataByKey(STORES.PLANNER, key).catch(e => null));
        const routineResults = await Promise.all(routinePromises); routineResults.forEach(r => { if(r) allData.routines[r.date] = r; });
        const planResults = await Promise.all(planPromises); planResults.forEach(p => { if(p) allData.plans[p.date] = p; });
    } catch (error) { console.error("Erreur récup IDB pour export:", error); alert("Erreur export données IDB."); }
    return allData;
}
