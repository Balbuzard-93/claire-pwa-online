// moodTracker.js (Version Corrigée v3 - Fix parseInt)
import { getMoodEntryForDate, saveMoodEntry, getCurrentDateString } from './storageUtils.js';

let currentSelection = { mood: null, energy: null, anxiety: null };
let todaysExistingEntry = null;
// let todayString = ''; // Pas de globale pour la date ici

/** Vérifie si prêt à sauvegarder */
function checkIfReadyToSave(saveButton) {
    if (!saveButton) return;
    const isReady = currentSelection.mood !== null && currentSelection.energy !== null && currentSelection.anxiety !== null;
    saveButton.disabled = !!todaysExistingEntry || !isReady;
}

/** Met à jour l'UI */
function updateUIAfterRecording(containerElement) {
     const messageElement = containerElement.querySelector('#moodMessage');
     const saveButton = containerElement.querySelector('#saveMoodEntry');
     const selectionButtons = containerElement.querySelectorAll('.mood-selector button');
     if (!messageElement || !saveButton || !selectionButtons) { console.error("Mood LOG ERROR: Éléments UI introuvables pour MAJ."); return; }
     const entryExists = !!todaysExistingEntry;
     messageElement.textContent = entryExists ? "Humeur enregistrée pour aujourd'hui. Revenez demain !" : '';
     messageElement.className = entryExists ? 'mood-message success' : 'mood-message';
     selectionButtons.forEach(button => { button.disabled = entryExists; const group = button.dataset.group; const value = button.dataset.value; let isSelected = false; if (entryExists && todaysExistingEntry[group] !== undefined && String(todaysExistingEntry[group]) === value) { isSelected = true; } else if (!entryExists && currentSelection[group] !== null && String(currentSelection[group]) === value) { isSelected = true; } button.classList.toggle('selected', isSelected); });
     if (entryExists) { currentSelection = { mood: todaysExistingEntry.mood, energy: todaysExistingEntry.energy, anxiety: todaysExistingEntry.anxiety }; }
     checkIfReadyToSave(saveButton);
}

/** Charge l'entrée du jour */
async function loadAndCheckMoodForToday(containerElement, dateStr) {
    if (!dateStr || typeof dateStr !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
         console.error("Mood LOG ERROR: dateStr invalide reçue par loadAndCheckMoodForToday:", dateStr);
         todaysExistingEntry = null;
         updateUIAfterRecording(containerElement);
         return;
    }
    try {
        todaysExistingEntry = await getMoodEntryForDate(dateStr);
    } catch (error) { console.error("Mood LOG ERROR: Erreur chargement humeur du jour:", error); todaysExistingEntry = null; }
    updateUIAfterRecording(containerElement);
}

/** Sauvegarde l'humeur */
async function saveMood(containerElement, dateStr) { // Reçoit date
    const saveButton = containerElement.querySelector('#saveMoodEntry');
    if (!saveButton || saveButton.disabled) return;
    if(!dateStr){ console.error("Mood LOG ERROR: dateStr non définie dans saveMood"); return; }

    // Re-vérification existence
    try {
        const existing = await getMoodEntryForDate(dateStr);
        if (existing) {
            alert("Humeur déjà enregistrée.");
            todaysExistingEntry = existing; updateUIAfterRecording(containerElement); return;
        }
    } catch(error) { console.error("Mood LOG ERROR: Erreur re-vérification:", error); alert("Erreur vérification données."); return; }

    // Vérification sélection complète
    if (currentSelection.mood === null || currentSelection.energy === null || currentSelection.anxiety === null) {
        alert("Veuillez sélectionner une option pour chaque catégorie."); return;
    }

    // *** CORRECTION PARSEINT ICI ***
    const newEntry = {
        date: dateStr,
        mood: parseInt(currentSelection.mood, 10),    // Ajouter base 10
        energy: parseInt(currentSelection.energy, 10),  // Ajouter base 10
        anxiety: parseInt(currentSelection.anxiety, 10) // Ajouter base 10
    };

    // Vérifier si parseInt a retourné NaN (si currentSelection contenait autre chose qu'un nombre)
     if (isNaN(newEntry.mood) || isNaN(newEntry.energy) || isNaN(newEntry.anxiety)) {
          console.error("Mood LOG ERROR: Impossible de parser une des valeurs de sélection:", currentSelection);
          alert("Erreur interne lors de la préparation des données d'humeur.");
          return;
     }


    try {
        saveButton.disabled = true;
        await saveMoodEntry(newEntry); // Appel à storageUtils
        todaysExistingEntry = newEntry; // Mettre à jour état local
        updateUIAfterRecording(containerElement); // MAJ UI finale
    } catch (error) {
        console.error("Mood LOG ERROR: Erreur sauvegarde humeur:", error);
        alert("Impossible d'enregistrer l'humeur.");
        saveButton.disabled = false; // Permettre nouvel essai
    }
}

/** Initialise l'interface */
export async function initMoodTracker(containerElement) {
    if (!containerElement) { console.error("Mood LOG ERROR: Conteneur introuvable."); return; }

    const todayStringForInit = getCurrentDateString(); // Obtenir date AVANT de générer HTML

    currentSelection = { mood: null, energy: null, anxiety: null };
    todaysExistingEntry = null;

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
    if (!saveButton || moodSelectors.length === 0) { console.error("Mood LOG ERROR: Éléments UI internes introuvables."); return; }

    // Listeners sélecteurs
     moodSelectors.forEach(selector => {
        selector.addEventListener('click', (event) => {
            if (todaysExistingEntry) return; // Ne rien faire si déjà enregistré
            const targetButton = event.target.closest('button');
            if (targetButton?.dataset.group && !targetButton.disabled) {
                const group = targetButton.dataset.group; const value = targetButton.dataset.value;
                currentSelection[group] = value; // Stocke la valeur (string) sélectionnée
                selector.querySelectorAll('button').forEach(btn => btn.classList.remove('selected'));
                targetButton.classList.add('selected');
                checkIfReadyToSave(saveButton);
            }
        });
    });

    // Listener bouton Sauvegarder
    saveButton.addEventListener('click', async () => {
        const currentDateOnClick = getCurrentDateString(); // Date au moment du clic
        await saveMood(containerElement, currentDateOnClick);
    });

    // Charger l'état initial
    await loadAndCheckMoodForToday(containerElement, todayStringForInit);
}
