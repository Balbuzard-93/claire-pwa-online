// storageUtils.js (Version avec IndexedDB Helpers ET LS Helpers Exportés - Logs Détaillés pour Sobriété)

// --- Constantes de Clés ---
const LS_SOBRIETY_START_DATE_KEY = 'claireAppSobrietyStartDate';
const LS_EARNED_BADGES_KEY = 'claireAppEarnedBadges';
// const LS_ZEN_MODE_KEY = 'claireAppZenModeEnabled'; // Supprimé car Mode Zen retiré
const DISTRACTIONS_LS_KEY = 'claireAppDistractionsList';

// --- Configuration IndexedDB ---
const DB_NAME = 'ClaireAppDB';
const DB_VERSION = 2; // Maintenir à 2 si la structure des stores n'a pas changé depuis la dernière fois
const STORES = {
    JOURNAL: 'journal_entries',
    MOOD: 'mood_logs',
    ROUTINE: 'daily_routines',
    PLANNER: 'daily_plans',
    VICTORIES: 'victories_log',
    THOUGHT_RECORDS: 'thought_records'
};

let dbPromise = null;

/** Ouvre la base de données IndexedDB */
function openDB() {
    if (!dbPromise) {
        dbPromise = new Promise((resolve, reject) => {
            if (!('indexedDB' in window)) {
                console.error("IndexedDB n'est pas supporté.");
                return reject("IndexedDB non supporté");
            }
            const request = indexedDB.open(DB_NAME, DB_VERSION);
            request.onerror = (e) => { console.error("Erreur ouverture IDB:", e.target.error ? e.target.error.name : 'Inconnue'); dbPromise = null; reject(e.target.error); };
            request.onsuccess = (e) => { /* console.log("IDB ouverte."); */ resolve(e.target.result); };
            request.onupgradeneeded = (e) => {
                console.log("Upgrade IDB nécessaire (onupgradeneeded) pour version:", e.newVersion, "depuis:", e.oldVersion);
                const db = e.target.result;
                const transaction = e.target.transaction;
                Object.values(STORES).forEach(storeName => {
                    if (!db.objectStoreNames.contains(storeName)) {
                        let store;
                        if (storeName === STORES.JOURNAL || storeName === STORES.VICTORIES || storeName === STORES.THOUGHT_RECORDS) {
                            store = db.createObjectStore(storeName, { keyPath: 'id', autoIncrement: true });
                            if (transaction && !store.indexNames.contains('timestamp')) store.createIndex('timestamp', 'timestamp');
                        } else { // MOOD, ROUTINE, PLANNER use 'date' as key
                            store = db.createObjectStore(storeName, { keyPath: 'date' });
                        }
                        console.log(`OS ${storeName} créé.`);
                    }
                });
                console.log("Mise à niveau IndexedDB terminée.");
            };
            request.onblocked = (e) => { console.warn("Ouverture IDB bloquée.", e); alert("Clair·e a besoin de mettre à jour ses données. Veuillez fermer tous les autres onglets de l'application et recharger cette page."); reject("Ouverture bloquée"); };
        });
    }
    return dbPromise;
}

/** Opération générique IDB */
async function operateOnStore(storeName, mode = 'readonly', operation) {
    try {
        const db = await openDB();
        if (!db) throw new Error("DB non ouverte.");
        if (!db.objectStoreNames.contains(storeName)) {
            // Tenter de rouvrir/upgrader si le store manque (peut arriver après une erreur)
             console.warn(`Store '${storeName}' inexistant, tentative de réouverture DB pour upgrade.`);
             dbPromise = null; // Forcer réouverture/upgrade
             const newDb = await openDB();
             if (!newDb.objectStoreNames.contains(storeName)) {
                  throw new Error(`Store '${storeName}' toujours inexistant après tentative de réouverture.`);
             }
             const transaction = newDb.transaction(storeName, mode);
             const store = transaction.objectStore(storeName);
             return new Promise((resolve, reject) => { /* ... (logique de promesse comme avant) ... */ });
        }
        const transaction = db.transaction(storeName, mode);
        const store = transaction.objectStore(storeName);
        return new Promise((resolve, reject) => {
            const request = operation(store, transaction);
            if (!request) { resolve(); return; } // Si operation ne retourne pas de requête (rare)
            if (typeof request.then === 'function') { // Si operation retourne déjà une Promesse
                request.then(resolve).catch(reject);
                return;
            }
            request.onsuccess = (event) => resolve(event.target.result);
            request.onerror = (event) => reject(`Erreur requête IDB sur ${storeName}: ${event.target.error ? event.target.error.name : 'Inconnue'}`);
            if (mode === 'readwrite') {
                 transaction.oncomplete = () => resolve(request.result); // request.result peut être undefined pour delete, c'est ok
                 transaction.onerror = (event) => reject(`Erreur TX ${storeName} ${mode}: ${event.target.error ? event.target.error.name : 'Inconnue'}`);
            }
        });
    } catch (error) { console.error(`Erreur operateOnStore (${storeName}, ${mode}):`, error); throw error; }
}
async function putData(sN, d) { return operateOnStore(sN, 'readwrite', s => s.put(d)); }
async function getDataByKey(sN, k) { if(k===undefined||k===null||k==='') { console.warn(`Clé invalide getDataByKey (${sN}):`, k); return undefined; } return operateOnStore(sN, 'readonly', s => s.get(k)); }
async function getAllData(sN) { return operateOnStore(sN, 'readonly', s => s.getAll()); }
async function getAllKeys(sN) { return operateOnStore(sN, 'readonly', s => s.getAllKeys()); }
async function deleteDataByKey(sN, k) { return operateOnStore(sN, 'readwrite', s => s.delete(k)); }

