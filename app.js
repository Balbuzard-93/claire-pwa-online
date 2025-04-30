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

                // Logique pour gérer les mises à jour
                registration.addEventListener('updatefound', () => {
                    console.log("Nouvelle version du SW trouvée, installation...");
                    const newWorker = registration.installing;
                    if (newWorker) {
                        newWorker.addEventListener('statechange', () => {
                            if (newWorker.state === 'installed') {
                                if (navigator.serviceWorker.controller) {
                                    // Si un ancien SW contrôle la page, le nouveau est en attente
                                    console.log('Nouveau contenu disponible. Prochain rechargement ou M-A-J manuelle.');
                                    showUpdateButton(registration); // Afficher bouton MAJ
                                } else {
                                    console.log('Contenu mis en cache pour utilisation hors ligne.');
                                }
                            }
                        });
                    }
                });
            })
            .catch(error => {
                console.error('Échec enregistrement SW:', error);
            });

        // Écouter les changements de contrôleur pour recharger
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
    // Supprimer ancien bouton s'il existe
    const oldButton = document.getElementById('sw-update-button');
    if (oldButton) oldButton.remove();

    const updateButton = document.createElement('button');
    updateButton.id = 'sw-update-button'; // ID pour référence future
    updateButton.textContent = 'Mise à jour disponible ! Recharger';
    updateButton.className = 'update-available-button'; // Pour le style CSS

    updateButton.addEventListener('click', () => {
        if (registration.waiting) {
            updateButton.disabled = true;
            updateButton.textContent = 'Mise à jour...';
            // Envoyer message au SW en attente pour qu'il s'active
            registration.waiting.postMessage({ type: 'SKIP_WAITING' });
            // Le listener 'controllerchange' devrait ensuite faire le reload
        } else {
            // Sécurité : simple reload si pas de worker en attente trouvé
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

    // *** CORRECTION ICI ***
    // Extraire le nom de base (ex: 'journal' depuis 'journalView')
    const baseName = viewId.replace('View', '');
    // Construire l'ID du bouton correctement (ex: showJournalBtn)
    const buttonId = `show${baseName.charAt(0).toUpperCase() + baseName.slice(1)}Btn`;
    // *** FIN CORRECTION ***

    const buttonToActivate = document.getElementById(buttonId);
    if (buttonToActivate) {
        buttonToActivate.classList.add('active');
    } else {
        // Ce warning devrait disparaître après la correction
        console.warn(`Bouton de navigation introuvable pour l'ID: ${buttonId} (construit depuis viewId: ${viewId})`);
    }

    window.scrollTo(0, 0); // Scroll vers le haut
}
}

// --- Initialisation des modules de l'application ---
function initializeApp() {
    console.log("DOM Chargé. Initialisation de l'application Clair·e...");

    // Initialisation du Mode Zen (dès que possible)
    zenModeButton = document.getElementById('toggleZenModeBtn');
    if (zenModeButton) {
        const initialZenState = isZenModeEnabled();
        setZenMode(initialZenState);
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
            try { view.initFn(container); }
            catch (error) { console.error(`Erreur init vue ${view.id}:`, error); }
        } else if (!container) { console.error(`Conteneur '${view.id}' introuvable.`); }
    });

    // Écouteurs de navigation
    const navButtons = [
        'Sobriety', 'Journal', 'MoodTracker', 'Progress', 'Exercises',
        'Routine', 'Planner', 'Testimonials', 'Victories', 'Sos'
    ];
    navButtons.forEach(viewName => {
        const buttonId = `show${viewName}Btn`;
        const button = document.getElementById(buttonId);
        const viewId = `${viewName.charAt(0).toLowerCase() + viewName.slice(1)}View`;
        if (button) { button.addEventListener('click', () => showView(viewId)); }
        else { console.warn(`Bouton '${buttonId}' introuvable.`); }
    });
}

// --- Lancement ---
// Utiliser DOMContentLoaded pour initialiser l'app dès que le HTML est prêt
document.addEventListener('DOMContentLoaded', initializeApp);
// Utiliser window.load pour enregistrer le SW après que tout (images, etc.) est chargé
window.addEventListener('load', registerServiceWorker);
