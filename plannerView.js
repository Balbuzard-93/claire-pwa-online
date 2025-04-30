// plannerView.js (Version Corrigée v3 - Fix 'catch' + Rollback simple)
import { getPlannerForDate, savePlannerForDate, getCurrentDateString } from './storageUtils.js';

let currentPlannerData = { tasks: [] };
let selectedEnergy = null;
// let todayString = ''; // Pas de globale, obtenue si besoin
const CONTENT_WRAPPER_ID = 'planner-content-wrapper';

/** Met à jour l'état de complétion d'une tâche planner et sauvegarde. */
async function updateTaskCompletedStatus(taskId, isCompleted, dateStr) {
    if (!currentPlannerData || !Array.isArray(currentPlannerData.tasks)) return;
    const taskIndex = currentPlannerData.tasks.findIndex(task => task.id === taskId);
    if (taskIndex === -1) return;

    const originalCompletedState = currentPlannerData.tasks[taskIndex].completed; // Pour rollback
    currentPlannerData.tasks[taskIndex].completed = isCompleted;

    const taskElement = document.querySelector(`#${CONTENT_WRAPPER_ID} .planner-task-item[data-task-id="${taskId}"]`);
    if (taskElement) taskElement.classList.toggle('task-completed', isCompleted);

    try {
        await savePlannerForDate(dateStr, currentPlannerData);
    } catch(error) {
        console.error("Erreur sauvegarde plan après MAJ statut:", error);
        alert("Erreur lors de la sauvegarde de l'état de la tâche.");
        // Rollback UI et Data
        currentPlannerData.tasks[taskIndex].completed = originalCompletedState;
        if (taskElement) taskElement.classList.toggle('task-completed', originalCompletedState);
        const checkbox = taskElement.querySelector('.task-checkbox');
        if(checkbox) checkbox.checked = originalCompletedState;
    }
}

/** Supprime une tâche planner de la liste et sauvegarde. */
async function deleteTask(taskId, dateStr) {
    if (!currentPlannerData || !Array.isArray(currentPlannerData.tasks)) return;
    const originalTasks = [...currentPlannerData.tasks]; // Copie pour rollback
    const taskToDelete = currentPlannerData.tasks.find(task => task.id === taskId); // Trouver la tâche avant de filtrer

    // Optimistic UI update: remove element first
    const taskElement = document.querySelector(`#${CONTENT_WRAPPER_ID} .planner-task-item[data-task-id="${taskId}"]`);
    if (taskElement) taskElement.remove();

    // Update local data state
    currentPlannerData.tasks = currentPlannerData.tasks.filter(task => task.id !== taskId);

    // Try saving the filtered data
    try {
        await savePlannerForDate(dateStr, currentPlannerData); // Sauvegarder les données filtrées

        // Update "no tasks" message if needed
        const taskListUl = document.getElementById('plannerTaskList');
        if (taskListUl && currentPlannerData.tasks.length === 0) {
            taskListUl.innerHTML = '<p class="no-tasks-message">Aucune tâche planifiée.</p>';
        }
    } catch (error) { // <<<=== BLOC CATCH PRÉSENT MAINTENANT
        console.error("Erreur sauvegarde plan après suppression:", error);
        alert("Erreur lors de la suppression de la tâche.");
        // Rollback: Restore local data
        currentPlannerData.tasks = originalTasks;
        // Rollback UI: Re-render the list entirely (simplest way to restore the element)
        // We need the wrapper element for renderPlannerContent
        const wrapper = document.getElementById(CONTENT_WRAPPER_ID);
        if(wrapper) {
             await renderPlannerContent(wrapper); // Re-render full list
        } else {
             // Fallback if wrapper not found (should not happen ideally)
             console.error("Impossible de rafraîchir l'UI après échec suppression.");
        }
    }
}


