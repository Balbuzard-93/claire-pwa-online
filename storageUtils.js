// storageUtils.js (Complet - Inclut Valeurs Personnelles et Suivi d'Activités)

// --- Constantes de Clés ---
const LS_EARNED_BADGES_KEY = 'claireAppEarnedBadges';
const DISTRACTIONS_LS_KEY = 'claireAppDistractionsList';
const LS_PERSONAL_VALUES_KEY = 'claireAppPersonalValues'; // Pour les valeurs personnelles

// --- Configuration IndexedDB ---
const DB_NAME = 'ClaireAppDB';
const DB_VERSION = 4; // <<<< VERSION MISE À JOUR (pour activity_logs)
const STORES = {
    JOURNAL: 'journal_entries',
    MOOD: 'mood_logs',
    ROUTINE: 'daily_routines',
    PLANNER: 'daily_plans',
    VICTORIES: 'victories_log',
    THOUGHT_RECORDS: 'thought_records',
    ALCOHOL_LOG: 'alcohol_consumption_log',
    ACTIVITY_LOGS: 'activity_logs' // <<< NOUVEAU STORE
};

let dbPromise = null;

/** Ouvre la base de données IndexedDB */
function openDB() {
    if (!dbPromise) {
        dbPromise = new Promise((resolve, reject) => {
            if (!('indexedDB' in window)) return reject("IndexedDB non supporté");
            const request = indexedDB.open(DB_NAME, DB_VERSION);
            request.onerror = (e) => { console.error("Erreur ouverture IDB:", e.target.error?.name); dbPromise = null; reject(e.target.error); };
            request.onsuccess = (e) => resolve(e.target.result);
            request.onupgradeneeded = (event) => {
                console.log("Upgrade IDB pour version:", event.newVersion, "depuis:", event.oldVersion);
                const db = event.target.result;
                // Vérifier/Créer stores existants (pourrait être factorisé)
                if (event.oldVersion < 1 || !db.objectStoreNames.contains(STORES.JOURNAL)) { const jS=db.createObjectStore(STORES.JOURNAL,{keyPath:'id',autoIncrement:true}); if(!jS.indexNames.contains('timestamp'))jS.createIndex('timestamp','timestamp'); console.log(`OS ${STORES.JOURNAL} créé.`); }
                if (event.oldVersion < 1 || !db.objectStoreNames.contains(STORES.MOOD)) { db.createObjectStore(STORES.MOOD,{keyPath:'date'}); console.log(`OS ${STORES.MOOD} créé.`); }
                if (event.oldVersion < 1 || !db.objectStoreNames.contains(STORES.ROUTINE)) { db.createObjectStore(STORES.ROUTINE,{keyPath:'date'}); console.log(`OS ${STORES.ROUTINE} créé.`); }
                if (event.oldVersion < 1 || !db.objectStoreNames.contains(STORES.PLANNER)) { db.createObjectStore(STORES.PLANNER,{keyPath:'date'}); console.log(`OS ${STORES.PLANNER} créé.`); }
                if (event.oldVersion < 1 || !db.objectStoreNames.contains(STORES.VICTORIES)) { const vS=db.createObjectStore(STORES.VICTORIES,{keyPath:'id',autoIncrement:true}); if(!vS.indexNames.contains('timestamp'))vS.createIndex('timestamp','timestamp'); console.log(`OS ${STORES.VICTORIES} créé.`); }
                if (event.oldVersion < 2 || !db.objectStoreNames.contains(STORES.THOUGHT_RECORDS)) { const tS=db.createObjectStore(STORES.THOUGHT_RECORDS,{keyPath:'id',autoIncrement:true}); if(!tS.indexNames.contains('timestamp'))tS.createIndex('timestamp','timestamp'); console.log(`OS ${STORES.THOUGHT_RECORDS} créé.`); }
                if (event.oldVersion < 3 || !db.objectStoreNames.contains(STORES.ALCOHOL_LOG)) { db.createObjectStore(STORES.ALCOHOL_LOG, { keyPath: 'date' }); console.log(`OS ${STORES.ALCOHOL_LOG} créé.`); }

                // Store pour SUIVI ACTIVITÉS (ajouté à la v4)
                if (event.oldVersion < 4) {
                    if (!db.objectStoreNames.contains(STORES.ACTIVITY_LOGS)) {
                        const activityStore = db.createObjectStore(STORES.ACTIVITY_LOGS, { keyPath: 'id', autoIncrement: true });
                        activityStore.createIndex('date', 'date');
                        activityStore.createIndex('timestamp', 'timestamp');
                        console.log(`OS ${STORES.ACTIVITY_LOGS} créé.`);
                    }
                }
                console.log("Mise à niveau IndexedDB terminée.");
            };
            request.onblocked = (e) => { console.warn("Ouverture IDB bloquée.", e); alert("Clair·e MAJ. Fermez autres onglets & rechargez."); reject("Ouverture bloquée"); };
        });
    } return dbPromise;
}

/** Opération générique IDB (inchangée) */
async function operateOnStore(storeName, mode = 'readonly', operation) { /* ... (code helper précédent) ... */ }
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
export function getEarnedBadgesFromStorage() { const d = loadDataFromLS(LS_EARNED_BADGES_KEY); return Array.isArray(d) ? d.filter(i => typeof i === 'string') : []; }
export function saveEarnedBadgesToStorage(badgeIds) { if(!Array.isArray(badgeIds)) return false; return saveDataToLS(LS_EARNED_BADGES_KEY, badgeIds); }
export function getDistractions() { const data = loadDataFromLS(DISTRACTIONS_LS_KEY); return Array.isArray(data) ? data.filter(item => typeof item === 'string') : []; }
export function saveDistractions(distractionsList) { if (!Array.isArray(distractionsList)) return false; const validList = distractionsList.filter(item => typeof item === 'string' && item.trim() !== ''); return saveDataToLS(DISTRACTIONS_LS_KEY, validList); }
export function getPersonalValues() { const data = loadDataFromLS(LS_PERSONAL_VALUES_KEY); return Array.isArray(data) ? data.filter(item => typeof item === 'string' && item.trim() !== '') : []; }
export function savePersonalValues(valuesArray) { if (!Array.isArray(valuesArray)) return false; const validValues = [...new Set(valuesArray.map(v => typeof v === 'string' ? v.trim() : '').filter(v => v !== ''))]; return saveDataToLS(LS_PERSONAL_VALUES_KEY, validValues); }

