// victoriesView.js (Version utilisant IndexedDB via storageUtils.js)
import { getVictories, addVictory as addVictoryToDB, deleteVictory as deleteVictoryFromDB } from './storageUtils.js'; // Renommer imports pour éviter conflits

/**
 * Supprime une victoire de IndexedDB et rafraîchit la liste.
 * @param {number} victoryId - L'ID unique de la victoire à supprimer.
 */
async function deleteVictory(victoryId) { // Rendre async
    try {
        await deleteVictoryFromDB(victoryId); // Appel async à storageUtils
        await displayVictoriesList(); // Recharger la liste (devient async)
    } catch (error) {
        console.error("Erreur lors de la suppression de la victoire:", error);
        alert("Erreur lors de la suppression de la victoire.");
    }
}

/**
 * Affiche la liste des victoires depuis IndexedDB.
 * Devient une fonction async.
 */
async function displayVictoriesList() { // Rendre async
    const listContainer = document.getElementById('victoriesList');
    if (!listContainer) { console.error("Conteneur #victoriesList introuvable."); return; }

    listContainer.innerHTML = '<p>Chargement des victoires...</p>'; // Message chargement

    try {
        const victories = await getVictories(); // Appel async
        listContainer.innerHTML = ''; // Vider après chargement réussi

        if (!Array.isArray(victories) || victories.length === 0) {
            listContainer.innerHTML = '<p class="no-victories-message">Votre musée est vide. Ajoutez votre première victoire ! ✨</p>';
            return;
        }

        // Trier par date décroissante
        victories.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

        victories.forEach(victory => {
            const itemDiv = document.createElement('div');
            itemDiv.className = 'victory-item';
            itemDiv.dataset.victoryId = victory.id;

            let formattedDate = 'Date inconnue';
            try { formattedDate = new Date(victory.timestamp).toLocaleDateString('fr-FR', { year: 'numeric', month: 'short', day: 'numeric' }); } catch(e){}

            const textP = document.createElement('p');
            textP.className = 'victory-text';
            textP.textContent = victory.text || '';

            itemDiv.innerHTML = `
                <div class="victory-content">
                    <span class="victory-date">${formattedDate}</span>
                    ${textP.outerHTML}
                </div>
                <button class="delete-victory-btn button-delete" title="Supprimer cette victoire" aria-label="Supprimer la victoire: ${victory.text || 'sans titre'}">×</button>
            `;

            const deleteBtn = itemDiv.querySelector('.delete-victory-btn');
            if (deleteBtn) {
                deleteBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    if (confirm(`Supprimer "${textP.textContent}" ?`)) {
                        // Pas besoin d'await ici car on rafraîchit après
                        deleteVictory(victory.id);
                    }
                });
            }
            listContainer.appendChild(itemDiv);
        });

    } catch (error) {
        console.error("Erreur chargement des victoires:", error);
        listContainer.innerHTML = '<p>Erreur lors du chargement de vos victoires.</p>';
    }
}

/**
 * Ajoute une nouvelle victoire à IndexedDB.
 */
async function addVictory() { // Rendre async
    const inputElement = document.getElementById('newVictoryInput');
    if(!inputElement) return;
    const text = inputElement.value.trim();
    if (!text) { alert("Veuillez décrire votre victoire."); return; }

    const newVictory = {
        // L'ID sera généré par IndexedDB (autoIncrement)
        timestamp: new Date().toISOString(),
        text: text
    };

    const addButton = document.getElementById('addVictoryBtn'); // Référence au bouton

    try {
        if (addButton) addButton.disabled = true; // Désactiver pendant ajout
        await addVictoryToDB(newVictory); // Appel async
        inputElement.value = '';
        await displayVictoriesList(); // Rafraîchir (async)
    } catch (error) {
        console.error("Erreur ajout victoire:", error);
        alert("Erreur lors de l'enregistrement de la victoire.");
    } finally {
         if (addButton) addButton.disabled = false; // Réactiver
    }
}

/**
 * Initialise la vue du Musée des Victoires.
 */
export async function initVictoriesView(containerElement) { // Rendre async
    if (!containerElement) { console.error("Conteneur vue Victoires introuvable."); return; }

    containerElement.innerHTML = `
        <h2>Musée des Victoires</h2>
        <div class="victory-add-form">
             <label for="newVictoryInput" class="visually-hidden">Nouvelle victoire :</label>
            <textarea id="newVictoryInput" placeholder="Quelle victoire célébrer ?" rows="3" aria-label="Nouvelle victoire" maxlength="300"></textarea>
            <button id="addVictoryBtn">Ajouter au musée ✨</button> <!-- Style appliqué via CSS ou JS -->
        </div>
        <div id="victoriesList"><p>Chargement...</p></div>
    `;

    const addBtn = containerElement.querySelector('#addVictoryBtn');
    const inputEl = containerElement.querySelector('#newVictoryInput');

    if (addBtn) {
        // Appliquer style spécifique "or"
        addBtn.style.backgroundColor = '#FFD700';
        addBtn.style.color = '#333';
        // Ajouter listener (wrapper async)
        addBtn.addEventListener('click', async () => { await addVictory(); });
    }
    if(inputEl && addBtn) {
         inputEl.addEventListener('keydown', async (event) => { // async pour addVictory
              if (event.key === 'Enter' && !event.shiftKey && !addBtn.disabled) {
                   event.preventDefault();
                   await addVictory(); // Appel async
              }
         });
    }

    // Afficher la liste initiale (async)
    await displayVictoriesList();
}
