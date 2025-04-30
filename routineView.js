// routineView.js (REVISED - Try this version)
import { getRoutineForDate, saveRoutineForDate, getCurrentDateString } from './storageUtils.js';

const MAX_TASKS = 3;
let currentRoutineData = null;
let todayString = '';
const CONTENT_WRAPPER_ID = 'routine-content-wrapper'; // ID du wrapper interne

// --- Fonctions updateTaskStatus, deleteTask, addTask, appendTaskToList (Identiques à la version précédente) ---
// ... (Collez ici les 4 fonctions: updateTaskStatus, deleteTask, addTask, appendTaskToList de la version précédente) ...
/** Sauvegarde la tâche mise à jour et met à jour l'UI. */
function updateTaskStatus(taskId, isCompleted, dateStr) {
    if (!currentRoutineData || !Array.isArray(currentRoutineData.tasks)) return;
    const taskIndex = currentRoutineData.tasks.findIndex(task => task.id === taskId);
    if (taskIndex === -1) return;
    currentRoutineData.tasks[taskIndex].completed = isCompleted;
    const taskElement = document.querySelector(`#${CONTENT_WRAPPER_ID} .task-list-item[data-task-id="${taskId}"]`);
    if (taskElement) taskElement.classList.toggle('task-completed', isCompleted);
    saveRoutineForDate(dateStr, currentRoutineData);
}

/** Supprime une tâche. */
function deleteTask(taskId, dateStr) {
    if (!currentRoutineData || !Array.isArray(currentRoutineData.tasks)) return;
    currentRoutineData.tasks = currentRoutineData.tasks.filter(task => task.id !== taskId);
    const taskElement = document.querySelector(`#${CONTENT_WRAPPER_ID} .task-list-item[data-task-id="${taskId}"]`);
    if (taskElement) taskElement.remove();
    saveRoutineForDate(dateStr, currentRoutineData);
    const taskListUl = document.getElementById('routineTaskList');
    if (taskListUl && currentRoutineData.tasks.length === 0) {
        taskListUl.innerHTML = '<p class="no-tasks-message">Aucune tâche définie pour aujourd\'hui.</p>';
    }
}

/** Ajoute une nouvelle tâche. */
function addTask(dateStr) {
    const inputElement = document.getElementById('newRoutineTaskInput');
    if(!inputElement) return;
    const text = inputElement.value.trim();
    if (!text) { alert("Veuillez entrer le texte de la tâche."); return; }
    const newTask = { id: Date.now(), text: text, completed: false };
    if (!Array.isArray(currentRoutineData.tasks)) { currentRoutineData.tasks = []; }
    currentRoutineData.tasks.push(newTask);

    if (saveRoutineForDate(dateStr, currentRoutineData)) {
        inputElement.value = '';
        const addBtn = document.getElementById('addRoutineTaskBtn');
        if(addBtn) addBtn.disabled = true;
        const taskListUl = document.getElementById('routineTaskList');
        if (taskListUl) {
             const noTaskMsg = taskListUl.querySelector('.no-tasks-message');
             if(noTaskMsg) noTaskMsg.remove();
             appendTaskToList(taskListUl, newTask, dateStr);
        } else {
             refreshRoutineView(); // Re-render via refresh
        }
    }
}

/** Ajoute un élément LI à la liste UL. */
function appendTaskToList(listUl, task, dateStr) {
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
    if(addedLabel) { addedLabel.addEventListener('click', () => { if(checkbox) { checkbox.checked = !checkbox.checked; checkbox.dispatchEvent(new Event('change', { bubbles: true })); } }); }
    listUl.appendChild(li);
}


