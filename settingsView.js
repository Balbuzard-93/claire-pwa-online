// settingsView.js (Vérification import et utilisation getPersonalValues)
import { getAllAppData, getPersonalValues, savePersonalValues } from './storageUtils.js'; // Assurer que getPersonalValues est importé

const MAX_VALUES = 7;
const CONTENT_WRAPPER_ID = 'settings-content-wrapper';

/** Affiche la liste des valeurs personnelles et le formulaire d'ajout. */
function renderPersonalValuesSection(container) {
    if (!container) return;
    const values = getPersonalValues(); // Appel à la fonction importée
    let valuesHtml = '<ul id="personalValuesList" class="settings-value-list">';
    if (values.length > 0) {
        values.forEach(value => {
            const li = document.createElement('li'); li.className = 'personal-value-item';
            const textSpan = document.createElement('span'); textSpan.textContent = value; li.appendChild(textSpan);
            const deleteBtn = document.createElement('button'); deleteBtn.className = 'delete-value-btn button-delete'; deleteBtn.innerHTML = '×'; deleteBtn.title = `Supprimer "${value}"`; deleteBtn.setAttribute('aria-label', `Supprimer: ${value}`); deleteBtn.dataset.valueText = value; li.appendChild(deleteBtn);
            valuesHtml += li.outerHTML;
        });
    } else { valuesHtml += '<p class="no-values-message">Aucune valeur définie.</p>'; }
    valuesHtml += '</ul>';
    let addFormHtml = '';
    if (values.length < MAX_VALUES) { addFormHtml = `<div class="add-value-form"><label for="newPersonalValueInput" class="visually-hidden">Nouvelle valeur:</label><input type="text" id="newPersonalValueInput" placeholder="Ex: Créativité..." maxlength="50"><button id="addPersonalValueBtn" class="button-secondary">Ajouter</button></div>`; }
    else { addFormHtml = `<p>Max ${MAX_VALUES} valeurs.</p>`; }
    container.innerHTML = `<h3>Mes Valeurs Personnelles</h3><p>Identifiez vos valeurs (max ${MAX_VALUES}).</p>${valuesHtml}${addFormHtml}`;

    container.querySelectorAll('.delete-value-btn').forEach(button => {
        button.addEventListener('click', (event) => {
            const valueToDelete = event.target.dataset.valueText;
            if (valueToDelete && confirm(`Supprimer "${valueToDelete}" ?`)) {
                const currentValues = getPersonalValues(); const updatedValues = currentValues.filter(v => v !== valueToDelete);
                if (savePersonalValues(updatedValues)) renderPersonalValuesSection(container); else alert("Erreur suppression.");
            }
        });
    });
    const addBtn = container.querySelector('#addPersonalValueBtn'); const input = container.querySelector('#newPersonalValueInput');
    if (addBtn && input) {
        const handleAdd = () => { const text = input.value.trim(); if (text) { const vals = getPersonalValues(); if(vals.length>=MAX_VALUES){alert(`Max ${MAX_VALUES} valeurs.`);return;} if(vals.map(v=>v.toLowerCase()).includes(text.toLowerCase())){alert("Existe déjà.");return;} vals.push(text); if(savePersonalValues(vals))renderPersonalValuesSection(container); else alert("Erreur ajout.");} else{alert("Entrez une valeur.");}};
        addBtn.addEventListener('click', handleAdd); input.addEventListener('keydown', (e) => { if(e.key==='Enter'){e.preventDefault();handleAdd();}});
    }
}

/** Déclenche le téléchargement des données. */
async function exportAllData(exportButton) { /* ... (code inchangé) ... */ }

/** Initialise la vue Paramètres. */
export function initSettingsView(containerElement) {
    if (!containerElement) { console.error("Conteneur Paramètres introuvable."); return; }
    let cw = containerElement.querySelector(`#${CONTENT_WRAPPER_ID}`);
    if (!cw) { containerElement.innerHTML = `<h2>Paramètres & Données</h2><div id="${CONTENT_WRAPPER_ID}"></div>`; cw = containerElement.querySelector(`#${CONTENT_WRAPPER_ID}`); }
    if (!cw) { console.error("Impossible créer wrapper settings."); return; }
    cw.innerHTML = `<div id="personalValuesSectionWrapper" class="settings-section"></div> <div class="settings-section"><h3>Exporter Mes Données</h3><p>...</p><button id="exportDataBtn" class="button-primary">Exporter</button><p id="exportStatus" class="status-message" aria-live="polite"></p></div>`;
    const exportBtn = cw.querySelector('#exportDataBtn'); if (exportBtn) { exportBtn.addEventListener('click', () => exportAllData(exportBtn)); }
    const valuesSectionWrapper = cw.querySelector('#personalValuesSectionWrapper'); if (valuesSectionWrapper) { renderPersonalValuesSection(valuesSectionWrapper); }
}
