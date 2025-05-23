// storageUtils.js (Vérification - Doit contenir LS_PERSONAL_VALUES_KEY)

// --- Constantes de Clés ---
const LS_EARNED_BADGES_KEY = 'claireAppEarnedBadges';
const DISTRACTIONS_LS_KEY = 'claireAppDistractionsList';
const LS_PERSONAL_VALUES_KEY = 'claireAppPersonalValues'; // <<< S'ASSURER QU'ELLE EST BIEN LÀ

// --- Configuration IndexedDB ---
const DB_NAME = 'ClaireAppDB';
const DB_VERSION = 6; // Incremented for gratitude_entries and user_goals stores
const STORES = { JOURNAL: 'journal_entries', MOOD: 'mood_logs', ROUTINE: 'daily_routines', PLANNER: 'daily_plans', VICTORIES: 'victories_log', THOUGHT_RECORDS: 'thought_records', ALCOHOL_LOG: 'alcohol_consumption_log', ACTIVITY_LOGS: 'activity_logs', GRATITUDE: 'gratitude_entries', GOALS: 'user_goals' };

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
                Object.values(STORES).forEach(storeName => {
                    if (!db.objectStoreNames.contains(storeName)) {
                        let store;
                        if ([STORES.JOURNAL, STORES.VICTORIES, STORES.THOUGHT_RECORDS, STORES.ACTIVITY_LOGS, STORES.GRATITUDE, STORES.GOALS].includes(storeName)) {
                            store = db.createObjectStore(storeName, { keyPath: 'id', autoIncrement: true });
                            if (storeName === STORES.ACTIVITY_LOGS) store.createIndex('date', 'date');
                            if ([STORES.JOURNAL, STORES.VICTORIES, STORES.THOUGHT_RECORDS, STORES.GRATITUDE, STORES.ACTIVITY_LOGS].includes(storeName)) {
                                store.createIndex('timestamp', 'timestamp');
                            }
                            if (storeName === STORES.GOALS) {
                                store.createIndex('status_idx', 'status'); // Index for goals status
                                store.createIndex('createdAt', 'createdAt'); // Index for sorting goals by creation date
                            }
                        } else { store = db.createObjectStore(storeName, { keyPath: 'date' }); }
                        console.log(`OS ${storeName} créé.`);
                    } else {
                         // Logic for upgrading existing stores if schema changes
                         if (storeName === STORES.GRATITUDE && !event.target.transaction.objectStore(storeName).indexNames.contains('timestamp')) {
                            const storeToUpdate = event.target.transaction.objectStore(storeName);
                            storeToUpdate.createIndex('timestamp', 'timestamp');
                            console.log(`Index 'timestamp' créé pour ${STORES.GRATITUDE}.`);
                         }
                         if (storeName === STORES.GOALS) {
                            const goalStore = event.target.transaction.objectStore(STORES.GOALS);
                            if (!goalStore.indexNames.contains('status_idx')) {
                                goalStore.createIndex('status_idx', 'status');
                                console.log(`Index 'status_idx' créé pour ${STORES.GOALS}.`);
                            }
                            if (!goalStore.indexNames.contains('createdAt')) {
                                goalStore.createIndex('createdAt', 'createdAt');
                                console.log(`Index 'createdAt' créé pour ${STORES.GOALS}.`);
                            }
                         } else if (storeName === STORES.ACTIVITY_LOGS && event.oldVersion < 4) {
                              const store = event.target.transaction.objectStore(storeName);
                              if (!store.indexNames.contains('date')) store.createIndex('date', 'date');
                              if (!store.indexNames.contains('timestamp')) store.createIndex('timestamp', 'timestamp');
                         }
                    }
                });
                console.log("Mise à niveau IndexedDB terminée.");
            };
            request.onblocked = (e) => { console.warn("Ouverture IDB bloquée.", e); alert("Clair·e MAJ. Fermez autres onglets & rechargez."); reject("Ouverture bloquée"); };
        });
    } return dbPromise;
}

