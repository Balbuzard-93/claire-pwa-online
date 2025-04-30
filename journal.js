// journal.js
import { getJournalEntries, saveJournalEntries } from './storageUtils.js';

/**
 * Charge les entrées de journal depuis localStorage et les affiche.
 * @param {HTMLElement} listContainer - L'élément où afficher la liste des entrées.
 */
function loadAndDisplayEntries(listContainer) {
    listContainer.innerHTML = ''; // Vider la liste actuelle
    let entries = getJournalEntries(); // Utilise la fonction de storageUtils

    if (entries.length === 0) {
        listContainer.innerHTML = '<p>Aucune entrée pour le moment.</p>';
        return;
    }

    // Assurer le tri par date décroissante (plus récent en premier)
    entries.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    entries.forEach(entry => {
        const entryDiv = document.createElement('div');
        entryDiv.className = 'journal-entry';

        const dateSpan = document.createElement('span');
        dateSpan.className = 'journal-entry-date';
        try {
            // Formater la date pour la lisibilité
            dateSpan.textContent = new Date(entry.timestamp).toLocaleString('fr-FR', {
                dateStyle: 'medium', // ex: 5 juin 2024
                timeStyle: 'short'   // ex: 14:30
            });
        } catch (e) {
            console.warn("Date d'entrée de journal invalide:", entry.timestamp);
            dateSpan.textContent = 'Date invalide'; // Fallback
        }


        const textP = document.createElement('p');
        textP.className = 'journal-entry-text';
        // Utiliser textContent pour la sécurité (évite injection HTML)
        textP.textContent = entry.text;
        // Préserver les sauts de ligne entrés dans le textarea:
        textP.style.whiteSpace = 'pre-wrap';


        entryDiv.appendChild(dateSpan);
        entryDiv.appendChild(textP);
        listContainer.appendChild(entryDiv);
    });
}

/**
 * Sauvegarde une nouvelle entrée de journal.
 * @param {string} text - Le contenu de l'entrée.
 * @param {HTMLElement} listContainer - L'élément où afficher la liste (pour le rafraîchissement).
 * @param {HTMLTextAreaElement} inputElement - L'élément textarea (pour le vider).
 */
function saveEntry(text, listContainer, inputElement) {
    const trimmedText = text.trim();
    if (!trimmedText) {
        alert("L'entrée de journal ne peut pas être vide.");
        return;
    }

    const newEntry = {
        id: Date.now(), // Ajouter un ID simple
        timestamp: new Date().toISOString(),
        text: trimmedText
    };

    let entries = getJournalEntries(); // Récupère les entrées existantes

    // Ajouter la nouvelle entrée (au début pour ordre récent)
    entries.unshift(newEntry);

    if (saveJournalEntries(entries)) { // Sauvegarde via storageUtils
        // console.log('Entrée de journal enregistrée.'); // Optionnel
        // Effacer le textarea et rafraîchir la liste
        if (inputElement) {
            inputElement.value = '';
        }
        loadAndDisplayEntries(listContainer);
    }
    // Erreur gérée dans saveJournalEntries
}


/**
 * Initialise l'interface du journal dans le conteneur donné.
 * @param {HTMLElement} containerElement - L'élément DOM où injecter l'interface du journal.
 */
export function initJournal(containerElement) {
    if (!containerElement) {
        console.error("L'élément conteneur pour le journal n'a pas été trouvé.");
        return;
    }

    containerElement.innerHTML = `
        <h2>Mon Journal Personnel</h2>
        <div class="journal-form">
            <label for="journalEntryInput" class="visually-hidden">Entrée de journal :</label> <!-- Label ajouté -->
            <textarea id="journalEntryInput" placeholder="Écrivez ici vos pensées, sentiments, événements..." rows="5" aria-label="Nouvelle entrée de journal"></textarea> <!-- aria-label si label caché -->
            <button id="saveJournalEntry" class="button-primary">Enregistrer l'entrée</button>
        </div>
        <h3>Entrées précédentes</h3>
        <div id="journalEntriesList">
            <!-- Les entrées chargées apparaîtront ici -->
        </div>
    `;

    const entryInput = containerElement.querySelector('#journalEntryInput');
    const saveButton = containerElement.querySelector('#saveJournalEntry');
    const entriesList = containerElement.querySelector('#journalEntriesList');

    if (!entryInput || !saveButton || !entriesList) {
        console.error("Éléments internes du journal introuvables.");
        return;
    }

    // Ajouter l'écouteur pour sauvegarder
    saveButton.addEventListener('click', () => {
        saveEntry(entryInput.value, entriesList, entryInput);
    });

    // Charger et afficher les entrées existantes au démarrage de la vue
    loadAndDisplayEntries(entriesList);
}