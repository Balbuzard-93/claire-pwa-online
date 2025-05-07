// plannerView.js (Avec gestion des sous-tâches)
import { getPlannerForDate, savePlannerForDate, getCurrentDateString } from './storageUtils.js';

let currentPlannerData = { tasks: [] };
let selectedEnergy = null;
const CONTENT_WRAPPER_ID = 'planner-content-wrapper';

/** Met à jour l'état de complétion d'une tâche ou sous-tâche. */
async function updateTaskCompletedStatus(taskId, isCompleted, dateStr, subTaskId = null) {
    if (!currentPlannerData || !Array.isArray(currentPlannerData.tasks) || !dateStr) return;

    const taskIndex = currentPlannerData.tasks.findIndex(t => t.id === taskId);
    if (taskIndex === -1) return;

    let itemToUpdate;
    let elementSelector;

    if (subTaskId !== null) { // C'est une sous-tâche
        if (!Array.isArray(currentPlannerData.tasks[taskIndex].subTasks)) {
            currentPlannerData.tasks[taskIndex].subTasks = []; // S'assurer qu'elle existe
        }
        const subTaskIndex = currentPlannerData.tasks[taskIndex].subTasks.findIndex(st => st.id === subTaskId);
        if (subTaskIndex === -1) return;
        itemToUpdate = currentPlannerData.tasks[taskIndex].subTasks[subTaskIndex];
        elementSelector = `#${CONTENT_WRAPPER_ID} .sub-task-item[data-subtask-id="${subTaskId}"]`;
    } else { // C'est une tâche principale
        itemToUpdate = currentPlannerData.tasks[taskIndex];
        elementSelector = `#${CONTENT_WRAPPER_ID} .planner-task-item[data-task-id="${taskId}"]`;
    }

    const originalState = itemToUpdate.completed;
    itemToUpdate.completed = isCompleted;

    const taskElement = document.querySelector(elementSelector);
    if (taskElement) {
         taskElement.classList.toggle('task-completed', isCompleted);
         const cb = taskElement.querySelector('.task-checkbox'); if(cb) cb.checked = isCompleted;
    }

    // Optionnel: Si toutes les sous-tâches sont cochées, cocher la tâche principale
    if (subTaskId !== null && isCompleted) {
        const parentTask = currentPlannerData.tasks[taskIndex];
        const allSubTasksCompleted = parentTask.subTasks.every(st => st.completed);
        if (allSubTasksCompleted && !parentTask.completed) {
            parentTask.completed = true;
            const parentElement = document.querySelector(`#${CONTENT_WRAPPER_ID} .planner-task-item[data-task-id="${taskId}"]`);
            if (parentElement) {
                 parentElement.classList.add('task-completed');
                 const parentCb = parentElement.querySelector(`#planner-task-${taskId}.task-checkbox`);
                 if(parentCb) parentCb.checked = true;
            }
        }
    }
    // Optionnel: Si une sous-tâche est décochée, décocher la tâche principale
    if (subTaskId !== null && !isCompleted) {
        const parentTask = currentPlannerData.tasks[taskIndex];
        if (parentTask.completed) {
             parentTask.completed = false;
             const parentElement = document.querySelector(`#${CONTENT_WRAPPER_ID} .planner-task-item[data-task-id="${taskId}"]`);
             if (parentElement) {
                  parentElement.classList.remove('task-completed');
                  const parentCb = parentElement.querySelector(`#planner-task-${taskId}.task-checkbox`);
                  if(parentCb) parentCb.checked = false;
             }
        }
    }


    try { await savePlannerForDate(dateStr, currentPlannerData); }
    catch(error) { console.error("Err save plan status:", error); alert("Err sauvegarde tâche."); itemToUpdate.completed = originalState; if(taskElement){ taskElement.classList.toggle('task-completed', originalState); const cb=taskElement.querySelector('.task-checkbox'); if(cb) cb.checked=originalState;} }
}

