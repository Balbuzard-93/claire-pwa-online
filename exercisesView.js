// exercisesView.js (Avec Exercices TCD Interactifs)

// --- Données des Exercices ---
const exercisesData = [
    {
        id: 'relaxation_rapide',
        title: "Relaxation Rapide (5 min)",
        type: 'text', // Indiquer le type
        description: "Un scan corporel simple pour détendre rapidement le corps et l'esprit.",
        steps: [
            "Installez-vous confortablement, assis ou allongé. Fermez doucement les yeux si vous le souhaitez.",
            "Prenez 2-3 respirations profondes. Inspirez par le nez en gonflant le ventre, expirez lentement par la bouche.",
            "Portez votre attention sur vos pieds. Remarquez toute tension et essayez de la relâcher à l'expiration.",
            "Remontez lentement votre attention le long de vos jambes, en relâchant les tensions dans les mollets, les genoux, les cuisses.",
            "Portez attention à votre bassin et votre ventre. Laissez cette zone se détendre.",
            "Remarquez votre dos, vos épaules. Laissez les épaules s'abaisser, loin des oreilles.",
            "Détendez vos bras, vos mains, jusqu'au bout des doigts.",
            "Relâchez les muscles de votre cou, de votre mâchoire. Déserrez les dents.",
            "Détendez les petits muscles autour de vos yeux, votre front.",
            "Prenez encore une ou deux respirations profondes, en sentant une vague de détente parcourir votre corps à chaque expiration.",
            "Quand vous êtes prêt(e), bougez doucement les doigts et les orteils, étirez-vous si besoin, et ouvrez les yeux."
        ]
    },
    {
        id: 'auto_compassion_breve',
        title: "Pause d'Auto-Compassion (2 min)",
        type: 'text',
        description: "Un exercice court pour se soutenir dans les moments difficiles.",
        steps: [
            "Prenez un moment pour reconnaître que vous vivez un moment difficile. Dites-vous mentalement : 'C'est un moment de souffrance' ou 'C'est difficile en ce moment'.",
            "Rappelez-vous que la souffrance fait partie de la vie et de l'expérience humaine partagée. Dites-vous : 'La souffrance fait partie de la vie' ou 'D'autres personnes ressentent cela aussi'.",
            "Posez une main sur votre cœur (ou un autre endroit apaisant). Sentez la chaleur et le contact doux.",
            "Offrez-vous des mots de gentillesse et de soutien. Dites-vous : 'Que je puisse être bienveillant(e) avec moi-même', 'Que je puisse m'accepter tel(le) que je suis dans ce moment', ou 'Que je puisse me donner la compassion dont j'ai besoin'." ,
            "Restez avec ces sensations quelques instants, puis reprenez votre journée."
        ]
    },
     {
        id: 'respiration_carree_texte',
        title: "Respiration Carrée (4x4 Texte)",
        type: 'text',
        description: "Version textuelle de la technique pour calmer et concentrer.",
        steps: [
            "Asseyez-vous confortablement, le dos droit mais détendu.", "Expirez complètement par la bouche.",
            "Inspirez lentement par le nez en comptant jusqu'à 4.", "Retenez votre souffle, poumons pleins, en comptant jusqu'à 4.",
            "Expirez lentement et complètement par la bouche en comptant jusqu'à 4.", "Retenez votre souffle, poumons vides, en comptant jusqu'à 4.",
            "Ceci est un cycle. Répétez pendant 1 à 5 minutes.", "Concentrez-vous sur le comptage et la sensation de l'air.",
            "Terminez et observez comment vous vous sentez."
        ]
    },
    {
        id: 'interactive_breathing_box',
        title: "🧘 Respiration Rythmée (Carrée Guidée)",
        type: 'interactive_breathing',
        description: "Un guide visuel et un décompte pour la respiration carrée (4-4-4-4).",
        config: { inhale: 4, hold1: 4, exhale: 4, hold2: 4, loops: 5 }
    },
    {
        id: 'interactive_54321',
        title: "⚓ Ancrage Sensoriel 5-4-3-2-1 (Guidé)",
        type: 'interactive_54321',
        description: "Reconnectez-vous au présent en observant vos sens, étape par étape.",
        stepsPrompt: [
            { count: 5, sense: "CHOSES à VOIR", instruction: "Regardez autour et nommez cinq choses distinctes.", placeholder: "Ex: plante, livre, ombre..." },
            { count: 4, sense: "CHOSES à TOUCHER", instruction: "Identifiez quatre sensations tactiles.", placeholder: "Ex: texture vêtement, chaise..." },
            { count: 3, sense: "SONS à ENTENDRE", instruction: "Écoutez et nommez trois sons distincts.", placeholder: "Ex: silence, oiseau, respiration..." },
            { count: 2, sense: "ODEURS à SENTIR", instruction: "Identifiez deux odeurs, même subtiles.", placeholder: "Ex: air frais, parfum..." },
            { count: 1, sense: "CHOSE à GOÛTER (ou 1 qualité positive)", instruction: "Portez attention à votre bouche ou nommez une chose positive sur vous.", placeholder: "Ex: goût dentifrice, ou 'Je suis fort(e)'..." }
        ]
    }
];

