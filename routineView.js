// routineView.js
import { getRoutineForDate, saveRoutineForDate, getCurrentDateString } from './storageUtils.js';

const MAX_TASKS = 3;
let currentRoutineData = null; // Garde en mémoire les données du jour
let todayString = ''; // Stocke la date du jour

// --- Fonctions updateTaskStatus, deleteTask, addTask, appendTaskToList (Garder inchangées) ---
// ... (Coller ici les fonctions précédentes) ...
/** Sauvegarde la tâche mise à jour et met à jour l'UI. */
function updateTaskStatus(taskId, isCompleted, dateStr) {
    if (!currentRoutineData || !Array.isArray(currentRoutineData.tasks)) return;
    const taskIndex = currentRoutineData.tasks.findIndex(task => task.id === taskId);
    if (taskIndex === -1) return;
    currentRoutineData.tasks[taskIndex].completed = isCompleted;
    const taskElement = document.querySelector(`#routineView .task-list-item[data-task-id="${taskId}"]`);
    if (taskElement) taskElement.classList.toggle('task-completed', isCompleted);
    saveRoutineForDate(dateStr, currentRoutineData);
}

/** Supprime une tâche. */
function deleteTask(taskId, dateStr) {
    if (!currentRoutineData || !Array.isArray(currentRoutineData.tasks)) return;
    currentRoutineData.tasks = currentRoutineData.tasks.filter(task => task.id !== taskId);
    const taskElement = document.querySelector(`#routineView .planner-task-item[data-task-id="${taskId}"]`); // Note: Correction sélecteur potentiel si classe planner utilisée par erreur
    if (taskElement) taskElement.remove();
    saveRoutineForDate(dateStr, currentRoutineData);
    const taskListUl = document.getElementById('routineTaskList'); // Utiliser ID spécifique
    if (taskListUl && currentRoutineData.tasks.length === 0) {
        taskListUl.innerHTML = '<p class="no-tasks-message">Aucune tâche définie pour aujourd\'hui.</p>';
    }
}

