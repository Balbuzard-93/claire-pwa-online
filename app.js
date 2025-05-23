// app.js (Focus Menu Accessibilité Corrigé)

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
import { initGratitudeJournal } from './gratitudeJournalView.js';
import { initGoalsView } from './goalsView.js';
import { initMeditationTimerView } from './meditationTimerView.js';
import { initResourcesView } from './resourcesView.js'; // Added import for Resources
// import { getPersonalValues } from './storageUtils.js'; // Pas directement utilisé dans app.js

// --- Variables Globales ---
let serviceWorkerRegistration = null;
let currentViewId = null; // To keep track of the currently displayed view's ID
const viewModuleInstances = new Map(); // To store instances or objects returned by initFn

// --- Fonctions Mode Zen (SUPPRIMÉES) ---

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
    // Cleanup previous view if applicable
    if (currentViewId && viewModuleInstances.has(currentViewId)) {
        const currentInstance = viewModuleInstances.get(currentViewId);
        if (currentInstance && typeof currentInstance.cleanup === 'function') {
            currentInstance.cleanup();
        }
    }

    document.querySelectorAll('.view-section').forEach(section => section.classList.remove('active'));
    document.querySelectorAll('#mainMenu .menu-item.active-view').forEach(item => item.classList.remove('active-view'));
    
    const viewToShow = document.getElementById(viewId);
    if (viewToShow) {
        viewToShow.classList.add('active');
        const menuItemToActivate = document.querySelector(`#mainMenu .menu-item[data-viewid="${viewId}"]`);
        if (menuItemToActivate) menuItemToActivate.classList.add('active-view');
        
        currentViewId = viewId; // Update currentViewId

        // Rafraîchissements conditionnels (specific to certain views)
        if (viewId === 'progressView') refreshCharts();
        else if (viewId === 'routineView') refreshRoutineView();
        else if (viewId === 'plannerView') refreshPlannerView();
        else if (viewId === 'activityLogView') refreshActivityLogView();
        
        // Note: View initialization (initFn) is now done once in initializeApp.
        // If a view needs to re-run parts of its setup logic every time it's shown (beyond simple refresh),
        // it would need to expose a specific function to be called here.
        // For now, only cleanup is handled.

    } else { 
        console.error(`Vue ID '${viewId}' introuvable !`); 
        // Fallback to a default view if the requested one is not found
        if (currentViewId !== 'consumptionView') { // Avoid recursion if default is also missing
             showView('consumptionView'); 
        }
        return; 
    }
    window.scrollTo(0, 0);
}
window.showView = showView; // Global pour cravingsView -> sosView