/** Supprime une tâche principale ou une sous-tâche. */
async function deleteTask(taskId, dateStr, subTaskId = null) {
    if (!currentPlannerData || !Array.isArray(currentPlannerData.tasks) || !dateStr) return;
    const originalTasks = JSON.parse(JSON.stringify(currentPlannerData.tasks)); // Copie profonde

    let elementToRemoveSelector;

    if (subTaskId !== null) {
        const taskIndex = currentPlannerData.tasks.findIndex(t => t.id === taskId);
        if (taskIndex !== -1 && Array.isArray(currentPlannerData.tasks[taskIndex].subTasks)) {
            currentPlannerData.tasks[taskIndex].subTasks = currentPlannerData.tasks[taskIndex].subTasks.filter(st => st.id !== subTaskId);
            elementToRemoveSelector = `#${CONTENT_WRAPPER_ID} .sub-task-item[data-subtask-id="${subTaskId}"]`;
        }
    } else {
        currentPlannerData.tasks = currentPlannerData.tasks.filter(task => task.id !== taskId);
        elementToRemoveSelector = `#${CONTENT_WRAPPER_ID} .planner-task-item[data-task-id="${taskId}"]`;
    }

    const taskElement = document.querySelector(elementToRemoveSelector);
    if (taskElement) taskElement.remove();

    try {
        await savePlannerForDate(dateStr, currentPlannerData);
        const ul=document.getElementById('plannerTaskList');
        if(ul && currentPlannerData.tasks.length===0 && subTaskId === null) { // Afficher message si toutes les tâches principales sont supprimées
            ul.innerHTML='<p class="no-tasks-message">Aucune tâche.</p>';
        }
    } catch(error) {
        console.error("Err save plan suppression:", error); alert("Err suppression tâche.");
        currentPlannerData.tasks=originalTasks; // Rollback data
        await refreshPlannerView(); // Re-render pour refléter rollback
    }
}

/** Ajoute une nouvelle tâche principale. */
async function addTask(dateStr) {
    const inputElement = document.getElementById('newTaskInput'); if(!inputElement) return;
    const text = inputElement.value.trim(); if (!text) { alert("Entrez le texte."); return; }
    const newTask = { id: Date.now(), text: text, energy: selectedEnergy, completed: false, subTasks: [] }; // Ajouter tableau subTasks vide
    if (!Array.isArray(currentPlannerData.tasks)) { currentPlannerData.tasks = []; }
    currentPlannerData.tasks.push(newTask);
    try {
        await savePlannerForDate(dateStr, currentPlannerData);
        inputElement.value = ''; selectedEnergy = null; document.querySelectorAll('.energy-selector button.selected').forEach(b=>b.classList.remove('selected')); const addBtn=document.getElementById('addTaskBtn'); if(addBtn) addBtn.disabled=true;
        const ul=document.getElementById('plannerTaskList'); if(ul){ const noMsg=ul.querySelector('.no-tasks-message'); if(noMsg) noMsg.remove(); appendTaskToList(ul, newTask, dateStr); } else { refreshPlannerView(); }
    } catch (error) { console.error("Err save tâche plan:", error); alert("Err enregistrement tâche."); currentPlannerData.tasks.pop(); }
}

