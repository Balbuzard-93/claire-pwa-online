// storageUtils.js (Version avec Gestion Promesses IDB Révisée et Vérif Syntaxe L139)

// --- Constantes de Clés ---
const LS_SOBRIETY_START_DATE_KEY = 'claireAppSobrietyStartDate';
const LS_EARNED_BADGES_KEY = 'claireAppEarnedBadges';
const LS_ZEN_MODE_KEY = 'claireAppZenModeEnabled';
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

                // Utiliser une boucle pour créer les stores
                Object.values(STORES).forEach(storeName => {
                    if (!db.objectStoreNames.contains(storeName)) {
                        let store;
                        if (storeName === STORES.JOURNAL || storeName === STORES.VICTORIES) {
                            store = db.createObjectStore(storeName, { keyPath: 'id', autoIncrement: true });
                            // Ajouter index seulement si la transaction est active
                            if (transaction && !store.indexNames.contains('timestamp')) {
                                 store.createIndex('timestamp', 'timestamp');
                            }
                        } else { // MOOD, ROUTINE, PLANNER use 'date' as key
                            store = db.createObjectStore(storeName, { keyPath: 'date' });
                        }
                        console.log(`OS ${storeName} créé.`);
                    }
                });

                // Gestion des anciennes versions (si DB_VERSION > 1)
                // if (event.oldVersion < 2) { ... }

                console.log("Mise à niveau IndexedDB terminée.");
            };

             // Gérer le blocage
             request.onblocked = (event) => {
                 console.warn("Ouverture IndexedDB bloquée, fermeture des autres onglets nécessaire ?", event);
                 alert("L'application nécessite une mise à jour de sa structure de données, mais elle est bloquée par une autre page ouverte de l'application. Veuillez fermer tous les autres onglets de Clair·e et recharger cette page.");
                 reject("Ouverture IndexedDB bloquée");
             };
        });
    }
    return dbPromise;
}

// --- Fonctions Helper pour IndexedDB (Révisées) ---

/** Opération générique pour lire/écrire dans IndexedDB */
async function operateOnStore(storeName, mode = 'readonly', operation) {
    try {
        const db = await openDB();
        // Gérer le cas où la DB ne s'ouvre pas
        if (!db) throw new Error("La base de données n'a pas pu être ouverte.");

        // Vérifier si le store existe avant d'ouvrir la transaction
        if (!db.objectStoreNames.contains(storeName)) {
            throw new Error(`Object Store '${storeName}' n'existe pas dans la base.`);
        }

        const transaction = db.transaction(storeName, mode);
        const store = transaction.objectStore(storeName);
        // Utiliser une promesse pour attendre la fin de l'opération ET de la transaction
        return new Promise((resolve, reject) => {
            // Exécuter l'opération passée qui devrait retourner une IDBRequest
            const request = operation(store, transaction);
            if (!request || typeof request.then === 'function') { // Si l'opération est déjà une promesse ou null/undefined
                 resolve(request); // Résoudre directement (cas pour getAllKeys, etc. qui utilisent la promesse interne)
                 return;
            }
            request.onsuccess = (event) => resolve(event.target.result); // Résultat de get, put, delete etc.
            request.onerror = (event) => reject(`Erreur requête IDB sur ${storeName}: ${event.target.error}`);
            transaction.oncomplete = () => { /* console.log(`TX ${storeName} ${mode} OK`); */ resolve(request.result); }; // Assurer que la transaction est finie
            transaction.onerror = (event) => reject(`Erreur TX ${storeName} ${mode}: ${event.target.error}`);
        });
    } catch (error) {
        console.error(`Erreur générale operateOnStore (${storeName}, ${mode}):`, error);
        throw error; // Propager pour gestion par l'appelant
    }
}

/** Ajoute ou met à jour un enregistrement */
async function putData(storeName, data) {
    // La logique de put est gérée par operateOnStore maintenant
    // L'opération spécifique est store.put(data)
    return operateOnStore(storeName, 'readwrite', store => store.put(data));
}

/** Récupère un enregistrement par sa clé */
async function getDataByKey(storeName, key) {
    // console.log(`Storage LOG: Appel getDataByKey pour Store [${storeName}], Clé [${key}] (Type: ${typeof key})`); // Log de debug
    if (key === undefined || key === null || key === '') {
         console.error(`Storage LOG ERROR: Clé invalide fournie à getDataByKey:`, key);
         return undefined; // Retourner undefined explicitement
    }
    return operateOnStore(storeName, 'readonly', store => store.get(key));
}

/** Récupère tous les enregistrements */
async function getAllData(storeName) {
    return operateOnStore(storeName, 'readonly', store => store.getAll());
}

/** Récupère toutes les clés */
async function getAllKeys(storeName) {
    return operateOnStore(storeName, 'readonly', store => store.getAllKeys());
}

/** Supprime un enregistrement par sa clé */
async function deleteDataByKey(storeName, key) {
    return operateOnStore(storeName, 'readwrite', store => store.delete(key));
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
     try { const d=localStorage.getItem(key); return d===null?null:JSON.parse(d); } catch(e){ console.error(`Err lecture LS (${key}):`,e); return null; }
}