let interactiveTimerId = null;
let interactivePhase = '';
let interactivePhaseTimer = 0;
let interactiveLoops = 0;
let five4321StepIndex = 0;

function stopCurrentInteractiveExercise() {
    if (interactiveTimerId) { clearInterval(interactiveTimerId); interactiveTimerId = null; }
    const visualizer = document.getElementById('interactiveBreathingVisualizer');
    if (visualizer) { visualizer.className = 'interactive-breathing-visualizer'; visualizer.style.animationName = 'none'; }
    interactivePhase = ''; interactivePhaseTimer = 0; interactiveLoops = 0;
}

function renderInteractiveBreathing(exerciseData, detailContainer) {
    stopCurrentInteractiveExercise();
    const config = exerciseData.config;
    // Le HTML est ajouté au detailContainer qui contient déjà le bouton retour
    detailContainer.innerHTML += `
        <div class="interactive-exercise-content">
            <h4>${exerciseData.title}</h4>
            <div id="interactiveBreathingVisualizer" class="interactive-breathing-visualizer">
                <span id="interactiveBreathingCounter" class="interactive-breathing-counter">${config.inhale}</span>
            </div>
            <p id="interactiveBreathingInstruction" aria-live="assertive">Préparez-vous...</p>
            <button id="startStopInteractiveBreathBtn" class="button-primary">Démarrer</button>
        </div>
    `;
    const visualizer = detailContainer.querySelector('#interactiveBreathingVisualizer');
    const counterEl = detailContainer.querySelector('#interactiveBreathingCounter');
    const instructionEl = detailContainer.querySelector('#interactiveBreathingInstruction');
    const startStopBtn = detailContainer.querySelector('#startStopInteractiveBreathBtn');

    function updateCycle() {
        if(!visualizer || !counterEl || !instructionEl) { stopCurrentInteractiveExercise(); return; } // Sécurité
        if (interactivePhaseTimer > 0) {
            counterEl.textContent = interactivePhaseTimer; interactivePhaseTimer--;
        } else {
            switch (interactivePhase) {
                case 'starting': case 'hold2':
                    interactivePhase = 'inhale'; interactivePhaseTimer = config.inhale; instructionEl.textContent = 'Inspirez...';
                    visualizer.className = 'interactive-breathing-visualizer ib-inhale'; visualizer.style.animationDuration = `${config.inhale}s`; break;
                case 'inhale':
                    interactivePhase = 'hold1'; interactivePhaseTimer = config.hold1; instructionEl.textContent = 'Retenez...';
                    visualizer.className = 'interactive-breathing-visualizer ib-hold'; visualizer.style.animationDuration = `${config.hold1}s`; break;
                case 'hold1':
                    interactivePhase = 'exhale'; interactivePhaseTimer = config.exhale; instructionEl.textContent = 'Expirez...';
                    visualizer.className = 'interactive-breathing-visualizer ib-exhale'; visualizer.style.animationDuration = `${config.exhale}s`; break;
                case 'exhale':
                    interactiveLoops++;
                    if (interactiveLoops >= config.loops) { stopCurrentInteractiveExercise(); instructionEl.textContent = "Terminé !"; startStopBtn.textContent="Recommencer"; return; }
                    interactivePhase = 'hold2'; interactivePhaseTimer = config.hold2; instructionEl.textContent = 'Retenez (poumons vides)...';
                    visualizer.className = 'interactive-breathing-visualizer ib-hold'; visualizer.style.animationDuration = `${config.hold2}s`; break;
            }
            counterEl.textContent = interactivePhaseTimer; interactivePhaseTimer--;
        }
    }
    startStopBtn.addEventListener('click', () => {
        if (interactiveTimerId) { stopCurrentInteractiveExercise(); instructionEl.textContent = `Exercice arrêté.`; counterEl.textContent = ''; startStopBtn.textContent = 'Démarrer'; }
        else { interactiveLoops = 0; interactivePhase = 'starting'; interactivePhaseTimer = 1; instructionEl.textContent = 'Préparez-vous...'; counterEl.textContent = ''; startStopBtn.textContent = 'Arrêter'; setTimeout(() => { interactivePhaseTimer = 0; updateCycle(); interactiveTimerId = setInterval(updateCycle, 1000); }, 500); }
    });
     instructionEl.textContent = `Cliquez pour ${config.loops} cycles (Insp ${config.inhale}s - Ret ${config.hold1}s - Exp ${config.exhale}s - Ret ${config.hold2}s).`;
     if(counterEl) counterEl.textContent = config.inhale; // Affichage initial
}

