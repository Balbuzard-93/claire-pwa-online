// sosView.js

const comfortingPhrases = [
    "C'est ok de ne pas être ok.", "Vous êtes plus fort(e) que vous ne le pensez.", "Respirez profondément, ce moment difficile passera.",
    "Vous avez le droit de ressentir ce que vous ressentez.", "Soyez doux(ce) et patient(e) avec vous-même.", "Une étape à la fois.",
    "Vous n'êtes pas seul(e).", "Permettez-vous de faire une pause.", "Chaque jour est une nouvelle opportunité.",
    "Vos sentiments sont valides.", "Soyez bienveillant(e) avec votre corps et votre esprit.", "Ce sentiment est temporaire.",
    "Vous faites de votre mieux, et c'est suffisant.", "Accueillez vos émotions sans jugement.", "Le calme reviendra."
];

// Utiliser les durées pour l'animation CSS et le JS
const BREATHING_CYCLE = { inhale: 4, hold: 4, exhale: 6, loops: 5 }; // Durées en secondes
let breathingTimeoutId = null;
let currentBreathLoop = 0;

/** Arrête l'exercice de respiration. */
function stopBreathingExercise(btn, instructionEl, visualizerEl) {
    if (breathingTimeoutId) { clearTimeout(breathingTimeoutId); breathingTimeoutId = null; }
    if(visualizerEl) {
        visualizerEl.className = 'breathing-visualizer'; // Reset classe animation
        visualizerEl.style.animationDuration = ''; // Nettoyer durée animation
        visualizerEl.style.animationName = 'none'; // Stopper animation en cours
    }
    if(instructionEl) instructionEl.textContent = `Cliquez pour ${BREATHING_CYCLE.loops} cycles de respiration.`; // Message initial
    if(btn) { btn.textContent = 'Commencer'; btn.disabled = false; }
    currentBreathLoop = 0;
}

/** Démarre un cycle de respiration. */
function startBreathingCycle(btn, instructionEl, visualizerEl) {
    if (!visualizerEl || !instructionEl || !btn) { stopBreathingExercise(btn, instructionEl, visualizerEl); return; }

    if (currentBreathLoop >= BREATHING_CYCLE.loops) { stopBreathingExercise(btn, instructionEl, visualizerEl); return; }
    currentBreathLoop++;

    instructionEl.textContent = `Inspirez (${BREATHING_CYCLE.inhale}s)...`;
    visualizerEl.style.animationDuration = `${BREATHING_CYCLE.inhale}s`;
    visualizerEl.className = 'breathing-visualizer breathing-inhale'; // Déclenche anim inhale
    breathingTimeoutId = setTimeout(() => {
        instructionEl.textContent = `Retenez (${BREATHING_CYCLE.hold}s)...`;
        visualizerEl.style.animationDuration = `${BREATHING_CYCLE.hold}s`;
        visualizerEl.className = 'breathing-visualizer breathing-hold'; // Déclenche anim hold
        breathingTimeoutId = setTimeout(() => {
            instructionEl.textContent = `Expirez (${BREATHING_CYCLE.exhale}s)...`;
            visualizerEl.style.animationDuration = `${BREATHING_CYCLE.exhale}s`;
            visualizerEl.className = 'breathing-visualizer breathing-exhale'; // Déclenche anim exhale
            breathingTimeoutId = setTimeout(() => {
                visualizerEl.className = 'breathing-visualizer'; // Retour état initial visuel
                instructionEl.textContent = "Préparez-vous...";
                if (currentBreathLoop < BREATHING_CYCLE.loops) {
                    breathingTimeoutId = setTimeout(() => startBreathingCycle(btn, instructionEl, visualizerEl), 1000); // Pause 1s
                } else {
                     stopBreathingExercise(btn, instructionEl, visualizerEl); // Fini
                }
            }, BREATHING_CYCLE.exhale * 1000); // Convertir secondes en ms pour setTimeout
        }, BREATHING_CYCLE.hold * 1000);
    }, BREATHING_CYCLE.inhale * 1000);
}

