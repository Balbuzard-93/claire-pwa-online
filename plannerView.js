// plannerView.js (Version Corrigée v2 - Vérification Date Stricte)
import { getPlannerForDate, savePlannerForDate, getCurrentDateString } from './storageUtils.js';

let currentPlannerData = { tasks: [] };
let selectedEnergy = null;
// let todayString = ''; // Ne pas utiliser de globale pour la date ici
const CONTENT_WRAPPER_ID = 'planner-content-wrapper';

/** Met à jour statut tâche */
async function updateTaskCompletedStatus(taskId, isCompleted, dateStr) { // Reçoit date
    if (!currentPlannerData || !Array.isArray(currentPlannerData.tasks)) return;
    const taskIndex = currentPlannerData.tasks.findIndex(task => task.id === taskId);
    if (taskIndex === -1) return;
    currentPlannerData.tasks[taskIndex].completed = isCompleted;
    const taskElement = document.querySelector(`#${CONTENT_WRAPPER_ID} .planner-task-item[data-task-id="${taskId}"]`);
    if (taskElement) taskElement.classList.toggle('task-completed', isCompleted);
    try { await savePlannerForDate(dateStr, currentPlannerData); } // Utilise date reçue
    catch(error) { console.error("Erreur sauvegarde plan status:", error); alert("Err sauvegarde tâche."); /* Rollback? */ }
}

/** Supprime tâche */
async function deleteTask(taskId, dateStr) { // Reçoit date
    if (!currentPlannerData || !Array.isArray(currentPlannerData.tasks)) return;
    currentPlannerData.tasks = currentPlannerData.tasks.filter(task => task.id !== taskId);
    const taskElement = document.querySelector(`#${CONTENT_WRAPPER_ID} .planner-task-item[data-task-id="${taskId}"]`);
    if (taskElement) taskElement.remove();
    try { await savePlannerForDate(dateStr, currentPlannerData); const ul=document.getElementById('plannerTaskList'); if(ul&¤tPlannerData.tasks.length===0) ul.innerHTML='<p class="no-tasks-message">Aucune tâche.</p>'; } // Utilise date reçue
    catch(error) { console.error("Erreur sauvegarde plan suppression:", error); alert("Err suppression tâche."); refreshPlannerView(); /* Force refresh */ }
}

/** Ajoute tâche */
async function addTask(dateStr) { // Reçoit date
    const inputElement = document.getElementById('newTaskInput'); if(!inputElement) return;
    const text = inputElement.value.trim(); if (!text) { alert("Entrez le texte."); return; }
    const newTask = { id: Date.now(), text: text, energy: selectedEnergy, completed: false };
    if (!Array.isArray(currentPlannerData.tasks)) { currentPlannerData.tasks = []; }
    currentPlannerData.tasks.push(newTask);
    try {
        await savePlannerForDate(dateStr, currentPlannerData); // Utilise date reçue
        inputElement.value = ''; selectedEnergy = null; document.querySelectorAll('.energy-selector button.selected').forEach(b=>b.classList.remove('selected')); const addBtn=document.getElementById('addTaskBtn'); if(addBtn) addBtn.disabled=true;
        const taskListUl = document.getElementById('plannerTaskList');
        if (taskListUl) { const noMsg=taskListUl.querySelector('.no-tasks-message'); if(noMsg) noMsg.remove(); appendTaskToList(taskListUl, newTask, dateStr); } // Passe date
        else { refreshPlannerView(); }
    } catch (error) { console.error("Err sauvegarde tâche plan:", error); alert("Err enregistrement tâche."); currentPlannerData.tasks.pop(); }
}