/** Ajoute une nouvelle tâche planner à la liste et sauvegarde. */
async function addTask(dateStr) {
    const inputElement = document.getElementById('newTaskInput');
    if(!inputElement) return;
    const text = inputElement.value.trim();
    if (!text) { alert("Entrez le texte."); return; }

    const newTask = { id: Date.now(), text: text, energy: selectedEnergy, completed: false };
    if (!Array.isArray(currentPlannerData.tasks)) { currentPlannerData.tasks = []; }
    currentPlannerData.tasks.push(newTask); // Add to local state first (optimistic?)

    try {
        await savePlannerForDate(dateStr, currentPlannerData); // Save updated state

        // Update UI on success
        inputElement.value = ''; selectedEnergy = null;
        document.querySelectorAll('.energy-selector button.selected').forEach(b=>b.classList.remove('selected'));
        const addBtn=document.getElementById('addTaskBtn'); if(addBtn) addBtn.disabled=true;
        const taskListUl = document.getElementById('plannerTaskList');
        if (taskListUl) { const noMsg=taskListUl.querySelector('.no-tasks-message'); if(noMsg) noMsg.remove(); appendTaskToList(taskListUl, newTask, dateStr); }
        else { refreshPlannerView(); } // Fallback refresh
    } catch (error) {
        console.error("Err sauvegarde tâche plan:", error);
        alert("Err enregistrement tâche.");
        // Rollback local data state if save failed
        currentPlannerData.tasks.pop();
    }
}

/** Ajoute un élément LI à la liste UL. */
function appendTaskToList(listUl, task, dateStr) {
    if (!listUl || !task) return;
    // Eviter duplicats si appelé plusieurs fois par erreur
    if (listUl.querySelector(`[data-task-id="${task.id}"]`)) return;

    const li = document.createElement('li');
    li.className = `planner-task-item ${task.completed ? 'task-completed' : ''}`;
    li.dataset.taskId = task.id;
    let energyInd = ''; const eMap={1:'⚡',2:'⚡⚡',3:'⚡⚡⚡'}; const eText={1:'Basse',2:'Moyenne',3:'Haute'}; if(task.energy!==null && eMap[task.energy]){ energyInd = `<span class="energy-indicator ${task.energy===1?'low':task.energy===2?'medium':'high'}" title="${eText[task.energy]} énergie">${eMap[task.energy]}</span>`; }
    const txt = document.createElement('span'); txt.className = 'task-text'; txt.textContent = task.text || '';
    li.innerHTML = `<input type="checkbox" id="planner-task-${task.id}" class="task-checkbox" ${task.completed?'checked':''}> <label for="planner-task-${task.id}" class="visually-hidden">Marquer "${txt.textContent}"</label> ${txt.outerHTML} ${energyInd} <button class="delete-task-btn button-delete" title="Supprimer" aria-label="Supprimer: ${txt.textContent}">🗑️</button>`;
    const cb = li.querySelector('.task-checkbox'); const del = li.querySelector('.delete-task-btn');
    if(cb) { cb.addEventListener('change', (e) => updateTaskCompletedStatus(task.id, e.target.checked, dateStr)); }
    if(del) { del.addEventListener('click', () => { if(confirm(`Supprimer "${txt.textContent}" ?`)) deleteTask(task.id, dateStr); }); }
    listUl.appendChild(li);
}