/** Configure l'exercice de respiration. */
function setupBreathingExercise(container) {
    const v = container.querySelector('#breathingVisualizer'), i = container.querySelector('#breathingInstruction'), b = container.querySelector('#startBreathingBtn');
    if (!v || !i || !b) return;
    i.textContent = `Cliquez pour ${BREATHING_CYCLE.loops} cycles (Insp ${BREATHING_CYCLE.inhale}s - Ret ${BREATHING_CYCLE.hold}s - Exp ${BREATHING_CYCLE.exhale}s).`;
    b.addEventListener('click', () => {
        if (b.textContent === 'Commencer') {
            b.textContent = 'Arrêter'; i.textContent = "Préparez-vous...";
            if(breathingTimeoutId) clearTimeout(breathingTimeoutId); // Annuler ancien timeout
            currentBreathLoop = 0; // Réinitialiser compteur
            breathingTimeoutId = setTimeout(() => startBreathingCycle(b, i, v), 500); // Délai court avant début
        } else { stopBreathingExercise(b, i, v); }
    });
}

/** Affiche les étapes de la technique d'ancrage 5-4-3-2-1. */
function setupAnchoringTechnique(container) {
    const stepsContainer = container.querySelector('#anchoringSteps');
    if (!stepsContainer) return;
    stepsContainer.innerHTML = `<p>Connectez-vous à vos sens. Nommez :</p><ol class="anchoring-list"><li><strong>5</strong> choses à <strong>VOIR</strong>.</li><li><strong>4</strong> choses à <strong>TOUCHER</strong>.</li><li><strong>3</strong> choses à <strong>ENTENDRE</strong>.</li><li><strong>2</strong> choses à <strong>SENTIR</strong> (odeur).</li><li><strong>1</strong> chose à <strong>GOÛTER</strong> ou <strong>1</strong> qualité positive.</li></ol><p>Revenez à votre respiration.</p>`;
}

/** Configure l'affichage des phrases réconfortantes. */
function setupComfortingPhrases(container) {
    const p = container.querySelector('#comfortPhrase'), b = container.querySelector('#newPhraseBtn');
    if (!p || !b) return;
    const displayRandom = () => { p.textContent = comfortingPhrases.length > 0 ? comfortingPhrases[Math.floor(Math.random() * comfortingPhrases.length)] : "Respirez."; };
    b.addEventListener('click', displayRandom);
    displayRandom(); // Initial
}

/** Initialise la vue SOS. */
export function initSosView(containerElement) {
    if (!containerElement) { console.error("Conteneur vue SOS introuvable."); return; }
    containerElement.innerHTML = `
        <h2>Boîte à Outils SOS</h2><p class="sos-intro">Si vous vous sentez dépassé(e), essayez un de ces outils.</p>
        <div id="sosBreathing" class="sos-tool"><h3>Respiration Guidée</h3><div class="breathing-container"><div id="breathingVisualizer" class="breathing-visualizer"></div><p id="breathingInstruction" aria-live="assertive"></p></div><button id="startBreathingBtn" class="sos-button">Commencer</button></div>
        <div id="sosAnchoring" class="sos-tool"><h3>Ancrage 5-4-3-2-1</h3><div id="anchoringSteps"></div></div>
        <div id="sosComfort" class="sos-tool"><h3>Phrase Réconfortante</h3><p id="comfortPhrase" aria-live="polite"></p><button id="newPhraseBtn" class="button-secondary">Autre phrase</button></div>`; // Utiliser classe secondaire

    const bc = containerElement.querySelector('#sosBreathing'), ac = containerElement.querySelector('#sosAnchoring'), cc = containerElement.querySelector('#sosComfort');
    if (bc) setupBreathingExercise(bc);
    if (ac) setupAnchoringTechnique(ac);
    if (cc) setupComfortingPhrases(cc);
}