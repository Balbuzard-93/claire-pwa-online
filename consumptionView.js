// consumptionView.js (Refonte pour suivi consommation)
import { getAlcoholLogForDate, saveAlcoholLogForDate, getCurrentDateString } from './storageUtils.js';
import { getDailyMotivationMessage } from './motivationUtils.js'; // Assurez-vous que ce fichier existe et exporte la fonction

// Définition des unités d'alcool par type de boisson (simplifié)
const DRINK_UNIT_VALUES = {
    // Format: clé_unique: unités_par_verre_standard
    // Bières
    biere_legere_25cl_4pct: 1.0,    // Ex: Bière légère 25cl à 4%
    biere_standard_33cl_5pct: 1.6,  // Ex: Canette/Bouteille standard 33cl à 5%
    biere_forte_33cl_8pct: 2.6,     // Ex: Bière forte 33cl à 8%
    biere_pinte_50cl_5pct: 2.5,   // Ex: Pinte (50cl) à 5%
    // Vins
    vin_verre_12cl_12pct: 1.4,    // Ex: Verre standard 12cl à 12%
    vin_verre_15cl_12pct: 1.8,    // Ex: Grand verre 15cl à 12%
    vin_bouteille_75cl_12pct: 9.0, // Bouteille entière (pour info, pas pour saisie directe)
    // Spiritueux
    spiritueux_shot_3cl_40pct: 1.2, // Ex: Shot/Dose bar 3cl à 40%
    spiritueux_shot_4cl_40pct: 1.6, // Ex: Shot/Dose plus grand 4cl à 40%
    // Cocktails (plus difficile, dépend de la recette, exemple simple)
    cocktail_leger: 1.5,
    cocktail_moyen: 2.0,
    cocktail_fort: 3.0,
    // Cidres
    cidre_doux_25cl_3pct: 0.75,
    cidre_brut_25cl_5pct: 1.25
    // Ajouter d'autres types et tailles si besoin
};

const DRINK_NAMES = { // Noms pour l'affichage dans le select
    biere_legere_25cl_4pct: "Bière Légère (25cl, 4%)",
    biere_standard_33cl_5pct: "Bière Standard (33cl, 5%)",
    biere_forte_33cl_8pct: "Bière Forte (33cl, 8%)",
    biere_pinte_50cl_5pct: "Bière Pinte (50cl, 5%)",
    vin_verre_12cl_12pct: "Vin (Verre 12cl, 12%)",
    vin_verre_15cl_12pct: "Vin (Grand Verre 15cl, 12%)",
    spiritueux_shot_3cl_40pct: "Spiritueux (Shot 3cl, 40%)",
    spiritueux_shot_4cl_40pct: "Spiritueux (Dose 4cl, 40%)",
    cocktail_leger: "Cocktail Léger",
    cocktail_moyen: "Cocktail Moyen",
    cocktail_fort: "Cocktail Fort",
    cidre_doux_25cl_3pct: "Cidre Doux (25cl, 3%)",
    cidre_brut_25cl_5pct: "Cidre Brut (25cl, 5%)"
};


let todayString = '';
let todaysLog = null; // Structure: { date, totalUnits, drinks: [{typeKey, count, unitValue, name}] }
let drinksForToday = []; // Liste temporaire des boissons ajoutées pour la journée en cours de saisie

/** Calcule le total des unités pour la liste de boissons actuelle. */
function calculateTotalUnits(drinksArray) {
    if (!Array.isArray(drinksArray)) return 0;
    return drinksArray.reduce((total, drink) => total + (drink.count * drink.unitValue), 0);
}

