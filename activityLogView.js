// activityLogView.js (Avec Sélection/Affichage des Valeurs Liées)
import { addActivityLog, getActivityLogsForDate, deleteActivityLog, getCurrentDateString, getPersonalValues } from './storageUtils.js';

const CONTENT_WRAPPER_ID = 'activity-log-content-wrapper';
let todayString = '';
let todaysActivities = [];
let availablePersonalValues = []; // Stocker les valeurs récupérées

/** Supprime un log d'activité */
async function deleteActivity(activityId, listContainer, dateStr) {
    try { await deleteActivityLog(activityId); await displayActivityLogs(listContainer, dateStr); }
    catch (error) { console.error("Err suppr log act:", error); alert("Err suppr activité."); }
}

/** Affiche la liste des activités pour une date */
async function displayActivityLogs(listContainer, dateStr) {
    if (!listContainer || !dateStr) { if(listContainer) listContainer.innerHTML = '<p>Err: Date manquante.</p>'; return; }
    listContainer.innerHTML = '<p>Chargement...</p>';
    try {
        todaysActivities = await getActivityLogsForDate(dateStr);
        listContainer.innerHTML = '';
        if (!Array.isArray(todaysActivities) || todaysActivities.length === 0) { listContainer.innerHTML = '<p class="no-activities-message">Aucune activité pour cette date.</p>'; return; }
        todaysActivities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        const ul = document.createElement('ul'); ul.className = 'activity-log-list';
        todaysActivities.forEach(activity => {
            const li = document.createElement('li'); li.className = 'activity-log-item';
            const time = new Date(activity.timestamp).toLocaleTimeString('fr-FR', { hour:'2-digit', minute:'2-digit' });
            let detailsHtml = `<div class="activity-main-info"><span class="activity-time">${time}</span> <strong class="activity-text">${activity.activityText || ''}</strong></div>`;
            let ratingsHtml = '';
            if (activity.moodBefore) ratingsHtml += `H.Av: ${activity.moodBefore}/5 `;
            if (activity.moodAfter) ratingsHtml += `H.Ap: ${activity.moodAfter}/5 `;
            if (activity.pleasure) ratingsHtml += `P: ${activity.pleasure}/10 `;
            if (activity.mastery) ratingsHtml += `M: ${activity.mastery}/10`;
            if (ratingsHtml.trim()) { detailsHtml += `<div class="activity-ratings">(${ratingsHtml.trim()})</div>`; }
            if (Array.isArray(activity.linkedValues) && activity.linkedValues.length > 0) { detailsHtml += `<div class="activity-linked-values">Valeurs: ${activity.linkedValues.map(v => `<span class="value-tag">${v}</span>`).join(' ')}</div>`; }
            li.innerHTML = `${detailsHtml}<button class="delete-activity-btn button-delete" data-id="${activity.id}" title="Supprimer" aria-label="Supprimer: ${activity.activityText || ''}">×</button>`;
            const delBtn = li.querySelector('.delete-activity-btn'); if(delBtn) { delBtn.addEventListener('click', () => { if (confirm(`Supprimer: "${activity.activityText || ''}" ?`)) deleteActivity(activity.id, listContainer, dateStr); }); }
            ul.appendChild(li);
        });
        listContainer.appendChild(ul);
    } catch (e) { console.error("Err chargement logs act:", e); listContainer.innerHTML = '<p>Err chargement activités.</p>'; }
}