function renderInteractive54321(exerciseData, detailContainer) {
    stopCurrentInteractiveExercise();
    five4321StepIndex = 0;
    const contentWrapper = document.createElement('div'); // Wrapper pour le contenu 54321
    contentWrapper.className = 'interactive-exercise-content';
    detailContainer.appendChild(contentWrapper);

    function displayStep(index) {
        const step = exerciseData.stepsPrompt[index];
        contentWrapper.innerHTML = `
            <h4>${exerciseData.title} - Étape ${index + 1}/${exerciseData.stepsPrompt.length}</h4>
            <div class="interactive-54321-step">
                <p class="sense-prompt"><strong>${step.count} ${step.sense}</strong></p>
                <p class="sense-instruction">${step.instruction}</p>
                <label for="user-input-54321-${index}" class="visually-hidden">Observations pour ${step.sense}</label>
                <textarea id="user-input-54321-${index}" rows="3" placeholder="${step.placeholder || 'Vos observations (optionnel)...'}"></textarea>
            </div>
            <div class="interactive-54321-controls">
                ${index > 0 ? '<button id="prev54321Btn" class="button-secondary">Précédent</button>' : ''}
                ${index < exerciseData.stepsPrompt.length - 1 ? '<button id="next54321Btn" class="button-primary">Suivant</button>' : '<button id="finish54321Btn" class="button-primary">Terminer</button>'}
            </div>`;
        const nextBtn = contentWrapper.querySelector('#next54321Btn');
        const prevBtn = contentWrapper.querySelector('#prev54321Btn');
        const finishBtn = contentWrapper.querySelector('#finish54321Btn');
        if (nextBtn) { nextBtn.addEventListener('click', () => { five4321StepIndex++; displayStep(five4321StepIndex); }); }
        if (prevBtn) { prevBtn.addEventListener('click', () => { five4321StepIndex--; displayStep(five4321StepIndex); }); }
        if (finishBtn) { finishBtn.addEventListener('click', () => { contentWrapper.innerHTML = `<h4>${exerciseData.title}</h4><p>Bravo ! Exercice d'ancrage terminé. Observez comment vous vous sentez.</p>`; /* Pas de bouton retour ici, le bouton global de la vue est utilisé */ }); }
         // Mettre le focus sur le textarea
         const currentTextarea = contentWrapper.querySelector(`#user-input-54321-${index}`);
         if(currentTextarea) currentTextarea.focus();
    }
    displayStep(five4321StepIndex);
}

