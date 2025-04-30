// routineView.js (Version Corrigée v3 - Date check + Init robuste)
import { getRoutineForDate, saveRoutineForDate, getCurrentDateString } from './storageUtils.js';

const MAX_TASKS = 3;
let currentRoutineData = null; // Garde en mémoire les données du jour chargées
const CONTENT_WRAPPER_ID = 'routine-content-wrapper';

/** Sauvegarde état tâche */
async function updateTaskStatus(taskId, isCompleted, dateStr) {
    if (!currentRoutineData || !Array.isArray(currentRoutineData.tasks) || !dateStr) return;
    const taskIndex = currentRoutineData.tasks.findIndex(task => task.id === taskId);
    if (taskIndex === -1) return;
    const originalState = currentRoutineData.tasks[taskIndex].completed;
    currentRoutineData.tasks[taskIndex].completed = isCompleted;
    const taskElement = document.querySelector(`#${CONTENT_WRAPPER_ID} .task-list-item[data-task-id="${taskId}"]`);
    if (taskElement) taskElement.classList.toggle('task-completed', isCompleted);
    try { await saveRoutineForDate(dateStr, currentRoutineData); }
    catch(error) { console.error("Err sauvegarde routine status:", error); alert("Err sauvegarde tâche."); currentRoutineData.tasks[taskIndex].completed = originalState; if (taskElement) taskElement.classList.toggle('task-completed', originalState); const cb = taskElement.querySelector('.task-checkbox'); if(cb) cb.checked = originalState;}
}

/** Ajoute LI à UL */
function appendTaskToList(listUl, task, dateStr) {
    if (!listUl || !task || listUl.querySelector(`[data-task-id="${task.id}"]`)) return;
    const li = document.createElement('li'); li.className = `task-list-item ${task.completed ? 'task-completed' : ''}`; li.dataset.taskId = task.id;
    const label = document.createElement('label'); label.htmlFor = `routine-task-${task.id}`; label.className = 'task-text'; label.textContent = task.text || '';
    li.innerHTML = `<input type="checkbox" id="routine-task-${task.id}" class="task-checkbox" ${task.completed?'checked':''}> ${label.outerHTML}`;
    const cb = li.querySelector('.task-checkbox'); const lbl = li.querySelector('.task-text');
    if(cb) { cb.addEventListener('change', (e) => updateTaskStatus(task.id, e.target.checked, dateStr)); }
    if(lbl) { lbl.addEventListener('click', () => { if(cb) { cb.checked = !cb.checked; cb.dispatchEvent(new Event('change', { bubbles: true })); } }); }
    listUl.appendChild(li);
}

