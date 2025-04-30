// plannerView.js (Version Corrigée v4 - Fix 'catch' et 'deleteTask' if)
import { getPlannerForDate, savePlannerForDate, getCurrentDateString } from './storageUtils.js';

let currentPlannerData = { tasks: [] };
let selectedEnergy = null;
// let todayString = ''; // Pas de globale
const CONTENT_WRAPPER_ID = 'planner-content-wrapper';

/** Met à jour statut tâche */
async function updateTaskCompletedStatus(taskId, isCompleted, dateStr) {
    if (!currentPlannerData || !Array.isArray(currentPlannerData.tasks) || !dateStr) return;
    const taskIndex = currentPlannerData.tasks.findIndex(task => task.id === taskId);
    if (taskIndex === -1) return;
    const originalState = currentPlannerData.tasks[taskIndex].completed;
    currentPlannerData.tasks[taskIndex].completed = isCompleted;
    const taskElement = document.querySelector(`#${CONTENT_WRAPPER_ID} .planner-task-item[data-task-id="${taskId}"]`);
    if (taskElement) taskElement.classList.toggle('task-completed', isCompleted);
    try { await savePlannerForDate(dateStr, currentPlannerData); }
    catch(error) { console.error("Err save plan status:", error); alert("Err sauvegarde tâche."); if(taskElement){ taskElement.classList.toggle('task-completed', originalState); const cb=taskElement.querySelector('.task-checkbox'); if(cb) cb.checked=originalState;} }
}

/** Supprime tâche */
async function deleteTask(taskId, dateStr) {
    if (!currentPlannerData || !Array.isArray(currentPlannerData.tasks) || !dateStr) return;
    const originalTasks = [...currentPlannerData.tasks];
    const taskToDelete = currentPlannerData.tasks.find(task => task.id === taskId);

    // Optimistic UI update
    const taskElement = document.querySelector(`#${CONTENT_WRAPPER_ID} .planner-task-item[data-task-id="${taskId}"]`);
    if (taskElement) taskElement.remove();

    // Update local data state
    currentPlannerData.tasks = currentPlannerData.tasks.filter(task => task.id !== taskId);

    // Try saving
    try {
        await savePlannerForDate(dateStr, currentPlannerData); // Sauvegarder données filtrées

        // Mettre à jour message si liste vide
        const taskListUl = document.getElementById('plannerTaskList'); // Cible la liste
        if (taskListUl && currentPlannerData.tasks.length === 0) { // <<< LIGNE CORRIGÉE (&& logique)
            taskListUl.innerHTML = '<p class="no-tasks-message">Aucune tâche planifiée.</p>';
        }
    } catch (error) { // <<< BLOC CATCH PRÉSENT
        console.error("Erreur sauvegarde plan après suppression:", error);
        alert("Erreur lors de la suppression de la tâche.");
        // Rollback Data
        currentPlannerData.tasks = originalTasks;
        // Rollback UI (le plus simple est de re-rendre)
        const wrapper = document.getElementById(CONTENT_WRAPPER_ID);
        if (wrapper) {
            await renderPlannerContent(wrapper); // Re-render toute la liste
        } else {
            console.error("Impossible de rafraîchir l'UI après échec suppression.");
        }
    }
}

/** Ajoute tâche */
async function addTask(dateStr) {
    const inputElement = document.getElementById('newTaskInput'); if(!inputElement) return;
    const text = inputElement.value.trim(); if (!text) { alert("Entrez le texte."); return; }
    const newTask = { id: Date.now(), text: text, energy: selectedEnergy, completed: false };
    if (!Array.isArray(currentPlannerData.tasks)) { currentPlannerData.tasks = []; }
    const originalTasks = [...currentPlannerData.tasks];
    currentPlannerData.tasks.push(newTask);
    try {
        await savePlannerForDate(dateStr, currentPlannerData);
        inputElement.value = ''; selectedEnergy = null; document.querySelectorAll('.energy-selector button.selected').forEach(b=>b.classList.remove('selected')); const addBtn=document.getElementById('addTaskBtn'); if(addBtn) addBtn.disabled=true;
        const ul=document.getElementById('plannerTaskList'); if(ul){ const noMsg=ul.querySelector('.no-tasks-message'); if(noMsg) noMsg.remove(); appendTaskToList(ul, newTask, dateStr); } else { refreshPlannerView(); }
    } catch (error) { console.error("Err save tâche plan:", error); alert("Err enregistrement tâche."); currentPlannerData.tasks=originalTasks; }
}

