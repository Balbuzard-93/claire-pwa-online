// progressView.js (Avec import corrigé pour calculateSoberDays)
import { getAllMoodEntries, getAllAlcoholLogs, getEarnedBadgesFromStorage, saveEarnedBadgesToStorage } from './storageUtils.js';
import { calculateSoberDays } from './consumptionView.js'; // <<< IMPORT CORRIGÉ ICI
import { getBadgeDetails, checkAndStoreEarnedBadges, badgeDefinitions } from './badges.js';

let moodChartInstance = null;
let consumptionChartInstance = null;
const CHART_DAYS = 30;

// --- Fonctions de Calcul de Statistiques (inchangées) ---
function calculateMoodStats(moodLogs, periodInDays) { /* ... (code précédent) ... */ }
function calculateConsumptionStats(alcoholLogs, periodInDays) { /* ... (code précédent) ... */ }

// --- Fonctions d'Affichage des Statistiques (inchangées) ---
function displayMoodStats(container, stats) { /* ... (code précédent) ... */ }
function displayConsumptionStats(container, stats) { /* ... (code précédent) ... */ }

// --- Fonctions des Graphiques (inchangées) ---
async function prepareConsumptionChartData() { /* ... (code précédent) ... */ }
function renderOrUpdateConsumptionChart(chartData) { /* ... (code précédent) ... */ }
async function prepareMoodChartData() { /* ... (code précédent) ... */ }
function renderOrUpdateMoodChart(chartData) { /* ... (code précédent) ... */ }

/** Affiche les badges (basé sur calculateSoberDays de consumptionView) */
function displayBadges() {
    const badgesListContainer = document.getElementById('badgesList');
    if (!badgesListContainer) return;
    badgesListContainer.innerHTML = '';

    // Utiliser calculateSoberDays importé (qui lit maintenant une clé LS spécifique)
    const soberDays = calculateSoberDays(); // Ne prend plus d'argument direct
    // console.log("ProgressView LOG: Jours pour badges (via consumptionView.calculateSoberDays):", soberDays);

    const previouslyEarnedIds = getEarnedBadgesFromStorage();
    // checkAndStoreEarnedBadges va utiliser badgeDefinitions importé
    const { newlyEarnedIds, totalEarnedIds } = checkAndStoreEarnedBadges(soberDays, previouslyEarnedIds);

    const sortedTotal = [...totalEarnedIds].sort();
    const sortedPrevious = [...previouslyEarnedIds].sort();
    if (JSON.stringify(sortedTotal) !== JSON.stringify(sortedPrevious)) {
        saveEarnedBadgesToStorage(totalEarnedIds);
        // console.log("Nouvelle liste de badges sauvegardée :", totalEarnedIds);
    }

    if (newlyEarnedIds.length > 0) {
         setTimeout(() => {
              newlyEarnedIds.forEach(newId => {
                  const details = getBadgeDetails(newId);
                   if (details) alert(`✨ Nouveau badge débloqué ! ✨\n\n${details.icon} ${details.name}\n"${details.description}"`);
              });
         }, 500);
    }

    if (badgeDefinitions.length === 0) { // Vérifier si des badges sont définis
        badgesListContainer.innerHTML = '<p>Aucun objectif de badge défini.</p>';
        return;
    }

    if (totalEarnedIds.length === 0 && soberDays === 0 && !localStorage.getItem('claireAppSobrietyTargetStartDate')) {
         badgesListContainer.innerHTML = '<p>Définissez un objectif de début (via la vue "Suivi Conso.") pour commencer à gagner des badges.</p>';
    } else if (totalEarnedIds.length === 0) {
         badgesListContainer.innerHTML = '<p>Continuez votre parcours pour gagner vos premiers badges !</p>';
    }

    // Afficher tous les badges définis, en marquant ceux gagnés
    const sortedDefinitions = [...badgeDefinitions].sort((a, b) => a.requiredDays - b.requiredDays);
    sortedDefinitions.forEach(badgeDef => {
        const badgeDiv = document.createElement('div');
        badgeDiv.className = 'badge-item';
        const isEarned = totalEarnedIds.includes(badgeDef.id);
        if (isEarned) badgeDiv.classList.add('earned'); else badgeDiv.classList.add('locked');
        const nameSpan = document.createElement('span'); nameSpan.className = 'badge-name'; nameSpan.textContent = badgeDef.name;
        const descSpan = document.createElement('span'); descSpan.className = 'badge-description'; descSpan.textContent = badgeDef.description;
        const iconSpan = document.createElement('span'); iconSpan.className = 'badge-icon'; iconSpan.setAttribute('aria-hidden', 'true'); iconSpan.textContent = badgeDef.icon;
        const requirementSpan = document.createElement('span'); requirementSpan.className = 'badge-requirement';
        if (!isEarned) { requirementSpan.textContent = `(Objectif : ${badgeDef.requiredDays} jours)`; }
        else { requirementSpan.textContent = `(Débloqué ! 🎉)`; }
        badgeDiv.appendChild(iconSpan); const infoDiv = document.createElement('div'); infoDiv.className = 'badge-info';
        infoDiv.appendChild(nameSpan); infoDiv.appendChild(descSpan); infoDiv.appendChild(requirementSpan); badgeDiv.appendChild(infoDiv);
        badgesListContainer.appendChild(badgeDiv);
    });
}

/** Fonction de rafraîchissement (inchangée) */
export async function refreshCharts() { /* ... (code précédent) ... */ }
/** Initialise la vue Progrès (inchangée) */
export async function initProgressView(containerElement) { /* ... (code précédent) ... */ }
