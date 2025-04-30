// routineView.js (Version utilisant IndexedDB via storageUtils.js)
import { getRoutineForDate, saveRoutineForDate, getCurrentDateString } from './storageUtils.js';

const MAX_TASKS = 3;
let currentRoutineData = null; // Garde en mémoire les données du jour chargées depuis IDB
let todayString = ''; // Stocke la date du jour
const CONTENT_WRAPPER_ID = 'routine-content-wrapper';

/**
 * Sauvegarde la tâche mise à jour dans IndexedDB et met à jour l'UI.
 * @param {number} taskId - L'ID (index 0, 1 ou 2) de la tâche DANS LE TABLEAU tasks.
 * @param {boolean} isCompleted - Le nouvel état.
 * @param {string} dateStr - La date du jour (YYYY-MM-DD).
 */
async function updateTaskStatus(taskId, isCompleted, dateStr) { // Rendre async
    if (!currentRoutineData || !Array.isArray(currentRoutineData.tasks)) {
         console.error("Données routine non disponibles pour MAJ statut.");
         return;
    }
    // L'ID de la tâche dans nos données est l'index (0, 1, 2)
    const taskIndex = currentRoutineData.tasks.findIndex(task => task.id === taskId);
    if (taskIndex === -1) {
         console.error(`Tâche routine avec id ${taskId} non trouvée.`);
         return;
    }

    currentRoutineData.tasks[taskIndex].completed = isCompleted;

    // Mettre à jour l'UI
    const taskElement = document.querySelector(`#${CONTENT_WRAPPER_ID} .task-list-item[data-task-id="${taskId}"]`);
    if (taskElement) {
         taskElement.classList.toggle('task-completed', isCompleted);
         const checkbox = taskElement.querySelector('.task-checkbox');
         if(checkbox) checkbox.checked = isCompleted;
    }

    // Sauvegarder l'objet routine COMPLET mis à jour dans IndexedDB
    try {
         await saveRoutineForDate(dateStr, currentRoutineData);
    } catch(error) {
         console.error("Erreur sauvegarde routine après MAJ statut:", error);
         alert("Erreur lors de la sauvegarde de l'état de la tâche.");
         // Optionnel: Revenir en arrière sur l'UI ?
         if (taskElement) taskElement.classList.toggle('task-completed', !isCompleted);
         if(checkbox) checkbox.checked = !isCompleted;
         // Recharger les données depuis IDB pour être sûr ?
         await refreshRoutineView();
    }
}

// --- deleteTask n'est pas prévu pour la routine, seulement "Modifier" ---

/**
 * Ajoute les tâches définies dans le formulaire à IndexedDB.
 * @param {string} dateStr - La date du jour (YYYY-MM-DD).
 * @param {HTMLElement} formContainer - Le conteneur du formulaire.
 */
async function saveNewRoutine(dateStr, formContainer) { // Rendre async
    const inputs = formContainer.querySelectorAll('.task-input');
    const tasks = [];
    inputs.forEach((input, index) => {
        const text = input.value.trim();
        // Utiliser index comme ID simple pour les tâches de routine
        if (text) { tasks.push({ id: index, text: text, completed: false }); }
    });

    if (tasks.length === 0) { alert("Veuillez entrer au moins une tâche."); return; }
    if (tasks.length > MAX_TASKS) { alert(`Maximum ${MAX_TASKS} tâches.`); return; }

    const newRoutineData = { tasks: tasks }; // Ne pas inclure la date ici, saveRoutineForDate s'en charge

    try {
         await saveRoutineForDate(dateStr, newRoutineData);
         // Recharger et afficher la liste des tâches qui vient d'être sauvée
         await renderRoutineView(document.getElementById('routineView')); // Appelle sur le conteneur principal
    } catch (error) {
         console.error("Erreur sauvegarde nouvelle routine:", error);
         alert("Erreur lors de l'enregistrement de la routine.");
    }
}

/**
 * Ajoute un élément LI représentant une tâche à la liste UL.
 * @param {HTMLElement} listUl - L'élément UL où ajouter la tâche.
 * @param {object} task - L'objet tâche {id, text, completed}.
 * @param {string} dateStr - La date du jour.
 */
