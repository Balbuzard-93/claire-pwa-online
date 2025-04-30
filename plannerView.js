// plannerView.js (Version utilisant IndexedDB via storageUtils.js)
import { getPlannerForDate, savePlannerForDate, getCurrentDateString } from './storageUtils.js';

let currentPlannerData = { tasks: [] };
let selectedEnergy = null;
let todayString = '';
const CONTENT_WRAPPER_ID = 'planner-content-wrapper'; // ID pour le wrapper interne

/**
 * Met à jour l'état de complétion d'une tâche planner et sauvegarde.
 * @param {number} taskId - L'ID unique de la tâche.
 * @param {boolean} isCompleted - Le nouvel état.
 * @param {string} dateStr - La date du jour (YYYY-MM-DD).
 */
async function updateTaskCompletedStatus(taskId, isCompleted, dateStr) { // Rendre async
    if (!currentPlannerData || !Array.isArray(currentPlannerData.tasks)) return;
    const taskIndex = currentPlannerData.tasks.findIndex(task => task.id === taskId);
    if (taskIndex === -1) return;

    currentPlannerData.tasks[taskIndex].completed = isCompleted;

    const taskElement = document.querySelector(`#${CONTENT_WRAPPER_ID} .planner-task-item[data-task-id="${taskId}"]`);
    if (taskElement) taskElement.classList.toggle('task-completed', isCompleted);

    try {
        await savePlannerForDate(dateStr, currentPlannerData); // Appel async
    } catch(error) {
        console.error("Erreur sauvegarde plan après MAJ statut:", error);
        alert("Erreur lors de la sauvegarde de l'état de la tâche.");
        // Revenir en arrière sur l'UI
        if (taskElement) taskElement.classList.toggle('task-completed', !isCompleted);
        const checkbox = taskElement.querySelector('.task-checkbox');
        if(checkbox) checkbox.checked = !isCompleted;
        // Recharger ? Ou laisser l'utilisateur réessayer ?
    }
}

/**
 * Supprime une tâche planner de la liste et sauvegarde.
 * @param {number} taskId - L'ID unique de la tâche à supprimer.
 * @param {string} dateStr - La date du jour (YYYY-MM-DD).
 */
async function deleteTask(taskId, dateStr) { // Rendre async
    if (!currentPlannerData || !Array.isArray(currentPlannerData.tasks)) return;
    currentPlannerData.tasks = currentPlannerData.tasks.filter(task => task.id !== taskId);

    const taskElement = document.querySelector(`#${CONTENT_WRAPPER_ID} .planner-task-item[data-task-id="${taskId}"]`);
    if (taskElement) taskElement.remove();

    try {
         await savePlannerForDate(dateStr, currentPlannerData); // Appel async
         const taskListUl = document.getElementById('plannerTaskList');
         if (taskListUl && currentPlannerData.tasks.length === 0) {
             taskListUl.innerHTML = '<p class="no-tasks-message">Aucune tâche planifiée pour aujourd\'hui.</p>';
         }
    } catch(error) {
         console.error("Erreur sauvegarde plan après suppression:", error);
         alert("Erreur lors de la suppression de la tâche.");
         // Faut-il réafficher l'élément ? Mieux vaut recharger la vue peut-être.
         refreshPlannerView();
    }
}

/**
 * Ajoute une nouvelle tâche planner à la liste et sauvegarde.
 * @param {string} dateStr - La date du jour (YYYY-MM-DD).
 */
async function addTask(dateStr) { // Rendre async
    const inputElement = document.getElementById('newTaskInput');
    if(!inputElement) return;
    const text = inputElement.value.trim();
    if (!text) { alert("Veuillez entrer le texte de la tâche."); return; }

    const newTask = { id: Date.now(), text: text, energy: selectedEnergy, completed: false };
     if (!Array.isArray(currentPlannerData.tasks)) { currentPlannerData.tasks = []; }
    currentPlannerData.tasks.push(newTask);

    try {
        await savePlannerForDate(dateStr, currentPlannerData); // Appel async

        // Nettoyer le formulaire et mettre à jour l'UI
        inputElement.value = '';
        selectedEnergy = null;
        document.querySelectorAll('.energy-selector button.selected').forEach(btn => btn.classList.remove('selected'));
        const addBtn = document.getElementById('addTaskBtn');
        if(addBtn) addBtn.disabled = true;

        const taskListUl = document.getElementById('plannerTaskList');
        if (taskListUl) {
             const noTaskMsg = taskListUl.querySelector('.no-tasks-message');
             if(noTaskMsg) noTaskMsg.remove();
             appendTaskToList(taskListUl, newTask, dateStr);
        } else {
             refreshPlannerView(); // Re-render via refresh si liste introuvable
        }
    } catch (error) {
         console.error("Erreur sauvegarde nouvelle tâche plan:", error);
         alert("Erreur lors de l'enregistrement de la tâche.");
         // Retirer la tâche de l'état local si la sauvegarde échoue ?
         currentPlannerData.tasks.pop();
    }
}