/** Ajoute une sous-tâche à une tâche principale. */
async function addSubTask(parentTaskId, dateStr) {
    const subTaskText = prompt("Entrez le texte de la sous-tâche :");
    if (!subTaskText || subTaskText.trim() === '') return;

    const parentTaskIndex = currentPlannerData.tasks.findIndex(t => t.id === parentTaskId);
    if (parentTaskIndex === -1) return;

    if (!Array.isArray(currentPlannerData.tasks[parentTaskIndex].subTasks)) {
        currentPlannerData.tasks[parentTaskIndex].subTasks = [];
    }
    const newSubTask = { id: Date.now(), text: subTaskText.trim(), completed: false };
    currentPlannerData.tasks[parentTaskIndex].subTasks.push(newSubTask);

    try {
        await savePlannerForDate(dateStr, currentPlannerData);
        // Re-rendre la tâche parente spécifique pour afficher la nouvelle sous-tâche
        const parentTaskElement = document.querySelector(`#${CONTENT_WRAPPER_ID} .planner-task-item[data-task-id="${parentTaskId}"]`);
        const parentTaskListUl = document.getElementById('plannerTaskList'); // La liste principale
        if (parentTaskElement && parentTaskListUl) {
             const tempLi = document.createElement('li'); // Conteneur temporaire
             appendTaskToList(tempLi, currentPlannerData.tasks[parentTaskIndex], dateStr); // Générer le LI complet de la tâche parente
             parentTaskListUl.replaceChild(tempLi.firstChild, parentTaskElement); // Remplacer l'ancien LI par le nouveau
        } else {
             refreshPlannerView(); // Fallback: re-rendre tout
        }
    } catch (error) {
        console.error("Erreur sauvegarde sous-tâche:", error);
        alert("Erreur enregistrement sous-tâche.");
        // Rollback
        currentPlannerData.tasks[parentTaskIndex].subTasks.pop();
    }
}


