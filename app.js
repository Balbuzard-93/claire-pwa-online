// app.js (Complet, intégrant FocusView)

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
import { initFocusView } from './focusView.js'; // Assurez-vous que cette ligne est là

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
    if (registration.waiting) { console.log("SW en attente."); showUpdateButton(registration); }
    registration.addEventListener('updatefound', () => {
        console.log("Nouvelle version SW trouvée..."); const newWorker = registration.installing;
        if (newWorker) { newWorker.addEventListener('statechange', () => { if (newWorker.state === 'installed') { if (navigator.serviceWorker.controller) { console.log('Nouveau contenu prêt.'); showUpdateButton(registration); } else { console.log('Contenu mis en cache.'); } } }); }
    });
}
function showUpdateButton(registration) {
    const oldBtn = document.getElementById('sw-update-button'); if (oldBtn) oldBtn.remove();
    const btn = document.createElement('button'); btn.id = 'sw-update-button'; btn.textContent = 'MAJ disponible ! Recharger'; btn.className = 'update-available-button';
    btn.addEventListener('click', () => { if (registration.waiting) { btn.disabled = true; btn.textContent = 'MAJ...'; registration.waiting.postMessage({ type: 'SKIP_WAITING' }); } else { window.location.reload(); } });
    document.body.appendChild(btn);
}

// --- Gestion de l'affichage des vues ---
function showView(viewId) {
    document.querySelectorAll('.view-section').forEach(s => s.classList.remove('active'));
    document.querySelectorAll('.nav-button').forEach(b => b.classList.remove('active'));
    const view = document.getElementById(viewId);
    if (view) {
        view.classList.add('active');
        if (viewId === 'progressView') refreshCharts();
        else if (viewId === 'routineView') refreshRoutineView();
        else if (viewId === 'plannerView') refreshPlannerView();
    } else { console.error(`Vue '${viewId}' introuvable !`); return; }
    if (viewId !== 'toggleZenModeView') {
        let btnId;
        // Cas spéciaux pour les ID de boutons qui ne suivent pas la convention stricte
        if (viewId === 'settingsView') btnId = 'showSettingsBtn';
        else if (viewId === 'focusView') btnId = 'showFocusBtn'; // Assurez-vous que l'ID HTML est showFocusBtn
        else if (viewId === 'cravingsView') btnId = 'showCravingsBtn';
        else { const base = viewId.replace('View', ''); btnId = `show${base.charAt(0).toUpperCase() + base.slice(1)}Btn`; }
        const activeBtn = document.getElementById(btnId);
        if (activeBtn) activeBtn.classList.add('active');
        else if (btnId !== 'showToggleZenModeBtn') console.warn(`Bouton nav '${btnId}' introuvable pour vue '${viewId}'.`);
    }
    window.scrollTo(0, 0);
}
window.showView = showView; // Exposer globalement

// --- Initialisation des modules ---
function initializeApp() {
    console.log("DOM Chargé. Initialisation application Clair·e...");
    zenModeButton = document.getElementById('toggleZenModeBtn');
    if (zenModeButton) { const state = isZenModeEnabled(); setZenMode(state); zenModeButton.addEventListener('click', toggleZenMode); }
    else { console.warn("Bouton 'toggleZenModeBtn' introuvable."); }

    const views = [
        { id: 'sobrietyView', initFn: initSobrietyTracker }, { id: 'journalView', initFn: initJournal },
        { id: 'moodTrackerView', initFn: initMoodTracker }, { id: 'progressView', initFn: initProgressView },
        { id: 'exercisesView', initFn: initExercisesView }, { id: 'routineView', initFn: initRoutineView },
        { id: 'plannerView', initFn: initPlannerView }, { id: 'testimonialsView', initFn: initTestimonialsView },
        { id: 'victoriesView', initFn: initVictoriesView }, { id: 'sosView', initFn: initSosView },
        { id: 'settingsView', initFn: initSettingsView }, { id: 'cravingsView', initFn: initCravingsView },
        { id: 'focusView', initFn: initFocusView } // Vue Focus ajoutée
    ];
    views.forEach(view => {
        const container = document.getElementById(view.id);
        if (container && typeof view.initFn === 'function') {
            try { const res = view.initFn(container); if (res instanceof Promise) res.catch(err => console.error(`Err async init ${view.id}:`, err)); }
            catch (error) { console.error(`Err init vue ${view.id}:`, error); }
        } else if (!container) { console.error(`Conteneur '${view.id}' introuvable.`); }
    });

    const navButtons = [ 'Sobriety', 'Journal', 'MoodTracker', 'Progress', 'Exercises', 'Routine', 'Planner', 'Testimonials', 'Victories', 'Sos', 'Settings', 'Cravings', 'Focus' ]; // 'Focus' ajouté
    navButtons.forEach(name => {
        const btnId = `show${name}Btn`; const btn = document.getElementById(btnId);
        const viewId = `${name.charAt(0).toLowerCase() + name.slice(1)}View`;
        if (btn) { btn.addEventListener('click', () => showView(viewId)); }
        else if (btnId !== 'showToggleZenModeBtn') console.warn(`Bouton nav '${btnId}' introuvable.`);
    });
    if (!document.querySelector('.view-section.active')) showView('sobrietyView');
}

// --- Lancement ---
document.addEventListener('DOMContentLoaded', initializeApp);
window.addEventListener('load', registerServiceWorker);