/** Affiche la liste des tâches */
function renderTaskList(container, dateStr, routineData) {
    currentRoutineData = routineData;
    let tasksHtml = '<ul class="task-list" id="routineTaskList">'; routineData.tasks.forEach(t => {/*...*/}); tasksHtml += '</ul>'; // Génération LIs inchangée
        routineData.tasks.forEach((task) => {
            const label = document.createElement('label'); label.htmlFor = `routine-task-${task.id}`; label.className = 'task-text'; label.textContent = task.text || '';
            tasksHtml += `<li class="task-list-item ${task.completed ? 'task-completed' : ''}" data-task-id="${task.id}"><input type="checkbox" id="routine-task-${task.id}" class="task-checkbox" ${task.completed ? 'checked' : ''}>${label.outerHTML}</li>`;
        });
        tasksHtml += '</ul>';

    let formattedDate = 'Date'; try { formattedDate = new Date(dateStr + 'T00:00:00Z').toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' }); } catch(e){}
    container.innerHTML = `<h3>Routine du ${formattedDate}</h3>${tasksHtml}<button id="editRoutineBtn" class="edit-routine-button button-secondary">Modifier</button>`;
    const taskListUl = container.querySelector('#routineTaskList');
    if (taskListUl) { // Réattacher listeners aux LIs nouvellement créés
         taskListUl.querySelectorAll('.task-list-item').forEach(li => {
              const taskId = Number.parseInt(li.dataset.taskId, 10);
              if (!isNaN(taskId)) {
                   const checkbox = li.querySelector('.task-checkbox');
                   const label = li.querySelector('.task-text');
                   if(checkbox) checkbox.addEventListener('change', (e) => updateTaskStatus(taskId, e.target.checked, dateStr));
                   if(label && checkbox) label.addEventListener('click', () => { checkbox.checked = !checkbox.checked; checkbox.dispatchEvent(new Event('change', { bubbles: true })); });
              }
         });
    }
    const editBtn = container.querySelector('#editRoutineBtn');
    if (editBtn) { editBtn.addEventListener('click', async () => { if (confirm("Effacer et redéfinir ?")) { try { await saveRoutineForDate(dateStr, null); currentRoutineData = null; renderInputForm(container, dateStr); } catch (e) { alert("Erreur réinit."); } } }); }
}

/** Affiche le formulaire */
function renderInputForm(container, dateStr) {
    currentRoutineData = null; let inputsHtml = '';
    for (let i = 0; i < MAX_TASKS; i++) { inputsHtml += `<div class="input-group"><label for="routine-task-input-${i}" class="visually-hidden">Tâche ${i+1}</label><input type="text" id="routine-task-input-${i}" class="task-input" placeholder="Tâche ${i+1} (opt)" maxlength="100"></div>`; }
    container.innerHTML = `<h3>Définir la Routine</h3><p>Entrez 1-${MAX_TASKS} tâches.</p><div class="routine-input-form">${inputsHtml}<button id="addRoutineTaskBtn" class="button-primary">Enregistrer</button></div>`;
    const saveBtn = container.querySelector('#addRoutineTaskBtn'); const inputs = container.querySelectorAll('.task-input');
    if (inputs.length > 0) { inputs[inputs.length - 1].addEventListener('keydown', (e) => { if (e.key==='Enter' && saveBtn) saveBtn.click(); }); }
    if (saveBtn) { saveBtn.addEventListener('click', async () => { await saveNewRoutine(dateStr, container, inputs); }); }
}

/** Sauvegarde nouvelle routine */
async function saveNewRoutine(dateStr, formContainer, inputs) {
     const tasks = []; inputs.forEach((input, index) => { const text = input.value.trim(); if (text) tasks.push({ id: index, text: text, completed: false }); });
     if (tasks.length === 0 || tasks.length > MAX_TASKS) { alert(tasks.length === 0 ? "Entrez une tâche." : `Max ${MAX_TASKS} tâches.`); return; }
     try { await saveRoutineForDate(dateStr, { tasks: tasks }); renderTaskList(formContainer, dateStr, { tasks: tasks }); }
     catch (error) { console.error("Err save routine:", error); alert("Err enregistrement."); }
}

/** Fonction principale de rendu. Charge données et appelle le rendu approprié. */
async function renderRoutineContent(contentWrapper) {
    if (!contentWrapper) { console.error("renderRoutineContent: wrapper invalide"); return; }
    const currentDateStr = getCurrentDateString(); // *** Obtenir date ICI ***
    // console.log(`Routine LOG: Tentative chargement pour date: [${currentDateStr}]`);
    contentWrapper.innerHTML = '<p>Chargement...</p>';
    if (!currentDateStr) { // Sécurité additionnelle
         contentWrapper.innerHTML = '<p>Erreur: Date invalide.</p>'; return;
    }
    try {
        const routineData = await getRoutineForDate(currentDateStr);
        contentWrapper.innerHTML = '';
        const dataToRender = (routineData && Array.isArray(routineData.tasks)) ? routineData : { tasks: [] };
        if (dataToRender.tasks.length > 0) { renderTaskList(contentWrapper, currentDateStr, dataToRender); }
        else { renderInputForm(contentWrapper, currentDateStr); }
    } catch (error) { console.error("Erreur chargement/rendu routine:", error); contentWrapper.innerHTML = '<p>Erreur chargement routine.</p>'; currentRoutineData = null; }
}

/** Fonction de rafraîchissement. */
export async function refreshRoutineView() {
    const mainContainer = document.getElementById('routineView');
    const contentWrapper = mainContainer ? mainContainer.querySelector(`#${CONTENT_WRAPPER_ID}`) : null;
    if (contentWrapper) { await renderRoutineContent(contentWrapper); }
    else { console.error("Échec refresh routine: Wrapper introuvable."); }
}
/** Initialise la vue. */
export function initRoutineView(containerElement) {
    if (!containerElement) { console.error("Conteneur Routine introuvable."); return; }
    let contentWrapper = containerElement.querySelector(`#${CONTENT_WRAPPER_ID}`);
    if (!contentWrapper) { containerElement.innerHTML = `<h2>Routine Quotidienne</h2><div id="${CONTENT_WRAPPER_ID}"><p>Chargement...</p></div>`; contentWrapper = containerElement.querySelector(`#${CONTENT_WRAPPER_ID}`); }
    else { contentWrapper.innerHTML = '<p>Chargement...</p>'; }
    if (contentWrapper) { renderRoutineContent(contentWrapper).catch(err => { console.error("Erreur init routine:", err); if(contentWrapper) contentWrapper.innerHTML = "<p>Erreur chargement.</p>"; }); }
    else { console.error("Impossible créer/trouver wrapper routine init."); }
}