async function operateOnStore(storeName, mode = 'readonly', operation) {
    try {
        const db = await openDB(); if (!db) throw new Error("DB non ouverte.");
        if (!db.objectStoreNames.contains(storeName)) { console.warn(`Store '${storeName}' inexistant, tentative réouverture.`); dbPromise = null; const newDb = await openDB(); if (!newDb.objectStoreNames.contains(storeName)) throw new Error(`Store '${storeName}' toujours inexistant.`); const transaction = newDb.transaction(storeName, mode); const store = transaction.objectStore(storeName); return new Promise((resolve, reject) => { /* ... */ }); }
        const transaction = db.transaction(storeName, mode); const store = transaction.objectStore(storeName);
        return new Promise((resolve, reject) => { const request = operation(store, transaction); if (!request) { resolve(); return; } if (typeof request.then === 'function') { request.then(resolve).catch(reject); return; } request.onsuccess = (event) => resolve(event.target.result); request.onerror = (event) => reject(`Erreur requête IDB ${storeName}: ${event.target.error?.name}`); if (mode === 'readwrite') { transaction.oncomplete = () => resolve(request.result); transaction.onerror = (event) => reject(`Erreur TX ${storeName} ${mode}: ${event.target.error?.name}`); } });
    } catch (error) { console.error(`Erreur operateOnStore (${storeName}, ${mode}):`, error); throw error; }
}
async function putData(sN, d) { return operateOnStore(sN, 'readwrite', s => s.put(d)); }
async function getDataByKey(sN, k) { if(k===undefined||k===null||k==='') return undefined; return operateOnStore(sN, 'readonly', s => s.get(k)); }
async function getAllData(sN) { return operateOnStore(sN, 'readonly', s => s.getAll()); }
async function getAllKeys(sN) { return operateOnStore(sN, 'readonly', s => s.getAllKeys()); }
async function deleteDataByKey(sN, k) { return operateOnStore(sN, 'readwrite', s => s.delete(k)); }

export function getCurrentDateString() { const d=new Date(); return `${d.getUTCFullYear()}-${(d.getUTCMonth()+1).toString().padStart(2,'0')}-${d.getUTCDate().toString().padStart(2,'0')}`; }
export function loadDataFromLS(key) { try { const d=localStorage.getItem(key); return d===null?null:JSON.parse(d); } catch(e){ console.error(`Err lecture LS (${key}):`,e); return null; } }
export function saveDataToLS(key, data) { try { localStorage.setItem(key,JSON.stringify(data)); return true; } catch(e){ console.error(`Err sauvegarde LS (${key}):`,e); if(e.name === 'QuotaExceededError'||(e.code&&(e.code===22||e.code===1014||e.code===DOMException.QUOTA_EXCEEDED_ERR))){ alert(`Stockage plein.`); } else { alert(`Erreur sauvegarde.`); } return false; } }

export function getEarnedBadgesFromStorage() { const d = loadDataFromLS(LS_EARNED_BADGES_KEY); return Array.isArray(d) ? d.filter(i => typeof i === 'string') : []; }
export function saveEarnedBadgesToStorage(badgeIds) { if(!Array.isArray(badgeIds)) return false; return saveDataToLS(LS_EARNED_BADGES_KEY, badgeIds); }
export function getDistractions() { const data = loadDataFromLS(DISTRACTIONS_LS_KEY); return Array.isArray(data) ? data.filter(item => typeof item === 'string') : []; }
export function saveDistractions(distractionsList) { if (!Array.isArray(distractionsList)) return false; const validList = distractionsList.filter(item => typeof item === 'string' && item.trim() !== ''); return saveDataToLS(DISTRACTIONS_LS_KEY, validList); }
export function getPersonalValues() { const data = loadDataFromLS(LS_PERSONAL_VALUES_KEY); return Array.isArray(data) ? data.filter(item => typeof item === 'string' && item.trim() !== '') : []; } // <<< UTILISE LS_PERSONAL_VALUES_KEY
export function savePersonalValues(valuesArray) { if (!Array.isArray(valuesArray)) return false; const validValues = [...new Set(valuesArray.map(v => typeof v === 'string' ? v.trim() : '').filter(v => v !== ''))]; return saveDataToLS(LS_PERSONAL_VALUES_KEY, validValues); }

