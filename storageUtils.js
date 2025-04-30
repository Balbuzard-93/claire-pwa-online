// storageUtils.js (Version avec Gestion Promesses IDB Révisée)

// --- Constantes de Clés (inchangées) ---
const LS_SOBRIETY_START_DATE_KEY = 'claireAppSobrietyStartDate';
const LS_EARNED_BADGES_KEY = 'claireAppEarnedBadges';
const LS_ZEN_MODE_KEY = 'claireAppZenModeEnabled';
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

// --- Fonctions Helper IDB (Révisées) ---

/** Ajoute ou met à jour un enregistrement */
async function putData(storeName, data) {
    const db = await openDB();
    const tx = db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    // store.put retourne une requête IDBRequest
    // On doit attendre la transaction pour confirmer la réussite/erreur
    const request = store.put(data);
    return new Promise((resolve, reject) => {
         request.onsuccess = () => resolve(); // Résoudre quand la requête put réussit
         request.onerror = (event) => reject(`Erreur Put dans ${storeName}: ${event.target.error}`);
         tx.oncomplete = () => { /* console.log(`Transaction Put ${storeName} terminée`); */ resolve(); }; // Double sécurité via transaction
         tx.onerror = (event) => reject(`Erreur Transaction Put ${storeName}: ${event.target.error}`);
    });
}

/** Récupère un enregistrement par sa clé */
async function getDataByKey(storeName, key) {
    const db = await openDB();
    const tx = db.transaction(storeName, 'readonly');
    const store = tx.objectStore(storeName);
    const request = store.get(key);
     return new Promise((resolve, reject) => {
          request.onsuccess = (event) => resolve(event.target.result); // Résoudre avec la donnée
          request.onerror = (event) => reject(`Erreur GetByKey ${key} dans ${storeName}: ${event.target.error}`);
          tx.onerror = (event) => reject(`Erreur Transaction GetByKey ${storeName}: ${event.target.error}`);
          // tx.oncomplete n'est pas nécessaire ici car on attend le résultat de get
     });
}

/** Récupère tous les enregistrements */
async function getAllData(storeName) {
    const db = await openDB();
    const tx = db.transaction(storeName, 'readonly');
    const store = tx.objectStore(storeName);
    const request = store.getAll();
     return new Promise((resolve, reject) => {
          request.onsuccess = (event) => resolve(event.target.result); // Résoudre avec le tableau
          request.onerror = (event) => reject(`Erreur GetAll dans ${storeName}: ${event.target.error}`);
          tx.onerror = (event) => reject(`Erreur Transaction GetAll ${storeName}: ${event.target.error}`);
     });
}

/** Récupère toutes les clés */
async function getAllKeys(storeName) {
     const db = await openDB();
     const tx = db.transaction(storeName, 'readonly');
     const store = tx.objectStore(storeName);
     const request = store.getAllKeys();
      return new Promise((resolve, reject) => {
           request.onsuccess = (event) => resolve(event.target.result);
           request.onerror = (event) => reject(`Erreur GetAllKeys dans ${storeName}: ${event.target.error}`);
           tx.onerror = (event) => reject(`Erreur Transaction GetAllKeys ${storeName}: ${event.target.error}`);
      });
}


/** Supprime un enregistrement par sa clé */
async function deleteDataByKey(storeName, key) {
    const db = await openDB();
    const tx = db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    const request = store.delete(key);
     return new Promise((resolve, reject) => {
          request.onsuccess = () => resolve();
          request.onerror = (event) => reject(`Erreur Delete ${key} dans ${storeName}: ${event.target.error}`);
          tx.oncomplete = () => resolve();
          tx.onerror = (event) => reject(`Erreur Transaction Delete ${storeName}: ${event.target.error}`);
     });
}

// --- Fonctions Utilitaires LS (inchangées) ---
export function getCurrentDateString() { /* ... */ }
function loadDataFromLS(key) { /* ... */ }
function saveDataToLS(key, data) { /* ... */ }

// --- Fonctions Spécifiques Exportées ---

