// routineView.js
import { getRoutineForDate, saveRoutineForDate, getCurrentDateString } from './storageUtils.js';

const MAX_TASKS = 3;
let currentRoutineData = null;
let todayString = '';

/** Sauvegarde la tâche mise à jour et met à jour l'UI. */
function updateTaskStatus(taskId, isCompleted, dateStr) {
    if (!currentRoutineData || !Array.isArray(currentRoutineData.tasks)) return;
    const taskIndex = currentRoutineData.tasks.findIndex(task => task.id === taskId);
    if (taskIndex === -1) return;

    currentRoutineData.tasks[taskIndex].completed = isCompleted;

    const taskElement = document.querySelector(`#routineView .task-list-item[data-task-id="${taskId}"]`);
    if (taskElement) {
         taskElement.classList.toggle('task-completed', isCompleted);
         // Sync checkbox state just in case
         const checkbox = taskElement.querySelector('.task-checkbox');
         if(checkbox) checkbox.checked = isCompleted;
    }

    saveRoutineForDate(dateStr, currentRoutineData);
}

/** Affiche la liste des tâches définies pour aujourd'hui. */
function renderTaskList(container, dateStr, routineData) {
    currentRoutineData = routineData; // Mettre à jour la copie locale

    let tasksHtml = '<ul class="task-list">';
    routineData.tasks.forEach((task) => {
        const label = document.createElement('label');
        label.htmlFor = `routine-task-${task.id}`;
        label.className = 'task-text';
        label.textContent = task.text || ''; // Sécurisé

        tasksHtml += `
            <li class="task-list-item ${task.completed ? 'task-completed' : ''}" data-task-id="${task.id}">
                <input type="checkbox" id="routine-task-${task.id}" class="task-checkbox" ${task.completed ? 'checked' : ''}>
                ${label.outerHTML}
            </li>
        `;
    });
    tasksHtml += '</ul>';

    // Formater la date
    let formattedDate = 'Date inconnue';
    try {
        formattedDate = new Date(dateStr + 'T00:00:00Z').toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
    } catch(e) { console.error("Erreur formatage date routine:", e); }

    container.innerHTML = `<h3>Routine du ${formattedDate}</h3>${tasksHtml}<button id="editRoutineBtn" class="edit-routine-button button-secondary">Modifier la routine</button>`;

    const taskListUl = container.querySelector('.task-list');
    if (taskListUl) {
        // Délégation d'événements pour les checkboxes et labels
        taskListUl.addEventListener('change', (event) => {
            if (event.target.matches('.task-checkbox')) {
                const listItem = event.target.closest('.task-list-item');
                if (listItem?.dataset.taskId) {
                    const taskId = Number.parseInt(listItem.dataset.taskId, 10);
                    if (!isNaN(taskId)) updateTaskStatus(taskId, event.target.checked, dateStr);
                }
            }
        });
         taskListUl.addEventListener('click', (event) => {
              if (event.target.matches('.task-text')) {
                   const checkboxId = event.target.getAttribute('for');
                   const checkbox = document.getElementById(checkboxId);
                   if(checkbox) { checkbox.checked = !checkbox.checked; checkbox.dispatchEvent(new Event('change', { bubbles: true })); }
              }
         });
    }

    const editBtn = container.querySelector('#editRoutineBtn');
    if (editBtn) { editBtn.addEventListener('click', () => { if (confirm("Effacer et redéfinir la routine du jour ?")) { saveRoutineForDate(dateStr, null); currentRoutineData = null; renderRoutineView(document.getElementById('routineView')); } }); }
}