/** Ajoute LI à UL */
function appendTaskToList(listUl, task, dateStr) { // Reçoit date
    if (listUl.querySelector(`[data-task-id="${task.id}"]`)) return;
    const li = document.createElement('li'); li.className = `planner-task-item ${task.completed ? 'task-completed' : ''}`; li.dataset.taskId = task.id;
    let energyInd = ''; const eMap={1:'⚡',2:'⚡⚡',3:'⚡⚡⚡'}; const eText={1:'Basse',2:'Moyenne',3:'Haute'}; if(task.energy!==null && eMap[task.energy]){ energyInd = `<span class="energy-indicator ${task.energy===1?'low':task.energy===2?'medium':'high'}" title="${eText[task.energy]} énergie">${eMap[task.energy]}</span>`; }
    const txt = document.createElement('span'); txt.className = 'task-text'; txt.textContent = task.text || '';
    li.innerHTML = `<input type="checkbox" id="planner-task-${task.id}" class="task-checkbox" ${task.completed?'checked':''}> <label for="planner-task-${task.id}" class="visually-hidden">Marquer "${txt.textContent}"</label> ${txt.outerHTML} ${energyInd} <button class="delete-task-btn button-delete" title="Supprimer" aria-label="Supprimer: ${txt.textContent}">🗑️</button>`;
    const cb = li.querySelector('.task-checkbox'); const del = li.querySelector('.delete-task-btn');
    if(cb) { cb.addEventListener('change', (e) => updateTaskCompletedStatus(task.id, e.target.checked, dateStr)); } // Passe date
    if(del) { del.addEventListener('click', () => { if(confirm(`Supprimer "${txt.textContent}" ?`)) deleteTask(task.id, dateStr); }); } // Passe date
    listUl.appendChild(li);
}

/** Fonction principale de rendu. */
async function renderPlannerContent(contentWrapper) { // Reçoit wrapper
    if (!contentWrapper) { console.error("renderPlannerContent: wrapper invalide"); return; }
    const currentDateStr = getCurrentDateString(); // *** Obtenir date ICI ***
    contentWrapper.innerHTML = '<p>Chargement...</p>';

    try {
        const loadedData = await getPlannerForDate(currentDateStr); // *** Utilise date obtenue ***
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
        if (taskListUl && currentPlannerData.tasks.length > 0) { currentPlannerData.tasks.forEach(task => appendTaskToList(taskListUl, task, currentDateStr)); } // Passe date
        else if (taskListUl) { taskListUl.innerHTML = '<p class="no-tasks-message">Aucune tâche planifiée.</p>'; }

        const newTaskInput = contentWrapper.querySelector('#newTaskInput'); const addBtn = contentWrapper.querySelector('#addTaskBtn'); const energyBtns = contentWrapper.querySelectorAll('.energy-selector button');
        if(newTaskInput && addBtn) { newTaskInput.addEventListener('input', () => { addBtn.disabled = newTaskInput.value.trim() === ''; }); newTaskInput.addEventListener('keydown', (e) => { if(e.key==='Enter' && !addBtn.disabled) addTask(currentDateStr); }); } // Passe date
        energyBtns.forEach(b => { b.addEventListener('click', () => { const cs = contentWrapper.querySelector('.energy-selector button.selected'); if(cs===b&&b.dataset.energy!=='null'){ b.classList.remove('selected'); selectedEnergy=null; } else if(cs!==b){ if(cs) cs.classList.remove('selected'); b.classList.add('selected'); const v=b.dataset.energy; selectedEnergy=(v==='null')?null:parseInt(v,10); } }); });
        if(addBtn) { addBtn.addEventListener('click', () => addTask(currentDateStr)); } // Passe date

    } catch (error) { console.error("Erreur chargement/rendu planificateur:", error); contentWrapper.innerHTML = '<p>Erreur chargement plan.</p>'; currentPlannerData = { tasks: [] }; }
}

/** Fonction de rafraîchissement exportée. */
export async function refreshPlannerView() {
    const mainContainer = document.getElementById('plannerView');
    const contentWrapper = mainContainer ? mainContainer.querySelector(`#${CONTENT_WRAPPER_ID}`) : null;
    if (contentWrapper) { await renderPlannerContent(contentWrapper); } // Appel async
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