/** Ajoute un nouveau log d'activité */
async function addActivity(formElement, listContainer, dateStr) {
    const activityTextEl = formElement.querySelector('#activityText');
    const moodBeforeEl = formElement.querySelector('#activityMoodBefore'); const moodAfterEl = formElement.querySelector('#activityMoodAfter');
    const pleasureEl = formElement.querySelector('#activityPleasureRating'); const masteryEl = formElement.querySelector('#activityMasteryRating');
    if (!activityTextEl || !moodBeforeEl || !moodAfterEl || !pleasureEl || !masteryEl) { console.error("Elts formulaire act manquants"); return; }
    const activityText = activityTextEl.value.trim(); if (!activityText) { alert("Décrivez l'activité."); return; }
    const selectedValues = []; formElement.querySelectorAll('.personal-value-checkbox:checked').forEach(cb => { selectedValues.push(cb.value); });
    const newActivityLog = {
        timestamp: new Date().toISOString(), date: dateStr, activityText: activityText,
        moodBefore: moodBeforeEl.value ? parseInt(moodBeforeEl.value) : null, moodAfter: moodAfterEl.value ? parseInt(moodAfterEl.value) : null,
        pleasure: pleasureEl.value ? parseInt(pleasureEl.value) : null, mastery: masteryEl.value ? parseInt(masteryEl.value) : null,
        linkedValues: selectedValues
    };
    const addBtn = formElement.querySelector('button[type="submit"]'); if(addBtn) addBtn.disabled = true;
    try { await addActivityLog(newActivityLog); formElement.reset(); await displayActivityLogs(listContainer, dateStr); } // Reset désélectionne les checkboxes
    catch (e) { console.error("Err ajout log act:", e); alert("Err enregistrement activité."); }
    finally { if(addBtn) addBtn.disabled = false; }
}

/** Fonction principale de rendu pour la vue Suivi d'Activités. */
async function renderActivityLogView(contentWrapper) {
    if (!contentWrapper) { console.error("renderActivityLogView: wrapper invalide."); return; }
    todayString = getCurrentDateString();
    let formattedDateToday = 'Aujourd\'hui'; try { formattedDateToday = new Date(todayString+'T00:00:00Z').toLocaleDateString('fr-FR', {weekday:'long', day:'numeric', month:'short'}); } catch(e) {}
    availablePersonalValues = getPersonalValues();
    let valuesCheckboxesHtml = '<p class="no-values-message">Aucune valeur définie. <button class="link-to-settings" data-targetview="settingsView">Ajoutez-en dans les Paramètres.</button></p>';
    if (availablePersonalValues.length > 0) {
        valuesCheckboxesHtml = availablePersonalValues.map((value, index) => `
            <div class="value-checkbox-item">
                <input type="checkbox" id="value-check-${index}" name="personalValue" value="${value}" class="personal-value-checkbox">
                <label for="value-check-${index}">${value}</label>
            </div>`).join('');
    }
    contentWrapper.innerHTML = `
        <h3>Enregistrer une Activité (${formattedDateToday})</h3>
        <form id="activityLogForm" class="form-container">
            <div class="form-step"><label for="activityText">Activité :<span class="required-asterisk">*</span></label><input type="text" id="activityText" required maxlength="150"></div>
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
        // Ajouter listener pour le bouton lien vers paramètres
        const linkToSettingsBtn = contentWrapper.querySelector('.link-to-settings');
        if(linkToSettingsBtn && typeof window.showView === 'function'){
             linkToSettingsBtn.addEventListener('click', (e) => { e.preventDefault(); window.showView('settingsView');});
        }
        await displayActivityLogs(listContainer, todayString);
    } else { console.error("Elts formulaire/liste activités introuvables."); }
}

/** Fonctions refresh et init */
export async function refreshActivityLogView() { const mc=document.getElementById('activityLogView');const cw=mc?mc.querySelector(`#${CONTENT_WRAPPER_ID}`):null; if(cw)await renderActivityLogView(cw);else console.error("Echec refresh AL: Wrapper introuvable."); }
export function initActivityLogView(containerElement) { if(!containerElement){console.error("Conteneur AL introuvable.");return;} let cw=containerElement.querySelector(`#${CONTENT_WRAPPER_ID}`); if(!cw){containerElement.innerHTML=`<h2>Suivi d'Activités</h2><div id="${CONTENT_WRAPPER_ID}"><p>Chargement...</p></div>`;cw=containerElement.querySelector(`#${CONTENT_WRAPPER_ID}`);}else{cw.innerHTML='<p>Chargement...</p>';} if(cw){renderActivityLogView(cw).catch(e=>{console.error("Err init AL:",e);if(cw)cw.innerHTML="<p>Err chargement.</p>";});}else{console.error("Impossible créer/trouver wrapper AL init.");}}