/**
 * Ajoute un élément LI représentant une tâche planner à la liste UL.
 * @param {HTMLElement} listUl - L'élément UL où ajouter la tâche.
 * @param {object} task - L'objet tâche.
 * @param {string} dateStr - La date du jour.
 */
function appendTaskToList(listUl, task, dateStr) {
     if (listUl.querySelector(`[data-task-id="${task.id}"]`)) return; // Eviter duplicats

    const li = document.createElement('li');
    li.className = `planner-task-item ${task.completed ? 'task-completed' : ''}`;
    li.dataset.taskId = task.id;

    let energyIndicator = '';
    const energyMap = { 1: '⚡', 2: '⚡⚡', 3: '⚡⚡⚡' };
    const energyTextMap = { 1: 'Basse énergie', 2: 'Énergie moyenne', 3: 'Haute énergie' };
    if (task.energy !== null && energyMap[task.energy]) {
        energyIndicator = `<span class="energy-indicator ${task.energy === 1 ? 'low' : task.energy === 2 ? 'medium' : 'high'}" title="${energyTextMap[task.energy]}">${energyMap[task.energy]}</span>`;
    }

    const taskTextSpan = document.createElement('span');
    taskTextSpan.className = 'task-text';
    taskTextSpan.textContent = task.text || '';

    li.innerHTML = `
        <input type="checkbox" id="planner-task-${task.id}" class="task-checkbox" ${task.completed ? 'checked' : ''}>
        <label for="planner-task-${task.id}" class="visually-hidden">Marquer "${task.text || 'tâche'}" comme complétée</label>
        ${taskTextSpan.outerHTML}
        ${energyIndicator}
        <button class="delete-task-btn button-delete" title="Supprimer la tâche" aria-label="Supprimer la tâche: ${task.text || 'tâche'}">🗑️</button>
    `;

    const checkbox = li.querySelector('.task-checkbox');
    const deleteBtn = li.querySelector('.delete-task-btn');

    if (checkbox) { checkbox.addEventListener('change', (event) => updateTaskCompletedStatus(task.id, event.target.checked, dateStr)); }
    if (deleteBtn) { deleteBtn.addEventListener('click', () => { if(confirm(`Supprimer "${task.text || ''}" ?`)) { deleteTask(task.id, dateStr); } }); }

    listUl.appendChild(li);
}


/**
 * Fonction principale de rendu pour la vue Planificateur.
 * Travaille sur le wrapper interne.
 * @param {HTMLElement} contentWrapper - Le conteneur où le contenu doit être rendu.
 */
