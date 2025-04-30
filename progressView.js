// progressView.js (Version avec import corrigé)
import { getSobrietyStartDate, getAllMoodEntries, getEarnedBadgesFromStorage, saveEarnedBadgesToStorage } from './storageUtils.js'; // <<<=== IMPORT CORRIGÉ ICI
import { calculateSoberDays } from './sobrietyTracker.js';
import { checkAndStoreEarnedBadges, getBadgeDetails } from './badges.js';

let moodChartInstance = null;
const CHART_DAYS = 30; // Nombre de jours à afficher sur le graphique

/**
 * Affiche le nombre de jours de sobriété.
 * @param {HTMLElement} container - L'élément où afficher l'information.
 */
function displaySobrietyProgress(container) {
    if (!container) return;
    const startDate = getSobrietyStartDate();
    let message = "";
    if (startDate) {
        const daysSober = calculateSoberDays(startDate);
        // Utiliser textContent et appendChild pour la sécurité
        const p = document.createElement('p');
        const strong = document.createElement('strong');
        strong.textContent = daysSober;
        p.appendChild(document.createTextNode('Félicitations ! Vous êtes sobre depuis '));
        p.appendChild(strong);
        p.appendChild(document.createTextNode(` jour${daysSober !== 1 ? 's' : ''}. Continuez comme ça ! 💪`));
        container.innerHTML = ''; // Vider avant d'ajouter
        container.appendChild(p);
    } else {
        container.innerHTML = '<p>Commencez votre suivi de sobriété pour voir votre progression ici.</p>';
    }
}

/**
 * Prépare les données des X derniers jours pour Chart.js.
 * @returns {object | null} Un objet { labels: [], datasets: [] } ou null si pas assez de données.
 */
async function prepareMoodChartData() { // Rendre async car utilise getAllMoodEntries
    let entries = [];
    try {
         entries = await getAllMoodEntries(); // Utilise la fonction correcte exportée
         if (!Array.isArray(entries)) entries = []; // Assurer que c'est un tableau
    } catch(error) {
         console.error("Erreur récupération getAllMoodEntries pour graphique:", error);
         return null; // Pas de données si erreur
    }

    if (entries.length === 0) {
        // console.log("prepareMoodChartData: Aucune entrée d'humeur.");
        return null;
    }

    // Créer une date de coupure en UTC pour comparaison fiable
    const cutoffDate = new Date();
    cutoffDate.setUTCDate(cutoffDate.getUTCDate() - CHART_DAYS);
    const cutoffDateString = cutoffDate.toISOString().split('T')[0];

    const recentEntries = entries
        .filter(entry => entry && entry.date && entry.date >= cutoffDateString) // Filtrer dates valides et récentes
        .sort((a, b) => a.date.localeCompare(b.date)); // Tri chronologique (YYYY-MM-DD)

    if (recentEntries.length === 0) {
        // console.log("prepareMoodChartData: Aucune entrée récente.");
        return null;
    }

    const labels = recentEntries.map(entry => {
        try {
             const [year, month, day] = entry.date.split('-').map(Number);
             const dateObj = new Date(Date.UTC(year, month - 1, day));
             return dateObj.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });
        } catch (e) { return '??/??'; }
    });

    // S'assurer que les données sont bien des nombres ou null
    const moodData = recentEntries.map(entry => typeof entry.mood === 'number' ? entry.mood : null);
    const energyData = recentEntries.map(entry => typeof entry.energy === 'number' ? entry.energy : null);
    const anxietyData = recentEntries.map(entry => typeof entry.anxiety === 'number' ? entry.anxiety : null);

    return {
        labels: labels,
        datasets: [
            { label: 'Humeur (1-5)', data: moodData, borderColor: '#6A5ACD', backgroundColor: 'rgba(106, 90, 205, 0.1)', tension: 0.1, yAxisID: 'yMood', spanGaps: true },
            { label: 'Énergie (1-3)', data: energyData, borderColor: '#FFA07A', backgroundColor: 'rgba(255, 160, 122, 0.1)', tension: 0.1, yAxisID: 'yEnergyAnxiety', spanGaps: true },
            { label: 'Anxiété (1-3)', data: anxietyData, borderColor: '#3CB371', backgroundColor: 'rgba(60, 179, 113, 0.1)', tension: 0.1, yAxisID: 'yEnergyAnxiety', spanGaps: true }
        ]
    };
}

/**
 * Crée ou met à jour le graphique d'humeur.
 * @param {object | null} chartData - Les données formatées par prepareMoodChartData.
 */
