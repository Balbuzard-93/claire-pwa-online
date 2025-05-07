// thoughtRecordView.js
import { getThoughtRecords, addThoughtRecord, deleteThoughtRecord } from './storageUtils.js';

const STEPS = [
    { id: 'situation', label: 'Situation', placeholder: 'Décrivez brièvement la situation déclenchante...', rows: 3 },
    { id: 'emotions', label: 'Émotions et Intensité (0-100%)', placeholder: 'Ex: Tristesse 80%, Colère 50%...', rows: 2 },
    { id: 'autoThoughts', label: 'Pensées Automatiques ("chaudes")', placeholder: 'Quelles pensées sont venues ? Soulignez ou identifiez la plus intense.', rows: 4 },
    { id: 'evidenceFor', label: 'Preuves QUI SOUTIENNENT la pensée chaude', placeholder: 'Faits objectifs, expériences passées...', rows: 3 },
    { id: 'evidenceAgainst', label: 'Preuves QUI NE SOUTIENNENT PAS la pensée chaude', placeholder: 'Faits objectifs, autres perspectives, exceptions...', rows: 3 },
    { id: 'alternativeThought', label: 'Pensée Alternative/Équilibrée', placeholder: 'Une façon plus nuancée ou aidante de voir la situation...', rows: 4 },
    { id: 'outcome', label: 'Résultat : Réévaluez vos Émotions (0-100%)', placeholder: 'Ex: Tristesse 40%, Soulagement 60%...', rows: 2 }
];
// let currentRecordData = {}; // Pas besoin de stocker globalement ici

/** Affiche le formulaire du journal des pensées */
function renderThoughtRecordForm(container) {
    let formHtml = '<form id="thoughtRecordForm">';
    STEPS.forEach(step => {
        formHtml += `
            <div class="form-step">
                <label for="tr-${step.id}">${step.label} :</label>
                <textarea id="tr-${step.id}" name="${step.id}" rows="${step.rows || 2}" placeholder="${step.placeholder}" required></textarea>
            </div>
        `;
    });
    formHtml += `<button type="submit" class="button-primary">Enregistrer cette Analyse</button></form>`;
    container.innerHTML = formHtml;

    const form = container.querySelector('#thoughtRecordForm');
    if(form) {
        form.addEventListener('submit', async (event) => {
            event.preventDefault();
            const saveButton = form.querySelector('button[type="submit"]');
            if (saveButton) saveButton.disabled = true;

            const formData = new FormData(form);
            const record = { timestamp: new Date().toISOString(), id: Date.now() }; // ID généré ici pour IndexedDB via putData
            let isValid = true;
            let missingFields = [];

            STEPS.forEach(step => {
                record[step.id] = formData.get(step.id).trim();
                // Rendre preuves optionnelles, les autres requises
                if (!record[step.id] && !['evidenceFor', 'evidenceAgainst'].includes(step.id)) {
                    isValid = false;
                    missingFields.push(step.label);
                }
            });

            if (!isValid) {
                alert(`Veuillez remplir les champs suivants : ${missingFields.join(', ')}.`);
                if (saveButton) saveButton.disabled = false;
                return;
            }

            try {
                await addThoughtRecord(record);
                alert("Analyse enregistrée !");
                form.reset();
                // Rafraîchir la liste des enregistrements après ajout
                const listContainer = document.getElementById('thoughtRecordsList');
                if (listContainer) await displayThoughtRecordsList(listContainer);

            } catch (error) {
                console.error("Erreur sauvegarde analyse de pensée:", error);
                alert("Erreur lors de l'enregistrement.");
            } finally {
                if (saveButton) saveButton.disabled = false;
            }
        });
    }
}

/** Affiche la liste des enregistrements de pensées passés */
async function displayThoughtRecordsList(listContainer) {
    if (!listContainer) { console.warn("Conteneur #thoughtRecordsList non trouvé."); return; }
    listContainer.innerHTML = '<p>Chargement des analyses...</p>';
    try {
        const records = await getThoughtRecords();
        listContainer.innerHTML = '';
        if (!records || records.length === 0) {
            listContainer.innerHTML = '<p class="no-records-message">Aucune analyse de pensée enregistrée.</p>';
            return;
        }
        records.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

        const ul = document.createElement('ul');
        ul.className = 'thought-record-list';
        records.forEach(record => {
            const li = document.createElement('li');
            li.className = 'thought-record-item';
            const date = new Date(record.timestamp).toLocaleDateString('fr-FR', { year: 'numeric', month: 'short', day: 'numeric', hour:'2-digit', minute:'2-digit' });
            const situationSummary = record.situation ? record.situation.substring(0,50) + (record.situation.length > 50 ? '...' : '') : 'Non renseigné';

            li.innerHTML = `
                <div class="record-header">
                    <span><strong>${date}</strong> - ${situationSummary}</span>
                    <button class="delete-record-btn button-delete" data-id="${record.id}" aria-label="Supprimer cet enregistrement du ${date}">×</button>
                </div>
                <details>
                    <summary>Voir les détails de l'analyse</summary>
                    <div class="record-details">
                        ${STEPS.map(step => `<p><strong>${step.label}:</strong><br>${record[step.id] ? (record[step.id].replace(/\n/g, '<br>')) : '<em>Non renseigné</em>'}</p>`).join('')}
                    </div>
                </details>
            `;
            const deleteBtn = li.querySelector('.delete-record-btn');
            if(deleteBtn) {
                 deleteBtn.addEventListener('click', async () => {
                      if(confirm("Supprimer cette analyse de pensée ?")) {
                           try { await deleteThoughtRecord(record.id); await displayThoughtRecordsList(listContainer); }
                           catch (e) { console.error("Erreur suppression analyse:", e); alert("Erreur suppression.");}
                      }
                 });
            }
            ul.appendChild(li);
        });
        listContainer.appendChild(ul);
    } catch (error) {
        console.error("Erreur chargement analyses:", error);
        listContainer.innerHTML = '<p>Erreur chargement des analyses.</p>';
    }
}

/** Initialise la vue Journal des Pensées */
export async function initThoughtRecordView(containerElement) {
    if (!containerElement) { console.error("Conteneur vue Journal Pensées introuvable."); return; }
    containerElement.innerHTML = `
        <h2>Journal des Pensées (TCC)</h2>
        <p class="thought-record-intro">Analysez une situation difficile pour mieux comprendre vos pensées et émotions.</p>
        <div id="thoughtRecordFormContainer" class="form-container">
            <!-- Formulaire injecté par JS -->
        </div>
        <h3>Analyses Précédentes</h3>
        <div id="thoughtRecordsList">
            <!-- Liste injectée par JS -->
        </div>
    `;
    const formContainer = containerElement.querySelector('#thoughtRecordFormContainer');
    const listContainer = containerElement.querySelector('#thoughtRecordsList');
    if (formContainer) renderThoughtRecordForm(formContainer);
    if (listContainer) await displayThoughtRecordsList(listContainer);
}