async function renderPlannerView(contentWrapper) { // Rendre async
    if (!contentWrapper || !contentWrapper.id || contentWrapper.id !== CONTENT_WRAPPER_ID) {
        console.error("renderPlannerView appelée sans wrapper valide !");
         const mainContainer = document.getElementById('plannerView');
         const potentialWrapper = mainContainer ? mainContainer.querySelector(`#${CONTENT_WRAPPER_ID}`) : null;
         if(!potentialWrapper) { console.error("Impossible de trouver/récupérer wrapper plan."); return; }
         contentWrapper = potentialWrapper;
    }

    todayString = getCurrentDateString();
    contentWrapper.innerHTML = '<p>Chargement du plan...</p>'; // Indicateur

    try {
        const loadedData = await getPlannerForDate(todayString); // Appel async
        currentPlannerData = loadedData ? loadedData : { tasks: [] };
        if (!Array.isArray(currentPlannerData.tasks)) { currentPlannerData.tasks = []; }

        let formattedDate = 'Date';
        try { formattedDate = new Date(todayString + 'T00:00:00Z').toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }); } catch(e){}

        // Recréer le contenu DANS le wrapper
        contentWrapper.innerHTML = `
            <h3>Mon Plan Doux du ${formattedDate}</h3>
            <div class="planner-add-task">
                 <label for="newTaskInput" class="visually-hidden">Nouvelle tâche :</label>
                <input type="text" id="newTaskInput" placeholder="Nouvelle intention..." maxlength="150">
                <div class="energy-selector" role="group" aria-labelledby="energy-label-planner">
                     <span id="energy-label-planner" class="visually-hidden">Énergie :</span> Énergie :
                     <button data-energy="1" title="Basse" aria-label="Basse énergie">⚡</button>
                     <button data-energy="2" title="Moyenne" aria-label="Énergie moyenne">⚡⚡</button>
                     <button data-energy="3" title="Haute" aria-label="Haute énergie">⚡⚡⚡</button>
                     <button data-energy="null" title="Effacer" aria-label="Énergie non définie">❓</button>
                </div>
                <button id="addTaskBtn" class="button-primary" disabled>Ajouter</button>
            </div>
            <ul id="plannerTaskList"></ul>
        `;

        const taskListUl = contentWrapper.querySelector('#plannerTaskList');
        if (taskListUl && currentPlannerData.tasks.length > 0) {
            currentPlannerData.tasks.forEach(task => appendTaskToList(taskListUl, task, todayString));
        } else if (taskListUl) {
            taskListUl.innerHTML = '<p class="no-tasks-message">Aucune tâche planifiée pour aujourd\'hui.</p>';
        }

        // Réattacher les listeners du formulaire
        const newTaskInput = contentWrapper.querySelector('#newTaskInput');
        const addTaskBtn = contentWrapper.querySelector('#addTaskBtn');
        const energyButtons = contentWrapper.querySelectorAll('.energy-selector button');

        if (newTaskInput && addTaskBtn) {
            newTaskInput.addEventListener('input', () => { addTaskBtn.disabled = newTaskInput.value.trim() === ''; });
            newTaskInput.addEventListener('keydown', (event) => { if(event.key === 'Enter' && !addTaskBtn.disabled) addTask(todayString); });
        }
        energyButtons.forEach(button => {
            button.addEventListener('click', () => {
                const currentSelected = contentWrapper.querySelector('.energy-selector button.selected');
                 if (currentSelected === button && button.dataset.energy !== 'null') { button.classList.remove('selected'); selectedEnergy = null; }
                 else if (currentSelected === button && button.dataset.energy === 'null') { /* Ne rien faire */ }
                 else { if(currentSelected) currentSelected.classList.remove('selected'); button.classList.add('selected'); const v = button.dataset.energy; selectedEnergy = (v === 'null') ? null : parseInt(v, 10); }
            });
        });
        if (addTaskBtn) { addTaskBtn.addEventListener('click', () => addTask(todayString)); }

    } catch (error) {
         console.error("Erreur chargement/rendu planificateur:", error);
         contentWrapper.innerHTML = '<p>Erreur lors du chargement du plan.</p>';
         currentPlannerData = { tasks: [] }; // État sûr
    }
}

/** Fonction de rafraîchissement exportée. */
export async function refreshPlannerView() { // Rendre async
    const mainContainer = document.getElementById('plannerView');
    const contentWrapper = mainContainer ? mainContainer.querySelector(`#${CONTENT_WRAPPER_ID}`) : null;
    if (contentWrapper) {
        await renderPlannerView(contentWrapper); // Attendre le rendu async
    } else {
        console.error("Échec refresh planner: Wrapper introuvable.");
    }
}
/** Initialise la vue Planificateur. */
export function initPlannerView(containerElement) { // Reste synchrone
    if (!containerElement) { console.error("Conteneur vue Planificateur introuvable."); return; }
    if (!containerElement.querySelector(`#${CONTENT_WRAPPER_ID}`)) {
         containerElement.innerHTML = `<h2>Plan du Jour</h2><div id="${CONTENT_WRAPPER_ID}"><p>Chargement...</p></div>`;
    }
    const contentWrapper = containerElement.querySelector(`#${CONTENT_WRAPPER_ID}`);
    if (contentWrapper) {
         renderPlannerView(contentWrapper).catch(err => { console.error("Erreur init plan:", err); if(contentWrapper) contentWrapper.innerHTML = "<p>Erreur chargement plan.</p>"; });
    } else {
         console.error("Impossible de créer/trouver wrapper plan lors de l'init.");
    }
}
