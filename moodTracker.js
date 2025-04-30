// moodTracker.js (Version Corrigée v2 - Vérification Date Stricte)
import { getMoodEntryForDate, saveMoodEntry, getCurrentDateString } from './storageUtils.js';

let currentSelection = { mood: null, energy: null, anxiety: null };
let todaysExistingEntry = null;
// let todayString = ''; // Ne pas garder en globale ici, obtenir à chaque rendu/refresh

/** Vérifie si prêt à sauvegarder */
function checkIfReadyToSave(saveButton) {
    if (!saveButton) return;
    const isReady = currentSelection.mood !== null && currentSelection.energy !== null && currentSelection.anxiety !== null;
    saveButton.disabled = !!todaysExistingEntry || !isReady;
}

/** Met à jour l'UI */
function updateUIAfterRecording(containerElement) {
    // ... (code identique à la version précédente) ...
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
async function loadAndCheckMoodForToday(containerElement, dateStr) { // Reçoit date
    // console.log("Mood LOG: Début loadAndCheckMoodForToday pour", dateStr);
    if (!dateStr || typeof dateStr !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) { // *** Vérification Stricte de la Date ***
         console.error("Mood LOG ERROR: dateStr invalide reçue par loadAndCheckMoodForToday:", dateStr);
         todaysExistingEntry = null;
         updateUIAfterRecording(containerElement);
         return;
    }
    try {
        todaysExistingEntry = await getMoodEntryForDate(dateStr);
        // console.log("Mood LOG: Entrée récupérée:", todaysExistingEntry);
    } catch (error) { console.error("Mood LOG ERROR: Erreur chargement humeur du jour:", error); todaysExistingEntry = null; }
    updateUIAfterRecording(containerElement);
    // console.log("Mood LOG: Fin loadAndCheckMoodForToday");
}

/** Sauvegarde l'humeur */
async function saveMood(containerElement, dateStr) { // Reçoit date
    // console.log("Mood LOG: Début saveMood pour", dateStr);
    const saveButton = containerElement.querySelector('#saveMoodEntry');
    if (!saveButton || saveButton.disabled) return;
    if(!dateStr){ console.error("Mood LOG ERROR: dateStr non définie dans saveMood"); return; }

    try { /* ... (Re-vérification existence) ... */ } catch(error) { /* ... */ return; }
    if (currentSelection.mood === null || /*...*/) { alert("Sélectionnez tout."); return; }
    const newEntry = { date: dateStr, mood: parseInt(currentSelection.mood), /*...*/ };
    try { /* ... (Sauvegarde) ... */ } catch (error) { /* ... */ }
}

/** Initialise l'interface */
export async function initMoodTracker(containerElement) {
    // console.log("Mood LOG: Initialisation...");
    if (!containerElement) { console.error("Mood LOG ERROR: Conteneur introuvable."); return; }

    // *** OBTENIR LA DATE ICI ***
    const todayStringForInit = getCurrentDateString();
    console.log("Mood LOG: Date pour init:", todayStringForInit); // Log pour vérifier

    // Réinitialiser états locaux
    currentSelection = { mood: null, energy: null, anxiety: null };
    todaysExistingEntry = null;

    containerElement.innerHTML = `...`; // (Copier la structure HTML précédente ici)
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

    // Listeners sélecteurs (inchangés, utilisent currentSelection)
     moodSelectors.forEach(selector => { selector.addEventListener('click', (event) => { /* ... */ }); });
    // console.log("Mood LOG: Listeners sélecteurs ajoutés.");

    // Listener bouton Sauvegarder
    saveButton.addEventListener('click', async () => {
        // Récupérer la date actuelle AU MOMENT du clic pour être sûr
        const currentDateOnClick = getCurrentDateString();
        // console.log("Mood LOG: Clic 'Enregistrer Humeur'");
        await saveMood(containerElement, currentDateOnClick); // *** Passer la date ici ***
        // console.log("Mood LOG: Retour saveMood depuis listener.");
    });
    // console.log("Mood LOG: Listener bouton 'Enregistrer' ajouté.");

    // Charger l'état initial (maintenant que la date est définie et passée)
    // console.log("Mood LOG: Appel initial loadAndCheckMoodForToday...");
    await loadAndCheckMoodForToday(containerElement, todayStringForInit); // *** Passer la date ici ***
    // console.log("Mood LOG: Initialisation terminée.");
}