/** Ajoute LI à UL */
function appendTaskToList(listUl, task, dateStr) {
    if (!listUl || !task || listUl.querySelector(`[data-task-id="${task.id}"]`)) return;
    const li = document.createElement('li'); li.className = `planner-task-item ${task.completed ? 'task-completed' : ''}`; li.dataset.taskId = task.id;
    let eInd = ''; const eMap={1:'⚡',2:'⚡⚡',3:'⚡⚡⚡'}; const eTxt={1:'Basse',2:'Moyenne',3:'Haute'}; if(task.energy!==null && eMap[task.energy]){ eInd = `<span class="energy-indicator ${task.energy===1?'low':task.energy===2?'medium':'high'}" title="${eTxt[task.energy]} énergie">${eMap[task.energy]}</span>`; }
    const txt = document.createElement('span'); txt.className = 'task-text'; txt.textContent = task.text || '';
    li.innerHTML = `<input type="checkbox" id="planner-task-${task.id}" class="task-checkbox" ${task.completed?'checked':''}> <label for="planner-task-${task.id}" class="visually-hidden">Marquer "${txt.textContent}"</label> ${txt.outerHTML} ${eInd} <button class="delete-task-btn button-delete" title="Supprimer" aria-label="Supprimer: ${txt.textContent}">🗑️</button>`;
    const cb = li.querySelector('.task-checkbox'); const del = li.querySelector('.delete-task-btn');
    if(cb) { cb.addEventListener('change', (e) => updateTaskCompletedStatus(task.id, e.target.checked, dateStr)); }
    if(del) { del.addEventListener('click', () => { if(confirm(`Supprimer "${txt.textContent}" ?`)) deleteTask(task.id, dateStr); }); }
    listUl.appendChild(li);
}


/** Fonction principale de rendu. */
async function renderPlannerContent(contentWrapper) {
    if (!contentWrapper) { console.error("renderPlannerContent: wrapper invalide"); return; }
    const currentDateStr = getCurrentDateString();
    contentWrapper.innerHTML = '<p>Chargement...</p>';
    if (!currentDateStr) { contentWrapper.innerHTML = '<p>Erreur: Date invalide.</p>'; return; }

    try {
        const loadedData = await getPlannerForDate(currentDateStr);
        currentPlannerData = loadedData ? loadedData : { tasks: [] };
        if (!Array.isArray(currentPlannerData.tasks)) { currentPlannerData.tasks = []; }
        let formattedDate = 'Date'; try { formattedDate = new Date(currentDateStr + 'T00:00:00Z').toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }); } catch(e){}

        contentWrapper.innerHTML = `
            <h3>Mon Plan Doux du ${formattedDate}</h3>
            <div class="planner-add-task">
                 <label for="newTaskInput" class="visually-hidden">Nouvelle tâche:</label>
                 <input type="text" id="newTaskInput" placeholder="Nouvelle intention..." maxlength="150">
                 <div class="energy-selector" role="group" aria-labelledby="energy-label-planner"><span id="energy-label-planner" class="visually-hidden">Énergie:</span>Énergie :<button data-energy="1" title="Basse" aria-label="Basse">⚡</button><button data-energy="2" title="Moyenne" aria-label="Moyenne">⚡⚡</button><button data-energy="3" title="Haute" aria-label="Haute">⚡⚡⚡</button><button data-energy="null" title="Effacer" aria-label="Non définie">❓</button></div>
                 <button id="addTaskBtn" class="button-primary" disabled>Ajouter</button>
            </div>
            <ul id="plannerTaskList"></ul>`;

        const taskListUl = contentWrapper.querySelector('#plannerTaskList');
        if (taskListUl && currentPlannerData.tasks.length > 0) { currentPlannerData.tasks.forEach(task => appendTaskToList(taskListUl, task, currentDateStr)); }
        else if (taskListUl) { taskListUl.innerHTML = '<p class="no-tasks-message">Aucune tâche planifiée.</p>'; }

        const newTaskInput = contentWrapper.querySelector('#newTaskInput'); const addBtn = contentWrapper.querySelector('#addTaskBtn'); const energyBtns = contentWrapper.querySelectorAll('.energy-selector button');
        if(newTaskInput && addBtn) { newTaskInput.addEventListener('input', () => { addBtn.disabled = newTaskInput.value.trim() === ''; }); newTaskInput.addEventListener('keydown', (e) => { if(e.key==='Enter' && !addBtn.disabled) addTask(currentDateStr); }); }
        energyBtns.forEach(b => { b.addEventListener('click', () => { const cs = contentWrapper.querySelector('.energy-selector button.selected'); if(cs===b&&b.dataset.energy!=='null'){ b.classList.remove('selected'); selectedEnergy=null; } else if (cs!==b){ if(cs) cs.classList.remove('selected'); b.classList.add('selected'); const v=b.dataset.energy; selectedEnergy=(v==='null')?null:parseInt(v,10); } }); });
        if(addBtn) { addBtn.addEventListener('click', () => addTask(currentDateStr)); }

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
    if (contentWrapper) { renderPlannerContent(contentWrapper).catch(err => { console.error("Erreur init plan:", err); if(contentWrapper) contentWrapper.innerHTML="<p>Erreur chargement.</p>"; }); }
    else { console.error("Impossible créer/trouver wrapper plan init."); }
}
