// plannerView.js (Version Corrigée - Date définie avant accès IDB)
import { getPlannerForDate, savePlannerForDate, getCurrentDateString } from './storageUtils.js';

let currentPlannerData = { tasks: [] };
let selectedEnergy = null;
let todayString = '';
const CONTENT_WRAPPER_ID = 'planner-content-wrapper';

/** Met à jour l'état de complétion d'une tâche planner. */
async function updateTaskCompletedStatus(taskId, isCompleted, dateStr) {
    if (!currentPlannerData || !Array.isArray(currentPlannerData.tasks)) return;
    const taskIndex = currentPlannerData.tasks.findIndex(task => task.id === taskId);
    if (taskIndex === -1) return;
    currentPlannerData.tasks[taskIndex].completed = isCompleted;
    const taskElement = document.querySelector(`#${CONTENT_WRAPPER_ID} .planner-task-item[data-task-id="${taskId}"]`);
    if (taskElement) taskElement.classList.toggle('task-completed', isCompleted);
    try { await savePlannerForDate(dateStr, currentPlannerData); }
    catch(error) { console.error("Erreur sauvegarde plan après MAJ statut:", error); alert("Erreur sauvegarde état tâche."); /* Rollback UI? */ }
}

/** Supprime une tâche planner. */
async function deleteTask(taskId, dateStr) {
    if (!currentPlannerData || !Array.isArray(currentPlannerData.tasks)) return;
    currentPlannerData.tasks = currentPlannerData.tasks.filter(task => task.id !== taskId);
    const taskElement = document.querySelector(`#${CONTENT_WRAPPER_ID} .planner-task-item[data-task-id="${taskId}"]`);
    if (taskElement) taskElement.remove();
    try {
        await savePlannerForDate(dateStr, currentPlannerData);
        const taskListUl = document.getElementById('plannerTaskList');
        if (taskListUl && currentPlannerData.tasks.length === 0) { taskListUl.innerHTML = '<p class="no-tasks-message">Aucune tâche planifiée.</p>'; }
    } catch(error) { console.error("Erreur sauvegarde plan après suppression:", error); alert("Erreur suppression tâche."); refreshPlannerView(); /* Force refresh */ }
}

/** Ajoute une nouvelle tâche planner. */
async function addTask(dateStr) {
    const inputElement = document.getElementById('newTaskInput');
    if(!inputElement) return;
    const text = inputElement.value.trim();
    if (!text) { alert("Entrez le texte de la tâche."); return; }
    const newTask = { id: Date.now(), text: text, energy: selectedEnergy, completed: false };
    if (!Array.isArray(currentPlannerData.tasks)) { currentPlannerData.tasks = []; }
    currentPlannerData.tasks.push(newTask);
    try {
        await savePlannerForDate(dateStr, currentPlannerData);
        inputElement.value = ''; selectedEnergy = null;
        document.querySelectorAll('.energy-selector button.selected').forEach(btn => btn.classList.remove('selected'));
        const addBtn = document.getElementById('addTaskBtn'); if(addBtn) addBtn.disabled = true;
        const taskListUl = document.getElementById('plannerTaskList');
        if (taskListUl) { const noTaskMsg = taskListUl.querySelector('.no-tasks-message'); if(noTaskMsg) noTaskMsg.remove(); appendTaskToList(taskListUl, newTask, dateStr); }
        else { refreshPlannerView(); }
    } catch (error) { console.error("Erreur sauvegarde tâche plan:", error); alert("Erreur enregistrement tâche."); currentPlannerData.tasks.pop(); /* Rollback local */ }
}

/** Ajoute un élément LI à la liste UL. */
function appendTaskToList(listUl, task, dateStr) {
    if (listUl.querySelector(`[data-task-id="${task.id}"]`)) return;
    const li = document.createElement('li'); li.className = `planner-task-item ${task.completed ? 'task-completed' : ''}`; li.dataset.taskId = task.id;
    let energyIndicator = ''; const energyMap={1:'⚡',2:'⚡⚡',3:'⚡⚡⚡'}; const energyTextMap={1:'Basse',2:'Moyenne',3:'Haute'};
    if(task.energy!==null && energyMap[task.energy]){ energyIndicator = `<span class="energy-indicator ${task.energy===1?'low':task.energy===2?'medium':'high'}" title="${energyTextMap[task.energy]} énergie">${energyMap[task.energy]}</span>`; }
    const taskTextSpan = document.createElement('span'); taskTextSpan.className = 'task-text'; taskTextSpan.textContent = task.text || '';
    li.innerHTML = `<input type="checkbox" id="planner-task-${task.id}" class="task-checkbox" ${task.completed ? 'checked' : ''}> <label for="planner-task-${task.id}" class="visually-hidden">Marquer "${task.text||'tâche'}"</label> ${taskTextSpan.outerHTML} ${energyIndicator} <button class="delete-task-btn button-delete" title="Supprimer" aria-label="Supprimer: ${task.text||'tâche'}">🗑️</button>`;
    const checkbox = li.querySelector('.task-checkbox'); const deleteBtn = li.querySelector('.delete-task-btn');
    if(checkbox) { checkbox.addEventListener('change', (event) => updateTaskCompletedStatus(task.id, event.target.checked, dateStr)); }
    if(deleteBtn) { deleteBtn.addEventListener('click', () => { if(confirm(`Supprimer "${task.text||''}" ?`)) deleteTask(task.id, dateStr); }); }
    listUl.appendChild(li);
}


