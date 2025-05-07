// plannerView.js (Avec Sous-tâches)
import { getPlannerForDate, savePlannerForDate, getCurrentDateString } from './storageUtils.js';

let currentPlannerData = { tasks: [] }; // Structure : { tasks: [{id, text, energy, completed, subTasks: [{id, text, completed}] }] }
let selectedEnergy = null;
const CONTENT_WRAPPER_ID = 'planner-content-wrapper';

/** Met à jour statut complétion TÂCHE PRINCIPALE */
async function updateTaskCompletedStatus(taskId, isCompleted, dateStr) {
    if (!currentPlannerData?.tasks) return;
    const taskIndex = currentPlannerData.tasks.findIndex(t => t.id === taskId);
    if (taskIndex === -1) return;
    currentPlannerData.tasks[taskIndex].completed = isCompleted;
    // Si une tâche principale est marquée comme complétée, on pourrait marquer toutes ses sous-tâches aussi (optionnel)
    // if (isCompleted && currentPlannerData.tasks[taskIndex].subTasks) {
    //     currentPlannerData.tasks[taskIndex].subTasks.forEach(st => st.completed = true);
    // }
    const taskElement = document.querySelector(`#${CONTENT_WRAPPER_ID} .planner-task-item[data-task-id="${taskId}"]`);
    if (taskElement) taskElement.classList.toggle('task-completed', isCompleted);
    // Rafraîchir l'affichage des sous-tâches si la tâche principale change d'état
    if (taskElement && currentPlannerData.tasks[taskIndex].subTasks?.length > 0) {
        const subTaskListUl = taskElement.querySelector('.subtask-list');
        if (subTaskListUl) renderSubTasks(subTaskListUl, currentPlannerData.tasks[taskIndex].subTasks, taskId, dateStr);
    }
    try { await savePlannerForDate(dateStr, currentPlannerData); } catch(e){ console.error("Err save plan status:", e); /* Gérer rollback UI */ }
}

/** Met à jour statut complétion SOUS-TÂCHE */
async function updateSubTaskCompletedStatus(mainTaskId, subTaskId, isCompleted, dateStr) {
    if (!currentPlannerData?.tasks) return;
    const mainTask = currentPlannerData.tasks.find(t => t.id === mainTaskId);
    if (!mainTask || !Array.isArray(mainTask.subTasks)) return;
    const subTaskIndex = mainTask.subTasks.findIndex(st => st.id === subTaskId);
    if (subTaskIndex === -1) return;
    mainTask.subTasks[subTaskIndex].completed = isCompleted;
    const subTaskElement = document.querySelector(`#${CONTENT_WRAPPER_ID} .subtask-item[data-subtask-id="${subTaskId}"]`);
    if (subTaskElement) subTaskElement.classList.toggle('task-completed', isCompleted);
    try { await savePlannerForDate(dateStr, currentPlannerData); } catch(e){ console.error("Err save plan subtask status:", e); /* Gérer rollback UI */ }
}

/** Supprime TÂCHE PRINCIPALE */
async function deleteTask(taskId, dateStr) {
    if (!currentPlannerData?.tasks) return;
    const originalTasks = [...currentPlannerData.tasks];
    currentPlannerData.tasks = currentPlannerData.tasks.filter(t => t.id !== taskId);
    const taskElement = document.querySelector(`#${CONTENT_WRAPPER_ID} .planner-task-item[data-task-id="${taskId}"]`);
    if (taskElement) taskElement.remove();
    try { await savePlannerForDate(dateStr, currentPlannerData); const ul = document.getElementById('plannerTaskList'); if (ul && currentPlannerData.tasks.length === 0) ul.innerHTML = '<p class="no-tasks-message">Aucune tâche.</p>'; }
    catch (e) { console.error("Err save plan suppression:", e); currentPlannerData.tasks = originalTasks; refreshPlannerView(); }
}

/** Supprime SOUS-TÂCHE */
async function deleteSubTask(mainTaskId, subTaskId, dateStr) {
    if (!currentPlannerData?.tasks) return;
    const mainTask = currentPlannerData.tasks.find(t => t.id === mainTaskId);
    if (!mainTask || !Array.isArray(mainTask.subTasks)) return;
    const originalSubTasks = [...mainTask.subTasks];
    mainTask.subTasks = mainTask.subTasks.filter(st => st.id !== subTaskId);
    const subTaskElement = document.querySelector(`#${CONTENT_WRAPPER_ID} .subtask-item[data-subtask-id="${subTaskId}"]`);
    if (subTaskElement) subTaskElement.remove();
    try { await savePlannerForDate(dateStr, currentPlannerData); }
    catch (e) { console.error("Err save plan suppression sous-tâche:", e); mainTask.subTasks = originalSubTasks; refreshPlannerView(); }
}