/** Fonction principale de rendu pour la vue Planificateur. */
async function renderPlannerContent(contentWrapper) {
    if (!contentWrapper) { console.error("renderPlannerContent: wrapper invalide"); return; }
    const currentDateStr = getCurrentDateString();
    contentWrapper.innerHTML = '<p>Chargement du plan...</p>';

    try {
        const loadedData = await getPlannerForDate(currentDateStr);
        currentPlannerData = loadedData ? loadedData : { tasks: [] };
        if (!Array.isArray(currentPlannerData.tasks)) { currentPlannerData.tasks = []; }
        let formattedDate = 'Date'; try { formattedDate = new Date(currentDateStr + 'T00:00:00Z').toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }); } catch(e){}

        // Recréer HTML DANS le wrapper
        contentWrapper.innerHTML = `
            <h3>Mon Plan Doux du ${formattedDate}</h3>
            <div class="planner-add-task">
                 <label for="newTaskInput" class="visually-hidden">Nouvelle tâche:</label>
                 <input type="text" id="newTaskInput" placeholder="Nouvelle intention..." maxlength="150">
                 <div class="energy-selector" role="group" aria-labelledby="energy-label-planner"><span id="energy-label-planner" class="visually-hidden">Énergie:</span>Énergie :<button data-energy="1" title="Basse" aria-label="Basse">⚡</button><button data-energy="2" title="Moyenne" aria-label="Moyenne">⚡⚡</button><button data-energy="3" title="Haute" aria-label="Haute">⚡⚡⚡</button><button data-energy="null" title="Effacer" aria-label="Non définie">❓</button></div>
                 <button id="addTaskBtn" class="button-primary" disabled>Ajouter</button>
            </div>
            <ul id="plannerTaskList"></ul>`; // Liste vide initialement

        // Populer la liste et attacher listeners
        const taskListUl = contentWrapper.querySelector('#plannerTaskList'); // Cibler DANS le wrapper
        if (taskListUl && currentPlannerData.tasks.length > 0) {
            currentPlannerData.tasks.forEach(task => appendTaskToList(taskListUl, task, currentDateStr));
        } else if (taskListUl) { taskListUl.innerHTML = '<p class="no-tasks-message">Aucune tâche planifiée.</p>'; }

        // Réattacher les listeners du formulaire
        const newTaskInput = contentWrapper.querySelector('#newTaskInput');
        const addTaskBtn = contentWrapper.querySelector('#addTaskBtn');
        const energyButtons = contentWrapper.querySelectorAll('.energy-selector button');
        if (newTaskInput && addTaskBtn) { newTaskInput.addEventListener('input', () => { addTaskBtn.disabled = newTaskInput.value.trim() === ''; }); newTaskInput.addEventListener('keydown', (e) => { if(e.key==='Enter' && !addTaskBtn.disabled) addTask(currentDateStr); }); }
        energyButtons.forEach(button => { button.addEventListener('click', () => { const cs = contentWrapper.querySelector('.energy-selector button.selected'); if(cs===button&&button.dataset.energy!=='null'){ button.classList.remove('selected'); selectedEnergy=null; } else if (cs!==button){ if(cs) cs.classList.remove('selected'); button.classList.add('selected'); const v=button.dataset.energy; selectedEnergy=(v==='null')?null:parseInt(v,10); } }); });
        if (addTaskBtn) { addTaskBtn.addEventListener('click', () => addTask(currentDateStr)); }

    } catch (error) { console.error("Erreur chargement/rendu planificateur:", error); contentWrapper.innerHTML = '<p>Erreur chargement plan.</p>'; currentPlannerData = { tasks: [] }; }
}

/** Fonction de rafraîchissement exportée. */
export async function refreshPlannerView() {
    const mainContainer = document.getElementById('plannerView');
    const contentWrapper = mainContainer ? mainContainer.querySelector(`#${CONTENT_WRAPPER_ID}`) : null;
    if (contentWrapper) { await renderPlannerContent(contentWrapper); }
    else { console.error("Échec refresh planner: Wrapper introuvable."); }
}
/** Initialise la vue Planificateur. */
export function initPlannerView(containerElement) {
    if (!containerElement) { console.error("Conteneur Plan introuvable."); return; }
    let contentWrapper = containerElement.querySelector(`#${CONTENT_WRAPPER_ID}`);
    if (!contentWrapper) { containerElement.innerHTML = `<h2>Plan du Jour</h2><div id="${CONTENT_WRAPPER_ID}"><p>Chargement...</p></div>`; contentWrapper = containerElement.querySelector(`#${CONTENT_WRAPPER_ID}`); }
    else { contentWrapper.innerHTML = '<p>Chargement...</p>'; }
    if (contentWrapper) { renderPlannerContent(contentWrapper).catch(err => { console.error("Erreur init plan:", err); if(contentWrapper) contentWrapper.innerHTML="<p>Erreur chargement plan.</p>"; }); }
    else { console.error("Impossible créer/trouver wrapper plan init."); }
}
