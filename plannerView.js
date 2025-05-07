// plannerView.js (Version avec Sous-Tâches)
import { getPlannerForDate, savePlannerForDate, getCurrentDateString } from './storageUtils.js';

let currentPlannerData = { tasks: [] };
let selectedEnergy = null;
const CONTENT_WRAPPER_ID = 'planner-content-wrapper';

/** Met à jour le statut d'une tâche principale ou d'une sous-tâche */
async function updateTaskStatus(taskId, isCompleted, dateStr, subTaskId = null) {
    if (!currentPlannerData || !Array.isArray(currentPlannerData.tasks) || !dateStr) return;
    const taskIndex = currentPlannerData.tasks.findIndex(task => task.id === taskId);
    if (taskIndex === -1) return;

    let itemToUpdate;
    let elementSelector;
    let originalState;

    if (subTaskId !== null) {
        if (!Array.isArray(currentPlannerData.tasks[taskIndex].subTasks)) return;
        const subTaskIndex = currentPlannerData.tasks[taskIndex].subTasks.findIndex(st => st.id === subTaskId);
        if (subTaskIndex === -1) return;
        itemToUpdate = currentPlannerData.tasks[taskIndex].subTasks[subTaskIndex];
        elementSelector = `#${CONTENT_WRAPPER_ID} .sub-task-item[data-subtask-id="${subTaskId}"]`;
    } else {
        itemToUpdate = currentPlannerData.tasks[taskIndex];
        elementSelector = `#${CONTENT_WRAPPER_ID} .planner-task-item[data-task-id="${taskId}"] .main-task-content > .task-checkbox`; // Cible plus précise
    }

    originalState = itemToUpdate.completed;
    itemToUpdate.completed = isCompleted;

    const taskElement = document.querySelector(elementSelector)?.closest(subTaskId !== null ? '.sub-task-item' : '.planner-task-item');
    if (taskElement) {
        taskElement.classList.toggle('task-completed', isCompleted);
        const checkbox = taskElement.querySelector(subTaskId !== null ? '.sub-task-checkbox' : '.main-task-content > .task-checkbox');
        if(checkbox) checkbox.checked = isCompleted;
    }

    try { await savePlannerForDate(dateStr, currentPlannerData); }
    catch(error) {
         console.error("Err save plan status:", error); alert("Err sauvegarde tâche.");
         itemToUpdate.completed = originalState;
         if (taskElement) { taskElement.classList.toggle('task-completed', originalState); const cb=taskElement.querySelector(subTaskId !== null ? '.sub-task-checkbox' : '.main-task-content > .task-checkbox'); if(cb) cb.checked=originalState;}
    }
}

/** Supprime une tâche principale ou une sous-tâche */
async function deleteTask(taskId, dateStr, subTaskId = null) {
    if (!currentPlannerData || !Array.isArray(currentPlannerData.tasks) || !dateStr) return;
    const originalTasks = JSON.parse(JSON.stringify(currentPlannerData.tasks));

    let elementToRemove;
    if (subTaskId !== null) {
        const taskIndex = currentPlannerData.tasks.findIndex(task => task.id === taskId);
        if (taskIndex === -1 || !Array.isArray(currentPlannerData.tasks[taskIndex].subTasks)) return;
        currentPlannerData.tasks[taskIndex].subTasks = currentPlannerData.tasks[taskIndex].subTasks.filter(st => st.id !== subTaskId);
        elementToRemove = document.querySelector(`#${CONTENT_WRAPPER_ID} .sub-task-item[data-subtask-id="${subTaskId}"]`);
    } else {
        currentPlannerData.tasks = currentPlannerData.tasks.filter(task => task.id !== taskId);
        elementToRemove = document.querySelector(`#${CONTENT_WRAPPER_ID} .planner-task-item[data-task-id="${taskId}"]`);
    }

    if (elementToRemove) elementToRemove.remove();

    try {
        await savePlannerForDate(dateStr, currentPlannerData);
        const taskListUl = document.getElementById('plannerTaskList');
        if (taskListUl && currentPlannerData.tasks.length === 0 && subTaskId === null) {
            taskListUl.innerHTML = '<p class="no-tasks-message">Aucune tâche planifiée.</p>';
        }
    } catch(error) {
        console.error("Err save plan suppression:", error); alert("Err suppression tâche.");
        currentPlannerData.tasks = originalTasks;
        const wrapper = document.getElementById(CONTENT_WRAPPER_ID); if(wrapper) await renderPlannerContent(wrapper);
    }
}