export async function getJournalEntries() { try { const d=await getAllData(STORES.JOURNAL); return Array.isArray(d)?d:[];}catch(e){console.error("Err getJournalEntries:",e);return[];}}
export async function addJournalEntry(entryData) { if(!entryData||typeof entryData!=='object') throw new Error("Donnée journal invalide"); return putData(STORES.JOURNAL, entryData); }
export async function deleteJournalEntry(entryId) { return deleteDataByKey(STORES.JOURNAL, entryId); }
export async function getMoodEntryForDate(dateString) { return getDataByKey(STORES.MOOD, dateString); }
export async function saveMoodEntry(moodData) { if(!moodData||typeof moodData!=='object'||!moodData.date) throw new Error("Donnée humeur invalide"); return putData(STORES.MOOD, moodData); }
export async function getAllMoodEntries() { try { const d=await getAllData(STORES.MOOD); return Array.isArray(d)?d:[];}catch(e){console.error("Err getAllMoodEntries:",e);return[];}}
export async function getRoutineForDate(dateString) { const d = await getDataByKey(STORES.ROUTINE, dateString); return (d && Array.isArray(d.tasks)) ? d : null; }
export async function saveRoutineForDate(dateString, routineData) { if(!dateString) throw new Error("Date manquante routine"); if (routineData === null) { return deleteDataByKey(STORES.ROUTINE, dateString); } else { if(typeof routineData!=='object'||!Array.isArray(routineData.tasks)) throw new Error("Donnée routine invalide"); return putData(STORES.ROUTINE, { ...routineData, date: dateString }); } }
export async function getPlannerForDate(dateString) { const d = await getDataByKey(STORES.PLANNER, dateString); return (d && Array.isArray(d.tasks)) ? d : null; }
export async function savePlannerForDate(dateString, plannerData) { if(!dateString) throw new Error("Date manquante plan"); if (plannerData === null) { return deleteDataByKey(STORES.PLANNER, dateString); } else { if(typeof plannerData!=='object'||!Array.isArray(plannerData.tasks)) throw new Error("Donnée plan invalide"); return putData(STORES.PLANNER, { ...plannerData, date: dateString }); } }
export async function getVictories() { try { const d=await getAllData(STORES.VICTORIES); return Array.isArray(d)?d:[];}catch(e){console.error("Err getVictories:",e);return[];}}
export async function addVictory(victoryData) { if(!victoryData||typeof victoryData!=='object'||!victoryData.text) throw new Error("Donnée victoire invalide"); return putData(STORES.VICTORIES, victoryData); }
export async function deleteVictory(victoryId) { return deleteDataByKey(STORES.VICTORIES, victoryId); }
export async function getThoughtRecords() { try { const d=await getAllData(STORES.THOUGHT_RECORDS); return Array.isArray(d)?d:[];}catch(e){console.error("Err getThoughtRecords:",e);return[];}}
export async function addThoughtRecord(recordData) { if (!recordData || typeof recordData !== 'object' || !recordData.timestamp) throw new Error("Donnée pensée invalide"); return putData(STORES.THOUGHT_RECORDS, recordData); }
export async function deleteThoughtRecord(recordId) { return deleteDataByKey(STORES.THOUGHT_RECORDS, recordId); }
export async function getAlcoholLogForDate(dateString) { if (!dateString) return null; const data = await getDataByKey(STORES.ALCOHOL_LOG, dateString); return (data && typeof data === 'object' && typeof data.totalUnits === 'number' && Array.isArray(data.drinks)) ? data : null; }
export async function saveAlcoholLogForDate(dateString, logData) { if (!dateString || !logData || typeof logData !== 'object' || typeof logData.totalUnits !== 'number' || !Array.isArray(logData.drinks)) throw new Error("Données log alcool invalides"); const dataToSave = { ...logData, date: dateString }; return putData(STORES.ALCOHOL_LOG, dataToSave); }
export async function getAllAlcoholLogs() { try {const d=await getAllData(STORES.ALCOHOL_LOG); return Array.isArray(d)?d:[];}catch(e){console.error("Err getAllAlcoholLogs:",e);return[];}}
export async function addActivityLog(activityData) { if (!activityData||typeof activityData!=='object'||!activityData.timestamp||!activityData.date||!activityData.activityText) throw new Error("Données log activité invalides"); if(!Array.isArray(activityData.linkedValues))activityData.linkedValues=[]; return putData(STORES.ACTIVITY_LOGS, activityData); }
export async function getActivityLogsForDate(dateString) { if (!dateString) return []; const db = await openDB(); const tx = db.transaction(STORES.ACTIVITY_LOGS, 'readonly'); const store = tx.objectStore(STORES.ACTIVITY_LOGS); const index = store.index('date'); const request = index.getAll(dateString); return new Promise((resolve, reject) => { request.onsuccess = () => { const logs = request.result || []; logs.forEach(log => { if (!Array.isArray(log.linkedValues)) log.linkedValues = []; }); resolve(logs); }; request.onerror = (e) => reject(`Err lecture logs act par date: ${e.target.error?.name}`); tx.onerror = (e) => reject(`Err TX logs act par date: ${e.target.error?.name}`); }); }
export async function getAllActivityLogs() { try { const data = await getAllData(STORES.ACTIVITY_LOGS); if(Array.isArray(data)){data.forEach(log=>{if(!Array.isArray(log.linkedValues))log.linkedValues=[];});return data;}return[];}catch(e){console.error("Err getAllActivityLogs:",e);return[];}}
export async function deleteActivityLog(activityId) { return deleteDataByKey(STORES.ACTIVITY_LOGS, activityId); }