/** Ajoute TÂCHE PRINCIPALE */
async function addTask(dateStr) {
    const inputEl = document.getElementById('newTaskInput'); if(!inputEl) return;
    const text = inputEl.value.trim(); if (!text) { alert("Entrez le texte."); return; }
    const newTask = { id: Date.now(), text: text, energy: selectedEnergy, completed: false, subTasks: [] }; // Ajouter subTasks vide
    if (!Array.isArray(currentPlannerData.tasks)) { currentPlannerData.tasks = []; }
    currentPlannerData.tasks.push(newTask);
    try {
        await savePlannerForDate(dateStr, currentPlannerData);
        inputEl.value = ''; selectedEnergy = null; document.querySelectorAll('.energy-selector button.selected').forEach(b=>b.classList.remove('selected')); const addBtn=document.getElementById('addTaskBtn'); if(addBtn) addBtn.disabled=true;
        const ul=document.getElementById('plannerTaskList'); if(ul){ const noMsg=ul.querySelector('.no-tasks-message'); if(noMsg) noMsg.remove(); appendTaskToList(ul, newTask, dateStr); } else { refreshPlannerView(); }
    } catch (e) { console.error("Err save tâche plan:", e); alert("Err enregistrement."); currentPlannerData.tasks.pop(); }
}

/** Ajoute SOUS-TÂCHE */
async function addSubTask(mainTaskId, subTaskText, dateStr) {
    if (!subTaskText.trim()) { alert("Entrez le texte de la sous-tâche."); return; }
    if (!currentPlannerData?.tasks) return;
    const mainTask = currentPlannerData.tasks.find(t => t.id === mainTaskId);
    if (!mainTask) return;
    if (!Array.isArray(mainTask.subTasks)) mainTask.subTasks = [];
    const newSubTask = { id: Date.now() + Math.random(), text: subTaskText.trim(), completed: false }; // ID plus unique
    mainTask.subTasks.push(newSubTask);
    try {
        await savePlannerForDate(dateStr, currentPlannerData);
        // Rafraîchir l'affichage des sous-tâches pour cette tâche principale
        const mainTaskElement = document.querySelector(`#${CONTENT_WRAPPER_ID} .planner-task-item[data-task-id="${mainTaskId}"]`);
        if (mainTaskElement) {
            const subTaskListUl = mainTaskElement.querySelector('.subtask-list');
            if (subTaskListUl) {
                // appendSubTaskToList(subTaskListUl, newSubTask, mainTaskId, dateStr); // Ajoute la nouvelle
                 renderSubTasks(subTaskListUl, mainTask.subTasks, mainTaskId, dateStr); // Re-render toutes les sous-tâches
            }
            // Vider l'input de la sous-tâche
            const subTaskInput = mainTaskElement.querySelector('.new-subtask-input');
            if (subTaskInput) subTaskInput.value = '';
        }
    } catch (e) { console.error("Err save sous-tâche:", e); alert("Err enregistrement sous-tâche."); mainTask.subTasks.pop(); }
}

/** Ajoute LI SOUS-TÂCHE à UL de sous-tâches */
function appendSubTaskToList(subTaskListUl, subTask, mainTaskId, dateStr) {
    if(subTaskListUl.querySelector(`[data-subtask-id="${subTask.id}"]`)) return;
    const li = document.createElement('li');
    li.className = `subtask-item ${subTask.completed ? 'task-completed' : ''}`;
    li.dataset.subtaskId = subTask.id;
    const textSpan = document.createElement('span'); textSpan.className = 'subtask-text'; textSpan.textContent = subTask.text;
    li.innerHTML = `<input type="checkbox" id="subtask-${subTask.id}" class="subtask-checkbox" ${subTask.completed?'checked':''}> <label for="subtask-${subTask.id}" class="visually-hidden">Marquer sous-tâche "${subTask.text}"</label> ${textSpan.outerHTML} <button class="delete-subtask-btn button-delete" title="Supprimer sous-tâche">×</button>`;
    const cb = li.querySelector('.subtask-checkbox'); const del = li.querySelector('.delete-subtask-btn');
    if(cb) cb.addEventListener('change', (e) => updateSubTaskCompletedStatus(mainTaskId, subTask.id, e.target.checked, dateStr));
    if(del) del.addEventListener('click', () => { if(confirm(`Supprimer sous-tâche "${subTask.text}"?`)) deleteSubTask(mainTaskId, subTask.id, dateStr); });
    subTaskListUl.appendChild(li);
}