function appendTaskToList(listUl, task, dateStr) {
     // Vérifier si l'élément existe déjà (pour éviter duplicats lors de re-render partiels)
     if (listUl.querySelector(`[data-task-id="${task.id}"]`)) return;

    const li = document.createElement('li');
    li.className = `task-list-item ${task.completed ? 'task-completed' : ''}`;
    li.dataset.taskId = task.id;

    const label = document.createElement('label');
    label.htmlFor = `routine-task-${task.id}`;
    label.className = 'task-text';
    label.textContent = task.text || '';

    li.innerHTML = `
        <input type="checkbox" id="routine-task-${task.id}" class="task-checkbox" ${task.completed ? 'checked' : ''}>
        ${label.outerHTML}
    `;

    const checkbox = li.querySelector('.task-checkbox');
    const addedLabel = li.querySelector('.task-text');

    // Attacher les listeners
    if (checkbox) {
         checkbox.addEventListener('change', (event) => updateTaskStatus(task.id, event.target.checked, dateStr));
    }
    if(addedLabel) {
         addedLabel.addEventListener('click', () => {
              if(checkbox) { checkbox.checked = !checkbox.checked; checkbox.dispatchEvent(new Event('change', { bubbles: true })); }
         });
    }
    listUl.appendChild(li);
}


/**
 * Affiche la liste des tâches définies pour aujourd'hui.
 * @param {HTMLElement} container - Le wrapper où afficher la liste.
 * @param {string} dateStr - La date du jour (YYYY-MM-DD).
 * @param {object} routineData - Les données de routine du jour {tasks: [...]}.
 */
