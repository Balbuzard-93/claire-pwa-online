// moodTracker.js
import { getMoodEntries, saveMoodEntries as saveEntriesToStorage, getCurrentDateString } from './storageUtils.js';

// Garde en mémoire l'état actuel de la sélection
let currentSelection = { mood: null, energy: null, anxiety: null };
let todayString = ''; // Stocke la date du jour

/**
 * Vérifie si toutes les sélections sont faites et active/désactive le bouton de sauvegarde.
 */
function checkIfReadyToSave(saveButton) {
    const isReady = currentSelection.mood !== null && currentSelection.energy !== null && currentSelection.anxiety !== null;
    if(saveButton) saveButton.disabled = !isReady;
}

/**
 * Met à jour l'UI après enregistrement ou au chargement initial.
 */
function updateUIAfterRecording(containerElement, todaysEntry = null) {
    const messageElement = containerElement.querySelector('#moodMessage');
    const saveButton = containerElement.querySelector('#saveMoodEntry');
    const selectionButtons = containerElement.querySelectorAll('.mood-selector button');

    if (!messageElement || !saveButton || !selectionButtons) { console.error("Éléments UI Mood Tracker introuvables."); return; }

    if (todaysEntry) {
        messageElement.textContent = "Humeur enregistrée pour aujourd'hui. Revenez demain !";
        messageElement.className = 'mood-message success';
        saveButton.disabled = true;
        selectionButtons.forEach(button => {
            button.disabled = true;
            const group = button.dataset.group;
            const value = button.dataset.value;
            button.classList.toggle('selected', todaysEntry[group] !== undefined && String(todaysEntry[group]) === value);
        });
        currentSelection = { mood: todaysEntry.mood, energy: todaysEntry.energy, anxiety: todaysEntry.anxiety };
    } else {
        messageElement.textContent = '';
        messageElement.className = 'mood-message';
        saveButton.disabled = true;
        selectionButtons.forEach(button => {
            button.disabled = false;
            button.classList.remove('selected');
        });
        currentSelection = { mood: null, energy: null, anxiety: null };
    }
}

/**
 * Vérifie si l'humeur a déjà été enregistrée pour aujourd'hui et met à jour l'UI.
 */
function checkIfMoodRecordedToday(containerElement) {
    todayString = getCurrentDateString(); // Met à jour la date du jour
    const entries = getMoodEntries(); // Utilise storageUtils
    const todaysEntry = entries.find(entry => entry.date === todayString);
    updateUIAfterRecording(containerElement, todaysEntry);
}

/**
 * Sauvegarde l'humeur sélectionnée pour la journée en cours.
 */
function saveMood(containerElement) {
    const saveButton = containerElement.querySelector('#saveMoodEntry');
    if (!saveButton || saveButton.disabled) return;

    const entries = getMoodEntries();

    if (entries.some(entry => entry.date === todayString)) {
        alert("L'humeur pour aujourd'hui a déjà été enregistrée.");
        checkIfMoodRecordedToday(containerElement); // Resynchroniser UI
        return;
    }
    if (currentSelection.mood === null || currentSelection.energy === null || currentSelection.anxiety === null) {
         alert("Veuillez sélectionner une option pour chaque catégorie."); return;
    }

    const newEntry = {
        date: todayString,
        mood: parseInt(currentSelection.mood, 10),
        energy: parseInt(currentSelection.energy, 10),
        anxiety: parseInt(currentSelection.anxiety, 10)
    };

    entries.push(newEntry);
    if (saveEntriesToStorage(entries)) { updateUIAfterRecording(containerElement, newEntry); }
    // Erreur gérée dans saveEntriesToStorage
}

/**
 * Initialise l'interface du Mood Tracker.
 */
export function initMoodTracker(containerElement) {
    if (!containerElement) { console.error("Conteneur Mood Tracker introuvable."); return; }
    todayString = getCurrentDateString();
    currentSelection = { mood: null, energy: null, anxiety: null };

    containerElement.innerHTML = `
        <h2>Comment vous sentez-vous aujourd'hui ?</h2>
        <p class="mood-instruction">Sélectionnez une option pour chaque catégorie (une seule fois par jour).</p>
        <div class="mood-question">
            <label id="mood-label">Humeur :</label> <!-- Ajout ID pour aria-labelledby -->
            <div class="mood-selector mood-buttons" role="group" aria-labelledby="mood-label">
                <button data-group="mood" data-value="1" aria-label="Humeur Très basse">🙁</button>
                <button data-group="mood" data-value="2" aria-label="Humeur Basse">😕</button>
                <button data-group="mood" data-value="3" aria-label="Humeur Moyenne">😐</button>
                <button data-group="mood" data-value="4" aria-label="Humeur Bien">🙂</button>
                <button data-group="mood" data-value="5" aria-label="Humeur Très bien">😄</button>
            </div>
        </div>
        <div class="mood-question">
            <label id="energy-label">Énergie :</label>
            <div class="mood-selector energy-buttons" role="group" aria-labelledby="energy-label">
                <button data-group="energy" data-value="1">Faible</button>
                <button data-group="energy" data-value="2">Moyenne</button>
                <button data-group="energy" data-value="3">Haute</button>
            </div>
        </div>
        <div class="mood-question">
            <label id="anxiety-label">Anxiété :</label>
            <div class="mood-selector anxiety-buttons" role="group" aria-labelledby="anxiety-label">
                <button data-group="anxiety" data-value="1">Faible</button>
                <button data-group="anxiety" data-value="2">Moyenne</button>
                <button data-group="anxiety" data-value="3">Haute</button>
            </div>
        </div>
        <button id="saveMoodEntry" class="save-button button-primary" disabled>Enregistrer l'humeur du jour</button>
        <p id="moodMessage" class="mood-message" aria-live="polite"></p> <!-- aria-live pour annoncer les messages -->
    `;

    const saveButton = containerElement.querySelector('#saveMoodEntry');
    const moodSelectors = containerElement.querySelectorAll('.mood-selector');

    moodSelectors.forEach(selector => {
        selector.addEventListener('click', (event) => {
            const targetButton = event.target.closest('button');
            if (targetButton && targetButton.dataset.group && !targetButton.disabled) {
                const group = targetButton.dataset.group;
                const value = targetButton.dataset.value;
                currentSelection[group] = value;
                const groupButtons = selector.querySelectorAll('button');
                groupButtons.forEach(btn => btn.classList.remove('selected'));
                targetButton.classList.add('selected');
                checkIfReadyToSave(saveButton);
            }
        });
    });

    if (saveButton) { saveButton.addEventListener('click', () => saveMood(containerElement)); }
    checkIfMoodRecordedToday(containerElement); // État initial
}