function saveDataToLS(key, data) {
     try { localStorage.setItem(key,JSON.stringify(data)); return true; } catch(e){ console.error(`Err sauvegarde LS (${key}):`,e); if(e.name === 'QuotaExceededError'||(e.code&&(e.code===22||e.code===1014||e.code===DOMException.QUOTA_EXCEEDED_ERR))){ alert(`Stockage plein.`); } else { alert(`Erreur sauvegarde.`); } return false; }
}

// --- Fonctions Spécifiques Exportées ---

// ** LOCALSTORAGE **
export function getSobrietyStartDate() { try { return localStorage.getItem(LS_SOBRIETY_START_DATE_KEY); } catch (e) { console.error("Err accès date sobriété:", e); return null; } }
export function saveSobrietyStartDate(dateString) {
    // console.log(`Storage LOG: saveSobrietyStartDate appelée avec: [${dateString}] (Type: ${typeof dateString})`);
    if(typeof dateString !== 'string') { console.warn("Storage LOG: saveSobrietyStartDate - dateString invalide", dateString); return false; }
    try { localStorage.setItem(LS_SOBRIETY_START_DATE_KEY, dateString); /* console.log("Storage LOG: Sauvegarde LS date sobriété OK"); */ return true; }
    catch (e) { console.error("Err sauvegarde date sobriété:", e); /* console.log("Storage LOG: Affichage alerte pour erreur sauvegarde date."); */ if(e.name === 'QuotaExceededError' || (e.code && (e.code === 22 || e.code === 1014 || e.code === DOMException.QUOTA_EXCEEDED_ERR))) { alert("Stockage plein."); } else { alert("Erreur sauvegarde date."); } return false; }
}
export function getEarnedBadgesFromStorage() { const d = loadDataFromLS(LS_EARNED_BADGES_KEY); return Array.isArray(d) ? d.filter(i => typeof i === 'string') : []; }
export function saveEarnedBadgesToStorage(badgeIds) { if(!Array.isArray(badgeIds)) return false; return saveDataToLS(LS_EARNED_BADGES_KEY, badgeIds); }
export function getZenModeState() { try { return localStorage.getItem(LS_ZEN_MODE_KEY) === 'true'; } catch { return false; } }
export function saveZenModeState(isEnabled) { try { localStorage.setItem(LS_ZEN_MODE_KEY, isEnabled ? 'true' : 'false'); return true; } catch (e) { console.error("Err sauvegarde Mode Zen:", e); return false; } }

// ** INDEXEDDB (utilisent les helpers révisés) **
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
/**
 * Récupère TOUTES les données de l'application (LS et IDB).
 * @returns {Promise<object>} Un objet contenant toutes les données.
 */
export async function getAllAppData() {
    const allData = { settings: {}, journal: [], mood: [], routines: {}, plans: {}, victories: [] };
    // Récupérer depuis LocalStorage
    try {
        allData.settings.sobrietyStartDate = getSobrietyStartDate();
        allData.settings.earnedBadges = getEarnedBadgesFromStorage();
        allData.settings.isZenModeEnabled = getZenModeState(); // Appel de la fonction exportée
    } catch(e){ console.error("Erreur lecture LS pour export:", e); }

    // Récupérer depuis IndexedDB
    try {
        // Utiliser Promise.all pour paralléliser les lectures IDB
        const [journal, mood, victories, routineKeys, plannerKeys] = await Promise.all([
            getJournalEntries().catch(e => { console.warn("Export: Erreur lecture journal", e); return []; }), // Ajouter catch individuel
            getAllMoodEntries().catch(e => { console.warn("Export: Erreur lecture humeurs", e); return []; }),
            getVictories().catch(e => { console.warn("Export: Erreur lecture victoires", e); return []; }),
            getAllKeys(STORES.ROUTINE).catch(e => { console.warn("Export: Erreur clés routine", e); return []; }),
            getAllKeys(STORES.PLANNER).catch(e => { console.warn("Export: Erreur clés plan", e); return []; })
        ]);

        allData.journal = journal;
        allData.mood = mood;
        allData.victories = victories;

        // Récupérer routines et plans par clé (plus robuste avec try/catch individuel)
        allData.routines = {};
        const routinePromises = routineKeys.map(key =>
             getDataByKey(STORES.ROUTINE, key).catch(e => { console.warn(`Export: Erreur lecture routine ${key}`); return null; })
        );
        const planPromises = plannerKeys.map(key =>
             getDataByKey(STORES.PLANNER, key).catch(e => { console.warn(`Export: Erreur lecture plan ${key}`); return null; })
        );

        const routineResults = await Promise.all(routinePromises);
        routineResults.forEach(r => { if(r) allData.routines[r.date] = r; });

        const planResults = await Promise.all(planPromises);
        planResults.forEach(p => { if(p) allData.plans[p.date] = p; });

    } catch (error) {
        console.error("Erreur récupération données IndexedDB pour export:", error);
        alert("Une partie des données n'a pas pu être récupérée pour l'export.");
    }

    return allData;
} // <<<=== ASSUREZ-VOUS QUE CETTE ACCOLADE FERMANTE EST LA DERNIÈRE DU FICHIER
