// progressView.js (Avec import corrigé pour calculateSoberDays et logique badges simplifiée)
import { getAllMoodEntries, getAllAlcoholLogs, getEarnedBadgesFromStorage, saveEarnedBadgesToStorage } from './storageUtils.js';
import { calculateSoberDays } from './consumptionView.js'; // <<< IMPORT CORRIGÉ/VÉRIFIÉ
import { getBadgeDetails, checkAndStoreEarnedBadges, badgeDefinitions } from './badges.js'; // Importer badgeDefinitions pour l'affichage

let moodChartInstance = null;
let consumptionChartInstance = null;
const CHART_DAYS = 30; // Période pour les graphiques

// --- Fonctions de Calcul de Statistiques (Humeur et Consommation - inchangées par rapport à l'étape 3.2) ---
function calculateMoodStats(moodLogs, periodInDays) { /* ... (code précédent) ... */
    if (!Array.isArray(moodLogs) || moodLogs.length === 0) return null;
    const today = new Date(); const startDate = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()-(periodInDays-1))); const startDateString = `${startDate.getUTCFullYear()}-${(startDate.getUTCMonth()+1).toString().padStart(2,'0')}-${startDate.getUTCDate().toString().padStart(2,'0')}`;
    const recentLogs = moodLogs.filter(log => log.date && log.date >= startDateString); if (recentLogs.length === 0) return null;
    let totalMood=0, totalEnergy=0, totalAnxiety=0, moodCount=0, energyCount=0, anxietyCount=0, highMoodDays=0, lowMoodDays=0;
    recentLogs.forEach(log => { if(typeof log.mood==='number'){totalMood+=log.mood; moodCount++; if(log.mood>=4)highMoodDays++; if(log.mood<=2)lowMoodDays++;} if(typeof log.energy==='number'){totalEnergy+=log.energy; energyCount++;} if(typeof log.anxiety==='number'){totalAnxiety+=log.anxiety; anxietyCount++;} });
    return { period:periodInDays, avgMood:moodCount>0?(totalMood/moodCount).toFixed(1):'N/A', avgEnergy:energyCount>0?(totalEnergy/energyCount).toFixed(1):'N/A', avgAnxiety:anxietyCount>0?(totalAnxiety/anxietyCount).toFixed(1):'N/A', highMoodDays:highMoodDays, lowMoodDays:lowMoodDays, daysWithData:moodCount };
}
function calculateConsumptionStats(alcoholLogs, periodInDays) { /* ... (code précédent) ... */
    if (!Array.isArray(alcoholLogs)) return null;
    const today = new Date(); const startDate = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()-(periodInDays-1))); const startDateString = `${startDate.getUTCFullYear()}-${(startDate.getUTCMonth()+1).toString().padStart(2,'0')}-${startDate.getUTCDate().toString().padStart(2,'0')}`;
    const recentLogs = alcoholLogs.filter(log => log.date && log.date >= startDateString); const periodDates = new Set(); for(let i=0; i<periodInDays; i++){const d=new Date(Date.UTC(today.getUTCFullYear(),today.getUTCMonth(),today.getUTCDate()-i)); periodDates.add(`${d.getUTCFullYear()}-${(d.getUTCMonth()+1).toString().padStart(2,'0')}-${d.getUTCDate().toString().padStart(2,'0')}`);}
    let totalUnits=0, daysWithConsumption=0; const loggedDates=new Set(); recentLogs.forEach(log => {if(typeof log.totalUnits==='number'&&log.totalUnits>0){totalUnits+=log.totalUnits; daysWithConsumption++;} if(log.date)loggedDates.add(log.date);});
    let drinkFreeDaysInPeriod=0; periodDates.forEach(dateInPeriod => {const logForDay = recentLogs.find(log => log.date === dateInPeriod); if(!logForDay || (logForDay && logForDay.totalUnits === 0))drinkFreeDaysInPeriod++;});
    return { period:periodInDays, totalUnits:totalUnits.toFixed(1), avgDailyUnits:periodInDays>0?(totalUnits/periodInDays).toFixed(1):'N/A', drinkFreeDays:drinkFreeDaysInPeriod, daysWithConsumptionLog:recentLogs.length};
}