function renderTaskList(container, dateStr, routineData) {
    currentRoutineData = routineData; // Mettre à jour la copie locale

    let formattedDate = 'Date';
     try { formattedDate = new Date(dateStr + 'T00:00:00Z').toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' }); } catch(e){}

    // Créer la liste UL avec son ID spécifique
    container.innerHTML = `
        <h3>Routine du ${formattedDate}</h3>
        <ul class="task-list" id="routineTaskList"></ul>
        <button id="editRoutineBtn" class="edit-routine-button button-secondary">Modifier la routine</button>
    `;

    const taskListUl = container.querySelector('#routineTaskList');
    if (taskListUl && Array.isArray(routineData.tasks)) {
         if (routineData.tasks.length > 0) {
              routineData.tasks.forEach(task => appendTaskToList(taskListUl, task, dateStr));
         } else {
              // Ce cas ne devrait pas arriver si on appelle renderInputForm quand tasks est vide
              taskListUl.innerHTML = '<p class="no-tasks-message">Aucune tâche définie.</p>';
         }
    }

    const editBtn = container.querySelector('#editRoutineBtn');
    if (editBtn) {
         editBtn.addEventListener('click', async () => { // Rendre async pour save et render
              if (confirm("Effacer et redéfinir la routine du jour ?")) {
                   try {
                        await saveRoutineForDate(dateStr, null); // Supprimer de IDB
                        currentRoutineData = null;
                        renderInputForm(container, dateStr); // Afficher le formulaire dans le même conteneur
                   } catch (error) {
                        console.error("Erreur suppression routine pour modification:", error);
                        alert("Erreur lors de la réinitialisation de la routine.");
                   }
              }
         });
    }
}

/**
 * Affiche le formulaire pour définir la routine du jour.
 * @param {HTMLElement} container - Le wrapper où afficher le formulaire.
 * @param {string} dateStr - La date du jour (YYYY-MM-DD).
 */
function renderInputForm(container, dateStr) {
    currentRoutineData = null; // Indiquer qu'aucune routine n'est chargée
    let inputsHtml = '';
    for (let i = 0; i < MAX_TASKS; i++) {
        inputsHtml += `<div class="input-group">
             <label for="routine-task-input-${i}" class="visually-hidden">Tâche ${i + 1}</label>
             <input type="text" id="routine-task-input-${i}" class="task-input" placeholder="Tâche ${i + 1} (optionnel)" maxlength="100">
        </div>`;
    }
    container.innerHTML = `<h3>Définir la Routine du Jour</h3><p>Entrez 1 à ${MAX_TASKS} tâches simples.</p><div class="routine-input-form">${inputsHtml}<button id="addRoutineTaskBtn" class="button-primary">Enregistrer la Routine</button></div>`;

    const saveBtn = container.querySelector('#addRoutineTaskBtn');
    const inputs = container.querySelectorAll('.task-input');

     if (inputs.length > 0) {
          inputs[inputs.length - 1].addEventListener('keydown', (event) => { if (event.key === 'Enter' && saveBtn) saveBtn.click(); });
     }

    if (saveBtn) {
         // Wrapper l'appel à saveNewRoutine dans un try/catch si elle devient async
         saveBtn.addEventListener('click', () => saveNewRoutine(dateStr, container));
    }
}

/**
 * Fonction principale de rendu pour la vue Routine. Charge les données et choisit l'affichage.
 * Travaille sur le wrapper interne.
 * @param {HTMLElement} contentWrapper - Le conteneur où le contenu doit être rendu.
 */
async function renderRoutineView(contentWrapper) { // Rendre async
    if (!contentWrapper || !contentWrapper.id || contentWrapper.id !== CONTENT_WRAPPER_ID) {
        console.error("renderRoutineView appelée sans wrapper valide !");
        // Tenter de le retrouver peut causer des problèmes si appelé hors contexte
        const fallbackWrapper = document.getElementById(CONTENT_WRAPPER_ID);
        if (!fallbackWrapper) {
             console.error("Impossible de trouver le wrapper routine pour rendu."); return;
        }
        contentWrapper = fallbackWrapper;
    }

    todayString = getCurrentDateString();
    contentWrapper.innerHTML = '<p>Chargement de la routine...</p>'; // Indicateur de chargement

    try {
         const routineData = await getRoutineForDate(todayString); // Appel asynchrone
         contentWrapper.innerHTML = ''; // Vider après chargement

         // S'assurer que routineData est un objet { tasks: [] } même si null depuis IDB
         const dataToRender = (routineData && Array.isArray(routineData.tasks)) ? routineData : { tasks: [] };

         if (dataToRender.tasks.length > 0) {
             renderTaskList(contentWrapper, todayString, dataToRender);
         } else {
             renderInputForm(contentWrapper, todayString);
         }
    } catch (error) {
         console.error("Erreur chargement/rendu routine:", error);
         contentWrapper.innerHTML = '<p>Erreur lors du chargement de la routine.</p>';
         currentRoutineData = null; // Assurer état cohérent
    }
}

/** Fonction de rafraîchissement exportée. */
export async function refreshRoutineView() { // Rendre async
    // console.log("Rafraîchissement vue Routine...");
    const mainContainer = document.getElementById('routineView');
    const contentWrapper = mainContainer ? mainContainer.querySelector(`#${CONTENT_WRAPPER_ID}`) : null;
    if (contentWrapper) {
        await renderRoutineView(contentWrapper); // Attendre le rendu async
    } else {
        console.error("Échec refresh routine: Wrapper introuvable.");
    }
}
/** Initialise la vue Routine. */
export function initRoutineView(containerElement) { // Garder synchrone, mais appelle une fonction async
    if (!containerElement) { console.error("Conteneur vue Routine introuvable."); return; }

    let contentWrapper = containerElement.querySelector(`#${CONTENT_WRAPPER_ID}`);
    if (!contentWrapper) {
         containerElement.innerHTML = `<h2>Routine Quotidienne</h2><div id="${CONTENT_WRAPPER_ID}"><p>Chargement...</p></div>`;
         contentWrapper = containerElement.querySelector(`#${CONTENT_WRAPPER_ID}`);
    } else {
         // Mettre un message de chargement si on rafraîchit une vue déjà initialisée
         contentWrapper.innerHTML = '<p>Chargement...</p>';
    }

    if (contentWrapper) {
         // Appeler la fonction async sans attendre ici (elle mettra à jour l'UI quand prête)
         renderRoutineView(contentWrapper).catch(err => {
              console.error("Erreur initiale rendu routine:", err);
              if(contentWrapper) contentWrapper.innerHTML = "<p>Erreur chargement routine initiale.</p>";
         });
    } else {
         console.error("Impossible de créer/trouver le wrapper routine lors de l'init.");
    }
}
