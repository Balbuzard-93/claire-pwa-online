// consumptionView.js (Anciennement sobrietyTracker.js - Refonte pour suivi consommation et export calculateSoberDays)
import { getAlcoholLogForDate, saveAlcoholLogForDate, getCurrentDateString } from './storageUtils.js';
import { getDailyMotivationMessage } from './motivationUtils.js';

// Définition des unités d'alcool par type de boisson
const DRINK_UNIT_VALUES = {
    biere_legere_25cl_4pct: 1.0, biere_standard_33cl_5pct: 1.6, biere_forte_33cl_8pct: 2.6, biere_pinte_50cl_5pct: 2.5,
    vin_verre_12cl_12pct: 1.4, vin_verre_15cl_12pct: 1.8,
    spiritueux_shot_3cl_40pct: 1.2, spiritueux_shot_4cl_40pct: 1.6,
    cocktail_leger: 1.5, cocktail_moyen: 2.0, cocktail_fort: 3.0,
    cidre_doux_25cl_3pct: 0.75, cidre_brut_25cl_5pct: 1.25
};
const DRINK_NAMES = {
    biere_legere_25cl_4pct: "Bière Légère (25cl, 4%)", biere_standard_33cl_5pct: "Bière Standard (33cl, 5%)", biere_forte_33cl_8pct: "Bière Forte (33cl, 8%)", biere_pinte_50cl_5pct: "Bière Pinte (50cl, 5%)",
    vin_verre_12cl_12pct: "Vin (Verre 12cl, 12%)", vin_verre_15cl_12pct: "Vin (Grand Verre 15cl, 12%)",
    spiritueux_shot_3cl_40pct: "Spiritueux (Shot 3cl, 40%)", spiritueux_shot_4cl_40pct: "Spiritueux (Dose 4cl, 40%)",
    cocktail_leger: "Cocktail Léger", cocktail_moyen: "Cocktail Moyen", cocktail_fort: "Cocktail Fort",
    cidre_doux_25cl_3pct: "Cidre Doux (25cl, 3%)", cidre_brut_25cl_5pct: "Cidre Brut (25cl, 5%)"
};

let todayStringForConsumption = ''; // Renommer pour éviter conflit avec d'autres todayString
let todaysLog = null;
let drinksForToday = [];

/** Calcule le total des unités. */
function calculateTotalUnits(drinksArray) { if (!Array.isArray(drinksArray)) return 0; return drinksArray.reduce((total, drink) => total + (drink.count * drink.unitValue), 0); }

/** Affiche les consommations du jour. */
function renderTodaysConsumption(container) {
    if (!container) return; container.innerHTML = '';
    const totalUnits = calculateTotalUnits(drinksForToday);
    const summaryP = document.createElement('p'); summaryP.className = 'consumption-summary'; summaryP.innerHTML = `Unités enregistrées : <strong>${totalUnits.toFixed(1)}</strong>`; container.appendChild(summaryP);
    if (drinksForToday.length > 0) {
        const ul = document.createElement('ul'); ul.className = 'todays-drinks-list';
        drinksForToday.forEach((drink, index) => {
            const li = document.createElement('li'); const txtN = document.createTextNode(`${drink.count} x ${drink.name} `); const uS = document.createElement('span'); uS.textContent = `(${(drink.count * drink.unitValue).toFixed(1)} u.)`; const delB = document.createElement('button'); delB.className = 'delete-drink-btn button-delete'; delB.innerHTML = '×'; delB.title = 'Supprimer'; delB.dataset.index = index; delB.setAttribute('aria-label', `Supprimer ${drink.count}x ${drink.name}`);
            li.appendChild(txtN); li.appendChild(uS); li.appendChild(delB); ul.appendChild(li);
        });
        container.appendChild(ul);
        ul.querySelectorAll('.delete-drink-btn').forEach(btn => { btn.addEventListener('click', (e) => { const idx = parseInt(e.target.dataset.index); if (!isNaN(idx)) { drinksForToday.splice(idx, 1); renderTodaysConsumption(container); } }); });
    } else { const p=document.createElement('p'); p.textContent = 'Aucune consommation ajoutée.'; container.appendChild(p); }
}

