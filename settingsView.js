// settingsView.js (Avec gestion des Valeurs Personnelles et Export)
import { getAllAppData, getPersonalValues, savePersonalValues } from './storageUtils.js';

const MAX_VALUES = 7; // Limiter le nombre de valeurs pour garder focus
const CONTENT_WRAPPER_ID = 'settings-content-wrapper';

/** Affiche la liste des valeurs personnelles et le formulaire d'ajout. */
function renderPersonalValuesSection(container) {
    if (!container) return;

    const values = getPersonalValues();
    let valuesHtml = '<ul id="personalValuesList" class="settings-value-list">';
    if (values.length > 0) {
        values.forEach(value => {
            const li = document.createElement('li');
            li.className = 'personal-value-item';
            const textSpan = document.createElement('span');
            textSpan.textContent = value;
            li.appendChild(textSpan);
            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'delete-value-btn button-delete';
            deleteBtn.innerHTML = '×';
            deleteBtn.title = `Supprimer la valeur "${value}"`;
            deleteBtn.setAttribute('aria-label', `Supprimer valeur: ${value}`);
            deleteBtn.dataset.valueText = value;
            li.appendChild(deleteBtn);
            valuesHtml += li.outerHTML;
        });
    } else {
        valuesHtml += '<p class="no-values-message">Aucune valeur personnelle définie.</p>';
    }
    valuesHtml += '</ul>';

    let addFormHtml = '';
    if (values.length < MAX_VALUES) {
        addFormHtml = `
            <div class="add-value-form">
                <label for="newPersonalValueInput" class="visually-hidden">Nouvelle valeur :</label>
                <input type="text" id="newPersonalValueInput" placeholder="Ex: Créativité, Connexion..." maxlength="50">
                <button id="addPersonalValueBtn" class="button-secondary">Ajouter Valeur</button>
            </div>
        `;
    } else {
        addFormHtml = `<p>Maximum de ${MAX_VALUES} valeurs atteint.</p>`;
    }

    container.innerHTML = `
        <h3>Mes Valeurs Personnelles</h3>
        <p>Identifiez vos valeurs fondamentales (max ${MAX_VALUES}).</p>
        ${valuesHtml}
        ${addFormHtml}
    `;

    // Listeners suppression
    container.querySelectorAll('.delete-value-btn').forEach(button => {
        button.addEventListener('click', (event) => {
            const valueToDelete = event.target.dataset.valueText;
            if (valueToDelete && confirm(`Supprimer "${valueToDelete}" ?`)) {
                const currentValues = getPersonalValues();
                const updatedValues = currentValues.filter(v => v !== valueToDelete);
                if (savePersonalValues(updatedValues)) renderPersonalValuesSection(container);
                else alert("Erreur suppression valeur.");
            }
        });
    });

    // Listener ajout
    const addBtn = container.querySelector('#addPersonalValueBtn');
    const input = container.querySelector('#newPersonalValueInput');
    if (addBtn && input) {
        function handleAddValue() {
            const text = input.value.trim();
            if (text) {
                const currentValues = getPersonalValues();
                if (currentValues.length >= MAX_VALUES) { alert(`Max ${MAX_VALUES} valeurs.`); return; }
                if (currentValues.map(v=>v.toLowerCase()).includes(text.toLowerCase())) { alert("Valeur existe déjà."); return; }
                currentValues.push(text);
                if (savePersonalValues(currentValues)) renderPersonalValuesSection(container);
                else alert("Erreur ajout valeur.");
            } else { alert("Entrez une valeur."); }
        }
        addBtn.addEventListener('click', handleAddValue);
        input.addEventListener('keydown', (e) => { if (e.key==='Enter'){e.preventDefault(); handleAddValue();} });
    }
}

/** Déclenche le téléchargement des données. */
async function exportAllData(exportButton) {
    if (exportButton) exportButton.disabled = true;
    const statusEl = document.getElementById('exportStatus');
    if (statusEl) statusEl.textContent = 'Préparation données...';
    try {
        const allData = await getAllAppData();
        const jsonString = JSON.stringify(allData, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a'); link.href = url;
        const dateSuffix = new Date().toISOString().split('T')[0].replace(/-/g,'');
        link.download = `claire_data_${dateSuffix}.json`;
        document.body.appendChild(link); link.click(); document.body.removeChild(link); URL.revokeObjectURL(url);
        if (statusEl) statusEl.textContent = 'Exportation réussie ! Fichier sauvegardé.';
        setTimeout(() => { if(statusEl) statusEl.textContent = ''; }, 7000);
    } catch (e) { console.error("Erreur exportation:", e); alert("Erreur exportation."); if (statusEl) statusEl.textContent = 'Échec exportation.'; }
    finally { if (exportButton) exportButton.disabled = false; }
}

/** Initialise la vue Paramètres. */
export function initSettingsView(containerElement) {
    if (!containerElement) { console.error("Conteneur Paramètres introuvable."); return; }
    let contentWrapper = containerElement.querySelector(`#${CONTENT_WRAPPER_ID}`);
    if (!contentWrapper) { containerElement.innerHTML = `<h2>Paramètres & Données</h2><div id="${CONTENT_WRAPPER_ID}"></div>`; contentWrapper = containerElement.querySelector(`#${CONTENT_WRAPPER_ID}`); }
    if (!contentWrapper) { console.error("Impossible créer wrapper settings."); return; }

    contentWrapper.innerHTML = `
        <div id="personalValuesSectionWrapper" class="settings-section">
            <!-- Section Valeurs injectée ici -->
        </div>
        <div class="settings-section">
            <h3>Exporter Mes Données</h3>
            <p>Téléchargez une copie de toutes vos données.</p>
            <p><strong>Important :</strong> Faites des exports réguliers et gardez ce fichier en sécurité.</p>
            <button id="exportDataBtn" class="button-primary">Exporter Toutes Mes Données</button>
            <p id="exportStatus" class="status-message" aria-live="polite"></p>
        </div>
    `;
    const exportBtn = contentWrapper.querySelector('#exportDataBtn');
    if (exportBtn) { exportBtn.addEventListener('click', () => exportAllData(exportBtn)); }
    const valuesSectionWrapper = contentWrapper.querySelector('#personalValuesSectionWrapper');
    if (valuesSectionWrapper) { renderPersonalValuesSection(valuesSectionWrapper); }
}
