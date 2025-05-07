// app.js (Après suppression Mode Zen ET avec Nouveau Menu Nav)

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
import { initFocusView } from './focusView.js'; // Assumer que initFocusView est prêt

// --- Variables Globales ---
let serviceWorkerRegistration = null;
// Plus de variables globales pour le Mode Zen

// --- Fonctions de Gestion du Mode Zen (SUPPRIMÉES) ---

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

// --- Gestion de l'affichage des vues (Adaptée pour Nouveau Menu) ---
export function showView(viewId) { // Exportée pour cravingsView -> sosView
    document.querySelectorAll('.view-section').forEach(section => section.classList.remove('active'));
    document.querySelectorAll('#mainMenu .menu-item.active-view').forEach(item => item.classList.remove('active-view'));

    const viewToShow = document.getElementById(viewId);
    if (viewToShow) {
        viewToShow.classList.add('active');
        const menuItemToActivate = document.querySelector(`#mainMenu .menu-item[data-viewid="${viewId}"]`);
        if (menuItemToActivate) menuItemToActivate.classList.add('active-view');

        if (viewId === 'progressView') refreshCharts();
        else if (viewId === 'routineView') refreshRoutineView();
        else if (viewId === 'plannerView') refreshPlannerView();
        // Les autres vues n'ont pas de refresh spécifique à l'affichage pour l'instant
    } else {
         console.error(`Vue avec ID '${viewId}' introuvable !`);
         showView('sobrietyView'); // Fallback vers la vue par défaut
         return;
    }
    window.scrollTo(0, 0);
}
// Rendre showView accessible globalement pour cravingsView -> sosView
window.showView = showView;


// --- Initialisation des modules de l'application ---
function initializeApp() {
    console.log("DOM Chargé. Initialisation application Clair·e...");

    // --- Initialisation du Menu Burger ---
    const menuToggleBtn = document.getElementById('menuToggleBtn');
    const mainMenu = document.getElementById('mainMenu');
    if (menuToggleBtn && mainMenu) {
        menuToggleBtn.addEventListener('click', () => {
            const isExpanded = menuToggleBtn.getAttribute('aria-expanded') === 'true';
            menuToggleBtn.setAttribute('aria-expanded', !isExpanded);
            mainMenu.classList.toggle('open');
            mainMenu.setAttribute('aria-hidden', String(isExpanded)); // Mettre à jour aria-hidden
            if (!isExpanded && mainMenu.querySelector('.menu-item')) { mainMenu.querySelector('.menu-item').focus(); }
        });
        mainMenu.querySelectorAll('.menu-item').forEach(item => {
            item.addEventListener('click', () => {
                const viewId = item.dataset.viewid;
                if (viewId) {
                    showView(viewId);
                    menuToggleBtn.setAttribute('aria-expanded', 'false'); // Fermer menu
                    mainMenu.classList.remove('open');
                    mainMenu.setAttribute('aria-hidden', 'true');
                }
            });
        });
        document.addEventListener('click', (event) => { // Fermer menu si clic en dehors
            if (mainMenu.classList.contains('open') && !mainMenu.contains(event.target) && !menuToggleBtn.contains(event.target)) {
                menuToggleBtn.setAttribute('aria-expanded', 'false'); mainMenu.classList.remove('open'); mainMenu.setAttribute('aria-hidden', 'true');
            }
        });
    } else { console.warn("Menu burger ou menu principal introuvable."); }

    // --- Initialisation du Mode Zen (Logique SUPPRIMÉE) ---

    // Initialisation des Vues
    const views = [
        { id: 'sobrietyView', initFn: initSobrietyTracker }, { id: 'journalView', initFn: initJournal },
        { id: 'moodTrackerView', initFn: initMoodTracker }, { id: 'progressView', initFn: initProgressView },
        { id: 'exercisesView', initFn: initExercisesView }, { id: 'routineView', initFn: initRoutineView },
        { id: 'plannerView', initFn: initPlannerView }, { id: 'cravingsView', initFn: initCravingsView },
        { id: 'focusView', initFn: initFocusView }, { id: 'testimonialsView', initFn: initTestimonialsView },
        { id: 'victoriesView', initFn: initVictoriesView }, { id: 'settingsView', initFn: initSettingsView },
        { id: 'sosView', initFn: initSosView }
    ];
    views.forEach(view => {
        const container = document.getElementById(view.id);
        if (container && typeof view.initFn === 'function') {
            try { const result = view.initFn(container); if (result instanceof Promise) { result.catch(err => console.error(`Erreur async init vue ${view.id}:`, err)); } }
            catch (error) { console.error(`Erreur init vue ${view.id}:`, error); }
        } else if (!container) { console.error(`Conteneur '${view.id}' introuvable.`); }
    });

    // Écouteurs de navigation (Logique SUPPRIMÉE, gérée par le menu burger)

    // Afficher la vue par défaut
    if (!document.querySelector('.view-section.active')) { showView('sobrietyView'); }
    else { // S'assurer que l'item de menu pour la vue active initiale est bien marqué
        const activeView = document.querySelector('.view-section.active');
        if(activeView) {
             const menuItemToActivate = document.querySelector(`#mainMenu .menu-item[data-viewid="${activeView.id}"]`);
             if (menuItemToActivate) menuItemToActivate.classList.add('active-view');
        }
    }
}

// --- Lancement ---
document.addEventListener('DOMContentLoaded', initializeApp);
window.addEventListener('load', registerServiceWorker);