// --- Fonctions d'Affichage des Statistiques (inchangées par rapport à l'étape 3.2) ---
function displayMoodStats(container, stats) { /* ... (code précédent) ... */
    if (!container) return; if (!stats) { container.innerHTML = '<p>Pas de données d\'humeur.</p>'; return; }
    container.innerHTML = `<p><strong>Sur ${stats.period}j :</strong></p><ul><li>Humeur moy: ${stats.avgMood}/5</li><li>Énergie moy: ${stats.avgEnergy}/3</li><li>Anxiété moy: ${stats.avgAnxiety}/3</li><li>Jrs humeur haute: ${stats.highMoodDays}</li><li>Jrs humeur basse: ${stats.lowMoodDays}</li><li>(sur ${stats.daysWithData}j data)</li></ul>`;
}
function displayConsumptionStats(container, stats) { /* ... (code précédent) ... */
    if (!container) return; if (!stats) { container.innerHTML = '<p>Pas de données conso.</p>'; return; }
    container.innerHTML = `<p><strong>Sur ${stats.period}j :</strong></p><ul><li>Total unités: ${stats.totalUnits}</li><li>Moy unités/j: ${stats.avgDailyUnits}</li><li>Jrs sans conso: ${stats.drinkFreeDays}/${stats.period}</li></ul>`;
}

// --- Fonctions des Graphiques (inchangées par rapport à l'étape 2.4.D) ---
async function prepareConsumptionChartData() { /* ... (code précédent) ... */ }
function renderOrUpdateConsumptionChart(chartData) { /* ... (code précédent) ... */ }
async function prepareMoodChartData() { /* ... (code précédent) ... */ }
function renderOrUpdateMoodChart(chartData) { /* ... (code précédent) ... */ }


/** Affiche les badges (Simplifié pour l'instant, basé sur les définitions) */
function displayBadges() {
    const badgesListContainer = document.getElementById('badgesList');
    if (!badgesListContainer) return;
    badgesListContainer.innerHTML = ''; // Vider

    // Pour l'instant, afficher tous les badges définis comme "objectifs"
    // La logique de déblocage sera revue avec le suivi de consommation.
    if (badgeDefinitions.length === 0) {
        badgesListContainer.innerHTML = '<p>Aucun badge défini pour le moment.</p>';
        return;
    }

    // Logique simplifiée : afficher les badges existants (ceux stockés, ou tous si pas de logique de déblocage encore)
    // Pour l'instant, on va afficher les badges *potentiels* et indiquer ceux gagnés
    const earnedBadgeIds = getEarnedBadgesFromStorage(); // On récupère ceux déjà "gagnés"

    // Trier les badgeDefinitions par requiredDays pour un affichage ordonné
    const sortedDefinitions = [...badgeDefinitions].sort((a, b) => a.requiredDays - b.requiredDays);

    sortedDefinitions.forEach(badgeDef => {
        const badgeDiv = document.createElement('div');
        badgeDiv.className = 'badge-item';
        const isEarned = earnedBadgeIds.includes(badgeDef.id);
        if (isEarned) {
            badgeDiv.classList.add('earned'); // Classe pour styler les badges gagnés
        } else {
            badgeDiv.classList.add('locked'); // Classe pour styler les badges non encore gagnés
        }

        const nameSpan = document.createElement('span'); nameSpan.className = 'badge-name'; nameSpan.textContent = badgeDef.name;
        const descSpan = document.createElement('span'); descSpan.className = 'badge-description'; descSpan.textContent = badgeDef.description;
        const iconSpan = document.createElement('span'); iconSpan.className = 'badge-icon'; iconSpan.setAttribute('aria-hidden', 'true'); iconSpan.textContent = badgeDef.icon;

        // Message si non gagné
        const requirementSpan = document.createElement('span');
        requirementSpan.className = 'badge-requirement';
        if (!isEarned) {
             requirementSpan.textContent = `(Objectif : ${badgeDef.requiredDays} jours)`;
        } else {
             requirementSpan.textContent = `(Débloqué ! 🎉)`;
        }


        badgeDiv.appendChild(iconSpan);
        const infoDiv = document.createElement('div');
        infoDiv.className = 'badge-info';
        infoDiv.appendChild(nameSpan);
        infoDiv.appendChild(descSpan);
        infoDiv.appendChild(requirementSpan);
        badgeDiv.appendChild(infoDiv);

        badgesListContainer.appendChild(badgeDiv);
    });

    // NOTE: La logique de 'checkAndStoreEarnedBadges' et la notification de nouveaux badges
    // devront être réintégrées et adaptées si on réintroduit un concept de "jours sobres"
    // ou d'autres critères pour débloquer des badges liés à la consommation.
}