/** Ajoute un élément LI (tâche ou sous-tâche) à la liste UL. */
function appendTaskToList(listUl, task, dateStr, isSubTask = false) {
    if (!listUl || !task ) return;
    if (listUl.querySelector(`[data-${isSubTask ? 'subtask' : 'task'}-id="${task.id}"]`)) return;

    const li = document.createElement('li');
    li.className = isSubTask ? `sub-task-item ${task.completed ? 'task-completed' : ''}` : `planner-task-item ${task.completed ? 'task-completed' : ''}`;
    li.dataset[isSubTask ? 'subtaskId' : 'taskId'] = task.id;
    if (isSubTask && task.parentId) li.dataset.parentId = task.parentId; // Stocker l'ID du parent pour une sous-tâche

    let energyInd = '';
    if (!isSubTask && task.energy !== null) { // Indicateur d'énergie seulement pour tâches principales
         const eMap={1:'⚡',2:'⚡⚡',3:'⚡⚡⚡'}; const eTxt={1:'Basse',2:'Moyenne',3:'Haute'};
         if(eMap[task.energy]){ energyInd = `<span class="energy-indicator ${task.energy===1?'low':task.energy===2?'medium':'high'}" title="${eTxt[task.energy]} énergie">${eMap[task.energy]}</span>`; }
    }
    const txt = document.createElement('span'); txt.className = 'task-text'; txt.textContent = task.text || '';
    const checkboxId = `${isSubTask ? 'sub' : ''}planner-task-${task.id}`;

    let subTaskHtml = '';
    if (!isSubTask && Array.isArray(task.subTasks) && task.subTasks.length > 0) {
        subTaskHtml += '<ul class="sub-task-list">';
        task.subTasks.forEach(st => {
            const subLabel = document.createElement('label'); subLabel.htmlFor = `subplanner-task-${st.id}`; subLabel.className = 'visually-hidden'; subLabel.textContent = `Marquer "${st.text}"`;
            const subTxt = document.createElement('span'); subTxt.className = 'task-text'; subTxt.textContent = st.text || '';
            subTaskHtml += `<li class="sub-task-item ${st.completed ? 'task-completed' : ''}" data-subtask-id="${st.id}" data-parent-id="${task.id}">
                                <input type="checkbox" id="subplanner-task-${st.id}" class="task-checkbox" ${st.completed?'checked':''}>
                                ${subLabel.outerHTML}
                                ${subTxt.outerHTML}
                                <button class="delete-task-btn button-delete" title="Supprimer sous-tâche" aria-label="Supprimer sous-tâche: ${st.text||'sous-tâche'}">🗑️</button>
                            </li>`;
        });
        subTaskHtml += '</ul>';
    }

    let addSubTaskButtonHtml = '';
    if (!isSubTask) { // Bouton ajouter sous-tâche seulement pour les tâches principales
        addSubTaskButtonHtml = `<button class="add-subtask-btn button-secondary" title="Ajouter une sous-tâche" aria-label="Ajouter une sous-tâche à ${task.text || 'tâche'}">+</button>`;
    }


    li.innerHTML = `
        <div class="task-main-line">
            <input type="checkbox" id="${checkboxId}" class="task-checkbox" ${task.completed?'checked':''}>
            <label for="${checkboxId}" class="visually-hidden">Marquer "${txt.textContent}"</label>
            ${txt.outerHTML}
            ${energyInd}
            ${addSubTaskButtonHtml}
            <button class="delete-task-btn button-delete" title="Supprimer" aria-label="Supprimer: ${txt.textContent}">🗑️</button>
        </div>
        ${subTaskHtml}
    `;

    const cb = li.querySelector(`#${checkboxId}.task-checkbox`);
    const del = li.querySelector('.delete-task-btn'); // Bouton supprimer tâche principale
    const addSubBtn = li.querySelector('.add-subtask-btn');

    if(cb) { cb.addEventListener('change', (e) => updateTaskCompletedStatus(task.id, e.target.checked, dateStr, isSubTask ? task.parentId : null)); }
    if(del) { del.addEventListener('click', () => { if(confirm(`Supprimer "${txt.textContent}" ?`)) deleteTask(task.id, dateStr, isSubTask ? task.parentId : null ); }); }
    if(addSubBtn) { addSubBtn.addEventListener('click', (e) => { e.stopPropagation(); addSubTask(task.id, dateStr); }); }

    // Ajouter listeners pour les sous-tâches si elles existent (délégation d'événement sur le LI parent)
    if (!isSubTask && subTaskHtml) {
        const subTaskList = li.querySelector('.sub-task-list');
        if(subTaskList) {
            subTaskList.addEventListener('change', (event) => {
                 if(event.target.matches('.task-checkbox')) {
                      const subLi = event.target.closest('.sub-task-item');
                      const subTaskId = Number.parseInt(subLi?.dataset.subtaskId, 10);
                      if (!isNaN(subTaskId)) updateTaskCompletedStatus(task.id, event.target.checked, dateStr, subTaskId);
                 }
            });
            subTaskList.addEventListener('click', (event) => {
                 if(event.target.matches('.delete-task-btn')) {
                      const subLi = event.target.closest('.sub-task-item');
                      const subTaskId = Number.parseInt(subLi?.dataset.subtaskId, 10);
                      const subTaskText = subLi.querySelector('.task-text')?.textContent || 'cette sous-tâche';
                      if (!isNaN(subTaskId) && confirm(`Supprimer "${subTaskText}" ?`)) deleteTask(task.id, dateStr, subTaskId);
                 }
            });
        }
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
        let formattedDate = 'Date'; try { formattedDate = new Date(currentDateStr + 'T00:00:00Z').toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }); } catch(e){}

        contentWrapper.innerHTML = `
            <h3>Mon Plan Doux du ${formattedDate}</h3>
            <div class="planner-add-task">
                 <label for="newTaskInput" class="visually-hidden">Nouvelle tâche:</label>
                 <input type="text" id="newTaskInput" placeholder="Nouvelle intention principale..." maxlength="150">
                 <div class="energy-selector" role="group" aria-labelledby="energy-label-planner"><span id="energy-label-planner" class="visually-hidden">Énergie:</span>Énergie :<button data-energy="1" title="Basse" aria-label="Basse">⚡</button><button data-energy="2" title="Moyenne" aria-label="Moyenne">⚡⚡</button><button data-energy="3" title="Haute" aria-label="Haute">⚡⚡⚡</button><button data-energy="null" title="Effacer" aria-label="Non définie">❓</button></div>
                 <button id="addTaskBtn" class="button-primary" disabled>Ajouter Tâche</button>
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
