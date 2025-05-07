// focusTimerView.js

const DEFAULT_FOCUS_MINUTES = 25;
const DEFAULT_BREAK_MINUTES = 5;
const DEFAULT_LONG_BREAK_MINUTES = 15;
const SESSIONS_BEFORE_LONG_BREAK = 4;

let timerInterval = null;
let timeLeft = DEFAULT_FOCUS_MINUTES * 60; // en secondes
let currentMode = 'focus'; // 'focus', 'break', 'longBreak'
let sessionsCompleted = 0;
let isTimerRunning = false;

// Références DOM (seront initialisées dans init)
let timerDisplayEl = null;
let startPauseBtnEl = null;
let resetBtnEl = null;
let modeDisplayEl = null;
let sessionsDisplayEl = null;
let gamificationPlantEl = null; // Pour l'élément de gamification

/** Met à jour l'affichage du minuteur */
function updateTimerDisplay() {
    if (!timerDisplayEl) return;
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    timerDisplayEl.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

/** Met à jour l'affichage du mode et des sessions */
function updateModeDisplay() {
    if (modeDisplayEl) {
        let modeText = "Concentration";
        if (currentMode === 'break') modeText = "Petite Pause";
        else if (currentMode === 'longBreak') modeText = "Longue Pause";
        modeDisplayEl.textContent = `Mode: ${modeText}`;
    }
    if (sessionsDisplayEl) {
        sessionsDisplayEl.textContent = `Sessions complétées: ${sessionsCompleted} / ${SESSIONS_BEFORE_LONG_BREAK}`;
    }
}

/** Gère la fin d'une session de focus ou de pause */
function handleSessionEnd() {
    isTimerRunning = false;
    clearInterval(timerInterval);
    timerInterval = null;
    if(startPauseBtnEl) startPauseBtnEl.textContent = 'Démarrer';

    // Notification simple (peut être améliorée avec API Notification plus tard)
    let notificationMessage = "";

    if (currentMode === 'focus') {
        sessionsCompleted++;
        gamificationPlantEl.classList.add(`growth-stage-${sessionsCompleted % (SESSIONS_BEFORE_LONG_BREAK + 1)}`); // Cycle de croissance
        if (sessionsCompleted % SESSIONS_BEFORE_LONG_BREAK === 0) {
            currentMode = 'longBreak';
            timeLeft = DEFAULT_LONG_BREAK_MINUTES * 60;
            notificationMessage = "Bravo ! C'est l'heure d'une longue pause.";
        } else {
            currentMode = 'break';
            timeLeft = DEFAULT_BREAK_MINUTES * 60;
            notificationMessage = "Session de focus terminée ! Petite pause.";
        }
    } else { // Fin d'une pause (courte ou longue)
        currentMode = 'focus';
        timeLeft = DEFAULT_FOCUS_MINUTES * 60;
        notificationMessage = "Pause terminée. Prêt(e) pour une nouvelle session de focus ?";
         // Si on a complété un cycle Pomodoro complet, on peut reset la croissance de la plante
         if (sessionsCompleted >= SESSIONS_BEFORE_LONG_BREAK && currentMode === 'focus' && sessionsCompleted % SESSIONS_BEFORE_LONG_BREAK === 0) {
              // Ne pas reset ici, le reset se fera au prochain cycle de focus
         }

    }
    updateTimerDisplay();
    updateModeDisplay();
    alert(notificationMessage); // Simple alerte pour l'instant
}

/** Démarre ou met en pause le minuteur */
function toggleTimer() {
    if (isTimerRunning) { // Mettre en Pause
        clearInterval(timerInterval);
        timerInterval = null;
        isTimerRunning = false;
        if(startPauseBtnEl) startPauseBtnEl.textContent = 'Reprendre';
    } else { // Démarrer ou Reprendre
        isTimerRunning = true;
        if(startPauseBtnEl) startPauseBtnEl.textContent = 'Pause';
        // Si on reprend une session de focus et que la plante n'a pas de stage (ex: après un reset)
        if (currentMode === 'focus' && sessionsCompleted === 0 && !gamificationPlantEl.className.includes('growth-stage')) {
             gamificationPlantEl.className = 'plant-gamification growth-stage-0';
        }

        timerInterval = setInterval(() => {
            timeLeft--;
            updateTimerDisplay();
            if (timeLeft < 0) {
                handleSessionEnd();
            }
        }, 1000);
    }
}

/** Réinitialise le minuteur */
function resetTimer() {
    clearInterval(timerInterval);
    timerInterval = null;
    isTimerRunning = false;
    currentMode = 'focus';
    timeLeft = DEFAULT_FOCUS_MINUTES * 60;
    sessionsCompleted = 0; // Reset aussi les sessions
    updateTimerDisplay();
    updateModeDisplay();
    if(startPauseBtnEl) startPauseBtnEl.textContent = 'Démarrer';
    if(gamificationPlantEl) gamificationPlantEl.className = 'plant-gamification growth-stage-0'; // Reset plante
}


/** Initialise la vue du Minuteur Focus. */
export function initFocusTimerView(containerElement) {
    if (!containerElement) { console.error("Conteneur vue Focus introuvable."); return; }

    containerElement.innerHTML = `
        <h2>Minuteur Focus</h2>
        <div class="focus-timer-area">
            <div id="modeDisplay" class="mode-display">Mode: Concentration</div>
            <div id="timerDisplay" class="timer-display">25:00</div>
            <div class="plant-gamification-container">
                <div id="plantGamification" class="plant-gamification growth-stage-0">🌱</div> <!-- Gamification: Plante -->
                <p class="plant-info">Votre plante grandit à chaque session de focus !</p>
            </div>
            <div id="sessionsDisplay" class="sessions-display">Sessions complétées: 0 / ${SESSIONS_BEFORE_LONG_BREAK}</div>
            <div class="timer-controls">
                <button id="startPauseFocusTimer" class="button-primary">Démarrer</button>
                <button id="resetFocusTimer" class="button-secondary">Réinitialiser</button>
            </div>
        </div>
        <div class="focus-settings">
            <p>Utilise la technique Pomodoro (25 min focus / 5 min pause) ou personnalisez (fonctionnalité future).</p>
        </div>
    `;

    // Assigner les éléments DOM
    timerDisplayEl = containerElement.querySelector('#timerDisplay');
    startPauseBtnEl = containerElement.querySelector('#startPauseFocusTimer');
    resetBtnEl = containerElement.querySelector('#resetFocusTimer');
    modeDisplayEl = containerElement.querySelector('#modeDisplay');
    sessionsDisplayEl = containerElement.querySelector('#sessionsDisplay');
    gamificationPlantEl = containerElement.querySelector('#plantGamification');


    if (!timerDisplayEl || !startPauseBtnEl || !resetBtnEl || !modeDisplayEl || !sessionsDisplayEl || !gamificationPlantEl) {
        console.error("FocusTimer LOG ERROR: Un ou plusieurs éléments DOM introuvables.");
        return;
    }

    // Attacher les listeners
    startPauseBtnEl.addEventListener('click', toggleTimer);
    resetBtnEl.addEventListener('click', resetTimer);

    // Initialiser l'affichage
    resetTimer(); // Pour s'assurer que tout est à l'état initial
}