// ** LOCALSTORAGE **
export function getSobrietyStartDate() { /* ... */ }
export function saveSobrietyStartDate(dateString) {
    console.log(`Storage LOG: saveSobrietyStartDate appelée avec: [${dateString}] (Type: ${typeof dateString})`); // <<< LOG AJOUTÉ
    if(typeof dateString !== 'string') {
        console.warn("Storage LOG: saveSobrietyStartDate - Échec type check, retourne false."); // Log échec type check
        return false;
    }
    try {
        localStorage.setItem(LS_SOBRIETY_START_DATE_KEY, dateString);
        console.log("Storage LOG: Sauvegarde LS date sobriété OK pour", dateString);
        return true;
    } catch (e) {
        // ... (catch block comme avant) ...
         console.error("Err sauvegarde date sobriété:", e);
         console.log("Storage LOG: Affichage alerte pour erreur sauvegarde date.");
         if(e.name === 'QuotaExceededError' || /* ... */) { alert("Stockage plein."); } else { alert("Erreur sauvegarde date."); }
         return false;
    }
}
export function getEarnedBadgesFromStorage() { /* ... */ }
export function saveEarnedBadgesToStorage(badgeIds) { /* ... */ }
export function getZenModeState() { /* ... */ }
export function saveZenModeState(isEnabled) { /* ... */ }

// ** INDEXEDDB (utilisent les helpers révisés) **
// Journal
export async function getJournalEntries() { return getAllData(STORES.JOURNAL); }
export async function addJournalEntry(entryData) { return putData(STORES.JOURNAL, entryData); }
export async function deleteJournalEntry(entryId) { return deleteDataByKey(STORES.JOURNAL, entryId); }
// Humeur
export async function getMoodEntryForDate(dateString) { return getDataByKey(STORES.MOOD, dateString); } // Retournera undefined si non trouvé
export async function saveMoodEntry(moodData) { return putData(STORES.MOOD, moodData); }
export async function getAllMoodEntries() { return getAllData(STORES.MOOD); }
// Routine
export async function getRoutineForDate(dateString) { const d = await getDataByKey(STORES.ROUTINE, dateString); return (d && Array.isArray(d.tasks)) ? d : null; }
export async function saveRoutineForDate(dateString, routineData) { if (routineData === null) { return deleteDataByKey(STORES.ROUTINE, dateString); } else { if(typeof routineData!=='object'||!Array.isArray(routineData.tasks)) throw new Error("Donnée routine invalide"); return putData(STORES.ROUTINE, { ...routineData, date: dateString }); } }
// Planificateur
export async function getPlannerForDate(dateString) { const d = await getDataByKey(STORES.PLANNER, dateString); return (d && Array.isArray(d.tasks)) ? d : null; }
export async function savePlannerForDate(dateString, plannerData) { if (plannerData === null) { return deleteDataByKey(STORES.PLANNER, dateString); } else { if(typeof plannerData!=='object'||!Array.isArray(plannerData.tasks)) throw new Error("Donnée plan invalide"); return putData(STORES.PLANNER, { ...plannerData, date: dateString }); } }
// Victoires
export async function getVictories() { return getAllData(STORES.VICTORIES); }
export async function addVictory(victoryData) { if(!victoryData||typeof victoryData!=='object'||!victoryData.text) throw new Error("Donnée victoire invalide"); return putData(STORES.VICTORIES, victoryData); }
export async function deleteVictory(victoryId) { return deleteDataByKey(STORES.VICTORIES, victoryId); }

// --- Fonction d'Export ---
export async function getAllAppData() {
    const allData = { settings: {}, journal: [], mood: [], routines: {}, plans: {}, victories: [] };
    try { allData.settings.sobrietyStartDate = getSobrietyStartDate(); allData.settings.earnedBadges = getEarnedBadgesFromStorage(); allData.settings.isZenModeEnabled = getZenModeState(); } catch(e){}
    try {
        const db = await openDB();
        const [journal, mood, victories, routineKeys, plannerKeys] = await Promise.all([ getAllData(STORES.JOURNAL), getAllData(STORES.MOOD), getAllData(STORES.VICTORIES), getAllKeys(STORES.ROUTINE), getAllKeys(STORES.PLANNER) ]); // Utiliser getAllKeys révisé
        allData.journal = journal; allData.mood = mood; allData.victories = victories;
        const routinePromises = routineKeys.map(key => getDataByKey(STORES.ROUTINE, key)); const planPromises = plannerKeys.map(key => getDataByKey(STORES.PLANNER, key));
        const routineResults = await Promise.all(routinePromises); routineResults.forEach(r => { if(r) allData.routines[r.date] = r; });
        const planResults = await Promise.all(planPromises); planResults.forEach(p => { if(p) allData.plans[p.date] = p; });
    } catch (error) { console.error("Erreur récup IDB pour export:", error); alert("Erreur export données IDB."); }
    return allData;
}
