// plannerView.js
import { getPlannerForDate, savePlannerForDate, getCurrentDateString } from './storageUtils.js';

let currentPlannerData = { tasks: [] }; // Garde en mémoire les données du jour
let selectedEnergy = null; // Garde l'énergie sélectionnée pour l'ajout
let todayString = ''; // Stocke la date du jour pour éviter de la recalculer

/**
 * Met à jour l'état de complétion d'une tâche et sauvegarde.
 * @param {number} taskId - L'ID unique de la tâche.
 * @param {boolean} isCompleted - Le nouvel état.
 * @param {string} dateStr - La date du jour (YYYY-MM-DD).
 */
function updateTaskCompletedStatus(taskId, isCompleted, dateStr) {
    // Assurer que currentPlannerData et tasks existent
    if (!currentPlannerData || !Array.isArray(currentPlannerData.tasks)) {
        console.error("Données du planificateur non initialisées correctement.");
        return;
    }
    const taskIndex = currentPlannerData.tasks.findIndex(task => task.id === taskId);
    if (taskIndex === -1) {
        console.error(`Tâche avec ID ${taskId} non trouvée pour mise à jour.`);
        return;
    }

    currentPlannerData.tasks[taskIndex].completed = isCompleted;

    // Mettre à jour l'UI pour cet élément spécifique
    const taskElement = document.querySelector(`#plannerTaskList .planner-task-item[data-task-id="${taskId}"]`);
    if (taskElement) {
        taskElement.classList.toggle('task-completed', isCompleted);
        // Assurer synchro de la case à cocher (si l'event n'a pas suffi)
        const checkbox = taskElement.querySelector('.task-checkbox');
        if(checkbox) checkbox.checked = isCompleted;
    }

    savePlannerForDate(dateStr, currentPlannerData);
}

/**
 * Supprime une tâche de la liste et sauvegarde.
 * @param {number} taskId - L'ID unique de la tâche à supprimer.
 * @param {string} dateStr - La date du jour (YYYY-MM-DD).
 */
function deleteTask(taskId, dateStr) {
    if (!currentPlannerData || !Array.isArray(currentPlannerData.tasks)) return;

    currentPlannerData.tasks = currentPlannerData.tasks.filter(task => task.id !== taskId);

    // Mettre à jour l'UI en supprimant l'élément
    const taskElement = document.querySelector(`#plannerTaskList .planner-task-item[data-task-id="${taskId}"]`);
    if (taskElement) {
        taskElement.remove();
    }

    savePlannerForDate(dateStr, currentPlannerData);

    // Vérifier si la liste est vide et afficher message si besoin
    const taskListUl = document.getElementById('plannerTaskList');
    if (taskListUl && currentPlannerData.tasks.length === 0) {
         taskListUl.innerHTML = '<p class="no-tasks-message">Aucune tâche planifiée pour aujourd\'hui.</p>';
    }
}

/**
 * Ajoute une nouvelle tâche à la liste et sauvegarde.
 * @param {string} dateStr - La date du jour (YYYY-MM-DD).
 */
function addTask(dateStr) {
    const inputElement = document.getElementById('newTaskInput');
    if(!inputElement) return;
    const text = inputElement.value.trim();

    if (!text) {
        alert("Veuillez entrer le texte de la tâche.");
        return;
    }

    const newTask = {
        id: Date.now(), // Utilisation simple de timestamp comme ID unique
        text: text,
        energy: selectedEnergy, // Utilise la variable globale 'selectedEnergy'
        completed: false
    };

    // S'assurer que currentPlannerData.tasks est un tableau
    if (!Array.isArray(currentPlannerData.tasks)) {
         currentPlannerData.tasks = [];
    }
    currentPlannerData.tasks.push(newTask);

    if (savePlannerForDate(dateStr, currentPlannerData)) {
        // Nettoyer le formulaire et re-rendre la liste
        inputElement.value = '';
        selectedEnergy = null; // Réinitialiser l'énergie sélectionnée
        document.querySelectorAll('.energy-selector button.selected').forEach(btn => btn.classList.remove('selected'));
        const addBtn = document.getElementById('addTaskBtn');
        if(addBtn) addBtn.disabled = true; // Désactiver jusqu'à nouvelle saisie

        const taskListUl = document.getElementById('plannerTaskList');
        if (taskListUl) {
             // Enlever le message "aucune tâche" s'il existe
             const noTaskMsg = taskListUl.querySelector('.no-tasks-message');
             if(noTaskMsg) noTaskMsg.remove();
             // Ajouter la nouvelle tâche
             appendTaskToList(taskListUl, newTask, dateStr); // Ajoute juste le nouvel élément
        } else {
             // Fallback : re-rend toute la vue si la liste n'est pas trouvée
             renderPlannerView(document.getElementById('plannerView'));
        }
    }
    // L'erreur est gérée dans savePlannerForDate (alerte affichée)
}