// --- Gratitude Journal Functions ---
export async function getGratitudeEntries() {
    try {
        const entries = await getAllData(STORES.GRATITUDE);
        return Array.isArray(entries) ? entries : [];
    } catch (error) {
        console.error("Error getting gratitude entries:", error);
        return [];
    }
}

export async function addGratitudeEntry(entryText) {
    if (!entryText || typeof entryText !== 'string') {
        throw new Error("Gratitude entry text is invalid");
    }
    const entryData = {
        timestamp: new Date().toISOString(),
        text: entryText
        // 'id' will be auto-generated
    };
    return putData(STORES.GRATITUDE, entryData);
}

export async function deleteGratitudeEntry(entryId) {
    if (entryId === undefined || entryId === null) {
        throw new Error("Gratitude entry ID is invalid for deletion");
    }
    return deleteDataByKey(STORES.GRATITUDE, entryId);
}
// --- End Gratitude Journal Functions ---

// --- Goal Setting Functions ---
export async function addGoal(goalData) {
    if (!goalData || typeof goalData !== 'object' || !goalData.title || !goalData.status || !goalData.createdAt) {
        throw new Error("Goal data is invalid");
    }
    return putData(STORES.GOALS, goalData);
}

export async function getGoals() {
    try {
        const goals = await getAllData(STORES.GOALS);
        return Array.isArray(goals) ? goals : [];
    } catch (error) {
        console.error("Error getting goals:", error);
        return [];
    }
}

export async function updateGoalStatus(goalId, newStatus) {
    if (goalId === undefined || goalId === null || !newStatus) {
        throw new Error("Goal ID or new status is invalid for update");
    }
    const goal = await getDataByKey(STORES.GOALS, goalId);
    if (!goal) {
        throw new Error(`Goal with ID ${goalId} not found`);
    }
    const updatedGoal = { ...goal, status: newStatus };
    return putData(STORES.GOALS, updatedGoal);
}

export async function deleteGoal(goalId) {
    if (goalId === undefined || goalId === null) {
        throw new Error("Goal ID is invalid for deletion");
    }
    return deleteDataByKey(STORES.GOALS, goalId);
}
// --- End Goal Setting Functions ---

export async function getAllAppData() {
    const allData = { settings: {}, journal: [], mood: [], routines: {}, plans: {}, victories: [], distractions: [], thoughtRecords: [], alcoholLogs: [], activityLogs: [], gratitudeEntries: [], userGoals: [] };
    try { allData.settings.earnedBadges = getEarnedBadgesFromStorage(); allData.distractions = getDistractions(); allData.settings.personalValues = getPersonalValues(); } catch(e){ console.error("Err lecture LS pour export:", e); }
    try {
        const [journal, mood, victories, routineKeys, plannerKeys, thoughtRecords, alcoholLogs, activityLogs, gratitudeEntries, userGoals] = await Promise.all([ getAllData(STORES.JOURNAL).catch(e=>[]), getAllData(STORES.MOOD).catch(e=>[]), getAllData(STORES.VICTORIES).catch(e=>[]), getAllKeys(STORES.ROUTINE).catch(e=>[]), getAllKeys(STORES.PLANNER).catch(e=>[]), getAllData(STORES.THOUGHT_RECORDS).catch(e=>[]), getAllData(STORES.ALCOHOL_LOG).catch(e=>[]), getAllActivityLogs().catch(e => []), getAllData(STORES.GRATITUDE).catch(e => []), getAllData(STORES.GOALS).catch(e => []) ].map(p => p.catch(e => { console.warn("Err partiel export IDB:", e); return []; })));
        allData.journal = journal; allData.mood = mood; allData.victories = victories; allData.thoughtRecords = thoughtRecords; allData.alcoholLogs = alcoholLogs; allData.activityLogs = activityLogs; allData.gratitudeEntries = gratitudeEntries; allData.userGoals = userGoals;
        const routinePromises = routineKeys.map(key => getDataByKey(STORES.ROUTINE, key).catch(e => null));
        const planPromises = plannerKeys.map(key => getDataByKey(STORES.PLANNER, key).catch(e => null));
        const routineResults = await Promise.all(routinePromises); routineResults.forEach(r => { if(r && r.date) allData.routines[r.date] = r; });
        const planResults = await Promise.all(planPromises); planResults.forEach(p => { if(p && p.date) allData.plans[p.date] = p; });
    } catch (error) { console.error("Erreur récup IDB pour export:", error); alert("Erreur export données IDB."); }
    return allData;
}
