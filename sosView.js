// sosView.js (Version avec Décompte Respiration)

const comfortingPhrases = [
    "C'est ok de ne pas être ok.", "Vous êtes plus fort(e) que vous ne le pensez.", "Respirez profondément, ce moment difficile passera.",
    "Vous avez le droit de ressentir ce que vous ressentez.", "Soyez doux(ce) et patient(e) avec vous-même.", "Une étape à la fois.",
    "Vous n'êtes pas seul(e).", "Permettez-vous de faire une pause.", "Chaque jour est une nouvelle opportunité.",
    "Vos sentiments sont valides.", "Soyez bienveillant(e) avec votre corps et votre esprit.", "Ce sentiment est temporaire.",
    "Vous faites de votre mieux, et c'est suffisant.", "Accueillez vos émotions sans jugement.", "Le calme reviendra."
];

// Config Respiration (en secondes)
const BREATHING_CONFIG = {
    inhale: 4,
    hold: 4,
    exhale: 6,
    pause: 1, // Pause entre les cycles
    loops: 5
};

let breathingIntervalId = null; // ID pour setInterval
let currentBreathLoop = 0;
let currentPhase = 'idle'; // 'idle', 'inhale', 'hold', 'exhale', 'pause'
let phaseTimer = 0; // Compteur pour la phase actuelle

// Références aux éléments DOM (pour éviter requêtes répétées)
let breathBtn = null;
let breathInstructionEl = null;
let breathVisualizerEl = null;
let breathCounterEl = null; // Nouvel élément pour le compteur

/** Arrête l'exercice de respiration */
function stopBreathingExercise() {
    if (breathingIntervalId) {
        clearInterval(breathingIntervalId);
        breathingIntervalId = null;
    }
    if (breathVisualizerEl) breathVisualizerEl.className = 'breathing-visualizer'; // Reset animation
    if (breathInstructionEl) breathInstructionEl.textContent = `Cliquez pour ${BREATHING_CONFIG.loops} cycles.`;
    if (breathCounterEl) breathCounterEl.textContent = ''; // Effacer compteur
    if (breathBtn) { breathBtn.textContent = 'Commencer'; breathBtn.disabled = false; }
    currentBreathLoop = 0;
    currentPhase = 'idle';
    phaseTimer = 0;
    // console.log("Respiration arrêtée.");
}

/** Met à jour le compteur et passe à la phase suivante si nécessaire */
function updateBreathingCycle() {
    if (phaseTimer > 0) {
        if (breathCounterEl) breathCounterEl.textContent = phaseTimer; // MAJ compteur
        phaseTimer--; // Décrémente
    } else {
        // Fin de la phase actuelle, passer à la suivante
        switch (currentPhase) {
            case 'starting':
            case 'pause':
                currentPhase = 'inhale';
                phaseTimer = BREATHING_CONFIG.inhale;
                if (breathInstructionEl) breathInstructionEl.textContent = `Inspirez...`;
                if (breathVisualizerEl) breathVisualizerEl.className = 'breathing-visualizer breathing-inhale';
                 // Définir durée anim CSS (important si variable)
                 if(breathVisualizerEl) breathVisualizerEl.style.animationDuration = `${BREATHING_CONFIG.inhale}s`;
                break;
            case 'inhale':
                currentPhase = 'hold';
                phaseTimer = BREATHING_CONFIG.hold;
                if (breathInstructionEl) breathInstructionEl.textContent = `Retenez...`;
                if (breathVisualizerEl) breathVisualizerEl.className = 'breathing-visualizer breathing-hold';
                if(breathVisualizerEl) breathVisualizerEl.style.animationDuration = `${BREATHING_CONFIG.hold}s`;
                break;
            case 'hold':
                currentPhase = 'exhale';
                phaseTimer = BREATHING_CONFIG.exhale;
                if (breathInstructionEl) breathInstructionEl.textContent = `Expirez...`;
                if (breathVisualizerEl) breathVisualizerEl.className = 'breathing-visualizer breathing-exhale';
                if(breathVisualizerEl) breathVisualizerEl.style.animationDuration = `${BREATHING_CONFIG.exhale}s`;
                break;
            case 'exhale':
                currentBreathLoop++;
                if (currentBreathLoop >= BREATHING_CONFIG.loops) {
                    stopBreathingExercise(); // Fin des cycles
                    return; // Sortir de la fonction
                } else {
                    currentPhase = 'pause';
                    phaseTimer = BREATHING_CONFIG.pause;
                    if (breathInstructionEl) breathInstructionEl.textContent = `Pause...`;
                    if (breathVisualizerEl) breathVisualizerEl.className = 'breathing-visualizer'; // Retour état initial
                     if(breathVisualizerEl) breathVisualizerEl.style.animationDuration = ''; // Reset durée anim
                }
                break;
        }
         // Mettre à jour immédiatement le compteur pour la nouvelle phase
         if (breathCounterEl) breathCounterEl.textContent = phaseTimer;
         phaseTimer--; // Décrémenter pour le prochain tick
    }
}

/** Démarre la boucle de respiration */
function startBreathingExercise() {
    if (breathingIntervalId) return; // Déjà démarré

    currentBreathLoop = 0;
    currentPhase = 'starting'; // Phase initiale avant la première inspiration
    phaseTimer = 1; // Commencer direct avec 1s de "Préparez-vous"

    if (breathInstructionEl) breathInstructionEl.textContent = "Préparez-vous...";
    if (breathCounterEl) breathCounterEl.textContent = ''; // Pas de compteur pendant prépa
    if (breathBtn) breathBtn.textContent = 'Arrêter';

    // Vider le compteur et attendre 1s avant le premier cycle via setInterval
    setTimeout(() => {
         // Définir le premier timer avant de lancer l'intervalle
         phaseTimer = 0; // Pour déclencher inhale au premier tick
         updateBreathingCycle(); // Premier appel pour initier 'inhale'
         // Lancer l'intervalle qui décrémente chaque seconde
         breathingIntervalId = setInterval(updateBreathingCycle, 1000);
    }, 1000); // Attente initiale
}

