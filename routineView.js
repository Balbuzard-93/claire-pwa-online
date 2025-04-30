// routineView.js (Version Corrigée - Date définie avant accès IDB)
import { getRoutineForDate, saveRoutineForDate, getCurrentDateString } from './storageUtils.js';

const MAX_TASKS = 3;
let currentRoutineData = null;
let todayString = ''; // Sera définie dans init et refresh
const CONTENT_WRAPPER_ID = 'routine-content-wrapper';

/** Sauvegarde la tâche mise à jour dans IndexedDB et met à jour l'UI. */
async function updateTaskStatus(taskId, isCompleted, dateStr) {
    if (!currentRoutineData || !Array.isArray(currentRoutineData.tasks)) return;
    const taskIndex = currentRoutineData.tasks.findIndex(task => task.id === taskId);
    if (taskIndex === -1) return;
    currentRoutineData.tasks[taskIndex].completed = isCompleted;

    const taskElement = document.querySelector(`#${CONTENT_WRAPPER_ID} .task-list-item[data-task-id="${taskId}"]`);
    if (taskElement) {
        taskElement.classList.toggle('task-completed', isCompleted);
        const checkbox = taskElement.querySelector('.task-checkbox');
        if(checkbox) checkbox.checked = isCompleted;
    }

    try { await saveRoutineForDate(dateStr, currentRoutineData); }
    catch(error) { console.error("Erreur sauvegarde routine après MAJ statut:", error); alert("Erreur sauvegarde état tâche."); /* Gérer rollback UI si nécessaire */ }
}

/** Ajoute un élément LI à la liste UL. */
function appendTaskToList(listUl, task, dateStr) {
    if (listUl.querySelector(`[data-task-id="${task.id}"]`)) return;
    const li = document.createElement('li');
    li.className = `task-list-item ${task.completed ? 'task-completed' : ''}`;
    li.dataset.taskId = task.id;
    const label = document.createElement('label');
    label.htmlFor = `routine-task-${task.id}`;
    label.className = 'task-text';
    label.textContent = task.text || '';
    li.innerHTML = `<input type="checkbox" id="routine-task-${task.id}" class="task-checkbox" ${task.completed ? 'checked' : ''}> ${label.outerHTML}`;
    const checkbox = li.querySelector('.task-checkbox');
    const addedLabel = li.querySelector('.task-text');
    if (checkbox) { checkbox.addEventListener('change', (event) => updateTaskStatus(task.id, event.target.checked, dateStr)); }
    if (addedLabel) { addedLabel.addEventListener('click', () => { if(checkbox) { checkbox.checked = !checkbox.checked; checkbox.dispatchEvent(new Event('change', { bubbles: true })); } }); }
    listUl.appendChild(li);
}