// --- Fonctions Utilitaires (Date, localStorage générique - EXPORTÉES) ---
export function getCurrentDateString() { const d=new Date(); return `${d.getUTCFullYear()}-${(d.getUTCMonth()+1).toString().padStart(2,'0')}-${d.getUTCDate().toString().padStart(2,'0')}`; }
export function loadDataFromLS(key) { try { const d=localStorage.getItem(key); return d===null?null:JSON.parse(d); } catch(e){ console.error(`Err lecture LS (${key}):`,e); return null; } }
export function saveDataToLS(key, data) { try { localStorage.setItem(key,JSON.stringify(data)); return true; } catch(e){ console.error(`Err sauvegarde LS (${key}):`,e); if(e.name === 'QuotaExceededError'||(e.code&&(e.code===22||e.code===1014||e.code===DOMException.QUOTA_EXCEEDED_ERR))){ alert(`Stockage plein.`); } else { alert(`Erreur sauvegarde.`); } return false; } }

// --- Fonctions Spécifiques Exportées ---

// ** LOCALSTORAGE **
export function getSobrietyStartDate() {
    try {
        return localStorage.getItem(LS_SOBRIETY_START_DATE_KEY);
    } catch (e) {
        console.error("STORAGE_UTILS LOG ERROR (getSobrietyStartDate): Err accès date sobriété:", e);
        return null;
    }
}

export function saveSobrietyStartDate(dateString) {
    console.log(`STORAGE_UTILS LOG (saveSobrietyStartDate): Fonction appelée.`); // LOG 0
    console.log(`STORAGE_UTILS LOG (saveSobrietyStartDate): Reçu dateString: [${dateString}], Type: ${typeof dateString}`); // LOG 1

    if (typeof dateString !== 'string' || dateString === null || dateString.trim() === '') {
        console.warn("STORAGE_UTILS LOG (saveSobrietyStartDate): dateString invalide ou vide. Retourne false.", dateString); // LOG 2
        return false;
    }

    const key = LS_SOBRIETY_START_DATE_KEY;
    console.log(`STORAGE_UTILS LOG (saveSobrietyStartDate): Clé utilisée: [${key}]`); // LOG 3

    // Test simple d'écriture avant le vrai setItem
    try {
        console.log("STORAGE_UTILS LOG (saveSobrietyStartDate): Test écriture LS simple..."); // LOG 3.1
        localStorage.setItem('claireAppTestWrite', 'testValue');
        const testRead = localStorage.getItem('claireAppTestWrite');
        if (testRead === 'testValue') {
            console.log("STORAGE_UTILS LOG (saveSobrietyStartDate): Test écriture/lecture LS simple OK."); // LOG 4
            localStorage.removeItem('claireAppTestWrite'); // Nettoyer test
        } else {
            console.error("STORAGE_UTILS LOG ERROR (saveSobrietyStartDate): Test écriture LS simple ÉCHOUÉ. Lecture a retourné:", testRead); // LOG 5
            alert("Erreur fondamentale d'écriture dans le stockage local (Test interne).");
            return false;
        }
    } catch (testError) {
         console.error("STORAGE_UTILS LOG ERROR (saveSobrietyStartDate): Erreur (exception) pendant le test d'écriture LS simple:", testError); // LOG 6
         alert("Impossible d'écrire dans le stockage local (Test interne - exception).");
         return false;
    }

    // Vraie tentative de sauvegarde
    try {
        console.log(`STORAGE_UTILS LOG (saveSobrietyStartDate): Tentative localStorage.setItem pour la clé [${key}] avec valeur [${dateString}]`); // LOG 7
        localStorage.setItem(key, dateString);
        console.log("STORAGE_UTILS LOG (saveSobrietyStartDate): localStorage.setItem appelé SANS exception apparente."); // LOG 8

        const readBackValue = localStorage.getItem(key);
        if (readBackValue === dateString) {
             console.log("STORAGE_UTILS LOG (saveSobrietyStartDate): Sauvegarde LS date sobriété VÉRIFIÉE OK pour", dateString); // LOG 9 (Succès)
             return true;
        } else {
             console.error("STORAGE_UTILS LOG ERROR (saveSobrietyStartDate): ÉCHEC VÉRIFICATION après écriture! Lu:", readBackValue, "Attendu:", dateString); // LOG 10
             alert("Erreur de cohérence lors de la sauvegarde de la date de début.");
             return false;
        }
    } catch (e) {
        console.error("STORAGE_UTILS LOG ERROR (saveSobrietyStartDate): Exception dans bloc try/catch principal:", e); // LOG 11
        console.error("Détails de l'exception:", e.name, e.message, e.code);
        if (e.name === 'QuotaExceededError' || (e.code && (e.code === 22 || e.code === 1014 || e.code === DOMException.QUOTA_EXCEEDED_ERR))) {
            console.log("STORAGE_UTILS LOG (saveSobrietyStartDate): Erreur quota détectée."); // LOG 12
            alert("Stockage local plein. Impossible de sauvegarder la date de début.");
        } else {
            console.log("STORAGE_UTILS LOG (saveSobrietyStartDate): Autre erreur de sauvegarde détectée."); // LOG 13
            alert("Une erreur est survenue lors de la sauvegarde de la date de début (exception).");
        }
        return false;
    }
}

