// focusView.js

// --- Configuration du Minuteur ---
const FOCUS_DURATION_MINUTES = 25;
const BREAK_DURATION_MINUTES = 5;
// Convertir en secondes pour la logique interne
let focusDuration = FOCUS_DURATION_MINUTES * 60;
let breakDuration = BREAK_DURATION_MINUTES * 60;

let timerInterval = null; // Pour stocker l'ID de setInterval
let timeLeft = focusDuration; // Temps restant en secondes
let isFocusMode = true; // True si en mode focus, false si en mode pause
let isTimerRunning = false;
let cyclesCompleted = 0; // Pour suivre les cycles Pomodoro

// Références DOM
let timeDisplayEl = null;
let startBtnEl = null;
let stopBtnEl = null;
let resetBtnEl = null;
let statusMessageEl = null;
let progressCircleEl = null; // Pour le cercle de progression

/** Formate les secondes en MM:SS */
function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
}

/** Met à jour l'affichage du temps et la progression */
function updateDisplay() {
    if (timeDisplayEl) timeDisplayEl.textContent = formatTime(timeLeft);
    if (progressCircleEl) {
        const totalDuration = isFocusMode ? focusDuration : breakDuration;
        const percentage = ((totalDuration - timeLeft) / totalDuration) * 100;
        // Le cercle de progression sera un SVG ou un div stylisé
        // Pour un div simple:
        // progressCircleEl.style.background = `conic-gradient(#6A5ACD ${percentage}%, #e0e0ff ${percentage}%)`;
        // Pour un SVG, il faudra manipuler les attributs (stroke-dasharray, stroke-dashoffset)
        // Pour l'instant, un log pour vérifier le pourcentage
        // console.log("Progression:", percentage.toFixed(2) + "%");
        // Mise à jour pour un cercle SVG simple (voir CSS pour les styles)
        const circumference = 2 * Math.PI * 45; // 45 est le rayon du cercle
        const offset = circumference - (percentage / 100) * circumference;
        const circleProgress = progressCircleEl.querySelector('.progress-ring__circle--progress');
        if(circleProgress) {
            circleProgress.style.strokeDashoffset = offset;
        }
    }
}

/** Gère la fin d'une phase (focus ou pause) */
function phaseEnded() {
    clearInterval(timerInterval);
    timerInterval = null;
    isTimerRunning = false;
    // Notification sonore simple (optionnel, à implémenter avec Web Audio si souhaité)
    // playSound('phase_end.mp3');

    if (isFocusMode) {
        // Fin de la phase de focus, début de la pause
        isFocusMode = false;
        timeLeft = breakDuration;
        if (statusMessageEl) statusMessageEl.textContent = "C'est l'heure de la pause ! Prenez 5 minutes.";
        if (startBtnEl) startBtnEl.textContent = 'Démarrer Pause';
        // Ici, on pourrait lancer la pause automatiquement ou attendre que l'utilisateur clique
        // Pour l'instant, attendons un clic
        if (startBtnEl) startBtnEl.disabled = false;
    } else {
        // Fin de la phase de pause, début du focus
        isFocusMode = true;
        timeLeft = focusDuration;
        cyclesCompleted++;
        if (statusMessageEl) statusMessageEl.textContent = `Cycle ${cyclesCompleted} terminé. Prêt(e) pour le focus ?`;
        if (startBtnEl) startBtnEl.textContent = 'Démarrer Focus';
        if (startBtnEl) startBtnEl.disabled = false;
    }
    updateDisplay();
}

/** Logique du minuteur (appelée chaque seconde) */
function timerTick() {
    timeLeft--;
    updateDisplay();
    if (timeLeft <= 0) {
        phaseEnded();
    }
}

/** Démarre le minuteur */
function startTimer() {
    if (isTimerRunning) return;
    isTimerRunning = true;
    if (startBtnEl) startBtnEl.disabled = true;
    if (stopBtnEl) stopBtnEl.disabled = false;
    if (resetBtnEl) resetBtnEl.disabled = false;

    if (isFocusMode) {
        if (statusMessageEl) statusMessageEl.textContent = "Concentration en cours...";
    } else {
        if (statusMessageEl) statusMessageEl.textContent = "Pause en cours...";
    }
    // Démarre l'intervalle
    timerInterval = setInterval(timerTick, 1000);
    updateDisplay(); // Mettre à jour l'affichage immédiatement
}

