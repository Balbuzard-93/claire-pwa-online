// sobrietyTracker.js
import { getSobrietyStartDate, saveSobrietyStartDate } from './storageUtils.js';

// --- Données pour la Motivation Quotidienne ---
const dailyMotivations = [
    "Chaque pas compte, même les plus petits.", "Soyez fier(e) du chemin parcouru aujourd'hui.", "La douceur envers soi-même est une force.",
    "Vous avez en vous les ressources pour faire face.", "Permettez-vous de ressentir, sans jugement.", "Un jour à la fois.",
    "Votre valeur ne dépend pas de votre productivité.", "N'oubliez pas de respirer profondément.", "Le progrès n'est pas linéaire, et c'est normal.",
    "Cherchez la lumière, même dans les moments sombres.", "Faites confiance au processus et à votre résilience.", "Célébrez chaque victoire.",
    "Vous méritez la paix et la sérénité.", "Aujourd'hui est une nouvelle page.", "Le repos est aussi important que l'action.",
    "Écoutez vos besoins avec bienveillance.", "Vous êtes capable de surmonter les obstacles.", "Offrez-vous la même compassion qu'à un ami.",
    "Chaque respiration est une chance de recommencer.", "Croyez en votre capacité à guérir et à grandir.", "La patience est une vertu essentielle.",
    "Soyez curieux de ce que cette journée apporte."
];

/** Calcule le numéro du jour dans l'année (0-365/366). */
function getDayOfYear(date) {
    const start = new Date(date.getFullYear(), 0, 0); // Jour 0 de l'année
    const diff = date.getTime() - start.getTime(); // Différence en ms
    const oneDay = 1000 * 60 * 60 * 24; // ms dans un jour
    return Math.floor(diff / oneDay) - 1; // Index 0 pour le 1er janvier
}

/** Récupère le message de motivation pour le jour actuel. */
function getDailyMotivationMessage() {
    if (!Array.isArray(dailyMotivations) || dailyMotivations.length === 0) {
        return "Passez une excellente journée !"; // Fallback
    }
    const now = new Date();
    const dayIndex = getDayOfYear(now);
    // Utiliser Math.abs pour gérer le cas où dayIndex serait négatif (ne devrait pas arriver)
    const messageIndex = Math.abs(dayIndex % dailyMotivations.length);
    return dailyMotivations[messageIndex];
}

/**
 * Calcule le nombre de jours complets écoulés depuis une date donnée (en UTC).
 * @param {string | null} startDateString - La date de début au format ISO string, ou null.
 * @returns {number} Le nombre de jours de sobriété.
 */
export function calculateSoberDays(startDateString) {
     if (!startDateString) return 0;
     try {
         // Convertir la date de début ISO en timestamp UTC à minuit
         const start = new Date(startDateString);
         // Vérifier si la date est valide avant d'appeler les méthodes UTC
         if (isNaN(start.getTime())) {
             console.warn("Date de début invalide reçue:", startDateString);
             return 0;
         }
         const startUTC = Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate());

         // Obtenir le timestamp UTC actuel à minuit
         const now = new Date();
         const nowUTC = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());

         if (isNaN(startUTC) || isNaN(nowUTC)) return 0; // Double sécurité

         const diff = nowUTC - startUTC; // Différence en millisecondes
         const oneDayMs = 1000 * 60 * 60 * 24;
         return diff >= 0 ? Math.floor(diff / oneDayMs) : 0;
     } catch (e) {
         console.error("Erreur calcul jours de sobriété:", e);
         return 0;
     }
}


/**
 * Affiche l'interface du suivi de sobriété (Compteur OU Bouton Start).
 * @param {HTMLElement} containerElement - L'élément où afficher le tracker (#sobrietyTrackerContainer).
 * @param {string|null} startDate - La date de début récupérée (ISO string).
 */
function renderSobrietyCounter(containerElement, startDate) {
    if (!containerElement) return;
    containerElement.innerHTML = ''; // Nettoyer
    containerElement.classList.add('sobriety-counter-styles'); // Appliquer styles

    if (startDate) {
        const days = calculateSoberDays(startDate);
        // Créer les éléments de manière sécurisée
        const p = document.createElement('p');
        const strong = document.createElement('strong');
        strong.textContent = days; // Sécurisé
        // Utiliser createTextNode pour le texte statique
        p.appendChild(document.createTextNode('Vous êtes sobre depuis '));
        p.appendChild(strong);
        p.appendChild(document.createTextNode(` jour${days !== 1 ? 's' : ''}.`));
        containerElement.appendChild(p);

    } else {
        const startButton = document.createElement('button');
        startButton.className = 'button-primary'; // Standardiser bouton
        startButton.textContent = 'Commencer mon suivi';
        startButton.addEventListener('click', () => {
            const nowISO = new Date().toISOString(); // Format standard pour sauvegarde
            if (saveSobrietyStartDate(nowISO)) {
                renderSobrietyCounter(containerElement, nowISO); // Re-render avec la nouvelle date
            }
            // L'erreur est gérée (alerte) dans saveSobrietyStartDate
        });
        containerElement.appendChild(startButton);
    }
}

/**
 * Initialise la vue Suivi (Motivation + Compteur).
 * @param {HTMLElement} viewContainerElement - L'élément conteneur de la vue entière (#sobrietyView).
 */
export function initSobrietyTracker(viewContainerElement) {
    if (!viewContainerElement) { console.error("Conteneur #sobrietyView introuvable."); return; }

    const motivationContainer = viewContainerElement.querySelector('#dailyMotivation');
    const trackerContainer = viewContainerElement.querySelector('#sobrietyTrackerContainer');

    if (!motivationContainer || !trackerContainer) { console.error("Conteneurs internes #dailyMotivation ou #sobrietyTrackerContainer introuvables."); return; }

    // Afficher la motivation quotidienne (sécurisé)
    const motivationP = document.createElement('p');
    motivationP.textContent = getDailyMotivationMessage();
    motivationContainer.innerHTML = ''; // Vider au cas où
    motivationContainer.appendChild(motivationP);

    // Afficher le compteur ou le bouton
    renderSobrietyCounter(trackerContainer, getSobrietyStartDate());
}