// focusView.js (Minuteur Focus Pomodoro)

// --- Configuration ---
const WORK_DURATION_DEFAULT = 25 * 60; // 25 minutes en secondes
const BREAK_DURATION_DEFAULT = 5 * 60;  // 5 minutes en secondes
const LONG_BREAK_DURATION_DEFAULT = 15 * 60; // 15 minutes en secondes
const SESSIONS_BEFORE_LONG_BREAK = 4;

let timerIntervalId = null;
let currentTimerSeconds = WORK_DURATION_DEFAULT;
let currentSessionCount = 0; // Nombre de sessions de TRAVAIL complétées
let timerState = 'idle'; // 'idle', 'working', 'break', 'long_break'
let currentPhaseDuration = WORK_DURATION_DEFAULT;

// Références DOM (seront initialisées dans initFocusView)
let startStopBtnEl = null;
let timerDisplayEl = null;
let phaseDisplayEl = null;
let sessionCounterEl = null;
let visualProgressEl = null;
let skipBreakBtnEl = null; // Bouton pour passer la pause

/** Met à jour l'affichage du minuteur (MM:SS) */
function updateTimerDisplay() {
    if (!timerDisplayEl) return;
    const minutes = Math.floor(currentTimerSeconds / 60);
    const seconds = currentTimerSeconds % 60;
    timerDisplayEl.textContent = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

    // Mettre à jour la progression visuelle
    if (visualProgressEl && currentPhaseDuration > 0) {
         const percentageElapsed = ((currentPhaseDuration - currentTimerSeconds) / currentPhaseDuration) * 100;
         visualProgressEl.style.width = `${Math.min(100, percentageElapsed)}%`;
         if (percentageElapsed >= 100) {
             visualProgressEl.style.borderRadius = '10px'; // Arrondi complet
         } else {
             visualProgressEl.style.borderRadius = '10px 0 0 10px'; // Arrondi seulement à gauche
         }
    }
}

/** Met à jour l'affichage de la phase et du titre de la page */
function updatePhaseDisplayAndTitle() {
    let phaseText = "Prêt(e) ?";
    let pageTitlePrefix = "Clair·e";

    switch (timerState) {
        case 'working':
            phaseText = "⏱️ Concentration";
            pageTitlePrefix = "Focus Travail";
            if(skipBreakBtnEl) skipBreakBtnEl.style.display = 'none'; // Cacher bouton skip pendant travail
            break;
        case 'break':
            phaseText = "☕ Petite Pause";
            pageTitlePrefix = "Petite Pause";
            if(skipBreakBtnEl) skipBreakBtnEl.style.display = 'inline-block'; // Afficher
            break;
        case 'long_break':
            phaseText = "🧘 Longue Pause";
            pageTitlePrefix = "Longue Pause";
            if(skipBreakBtnEl) skipBreakBtnEl.style.display = 'inline-block'; // Afficher
            break;
        default: // idle
             if(skipBreakBtnEl) skipBreakBtnEl.style.display = 'none';
    }
    if (phaseDisplayEl) phaseDisplayEl.textContent = phaseText;
    document.title = `${pageTitlePrefix} | ${timerDisplayEl ? timerDisplayEl.textContent : ""} - Clair·e`;
}

/** Met à jour le compteur de sessions de travail complétées */
function updateSessionCounter() {
    if(!sessionCounterEl) return;
    sessionCounterEl.textContent = `Pomodoros : ${currentSessionCount} / ${SESSIONS_BEFORE_LONG_BREAK}`;
}

