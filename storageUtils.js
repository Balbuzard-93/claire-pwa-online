// storageUtils.js (Version avec Store pour Journal des Pensées)

// --- Constantes de Clés ---
const LS_SOBRIETY_START_DATE_KEY = 'claireAppSobrietyStartDate';
const LS_EARNED_BADGES_KEY = 'claireAppEarnedBadges';
const LS_ZEN_MODE_KEY = 'claireAppZenModeEnabled'; // Supprimé (pour info, code déjà retiré)
const DISTRACTIONS_LS_KEY = 'claireAppDistractionsList';

// --- Configuration IndexedDB ---
const DB_NAME = 'ClaireAppDB';
const DB_VERSION = 2; // <<<< VERSION AUGMENTÉE ICI
const STORES = {
    JOURNAL: 'journal_entries',
    MOOD: 'mood_logs',
    ROUTINE: 'daily_routines',
    PLANNER: 'daily_plans',
    VICTORIES: 'victories_log',
    THOUGHT_RECORDS: 'thought_records' // <<< NOUVEAU STORE AJOUTÉ
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
            request.onupgradeneeded = (event) => {
                console.log("Upgrade IDB (onupgradeneeded) pour version:", event.newVersion, "depuis:", event.oldVersion);
                const db = event.target.result;
                const transaction = event.target.transaction; // Utiliser la transaction de l'événement

                // Créer/vérifier les stores existants (bonne pratique de les lister tous)
                if (event.oldVersion < 1 || !db.objectStoreNames.contains(STORES.JOURNAL)) {
                    const journalStore = db.createObjectStore(STORES.JOURNAL, { keyPath: 'id', autoIncrement: true });
                    if (!journalStore.indexNames.contains('timestamp')) journalStore.createIndex('timestamp', 'timestamp');
                    console.log(`OS ${STORES.JOURNAL} créé/vérifié.`);
                }
                if (event.oldVersion < 1 || !db.objectStoreNames.contains(STORES.MOOD)) {
                    db.createObjectStore(STORES.MOOD, { keyPath: 'date' });
                    console.log(`OS ${STORES.MOOD} créé/vérifié.`);
                }
                if (event.oldVersion < 1 || !db.objectStoreNames.contains(STORES.ROUTINE)) {
                    db.createObjectStore(STORES.ROUTINE, { keyPath: 'date' });
                    console.log(`OS ${STORES.ROUTINE} créé/vérifié.`);
                }
                if (event.oldVersion < 1 || !db.objectStoreNames.contains(STORES.PLANNER)) {
                    db.createObjectStore(STORES.PLANNER, { keyPath: 'date' });
                    console.log(`OS ${STORES.PLANNER} créé/vérifié.`);
                }
                if (event.oldVersion < 1 || !db.objectStoreNames.contains(STORES.VICTORIES)) {
                    const victoryStore = db.createObjectStore(STORES.VICTORIES, { keyPath: 'id', autoIncrement: true });
                    if (!victoryStore.indexNames.contains('timestamp')) victoryStore.createIndex('timestamp', 'timestamp');
                    console.log(`OS ${STORES.VICTORIES} créé/vérifié.`);
                }

                // *** AJOUT CRÉATION STORE POUR JOURNAL DES PENSÉES (si on passe à DB_VERSION >= 2) ***
                if (event.oldVersion < 2) { // S'exécute si on upgrade vers la version 2 ou plus
                    if (!db.objectStoreNames.contains(STORES.THOUGHT_RECORDS)) {
                        const thoughtStore = db.createObjectStore(STORES.THOUGHT_RECORDS, { keyPath: 'id', autoIncrement: true });
                        thoughtStore.createIndex('timestamp', 'timestamp');
                        console.log(`OS ${STORES.THOUGHT_RECORDS} créé.`);
                    }
                }
                // *** FIN AJOUT ***
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
async function getDataByKey(sN, k) { if(k===undefined||k===null||k==='') return undefined; return operateOnStore(sN, 'readonly', s => s.get(k)); }
async function getAllData(sN) { return operateOnStore(sN, 'readonly', s => s.getAll()); }
async function getAllKeys(sN) { return operateOnStore(sN, 'readonly', s => s.getAllKeys()); }
async function deleteDataByKey(sN, k) { return operateOnStore(sN, 'readwrite', s => s.delete(k)); }

// --- Fonctions Utilitaires LS ---
export function getCurrentDateString() { const d=new Date(); return `${d.getUTCFullYear()}-${(d.getUTCMonth()+1).toString().padStart(2,'0')}-${d.getUTCDate().toString().padStart(2,'0')}`; }
export function loadDataFromLS(key) { try { const d=localStorage.getItem(key); return d===null?null:JSON.parse(d); } catch(e){ console.error(`Err lecture LS (${key}):`,e); return null; } }
export function saveDataToLS(key, data) { try { localStorage.setItem(key,JSON.stringify(data)); return true; } catch(e){ console.error(`Err sauvegarde LS (${key}):`,e); if(e.name === 'QuotaExceededError'||(e.code&&(e.code===22||e.code===1014||e.code===DOMException.QUOTA_EXCEEDED_ERR))){ alert(`Stockage plein.`); } else { alert(`Erreur sauvegarde.`); } return false; } }

// --- Fonctions Spécifiques Exportées ---
// ** LOCALSTORAGE **
export function getSobrietyStartDate() { /* ... */ }
export function saveSobrietyStartDate(dateString) { /* ... */ }
export function getEarnedBadgesFromStorage() { /* ... */ }
export function saveEarnedBadgesToStorage(badgeIds) { /* ... */ }
// getZenModeState et saveZenModeState sont SUPPRIMÉES
export function getDistractions() { const data = loadDataFromLS(DISTRACTIONS_LS_KEY); return Array.isArray(data) ? data.filter(item => typeof item === 'string') : []; }
export function saveDistractions(distractionsList) { if (!Array.isArray(distractionsList)) return false; const validList = distractionsList.filter(item => typeof item === 'string' && item.trim() !== ''); return saveDataToLS(DISTRACTIONS_LS_KEY, validList); }

// ** INDEXEDDB **
// Journal, Humeur, Routine, Planificateur, Victoires (fonctions existantes inchangées)
export async function getJournalEntries() { return getAllData(STORES.JOURNAL); }
export async function addJournalEntry(entryData) { if(!entryData||typeof entryData!=='object') throw new Error("Donnée journal invalide"); return putData(STORES.JOURNAL, entryData); }
export async function deleteJournalEntry(entryId) { return deleteDataByKey(STORES.JOURNAL, entryId); }
export async function getMoodEntryForDate(dateString) { return getDataByKey(STORES.MOOD, dateString); }
export async function saveMoodEntry(moodData) { if(!moodData||typeof moodData!=='object'||!moodData.date) throw new Error("Donnée humeur invalide"); return putData(STORES.MOOD, moodData); }
export async function getAllMoodEntries() { return getAllData(STORES.MOOD); }
export async function getRoutineForDate(dateString) { const d = await getDataByKey(STORES.ROUTINE, dateString); return (d && Array.isArray(d.tasks)) ? d : null; }
export async function saveRoutineForDate(dateString, routineData) { if(!dateString) throw new Error("Date manquante routine"); if (routineData === null) { return deleteDataByKey(STORES.ROUTINE, dateString); } else { if(typeof routineData!=='object'||!Array.isArray(routineData.tasks)) throw new Error("Donnée routine invalide"); return putData(STORES.ROUTINE, { ...routineData, date: dateString }); } }
export async function getPlannerForDate(dateString) { const d = await getDataByKey(STORES.PLANNER, dateString); return (d && Array.isArray(d.tasks)) ? d : null; }
export async function savePlannerForDate(dateString, plannerData) { if(!dateString) throw new Error("Date manquante plan"); if (plannerData === null) { return deleteDataByKey(STORES.PLANNER, dateString); } else { if(typeof plannerData!=='object'||!Array.isArray(plannerData.tasks)) throw new Error("Donnée plan invalide"); return putData(STORES.PLANNER, { ...plannerData, date: dateString }); } }
export async function getVictories() { return getAllData(STORES.VICTORIES); }
export async function addVictory(victoryData) { if(!victoryData||typeof victoryData!=='object'||!victoryData.text) throw new Error("Donnée victoire invalide"); return putData(STORES.VICTORIES, victoryData); }
export async function deleteVictory(victoryId) { return deleteDataByKey(STORES.VICTORIES, victoryId); }

// *** NOUVELLES FONCTIONS POUR JOURNAL DES PENSÉES ***
export async function getThoughtRecords() {
    return getAllData(STORES.THOUGHT_RECORDS);
}
export async function addThoughtRecord(recordData) {
    if (!recordData || typeof recordData !== 'object' || !recordData.timestamp) {
        throw new Error("Donnée d'enregistrement de pensée invalide pour ajout");
    }
    return putData(STORES.THOUGHT_RECORDS, recordData);
}
export async function deleteThoughtRecord(recordId) {
    return deleteDataByKey(STORES.THOUGHT_RECORDS, recordId);
}
// *** FIN NOUVELLES FONCTIONS ***

// --- Fonction d'Export ---
export async function getAllAppData() {
    const allData = { settings: {}, journal: [], mood: [], routines: {}, plans: {}, victories: [], distractions: [], thoughtRecords: [] };
    try { allData.settings.sobrietyStartDate = getSobrietyStartDate(); allData.settings.earnedBadges = getEarnedBadgesFromStorage(); /* ZenMode retiré */ allData.distractions = getDistractions(); } catch(e){ console.error("Erreur lecture LS pour export:", e); }
    try {
        const db = await openDB();
        const [journal, mood, victories, routineKeys, plannerKeys, thoughtRecords] = await Promise.all([
            getAllData(STORES.JOURNAL).catch(e=>[]), getAllData(STORES.MOOD).catch(e=>[]), getAllData(STORES.VICTORIES).catch(e=>[]),
            getAllKeys(STORES.ROUTINE).catch(e=>[]), getAllKeys(STORES.PLANNER).catch(e=>[]),
            getAllData(STORES.THOUGHT_RECORDS).catch(e => { console.warn("Export: Err lecture thought_records", e); return []; }) // Ajout
        ]);
        allData.journal = journal; allData.mood = mood; allData.victories = victories; allData.thoughtRecords = thoughtRecords; // Ajout
        const routinePromises = routineKeys.map(key => getDataByKey(STORES.ROUTINE, key).catch(e => null));
        const planPromises = plannerKeys.map(key => getDataByKey(STORES.PLANNER, key).catch(e => null));
        const routineResults = await Promise.all(routinePromises); routineResults.forEach(r => { if(r && r.date) allData.routines[r.date] = r; });
        const planResults = await Promise.all(planPromises); planResults.forEach(p => { if(p && p.date) allData.plans[p.date] = p; });
    } catch (error) { console.error("Erreur récup IDB pour export:", error); alert("Erreur export données IDB."); }
    return allData;
}
