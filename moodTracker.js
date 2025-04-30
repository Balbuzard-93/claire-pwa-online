// moodTracker.js (Version Corrigée - Date définie avant accès IDB)
import { getMoodEntryForDate, saveMoodEntry, getCurrentDateString } from './storageUtils.js';

let currentSelection = { mood: null, energy: null, anxiety: null };
let todayString = ''; // Sera définie dans init et refresh
let todaysExistingEntry = null;

/** Vérifie si prêt à sauvegarder et active/désactive bouton. */
function checkIfReadyToSave(saveButton) {
    if (!saveButton) return;
    const isReady = currentSelection.mood !== null && currentSelection.energy !== null && currentSelection.anxiety !== null;
    saveButton.disabled = !!todaysExistingEntry || !isReady; // Désactivé si déjà enregistré OU pas prêt
}

/** Met à jour l'UI après chargement/enregistrement. */
function updateUIAfterRecording(containerElement) {
    const messageElement = containerElement.querySelector('#moodMessage');
    const saveButton = containerElement.querySelector('#saveMoodEntry');
    const selectionButtons = containerElement.querySelectorAll('.mood-selector button');
    if (!messageElement || !saveButton || !selectionButtons) { console.error("Mood LOG ERROR: Éléments UI introuvables pour MAJ."); return; }

    const entryExists = !!todaysExistingEntry;

    messageElement.textContent = entryExists ? "Humeur enregistrée pour aujourd'hui. Revenez demain !" : '';
    messageElement.className = entryExists ? 'mood-message success' : 'mood-message';

    selectionButtons.forEach(button => {
        button.disabled = entryExists;
        const group = button.dataset.group;
        const value = button.dataset.value;
        let isSelected = false;
        if (entryExists && todaysExistingEntry[group] !== undefined && String(todaysExistingEntry[group]) === value) {
            isSelected = true;
        } else if (!entryExists && currentSelection[group] !== null && String(currentSelection[group]) === value) {
             isSelected = true;
        }
        button.classList.toggle('selected', isSelected);
    });

     if (entryExists) {
          currentSelection = { mood: todaysExistingEntry.mood, energy: todaysExistingEntry.energy, anxiety: todaysExistingEntry.anxiety };
     }
     // Ne pas réinitialiser currentSelection si pas d'entrée (sélection en cours)

    checkIfReadyToSave(saveButton);
}

/** Charge l'entrée du jour si elle existe et met à jour l'UI. */
async function loadAndCheckMoodForToday(containerElement, dateStr) { // Reçoit la date
    // console.log("Mood LOG: Début loadAndCheckMoodForToday pour", dateStr);
    if (!dateStr) {
         console.error("Mood LOG ERROR: dateStr invalide dans loadAndCheckMoodForToday");
         todaysExistingEntry = null;
         updateUIAfterRecording(containerElement);
         return;
    }
    try {
        // console.log("Mood LOG: Appel getMoodEntryForDate pour", dateStr);
        todaysExistingEntry = await getMoodEntryForDate(dateStr); // Utilise dateStr reçue
        // console.log("Mood LOG: Entrée récupérée:", todaysExistingEntry);
    } catch (error) {
        console.error("Mood LOG ERROR: Erreur chargement humeur du jour:", error);
        todaysExistingEntry = null;
    }
    updateUIAfterRecording(containerElement); // Mettre à jour l'UI avec le résultat
    // console.log("Mood LOG: Fin loadAndCheckMoodForToday");
}

/** Sauvegarde l'humeur sélectionnée pour aujourd'hui. */
async function saveMood(containerElement) {
    // console.log("Mood LOG: Début saveMood pour", todayString); // Utilise la globale mise à jour
    const saveButton = containerElement.querySelector('#saveMoodEntry');
    if (!saveButton || saveButton.disabled) return;
    if(!todayString){ console.error("Mood LOG ERROR: todayString non définie dans saveMood"); return; }

    // Re-vérification sécurité
    try {
        const existing = await getMoodEntryForDate(todayString);
        if (existing) { alert("Humeur déjà enregistrée."); todaysExistingEntry = existing; updateUIAfterRecording(containerElement); return; }
    } catch(error) { console.error("Mood LOG ERROR: Erreur re-vérification avant sauvegarde:", error); alert("Erreur vérification données."); return; }

    if (currentSelection.mood === null || currentSelection.energy === null || currentSelection.anxiety === null) { alert("Veuillez sélectionner une option par catégorie."); return; }

    const newEntry = { date: todayString, mood: parseInt(currentSelection.mood, 10), energy: parseInt(currentSelection.energy, 10), anxiety: parseInt(currentSelection.anxiety, 10) };
    // console.log("Mood LOG: Nouvelle entrée à sauvegarder:", newEntry);

    try {
        saveButton.disabled = true;
        // console.log("Mood LOG: Appel saveMoodEntry (IndexedDB)...");
        await saveMoodEntry(newEntry);
        // console.log("Mood LOG: saveMoodEntry terminé.");
        todaysExistingEntry = newEntry; // Mettre à jour état local
        updateUIAfterRecording(containerElement); // MAJ UI finale
    } catch (error) {
        console.error("Mood LOG ERROR: Erreur sauvegarde humeur:", error);
        alert("Impossible d'enregistrer l'humeur.");
        saveButton.disabled = false; // Permettre nouvel essai
    }
}

