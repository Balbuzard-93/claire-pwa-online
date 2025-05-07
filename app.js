// app.js (Intégrant CravingsView)

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
import { initCravingsView } from './cravingsView.js'; // *** AJOUT IMPORT CRAVINGSVIEW ***
import { initFocusView } from './focusView.js';

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
        navigator.serviceWorker.addEventListener('controllerchange', () => {
            if (refreshing) return;
            console.log("Nouveau SW activé. Rechargement...");
            window.location.reload();
            refreshing = true;
        });
    } else { console.log('Service Workers non supportés.'); }
}

function setupServiceWorkerUpdateHandling(registration) {
    if (registration.waiting) {
        console.log("SW en attente trouvé immédiatement.");
        showUpdateButton(registration);
    }
    registration.addEventListener('updatefound', () => {
        console.log("Nouvelle version du SW trouvée...");
        const newWorker = registration.installing;
        if (newWorker) {
            newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                    console.log('Nouveau contenu prêt.');
                    showUpdateButton(registration);
                } else if (newWorker.state === 'installed') {
                    console.log('Contenu mis en cache pour utilisation hors ligne.');
                }
            });
        }
    });
}

function showUpdateButton(registration) {
    const existingButton = document.getElementById('sw-update-button');
    if (existingButton) existingButton.remove(); // Enlever l'ancien si présent
    const updateButton = document.createElement('button');
    updateButton.id = 'sw-update-button';
    updateButton.textContent = 'Mise à jour disponible ! Recharger';
    updateButton.className = 'update-available-button';
    updateButton.addEventListener('click', () => {
        if (registration.waiting) {
            updateButton.disabled = true; updateButton.textContent = 'Mise à jour...';
            registration.waiting.postMessage({ type: 'SKIP_WAITING' });
        } else { window.location.reload(); }
    });
    document.body.appendChild(updateButton);
}


// --- Gestion de l'affichage des vues ---
function showView(viewId) {
    // console.log("Affichage vue:", viewId); // Debug
    document.querySelectorAll('.view-section').forEach(section => section.classList.remove('active'));
    document.querySelectorAll('.nav-button').forEach(button => button.classList.remove('active'));

    const viewToShow = document.getElementById(viewId);
    if (viewToShow) {
        viewToShow.classList.add('active');
        // Rafraîchissements conditionnels
        if (viewId === 'progressView') refreshCharts();
        else if (viewId === 'routineView') refreshRoutineView();
        else if (viewId === 'plannerView') refreshPlannerView();
        // Pas de refresh spécifique pour cravingsView lors de l'affichage initial
    } else {
         console.error(`Vue avec ID '${viewId}' introuvable !`);
         return; // Ne pas continuer si la vue n'existe pas
    }

    // Activer le bouton de navigation correspondant
    if (viewId !== 'toggleZenModeView') {
        // Correction: le bouton settings n'a pas de "show" préfixe par convention ici
         let buttonId;
         if (viewId === 'settingsView') {
             buttonId = 'showSettingsBtn'; // Cas spécial pour le bouton Settings
         } else {
             const baseName = viewId.replace('View', '');
             buttonId = `show${baseName.charAt(0).toUpperCase() + baseName.slice(1)}Btn`;
         }

        const buttonToActivate = document.getElementById(buttonId);
        if (buttonToActivate) {
            buttonToActivate.classList.add('active');
        } else {
            if (buttonId !== 'showToggleZenModeBtn') { // Ne pas warner pour le bouton Zen
                 console.warn(`Bouton navigation '${buttonId}' introuvable pour vue '${viewId}'.`);
            }
        }
    }

    window.scrollTo(0, 0); // Scroll vers le haut
}
// *** Rendre showView accessible globalement ***
window.showView = showView; // Permet à cravingsView d'appeler showView('sosView')


// --- Initialisation des modules de l'application ---
function initializeApp() {
    console.log("DOM Chargé. Initialisation application Clair·e...");

    // Initialisation du Mode Zen
    zenModeButton = document.getElementById('toggleZenModeBtn');
    if (zenModeButton) {
        const initialZenState = isZenModeEnabled();
        setZenMode(initialZenState);
        zenModeButton.addEventListener('click', toggleZenMode);
    } else { console.warn("Bouton 'toggleZenModeBtn' introuvable."); }

    // Initialisation des Vues
    // *** AJOUT DE cravingsView À LA LISTE ***
    const views = [
        { id: 'sobrietyView', initFn: initSobrietyTracker },
        { id: 'journalView', initFn: initJournal },
        { id: 'moodTrackerView', initFn: initMoodTracker },
        { id: 'progressView', initFn: initProgressView },
        { id: 'exercisesView', initFn: initExercisesView },
        { id: 'routineView', initFn: initRoutineView },
        { id: 'plannerView', initFn: initPlannerView },
        { id: 'testimonialsView', initFn: initTestimonialsView },
        { id: 'victoriesView', initFn: initVictoriesView },
        { id: 'sosView', initFn: initSosView },
        { id: 'settingsView', initFn: initSettingsView },
        { id: 'cravingsView', initFn: initCravingsView }, // <<<< NOUVELLE VUE ICI
        { id: 'focusView', initFn: initFocusView }
    ];

    views.forEach(view => {
        const container = document.getElementById(view.id);
        if (container && typeof view.initFn === 'function') {
            try {
                const result = view.initFn(container);
                // Gérer promesse si initFn est async (ce qui est le cas pour certaines vues maintenant)
                if (result instanceof Promise) {
                     result.catch(err => console.error(`Erreur async init vue ${view.id}:`, err));
                }
            } catch (error) { console.error(`Erreur init vue ${view.id}:`, error); }
        } else if (!container) { console.error(`Conteneur '${view.id}' introuvable.`); }
    });

    // Écouteurs de navigation
    // *** AJOUT DE 'Cravings' À LA LISTE ***
    
// DANS app.js -> initializeApp -> navButtons.forEach
navButtons.forEach(viewName => {
    const buttonId = `show${viewName}Btn`;
    const button = document.getElementById(buttonId);
    // Construit l'ID de la vue à afficher (ex: 'journalView')
    const viewId = `${viewName.charAt(0).toLowerCase() + viewName.slice(1)}View`;
    if (button) {
        button.addEventListener('click', () => showView(viewId));
    } else {
        // Ne pas afficher de warning pour les boutons qui n'existent pas (Zen)
         if (buttonId !== 'showToggleZenModeBtn') {
             console.warn(`Bouton de navigation '${buttonId}' introuvable.`);
         }
    }
}); // Fin de navButtons.forEach

    // Afficher vue par défaut si aucune n'est active
    if (!document.querySelector('.view-section.active')) {
         showView('sobrietyView');
    }
} // Fin de initializeApp

// --- Lancement ---
document.addEventListener('DOMContentLoaded', initializeApp);
window.addEventListener('load', registerServiceWorker);