/** Affiche la liste des tâches définies. */
function renderTaskList(container, dateStr, routineData) {
    currentRoutineData = routineData;
    let tasksHtml = '<ul class="task-list" id="routineTaskList">'; // ID spécifique
    routineData.tasks.forEach((task) => { /* Génération HTML comme avant */ });
    tasksHtml += '</ul>';
    let formattedDate = 'Date'; try { formattedDate = new Date(dateStr + 'T00:00:00Z').toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' }); } catch(e){}
    container.innerHTML = `<h3>Routine du ${formattedDate}</h3>${tasksHtml}<button id="editRoutineBtn" class="edit-routine-button button-secondary">Modifier la routine</button>`;
    const taskListUl = container.querySelector('#routineTaskList');
    if (taskListUl) {
        // Réattacher les listeners après innerHTML (Important!)
         routineData.tasks.forEach(task => {
             const li = taskListUl.querySelector(`.task-list-item[data-task-id="${task.id}"]`);
             if (li) {
                 const checkbox = li.querySelector('.task-checkbox');
                 const label = li.querySelector('.task-text');
                 if(checkbox) checkbox.addEventListener('change', (event) => updateTaskStatus(task.id, event.target.checked, dateStr));
                 if(label) label.addEventListener('click', () => { if(checkbox) { checkbox.checked = !checkbox.checked; checkbox.dispatchEvent(new Event('change', { bubbles: true })); } });
             }
         });
    }
    const editBtn = container.querySelector('#editRoutineBtn');
    // Passer container (le wrapper) à la fonction de rendu du formulaire
    if (editBtn) { editBtn.addEventListener('click', async () => { if (confirm("Effacer et redéfinir ?")) { try { await saveRoutineForDate(dateStr, null); currentRoutineData = null; renderInputForm(container, dateStr); } catch (e) { alert("Erreur réinit."); } } }); }
}

/** Affiche le formulaire pour définir la routine. */
function renderInputForm(container, dateStr) {
    currentRoutineData = null;
    let inputsHtml = '';
    for (let i = 0; i < MAX_TASKS; i++) { inputsHtml += `<div class="input-group"><label for="routine-task-input-${i}" class="visually-hidden">Tâche ${i + 1}</label><input type="text" id="routine-task-input-${i}" class="task-input" placeholder="Tâche ${i + 1} (optionnel)" maxlength="100"></div>`; }
    container.innerHTML = `<h3>Définir la Routine du Jour</h3><p>Entrez 1 à ${MAX_TASKS} tâches.</p><div class="routine-input-form">${inputsHtml}<button id="addRoutineTaskBtn" class="button-primary">Enregistrer</button></div>`; // ID bouton spécifique
    const saveBtn = container.querySelector('#addRoutineTaskBtn');
    const inputs = container.querySelectorAll('.task-input');
    if (inputs.length > 0) { inputs[inputs.length - 1].addEventListener('keydown', (event) => { if (event.key === 'Enter' && saveBtn) saveBtn.click(); }); }
    if (saveBtn) { saveBtn.addEventListener('click', async () => { await saveNewRoutine(dateStr, container, inputs); }); } // Appeler une fonction async dédiée
}

/** Sauvegarde la nouvelle routine définie dans le formulaire */
async function saveNewRoutine(dateStr, formContainer, inputs) {
     const tasks = [];
     inputs.forEach((input, index) => { const text = input.value.trim(); if (text) tasks.push({ id: index, text: text, completed: false }); });
     if (tasks.length === 0) { alert("Entrez au moins une tâche."); return; }
     if (tasks.length > MAX_TASKS) { alert(`Maximum ${MAX_TASKS} tâches.`); return; }
     const newRoutineData = { tasks: tasks };
     try {
          await saveRoutineForDate(dateStr, newRoutineData);
          renderTaskList(formContainer, dateStr, newRoutineData); // Afficher la liste dans le même conteneur
     } catch (error) { console.error("Erreur sauvegarde routine:", error); alert("Erreur enregistrement routine."); }
}

/** Fonction principale de rendu : charge les données et appelle le rendu approprié. */
async function renderRoutineContent(contentWrapper, dateStr) { // Renommée pour clarté, reçoit date
    if (!contentWrapper) { console.error("Wrapper routine invalide."); return; }
    contentWrapper.innerHTML = '<p>Chargement...</p>';
    try {
        const routineData = await getRoutineForDate(dateStr);
        contentWrapper.innerHTML = ''; // Vider après chargement
        const dataToRender = (routineData && Array.isArray(routineData.tasks)) ? routineData : { tasks: [] };
        if (dataToRender.tasks.length > 0) { renderTaskList(contentWrapper, dateStr, dataToRender); }
        else { renderInputForm(contentWrapper, dateStr); }
    } catch (error) { console.error("Erreur chargement/rendu routine:", error); contentWrapper.innerHTML = '<p>Erreur chargement routine.</p>'; currentRoutineData = null; }
}

/** Fonction de rafraîchissement exportée. */
export async function refreshRoutineView() {
    const mainContainer = document.getElementById('routineView');
    const contentWrapper = mainContainer ? mainContainer.querySelector(`#${CONTENT_WRAPPER_ID}`) : null;
    if (contentWrapper) {
        todayString = getCurrentDateString(); // Assurer que la date est à jour
        await renderRoutineContent(contentWrapper, todayString); // Appeler render sur wrapper avec date
    } else { console.error("Échec refresh routine: Wrapper introuvable."); }
}

/** Initialise la vue Routine. */
export function initRoutineView(containerElement) {
    if (!containerElement) { console.error("Conteneur Routine introuvable."); return; }
    let contentWrapper = containerElement.querySelector(`#${CONTENT_WRAPPER_ID}`);
    if (!contentWrapper) { containerElement.innerHTML = `<h2>Routine Quotidienne</h2><div id="${CONTENT_WRAPPER_ID}"><p>Chargement...</p></div>`; contentWrapper = containerElement.querySelector(`#${CONTENT_WRAPPER_ID}`); }
    else { contentWrapper.innerHTML = '<p>Chargement...</p>'; } // Afficher chargement si déjà initialisé

    if (contentWrapper) {
         todayString = getCurrentDateString(); // Définir la date ici aussi
         renderRoutineContent(contentWrapper, todayString).catch(err => { console.error("Erreur init routine:", err); if(contentWrapper) contentWrapper.innerHTML = "<p>Erreur chargement initial.</p>"; });
    } else { console.error("Impossible créer/trouver wrapper routine init."); }
}