/** Initialise l'interface du Mood Tracker. */
export async function initMoodTracker(containerElement) { // Devient async pour le await final
    // console.log("Mood LOG: Initialisation...");
    if (!containerElement) { console.error("Mood LOG ERROR: Conteneur introuvable."); return; }

    // *** DÉFINIR LA DATE ICI AVANT TOUT ***
    todayString = getCurrentDateString();
    // console.log("Mood LOG: Date initialisée à", todayString);

    // Réinitialiser états locaux
    currentSelection = { mood: null, energy: null, anxiety: null };
    todaysExistingEntry = null;

    // Générer le HTML
    containerElement.innerHTML = `
        <h2>Comment vous sentez-vous aujourd'hui ?</h2>
        <p class="mood-instruction">Sélectionnez une option pour chaque catégorie (une seule fois par jour).</p>
        <div class="mood-question"> <label id="mood-label">Humeur :</label> <div class="mood-selector mood-buttons" role="group" aria-labelledby="mood-label"> <button data-group="mood" data-value="1" aria-label="Humeur Très basse">🙁</button> <button data-group="mood" data-value="2" aria-label="Humeur Basse">😕</button> <button data-group="mood" data-value="3" aria-label="Humeur Moyenne">😐</button> <button data-group="mood" data-value="4" aria-label="Humeur Bien">🙂</button> <button data-group="mood" data-value="5" aria-label="Humeur Très bien">😄</button> </div> </div>
        <div class="mood-question"> <label id="energy-label">Énergie :</label> <div class="mood-selector energy-buttons" role="group" aria-labelledby="energy-label"> <button data-group="energy" data-value="1">Faible</button> <button data-group="energy" data-value="2">Moyenne</button> <button data-group="energy" data-value="3">Haute</button> </div> </div>
        <div class="mood-question"> <label id="anxiety-label">Anxiété :</label> <div class="mood-selector anxiety-buttons" role="group" aria-labelledby="anxiety-label"> <button data-group="anxiety" data-value="1">Faible</button> <button data-group="anxiety" data-value="2">Moyenne</button> <button data-group="anxiety" data-value="3">Haute</button> </div> </div>
        <button id="saveMoodEntry" class="save-button button-primary" disabled>Enregistrer l'humeur du jour</button>
        <p id="moodMessage" class="mood-message" aria-live="polite"></p>
    `;

    // Récupérer les éléments après création HTML
    const saveButton = containerElement.querySelector('#saveMoodEntry');
    const moodSelectors = containerElement.querySelectorAll('.mood-selector');
    if (!saveButton || moodSelectors.length === 0) { console.error("Mood LOG ERROR: Éléments UI internes introuvables après création HTML."); return; }

    // Listeners sur les sélecteurs
    moodSelectors.forEach(selector => {
        selector.addEventListener('click', (event) => {
            if (todaysExistingEntry) return; // Ne rien faire si déjà enregistré
            const targetButton = event.target.closest('button');
            if (targetButton?.dataset.group && !targetButton.disabled) {
                const group = targetButton.dataset.group; const value = targetButton.dataset.value;
                // console.log(`Mood LOG: Clic bouton ${group}, valeur ${value}`);
                currentSelection[group] = value;
                selector.querySelectorAll('button').forEach(btn => btn.classList.remove('selected'));
                targetButton.classList.add('selected');
                checkIfReadyToSave(saveButton);
            }
        });
    });
    // console.log("Mood LOG: Listeners sélecteurs ajoutés.");

    // Listener bouton Sauvegarder
    saveButton.addEventListener('click', async () => { // Wrapper async ici aussi
        // console.log("Mood LOG: Clic 'Enregistrer Humeur'");
        await saveMood(containerElement); // Appelle la fonction async saveMood
        // console.log("Mood LOG: Retour saveMood depuis listener.");
    });
    // console.log("Mood LOG: Listener bouton 'Enregistrer' ajouté.");

    // Charger l'état initial (maintenant que la date est définie)
    // console.log("Mood LOG: Appel initial loadAndCheckMoodForToday...");
    await loadAndCheckMoodForToday(containerElement, todayString); // Passer la date
    // console.log("Mood LOG: Initialisation terminée.");
}