/** Fonction appelée pour rafraîchir TOUTES les données de cette vue. */
export async function refreshCharts() {
    const consumptionChartContainer = document.getElementById('consumptionChartContainer');
    const moodChartContainer = document.getElementById('moodChartContainer');
    const badgesContainer = document.getElementById('badgesDisplay');
    const moodStats7dayContainer = document.getElementById('moodStats7day');
    const moodStats30dayContainer = document.getElementById('moodStats30day');
    const consumptionStats7dayContainer = document.getElementById('consumptionStats7day');
    const consumptionStats30dayContainer = document.getElementById('consumptionStats30day');

    if (!consumptionChartContainer || !moodChartContainer || !badgesContainer || !moodStats7dayContainer || !moodStats30dayContainer || !consumptionStats7dayContainer || !consumptionStats30dayContainer) {
        console.warn("Un ou plusieurs conteneurs de la vue Progrès sont manquants pour le refresh complet.");
    }

    let allMoodLogs = []; let allAlcoholLogs = [];
    try { allMoodLogs = await getAllMoodEntries(); allAlcoholLogs = await getAllAlcoholLogs(); }
    catch (error) { console.error("Erreur chargement données pour stats:", error); }

    // Graphiques
    if(consumptionChartContainer) { try { const d = await prepareConsumptionChartData(); renderOrUpdateConsumptionChart(d); } catch(e){ console.error("Err graph conso:", e); if(consumptionChartContainer) renderOrUpdateConsumptionChart(null); }}
    if(moodChartContainer) { try { const d = await prepareMoodChartData(); renderOrUpdateMoodChart(d); } catch(e){ console.error("Err graph humeur:", e); if(moodChartContainer) renderOrUpdateMoodChart(null); }}

    // Statistiques
    if (moodStats7dayContainer) displayMoodStats(moodStats7dayContainer, calculateMoodStats(allMoodLogs, 7));
    if (moodStats30dayContainer) displayMoodStats(moodStats30dayContainer, calculateMoodStats(allMoodLogs, 30));
    if (consumptionStats7dayContainer) displayConsumptionStats(consumptionStats7dayContainer, calculateConsumptionStats(allAlcoholLogs, 7));
    if (consumptionStats30dayContainer) displayConsumptionStats(consumptionStats30dayContainer, calculateConsumptionStats(allAlcoholLogs, 30));

    if(badgesContainer) displayBadges(); // Afficher les badges
}

/** Initialise la vue Progrès. */
export async function initProgressView(containerElement) {
    if (!containerElement) { console.error("Conteneur vue Progrès introuvable."); return; }
    containerElement.innerHTML = `
        <h2>Mes Progrès et Bilans</h2>
        <div class="progress-grid">
            <div id="moodStatsSection" class="progress-section stats-section">
                <h3>📈 Tendances Humeur</h3>
                <div id="moodChartContainer" class="chart-container-large"><p>Chargement...</p></div>
                <div class="stats-summary"><h4>Résumé Hebdomadaire</h4><div id="moodStats7day"></div><h4>Résumé Mensuel</h4><div id="moodStats30day"></div></div>
            </div>
            <div id="consumptionStatsSection" class="progress-section stats-section">
                <h3>🍷 Suivi Consommation</h3>
                <div id="consumptionChartContainer" class="chart-container-large"><p>Chargement...</p></div>
                 <div class="stats-summary"><h4>Résumé Hebdomadaire</h4><div id="consumptionStats7day"></div><h4>Résumé Mensuel</h4><div id="consumptionStats30day"></div></div>
            </div>
        </div>
        <div id="badgesDisplay" class="progress-section">
            <h3>Mes Badges</h3>
            <div id="badgesList"><p>Chargement des badges...</p></div>
        </div>
    `;
    await refreshCharts();
}
