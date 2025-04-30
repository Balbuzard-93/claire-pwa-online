// moodTracker.js (Version utilisant IndexedDB via storageUtils.js)
import { getMoodEntryForDate, saveMoodEntry, getCurrentDateString } from './storageUtils.js'; // Mise à jour imports

let currentSelection = { mood: null, energy: null, anxiety: null };
let todayString = '';
let todaysExistingEntry = null; // Pour stocker l'entrée du jour si elle existe déjà

/** Vérifie si prêt à sauvegarder et active/désactive bouton. */
function checkIfReadyToSave(saveButton) {
    const isReady = currentSelection.mood !== null && currentSelection.energy !== null && currentSelection.anxiety !== null;
    if(saveButton) saveButton.disabled = !isReady;
}

/** Met à jour l'UI après chargement/enregistrement. */
function updateUIAfterRecording(containerElement) {
    const messageElement = containerElement.querySelector('#moodMessage');
    const saveButton = containerElement.querySelector('#saveMoodEntry');
    const selectionButtons = containerElement.querySelectorAll('.mood-selector button');
    if (!messageElement || !saveButton || !selectionButtons) return;

    const entryExists = !!todaysExistingEntry; // True si une entrée existe pour aujourd'hui

    messageElement.textContent = entryExists ? "Humeur enregistrée pour aujourd'hui. Revenez demain !" : '';
    messageElement.className = entryExists ? 'mood-message success' : 'mood-message';
    saveButton.disabled = entryExists; // Désactivé si déjà enregistré

    selectionButtons.forEach(button => {
        button.disabled = entryExists; // Désactiver tous les boutons si enregistré
        const group = button.dataset.group;
        const value = button.dataset.value;
        let isSelected = false;
        if (entryExists && todaysExistingEntry[group] !== undefined && String(todaysExistingEntry[group]) === value) {
            isSelected = true; // Marquer la sélection enregistrée
        } else if (!entryExists && currentSelection[group] !== null && String(currentSelection[group]) === value) {
            isSelected = true; // Marquer la sélection en cours si pas encore enregistré
        }
        button.classList.toggle('selected', isSelected);
    });

    // Mettre à jour currentSelection seulement si une entrée existe
    if (entryExists) {
         currentSelection = { mood: todaysExistingEntry.mood, energy: todaysExistingEntry.energy, anxiety: todaysExistingEntry.anxiety };
    } else {
         // S'assurer que currentSelection reflète l'UI si pas enregistré (déjà géré par les listeners)
         // On ne réinitialise PAS currentSelection ici, car l'utilisateur peut être en train de sélectionner
         // La réinitialisation se fait au début de initMoodTracker ou refresh
    }
     // Vérifier si le bouton save doit être activé (si pas enregistré et tout sélectionné)
     if(!entryExists) checkIfReadyToSave(saveButton);
}

/** Charge l'entrée du jour si elle existe et met à jour l'UI. */
async function loadAndCheckMoodForToday(containerElement) {
    todayString = getCurrentDateString();
    try {
        todaysExistingEntry = await getMoodEntryForDate(todayString); // Appel asynchrone
        // console.log("Entrée humeur existante:", todaysExistingEntry);
    } catch (error) {
        console.error("Erreur chargement humeur du jour:", error);
        todaysExistingEntry = null; // Assumer pas d'entrée en cas d'erreur
    }
    // Mettre à jour l'UI en fonction de si une entrée a été trouvée
    updateUIAfterRecording(containerElement);
}