/** Gère la fin d'une phase (travail ou pause) */
function handlePhaseEnd() {
    let notifTitle = "Clair·e Focus";
    let notifBody = "";

    if (timerState === 'working') {
        notifBody = `Session de concentration terminée ! C'est l'heure de la pause.`;
        currentSessionCount++; // Incrémenter seulement après une session de TRAVAIL
        updateSessionCounter();
        if (currentSessionCount > 0 && currentSessionCount % SESSIONS_BEFORE_LONG_BREAK === 0) {
            timerState = 'long_break';
            currentTimerSeconds = LONG_BREAK_DURATION_DEFAULT;
            currentPhaseDuration = LONG_BREAK_DURATION_DEFAULT;
        } else {
            timerState = 'break';
            currentTimerSeconds = BREAK_DURATION_DEFAULT;
            currentPhaseDuration = BREAK_DURATION_DEFAULT;
        }
    } else { // Fin d'une pause (courte ou longue)
        notifBody = `La pause est terminée. Prêt(e) à vous reconcentrer ?`;
        timerState = 'working';
        currentTimerSeconds = WORK_DURATION_DEFAULT;
        currentPhaseDuration = WORK_DURATION_DEFAULT;
    }

    // Afficher la notification
    if (notifBody && 'Notification' in window && Notification.permission === 'granted') {
        try {
            navigator.serviceWorker.ready.then(registration => {
                registration.showNotification(notifTitle, { body: notifBody, icon: 'icons/icon-192.png', badge: 'icons/icon-192.png' });
            });
        } catch (e) { console.warn("Échec notif SW pour focus:", e); alert(notifBody); /* Fallback alerte */ }
    } else if (notifBody) {
        alert(notifBody); // Fallback si notifications non permises
    }

    updatePhaseDisplayAndTitle();
    updateTimerDisplay(); // Affiche le temps complet de la nouvelle phase
    if(startStopBtnEl) startStopBtnEl.textContent = 'Démarrer';
    if (visualProgressEl) visualProgressEl.style.width = '0%';
}

/** Démarre ou continue le minuteur */
function startTimer() {
    if (timerIntervalId) { // Si déjà un intervalle (reprise après pause), le nettoyer
        clearInterval(timerIntervalId);
        timerIntervalId = null;
    }

    // Si 'idle', on commence une session de travail
    if (timerState === 'idle') {
        timerState = 'working';
        currentTimerSeconds = WORK_DURATION_DEFAULT;
        currentPhaseDuration = WORK_DURATION_DEFAULT;
        // Pas de reset de currentSessionCount ici, se fait dans resetTimer
    }
    // Si on est en pause et on clique 'Reprendre', on continue la pause
    // Si on était en 'break' ou 'long_break' et que handlePhaseEnd a mis 'Démarrer',
    // alors le timerState est maintenant 'working' ou 'break'/'long_break' avec le nouveau temps.

    // Si la phase actuelle est travail mais le temps est 0 (ex: après skip break),
    // on doit passer directement à la prochaine phase de travail (ou fin si c'était la dernière)
    if (timerState === 'working' && currentTimerSeconds <= 0) {
        // Cela ne devrait pas arriver si on clique sur "Démarrer" après une pause.
        // C'est plus pour une reprise d'un état invalide.
        currentTimerSeconds = WORK_DURATION_DEFAULT; // Réinitialiser au temps de travail
        currentPhaseDuration = WORK_DURATION_DEFAULT;
    }


    updatePhaseDisplayAndTitle();
    if(startStopBtnEl) startStopBtnEl.textContent = 'Pauser';

    timerIntervalId = setInterval(() => {
        if (currentTimerSeconds > 0) {
            currentTimerSeconds--;
            updateTimerDisplay();
            updatePhaseDisplayAndTitle(); // Mettre à jour titre de page avec temps
        }
        if (currentTimerSeconds <= 0) { // Utiliser <= pour être sûr
            clearInterval(timerIntervalId);
            timerIntervalId = null;
            handlePhaseEnd();
        }
    }, 1000);
}

/** Met en pause le minuteur */
function pauseTimer() {
    if (timerIntervalId) {
        clearInterval(timerIntervalId);
        timerIntervalId = null;
        if(startStopBtnEl) startStopBtnEl.textContent = 'Reprendre';
        updatePhaseDisplayAndTitle(); // Mettre à jour titre avec "Pause"
    }
}

/** Réinitialise le minuteur à l'état initial */
function resetTimer() {
    if(timerIntervalId) clearInterval(timerIntervalId);
    timerIntervalId = null;
    timerState = 'idle';
    currentTimerSeconds = WORK_DURATION_DEFAULT;
    currentPhaseDuration = WORK_DURATION_DEFAULT;
    currentSessionCount = 0; // Réinitialiser le compteur de Pomodoros
    updateTimerDisplay();
    updatePhaseDisplayAndTitle();
    updateSessionCounter();
    if(startStopBtnEl) startStopBtnEl.textContent = 'Démarrer';
    if (visualProgressEl) visualProgressEl.style.width = '0%';
}

