// moodTracker.js (Version utilisant IndexedDB - AVEC LOGS DE DEBUG)
import { getMoodEntryForDate, saveMoodEntry, getCurrentDateString } from './storageUtils.js';

let currentSelection = { mood: null, energy: null, anxiety: null };
let todayString = '';
let todaysExistingEntry = null;

/** Vérifie si prêt à sauvegarder. */
function checkIfReadyToSave(saveButton) {
    if (!saveButton) return; // Sécurité
    const isReady = currentSelection.mood !== null && currentSelection.energy !== null && currentSelection.anxiety !== null;
    // Activer seulement si PAS déjà enregistré ET tout est sélectionné
    saveButton.disabled = !!todaysExistingEntry || !isReady;
    // console.log(`Mood LOG: CheckIfReady - Ready: ${isReady}, Existing: ${!!todaysExistingEntry}, Button Disabled: ${saveButton.disabled}`); // LOG M_READY
}

/** Met à jour l'UI. */
function updateUIAfterRecording(containerElement) {
    // console.log("Mood LOG: updateUIAfterRecording - Entrée existante:", todaysExistingEntry); // LOG M_UPDATE_UI
    const messageElement = containerElement.querySelector('#moodMessage');
    const saveButton = containerElement.querySelector('#saveMoodEntry');
    const selectionButtons = containerElement.querySelectorAll('.mood-selector button');
    if (!messageElement || !saveButton || !selectionButtons) { console.error("Mood LOG ERROR: Éléments UI introuvables pour MAJ."); return; } // LOG M_UPDATE_UI_ERR

    const entryExists = !!todaysExistingEntry;

    messageElement.textContent = entryExists ? "Humeur enregistrée pour aujourd'hui. Revenez demain !" : '';
    messageElement.className = entryExists ? 'mood-message success' : 'mood-message';

    selectionButtons.forEach(button => {
        button.disabled = entryExists; // Désactiver si déjà enregistré
        const group = button.dataset.group;
        const value = button.dataset.value;
        let isSelected = false;
        if (entryExists && todaysExistingEntry[group] !== undefined && String(todaysExistingEntry[group]) === value) {
            isSelected = true;
        } else if (!entryExists && currentSelection[group] !== null && String(currentSelection[group]) === value) {
             // Si pas encore enregistré, marquer la sélection en cours
             isSelected = true;
        }
        button.classList.toggle('selected', isSelected);
    });

    // Mettre à jour currentSelection SEULEMENT si une entrée existe et a été chargée
     if (entryExists) {
          currentSelection = { mood: todaysExistingEntry.mood, energy: todaysExistingEntry.energy, anxiety: todaysExistingEntry.anxiety };
     }
    // Ne pas réinitialiser currentSelection ici si pas d'entrée, l'utilisateur peut être en train de sélectionner

    checkIfReadyToSave(saveButton); // Mettre à jour l'état du bouton Enregistrer
}

/** Charge l'entrée du jour et met à jour l'UI. */
async function loadAndCheckMoodForToday(containerElement) {
    console.log("Mood LOG: Début loadAndCheckMoodForToday"); // LOG M_LOAD_1
    todayString = getCurrentDateString();
    try {
        console.log("Mood LOG: Appel getMoodEntryForDate pour", todayString); // LOG M_LOAD_2
        todaysExistingEntry = await getMoodEntryForDate(todayString);
        console.log("Mood LOG: Entrée récupérée:", todaysExistingEntry); // LOG M_LOAD_3
    } catch (error) {
        console.error("Mood LOG ERROR: Erreur chargement humeur du jour:", error); // LOG M_LOAD_ERR
        todaysExistingEntry = null;
    }
    updateUIAfterRecording(containerElement); // Mettre à jour l'UI
    console.log("Mood LOG: Fin loadAndCheckMoodForToday"); // LOG M_LOAD_4
}

