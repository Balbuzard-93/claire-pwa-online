// meditationTimerView.js

export function initMeditationTimerView(containerElement) {
    containerElement.innerHTML = `
        <h2>Minuteur de Méditation</h2>
        <p>Choisissez une durée et appuyez sur Démarrer.</p>
        
        <div class="duration-selection">
            <label><input type="radio" name="meditationDuration" value="300" checked> 5 minutes</label>
            <label><input type="radio" name="meditationDuration" value="600"> 10 minutes</label>
            <label><input type="radio" name="meditationDuration" value="900"> 15 minutes</label>
            <label><input type="radio" name="meditationDuration" value="1200"> 20 minutes</label>
            <label><input type="radio" name="meditationDuration" value="1800"> 30 minutes</label>
            <label>
                Custom: <input type="number" id="customDurationInput" min="1" placeholder="min"> minutes
            </label>
        </div>

        <div id="timerDisplay" class="timer-display">05:00</div>
        
        <div class="timer-controls">
            <button id="startTimerBtn">Démarrer</button>
            <button id="pauseTimerBtn" disabled>Pause</button>
            <button id="resetTimerBtn" disabled>Réinitialiser</button>
        </div>
        <p id="timerStatusMsg"></p>

        <audio id="startSound" src="audio/start_bell.mp3" preload="auto"></audio>
        <audio id="endSound" src="audio/end_bell.mp3" preload="auto"></audio>
    `;

    const durationRadios = containerElement.querySelectorAll('input[name="meditationDuration"]');
    const customDurationInput = containerElement.querySelector('#customDurationInput');
    const timerDisplay = containerElement.querySelector('#timerDisplay');
    const startTimerBtn = containerElement.querySelector('#startTimerBtn');
    const pauseTimerBtn = containerElement.querySelector('#pauseTimerBtn');
    const resetTimerBtn = containerElement.querySelector('#resetTimerBtn');
    const timerStatusMsg = containerElement.querySelector('#timerStatusMsg');
    const startSound = containerElement.querySelector('#startSound');
    const endSound = containerElement.querySelector('#endSound');

    let timerId = null;
    let totalSeconds = 300; // Default to 5 minutes
    let secondsRemaining = totalSeconds;
    let isPaused = false;

    function formatTime(seconds) {
        const minutes = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }

    function updateDisplay() {
        timerDisplay.textContent = formatTime(secondsRemaining);
    }

    function resetTimerState() {
        clearInterval(timerId);
        timerId = null;
        isPaused = false;
        secondsRemaining = totalSeconds;
        updateDisplay();

        startTimerBtn.disabled = false;
        pauseTimerBtn.disabled = true;
        pauseTimerBtn.textContent = 'Pause';
        resetTimerBtn.disabled = true;
        timerStatusMsg.textContent = '';
        enableDurationSelection(true);
    }

    function enableDurationSelection(enabled) {
        durationRadios.forEach(radio => radio.disabled = !enabled);
        customDurationInput.disabled = !enabled;
    }

    durationRadios.forEach(radio => {
        radio.addEventListener('change', () => {
            if (radio.checked) {
                totalSeconds = parseInt(radio.value, 10);
                customDurationInput.value = ''; // Clear custom input if a radio is selected
                if (!timerId) { // Only update display if timer is not running
                    secondsRemaining = totalSeconds;
                    updateDisplay();
                }
            }
        });
    });

    customDurationInput.addEventListener('input', () => {
        const customMinutes = parseInt(customDurationInput.value, 10);
        if (customMinutes > 0) {
            totalSeconds = customMinutes * 60;
            durationRadios.forEach(radio => radio.checked = false); // Uncheck radios if custom is used
            if (!timerId) {
                secondsRemaining = totalSeconds;
                updateDisplay();
            }
        } else if (customDurationInput.value === '' && !timerId && !Array.from(durationRadios).some(r => r.checked)) {
            // If custom input is cleared and no radio is checked, default to first radio
            durationRadios[0].checked = true;
            totalSeconds = parseInt(durationRadios[0].value, 10);
            secondsRemaining = totalSeconds;
            updateDisplay();
        }
    });

    startTimerBtn.addEventListener('click', () => {
        if (timerId) return; // Already running

        // Ensure totalSeconds is up-to-date from custom input if it was the last thing changed
        const customMinutes = parseInt(customDurationInput.value, 10);
        if (customMinutes > 0 && !Array.from(durationRadios).some(r => r.checked)) {
            totalSeconds = customMinutes * 60;
        } else if (Array.from(durationRadios).some(r => r.checked)) {
             const selectedRadio = Array.from(durationRadios).find(r => r.checked);
             totalSeconds = parseInt(selectedRadio.value, 10);
        }
        // If no selection, default to 5 mins (already set or handled by radio default)

        secondsRemaining = totalSeconds;
        isPaused = false;
        updateDisplay();
        timerStatusMsg.textContent = 'En cours...';

        try {
            startSound.play().catch(e => console.warn("Start sound play failed:", e));
        } catch (e) { console.warn("Error playing start sound:", e); }


        timerId = setInterval(() => {
            secondsRemaining--;
            updateDisplay();

            if (secondsRemaining <= 0) {
                clearInterval(timerId);
                timerId = null;
                timerStatusMsg.textContent = 'Terminé !';
                try {
                    endSound.play().catch(e => console.warn("End sound play failed:", e));
                } catch (e) { console.warn("Error playing end sound:", e); }
                
                // Reset UI after a short delay to show "Terminé !"
                setTimeout(() => {
                    resetTimerState(); 
                    // Re-select originally chosen duration for next start
                    const selectedRadio = Array.from(durationRadios).find(r => r.value == totalSeconds.toString());
                    if (selectedRadio) selectedRadio.checked = true;
                    else if (customDurationInput.value && parseInt(customDurationInput.value)*60 === totalSeconds) {
                        // keep custom value
                    } else {
                         durationRadios[0].checked = true; // default if something went wrong
                    }

                }, 2000);
            }
        }, 1000);

        startTimerBtn.disabled = true;
        pauseTimerBtn.disabled = false;
        resetTimerBtn.disabled = false;
        enableDurationSelection(false);
    });

    pauseTimerBtn.addEventListener('click', () => {
        if (isPaused) { // Resume
            isPaused = false;
            pauseTimerBtn.textContent = 'Pause';
            timerStatusMsg.textContent = 'En cours...';
            timerId = setInterval(() => {
                secondsRemaining--;
                updateDisplay();
                if (secondsRemaining <= 0) { // Also check here in case paused at 0
                    clearInterval(timerId);
                    timerId = null;
                    timerStatusMsg.textContent = 'Terminé !';
                    try {
                        endSound.play().catch(e => console.warn("End sound play failed:", e));
                    } catch (e) { console.warn("Error playing end sound:", e); }
                    setTimeout(resetTimerState, 2000);
                }
            }, 1000);
        } else { // Pause
            clearInterval(timerId);
            isPaused = true;
            pauseTimerBtn.textContent = 'Reprendre';
            timerStatusMsg.textContent = 'En pause';
        }
    });

    resetTimerBtn.addEventListener('click', () => {
        resetTimerState();
        // Re-select originally chosen or default duration
        const selectedRadio = Array.from(durationRadios).find(r => r.value == totalSeconds.toString());
        if (selectedRadio) {
            selectedRadio.checked = true;
        } else if (customDurationInput.value && parseInt(customDurationInput.value)*60 === totalSeconds) {
             // keep custom value, totalSeconds is already set
        } else {
            // Default to 5 minutes if no specific selection was made or custom input was cleared
            durationRadios[0].checked = true;
            totalSeconds = parseInt(durationRadios[0].value, 10);
        }
        secondsRemaining = totalSeconds; // Ensure secondsRemaining reflects this for display
        updateDisplay();
    });

    // Initial setup
    updateDisplay(); // Show default time

    // Return a cleanup function
    return {
        cleanup: () => {
            if (timerId) {
                clearInterval(timerId);
                timerId = null;
                console.log("Meditation timer interval cleared due to view change.");
            }
            // Stop sounds if they are playing (though less likely for long sounds)
            if (startSound && !startSound.paused) {
                startSound.pause();
                startSound.currentTime = 0;
            }
            if (endSound && !endSound.paused) {
                endSound.pause();
                endSound.currentTime = 0;
            }
            // No need to reset UI elements here as the view will be hidden
            // and re-initialized if navigated back to.
        }
    };
}
