import { addGoal, getGoals, updateGoalStatus, deleteGoal } from './storageUtils.js';

export function initGoalsView(containerElement) {
    containerElement.innerHTML = `
        <h2>Mes Objectifs</h2>
        <div class="goal-form">
            <input type="text" id="goalTitleInput" placeholder="Titre de l'objectif (requis)">
            <textarea id="goalDescriptionInput" placeholder="Description (optionnel)"></textarea>
            <button id="addGoalBtn">Ajouter Objectif</button>
        </div>

        <h3>Objectifs Actifs</h3>
        <div id="activeGoalsList" class="goals-list">
            <p>Aucun objectif actif pour le moment.</p>
        </div>

        <h3>Objectifs Terminés</h3>
        <div id="completedGoalsList" class="goals-list">
            <p>Aucun objectif terminé pour le moment.</p>
        </div>
    `;

    const goalTitleInput = containerElement.querySelector('#goalTitleInput');
    const goalDescriptionInput = containerElement.querySelector('#goalDescriptionInput');
    const addGoalBtn = containerElement.querySelector('#addGoalBtn');
    const activeGoalsList = containerElement.querySelector('#activeGoalsList');
    const completedGoalsList = containerElement.querySelector('#completedGoalsList');

    addGoalBtn.addEventListener('click', async () => {
        const title = goalTitleInput.value.trim();
        const description = goalDescriptionInput.value.trim();

        if (!title) {
            alert("Le titre de l'objectif est requis.");
            return;
        }

        const newGoal = {
            title,
            description,
            status: 'active', // 'active' or 'completed'
            createdAt: new Date().toISOString()
        };

        try {
            await addGoal(newGoal);
            goalTitleInput.value = '';
            goalDescriptionInput.value = '';
            await loadAndDisplayGoals();
        } catch (error) {
            console.error('Error adding goal:', error);
            alert("Erreur lors de l'ajout de l'objectif.");
        }
    });

    async function loadAndDisplayGoals() {
        try {
            const allGoals = await getGoals();
            const activeGoals = allGoals.filter(goal => goal.status === 'active').sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
            const completedGoals = allGoals.filter(goal => goal.status === 'completed').sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

            renderGoals(activeGoalsList, activeGoals, false);
            renderGoals(completedGoalsList, completedGoals, true);

        } catch (error) {
            console.error('Error loading goals:', error);
            activeGoalsList.innerHTML = '<p>Erreur lors du chargement des objectifs actifs.</p>';
            completedGoalsList.innerHTML = '<p>Erreur lors du chargement des objectifs terminés.</p>';
        }
    }

    function renderGoals(listElement, goals, isCompletedList) {
        listElement.innerHTML = ''; // Clear previous content

        if (goals.length === 0) {
            listElement.innerHTML = `<p>Aucun objectif ${isCompletedList ? 'terminé' : 'actif'} pour le moment.</p>`;
            return;
        }

        goals.forEach(goal => {
            const goalItem = document.createElement('div');
            goalItem.classList.add('goal-item');
            if (isCompletedList) {
                goalItem.classList.add('completed-goal');
            }

            let descriptionHtml = '';
            if (goal.description) {
                descriptionHtml = `<p class="goal-description">${goal.description.replace(/\n/g, '<br>')}</p>`;
            }

            goalItem.innerHTML = `
                <h4 class="goal-title">${goal.title}</h4>
                ${descriptionHtml}
                <p class="goal-created-date">Créé le: ${new Date(goal.createdAt).toLocaleDateString('fr-FR')}</p>
                <div class="goal-actions">
                    ${!isCompletedList ? `<button class="complete-goal-btn" data-id="${goal.id}">Marquer comme terminé</button>` : ''}
                    ${isCompletedList ? `<button class="reactivate-goal-btn" data-id="${goal.id}">Réactiver</button>` : ''}
                    <button class="delete-goal-btn" data-id="${goal.id}">Supprimer</button>
                </div>
            `;
            listElement.appendChild(goalItem);
        });

        // Add event listeners for buttons
        listElement.querySelectorAll('.complete-goal-btn').forEach(button => {
            button.addEventListener('click', async (event) => {
                const goalId = Number(event.target.dataset.id);
                try {
                    await updateGoalStatus(goalId, 'completed');
                    await loadAndDisplayGoals();
                } catch (error) {
                    console.error('Error completing goal:', error);
                    alert("Erreur lors de la mise à jour de l'objectif.");
                }
            });
        });

        listElement.querySelectorAll('.reactivate-goal-btn').forEach(button => {
            button.addEventListener('click', async (event) => {
                const goalId = Number(event.target.dataset.id);
                try {
                    await updateGoalStatus(goalId, 'active');
                    await loadAndDisplayGoals();
                } catch (error) {
                    console.error('Error reactivating goal:', error);
                    alert("Erreur lors de la réactivation de l'objectif.");
                }
            });
        });

        listElement.querySelectorAll('.delete-goal-btn').forEach(button => {
            button.addEventListener('click', async (event) => {
                const goalId = Number(event.target.dataset.id);
                // Optional: Add a confirmation dialog here
                if (confirm("Êtes-vous sûr de vouloir supprimer cet objectif ?")) {
                    try {
                        await deleteGoal(goalId);
                        await loadAndDisplayGoals();
                    } catch (error) {
                        console.error('Error deleting goal:', error);
                        alert("Erreur lors de la suppression de l'objectif.");
                    }
                }
            });
        });
    }

    // Initial load
    loadAndDisplayGoals();
}