/** Permet de passer la pause en cours et de démarrer une session de travail */
function skipCurrentBreak() {
    if (timerState === 'break' || timerState === 'long_break') {
        if(timerIntervalId) clearInterval(timerIntervalId); // Arrêter le minuteur de pause
        timerIntervalId = null;

        timerState = 'working'; // Passer directement en mode travail
        currentTimerSeconds = WORK_DURATION_DEFAULT;
        currentPhaseDuration = WORK_DURATION_DEFAULT;

        updateTimerDisplay();
        updatePhaseDisplayAndTitle();
        startTimer(); // Démarrer immédiatement la session de travail
    }
}


/** Initialise la vue Focus */
export function initFocusView(containerElement) {
    if (!containerElement) { console.error("Conteneur vue Focus introuvable."); return; }

    containerElement.innerHTML = `
        <h2>Minuteur Focus (Pomodoro)</h2>
        <div class="focus-timer-wrapper">
            <div id="phaseDisplay" class="phase-display">Prêt(e) ?</div>
            <div id="timerDisplay" class="timer-display">${String(WORK_DURATION_DEFAULT / 60).padStart(2, '0')}:00</div>
            <div class="visual-progress-container">
                <div id="visualProgress" class="visual-progress-bar"></div>
            </div>
            <div id="sessionCounter" class="session-counter">Pomodoros : 0 / ${SESSIONS_BEFORE_LONG_BREAK}</div>
            <div class="focus-controls">
                <button id="startStopFocusBtn" class="button-primary">Démarrer</button>
                <button id="resetFocusBtn" class="button-secondary">Réinitialiser</button>
                <button id="skipBreakBtn" class="button-secondary" style="display:none;">Passer la Pause</button>
            </div>
        </div>
        <div class="focus-instructions">
            <p>Utilisez ce minuteur pour alterner périodes de concentration et pauses.</p>
            <ul>
                <li>Concentration : ${WORK_DURATION_DEFAULT / 60} minutes</li>
                <li>Petite pause : ${BREAK_DURATION_DEFAULT / 60} minutes</li>
                <li>Après ${SESSIONS_BEFORE_LONG_BREAK} sessions de concentration, une longue pause de ${LONG_BREAK_DURATION_DEFAULT / 60} minutes.</li>
            </ul>
             <p><em>Une notification s'affichera à la fin de chaque phase (si autorisée).</em></p>
        </div>
    `;

    // Récupérer les éléments du DOM
    startStopBtnEl = containerElement.querySelector('#startStopFocusBtn');
    timerDisplayEl = containerElement.querySelector('#timerDisplay');
    phaseDisplayEl = containerElement.querySelector('#phaseDisplay');
    sessionCounterEl = containerElement.querySelector('#sessionCounter');
    const resetBtn = containerElement.querySelector('#resetFocusBtn');
    visualProgressEl = containerElement.querySelector('#visualProgress');
    skipBreakBtnEl = containerElement.querySelector('#skipBreakBtn');


    if (!startStopBtnEl || !timerDisplayEl || !phaseDisplayEl || !sessionCounterEl || !resetBtn || !visualProgressEl || !skipBreakBtnEl) {
        console.error("Éléments UI du minuteur Focus introuvables après création.");
        return;
    }

    // Attacher les écouteurs
    startStopBtnEl.addEventListener('click', () => {
        if (timerState === 'idle' || startStopBtnEl.textContent === 'Reprendre' || startStopBtnEl.textContent === 'Démarrer') {
            startTimer();
        } else { // Si "Pauser"
            pauseTimer();
        }
    });

    resetBtn.addEventListener('click', resetTimer);
    skipBreakBtnEl.addEventListener('click', skipCurrentBreak);


    // Demander la permission pour les notifications à l'initialisation de la vue
    // si elle n'a pas encore été demandée ou si elle est 'default'.
    if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission().then(permission => {
            if (permission === 'granted') { console.log("Permission notifications accordée."); }
            else { console.log("Permission notifications refusée."); }
        });
    }

    // Initialiser l'affichage
    resetTimer(); // Assure que tout est à l'état par défaut
}