/** Affiche les boissons déjà ajoutées pour aujourd'hui et le total d'unités. */
function renderTodaysConsumption(container) {
    if (!container) return;
    container.innerHTML = ''; // Vider pour re-rendre

    const totalUnits = calculateTotalUnits(drinksForToday);

    const summaryP = document.createElement('p');
    summaryP.className = 'consumption-summary';
    summaryP.innerHTML = `Unités enregistrées pour aujourd'hui : <strong>${totalUnits.toFixed(1)}</strong>`;
    container.appendChild(summaryP);

    if (drinksForToday.length > 0) {
        const ul = document.createElement('ul');
        ul.className = 'todays-drinks-list';
        drinksForToday.forEach((drink, index) => {
            const li = document.createElement('li');
            // Utiliser textContent pour la sécurité
            const textNode = document.createTextNode(`${drink.count} x ${drink.name} `);
            const unitsSpan = document.createElement('span');
            unitsSpan.textContent = `(${(drink.count * drink.unitValue).toFixed(1)} unités)`;
            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'delete-drink-btn button-delete';
            deleteBtn.innerHTML = '×';
            deleteBtn.title = 'Supprimer cette boisson de la liste du jour';
            deleteBtn.dataset.index = index;
            deleteBtn.setAttribute('aria-label', `Supprimer ${drink.count} x ${drink.name}`);

            li.appendChild(textNode);
            li.appendChild(unitsSpan);
            li.appendChild(deleteBtn);
            ul.appendChild(li);
        });
        container.appendChild(ul);

        // Attacher listeners aux boutons supprimer
        ul.querySelectorAll('.delete-drink-btn').forEach(btn => {
            btn.addEventListener('click', (event) => {
                const drinkIndex = parseInt(event.target.dataset.index, 10);
                if (!isNaN(drinkIndex) && drinkIndex >= 0 && drinkIndex < drinksForToday.length) {
                    drinksForToday.splice(drinkIndex, 1);
                    renderTodaysConsumption(container); // Re-rendre la liste
                }
            });
        });
    } else {
        const p = document.createElement('p');
        p.textContent = 'Aucune consommation ajoutée pour aujourd\'hui.';
        container.appendChild(p);
    }
}

/** Ajoute une boisson à la liste temporaire de la journée. */
function addDrinkToDailyList(typeSelect, countInput, todaysConsumptionDiv) {
    if (!typeSelect || !countInput || !todaysConsumptionDiv) return;

    const drinkTypeKey = typeSelect.value;
    const count = parseInt(countInput.value, 10);

    if (!drinkTypeKey) { alert("Veuillez sélectionner un type de boisson."); return; }
    if (isNaN(count) || count <= 0 || count > 99) { alert("Veuillez entrer un nombre valide de boissons (1-99)."); return; }

    const unitValue = DRINK_UNIT_VALUES[drinkTypeKey];
    const drinkName = DRINK_NAMES[drinkTypeKey] || drinkTypeKey.replace(/_/g, ' '); // Fallback name

    if (typeof unitValue === 'undefined') {
        console.error("Type de boisson inconnu:", drinkTypeKey);
        alert("Erreur: Type de boisson non reconnu.");
        return;
    }

    drinksForToday.push({
        typeKey: drinkTypeKey, // Sauvegarder la clé pour référence
        count: count,
        unitValue: unitValue,
        name: drinkName // Sauvegarder le nom pour affichage
    });

    // Réinitialiser les champs du formulaire
    typeSelect.value = '';
    countInput.value = '1';

    renderTodaysConsumption(todaysConsumptionDiv); // Mettre à jour l'affichage
}

/** Sauvegarde le log de consommation du jour dans IndexedDB. */
async function saveDailyLog(dateStr, consumptionContainer) { // consumptionContainer n'est plus vraiment utilisé ici
    const totalUnits = calculateTotalUnits(drinksForToday);
    const logData = {
        // date: dateStr, // La date est la clé dans IDB, pas besoin de la stocker DANS l'objet si redondant
        totalUnits: parseFloat(totalUnits.toFixed(1)), // S'assurer que c'est un nombre
        drinks: [...drinksForToday] // Copier le tableau
    };

    const saveButton = document.getElementById('saveDayLogBtn');
    if(saveButton) saveButton.disabled = true;

    try {
        await saveAlcoholLogForDate(dateStr, logData); // La fonction gère l'ajout de 'date' à l'objet
        todaysLog = { date: dateStr, ...logData }; // Mettre à jour l'état local connu
        alert(`Consommation du ${new Date(dateStr+'T00:00:00Z').toLocaleDateString('fr-FR')} enregistrée : ${totalUnits.toFixed(1)} unités.`);
        // Après sauvegarde, les boutons d'ajout devraient être désactivés ou la vue indiquer "Journée enregistrée"
        // Pour l'instant, on ne grise pas, l'utilisateur peut vouloir ajouter plus tard dans la journée.
        // On pourrait ajouter un message "Journée enregistrée, vous pouvez encore modifier."
    } catch (error) {
        console.error("Erreur sauvegarde log alcool:", error);
        alert("Erreur lors de l'enregistrement de la consommation.");
    } finally {
        if(saveButton) saveButton.disabled = false;
    }
}

