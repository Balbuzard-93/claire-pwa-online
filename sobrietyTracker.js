// sobrietyTracker.js (Version Corrigée v3 - Robustesse Date + Logs)
import { getSobrietyStartDate, saveSobrietyStartDate } from './storageUtils.js';

// --- Motivation Quotidienne (inchangée) ---
const dailyMotivations = [ /* ... (liste des messages) ... */ ];
function getDayOfYear(date) { /* ... */ }
function getDailyMotivationMessage() { /* ... */ }

/**
 * Calcule le nombre de jours complets écoulés depuis une date donnée (en UTC).
 * @param {string | null} startDateString - La date de début au format ISO string, ou null.
 * @returns {number} Le nombre de jours de sobriété. Retourne 0 si date invalide.
 */
export function calculateSoberDays(startDateString) {
     console.log(`Sobriety LOG: Calcul jours pour date string: [${startDateString}]`); // LOG S_CALC_1
     if (!startDateString || typeof startDateString !== 'string') {
         console.log("Sobriety LOG: Date string invalide ou absente, retour 0 jours."); // LOG S_CALC_2
         return 0;
     }
     try {
         const start = new Date(startDateString);
         // Vérifier si la date parsée est valide
         if (isNaN(start.getTime())) {
             console.warn("Sobriety LOG: La chaîne de date fournie est invalide après parsing:", startDateString); // LOG S_CALC_WARN1
             // Optionnel: Tenter de supprimer la date invalide du stockage?
             // saveSobrietyStartDate(null); // Attention: peut effacer une date valide corrompue juste à la lecture
             return 0;
         }

         // Comparaison en UTC jour complet
         const startUTC = Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate());
         const now = new Date();
         const nowUTC = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());

         if (isNaN(startUTC) || isNaN(nowUTC)) { // Sécurité supplémentaire
             console.error("Sobriety LOG ERROR: Échec création date UTC pour comparaison."); // LOG S_CALC_ERR1
             return 0;
         }

         const diff = nowUTC - startUTC; // Différence en millisecondes
         const oneDayMs = 1000 * 60 * 60 * 24;
         const calculatedDays = diff >= 0 ? Math.floor(diff / oneDayMs) : 0;
         console.log(`Sobriety LOG: Jours calculés: ${calculatedDays}`); // LOG S_CALC_3
         return calculatedDays;

     } catch (e) {
         console.error("Sobriety LOG ERROR: Erreur dans calculateSoberDays:", e); // LOG S_CALC_ERR2
         return 0;
     }
}


/** Affiche l'interface du suivi de sobriété (Compteur OU Bouton Start). */
function renderSobrietyCounter(containerElement, startDate) { // startDate est un string ISO ou null
    console.log("Sobriety LOG: Début renderSobrietyCounter, startDate:", startDate); // LOG S_RENDER_1
    if (!containerElement) { console.error("Sobriety LOG ERROR: Conteneur tracker introuvable."); return; } // LOG S_RENDER_ERR1
    containerElement.innerHTML = '';
    containerElement.classList.add('sobriety-counter-styles');

    if (startDate) {
        const days = calculateSoberDays(startDate); // Appel fonction loggée
        console.log(`Sobriety LOG: Affichage ${days} jours.`); // LOG S_RENDER_2
        const p = document.createElement('p');
        const strong = document.createElement('strong');
        strong.textContent = days;
        p.appendChild(document.createTextNode('Vous êtes sobre depuis '));
        p.appendChild(strong);
        p.appendChild(document.createTextNode(` jour${days !== 1 ? 's' : ''}.`));
        containerElement.appendChild(p);
    } else {
        console.log("Sobriety LOG: Affichage bouton 'Commencer'."); // LOG S_RENDER_3
        const startButton = document.createElement('button');
        startButton.className = 'button-primary';
        startButton.textContent = 'Commencer mon suivi';
        startButton.addEventListener('click', () => {
            console.log("Sobriety LOG: Clic sur 'Commencer'."); // LOG S_CLICK_START
            const nowISO = new Date().toISOString(); // Utiliser ISO string pour sauvegarde
            console.log("Sobriety LOG: Tentative sauvegarde date:", nowISO); // LOG S_CLICK_SAVE
            if (saveSobrietyStartDate(nowISO)) { // Utilise fonction storageUtils
                console.log("Sobriety LOG: Sauvegarde réussie, re-rendu compteur..."); // LOG S_CLICK_SUCCESS
                renderSobrietyCounter(containerElement, nowISO);
            } else {
                 console.error("Sobriety LOG ERROR: Échec sauvegarde date début."); // LOG S_CLICK_ERR
                 // L'alerte est déjà dans saveSobrietyStartDate
            }
        });
        containerElement.appendChild(startButton);
    }
    console.log("Sobriety LOG: Fin renderSobrietyCounter."); // LOG S_RENDER_4
}

/** Initialise la vue Suivi (Motivation + Compteur). */
export function initSobrietyTracker(viewContainerElement) {
    console.log("Sobriety LOG: Initialisation..."); // LOG S_INIT_1
    if (!viewContainerElement) { console.error("Sobriety LOG ERROR: Conteneur #sobrietyView introuvable."); return; } // LOG S_INIT_ERR1

    const motivationContainer = viewContainerElement.querySelector('#dailyMotivation');
    const trackerContainer = viewContainerElement.querySelector('#sobrietyTrackerContainer');

    if (!motivationContainer || !trackerContainer) { console.error("Sobriety LOG ERROR: Conteneurs internes introuvables."); return; } // LOG S_INIT_ERR2

    // Afficher la motivation
    try {
         const motivationP = document.createElement('p');
         motivationP.textContent = getDailyMotivationMessage();
         motivationContainer.innerHTML = '';
         motivationContainer.appendChild(motivationP);
    } catch(e) { console.error("Sobriety LOG ERROR: Erreur affichage motivation:", e)}

    // Afficher le compteur/bouton
    console.log("Sobriety LOG: Appel initial renderSobrietyCounter..."); // LOG S_INIT_3
    try {
         renderSobrietyCounter(trackerContainer, getSobrietyStartDate()); // Utilise fonction storageUtils
         console.log("Sobriety LOG: Fin renderSobrietyCounter initial."); // LOG S_INIT_4
    } catch (e) {
        console.error("Sobriety LOG ERROR: Erreur dans renderSobrietyCounter initial:", e); // LOG S_INIT_ERR3
        if(trackerContainer) trackerContainer.innerHTML = "<p>Erreur chargement suivi.</p>";
    }
    console.log("Sobriety LOG: Initialisation terminée."); // LOG S_INIT_5
}