/** Ajoute une tâche principale */
async function addTask(dateStr) {
    const inputElement = document.getElementById('newTaskInput'); if(!inputElement) return;
    const text = inputElement.value.trim(); if (!text) { alert("Entrez le texte."); return; }
    const newTask = { id: Date.now(), text: text, energy: selectedEnergy, completed: false, subTasks: [] };
    if (!Array.isArray(currentPlannerData.tasks)) { currentPlannerData.tasks = []; }
    const originalTasks = JSON.parse(JSON.stringify(currentPlannerData.tasks));
    currentPlannerData.tasks.push(newTask);
    try {
        await savePlannerForDate(dateStr, currentPlannerData);
        inputElement.value = ''; selectedEnergy = null; document.querySelectorAll('.energy-selector button.selected').forEach(b=>b.classList.remove('selected')); const addBtn=document.getElementById('addTaskBtn'); if(addBtn) addBtn.disabled=true;
        const ul=document.getElementById('plannerTaskList'); if(ul){ const noMsg=ul.querySelector('.no-tasks-message'); if(noMsg) noMsg.remove(); appendTaskToList(ul, newTask, dateStr); } else { refreshPlannerView(); }
    } catch (error) { console.error("Err save tâche plan:", error); alert("Err enregistrement tâche."); currentPlannerData.tasks=originalTasks; }
}

/** Ajoute une sous-tâche à une tâche principale */
async function addSubTask(parentTaskId, subTaskText, dateStr) {
    if (!currentPlannerData || !Array.isArray(currentPlannerData.tasks) || !dateStr) return;
    const taskIndex = currentPlannerData.tasks.findIndex(task => task.id === parentTaskId);
    if (taskIndex === -1) { console.error("Tâche parent non trouvée"); return; }
    if (!Array.isArray(currentPlannerData.tasks[taskIndex].subTasks)) { currentPlannerData.tasks[taskIndex].subTasks = []; }
    const newSubTask = { id: Date.now(), text: subTaskText, completed: false };
    currentPlannerData.tasks[taskIndex].subTasks.push(newSubTask);

    try {
         await savePlannerForDate(dateStr, currentPlannerData);
         const parentTaskElement = document.querySelector(`#${CONTENT_WRAPPER_ID} .planner-task-item[data-task-id="${parentTaskId}"]`);
         if (parentTaskElement) {
              let subTaskListUl = parentTaskElement.querySelector('.sub-task-list');
              if (!subTaskListUl) { // Créer le UL s'il n'existe pas
                   subTaskListUl = document.createElement('ul');
                   subTaskListUl.className = 'sub-task-list';
                   const container = parentTaskElement.querySelector('.sub-tasks-container');
                   if(container) { container.innerHTML = ''; container.appendChild(subTaskListUl); }
              }
              appendSubTaskToUi(subTaskListUl, newSubTask, parentTaskId, dateStr);
              // Rendre le conteneur de sous-tâches visible s'il était caché
              const subTasksContainer = parentTaskElement.querySelector('.sub-tasks-container');
              if (subTasksContainer) subTasksContainer.style.display = 'block';
         } else { refreshPlannerView(); }
    } catch (error) { console.error("Erreur sauvegarde sous-tâche:", error); alert("Erreur ajout sous-tâche."); currentPlannerData.tasks[taskIndex].subTasks.pop(); }
}

/** Ajoute un LI de sous-tâche à une liste de sous-tâches UL */
function appendSubTaskToUi(subListUl, subTask, parentTaskId, dateStr) {
    if (!subListUl || !subTask || subListUl.querySelector(`[data-subtask-id="${subTask.id}"]`)) return;
    const subLi = document.createElement('li');
    subLi.className = `sub-task-item ${subTask.completed ? 'task-completed' : ''}`;
    subLi.dataset.subtaskId = subTask.id; subLi.dataset.parentTaskId = parentTaskId;
    const subLabel = document.createElement('label'); subLabel.htmlFor = `planner-subtask-${subTask.id}`; subLabel.className = 'sub-task-text'; subLabel.textContent = subTask.text || '';
    subLi.innerHTML = `<input type="checkbox" id="planner-subtask-${subTask.id}" class="sub-task-checkbox" ${subTask.completed?'checked':''}> ${subLabel.outerHTML} <button class="delete-subtask-btn button-delete" title="Suppr. sous-tâche" aria-label="Suppr. sous-tâche: ${subTask.text||''}">🗑️</button>`;
    const subCheckbox = subLi.querySelector('.sub-task-checkbox'); const deleteSubBtn = subLi.querySelector('.delete-subtask-btn');
    if(subCheckbox) { subCheckbox.addEventListener('change', (e) => updateTaskStatus(parentTaskId, e.target.checked, dateStr, subTask.id)); }
    if(deleteSubBtn) { deleteSubBtn.addEventListener('click', () => { if(confirm(`Supprimer sous-tâche "${subTask.text||''}" ?`)) deleteTask(parentTaskId, dateStr, subTask.id); }); }
    subListUl.appendChild(subLi);
}