/**
 * Ajoute un élément LI représentant une tâche à la liste UL.
 * @param {HTMLElement} listUl - L'élément UL où ajouter la tâche.
 * @param {object} task - L'objet tâche.
 * @param {string} dateStr - La date du jour.
 */
function appendTaskToList(listUl, task, dateStr) {
    const li = document.createElement('li');
    li.className = `planner-task-item ${task.completed ? 'task-completed' : ''}`;
    li.dataset.taskId = task.id;

    let energyIndicator = '';
    const energyMap = { 1: '⚡', 2: '⚡⚡', 3: '⚡⚡⚡' };
    const energyTextMap = { 1: 'Basse énergie', 2: 'Énergie moyenne', 3: 'Haute énergie' };
    // Vérifier que task.energy est une clé valide dans energyMap
    if (task.energy !== null && energyMap[task.energy]) {
        energyIndicator = `<span class="energy-indicator ${task.energy === 1 ? 'low' : task.energy === 2 ? 'medium' : 'high'}" title="${energyTextMap[task.energy]}">${energyMap[task.energy]}</span>`;
    }

    // Utiliser textContent pour la sécurité sur le texte de la tâche
    const taskTextSpan = document.createElement('span');
    taskTextSpan.className = 'task-text';
    taskTextSpan.textContent = task.text || ''; // Assurer que c'est une chaîne

    li.innerHTML = `
        <input type="checkbox" id="planner-task-${task.id}" class="task-checkbox" ${task.completed ? 'checked' : ''}>
        <label for="planner-task-${task.id}" class="visually-hidden">Marquer "${task.text || 'tâche sans nom'}" comme complétée</label>
        ${taskTextSpan.outerHTML} <!-- Insérer le span sécurisé -->
        ${energyIndicator}
        <button class="delete-task-btn button-delete" title="Supprimer la tâche" aria-label="Supprimer la tâche: ${task.text || 'tâche sans nom'}">🗑️</button>
    `; // aria-label pour bouton supprimer

    // Ajouter les écouteurs pour la nouvelle tâche
    const checkbox = li.querySelector('.task-checkbox');
    const deleteBtn = li.querySelector('.delete-task-btn');

    if (checkbox) { checkbox.addEventListener('change', (event) => updateTaskCompletedStatus(task.id, event.target.checked, dateStr)); }
    if (deleteBtn) { deleteBtn.addEventListener('click', () => { if(confirm(`Supprimer la tâche "${task.text || ''}" ?`)) { deleteTask(task.id, dateStr); } }); }

    listUl.appendChild(li);
}


/**
 * Fonction principale de rendu pour la vue Planificateur.
 * @param {HTMLElement} containerElement - Le conteneur principal de la vue.
 */