/** Sauvegarde l'humeur sélectionnée pour aujourd'hui. */
async function saveMood(containerElement) {
    const saveButton = containerElement.querySelector('#saveMoodEntry');
    if (!saveButton || saveButton.disabled) return;

    // Re-vérifier au cas où (concurrence, etc.)
    try {
        const existing = await getMoodEntryForDate(todayString);
        if (existing) {
            alert("L'humeur pour aujourd'hui a déjà été enregistrée.");
            todaysExistingEntry = existing; // Mettre à jour la variable locale
            updateUIAfterRecording(containerElement); // Resynchroniser UI
            return;
        }
    } catch(error) {
         console.error("Erreur re-vérification humeur avant sauvegarde:", error);
         // Continuer prudemment ? Ou arrêter ? Arrêtons pour l'instant.
         alert("Erreur lors de la vérification des données existantes.");
         return;
    }

    if (currentSelection.mood === null || currentSelection.energy === null || currentSelection.anxiety === null) {
         alert("Veuillez sélectionner une option pour chaque catégorie."); return;
    }

    const newEntry = {
        date: todayString, // Clé primaire
        mood: parseInt(currentSelection.mood, 10),
        energy: parseInt(currentSelection.energy, 10),
        anxiety: parseInt(currentSelection.anxiety, 10)
    };

    try {
        saveButton.disabled = true; // Désactiver pendant sauvegarde
        await saveMoodEntry(newEntry); // Appel asynchrone
        todaysExistingEntry = newEntry; // Mettre à jour l'état local
        updateUIAfterRecording(containerElement); // Mettre à jour l'UI
    } catch (error) {
        console.error("Erreur lors de la sauvegarde de l'humeur:", error);
        alert("Impossible d'enregistrer l'humeur.");
        // Garder le bouton activé si la sauvegarde échoue pour réessayer ?
        saveButton.disabled = false;
    }
}

/** Initialise l'interface du Mood Tracker. */
export async function initMoodTracker(containerElement) { // Rendre async
    if (!containerElement) { console.error("Conteneur Mood Tracker introuvable."); return; }

    // Réinitialiser la sélection locale à chaque initialisation de vue
    currentSelection = { mood: null, energy: null, anxiety: null };
    todaysExistingEntry = null; // Réinitialiser l'entrée connue
    todayString = getCurrentDateString(); // Date initiale

    containerElement.innerHTML = `
        <h2>Comment vous sentez-vous aujourd'hui ?</h2>
        <p class="mood-instruction">Sélectionnez une option pour chaque catégorie (une seule fois par jour).</p>
        <div class="mood-question"> <label id="mood-label">Humeur :</label> <div class="mood-selector mood-buttons" role="group" aria-labelledby="mood-label"> <button data-group="mood" data-value="1" aria-label="Humeur Très basse">🙁</button> <button data-group="mood" data-value="2" aria-label="Humeur Basse">😕</button> <button data-group="mood" data-value="3" aria-label="Humeur Moyenne">😐</button> <button data-group="mood" data-value="4" aria-label="Humeur Bien">🙂</button> <button data-group="mood" data-value="5" aria-label="Humeur Très bien">😄</button> </div> </div>
        <div class="mood-question"> <label id="energy-label">Énergie :</label> <div class="mood-selector energy-buttons" role="group" aria-labelledby="energy-label"> <button data-group="energy" data-value="1">Faible</button> <button data-group="energy" data-value="2">Moyenne</button> <button data-group="energy" data-value="3">Haute</button> </div> </div>
        <div class="mood-question"> <label id="anxiety-label">Anxiété :</label> <div class="mood-selector anxiety-buttons" role="group" aria-labelledby="anxiety-label"> <button data-group="anxiety" data-value="1">Faible</button> <button data-group="anxiety" data-value="2">Moyenne</button> <button data-group="anxiety" data-value="3">Haute</button> </div> </div>
        <button id="saveMoodEntry" class="save-button button-primary" disabled>Enregistrer l'humeur du jour</button>
        <p id="moodMessage" class="mood-message" aria-live="polite"></p>
    `;

    const saveButton = containerElement.querySelector('#saveMoodEntry');
    const moodSelectors = containerElement.querySelectorAll('.mood-selector');

    moodSelectors.forEach(selector => {
        selector.addEventListener('click', (event) => {
            const targetButton = event.target.closest('button');
            if (targetButton && targetButton.dataset.group && !targetButton.disabled) {
                const group = targetButton.dataset.group;
                const value = targetButton.dataset.value;
                currentSelection[group] = value; // Mettre à jour la sélection locale en cours
                const groupButtons = selector.querySelectorAll('button');
                groupButtons.forEach(btn => btn.classList.remove('selected'));
                targetButton.classList.add('selected');
                checkIfReadyToSave(saveButton); // Vérifier si on peut activer le bouton Enregistrer
            }
        });
    });

    if (saveButton) {
        saveButton.addEventListener('click', async () => { // Wrapper async
             await saveMood(containerElement);
        });
    }

    // Charger l'état initial (vérifier si déjà enregistré aujourd'hui)
    await loadAndCheckMoodForToday(containerElement);
}