function attachBackToListListener(detailContainer) {
    const backBtn = detailContainer.querySelector('#backToListBtnExercises');
    const listContainer = document.getElementById('exerciseListContainer');
    if (backBtn && listContainer) {
        backBtn.addEventListener('click', () => {
            stopCurrentInteractiveExercise();
            detailContainer.style.display = 'none';
            detailContainer.innerHTML = ''; // Vider
            listContainer.style.display = 'block';
        }, { once: true });
    }
}

function showExerciseDetail(exerciseId) {
    stopCurrentInteractiveExercise();
    const exercise = exercisesData.find(ex => ex.id === exerciseId);
    if (!exercise) return;
    const listContainer = document.getElementById('exerciseListContainer');
    const detailContainer = document.getElementById('exerciseDetail');
    if (!listContainer || !detailContainer) return;
    detailContainer.innerHTML = `<button id="backToListBtnExercises" class="back-button button-secondary">← Retour aux exercices</button>`; // Bouton retour d'abord
    attachBackToListListener(detailContainer); // Attacher son listener
    const contentTarget = document.createElement('div'); // Wrapper pour contenu spécifique
    detailContainer.appendChild(contentTarget);

    if (exercise.type === 'interactive_breathing') { renderInteractiveBreathing(exercise, contentTarget); }
    else if (exercise.type === 'interactive_54321') { renderInteractive54321(exercise, contentTarget); }
    else { // Type 'text'
        let stepsHtml = '<ol class="steps-list">'; (exercise.steps || []).forEach((step, index) => { stepsHtml += `<li class="step-${index + 1}"><strong>Étape ${index + 1}:</strong> ${step}</li>`; }); stepsHtml += '</ol>';
        contentTarget.innerHTML = `<h3>${exercise.title}</h3><div class="exercise-steps">${stepsHtml}</div>`;
    }
    listContainer.style.display = 'none';
    detailContainer.style.display = 'block';
}

function displayExerciseList(listElement) {
    listElement.innerHTML = '';
    if (exercisesData.length === 0) { listElement.innerHTML = '<p>Aucun exercice.</p>'; return; }
    exercisesData.forEach(exercise => {
        const li = document.createElement('li'); li.className = 'exercise-list-item'; li.dataset.exerciseId = exercise.id;
        li.setAttribute('role', 'button'); li.setAttribute('tabindex', '0');
        const titleH4 = document.createElement('h4'); titleH4.textContent = exercise.title;
        const descP = document.createElement('p'); descP.textContent = exercise.description;
        li.appendChild(titleH4); li.appendChild(descP);
        li.addEventListener('click', () => showExerciseDetail(exercise.id));
        li.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); showExerciseDetail(exercise.id); } });
        listElement.appendChild(li);
    });
}

export function initExercisesView(containerElement) {
    if (!containerElement) { console.error("Conteneur vue Exercices introuvable."); return; }
    containerElement.innerHTML = `
        <h2>Exercices Guidés</h2>
        <div id="exerciseListContainer">
             <p class="exercises-intro">Choisissez un exercice pour commencer.</p>
             <ul id="exerciseList"></ul>
        </div>
        <div id="exerciseDetail" style="display: none;"></div>`;
    const listUl = containerElement.querySelector('#exerciseList');
    if (listUl) { displayExerciseList(listUl); }
    else { console.error("#exerciseList introuvable."); }
}