/** Ajoute une boisson à la liste temporaire. */
function addDrinkToDailyList(typeSelect, countInput, todaysConsumptionDiv) {
    if (!typeSelect || !countInput || !todaysConsumptionDiv) return;
    const drinkTypeKey = typeSelect.value; const count = parseInt(countInput.value);
    if (!drinkTypeKey) { alert("Sélectionnez une boisson."); return; }
    if (isNaN(count) || count <= 0 || count > 99) { alert("Nombre invalide (1-99)."); return; }
    const unitValue = DRINK_UNIT_VALUES[drinkTypeKey]; const drinkName = DRINK_NAMES[drinkTypeKey] || drinkTypeKey;
    if (typeof unitValue === 'undefined') { alert("Type de boisson non reconnu."); return; }
    drinksForToday.push({ typeKey: drinkTypeKey, count: count, unitValue: unitValue, name: drinkName });
    typeSelect.value = ''; countInput.value = '1';
    renderTodaysConsumption(todaysConsumptionDiv);
}

/** Sauvegarde le log du jour. */
async function saveDailyLog(dateStr, consumptionContainer) {
    const totalUnits = calculateTotalUnits(drinksForToday);
    const logData = { totalUnits: parseFloat(totalUnits.toFixed(1)), drinks: [...drinksForToday] };
    const saveBtn = document.getElementById('saveDayLogBtn'); if(saveBtn) saveBtn.disabled = true;
    try {
        await saveAlcoholLogForDate(dateStr, logData);
        todaysLog = { date: dateStr, ...logData };
        alert(`Consommation du ${new Date(dateStr+'T00:00:00Z').toLocaleDateString('fr-FR')} enregistrée.`);
    } catch (e) { console.error("Err save log alcool:", e); alert("Erreur enregistrement conso."); }
    finally { if(saveBtn) saveBtn.disabled = false; }
}

/** Charge le log du jour et initialise l'UI. */
async function loadAndRenderDay(viewContainerElement) {
    if (!viewContainerElement) return;
    todayStringForConsumption = getCurrentDateString(); // Utilise la variable renommée
    // console.log("Consumption LOG: Chargement pour date:", todayStringForConsumption);

    const motivationContainer = viewContainerElement.querySelector('#dailyMotivation');
    const formContainer = viewContainerElement.querySelector('#consumptionFormContainer');
    const todaysConsumptionDiv = viewContainerElement.querySelector('#todaysConsumption');
    if (!motivationContainer || !formContainer || !todaysConsumptionDiv) { console.error("Elts UI consumptionView manquants."); return; }

    try { const p = document.createElement('p'); p.textContent = getDailyMotivationMessage(); motivationContainer.innerHTML = ''; motivationContainer.appendChild(p); } catch(e){}
    let optsHtml = '<option value="">-- Boisson --</option>'; Object.keys(DRINK_NAMES).forEach(key => { optsHtml += `<option value="${key}">${DRINK_NAMES[key]}</option>`; });
    formContainer.innerHTML = `<div class="consumption-input-group"><label for="drinkTypeSelect">Type:</label><select id="drinkTypeSelect">${optsHtml}</select></div><div class="consumption-input-group"><label for="drinkCountInput">Nombre:</label><input type="number" id="drinkCountInput" value="1" min="1" max="50"></div><button id="addDrinkBtn" class="button-secondary">Ajouter Boisson</button><button id="saveDayLogBtn" class="button-primary">Enregistrer Journée</button>`;

    try {
        todaysLog = await getAlcoholLogForDate(todayStringForConsumption);
        drinksForToday = (todaysLog && Array.isArray(todaysLog.drinks)) ? [...todaysLog.drinks] : [];
    } catch (e) { console.error("Err load log alcool:", e); drinksForToday = []; todaysLog = null; }
    renderTodaysConsumption(todaysConsumptionDiv);

    const addBtn = formContainer.querySelector('#addDrinkBtn'); const saveBtn = formContainer.querySelector('#saveDayLogBtn');
    const typeSel = formContainer.querySelector('#drinkTypeSelect'); const countIn = formContainer.querySelector('#drinkCountInput');
    if (addBtn && typeSel && countIn) { addBtn.addEventListener('click', () => addDrinkToDailyList(typeSel, countIn, todaysConsumptionDiv)); }
    if (saveBtn) { saveBtn.addEventListener('click', async () => await saveDailyLog(todayStringForConsumption, todaysConsumptionDiv)); }
}