/** Arrête le minuteur */
function stopTimer() {
    if (!isTimerRunning) return;
    isTimerRunning = false;
    clearInterval(timerInterval);
    timerInterval = null;
    if (startBtnEl) startBtnEl.disabled = false;
    if (stopBtnEl) stopBtnEl.disabled = true;
    if (statusMessageEl) statusMessageEl.textContent = "Minuteur en pause.";
}

/** Réinitialise le minuteur */
function resetTimer() {
    stopTimer(); // Arrêter d'abord s'il tourne
    isFocusMode = true; // Revenir au mode focus
    timeLeft = focusDuration;
    cyclesCompleted = 0;
    if (statusMessageEl) statusMessageEl.textContent = "Prêt(e) à commencer une session de focus ?";
    if (startBtnEl) { startBtnEl.textContent = 'Démarrer Focus'; startBtnEl.disabled = false; }
    if (stopBtnEl) stopBtnEl.disabled = true;
    if (resetBtnEl) resetBtnEl.disabled = true; // Désactiver reset si déjà à l'état initial
    updateDisplay();
}

/** Initialise la vue Focus */
export function initFocusView(containerElement) {
    if (!containerElement) { console.error("Focus LOG ERROR: Conteneur introuvable."); return; }

    // Réinitialiser les durées au cas où elles auraient été modifiées (pour plus tard)
    focusDuration = FOCUS_DURATION_MINUTES * 60;
    breakDuration = BREAK_DURATION_MINUTES * 60;
    timeLeft = focusDuration; // Initialiser avec la durée de focus
    isFocusMode = true;
    isTimerRunning = false;
    cyclesCompleted = 0;
    if (timerInterval) clearInterval(timerInterval); // S'assurer qu'aucun ancien minuteur ne tourne


    containerElement.innerHTML = `
        <h2>Minuteur Focus (Pomodoro)</h2>
        <div class="focus-timer-container">
            <div class="progress-circle-container">
                <svg class="progress-ring" width="100" height="100">
                    <circle class="progress-ring__circle progress-ring__circle--bg" stroke-width="8" fill="transparent" r="45" cx="50" cy="50"/>
                    <circle class="progress-ring__circle progress-ring__circle--progress" stroke-width="8" fill="transparent" r="45" cx="50" cy="50"/>
                </svg>
                <div id="timeDisplay" class="time-display">${formatTime(timeLeft)}</div>
            </div>

            <p id="statusMessage" class="status-message" aria-live="polite">Prêt(e) à commencer une session de focus ?</p>
            <div class="timer-controls">
                <button id="startFocusBtn" class="button-primary">Démarrer Focus</button>
                <button id="stopFocusBtn" class="button-secondary" disabled>Pause</button>
                <button id="resetFocusBtn" class="button-secondary" disabled>Réinitialiser</button>
            </div>
             <!-- Optionnel : Section pour lier à une tâche du planificateur -->
             <!-- <div class="focus-task-link">
                 <label for="focusTaskSelect">Lier à une tâche :</label>
                 <select id="focusTaskSelect"><option value="">Aucune</option></select>
             </div> -->
        </div>
    `;

    // Récupérer les éléments du DOM
    timeDisplayEl = containerElement.querySelector('#timeDisplay');
    startBtnEl = containerElement.querySelector('#startFocusBtn');
    stopBtnEl = containerElement.querySelector('#stopFocusBtn');
    resetBtnEl = containerElement.querySelector('#resetFocusBtn');
    statusMessageEl = containerElement.querySelector('#statusMessage');
    progressCircleEl = containerElement.querySelector('.progress-ring'); // Le SVG

    if (!timeDisplayEl || !startBtnEl || !stopBtnEl || !resetBtnEl || !statusMessageEl || !progressCircleEl) {
        console.error("Focus LOG ERROR: Un ou plusieurs éléments UI du minuteur sont introuvables.");
        return;
    }

    // Attacher les écouteurs d'événements
    startBtnEl.addEventListener('click', startTimer);
    stopBtnEl.addEventListener('click', stopTimer);
    resetBtnEl.addEventListener('click', resetTimer);

    // Initialiser l'affichage
    updateDisplay();
    console.log("Focus LOG: Vue Focus initialisée.");
}
