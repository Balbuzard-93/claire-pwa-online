// storageUtils.js (Version avec IndexedDB Helpers - Révisée)

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
    // Utiliser un singleton pour la promesse de connexion
    if (!dbPromise) {
        dbPromise = new Promise((resolve, reject) => {
            // Vérifier si IndexedDB est supporté
            if (!('indexedDB' in window)) {
                 console.error("IndexedDB n'est pas supporté par ce navigateur.");
                 return reject("IndexedDB non supporté");
            }

            const request = indexedDB.open(DB_NAME, DB_VERSION);

            request.onerror = (event) => {
                console.error("Erreur ouverture IndexedDB:", event.target.error);
                dbPromise = null; // Réinitialiser la promesse en cas d'erreur
                reject(`Erreur ouverture IndexedDB: ${event.target.error}`);
            };

            request.onsuccess = (event) => {
                // console.log("IndexedDB ouvert avec succès."); // Log moins verbeux
                resolve(event.target.result);
            };

            // Important : cet événement ne se déclenche que si DB_VERSION est supérieur
            // à la version existante, ou si la base n'existe pas.
            request.onupgradeneeded = (event) => {
                console.log("Mise à niveau IndexedDB (onupgradeneeded)...");
                const db = event.target.result;
                const transaction = event.target.transaction; // Utiliser la transaction fournie

                // Créer les Object Stores s'ils n'existent pas
                if (!db.objectStoreNames.contains(STORES.JOURNAL)) {
                    const journalStore = db.createObjectStore(STORES.JOURNAL, { keyPath: 'id', autoIncrement: true });
                    journalStore.createIndex('timestamp', 'timestamp'); // Index pour trier/filtrer par date
                    console.log(`Object Store ${STORES.JOURNAL} créé.`);
                }
                if (!db.objectStoreNames.contains(STORES.MOOD)) {
                    db.createObjectStore(STORES.MOOD, { keyPath: 'date' }); // date 'YYYY-MM-DD' est unique
                    console.log(`Object Store ${STORES.MOOD} créé.`);
                }
                 if (!db.objectStoreNames.contains(STORES.ROUTINE)) {
                    db.createObjectStore(STORES.ROUTINE, { keyPath: 'date' });
                    console.log(`Object Store ${STORES.ROUTINE} créé.`);
                }
                 if (!db.objectStoreNames.contains(STORES.PLANNER)) {
                    db.createObjectStore(STORES.PLANNER, { keyPath: 'date' });
                    console.log(`Object Store ${STORES.PLANNER} créé.`);
                }
                if (!db.objectStoreNames.contains(STORES.VICTORIES)) {
                    const victoryStore = db.createObjectStore(STORES.VICTORIES, { keyPath: 'id', autoIncrement: true });
                    victoryStore.createIndex('timestamp', 'timestamp');
                     console.log(`Object Store ${STORES.VICTORIES} créé.`);
                }

                 // Gestion des anciennes versions (si DB_VERSION > 1)
                 // Exemple: si on voulait ajouter un index à un store existant
                 // if (event.oldVersion < 2) { // Code exécuté seulement si on passe de v1 à v2+
                 //    if (db.objectStoreNames.contains(STORES.JOURNAL)) {
                 //        const journalStore = transaction.objectStore(STORES.JOURNAL);
                 //        // journalStore.createIndex('some_new_index', 'some_property');
                 //    }
                 // }

                console.log("Mise à niveau IndexedDB terminée.");
            };

             // Gérer le blocage (si une autre page a la DB ouverte avec une version différente)
             request.onblocked = (event) => {
                 console.warn("Ouverture IndexedDB bloquée, fermeture des autres onglets nécessaire ?", event);
                 // On pourrait afficher un message à l'utilisateur ici
                 reject("Ouverture IndexedDB bloquée");
             };
        });
    }
    return dbPromise;
}

// --- Fonctions Helper pour IndexedDB (privées au module) ---

/** Opération générique pour lire/écrire dans IndexedDB */
async function operateOnStore(storeName, mode = 'readonly', operation) {
    try {
        const db = await openDB();
        const transaction = db.transaction(storeName, mode);
        const store = transaction.objectStore(storeName);
        const result = await operation(store, transaction); // Exécute l'opération passée
        // Pas besoin d'attendre tx.done explicitement si on await l'opération
        // await transaction.done; // Optionnel mais peut aider à attraper erreurs transaction
        return result;
    } catch (error) {
        console.error(`Erreur opération ${mode} sur ${storeName}:`, error);
        throw error; // Propager pour gestion par l'appelant
    }
}