function renderOrUpdateMoodChart(chartData) {
    const chartContainer = document.getElementById('moodChartContainer');
    if (!chartContainer) { console.error("Conteneur de graphique introuvable."); return; }

     // Gérer l'état sans données
     if (!chartData || !chartData.labels || chartData.labels.length === 0) {
         if (moodChartInstance) { moodChartInstance.destroy(); moodChartInstance = null; }
         chartContainer.innerHTML = "<p>Pas assez de données d'humeur récentes pour afficher le graphique.</p>";
         return;
     }

     // Si on a des données, s'assurer que le canvas existe
      let canvas = document.getElementById('moodChartCanvas');
      if (!canvas) {
          chartContainer.innerHTML = '<canvas id="moodChartCanvas"></canvas>';
          canvas = document.getElementById('moodChartCanvas');
          if (!canvas) { console.error("Impossible de créer/trouver le canvas."); return; }
          if (moodChartInstance) { moodChartInstance.destroy(); moodChartInstance = null; }
      }
     const ctx = canvas.getContext('2d');
     if (!ctx) { console.error("Impossible d'obtenir le contexte 2D du canvas."); return; }


    const config = {
        type: 'line',
        data: chartData,
        options: {
            responsive: true, maintainAspectRatio: false,
            plugins: { title: { display: true, text: `Tendances Humeur / Énergie / Anxiété (${CHART_DAYS} derniers jours)` }, legend: { position: 'top' }, tooltip: { mode: 'index', intersect: false } },
            scales: { x: { display: true, title: { display: false, text: 'Date' } }, yMood: { type: 'linear', display: true, position: 'left', min: 0.5, max: 5.5, title: { display: true, text: 'Humeur (1-5)' } }, yEnergyAnxiety: { type: 'linear', display: true, position: 'right', min: 0.5, max: 3.5, title: { display: true, text: 'Énergie / Anx. (1-3)' }, grid: { drawOnChartArea: false } } },
            interaction: { mode: 'nearest', axis: 'x', intersect: false }
        }
    };

    if (moodChartInstance) {
        moodChartInstance.data = config.data;
        moodChartInstance.options = config.options;
        moodChartInstance.update();
    } else {
        moodChartInstance = new Chart(ctx, config);
    }
}


/**
 * Met à jour et affiche les badges gagnés.
 */
function displayBadges() {
    const badgesListContainer = document.getElementById('badgesList');
    if (!badgesListContainer) return;
    badgesListContainer.innerHTML = '';

    const startDate = getSobrietyStartDate();
    if (!startDate) { badgesListContainer.innerHTML = '<p>Commencez votre suivi pour débloquer des badges !</p>'; return; }

    const soberDays = calculateSoberDays(startDate);
    const previouslyEarnedIds = getEarnedBadgesFromStorage();
    const { newlyEarnedIds, totalEarnedIds } = checkAndStoreEarnedBadges(soberDays, previouslyEarnedIds);

    const sortedTotal = [...totalEarnedIds].sort();
    const sortedPrevious = [...previouslyEarnedIds].sort();
    if (JSON.stringify(sortedTotal) !== JSON.stringify(sortedPrevious)) {
        saveEarnedBadgesToStorage(totalEarnedIds);
        console.log("Nouvelle liste de badges sauvegardée :", totalEarnedIds);
    }

    // --- Notification des nouveaux badges (alerte simple) ---
    if (newlyEarnedIds.length > 0) {
         setTimeout(() => {
              newlyEarnedIds.forEach(newId => {
                  const details = getBadgeDetails(newId);
                   if (details) alert(`✨ Nouveau badge débloqué ! ✨\n\n${details.icon} ${details.name}\n"${details.description}"`);
              });
         }, 500);
    }
    // --- Fin Notification ---

    if (totalEarnedIds.length === 0) {
        badgesListContainer.innerHTML = '<p>Continuez votre parcours pour gagner vos premiers badges !</p>';
    } else {
        const sortedEarnedBadges = totalEarnedIds.map(getBadgeDetails).filter(Boolean).sort((a, b) => a.requiredDays - b.requiredDays);
        sortedEarnedBadges.forEach(badgeDetails => {
            const badgeDiv = document.createElement('div');
            badgeDiv.className = 'badge-item';
             const nameSpan = document.createElement('span'); nameSpan.className = 'badge-name'; nameSpan.textContent = badgeDetails.name;
             const descSpan = document.createElement('span'); descSpan.className = 'badge-description'; descSpan.textContent = badgeDetails.description;
            badgeDiv.innerHTML = `<span class="badge-icon" aria-hidden="true">${badgeDetails.icon}</span><div class="badge-info">${nameSpan.outerHTML}${descSpan.outerHTML}</div>`;
            badgesListContainer.appendChild(badgeDiv);
        });
    }
}


/** Fonction appelée pour rafraîchir TOUTES les données de cette vue (devient async). */
export async function refreshCharts() { // Rendre async à cause de prepareMoodChartData
    const sobrietyContainer = document.getElementById('sobrietyProgress');
    const chartContainer = document.getElementById('moodChartContainer');
    const badgesContainer = document.getElementById('badgesDisplay');
    if (!sobrietyContainer || !chartContainer || !badgesContainer) { return; }

    displaySobrietyProgress(sobrietyContainer);
    displayBadges();
    try {
         // Mettre dans un try/catch au cas où la préparation des données échoue
         const moodData = await prepareMoodChartData(); // Attendre les données
         renderOrUpdateMoodChart(moodData);
    } catch(error) {
         console.error("Erreur lors de la préparation/rendu du graphique d'humeur:", error);
         renderOrUpdateMoodChart(null); // Afficher message d'erreur/pas de données
    }
}

/** Initialise la vue Progrès (devient async). */
export async function initProgressView(containerElement) { // Rendre async
    if (!containerElement) { console.error("Conteneur vue Progrès introuvable."); return; }
    containerElement.innerHTML = `
        <h2>Mes Progrès</h2>
        <div id="sobrietyProgress" class="progress-section"></div>
        <div id="badgesDisplay" class="progress-section"><h3>Mes Badges</h3><div id="badgesList"></div></div>
        <div id="moodChartContainer" class="progress-section chart-container"><p>Chargement du graphique...</p></div>`; // Message initial
    await refreshCharts(); // Attendre le premier rendu/calcul
}