/** Affiche/Met à jour les sous-tâches pour une tâche principale donnée */
function renderSubTasks(subTaskListUl, subTasks, mainTaskId, dateStr) {
    if(!subTaskListUl) return;
    subTaskListUl.innerHTML = ''; // Vider
    if (Array.isArray(subTasks) && subTasks.length > 0) {
        subTasks.forEach(st => appendSubTaskToList(subTaskListUl, st, mainTaskId, dateStr));
    }
}

/** Ajoute LI TÂCHE PRINCIPALE à UL principale */
function appendTaskToList(listUl, task, dateStr) {
    if (listUl.querySelector(`[data-task-id="${task.id}"]`)) return;
    const li = document.createElement('li'); li.className = `planner-task-item ${task.completed ? 'task-completed' : ''}`; li.dataset.taskId = task.id;
    let eInd = ''; const eMap={1:'⚡',2:'⚡⚡',3:'⚡⚡⚡'}; const eTxt={1:'Basse',2:'Moyenne',3:'Haute'}; if(task.energy!==null && eMap[task.energy]){ eInd = `<span class="energy-indicator ${task.energy===1?'low':task.energy===2?'medium':'high'}" title="${eTxt[task.energy]} énergie">${eMap[task.energy]}</span>`; }
    const txt = document.createElement('span'); txt.className = 'task-text'; txt.textContent = task.text || '';
    li.innerHTML = `
        <div class="main-task-content">
            <input type="checkbox" id="planner-task-${task.id}" class="task-checkbox" ${task.completed?'checked':''}>
            <label for="planner-task-${task.id}" class="visually-hidden">Marquer "${txt.textContent}"</label>
            ${txt.outerHTML}
            ${eInd}
            <button class="delete-task-btn button-delete" title="Supprimer tâche principale" aria-label="Supprimer tâche principale: ${txt.textContent}">🗑️</button>
        </div>
        <div class="subtask-section">
            <ul class="subtask-list"></ul> <!-- Conteneur pour sous-tâches -->
            <div class="add-subtask-form">
                <input type="text" class="new-subtask-input" placeholder="Ajouter une sous-tâche..." maxlength="100" aria-label="Nouvelle sous-tâche pour ${txt.textContent}">
                <button class="add-subtask-btn button-secondary" title="Ajouter sous-tâche">+</button>
            </div>
        </div>`;
    const cb = li.querySelector('.main-task-content .task-checkbox'); const del = li.querySelector('.main-task-content .delete-task-btn');
    const subTaskListUl = li.querySelector('.subtask-list');
    const addSubTaskBtn = li.querySelector('.add-subtask-btn');
    const newSubTaskInput = li.querySelector('.new-subtask-input');

    if(cb) { cb.addEventListener('change', (e) => updateTaskCompletedStatus(task.id, e.target.checked, dateStr)); }
    if(del) { del.addEventListener('click', () => { if(confirm(`Supprimer tâche "${txt.textContent}" et ses sous-tâches ?`)) deleteTask(task.id, dateStr); }); }
    if(addSubTaskBtn && newSubTaskInput) { addSubTaskBtn.addEventListener('click', () => addSubTask(task.id, newSubTaskInput.value, dateStr)); newSubTaskInput.addEventListener('keydown', (e) => { if(e.key==='Enter') {e.preventDefault(); addSubTaskBtn.click();}}); }
    if(subTaskListUl && Array.isArray(task.subTasks)) { renderSubTasks(subTaskListUl, task.subTasks, task.id, dateStr); }
    listUl.appendChild(li);
}