/** Affiche le formulaire pour définir la routine du jour. */
function renderInputForm(container, dateStr) {
    currentRoutineData = null;
    let inputsHtml = '';
    for (let i = 0; i < MAX_TASKS; i++) {
        inputsHtml += `<div class="input-group">
             <label for="task-input-${i}" class="visually-hidden">Tâche ${i + 1}</label>
             <input type="text" id="task-input-${i}" class="task-input" placeholder="Tâche ${i + 1} (optionnel)" maxlength="100">
        </div>`;
    }
    container.innerHTML = `<h3>Définir la Routine du Jour</h3><p>Entrez 1 à ${MAX_TASKS} tâches simples.</p><div class="routine-input-form">${inputsHtml}<button id="saveRoutineBtn" class="button-primary">Enregistrer la Routine</button></div>`;

    const saveBtn = container.querySelector('#saveRoutineBtn');
    const inputs = container.querySelectorAll('.task-input');

    // Permettre sauvegarde avec Entrée sur le dernier input
     if (inputs.length > 0) {
          inputs[inputs.length - 1].addEventListener('keydown', (event) => {
               if (event.key === 'Enter' && saveBtn) {
                    saveBtn.click(); // Simuler clic sur le bouton
               }
          });
     }

    if (saveBtn) {
        saveBtn.addEventListener('click', () => {
            const tasks = [];
            inputs.forEach((input, index) => {
                const text = input.value.trim();
                // Utiliser index comme ID simple ici, car les tâches sont définies en bloc
                if (text) { tasks.push({ id: index, text: text, completed: false }); }
            });
            if (tasks.length > 0 && tasks.length <= MAX_TASKS) {
                if (saveRoutineForDate(dateStr, { tasks: tasks })) { renderTaskList(container, dateStr, { tasks: tasks }); }
            } else if (tasks.length > MAX_TASKS) { alert(`Maximum ${MAX_TASKS} tâches.`); }
            else { alert("Veuillez entrer au moins une tâche."); }
        });
    }
}

/** Fonction principale de rendu pour la vue Routine. */
function renderRoutineView(containerElement) {
    todayString = getCurrentDateString();
    const routineData = getRoutineForDate(todayString);

    // Utiliser un wrapper pour le contenu afin de ne pas écraser le titre H2 principal
    const contentWrapperId = 'routine-content-wrapper';
    let contentWrapper = containerElement.querySelector(`#${contentWrapperId}`);
    if (!contentWrapper) {
         console.error("Wrapper de contenu routine introuvable ! Assurez-vous que initRoutineView a créé la structure.");
         // Fallback: utiliser le conteneur principal mais risque d'effacer le H2
         contentWrapper = containerElement;
         // Alternative: reconstruire le H2 si nécessaire
         // if (!containerElement.querySelector('h2')) {
         //      const title = document.createElement('h2'); title.textContent = "Routine Quotidienne";
         //      containerElement.prepend(title); // Ajouter avant le contenu
         // }
    }
    contentWrapper.innerHTML = ''; // Vider seulement le wrapper

    if (routineData && Array.isArray(routineData.tasks) && routineData.tasks.length > 0) {
        renderTaskList(contentWrapper, todayString, routineData);
    } else {
        renderInputForm(contentWrapper, todayString);
    }
}

/** Fonction de rafraîchissement exportée. */
export function refreshRoutineView() {
    const c = document.getElementById('routineView');
    // Cibler le wrapper interne pour le re-rendu
    const cw = c ? c.querySelector('#routine-content-wrapper') : null;
    if (cw) {
        renderRoutineView(cw); // Appeler render sur le wrapper
    } else if (c) {
        renderRoutineView(c); // Fallback si wrapper non trouvé
    }
}
/** Initialise la vue Routine. */
export function initRoutineView(containerElement) {
    if (!containerElement) { console.error("Conteneur vue Routine introuvable."); return; }
    // Créer la structure de base avec titre et wrapper
    containerElement.innerHTML = `<h2>Routine Quotidienne</h2><div id="routine-content-wrapper"></div>`;
    const contentWrapper = containerElement.querySelector('#routine-content-wrapper');
    if (contentWrapper) {
         renderRoutineView(contentWrapper); // Premier rendu dans le wrapper
    } else {
         renderRoutineView(containerElement); // Fallback
    }
}