/** Sauvegarde l'humeur sélectionnée. */
async function saveMood(containerElement) {
    console.log("Mood LOG: Début saveMood"); // LOG M_SAVE_1
    const saveButton = containerElement.querySelector('#saveMoodEntry');
    if (!saveButton || saveButton.disabled) { console.log("Mood LOG: Bouton sauvegarde non trouvé ou désactivé."); return; } // LOG M_SAVE_ABORT

    // Re-vérification sécurité
    try {
        const existing = await getMoodEntryForDate(todayString);
        if (existing) { alert("Humeur déjà enregistrée."); todaysExistingEntry = existing; updateUIAfterRecording(containerElement); return; }
    } catch(error) { console.error("Mood LOG ERROR: Erreur re-vérification avant sauvegarde:", error); alert("Erreur vérification données."); return; } // LOG M_SAVE_ERR1

    if (currentSelection.mood === null || currentSelection.energy === null || currentSelection.anxiety === null) { alert("Veuillez sélectionner une option par catégorie."); return; }

    const newEntry = { date: todayString, mood: parseInt(currentSelection.mood, 10), energy: parseInt(currentSelection.energy, 10), anxiety: parseInt(currentSelection.anxiety, 10) };
    console.log("Mood LOG: Nouvelle entrée à sauvegarder:", newEntry); // LOG M_SAVE_2

    try {
        saveButton.disabled = true; // Désactiver pendant l'opération
        console.log("Mood LOG: Appel saveMoodEntry (IndexedDB)..."); // LOG M_SAVE_3
        await saveMoodEntry(newEntry);
        console.log("Mood LOG: saveMoodEntry terminé."); // LOG M_SAVE_4
        todaysExistingEntry = newEntry;
        updateUIAfterRecording(containerElement);
    } catch (error) {
        console.error("Mood LOG ERROR: Erreur sauvegarde humeur:", error); // LOG M_SAVE_ERR2
        alert("Impossible d'enregistrer l'humeur.");
        saveButton.disabled = false; // Réactiver pour permettre nouvel essai
    }
}

/** Initialise l'interface du Mood Tracker. */
export async function initMoodTracker(containerElement) { // Rendre async
    console.log("Mood LOG: Initialisation..."); // LOG M_INIT_1
    if (!containerElement) { console.error("Mood LOG ERROR: Conteneur introuvable."); return; } // LOG M_INIT_ERR1

    // Réinitialiser états locaux importants
    currentSelection = { mood: null, energy: null, anxiety: null };
    todaysExistingEntry = null;
    todayString = getCurrentDateString();

    containerElement.innerHTML = `...`; // (Copier la structure HTML de la version précédente ici)
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

    if (!saveButton || moodSelectors.length === 0) { console.error("Mood LOG ERROR: Éléments UI internes introuvables."); return; } // LOG M_INIT_ERR2

    // Listeners sur les sélecteurs
    moodSelectors.forEach(selector => {
        selector.addEventListener('click', (event) => {
            // Vérifier si déjà enregistré (ne devrait pas pouvoir cliquer mais sécurité)
            if (todaysExistingEntry) return;

            const targetButton = event.target.closest('button');
            if (targetButton && targetButton.dataset.group && !targetButton.disabled) {
                const group = targetButton.dataset.group;
                const value = targetButton.dataset.value;
                console.log(`Mood LOG: Clic sur bouton ${group}, valeur ${value}`); // LOG M_CLICK_OPTION
                currentSelection[group] = value;
                const groupButtons = selector.querySelectorAll('button');
                groupButtons.forEach(btn => btn.classList.remove('selected'));
                targetButton.classList.add('selected');
                checkIfReadyToSave(saveButton);
            }
        });
    });
    console.log("Mood LOG: Listeners sélecteurs ajoutés."); // LOG M_INIT_3

    // Listener bouton Sauvegarder
    saveButton.addEventListener('click', async () => {
        console.log("Mood LOG: Clic 'Enregistrer Humeur'"); // LOG M_CLICK_SAVE
        await saveMood(containerElement);
        console.log("Mood LOG: Retour saveMood depuis listener."); // LOG M_CLICK_SAVE_2
    });
    console.log("Mood LOG: Listener bouton 'Enregistrer' ajouté."); // LOG M_INIT_4

    // Chargement initial de l'état du jour
    console.log("Mood LOG: Appel initial loadAndCheckMoodForToday..."); // LOG M_INIT_5
    await loadAndCheckMoodForToday(containerElement);
    console.log("Mood LOG: Initialisation terminée."); // LOG M_INIT_6
}
