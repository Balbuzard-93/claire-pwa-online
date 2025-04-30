// journal.js (Version utilisant IndexedDB - AVEC LOGS DE DEBUG)
import { getJournalEntries, addJournalEntry, deleteJournalEntry } from './storageUtils.js';

/** Supprime une entrée de journal par son ID. */
async function deleteEntry(entryId, listContainer) {
    console.log(`Journal LOG: Tentative suppression ID ${entryId}`); // LOG J_DEL_1
    try {
        await deleteJournalEntry(entryId);
        console.log(`Journal LOG: Suppression DB OK ID ${entryId}`); // LOG J_DEL_2
        await loadAndDisplayEntries(listContainer);
    } catch (error) {
        console.error("Journal LOG ERROR: Erreur suppression entrée:", error); // LOG J_DEL_ERR
        alert("Impossible de supprimer l'entrée.");
    }
}

/** Charge et affiche les entrées depuis IndexedDB. */
async function loadAndDisplayEntries(listContainer) {
    console.log("Journal LOG: Début loadAndDisplayEntries"); // LOG J_LOAD_1
    if (!listContainer) { console.error("Journal LOG ERROR: Conteneur liste introuvable."); return; } // LOG J_LOAD_ERR1
    listContainer.innerHTML = '<p>Chargement des entrées...</p>';

    try {
        console.log("Journal LOG: Appel getJournalEntries..."); // LOG J_LOAD_2
        const entries = await getJournalEntries();
        console.log(`Journal LOG: ${entries.length} entrées récupérées.`); // LOG J_LOAD_3
        listContainer.innerHTML = ''; // Vider

        if (!Array.isArray(entries) || entries.length === 0) {
            listContainer.innerHTML = '<p>Aucune entrée pour le moment.</p>';
            console.log("Journal LOG: Aucune entrée à afficher."); // LOG J_LOAD_4
            return;
        }

        entries.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

        entries.forEach(entry => {
            const entryDiv = document.createElement('div');
            entryDiv.className = 'journal-entry';
            entryDiv.dataset.entryId = entry.id;
            const dateSpan = document.createElement('span'); /* ... formatage date ... */ try { dateSpan.textContent = new Date(entry.timestamp).toLocaleString('fr-FR', { dateStyle: 'medium', timeStyle: 'short' }); } catch (e) { dateSpan.textContent = 'Date invalide'; } dateSpan.className = 'journal-entry-date';
            const textP = document.createElement('p'); textP.className = 'journal-entry-text'; textP.textContent = entry.text; textP.style.whiteSpace = 'pre-wrap';
            const deleteBtn = document.createElement('button'); deleteBtn.className = 'delete-journal-btn button-delete'; deleteBtn.innerHTML = '×'; deleteBtn.title = 'Supprimer'; deleteBtn.setAttribute('aria-label', `Supprimer l'entrée`);
            deleteBtn.addEventListener('click', (event) => { event.stopPropagation(); if (confirm(`Supprimer ?\n"${entry.text.substring(0, 50)}..."`)) { deleteEntry(entry.id, listContainer); } });
            entryDiv.appendChild(deleteBtn); entryDiv.appendChild(dateSpan); entryDiv.appendChild(textP); listContainer.appendChild(entryDiv);
        });
        console.log("Journal LOG: Affichage entrées terminé."); // LOG J_LOAD_5

    } catch (error) {
         console.error("Journal LOG ERROR: Erreur chargement/affichage entrées:", error); // LOG J_LOAD_ERR2
         listContainer.innerHTML = '<p>Erreur chargement entrées.</p>';
    }
}