// *** FONCTION POUR LES BADGES (anciennement calculateSoberDays) ***
const SOBRIETY_TARGET_START_DATE_KEY_FOR_BADGES = 'claireAppSobrietyTargetStartDate';

export function calculateSoberDays() { // Garder ce nom pour compatibilité avec progressView
    const startDateString = localStorage.getItem(SOBRIETY_TARGET_START_DATE_KEY_FOR_BADGES);
    // console.log(`ConsumptionView LOG: calculateSoberDays - startDateString from LS: [${startDateString}]`);
    if (!startDateString || typeof startDateString !== 'string') return 0;
    try {
        const start = new Date(startDateString); if (isNaN(start.getTime())) return 0;
        const startUTC = Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate());
        const now = new Date(); const nowUTC = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
        if (isNaN(startUTC) || isNaN(nowUTC)) return 0;
        const diff = nowUTC - startUTC; const oneDayMs = 86400000;
        const days = diff >= 0 ? Math.floor(diff / oneDayMs) : 0;
        // console.log(`ConsumptionView LOG: calculateSoberDays - Jours calculés: ${days}`);
        return days;
    } catch (e) { console.error("ConsumptionView LOG ERROR: Erreur dans calculateSoberDays:", e); return 0; }
}

export function setSobrietyTargetStartDate(dateISOString = null) {
    if (dateISOString === null) { localStorage.removeItem(SOBRIETY_TARGET_START_DATE_KEY_FOR_BADGES); console.log("Date objectif badges supprimée."); }
    else if (typeof dateISOString === 'string' && new Date(dateISOString).toString() !== "Invalid Date") { localStorage.setItem(SOBRIETY_TARGET_START_DATE_KEY_FOR_BADGES, dateISOString); console.log("Date objectif badges définie:", dateISOString); }
    else { console.error("Tentative de définir une date objectif invalide."); }
}

/** Initialise la vue Suivi de Consommation. */
export async function initConsumptionView(viewContainerElement) {
    // console.log("Consumption LOG: Initialisation...");
    if (!viewContainerElement) { console.error("Conteneur #consumptionView introuvable."); return; }

    let setBadgeDateButtonHtml = '';
    if (!localStorage.getItem(SOBRIETY_TARGET_START_DATE_KEY_FOR_BADGES)) {
        console.log("ConsumptionView LOG: Aucune date objectif pour badges. Proposer bouton.");
        setBadgeDateButtonHtml = `<p><button id="setTodayAsBadgeStartDateBtn" class="button-link-style">Définir aujourd'hui comme début pour les badges d'abstinence ?</button></p>`;
    }

    viewContainerElement.innerHTML = `
        <div id="dailyMotivation" class="motivation-section"></div>
        <h2>Suivi de Consommation</h2>
        <p class="consumption-intro">Enregistrez ici votre consommation journalière.</p>
        ${setBadgeDateButtonHtml}
        <div id="consumptionFormContainer"></div>
        <div id="todaysConsumption" class="todays-consumption-summary"></div>
    `;

    const setBadgeDateBtn = viewContainerElement.querySelector('#setTodayAsBadgeStartDateBtn');
    if (setBadgeDateBtn) {
         setBadgeDateBtn.addEventListener('click', () => {
              if (confirm("Définir aujourd'hui comme date de départ pour les badges (basés sur 0 conso) ?")) {
                   setSobrietyTargetStartDate(new Date().toISOString());
                   alert("Date de départ pour les badges définie à aujourd'hui.");
                   setBadgeDateBtn.style.display = 'none'; // Cacher le bouton après clic
              }
         });
    }

    try { await loadAndRenderDay(viewContainerElement); }
    catch (error) { console.error("Erreur init ConsumptionView:", error); const tc=viewContainerElement.querySelector('#todaysConsumption'); if(tc)tc.innerHTML="<p>Erreur chargement.</p>"; }
    // console.log("Consumption LOG: Initialisation terminée.");
}
