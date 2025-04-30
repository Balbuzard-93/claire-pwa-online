// journal.js (Version utilisant IndexedDB via storageUtils.js)
import { getJournalEntries, addJournalEntry, deleteJournalEntry } from './storageUtils.js'; // Mise à jour des imports

/**
 * Supprime une entrée de journal par son ID.
 * @param {number} entryId - L'ID de l'entrée à supprimer.
 * @param {HTMLElement} listContainer - Le conteneur de la liste pour rafraîchir.
 */
async function deleteEntry(entryId, listContainer) {
    try {
        await deleteJournalEntry(entryId); // Appel asynchrone
        // console.log("Entrée supprimée, ID:", entryId);
        await loadAndDisplayEntries(listContainer); // Recharger la liste
    } catch (error) {
        console.error("Erreur lors de la suppression de l'entrée de journal:", error);
        alert("Impossible de supprimer l'entrée.");
    }
}

/**
 * Charge les entrées de journal depuis IndexedDB et les affiche.
 * DOIT être appelée avec await ou dans un contexte async.
 * @param {HTMLElement} listContainer - L'élément où afficher la liste des entrées.
 */
async function loadAndDisplayEntries(listContainer) {
    if (!listContainer) { console.error("Conteneur de liste journal introuvable."); return; }
    listContainer.innerHTML = '<p>Chargement des entrées...</p>'; // Message temporaire

    try {
        const entries = await getJournalEntries(); // Appel asynchrone

        listContainer.innerHTML = ''; // Vider la liste après chargement

        if (!Array.isArray(entries) || entries.length === 0) {
            listContainer.innerHTML = '<p>Aucune entrée pour le moment.</p>';
            return;
        }

        // Trier par date décroissante (plus récent en premier)
        entries.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

        entries.forEach(entry => {
            const entryDiv = document.createElement('div');
            entryDiv.className = 'journal-entry';
            entryDiv.dataset.entryId = entry.id; // Ajouter l'ID pour suppression éventuelle

            const dateSpan = document.createElement('span');
            dateSpan.className = 'journal-entry-date';
            try {
                dateSpan.textContent = new Date(entry.timestamp).toLocaleString('fr-FR', { dateStyle: 'medium', timeStyle: 'short' });
            } catch (e) { dateSpan.textContent = 'Date invalide'; }

            const textP = document.createElement('p');
            textP.className = 'journal-entry-text';
            textP.textContent = entry.text; // Sécurisé
            textP.style.whiteSpace = 'pre-wrap';

            // Bouton supprimer (optionnel mais utile)
            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'delete-journal-btn button-delete'; // Utiliser classe standardisée
            deleteBtn.innerHTML = '×'; // Ou une icône poubelle
            deleteBtn.title = 'Supprimer cette entrée';
            deleteBtn.setAttribute('aria-label', `Supprimer l'entrée du ${dateSpan.textContent}`);
            deleteBtn.addEventListener('click', (event) => {
                 event.stopPropagation();
                 if (confirm(`Supprimer cette entrée ?\n"${entry.text.substring(0, 50)}..."`)) {
                      deleteEntry(entry.id, listContainer);
                 }
            });


            entryDiv.appendChild(deleteBtn); // Mettre le bouton avant ou après le contenu
            entryDiv.appendChild(dateSpan);
            entryDiv.appendChild(textP);
            listContainer.appendChild(entryDiv);
        });

    } catch (error) {
         console.error("Erreur lors du chargement des entrées du journal:", error);
         listContainer.innerHTML = '<p>Erreur lors du chargement des entrées.</p>';
    }
}

/**
 * Sauvegarde une nouvelle entrée de journal dans IndexedDB.
 * DOIT être appelée avec await ou dans un contexte async.
 * @param {string} text - Le contenu de l'entrée.
 * @param {HTMLElement} listContainer - L'élément où afficher la liste (pour rafraîchissement).
 * @param {HTMLTextAreaElement} inputElement - L'élément textarea (pour le vider).
 */
async function saveEntry(text, listContainer, inputElement) {
    const trimmedText = text.trim();
    if (!trimmedText) {
        alert("L'entrée de journal ne peut pas être vide.");
        return;
    }

    const newEntry = {
        // Pas besoin d'ID, IndexedDB le génère (autoIncrement)
        timestamp: new Date().toISOString(),
        text: trimmedText
    };

    try {
        await addJournalEntry(newEntry); // Appel asynchrone
        // console.log('Entrée de journal ajoutée à IndexedDB.');

        // Effacer le textarea et rafraîchir la liste
        if (inputElement) inputElement.value = '';
        await loadAndDisplayEntries(listContainer); // Recharger pour afficher

    } catch (error) {
        console.error("Erreur lors de la sauvegarde de l'entrée dans IndexedDB:", error);
        alert("Une erreur est survenue lors de la sauvegarde de l'entrée.");
    }
}


/**
 * Initialise l'interface du journal dans le conteneur donné.
 * @param {HTMLElement} containerElement - L'élément DOM où injecter l'interface du journal.
 */
export async function initJournal(containerElement) { // Rendre async pour await loadAndDisplayEntries
    if (!containerElement) {
        console.error("Conteneur journal introuvable.");
        return;
    }

    containerElement.innerHTML = `
        <h2>Mon Journal Personnel</h2>
        <div class="journal-form">
            <label for="journalEntryInput" class="visually-hidden">Entrée de journal :</label>
            <textarea id="journalEntryInput" placeholder="Écrivez ici vos pensées..." rows="5" aria-label="Nouvelle entrée de journal"></textarea>
            <button id="saveJournalEntryBtn" class="button-primary">Enregistrer l'entrée</button> <!-- ID bouton mis à jour -->
        </div>
        <h3>Entrées précédentes</h3>
        <div id="journalEntriesList">
            <p>Chargement...</p> <!-- Message initial -->
        </div>
    `;

    const entryInput = containerElement.querySelector('#journalEntryInput');
    const saveButton = containerElement.querySelector('#saveJournalEntryBtn');
    const entriesList = containerElement.querySelector('#journalEntriesList');

    if (!entryInput || !saveButton || !entriesList) {
        console.error("Éléments internes du journal introuvables.");
        containerElement.querySelector('#journalEntriesList').textContent = 'Erreur initialisation.';
        return;
    }

    // Ajouter l'écouteur pour sauvegarder (wrapper async)
    saveButton.addEventListener('click', async () => {
         saveButton.disabled = true; // Désactiver pendant sauvegarde
         await saveEntry(entryInput.value, entriesList, entryInput);
         saveButton.disabled = false; // Réactiver après
    });

     // Permettre ajout avec Ctrl+Enter ou Cmd+Enter
     entryInput.addEventListener('keydown', async (event) => {
          if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
               event.preventDefault();
               saveButton.disabled = true;
               await saveEntry(entryInput.value, entriesList, entryInput);
               saveButton.disabled = false;
          }
     });

    // Charger et afficher les entrées existantes au démarrage de la vue
    // Utiliser try/catch ici aussi car c'est le premier chargement
    try {
         await loadAndDisplayEntries(entriesList);
    } catch(error) {
         console.error("Erreur lors du chargement initial du journal:", error);
         entriesList.innerHTML = '<p>Impossible de charger les entrées.</p>';
    }
}