/** Fonction principale de rendu pour la vue Planificateur. */
async function renderPlannerView(contentWrapper) { // Reçoit wrapper
    if (!contentWrapper) { console.error("renderPlannerView: wrapper invalide"); return; }
    todayString = getCurrentDateString(); // *** Définit la date ici ***
    contentWrapper.innerHTML = '<p>Chargement du plan...</p>';

    try {
        const loadedData = await getPlannerForDate(todayString); // Utilise la date
        currentPlannerData = loadedData ? loadedData : { tasks: [] };
        if (!Array.isArray(currentPlannerData.tasks)) { currentPlannerData.tasks = []; }
        let formattedDate = 'Date'; try { formattedDate = new Date(todayString + 'T00:00:00Z').toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }); } catch(e){}

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
        const taskListUl = contentWrapper.querySelector('#plannerTaskList');
        if (taskListUl && currentPlannerData.tasks.length > 0) {
            currentPlannerData.tasks.forEach(task => appendTaskToList(taskListUl, task, todayString)); // Passer date
        } else if (taskListUl) { taskListUl.innerHTML = '<p class="no-tasks-message">Aucune tâche planifiée.</p>'; }

        const newTaskInput = contentWrapper.querySelector('#newTaskInput');
        const addTaskBtn = contentWrapper.querySelector('#addTaskBtn');
        const energyButtons = contentWrapper.querySelectorAll('.energy-selector button');
        if (newTaskInput && addTaskBtn) { newTaskInput.addEventListener('input', () => { addTaskBtn.disabled = newTaskInput.value.trim() === ''; }); newTaskInput.addEventListener('keydown', (e) => { if(e.key==='Enter' && !addTaskBtn.disabled) addTask(todayString); }); } // Passer date
        energyButtons.forEach(button => { button.addEventListener('click', () => { const cs = contentWrapper.querySelector('.energy-selector button.selected'); if(cs===button&&button.dataset.energy!=='null'){ button.classList.remove('selected'); selectedEnergy=null; } else if (cs!==button){ if(cs) cs.classList.remove('selected'); button.classList.add('selected'); const v=button.dataset.energy; selectedEnergy=(v==='null')?null:parseInt(v,10); } }); });
        if (addTaskBtn) { addTaskBtn.addEventListener('click', () => addTask(todayString)); } // Passer date

    } catch (error) { console.error("Erreur chargement/rendu planificateur:", error); contentWrapper.innerHTML = '<p>Erreur chargement plan.</p>'; currentPlannerData = { tasks: [] }; }
}

/** Fonction de rafraîchissement exportée. */
export async function refreshPlannerView() {
    const mainContainer = document.getElementById('plannerView');
    const contentWrapper = mainContainer ? mainContainer.querySelector(`#${CONTENT_WRAPPER_ID}`) : null;
    if (contentWrapper) { await renderPlannerView(contentWrapper); } // Appeler render sur wrapper
    else { console.error("Échec refresh planner: Wrapper introuvable."); }
}
/** Initialise la vue Planificateur. */
export function initPlannerView(containerElement) {
    if (!containerElement) { console.error("Conteneur Plan introuvable."); return; }
    let contentWrapper = containerElement.querySelector(`#${CONTENT_WRAPPER_ID}`);
    if (!contentWrapper) { containerElement.innerHTML = `<h2>Plan du Jour</h2><div id="${CONTENT_WRAPPER_ID}"><p>Chargement...</p></div>`; contentWrapper = containerElement.querySelector(`#${CONTENT_WRAPPER_ID}`); }
    else { contentWrapper.innerHTML = '<p>Chargement...</p>'; }
    if (contentWrapper) { renderPlannerView(contentWrapper).catch(err => { console.error("Erreur init plan:", err); if(contentWrapper) contentWrapper.innerHTML = "<p>Erreur chargement plan.</p>"; }); }
    else { console.error("Impossible créer/trouver wrapper plan init."); }
}