/** Sauvegarde une nouvelle entrée dans IndexedDB. */
async function saveEntry(text, listContainer, inputElement) {
    console.log("Journal LOG: Début saveEntry."); // LOG J_SAVE_1
    const trimmedText = text.trim();
    if (!trimmedText) { alert("L'entrée ne peut pas être vide."); return; }

    const newEntry = { timestamp: new Date().toISOString(), text: trimmedText }; // ID auto par IDB

    try {
        console.log("Journal LOG: Appel addJournalEntry (IndexedDB)...", newEntry); // LOG J_SAVE_2
        await addJournalEntry(newEntry);
        console.log("Journal LOG: addJournalEntry terminé."); // LOG J_SAVE_3

        if (inputElement) inputElement.value = '';
        console.log("Journal LOG: Appel loadAndDisplayEntries après sauvegarde..."); // LOG J_SAVE_4
        await loadAndDisplayEntries(listContainer);
        console.log("Journal LOG: Fin loadAndDisplayEntries après sauvegarde."); // LOG J_SAVE_5

    } catch (error) {
        console.error("Journal LOG ERROR: Erreur dans saveEntry:", error); // LOG J_SAVE_ERR
        alert("Erreur sauvegarde entrée journal.");
    }
}


/** Initialise l'interface du journal. */
export async function initJournal(containerElement) {
    console.log("Journal LOG: Initialisation..."); // LOG J_INIT_1
    if (!containerElement) { console.error("Journal LOG ERROR: Conteneur principal introuvable."); return; } // LOG J_INIT_ERR1

    containerElement.innerHTML = `
        <h2>Mon Journal Personnel</h2>
        <div class="journal-form">
            <label for="journalEntryInput" class="visually-hidden">Entrée de journal :</label>
            <textarea id="journalEntryInput" placeholder="Écrivez ici..." rows="5" aria-label="Nouvelle entrée de journal"></textarea>
            <button id="saveJournalEntryBtn" class="button-primary">Enregistrer l'entrée</button>
        </div>
        <h3>Entrées précédentes</h3>
        <div id="journalEntriesList"><p>Chargement...</p></div>`;

    const entryInput = containerElement.querySelector('#journalEntryInput');
    const saveButton = containerElement.querySelector('#saveJournalEntryBtn');
    const entriesList = containerElement.querySelector('#journalEntriesList');

    if (!entryInput || !saveButton || !entriesList) { console.error("Journal LOG ERROR: Éléments internes introuvables."); return; } // LOG J_INIT_ERR2

    // Listener bouton Sauvegarder
    saveButton.addEventListener('click', async () => {
        console.log("Journal LOG: Clic 'Enregistrer'"); // LOG J_CLICK_SAVE
         saveButton.disabled = true;
         console.log("Journal LOG: Appel saveEntry depuis listener..."); // LOG J_CLICK_SAVE_2
         await saveEntry(entryInput.value, entriesList, entryInput);
         console.log("Journal LOG: Retour saveEntry depuis listener."); // LOG J_CLICK_SAVE_3
         saveButton.disabled = false;
    });
    console.log("Journal LOG: Listener bouton 'Enregistrer' ajouté."); // LOG J_INIT_3

     // Listener Ctrl+Enter
     entryInput.addEventListener('keydown', async (event) => {
          if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
               event.preventDefault();
               console.log("Journal LOG: Ctrl+Enter détecté."); // LOG J_KEYDOWN_SAVE
               saveButton.click(); // Déclencher le clic sur le bouton
          }
     });
     console.log("Journal LOG: Listener keydown ajouté."); // LOG J_INIT_4

    // Chargement initial
    console.log("Journal LOG: Appel initial loadAndDisplayEntries..."); // LOG J_INIT_5
    try {
         await loadAndDisplayEntries(entriesList);
         console.log("Journal LOG: Fin loadAndDisplayEntries initial."); // LOG J_INIT_6
    } catch(error) {
         console.error("Journal LOG ERROR: Erreur chargement initial:", error); // LOG J_INIT_ERR3
         entriesList.innerHTML = '<p>Impossible de charger les entrées.</p>';
    }
    console.log("Journal LOG: Initialisation terminée."); // LOG J_INIT_7
}