// ** INDEXEDDB **
// Journal, Humeur, Routine, Planificateur, Victoires, Journal des Pensées, Log Alcool (fonctions existantes inchangées)
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
export async function getThoughtRecords() { return getAllData(STORES.THOUGHT_RECORDS); }
export async function addThoughtRecord(recordData) { if (!recordData || typeof recordData !== 'object' || !recordData.timestamp) throw new Error("Donnée enregistrement pensée invalide"); return putData(STORES.THOUGHT_RECORDS, recordData); }
export async function deleteThoughtRecord(recordId) { return deleteDataByKey(STORES.THOUGHT_RECORDS, recordId); }
export async function getAlcoholLogForDate(dateString) { if (!dateString) return null; const data = await getDataByKey(STORES.ALCOHOL_LOG, dateString); return (data && typeof data === 'object' && typeof data.totalUnits === 'number' && Array.isArray(data.drinks)) ? data : null; }
export async function saveAlcoholLogForDate(dateString, logData) { if (!dateString || !logData || typeof logData !== 'object' || typeof logData.totalUnits !== 'number' || !Array.isArray(logData.drinks)) throw new Error("Données log alcool invalides"); const dataToSave = { ...logData, date: dateString }; return putData(STORES.ALCOHOL_LOG, dataToSave); }
export async function getAllAlcoholLogs() { return getAllData(STORES.ALCOHOL_LOG); }

// Suivi d'Activités
export async function addActivityLog(activityData) { if (!activityData || typeof activityData!=='object' || !activityData.timestamp || !activityData.date || !activityData.activityText) throw new Error("Données log activité invalides"); if (!Array.isArray(activityData.linkedValues)) activityData.linkedValues = []; return putData(STORES.ACTIVITY_LOGS, activityData); }
export async function getActivityLogsForDate(dateString) { if (!dateString) return []; const db = await openDB(); const tx = db.transaction(STORES.ACTIVITY_LOGS, 'readonly'); const store = tx.objectStore(STORES.ACTIVITY_LOGS); const index = store.index('date'); const request = index.getAll(dateString); return new Promise((resolve, reject) => { request.onsuccess = () => { const logs = request.result || []; logs.forEach(log => { if (!Array.isArray(log.linkedValues)) log.linkedValues = []; }); resolve(logs); }; request.onerror = (e) => reject(`Err lecture logs act par date: ${e.target.error?.name}`); tx.onerror = (e) => reject(`Err TX logs act par date: ${e.target.error?.name}`); }); }
export async function getAllActivityLogs() { const allLogs = await getAllData(STORES.ACTIVITY_LOGS); if (Array.isArray(allLogs)) { allLogs.forEach(log => { if (!Array.isArray(log.linkedValues)) log.linkedValues = []; }); } return allLogs || []; }
export async function deleteActivityLog(activityId) { return deleteDataByKey(STORES.ACTIVITY_LOGS, activityId); }

// --- Fonction d'Export ---
export async function getAllAppData() {
    const allData = { settings: {}, journal: [], mood: [], routines: {}, plans: {}, victories: [], distractions: [], thoughtRecords: [], alcoholLogs: [], activityLogs: [] };
    try {
        allData.settings.earnedBadges = getEarnedBadgesFromStorage();
        allData.distractions = getDistractions();
        allData.settings.personalValues = getPersonalValues(); // Ajouté
    } catch(e){ console.error("Erreur lecture LS pour export:", e); }
    try {
        const [journal, mood, victories, routineKeys, plannerKeys, thoughtRecords, alcoholLogs, activityLogs] = await Promise.all([
            getAllData(STORES.JOURNAL).catch(e=>[]), getAllData(STORES.MOOD).catch(e=>[]), getAllData(STORES.VICTORIES).catch(e=>[]),
            getAllKeys(STORES.ROUTINE).catch(e=>[]), getAllKeys(STORES.PLANNER).catch(e=>[]),
            getAllData(STORES.THOUGHT_RECORDS).catch(e=>[]), getAllData(STORES.ALCOHOL_LOG).catch(e=>[]),
            getAllActivityLogs().catch(e => []) // Ajouté
        ]);
        allData.journal = journal; allData.mood = mood; allData.victories = victories; allData.thoughtRecords = thoughtRecords; allData.alcoholLogs = alcoholLogs; allData.activityLogs = activityLogs; // Ajouté
        const routinePromises = routineKeys.map(key => getDataByKey(STORES.ROUTINE, key).catch(e => null));
        const planPromises = plannerKeys.map(key => getDataByKey(STORES.PLANNER, key).catch(e => null));
        const routineResults = await Promise.all(routinePromises); routineResults.forEach(r => { if(r && r.date) allData.routines[r.date] = r; });
        const planResults = await Promise.all(planPromises); planResults.forEach(p => { if(p && p.date) allData.plans[p.date] = p; });
    } catch (error) { console.error("Erreur récup IDB pour export:", error); alert("Erreur export données IDB."); }
    return allData;
}