/** Configure l'exercice de respiration (attache listener) */
function setupBreathingExercise(container) {
    breathVisualizerEl = container.querySelector('#breathingVisualizer');
    breathInstructionEl = container.querySelector('#breathingInstruction');
    breathBtn = container.querySelector('#startBreathingBtn');
    breathCounterEl = container.querySelector('#breathingCounter'); // Récupérer élément compteur

    if (!breathVisualizerEl || !breathInstructionEl || !breathBtn || !breathCounterEl) {
        console.error("SOS LOG ERROR: Éléments manquants pour exercice respiration."); return;
    }

    // Texte initial
    breathInstructionEl.textContent = `Cliquez pour ${BREATHING_CONFIG.loops} cycles (Insp ${BREATHING_CONFIG.inhale}s - Ret ${BREATHING_CONFIG.hold}s - Exp ${BREATHING_CONFIG.exhale}s).`;

    breathBtn.addEventListener('click', () => {
        if (currentPhase === 'idle') {
            startBreathingExercise();
        } else {
            stopBreathingExercise();
        }
    });
}

// --- Fonctions Ancrage et Phrases Réconfortantes (inchangées) ---
function setupAnchoringTechnique(container) { /* ... (code précédent) ... */
     const stepsContainer = container.querySelector('#anchoringSteps'); if (!stepsContainer) return; stepsContainer.innerHTML = `<p>Connectez-vous à vos sens. Nommez :</p><ol class="anchoring-list"><li><strong>5</strong> choses à <strong>VOIR</strong>.</li><li><strong>4</strong> choses à <strong>TOUCHER</strong>.</li><li><strong>3</strong> choses à <strong>ENTENDRE</strong>.</li><li><strong>2</strong> choses à <strong>SENTIR</strong> (odeur).</li><li><strong>1</strong> chose à <strong>GOÛTER</strong> ou <strong>1</strong> qualité positive.</li></ol><p>Revenez à votre respiration.</p>`;
 }
function setupComfortingPhrases(container) { /* ... (code précédent) ... */
     const p = container.querySelector('#comfortPhrase'), b = container.querySelector('#newPhraseBtn'); if (!p || !b) return; const dR = () => { p.textContent = comfortingPhrases.length > 0 ? comfortingPhrases[Math.floor(Math.random() * comfortingPhrases.length)] : "Respirez."; }; b.addEventListener('click', dR); dR();
 }


/** Initialise la vue SOS */
export function initSosView(containerElement) {
    if (!containerElement) { console.error("Conteneur vue SOS introuvable."); return; }
    // Générer le HTML avec l'élément pour le compteur
    containerElement.innerHTML = `
        <h2>Boîte à Outils SOS</h2><p class="sos-intro">Si vous vous sentez dépassé(e), essayez un de ces outils.</p>
        <div id="sosBreathing" class="sos-tool">
             <h3>Respiration Guidée</h3>
             <div class="breathing-container">
                  <div id="breathingVisualizer" class="breathing-visualizer">
                       <span id="breathingCounter" class="breathing-counter"></span> <!-- Compteur à l'intérieur -->
                  </div>
                  <p id="breathingInstruction" aria-live="assertive"></p>
             </div>
             <button id="startBreathingBtn" class="sos-button">Commencer</button>
        </div>
        <div id="sosAnchoring" class="sos-tool"><h3>Ancrage 5-4-3-2-1</h3><div id="anchoringSteps"></div></div>
        <div id="sosComfort" class="sos-tool"><h3>Phrase Réconfortante</h3><p id="comfortPhrase" aria-live="polite"></p><button id="newPhraseBtn" class="button-secondary">Autre phrase</button></div>`;

    const bc = containerElement.querySelector('#sosBreathing'), ac = containerElement.querySelector('#sosAnchoring'), cc = containerElement.querySelector('#sosComfort');
    if (bc) setupBreathingExercise(bc);
    if (ac) setupAnchoringTechnique(ac);
    if (cc) setupComfortingPhrases(cc);

     // S'assurer que l'exercice s'arrête si on quitte la vue SOS
     // Note: Ceci nécessite que la logique de navigation (showView dans app.js)
     // puisse notifier ou appeler une fonction de "nettoyage" quand une vue est masquée.
     // Pour l'instant, on arrête si l'utilisateur clique sur un autre bouton de navigation.
     document.querySelectorAll('header nav .nav-button').forEach(navBtn => {
          // Ne pas attacher sur le bouton SOS lui-même
          if (navBtn.id !== 'showSosBtn') {
               navBtn.addEventListener('click', () => {
                    if (currentPhase !== 'idle') {
                         // console.log("Navigation hors SOS détectée, arrêt respiration.");
                         stopBreathingExercise();
                    }
               });
          }
     });
     // On pourrait aussi utiliser l'API Page Visibility si besoin
     document.addEventListener('visibilitychange', () => {
          if (document.visibilityState === 'hidden' && currentPhase !== 'idle') {
              // console.log("Page cachée, arrêt respiration.");
              stopBreathingExercise();
          }
     });
}
