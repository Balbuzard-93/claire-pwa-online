// app.js (Avec Suivi Activités intégré)

// --- IMPORTS ---
import { initConsumptionView } from './consumptionView.js';
import { initActivityLogView, refreshActivityLogView } from './activityLogView.js'; // <<< AJOUT IMPORT
import { initJournal } from './journal.js';
import { initMoodTracker } from './moodTracker.js';
import { initProgressView, refreshCharts } from './progressView.js';
import { initSosView } from './sosView.js';
import { initExercisesView } from './exercisesView.js';
import { initThoughtRecordView } from './thoughtRecordView.js';
import { initRoutineView, refreshRoutineView } from './routineView.js';
import { initPlannerView, refreshPlannerView } from './plannerView.js';
import { initVictoriesView } from './victoriesView.js';
import { initTestimonialsView } from './testimonialsView.js';
import { initSettingsView } from './settingsView.js';
import { initCravingsView } from './cravingsView.js';
import { initFocusView } from './focusView.js';
import { getPersonalValues } from './storageUtils.js'; // Importé pour le lien dans activityLogView

// --- Variables Globales ---
let serviceWorkerRegistration = null;

// --- Fonctions Mode Zen (SUPPRIMÉES) ---

// --- Enregistrement et Gestion du Service Worker ---
function registerServiceWorker() { /* ... (code inchangé) ... */ }
function setupServiceWorkerUpdateHandling(registration) { /* ... (code inchangé) ... */ }
function showUpdateButton(registration) { /* ... (code inchangé) ... */ }

// --- Gestion de l'affichage des vues ---
export function showView(viewId) {
    document.querySelectorAll('.view-section').forEach(section => section.classList.remove('active'));
    document.querySelectorAll('#mainMenu .menu-item.active-view').forEach(item => item.classList.remove('active-view'));
    const viewToShow = document.getElementById(viewId);
    if (viewToShow) {
        viewToShow.classList.add('active');
        const menuItemToActivate = document.querySelector(`#mainMenu .menu-item[data-viewid="${viewId}"]`);
        if (menuItemToActivate) menuItemToActivate.classList.add('active-view');
        // Rafraîchissements conditionnels
        if (viewId === 'progressView') refreshCharts();
        else if (viewId === 'routineView') refreshRoutineView();
        else if (viewId === 'plannerView') refreshPlannerView();
        else if (viewId === 'activityLogView') refreshActivityLogView(); // <<< AJOUTER REFRESH
    } else { console.error(`Vue ID '${viewId}' introuvable !`); showView('consumptionView'); return; } // Fallback sur consumptionView
    window.scrollTo(0, 0);
}
window.showView = showView;

// --- Initialisation de l'application ---
function initializeApp() {
    console.log("DOM Chargé. Initialisation Clair·e...");
    const menuToggleBtn = document.getElementById('menuToggleBtn'); const mainMenu = document.getElementById('mainMenu');
    if (menuToggleBtn && mainMenu) { /* ... (logique menu burger inchangée) ... */ }
    else { console.warn("Menu burger/principal introuvable."); }

    const views = [
        { id: 'consumptionView', initFn: initConsumptionView },
        { id: 'activityLogView', initFn: initActivityLogView }, // <<< AJOUTÉ ICI
        { id: 'journalView', initFn: initJournal },
        { id: 'moodTrackerView', initFn: initMoodTracker },
        { id: 'progressView', initFn: initProgressView },
        { id: 'exercisesView', initFn: initExercisesView },
        { id: 'thoughtRecordView', initFn: initThoughtRecordView },
        { id: 'routineView', initFn: initRoutineView }, { id: 'plannerView', initFn: initPlannerView },
        { id: 'cravingsView', initFn: initCravingsView }, { id: 'focusView', initFn: initFocusView },
        { id: 'testimonialsView', initFn: initTestimonialsView }, { id: 'victoriesView', initFn: initVictoriesView },
        { id: 'settingsView', initFn: initSettingsView }, { id: 'sosView', initFn: initSosView }
    ];
    views.forEach(view => { const c = document.getElementById(view.id); if (c && typeof view.initFn === 'function') { try { const r = view.initFn(c); if (r instanceof Promise) { r.catch(err => console.error(`Err async init ${view.id}:`, err)); } } catch (e) { console.error(`Err init ${view.id}:`, e); } } else if (!c) { console.error(`Conteneur '${view.id}' introuvable.`); } });

    // S'assurer que la vue par défaut est bien affichée et son item de menu marqué
    const defaultViewId = 'consumptionView'; // Vue par défaut après refonte
    if (!document.querySelector('.view-section.active')) { showView(defaultViewId); }
    else { const activeView = document.querySelector('.view-section.active'); if(activeView){ const menuItem = document.querySelector(`#mainMenu .menu-item[data-viewid="${activeView.id}"]`); if (menuItem) menuItem.classList.add('active-view'); } }
}
document.addEventListener('DOMContentLoaded', initializeApp);
window.addEventListener('load', registerServiceWorker);