/** Affiche la liste des tâches définies. */
function renderTaskList(container, dateStr, routineData) {
    currentRoutineData = routineData;
    let tasksHtml = '<ul class="task-list" id="routineTaskList">';
    routineData.tasks.forEach((task) => {
        const label = document.createElement('label'); label.htmlFor = `routine-task-${task.id}`; label.className = 'task-text'; label.textContent = task.text || '';
        tasksHtml += `<li class="task-list-item ${task.completed ? 'task-completed' : ''}" data-task-id="${task.id}"><input type="checkbox" id="routine-task-${task.id}" class="task-checkbox" ${task.completed ? 'checked' : ''}>${label.outerHTML}</li>`;
    });
    tasksHtml += '</ul>';
    let formattedDate = 'Date'; try { formattedDate = new Date(dateStr + 'T00:00:00Z').toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' }); } catch(e){}
    container.innerHTML = `<h3>Routine du ${formattedDate}</h3>${tasksHtml}<button id="editRoutineBtn" class="edit-routine-button button-secondary">Modifier la routine</button>`;

    const taskListUl = container.querySelector('#routineTaskList');
    if (taskListUl) {
        // Setup listeners (using delegation is generally better but direct is fine here)
         taskListUl.querySelectorAll('.task-checkbox').forEach(cb => {
              const li = cb.closest('.task-list-item');
              const taskId = Number.parseInt(li?.dataset.taskId, 10);
              if(!isNaN(taskId)){
                   cb.addEventListener('change', (event) => updateTaskStatus(taskId, event.target.checked, dateStr));
              }
         });
          taskListUl.querySelectorAll('.task-text').forEach(lbl => {
               const checkboxId = lbl.getAttribute('for');
               const checkbox = document.getElementById(checkboxId);
               if(checkbox) {
                    lbl.addEventListener('click', () => { checkbox.checked = !checkbox.checked; checkbox.dispatchEvent(new Event('change', { bubbles: true })); });
               }
          });
    }

    const editBtn = container.querySelector('#editRoutineBtn');
    // Pass the container (wrapper) to renderRoutineView on edit
    if (editBtn) { editBtn.addEventListener('click', () => { if (confirm("Effacer et redéfinir la routine du jour ?")) { saveRoutineForDate(dateStr, null); currentRoutineData = null; renderRoutineView(container); } }); }
}

/** Affiche le formulaire pour définir la routine. */
function renderInputForm(container, dateStr) {
    currentRoutineData = null;
    let inputsHtml = '';
    for (let i = 0; i < MAX_TASKS; i++) {
        inputsHtml += `<div class="input-group"><label for="routine-task-input-${i}" class="visually-hidden">Tâche ${i + 1}</label><input type="text" id="routine-task-input-${i}" class="task-input" placeholder="Tâche ${i + 1} (optionnel)" maxlength="100"></div>`;
    }
    container.innerHTML = `<h3>Définir la Routine du Jour</h3><p>Entrez 1 à ${MAX_TASKS} tâches simples.</p><div class="routine-input-form">${inputsHtml}<button id="addRoutineTaskBtn" class="button-primary">Enregistrer la Routine</button></div>`;

    const saveBtn = container.querySelector('#addRoutineTaskBtn');
    const inputs = container.querySelectorAll('.task-input');
     if (inputs.length > 0) { inputs[inputs.length - 1].addEventListener('keydown', (event) => { if (event.key === 'Enter' && saveBtn) saveBtn.click(); }); }
    if (saveBtn) {
        saveBtn.addEventListener('click', () => {
             const tasks = [];
             inputs.forEach((input, index) => { const text = input.value.trim(); if (text) tasks.push({ id: index, text: text, completed: false }); });
             if (tasks.length > 0 && tasks.length <= MAX_TASKS) { if (saveRoutineForDate(dateStr, { tasks: tasks })) renderTaskList(container, dateStr, { tasks: tasks }); } // Re-render same container
             else if (tasks.length > MAX_TASKS) alert(`Maximum ${MAX_TASKS} tâches.`); else alert("Veuillez entrer au moins une tâche.");
        });
    }
}

/**
 * Fonction principale de rendu pour la vue Routine. Assure que le wrapper existe.
 * @param {HTMLElement} mainContainerElement - Le conteneur principal de la vue (#routineView).
 */
function renderRoutineView(mainContainerElement) {
    if (!mainContainerElement) { console.error("Conteneur principal routineView manquant."); return; }

    // Trouver ou créer le wrapper
    let contentWrapper = mainContainerElement.querySelector(`#${CONTENT_WRAPPER_ID}`);
    if (!contentWrapper) {
        // Si le wrapper n'existe pas (ne devrait pas arriver après init),
        // on le crée mais cela peut indiquer un problème ailleurs.
        console.warn("Wrapper routine manquant, tentative de recréation.");
        // Vider le conteneur principal et recréer la structure
        mainContainerElement.innerHTML = `<h2>Routine Quotidienne</h2><div id="${CONTENT_WRAPPER_ID}"></div>`;
        contentWrapper = mainContainerElement.querySelector(`#${CONTENT_WRAPPER_ID}`);
        if(!contentWrapper) { // Si toujours pas trouvé, abandonner
             console.error("Échec CRITIQUE: Impossible de créer/trouver le wrapper routine.");
             return;
        }
    }

    // Maintenant on est sûr que contentWrapper existe
    todayString = getCurrentDateString();
    const routineData = getRoutineForDate(todayString);
    contentWrapper.innerHTML = ''; // Vider le wrapper

    const dataToRender = (routineData && Array.isArray(routineData.tasks)) ? routineData : { tasks: [] };

    if (dataToRender.tasks.length > 0) {
        renderTaskList(contentWrapper, todayString, dataToRender);
    } else {
        renderInputForm(contentWrapper, todayString);
    }
}

/** Fonction de rafraîchissement exportée. */
export function refreshRoutineView() {
    const mainContainer = document.getElementById('routineView');
    if (mainContainer) {
        renderRoutineView(mainContainer); // Appeler render sur le conteneur principal
    } else {
         console.error("Échec refresh routine: Conteneur principal #routineView introuvable.");
    }
}
/** Initialise la vue Routine. */
export function initRoutineView(containerElement) {
    if (!containerElement) { console.error("Conteneur vue Routine introuvable."); return; }
    // S'assurer que le titre et le wrapper existent au début
    if (!containerElement.querySelector('h2')) {
        containerElement.innerHTML = `<h2>Routine Quotidienne</h2><div id="${CONTENT_WRAPPER_ID}"></div>`;
    } else if (!containerElement.querySelector(`#${CONTENT_WRAPPER_ID}`)) {
         // Si le titre existe mais pas le wrapper, ajouter le wrapper
         const wrapper = document.createElement('div');
         wrapper.id = CONTENT_WRAPPER_ID;
         containerElement.appendChild(wrapper);
    }
    // Appeler le rendu sur le conteneur principal, renderRoutineView trouvera/créera le wrapper
    renderRoutineView(containerElement);
}