/** Charge le log du jour et initialise l'interface. */
async function loadAndRenderDay(viewContainerElement) {
    if (!viewContainerElement) return;
    todayString = getCurrentDateString();
    console.log("Consumption LOG: Chargement pour date:", todayString);

    const motivationContainer = viewContainerElement.querySelector('#dailyMotivation');
    const formContainer = viewContainerElement.querySelector('#consumptionFormContainer');
    const todaysConsumptionDiv = viewContainerElement.querySelector('#todaysConsumption');

    if (!motivationContainer || !formContainer || !todaysConsumptionDiv) {
        console.error("Éléments UI de consumptionView introuvables.");
        viewContainerElement.innerHTML = "<p>Erreur: Structure de la vue de consommation corrompue.</p>";
        return;
    }

    // Afficher la motivation
    try {
        const motivationP = document.createElement('p');
        motivationP.textContent = getDailyMotivationMessage();
        motivationContainer.innerHTML = '';
        motivationContainer.appendChild(motivationP);
    } catch(e) { console.error("Erreur affichage motivation:", e)}

    // Formulaire de saisie
    let optionsHtml = '<option value="">-- Choisissez une boisson --</option>';
    for (const key in DRINK_NAMES) { // Utiliser DRINK_NAMES pour les options
        optionsHtml += `<option value="${key}">${DRINK_NAMES[key]}</option>`;
    }

    formContainer.innerHTML = `
        <div class="consumption-input-group">
            <label for="drinkTypeSelect">Type de boisson :</label>
            <select id="drinkTypeSelect" aria-label="Sélectionner le type de boisson">${optionsHtml}</select>
        </div>
        <div class="consumption-input-group">
            <label for="drinkCountInput">Nombre de verres :</label>
            <input type="number" id="drinkCountInput" value="1" min="1" max="50" aria-label="Nombre de verres">
        </div>
        <button id="addDrinkBtn" class="button-secondary">Ajouter cette boisson à la liste du jour</button>
        <button id="saveDayLogBtn" class="button-primary">Enregistrer/Mettre à jour la consommation du jour</button>
    `;

    // Charger les données du jour
    try {
        todaysLog = await getAlcoholLogForDate(todayString);
        if (todaysLog && Array.isArray(todaysLog.drinks)) {
            drinksForToday = [...todaysLog.drinks]; // Initialiser avec les données sauvegardées
        } else {
            drinksForToday = []; // Journée vide ou nouveau log
            todaysLog = null; // Assurer que si pas de log, c'est bien null
        }
    } catch (error) {
        console.error("Erreur chargement log alcool du jour:", error);
        drinksForToday = [];
        todaysLog = null;
    }

    renderTodaysConsumption(todaysConsumptionDiv); // Afficher la liste initiale

    // Attacher listeners aux boutons du formulaire
    const addDrinkBtn = formContainer.querySelector('#addDrinkBtn');
    const saveDayLogBtn = formContainer.querySelector('#saveDayLogBtn');
    const typeSelect = formContainer.querySelector('#drinkTypeSelect');
    const countInput = formContainer.querySelector('#drinkCountInput');

    if (addDrinkBtn && typeSelect && countInput) {
        addDrinkBtn.addEventListener('click', () => {
            addDrinkToDailyList(typeSelect, countInput, todaysConsumptionDiv);
        });
    }
    if (saveDayLogBtn) {
        saveDayLogBtn.addEventListener('click', async () => {
            await saveDailyLog(todayString, todaysConsumptionDiv); // Passer todayString
        });
    }
}

/** Initialise la vue Suivi de Consommation. */
export async function initConsumptionView(viewContainerElement) {
    console.log("Consumption LOG: Initialisation...");
    if (!viewContainerElement) { console.error("Conteneur #consumptionView introuvable."); return; }

    // Structure HTML de base pour la vue
    viewContainerElement.innerHTML = `
        <div id="dailyMotivation" class="motivation-section"></div>
        <h2>Suivi de Consommation</h2>
        <p class="consumption-intro">Enregistrez ici votre consommation d'alcool pour la journée en cours. L'application calculera les unités pour vous.</p>
        <div id="consumptionFormContainer">
            <!-- Formulaire de saisie injecté ici -->
        </div>
        <div id="todaysConsumption" class="todays-consumption-summary">
            <!-- Résumé des boissons du jour injecté ici -->
        </div>
    `;
    try {
        await loadAndRenderDay(viewContainerElement); // Charger les données et l'UI
    } catch (error) {
         console.error("Erreur majeure lors de l'initialisation de ConsumptionView:", error);
         if (viewContainerElement.querySelector('#todaysConsumption')) {
              viewContainerElement.querySelector('#todaysConsumption').innerHTML = "<p>Erreur lors du chargement des données de consommation.</p>";
         }
    }
    console.log("Consumption LOG: Initialisation terminée.");
}