// --- Initialisation de l'application ---
function initializeApp() {
    console.log("DOM Chargé. Initialisation Clair·e...");
    const menuToggleBtn = document.getElementById('menuToggleBtn');
    const mainMenu = document.getElementById('mainMenu');

    if (menuToggleBtn && mainMenu) {
        menuToggleBtn.addEventListener('click', () => {
            const isExpanded = menuToggleBtn.getAttribute('aria-expanded') === 'true';
            menuToggleBtn.setAttribute('aria-expanded', String(!isExpanded));
            mainMenu.classList.toggle('open');
            mainMenu.setAttribute('aria-hidden', String(isExpanded));
            if (!isExpanded && mainMenu.querySelector('.menu-item')) {
                // Optionnel : focus sur le premier item quand le menu s'ouvre
                // mainMenu.querySelector('.menu-item').focus();
            } else if (isExpanded) {
                // Si on vient de fermer le menu (isExpanded était true), redonner le focus au bouton burger
                menuToggleBtn.focus();
            }
        });

        mainMenu.querySelectorAll('.menu-item').forEach(item => {
            item.addEventListener('click', () => {
                const viewId = item.dataset.viewid;
                if (viewId) {
                    showView(viewId);
                    menuToggleBtn.setAttribute('aria-expanded', 'false');
                    mainMenu.classList.remove('open');
                    mainMenu.setAttribute('aria-hidden', 'true');
                    // *** DÉPLACER LE FOCUS APRÈS SÉLECTION ET FERMETURE ***
                    menuToggleBtn.focus();
                }
            });
        });

        document.addEventListener('click', (event) => {
            if (mainMenu.classList.contains('open') && !mainMenu.contains(event.target) && !menuToggleBtn.contains(event.target)) {
                menuToggleBtn.setAttribute('aria-expanded', 'false');
                mainMenu.classList.remove('open');
                mainMenu.setAttribute('aria-hidden', 'true');
                // Optionnel: redonner le focus au bouton burger ici aussi si pertinent pour UX
                // menuToggleBtn.focus();
            }
        });
    } else { console.warn("Menu burger ou menu principal introuvable."); }

    const views = [
        { id: 'consumptionView', initFn: initConsumptionView }, { id: 'activityLogView', initFn: initActivityLogView },
        { id: 'journalView', initFn: initJournal }, { id: 'moodTrackerView', initFn: initMoodTracker },
        { id: 'progressView', initFn: initProgressView }, { id: 'exercisesView', initFn: initExercisesView },
        { id: 'thoughtRecordView', initFn: initThoughtRecordView }, { id: 'routineView', initFn: initRoutineView },
        { id: 'plannerView', initFn: initPlannerView }, { id: 'cravingsView', initFn: initCravingsView },
        { id: 'focusView', initFn: initFocusView }, { id: 'testimonialsView', initFn: initTestimonialsView },
        { id: 'victoriesView', initFn: initVictoriesView }, 
        { id: 'gratitudeJournalView', initFn: initGratitudeJournal },
        { id: 'goalsView', initFn: initGoalsView },
        { id: 'meditationTimerView', initFn: initMeditationTimerView },
        { id: 'resourcesView', initFn: initResourcesView },
        { id: 'settingsView', initFn: initSettingsView },
        { id: 'sosView', initFn: initSosView }
    ];

    views.forEach(view => { 
        const container = document.getElementById(view.id); 
        if (container && typeof view.initFn === 'function') { 
            try { 
                const instance = view.initFn(container); 
                if (instance) { // Store the instance if initFn returns one
                    viewModuleInstances.set(view.id, instance);
                }
                // If initFn is async and returns a promise for the instance
                // This part would need adjustment if initFns are async and return promises for their instances.
                // For now, assuming initFn is synchronous or its promise resolves to the instance for simplicity with current structure.
                // If they are async and the instance is the resolved value:
                // (async () => {
                //   try {
                //     const resolvedInstance = await view.initFn(container);
                //     if (resolvedInstance) viewModuleInstances.set(view.id, resolvedInstance);
                //   } catch (asyncErr) { console.error(`Err async init ${view.id}:`, asyncErr); }
                // })();
            } catch (e) { 
                console.error(`Err init ${view.id}:`, e); 
            } 
        } else if (!container) { 
            console.error(`Conteneur '${view.id}' introuvable.`); 
        } 
    });
    
    // IMPORTANT: Ensure menu items and view containers are added to index.html for:
    // - gratitudeJournalView (Example: <li class="menu-item" data-viewid="gratitudeJournalView">🙏 Journal Gratitude</li> and <div id="gratitudeJournalView" class="view-section"></div>)
    // - goalsView (Example: <li class="menu-item" data-viewid="goalsView">🎯 Mes Objectifs</li> and <div id="goalsView" class="view-section"></div>)
    // - meditationTimerView (Example: <li class="menu-item" data-viewid="meditationTimerView">🧘 Minuteur Méditation</li> and <div id="meditationTimerView" class="view-section"></div>)
    // - resourcesView (Example: <li class="menu-item" data-viewid="resourcesView">📚 Ressources</li> and <div id="resourcesView" class="view-section"></div>)
    // Also, ensure audio files (e.g., start_bell.mp3, end_bell.mp3) are in an /audio/ directory for meditation timer.

    const defaultViewId = 'consumptionView';
    // Set the initial currentViewId and show the default view
    currentViewId = defaultViewId; // Ensure currentViewId is set before first showView
    if (!document.querySelector('.view-section.active')) { 
        showView(defaultViewId); 
    } else { 
        const activeElement = document.querySelector('.view-section.active'); 
        if(activeElement) {
            currentViewId = activeElement.id; // Correctly set currentViewId if a view is already active
            const menuItem = document.querySelector(`#mainMenu .menu-item[data-viewid="${currentViewId}"]`); 
            if (menuItem) menuItem.classList.add('active-view'); 
        } else {
            showView(defaultViewId); // Fallback if .active exists but id is not found
        }
    }
}
document.addEventListener('DOMContentLoaded', initializeApp);
window.addEventListener('load', registerServiceWorker);