/** Ajoute un LI de tâche principale à la liste UL */
function appendTaskToList(listUl, task, dateStr) {
    if (!listUl || !task || listUl.querySelector(`[data-task-id="${task.id}"]`)) return;
    const li = document.createElement('li'); li.className = `planner-task-item ${task.completed ? 'task-completed' : ''}`; li.dataset.taskId = task.id;
    let eInd = ''; const eMap={1:'⚡',2:'⚡⚡',3:'⚡⚡⚡'}; const eTxt={1:'Basse',2:'Moyenne',3:'Haute'}; if(task.energy!==null && eMap[task.energy]){ eInd = `<span class="energy-indicator ${task.energy===1?'low':task.energy===2?'medium':'high'}" title="${eTxt[task.energy]} énergie">${eMap[task.energy]}</span>`; }
    const txt = document.createElement('span'); txt.className = 'task-text'; txt.textContent = task.text || '';

    let subTasksHtml = '';
    if (Array.isArray(task.subTasks) && task.subTasks.length > 0) {
         subTasksHtml = '<ul class="sub-task-list">';
         task.subTasks.forEach(st => {
              const subLabel = document.createElement('label'); subLabel.htmlFor = `planner-subtask-${st.id}`; subLabel.className = 'sub-task-text'; subLabel.textContent = st.text || '';
              subTasksHtml += `<li class="sub-task-item ${st.completed ? 'task-completed' : ''}" data-subtask-id="${st.id}" data-parent-task-id="${task.id}"><input type="checkbox" id="planner-subtask-${st.id}" class="sub-task-checkbox" ${st.completed?'checked':''}> ${subLabel.outerHTML} <button class="delete-subtask-btn button-delete" title="Suppr. sous-tâche" aria-label="Suppr. sous-tâche: ${st.text||''}">🗑️</button></li>`;
         });
         subTasksHtml += '</ul>';
    }

    // Conteneur pour la tâche principale
    const mainTaskContentDiv = document.createElement('div');
    mainTaskContentDiv.className = 'main-task-content';
    mainTaskContentDiv.innerHTML = `
        <input type="checkbox" id="planner-task-${task.id}" class="task-checkbox" ${task.completed?'checked':''}>
        <label for="planner-task-${task.id}" class="visually-hidden">Marquer "${txt.textContent}"</label>
        ${txt.outerHTML}
        ${eInd}
        <button class="add-subtask-btn" title="Ajouter sous-tâche" aria-label="Ajouter sous-tâche à ${txt.textContent}">➕</button>
        <button class="delete-task-btn button-delete" title="Supprimer tâche principale" aria-label="Supprimer tâche: ${txt.textContent}">🗑️</button>
    `;
    li.appendChild(mainTaskContentDiv);

    // Conteneur pour les sous-tâches
    const subTasksContainerDiv = document.createElement('div');
    subTasksContainerDiv.className = 'sub-tasks-container';
    subTasksContainerDiv.innerHTML = subTasksHtml; // Insérer les sous-tâches pré-rendues
    li.appendChild(subTasksContainerDiv);

    // Attacher les listeners à la tâche principale
    const cb = mainTaskContentDiv.querySelector('.task-checkbox');
    const del = mainTaskContentDiv.querySelector('.delete-task-btn');
    const addSubBtn = mainTaskContentDiv.querySelector('.add-subtask-btn');
    if(cb) { cb.addEventListener('change', (e) => updateTaskStatus(task.id, e.target.checked, dateStr)); }
    if(del) { del.addEventListener('click', () => { if(confirm(`Supprimer "${txt.textContent}" et ses sous-tâches ?`)) deleteTask(task.id, dateStr); }); }
    if(addSubBtn) { addSubBtn.addEventListener('click', () => {
        const subTaskText = prompt("Nouvelle sous-tâche pour : " + task.text);
        if (subTaskText && subTaskText.trim() !== "") {
            addSubTask(task.id, subTaskText.trim(), dateStr);
        }
    });}

    // Ré-attacher les listeners pour les sous-tâches qui viennent d'être insérées via innerHTML
    const subTaskListUl = li.querySelector('.sub-task-list');
    if (subTaskListUl) {
         subTaskListUl.querySelectorAll('.sub-task-item').forEach(subLi => {
              const subTaskId = Number.parseInt(subLi.dataset.subtaskId, 10);
              const parentTaskIdFromData = Number.parseInt(subLi.dataset.parentTaskId, 10); // = task.id
              const subCheckbox = subLi.querySelector('.sub-task-checkbox');
              const deleteSubBtn = subLi.querySelector('.delete-subtask-btn');
              const subTaskTextContent = subLi.querySelector('.sub-task-text')?.textContent || '';

              if(subCheckbox) { subCheckbox.addEventListener('change', (e) => updateTaskStatus(parentTaskIdFromData, e.target.checked, dateStr, subTaskId)); }
              if(deleteSubBtn) { deleteSubBtn.addEventListener('click', () => { if(confirm(`Supprimer sous-tâche "${subTaskTextContent}" ?`)) deleteTask(parentTaskIdFromData, dateStr, subTaskId); }); }
         });
    }
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
        // S'assurer que chaque tâche a un tableau subTasks
        currentPlannerData.tasks.forEach(task => { if (!Array.isArray(task.subTasks)) task.subTasks = []; });

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
