// activityLogView.js (Vérification getPersonalValues)
import { addActivityLog, getActivityLogsForDate, deleteActivityLog, getCurrentDateString, getPersonalValues } from './storageUtils.js'; // Assurer import getPersonalValues

const CONTENT_WRAPPER_ID = 'activity-log-content-wrapper';
let todayString = '';
let todaysActivities = [];
let availablePersonalValues = [];

async function deleteActivity(activityId, listContainer, dateStr) { /* ... (code inchangé) ... */ }
async function displayActivityLogs(listContainer, dateStr) { /* ... (code inchangé) ... */ }
async function addActivity(formElement, listContainer, dateStr) { /* ... (code inchangé) ... */ }

async function renderActivityLogView(contentWrapper) {
    if (!contentWrapper) { console.error("renderActivityLogView: wrapper invalide."); return; }
    todayString = getCurrentDateString();
    let formattedDateToday = 'Aujourd\'hui'; try { formattedDateToday = new Date(todayString+'T00:00:00Z').toLocaleDateString('fr-FR', {weekday:'long', day:'numeric', month:'short'}); } catch(e) {}

    availablePersonalValues = getPersonalValues(); // <<< APPEL À getPersonalValues
    let valuesCheckboxesHtml = '<p class="no-values-message">Aucune valeur définie. <button class="link-to-settings" data-targetview="settingsView">Ajoutez-en dans les Paramètres.</button></p>';
    if (availablePersonalValues && availablePersonalValues.length > 0) { // Ajouter vérif availablePersonalValues
        valuesCheckboxesHtml = availablePersonalValues.map((value, index) => `
            <div class="value-checkbox-item">
                <input type="checkbox" id="value-check-${index}" name="personalValue" value="${value}" class="personal-value-checkbox">
                <label for="value-check-${index}">${value}</label>
            </div>`).join('');
    }
    contentWrapper.innerHTML = `
        <h3>Enregistrer une Activité (${formattedDateToday})</h3>
        <form id="activityLogForm" class="form-container">
            <div class="form-step"><label for="activityText">Activité:<span class="required-asterisk">*</span></label><input type="text" id="activityText" required maxlength="150"></div>
            <p class="ratings-instruction">Optionnel : Notez votre ressenti (0-10 ou 1-5).</p>
            <div class="ratings-grid">
                <div class="form-step"><label for="activityMoodBefore">Humeur Av(1-5):</label><input type="number" id="activityMoodBefore" min="1" max="5" step="1" placeholder="-"></div>
                <div class="form-step"><label for="activityMoodAfter">Humeur Ap(1-5):</label><input type="number" id="activityMoodAfter" min="1" max="5" step="1" placeholder="-"></div>
                <div class="form-step"><label for="activityPleasureRating">Plaisir(0-10):</label><input type="number" id="activityPleasureRating" min="0" max="10" step="1" placeholder="-"></div>
                <div class="form-step"><label for="activityMasteryRating">Maîtrise(0-10):</label><input type="number" id="activityMasteryRating" min="0" max="10" step="1" placeholder="-"></div>
            </div>
            <div class="form-step values-selection-step"><label>Valeur(s) Personnelle(s) liée(s) (optionnel) :</label><div class="personal-values-checkboxes">${valuesCheckboxesHtml}</div></div>
            <button type="submit" class="button-primary">Enregistrer Activité</button>
        </form>
        <h3>Activités du Jour (${formattedDateToday})</h3>
        <div id="activityLogsList"><p>Chargement...</p></div>`;

    const form = contentWrapper.querySelector('#activityLogForm');
    const listContainer = contentWrapper.querySelector('#activityLogsList');
    if (form && listContainer) {
        form.addEventListener('submit', async (e) => { e.preventDefault(); await addActivity(form, listContainer, todayString); });
        const linkToSettingsBtn = contentWrapper.querySelector('.link-to-settings');
        if(linkToSettingsBtn && typeof window.showView === 'function'){ linkToSettingsBtn.addEventListener('click', (e) => { e.preventDefault(); window.showView('settingsView');});}
        await displayActivityLogs(listContainer, todayString);
    } else { console.error("Elts formulaire/liste activités introuvables."); }
}

export async function refreshActivityLogView() { const mc=document.getElementById('activityLogView');const cw=mc?mc.querySelector(`#${CONTENT_WRAPPER_ID}`):null; if(cw)await renderActivityLogView(cw);else console.error("Echec refresh AL: Wrapper introuvable."); }
export function initActivityLogView(containerElement) { if(!containerElement){console.error("Conteneur AL introuvable.");return;} let cw=containerElement.querySelector(`#${CONTENT_WRAPPER_ID}`); if(!cw){containerElement.innerHTML=`<h2>Suivi d'Activités</h2><div id="${CONTENT_WRAPPER_ID}"><p>Chargement...</p></div>`;cw=containerElement.querySelector(`#${CONTENT_WRAPPER_ID}`);}else{cw.innerHTML='<p>Chargement...</p>';} if(cw){renderActivityLogView(cw).catch(e=>{console.error("Err init AL:",e);if(cw)cw.innerHTML="<p>Err chargement.</p>";});}else{console.error("Impossible créer/trouver wrapper AL init.");}}
