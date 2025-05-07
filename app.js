// app.js (Imports vérifiés et logique de menu)

// --- IMPORTS ---
import { initConsumptionView } from './consumptionView.js';
import { initActivityLogView, refreshActivityLogView } from './activityLogView.js';
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
// Pas besoin d'importer getPersonalValues ici si activityLogView l'importe déjà

// --- Variables Globales ---
let serviceWorkerRegistration = null;

// --- Fonctions Mode Zen (ONT ÉTÉ SUPPRIMÉES) ---

// --- Enregistrement et Gestion du Service Worker ---
function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('./service-worker.js')
            .then(registration => {
                serviceWorkerRegistration = registration;
                console.log('SW enregistré ! Scope:', registration.scope);
                setupServiceWorkerUpdateHandling(registration);
            })
            .catch(error => { console.error('Échec enregistrement SW:', error); });
        let refreshing;
        navigator.serviceWorker.addEventListener('controllerchange', () => {
            if (refreshing) return;
            console.log("Nouveau SW activé. Rechargement...");
            window.location.reload();
            refreshing = true;
        });
    } else { console.log('Service Workers non supportés.'); }
}
function setupServiceWorkerUpdateHandling(registration) {
    if (registration.waiting) { console.log("SW en attente trouvé."); showUpdateButton(registration); }
    registration.addEventListener('updatefound', () => {
        console.log("Nouvelle version SW trouvée...");
        const newWorker = registration.installing;
        if (newWorker) {
            newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) { console.log('Nouveau contenu prêt.'); showUpdateButton(registration); }
                else if (newWorker.state === 'installed') { console.log('Contenu mis en cache pour hors ligne.'); }
            });
        }
    });
}
function showUpdateButton(registration) {
    const oldBtn = document.getElementById('sw-update-button'); if (oldBtn) oldBtn.remove();
    const btn = document.createElement('button'); btn.id = 'sw-update-button'; btn.textContent = 'Mise à jour ! Recharger'; btn.className = 'update-available-button';
    btn.addEventListener('click', () => { if (registration.waiting) { btn.disabled = true; btn.textContent = 'MAJ...'; registration.waiting.postMessage({ type: 'SKIP_WAITING' }); } else { window.location.reload(); } });
    document.body.appendChild(btn);
}

// --- Gestion de l'affichage des vues (Nouveau Menu) ---
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
        else if (viewId === 'activityLogView') refreshActivityLogView();
    } else { console.error(`Vue ID '${viewId}' introuvable !`); showView('consumptionView'); return; }
    window.scrollTo(0, 0);
}
window.showView = showView;

// --- Initialisation de l'application ---
function initializeApp() {
    console.log("DOM Chargé. Initialisation Clair·e...");
    const menuToggleBtn = document.getElementById('menuToggleBtn'); const mainMenu = document.getElementById('mainMenu');
    if (menuToggleBtn && mainMenu) {
        menuToggleBtn.addEventListener('click', () => { const isExp = menuToggleBtn.getAttribute('aria-expanded')==='true'; menuToggleBtn.setAttribute('aria-expanded',!isExp); mainMenu.classList.toggle('open'); mainMenu.setAttribute('aria-hidden',String(isExp)); if(!isExp && mainMenu.querySelector('.menu-item')) mainMenu.querySelector('.menu-item').focus(); });
        mainMenu.querySelectorAll('.menu-item').forEach(item => { item.addEventListener('click', () => { const viewId = item.dataset.viewid; if (viewId) { showView(viewId); menuToggleBtn.setAttribute('aria-expanded','false'); mainMenu.classList.remove('open'); mainMenu.setAttribute('aria-hidden','true'); } }); });
        document.addEventListener('click', (e) => { if (mainMenu.classList.contains('open') && !mainMenu.contains(e.target) && !menuToggleBtn.contains(e.target)) { menuToggleBtn.setAttribute('aria-expanded','false'); mainMenu.classList.remove('open'); mainMenu.setAttribute('aria-hidden','true'); } });
    } else { console.warn("Menu burger/principal introuvable."); }

    const views = [
        { id: 'consumptionView', initFn: initConsumptionView },
        { id: 'activityLogView', initFn: initActivityLogView },
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

    // Afficher la vue par défaut
    const defaultViewId = 'consumptionView';
    if (!document.querySelector('.view-section.active')) { showView(defaultViewId); }
    else { const activeView = document.querySelector('.view-section.active'); if(activeView){ const menuItem = document.querySelector(`#mainMenu .menu-item[data-viewid="${activeView.id}"]`); if (menuItem) menuItem.classList.add('active-view'); } }
}
document.addEventListener('DOMContentLoaded', initializeApp);
window.addEventListener('load', registerServiceWorker);