// --- Fonctions Utilitaires (Date, localStorage générique - renommées) ---

export function getCurrentDateString() {
    const date = new Date();
    const year = date.getUTCFullYear();
    const month = (date.getUTCMonth() + 1).toString().padStart(2, '0');
    const day = date.getUTCDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function loadDataFromLS(key) {
     try {
         const storedData = localStorage.getItem(key);
         if (storedData === null) return null;
         try { return JSON.parse(storedData); }
         catch (parseError) { console.error(`Err parsing LS (${key}):`, parseError); return null; }
     } catch (error) { console.error(`Err lecture LS (${key}):`, error); return null; }
}

function saveDataToLS(key, data) {
     try {
         const stringifiedData = JSON.stringify(data);
         localStorage.setItem(key, stringifiedData); return true;
     } catch (error) { console.error(`Err sauvegarde LS (${key}):`, error); if (error.name === 'QuotaExceededError' || (error.code && (error.code === 22 || error.code === 1014 || error.code === DOMException.QUOTA_EXCEEDED_ERR))) { alert(`Stockage plein.`); } else { alert(`Erreur sauvegarde.`); } return false; }
}

// --- Fonctions Spécifiques Exportées ---

// ** LOCALSTORAGE **
export function getSobrietyStartDate() { try { return localStorage.getItem(LS_SOBRIETY_START_DATE_KEY); } catch (e) { console.error("Err accès date sobriété:", e); return null; } }
export function saveSobrietyStartDate(dateString) { if(typeof dateString !== 'string') { console.warn("saveSobrietyStartDate: dateString invalide"); return false; } try { localStorage.setItem(LS_SOBRIETY_START_DATE_KEY, dateString); return true; } catch (e) { console.error("Err sauvegarde date sobriété:", e); if(e.name === 'QuotaExceededError' || (e.code && (e.code === 22 || e.code === 1014 || e.code === DOMException.QUOTA_EXCEEDED_ERR))) {alert("Stockage plein.");} else {alert("Erreur sauvegarde date.");} return false; } }
export function getEarnedBadgesFromStorage() { const d = loadDataFromLS(LS_EARNED_BADGES_KEY); return Array.isArray(d) ? d.filter(i => typeof i === 'string') : []; }
export function saveEarnedBadgesToStorage(badgeIds) { if(!Array.isArray(badgeIds)) return false; return saveDataToLS(LS_EARNED_BADGES_KEY, badgeIds); }
export function getZenModeState() { try { return localStorage.getItem(LS_ZEN_MODE_KEY) === 'true'; } catch { return false; } } // <- EXPORTÉ ICI
export function saveZenModeState(isEnabled) { try { localStorage.setItem(LS_ZEN_MODE_KEY, isEnabled ? 'true' : 'false'); return true; } catch (e) { console.error("Err sauvegarde Mode Zen:", e); return false; } } // <- EXPORTÉ ICI

// ** INDEXEDDB **

// Journal
export async function getJournalEntries() { return operateOnStore(STORES.JOURNAL, 'readonly', store => store.getAll()); }
export async function addJournalEntry(entryData) { if(!entryData || typeof entryData !== 'object') throw new Error("Donnée d'entrée journal invalide"); return operateOnStore(STORES.JOURNAL, 'readwrite', store => store.put(entryData)); }
export async function deleteJournalEntry(entryId) { return operateOnStore(STORES.JOURNAL, 'readwrite', store => store.delete(entryId)); }

// Humeur
export async function getMoodEntryForDate(dateString) { if(!dateString) return undefined; return operateOnStore(STORES.MOOD, 'readonly', store => store.get(dateString)); }
export async function saveMoodEntry(moodData) { if(!moodData || typeof moodData !== 'object' || !moodData.date) throw new Error("Donnée d'humeur invalide"); return operateOnStore(STORES.MOOD, 'readwrite', store => store.put(moodData)); }
export async function getAllMoodEntries() { return operateOnStore(STORES.MOOD, 'readonly', store => store.getAll()); }

// Routine
export async function getRoutineForDate(dateString) { if(!dateString) return null; const data = await operateOnStore(STORES.ROUTINE, 'readonly', store => store.get(dateString)); return (data && Array.isArray(data.tasks)) ? data : null; }
export async function saveRoutineForDate(dateString, routineData) { if(!dateString) throw new Error("Date manquante pour sauvegarde routine"); if (routineData === null) { return operateOnStore(STORES.ROUTINE, 'readwrite', store => store.delete(dateString)); } else { if(typeof routineData !== 'object' || !Array.isArray(routineData.tasks)) throw new Error("Donnée routine invalide"); return operateOnStore(STORES.ROUTINE, 'readwrite', store => store.put({ ...routineData, date: dateString })); } }

// Planificateur
export async function getPlannerForDate(dateString) { if(!dateString) return null; const data = await operateOnStore(STORES.PLANNER, 'readonly', store => store.get(dateString)); return (data && Array.isArray(data.tasks)) ? data : null; }
export async function savePlannerForDate(dateString, plannerData) { if(!dateString) throw new Error("Date manquante pour sauvegarde plan"); if (plannerData === null) { return operateOnStore(STORES.PLANNER, 'readwrite', store => store.delete(dateString)); } else { if(typeof plannerData !== 'object' || !Array.isArray(plannerData.tasks)) throw new Error("Donnée plan invalide"); return operateOnStore(STORES.PLANNER, 'readwrite', store => store.put({ ...plannerData, date: dateString })); } }

// Victoires
export async function getVictories() { return operateOnStore(STORES.VICTORIES, 'readonly', store => store.getAll()); }
export async function addVictory(victoryData) { if(!victoryData || typeof victoryData !== 'object' || !victoryData.text) throw new Error("Donnée victoire invalide"); return operateOnStore(STORES.VICTORIES, 'readwrite', store => store.put(victoryData)); }
export async function deleteVictory(victoryId) { return operateOnStore(STORES.VICTORIES, 'readwrite', store => store.delete(victoryId)); }


// --- Fonction d'Export ---
/**
 * Récupère TOUTES les données de l'application (LS et IDB).
 * @returns {Promise<object>} Un objet contenant toutes les données.
 */
export async function getAllAppData() {
    const allData = { settings: {}, journal: [], mood: [], routines: {}, plans: {}, victories: [] };

    // Récupérer depuis LocalStorage (synchrone, peut être fait en premier)
    try {
        allData.settings.sobrietyStartDate = getSobrietyStartDate();
        allData.settings.earnedBadges = getEarnedBadgesFromStorage();
        allData.settings.isZenModeEnabled = getZenModeState();
    } catch(e) { console.error("Erreur lecture LS pour export:", e); }

    // Récupérer depuis IndexedDB (asynchrone)
    try {
        const db = await openDB(); // Assurer connexion
        // Utiliser Promise.all pour paralléliser les lectures IDB
        const [journal, mood, victories, routineKeys, plannerKeys] = await Promise.all([
            getAllData(STORES.JOURNAL),
            getAllData(STORES.MOOD),
            getAllData(STORES.VICTORIES),
            operateOnStore(STORES.ROUTINE, 'readonly', store => store.getAllKeys()), // Récupérer clés routine
            operateOnStore(STORES.PLANNER, 'readonly', store => store.getAllKeys())  // Récupérer clés plan
        ]);

        allData.journal = journal;
        allData.mood = mood;
        allData.victories = victories;

        // Récupérer routines et plans par clé
        const routinePromises = routineKeys.map(key => getDataByKey(STORES.ROUTINE, key));
        const planPromises = plannerKeys.map(key => getDataByKey(STORES.PLANNER, key));

        const routineResults = await Promise.all(routinePromises);
        routineResults.forEach(routine => { if(routine) allData.routines[routine.date] = routine; }); // Stocker par date

        const planResults = await Promise.all(planPromises);
        planResults.forEach(plan => { if(plan) allData.plans[plan.date] = plan; }); // Stocker par date

    } catch (error) {
        console.error("Erreur récupération données IndexedDB pour export:", error);
        alert("Une partie des données n'a pas pu être récupérée pour l'export.");
    }

    return allData;
}
