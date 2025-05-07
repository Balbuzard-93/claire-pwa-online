// app.js (Vérification navButtons pour duplicata "Planner")

// --- IMPORTS ---
import { initSobrietyTracker } from './sobrietyTracker.js';
import { initJournal } from './journal.js';
import { initMoodTracker } from './moodTracker.js';
import { initProgressView, refreshCharts } from './progressView.js';
import { initSosView } from './sosView.js';
import { initExercisesView } from './exercisesView.js';
import { initRoutineView, refreshRoutineView } from './routineView.js';
import { initPlannerView, refreshPlannerView } from './plannerView.js';
import { initVictoriesView } from './victoriesView.js';
import { initTestimonialsView } from './testimonialsView.js';
import { initSettingsView } from './settingsView.js';
import { initCravingsView } from './cravingsView.js';
import { initFocusTimerView } from './focusTimerView.js';

// --- Constantes et Variables Globales ---
const ZEN_MODE_KEY = 'claireAppZenModeEnabled';
let zenModeButton = null;
let serviceWorkerRegistration = null;

// --- Fonctions de Gestion du Mode Zen ---
function isZenModeEnabled() { try { return localStorage.getItem(ZEN_MODE_KEY) === 'true'; } catch { return false; } }
function updateZenModeButton(isEnabled) { if (!zenModeButton) return; zenModeButton.textContent = isEnabled ? '🧘‍♀️ Normal' : '✨ Zen'; zenModeButton.title = isEnabled ? "Passer en mode d'affichage normal" : "Passer en mode d'affichage Zen (minimaliste)"; }
function setZenMode(enabled) { try { localStorage.setItem(ZEN_MODE_KEY, enabled ? 'true' : 'false'); document.body.classList.toggle('zen-mode', enabled); updateZenModeButton(enabled); } catch (error) { console.error("Erreur sauvegarde Mode Zen:", error); alert("Impossible de sauvegarder le paramètre du Mode Zen."); } }
function toggleZenMode() { setZenMode(!isZenModeEnabled()); }

// --- Enregistrement et Gestion du Service Worker ---
function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('./service-worker.js')
            .then(registration => {
                serviceWorkerRegistration = registration;
                console.log('Service Worker enregistré ! Scope:', registration.scope);
                setupServiceWorkerUpdateHandling(registration);
            })
            .catch(error => { console.error('Échec enregistrement SW:', error); });
        let refreshing;
        navigator.serviceWorker.addEventListener('controllerchange', () => { if (refreshing) return; console.log("Nouveau SW activé. Rechargement..."); window.location.reload(); refreshing = true; });
    } else { console.log('Service Workers non supportés.'); }
}
function setupServiceWorkerUpdateHandling(registration) {
    if (registration.waiting) { console.log("SW en attente trouvé immédiatement."); showUpdateButton(registration); }
    registration.addEventListener('updatefound', () => {
        console.log("Nouvelle version du SW trouvée...");
        const newWorker = registration.installing;
        if (newWorker) {
            newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) { console.log('Nouveau contenu prêt.'); showUpdateButton(registration); }
                else if (newWorker.state === 'installed') { console.log('Contenu mis en cache pour utilisation hors ligne.'); }
            });
        }
    });
}
function showUpdateButton(registration) {
    const existingButton = document.getElementById('sw-update-button'); if (existingButton) existingButton.remove();
    const updateButton = document.createElement('button'); updateButton.id = 'sw-update-button'; updateButton.textContent = 'Mise à jour disponible ! Recharger'; updateButton.className = 'update-available-button';
    updateButton.addEventListener('click', () => { if (registration.waiting) { updateButton.disabled = true; updateButton.textContent = 'Mise à jour...'; registration.waiting.postMessage({ type: 'SKIP_WAITING' }); } else { window.location.reload(); } });
    document.body.appendChild(updateButton);
}