export function getEarnedBadgesFromStorage() { const d = loadDataFromLS(LS_EARNED_BADGES_KEY); return Array.isArray(d) ? d.filter(i => typeof i === 'string') : []; }
export function saveEarnedBadgesToStorage(badgeIds) { if(!Array.isArray(badgeIds)) return false; return saveDataToLS(LS_EARNED_BADGES_KEY, badgeIds); }
// getZenModeState et saveZenModeState ont été supprimées

// Distractions
export function getDistractions() { const data = loadDataFromLS(DISTRACTIONS_LS_KEY); return Array.isArray(data) ? data.filter(item => typeof item === 'string') : []; }
export function saveDistractions(distractionsList) { if (!Array.isArray(distractionsList)) return false; const validList = distractionsList.filter(item => typeof item === 'string' && item.trim() !== ''); return saveDataToLS(DISTRACTIONS_LS_KEY, validList); }


// ** INDEXEDDB **
// Journal, Humeur, Routine, Planificateur, Victoires (fonctions existantes avec operateOnStore)
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

// --- Fonction d'Export ---
export async function getAllAppData() {
    const allData = { settings: {}, journal: [], mood: [], routines: {}, plans: {}, victories: [], distractions: [], thoughtRecords: [] };
    try { allData.settings.sobrietyStartDate = getSobrietyStartDate(); allData.settings.earnedBadges = getEarnedBadgesFromStorage(); allData.distractions = getDistractions(); } catch(e){ console.error("Erreur lecture LS pour export:", e); }
    try {
        const db = await openDB();
        const [journal, mood, victories, routineKeys, plannerKeys, thoughtRecords] = await Promise.all([
            getAllData(STORES.JOURNAL).catch(e=>[]), getAllData(STORES.MOOD).catch(e=>[]), getAllData(STORES.VICTORIES).catch(e=>[]),
            getAllKeys(STORES.ROUTINE).catch(e=>[]), getAllKeys(STORES.PLANNER).catch(e=>[]), getAllData(STORES.THOUGHT_RECORDS).catch(e=>[])
        ]);
        allData.journal = journal; allData.mood = mood; allData.victories = victories; allData.thoughtRecords = thoughtRecords;
        const routinePromises = routineKeys.map(key => getDataByKey(STORES.ROUTINE, key).catch(e => null));
        const planPromises = plannerKeys.map(key => getDataByKey(STORES.PLANNER, key).catch(e => null));
        const routineResults = await Promise.all(routinePromises); routineResults.forEach(r => { if(r && r.date) allData.routines[r.date] = r; });
        const planResults = await Promise.all(planPromises); planResults.forEach(p => { if(p && p.date) allData.plans[p.date] = p; });
    } catch (error) { console.error("Erreur récup IDB pour export:", error); alert("Erreur export données IDB."); }
    return allData;
}