/** Fonction principale de rendu. */
async function renderPlannerContent(contentWrapper) {
    if (!contentWrapper) { console.error("renderPlannerContent: wrapper invalide"); return; }
    const currentDateStr = getCurrentDateString();
    contentWrapper.innerHTML = '<p>Chargement du plan...</p>';
    if (!currentDateStr) { contentWrapper.innerHTML = '<p>Erreur: Date invalide.</p>'; return; }
    try {
        const loadedData = await getPlannerForDate(currentDateStr);
        currentPlannerData = loadedData ? loadedData : { tasks: [] };
        if (!Array.isArray(currentPlannerData.tasks)) { currentPlannerData.tasks = []; }
        let formattedDate = 'Date'; try { formattedDate = new Date(currentDateStr + 'T00:00:00Z').toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }); } catch(e){}
        contentWrapper.innerHTML = `<h3>Mon Plan Doux du ${formattedDate}</h3> <div class="planner-add-task"> <label for="newTaskInput" class="visually-hidden">Nouvelle tâche:</label> <input type="text" id="newTaskInput" placeholder="Intention principale..." maxlength="150"> <div class="energy-selector" role="group" aria-labelledby="energy-label-planner"><span id="energy-label-planner" class="visually-hidden">Énergie:</span>Énergie :<button data-energy="1" title="Basse" aria-label="Basse">⚡</button><button data-energy="2" title="Moyenne" aria-label="Moyenne">⚡⚡</button><button data-energy="3" title="Haute" aria-label="Haute">⚡⚡⚡</button><button data-energy="null" title="Effacer" aria-label="Non définie">❓</button></div> <button id="addTaskBtn" class="button-primary" disabled>Ajouter Tâche</button> </div> <ul id="plannerTaskList"></ul>`;
        const taskListUl = contentWrapper.querySelector('#plannerTaskList');
        if (taskListUl && currentPlannerData.tasks.length > 0) { currentPlannerData.tasks.forEach(task => appendTaskToList(taskListUl, task, currentDateStr)); }
        else if (taskListUl) { taskListUl.innerHTML = '<p class="no-tasks-message">Aucune tâche principale planifiée.</p>'; }
        const newTaskInput = contentWrapper.querySelector('#newTaskInput'); const addBtn = contentWrapper.querySelector('#addTaskBtn'); const energyBtns = contentWrapper.querySelectorAll('.energy-selector button');
        if(newTaskInput && addBtn) { newTaskInput.addEventListener('input', () => { addBtn.disabled = newTaskInput.value.trim() === ''; }); newTaskInput.addEventListener('keydown', (e) => { if(e.key==='Enter' && !addBtn.disabled) addTask(currentDateStr); }); }
        energyBtns.forEach(b => { b.addEventListener('click', () => { const cs = contentWrapper.querySelector('.energy-selector button.selected'); if(cs===b&&b.dataset.energy!=='null'){ b.classList.remove('selected'); selectedEnergy=null; } else if (cs!==b){ if(cs) cs.classList.remove('selected'); b.classList.add('selected'); const v=b.dataset.energy; selectedEnergy=(v==='null')?null:parseInt(v,10); } }); });
        if(addBtn) { addBtn.addEventListener('click', () => addTask(currentDateStr)); }
    } catch (error) { console.error("Erreur chargement/rendu planificateur:", error); contentWrapper.innerHTML = '<p>Erreur chargement plan.</p>'; currentPlannerData = { tasks: [] }; }
}

/** Fonction de rafraîchissement. */
export async function refreshPlannerView() {
    const mainContainer = document.getElementById('plannerView');
    const contentWrapper = mainContainer ? mainContainer.querySelector(`#${CONTENT_WRAPPER_ID}`) : null;
    if (contentWrapper) { await renderPlannerContent(contentWrapper); }
    else { console.error("Échec refresh planner: Wrapper introuvable."); }
}
/** Initialise la vue. */
export function initPlannerView(containerElement) {
    if (!containerElement) { console.error("Conteneur Plan introuvable."); return; }
    let contentWrapper = containerElement.querySelector(`#${CONTENT_WRAPPER_ID}`);
    if (!contentWrapper) { containerElement.innerHTML = `<h2>Plan du Jour</h2><div id="${CONTENT_WRAPPER_ID}"><p>Chargement...</p></div>`; contentWrapper = containerElement.querySelector(`#${CONTENT_WRAPPER_ID}`); }
    else { contentWrapper.innerHTML = '<p>Chargement...</p>'; }
    if (contentWrapper) { renderPlannerContent(contentWrapper).catch(err => { console.error("Erreur init plan:", err); if(contentWrapper) contentWrapper.innerHTML="<p>Erreur chargement.</p>"; }); }
    else { console.error("Impossible créer/trouver wrapper plan init."); }
}