function renderPlannerView(containerElement) {
    todayString = getCurrentDateString();
    const loadedData = getPlannerForDate(todayString);
    currentPlannerData = loadedData ? loadedData : { tasks: [] };
    // S'assurer que tasks est un tableau
    if (!Array.isArray(currentPlannerData.tasks)) {
        currentPlannerData.tasks = [];
    }

    // Formater la date pour l'affichage
    let formattedDate = 'Date inconnue';
    try {
         // Ajouter T00:00:00 pour forcer l'interprétation en UTC pour toLocaleDateString
         formattedDate = new Date(todayString + 'T00:00:00Z').toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
    } catch(e) {
        console.error("Erreur formatage date planner:", e);
    }


    containerElement.innerHTML = `
        <h3>Mon Plan Doux du ${formattedDate}</h3>
        <div class="planner-add-task">
             <label for="newTaskInput" class="visually-hidden">Nouvelle tâche ou intention :</label>
            <input type="text" id="newTaskInput" placeholder="Nouvelle intention ou tâche..." maxlength="150"> <!-- Limiter longueur -->
            <div class="energy-selector" role="group" aria-labelledby="energy-label-planner">
                 <span id="energy-label-planner" class="visually-hidden">Niveau d'énergie estimé :</span>
                 Énergie :
                <button data-energy="1" title="Basse énergie" aria-label="Basse énergie">⚡</button>
                <button data-energy="2" title="Énergie moyenne" aria-label="Énergie moyenne">⚡⚡</button>
                <button data-energy="3" title="Haute énergie" aria-label="Haute énergie">⚡⚡⚡</button>
                <button data-energy="null" title="Non défini / Effacer" aria-label="Énergie non définie">❓</button>
            </div>
            <button id="addTaskBtn" class="button-primary" disabled>Ajouter</button>
        </div>
        <ul id="plannerTaskList"></ul> <!-- Liste initialement vide -->
    `;

    // Populer la liste des tâches existantes
    const taskListUl = containerElement.querySelector('#plannerTaskList');
    if (taskListUl && currentPlannerData.tasks.length > 0) {
        currentPlannerData.tasks.forEach(task => appendTaskToList(taskListUl, task, todayString));
    } else if (taskListUl) {
        taskListUl.innerHTML = '<p class="no-tasks-message">Aucune tâche planifiée pour aujourd\'hui.</p>';
    }


    // Ajouter les écouteurs pour le formulaire d'ajout
    const newTaskInput = containerElement.querySelector('#newTaskInput');
    const addTaskBtn = containerElement.querySelector('#addTaskBtn');
    const energyButtons = containerElement.querySelectorAll('.energy-selector button');

    // Activer le bouton Ajouter seulement si du texte est saisi
    if (newTaskInput && addTaskBtn) {
        newTaskInput.addEventListener('input', () => {
            addTaskBtn.disabled = newTaskInput.value.trim() === '';
        });
        // Permettre ajout avec touche Entrée
        newTaskInput.addEventListener('keydown', (event) => {
             if(event.key === 'Enter' && !addTaskBtn.disabled) {
                  addTask(todayString);
             }
        });
    }

    // Gérer la sélection d'énergie
    energyButtons.forEach(button => {
        button.addEventListener('click', () => {
            const currentSelected = containerElement.querySelector('.energy-selector button.selected');
            if (currentSelected === button && button.dataset.energy !== 'null') { // Permet de désélectionner en recliquant
                 button.classList.remove('selected');
                 selectedEnergy = null;
            } else if (currentSelected === button && button.dataset.energy === 'null') {
                 // Ne rien faire si on clique sur '?' déjà sélectionné
            }
             else {
                if(currentSelected) currentSelected.classList.remove('selected');
                button.classList.add('selected');
                const energyValue = button.dataset.energy;
                selectedEnergy = (energyValue === 'null') ? null : parseInt(energyValue, 10);
            }
           // console.log("Énergie sélectionnée:", selectedEnergy);
        });
    });

    // Ajouter l'écouteur au bouton Ajouter
    if (addTaskBtn) { addTaskBtn.addEventListener('click', () => addTask(todayString)); }
}

/** Fonction de rafraîchissement exportée. */
export function refreshPlannerView() {
    const c = document.getElementById('plannerView');
    if (c) {
        const currentWrapper = c.querySelector('#planner-content-wrapper'); // Trouver le wrapper s'il existe
        renderPlannerView(currentWrapper || c); // Rendre dans le wrapper ou le conteneur principal
    }
}
/** Initialise la vue Planificateur. */
export function initPlannerView(containerElement) {
    if (!containerElement) { console.error("Conteneur vue Planificateur introuvable."); return; }
    // Ajouter un titre H2 global pour la section et un wrapper pour le contenu dynamique
    containerElement.innerHTML = `<h2>Plan du Jour</h2><div id="planner-content-wrapper"></div>`;
    const contentWrapper = containerElement.querySelector('#planner-content-wrapper');
    if (contentWrapper) {
        renderPlannerView(contentWrapper); // Premier rendu dans le wrapper
    } else {
         renderPlannerView(containerElement); // Fallback
    }
}