// --- Gestion de l'affichage des vues ---
function showView(viewId) {
    document.querySelectorAll('.view-section').forEach(section => section.classList.remove('active'));
    document.querySelectorAll('.nav-button').forEach(button => button.classList.remove('active'));
    const viewToShow = document.getElementById(viewId);
    if (viewToShow) {
        viewToShow.classList.add('active');
        if (viewId === 'progressView') refreshCharts();
        else if (viewId === 'routineView') refreshRoutineView();
        else if (viewId === 'plannerView') refreshPlannerView();
    } else { console.error(`Vue avec ID '${viewId}' introuvable !`); return; }

    if (viewId !== 'toggleZenModeView') {
         let buttonId;
         if (viewId === 'settingsView') { buttonId = 'showSettingsBtn'; }
         else if (viewId === 'focusTimerView') { buttonId = 'showFocusTimerBtn'; }
         else if (viewId === 'cravingsView') { buttonId = 'showCravingsBtn'; } // Ajouter cas pour Cravings
         else { const baseName = viewId.replace('View', ''); buttonId = `show${baseName.charAt(0).toUpperCase() + baseName.slice(1)}Btn`; }
        const buttonToActivate = document.getElementById(buttonId);
        if (buttonToActivate) { buttonToActivate.classList.add('active'); }
        else { if (buttonId !== 'showToggleZenModeBtn') { console.warn(`Bouton navigation '${buttonId}' introuvable pour vue '${viewId}'.`); } }
    }
    window.scrollTo(0, 0);
}
window.showView = showView;

// --- Initialisation des modules de l'application ---
function initializeApp() {
    console.log("DOM Chargé. Initialisation application Clair·e...");
    zenModeButton = document.getElementById('toggleZenModeBtn');
    if (zenModeButton) { const initialZenState = isZenModeEnabled(); setZenMode(initialZenState); zenModeButton.addEventListener('click', toggleZenMode); }
    else { console.warn("Bouton 'toggleZenModeBtn' introuvable."); }

    const views = [
        { id: 'sobrietyView', initFn: initSobrietyTracker }, { id: 'journalView', initFn: initJournal },
        { id: 'moodTrackerView', initFn: initMoodTracker }, { id: 'progressView', initFn: initProgressView },
        { id: 'exercisesView', initFn: initExercisesView }, { id: 'routineView', initFn: initRoutineView },
        { id: 'plannerView', initFn: initPlannerView }, { id: 'testimonialsView', initFn: initTestimonialsView },
        { id: 'victoriesView', initFn: initVictoriesView }, { id: 'sosView', initFn: initSosView },
        { id: 'settingsView', initFn: initSettingsView }, { id: 'cravingsView', initFn: initCravingsView },
        { id: 'focusTimerView', initFn: initFocusTimerView }
    ];
    views.forEach(view => {
        const container = document.getElementById(view.id);
        if (container && typeof view.initFn === 'function') {
            try { const result = view.initFn(container); if (result instanceof Promise) { result.catch(err => console.error(`Erreur async init vue ${view.id}:`, err)); } }
            catch (error) { console.error(`Erreur init vue ${view.id}:`, error); }
        } else if (!container) { console.error(`Conteneur '${view.id}' introuvable.`); }
    });

    // Assurez-vous que 'Planner' est unique ici et correspond à l'ID du bouton dans index.html (showPlannerBtn)
    const navButtons = [
        'Sobriety', 'Journal', 'MoodTracker', 'Progress', 'Exercises', 'Routine',
        'Planner', // <<< VÉRIFIER L'UNICITÉ ET LA CASSE
        'Testimonials', 'Victories', 'Cravings', 'FocusTimer', 'Settings', 'Sos' // Ordre peut varier
    ];
    navButtons.forEach(viewName => {
        const buttonId = `show${viewName}Btn`;
        const button = document.getElementById(buttonId);
        const viewId = `${viewName.charAt(0).toLowerCase() + viewName.slice(1)}View`;
        if (button) { button.addEventListener('click', () => showView(viewId)); }
        else { if (buttonId !== 'showToggleZenModeBtn') { console.warn(`Bouton navigation '${buttonId}' introuvable.`); } }
    });

    if (!document.querySelector('.view-section.active')) { showView('sobrietyView'); }
}

// --- Lancement ---
document.addEventListener('DOMContentLoaded', initializeApp);
window.addEventListener('load', registerServiceWorker);