/** Ajoute une nouvelle tâche. */
function addTask(dateStr) {
    const inputElement = document.getElementById('newRoutineTaskInput'); // Utiliser ID spécifique
    if(!inputElement) return;
    const text = inputElement.value.trim();
    if (!text) { alert("Veuillez entrer le texte de la tâche."); return; }

    const newTask = { id: Date.now(), text: text, completed: false }; // Pas d'énergie ici
     if (!Array.isArray(currentRoutineData.tasks)) { currentRoutineData.tasks = []; } // Assurer tableau
    currentRoutineData.tasks.push(newTask);

    if (saveRoutineForDate(dateStr, currentRoutineData)) {
        inputElement.value = '';
        const addBtn = document.getElementById('addRoutineTaskBtn'); // Utiliser ID spécifique
        if(addBtn) addBtn.disabled = true;
        const taskListUl = document.getElementById('routineTaskList'); // Utiliser ID spécifique
        if (taskListUl) {
             const noTaskMsg = taskListUl.querySelector('.no-tasks-message');
             if(noTaskMsg) noTaskMsg.remove();
             appendTaskToList(taskListUl, newTask, dateStr);
        } else {
             renderRoutineView(document.getElementById('routine-content-wrapper')); // Re-render le wrapper
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

    li.innerHTML = `
        <input type="checkbox" id="routine-task-${task.id}" class="task-checkbox" ${task.completed ? 'checked' : ''}>
        ${label.outerHTML}
        <!-- Pas de bouton supprimer ici pour la routine ? Si oui, l'ajouter -->
    `;

    const checkbox = li.querySelector('.task-checkbox');
    if (checkbox) { checkbox.addEventListener('change', (event) => updateTaskStatus(task.id, event.target.checked, dateStr)); }

    // Ajouter listener au label
    const addedLabel = li.querySelector('.task-text');
    if(addedLabel) {
         addedLabel.addEventListener('click', (event) => {
             const checkboxId = event.target.getAttribute('for');
             const targetCheckbox = document.getElementById(checkboxId);
             if(targetCheckbox) { targetCheckbox.checked = !targetCheckbox.checked; targetCheckbox.dispatchEvent(new Event('change', { bubbles: true })); }
         });
    }

    listUl.appendChild(li);
}

/** Affiche la liste des tâches définies. */
function renderTaskList(container, dateStr, routineData) {
    currentRoutineData = routineData;

    // Utiliser un ID spécifique pour la liste de routine
    let tasksHtml = '<ul class="task-list" id="routineTaskList">';
    routineData.tasks.forEach((task) => {
        const label = document.createElement('label');
        label.htmlFor = `routine-task-${task.id}`;
        label.className = 'task-text';
        label.textContent = task.text || '';
        tasksHtml += `<li class="task-list-item ${task.completed ? 'task-completed' : ''}" data-task-id="${task.id}"><input type="checkbox" id="routine-task-${task.id}" class="task-checkbox" ${task.completed ? 'checked' : ''}>${label.outerHTML}</li>`;
    });
    tasksHtml += '</ul>';

    let formattedDate = 'Date';
    try { formattedDate = new Date(dateStr + 'T00:00:00Z').toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' }); } catch(e){}

    container.innerHTML = `<h3>Routine du ${formattedDate}</h3>${tasksHtml}<button id="editRoutineBtn" class="edit-routine-button button-secondary">Modifier la routine</button>`;

    const taskListUl = container.querySelector('#routineTaskList'); // Utiliser nouvel ID
    if (taskListUl) {
        // Délégation unique sur la liste
        taskListUl.addEventListener('change', (event) => { /* ... (même logique qu'avant) ... */ });
        taskListUl.addEventListener('click', (event) => { /* ... (même logique qu'avant) ... */ });
    }

    const editBtn = container.querySelector('#editRoutineBtn');
    if (editBtn) { editBtn.addEventListener('click', () => { if (confirm("Effacer et redéfinir la routine du jour ?")) { saveRoutineForDate(dateStr, null); currentRoutineData = null; renderRoutineView(container); } }); } // Passer le bon conteneur (le wrapper)
}

/** Affiche le formulaire pour définir la routine. */
function renderInputForm(container, dateStr) {
    currentRoutineData = null;
    let inputsHtml = '';
    for (let i = 0; i < MAX_TASKS; i++) {
        inputsHtml += `<div class="input-group">
             <label for="routine-task-input-${i}" class="visually-hidden">Tâche ${i + 1}</label>
             <input type="text" id="routine-task-input-${i}" class="task-input" placeholder="Tâche ${i + 1} (optionnel)" maxlength="100">
        </div>`;
    }
    container.innerHTML = `<h3>Définir la Routine du Jour</h3><p>Entrez 1 à ${MAX_TASKS} tâches simples.</p><div class="routine-input-form">${inputsHtml}<button id="addRoutineTaskBtn" class="button-primary">Enregistrer la Routine</button></div>`; // ID bouton spécifique

    const saveBtn = container.querySelector('#addRoutineTaskBtn'); // Utiliser ID spécifique
    const inputs = container.querySelectorAll('.task-input');

     if (inputs.length > 0) {
          inputs[inputs.length - 1].addEventListener('keydown', (event) => { if (event.key === 'Enter' && saveBtn) saveBtn.click(); });
     }

    if (saveBtn) {
        saveBtn.addEventListener('click', () => {
            const tasks = [];
            inputs.forEach((input, index) => {
                const text = input.value.trim();
                if (text) tasks.push({ id: index, text: text, completed: false });
            });
            if (tasks.length > 0 && tasks.length <= MAX_TASKS) {
                if (saveRoutineForDate(dateStr, { tasks: tasks })) renderTaskList(container, dateStr, { tasks: tasks });
            } else if (tasks.length > MAX_TASKS) alert(`Maximum ${MAX_TASKS} tâches.`);
            else alert("Veuillez entrer au moins une tâche.");
        });
    }
}

/**
 * Fonction principale de rendu pour la vue Routine.
 * ATTENTION: Elle attend maintenant le WRAPPER INTERNE comme argument.
 * @param {HTMLElement} contentWrapper - Le conteneur où le contenu doit être rendu.
 */
function renderRoutineView(contentWrapper) {
    // Vérifier si le wrapper est valide
    if (!contentWrapper || !contentWrapper.id || contentWrapper.id !== 'routine-content-wrapper') {
        console.error("renderRoutineView a été appelée avec un conteneur incorrect:", contentWrapper);
        // Essayer de trouver le bon wrapper si possible
        const mainContainer = document.getElementById('routineView');
        const potentialWrapper = mainContainer ? mainContainer.querySelector('#routine-content-wrapper') : null;
        if(!potentialWrapper) {
             console.error("Impossible de trouver ou de récupérer le wrapper de contenu routine.");
             return; // Ne peut pas continuer
        }
        contentWrapper = potentialWrapper;
    }

    todayString = getCurrentDateString();
    const routineData = getRoutineForDate(todayString);
    contentWrapper.innerHTML = ''; // Vider seulement le wrapper

    if (routineData && Array.isArray(routineData.tasks) && routineData.tasks.length > 0) {
        renderTaskList(contentWrapper, todayString, routineData);
    } else {
        renderInputForm(contentWrapper, todayString);
    }
}

/**
 * Fonction de rafraîchissement exportée. Trouve le wrapper et appelle renderRoutineView.
 */
export function refreshRoutineView() {
    // console.log("Rafraîchissement vue Routine...");
    const mainContainer = document.getElementById('routineView');
    const contentWrapper = mainContainer ? mainContainer.querySelector('#routine-content-wrapper') : null;

    if (contentWrapper) {
        renderRoutineView(contentWrapper); // Appeler render sur le wrapper trouvé
    } else {
        console.error("Échec du rafraîchissement: Wrapper de contenu routine introuvable lors du refresh.");
        // Peut-être essayer de réinitialiser la vue si nécessaire ?
        // initRoutineView(mainContainer); // Attention, peut causer des boucles si l'erreur est ailleurs
    }
}
/**
 * Initialise la vue Routine. Crée la structure avec titre et wrapper.
 * @param {HTMLElement} containerElement - L'élément DOM principal de la vue (#routineView).
 */
export function initRoutineView(containerElement) {
    if (!containerElement) { console.error("Conteneur vue Routine introuvable."); return; }

    // Vérifier si la structure existe déjà pour éviter de la dupliquer
    let contentWrapper = containerElement.querySelector('#routine-content-wrapper');
    if (!contentWrapper) {
        containerElement.innerHTML = `<h2>Routine Quotidienne</h2><div id="routine-content-wrapper"></div>`;
        contentWrapper = containerElement.querySelector('#routine-content-wrapper');
    }

    if (contentWrapper) {
         renderRoutineView(contentWrapper); // Premier rendu dans le wrapper
    } else {
         console.error("Impossible de créer/trouver le wrapper de contenu routine lors de l'init.");
         // Fallback risqué: tenter de rendre dans le conteneur principal
         // renderRoutineView(containerElement);
    }
}
