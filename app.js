// app.js
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

// --- Constantes et Variables Globales ---
const ZEN_MODE_KEY = 'claireAppZenModeEnabled';
let zenModeButton = null;
let serviceWorkerRegistration = null; // Pour garder une référence à la registration SW

// --- Fonctions de Gestion du Mode Zen ---
function isZenModeEnabled() { try { return localStorage.getItem(ZEN_MODE_KEY) === 'true'; } catch { return false; } }
function updateZenModeButton(isEnabled) { if (!zenModeButton) return; zenModeButton.textContent = isEnabled ? '🧘‍♀️ Normal' : '✨ Zen'; zenModeButton.title = isEnabled ? "Passer en mode d'affichage normal" : "Passer en mode d'affichage Zen (minimaliste)"; }
function setZenMode(enabled) { try { localStorage.setItem(ZEN_MODE_KEY, enabled ? 'true' : 'false'); document.body.classList.toggle('zen-mode', enabled); /* console.log(enabled ? "Mode Zen Activé" : "Mode Zen Désactivé"); */ updateZenModeButton(enabled); } catch (error) { console.error("Erreur sauvegarde Mode Zen:", error); alert("Impossible de sauvegarder le paramètre du Mode Zen."); } }
function toggleZenMode() { setZenMode(!isZenModeEnabled()); }

// --- Enregistrement et Gestion du Service Worker ---
function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('./service-worker.js')
            .then(registration => {
                serviceWorkerRegistration = registration; // Stocker la registration
                console.log('Service Worker enregistré ! Scope:', registration.scope);

                // Gérer les mises à jour trouvées
                registration.addEventListener('updatefound', () => {
                    console.log("Nouvelle version du SW trouvée, installation...");
                    const newWorker = registration.installing;
                    if (newWorker) {
                        newWorker.addEventListener('statechange', () => {
                            if (newWorker.state === 'installed') {
                                if (navigator.serviceWorker.controller) {
                                    console.log('Nouveau contenu disponible. Prochain rechargement ou M-A-J manuelle.');
                                    showUpdateButton(registration); // Afficher bouton MAJ
                                } else {
                                    console.log('Contenu mis en cache pour utilisation hors ligne.');
                                }
                            }
                        });
                    }
                });

                // Vérifier s'il y a déjà un worker en attente lors du chargement
                if (registration.waiting) {
                    console.log("Un nouveau Service Worker est en attente (déjà installé).");
                    showUpdateButton(registration);
                }

            })
            .catch(error => {
                console.error('Échec enregistrement SW:', error);
            });

        // Écouter les changements de contrôleur pour recharger automatiquement
        let refreshing;
        navigator.serviceWorker.addEventListener('controllerchange', () => {
            if (refreshing) return;
            console.log("Nouveau SW activé. Rechargement...");
            window.location.reload();
            refreshing = true;
        });

    } else {
        console.log('Service Workers non supportés.');
    }
}

// Fonction pour afficher un bouton de mise à jour SW
function showUpdateButton(registration) {
    const existingButton = document.getElementById('sw-update-button');
    if (existingButton) return; // Ne pas ajouter plusieurs fois

    const updateButton = document.createElement('button');
    updateButton.id = 'sw-update-button';
    updateButton.textContent = 'Mise à jour disponible ! Recharger';
    updateButton.className = 'update-available-button'; // Pour le style CSS

    updateButton.addEventListener('click', () => {
        if (registration.waiting) {
            updateButton.disabled = true;
            updateButton.textContent = 'Mise à jour...';
            registration.waiting.postMessage({ type: 'SKIP_WAITING' }); // Dire au SW de s'activer
        } else {
             // Fallback simple
             window.location.reload();
        }
    });
    document.body.appendChild(updateButton);
}


// --- Gestion de l'affichage des vues ---
function showView(viewId) {
    document.querySelectorAll('.view-section').forEach(section => section.classList.remove('active'));
    document.querySelectorAll('.nav-button').forEach(button => button.classList.remove('active'));

    const viewToShow = document.getElementById(viewId);
    if (viewToShow) {
        viewToShow.classList.add('active');
        // Rafraîchissements conditionnels
        if (viewId === 'progressView') refreshCharts();
        else if (viewId === 'routineView') refreshRoutineView();
        else if (viewId === 'plannerView') refreshPlannerView();
    }

    // Activer le bouton de navigation correspondant (Correction de la logique ID)
    const baseName = viewId.replace('View', '');
    const buttonId = `show${baseName.charAt(0).toUpperCase() + baseName.slice(1)}Btn`;
    const buttonToActivate = document.getElementById(buttonId);
    if (buttonToActivate) {
        buttonToActivate.classList.add('active');
    } else {
        // Log l'erreur SEULEMENT si ce n'est pas le bouton Zen lui-même (qui n'a pas de vue associée)
        if (viewId !== 'toggleZenModeView') { // Utiliser une convention ou vérifier si l'ID existe
            console.warn(`Bouton de navigation introuvable pour l'ID: ${buttonId} (construit depuis viewId: ${viewId})`);
        }
    }

    window.scrollTo(0, 0); // Scroll vers le haut
}

// --- Initialisation des modules de l'application ---
// Cette fonction est appelée une fois que le DOM est prêt
function initializeApp() {
    console.log("DOM Chargé. Initialisation de l'application Clair·e...");

    // Initialisation du Mode Zen
    zenModeButton = document.getElementById('toggleZenModeBtn');
    if (zenModeButton) {
        const initialZenState = isZenModeEnabled();
        setZenMode(initialZenState); // Applique l'état et met à jour le bouton
        zenModeButton.addEventListener('click', toggleZenMode);
    } else {
        console.warn("Bouton 'toggleZenModeBtn' introuvable.");
    }

    // Initialisation des Vues
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
        { id: 'sosView', initFn: initSosView }
    ];

    views.forEach(view => {
        const container = document.getElementById(view.id);
        if (container && typeof view.initFn === 'function') {
            try {
                view.initFn(container);
                // console.log(`Vue ${view.id} initialisée.`); // Optionnel : log de succès
            } catch (error) {
                 console.error(`Erreur init vue ${view.id}:`, error);
            }
        } else if (!container) {
            console.error(`Conteneur '${view.id}' introuvable.`);
        }
    });

    // Écouteurs de navigation
    const navButtons = [
        'Sobriety', 'Journal', 'MoodTracker', 'Progress', 'Exercises',
        'Routine', 'Planner', 'Testimonials', 'Victories', 'Sos'
    ];
    navButtons.forEach(viewName => {
        const buttonId = `show${viewName}Btn`;
        const button = document.getElementById(buttonId);
        // Construit l'ID de la vue à afficher (ex: 'journalView')
        const viewId = `${viewName.charAt(0).toLowerCase() + viewName.slice(1)}View`;
        if (button) {
            button.addEventListener('click', () => showView(viewId));
        } else {
            // Ne pas afficher de warning pour le bouton Zen car il n'a pas de 'show...' ID standard
            if (buttonId !== 'showToggleZenModeBtn') {
                 console.warn(`Bouton de navigation '${buttonId}' introuvable.`);
            }
        }
    });

    // S'assurer que la vue initiale est bien affichée (normalement géré par la classe 'active' dans HTML)
    // showView('sobrietyView'); // Décommenter si besoin de forcer
}

// --- Lancement ---
// Initialiser l'app quand le DOM est prêt
document.addEventListener('DOMContentLoaded', initializeApp);
// Enregistrer le SW quand la page est complètement chargée
window.addEventListener('load', registerServiceWorker);
