// cravingsView.js (Implémentation complète des outils de gestion des envies)
import { getDistractions, saveDistractions } from './storageUtils.js'; // Utiliser les fonctions LS exportées

// --- Données Statiques (Contenu des exercices) ---
const observeToolContent = {
    title: "🧘 Observer l'Envie (Pleine Conscience)",
    steps: [
        "Installez-vous confortablement. Fermez les yeux si possible.",
        "Reconnaissez l'envie sans jugement : 'Ok, une envie est présente'.",
        "Portez attention à votre respiration, observez l'air entrer et sortir.",
        "Où ressentez-vous l'envie dans votre corps ? Observez les sensations (gorge, ventre, agitation...) comme des vagues, sans vous y accrocher.",
        "Quelles pensées accompagnent l'envie ? Observez-les passer comme des nuages, sans les croire.",
        "Notez l'intensité de l'envie (forte, moyenne, faible). Change-t-elle ?",
        "Rappelez-vous : l'envie est temporaire. Elle monte, atteint un pic, puis redescend. Surfez la vague sans céder.",
        "Continuez à respirer et observer jusqu'à ce que l'intensité diminue.",
        "Félicitez-vous d'avoir observé plutôt que réagi."
    ]
};

const challengeToolContent = {
     title: "🤔 Défier la Pensée (TCC Simple)",
     prompts: [
         "Pensée associée à l'envie ? (Ex: 'J'en ai besoin pour me détendre')",
         "Preuves que c'est 100% vrai MAINTENANT ?",
         "Preuves que ce n'est pas (ou pas entièrement) vrai/utile ?",
         "Avantages immédiats si je cède ?",
         "Inconvénients à court terme (prochaines heures/jours) ?",
         "Inconvénients à long terme (objectifs, valeurs, bien-être) ?",
         "Pensée alternative plus réaliste/utile ? (Ex: 'J'en ai *envie*, pas *besoin*. Je peux me détendre autrement.')",
         "Quelle action SAINE puis-je faire MAINTENANT à la place ?"
     ]
};

// --- Fonctions Outils Distractions (utilisent storageUtils) ---

/** Ajoute une distraction (appelée par le listener) */
function addDistraction(text, listElement, inputElement) {
    const distractions = getDistractions(); // Lire depuis LS
    const newDistraction = text.trim();
    if (!newDistraction) { alert("Veuillez entrer une idée de distraction."); return false; }

    if (newDistraction && !distractions.some(d => d.toLowerCase() === newDistraction.toLowerCase())) { // Éviter doublons (insensible casse)
        distractions.push(newDistraction);
        if (saveDistractions(distractions)) { // Sauvegarder dans LS
            // Ajouter directement à la liste affichée
            appendDistractionToList(listElement, newDistraction);
             // Enlever message "aucune distraction" s'il existe
             const noDistractionMsg = listElement.querySelector('.no-distractions-message');
             if (noDistractionMsg) noDistractionMsg.remove();
            if(inputElement) inputElement.value = ''; // Vider input
            return true;
        } else {
             alert("Erreur lors de la sauvegarde de la distraction.");
             // Retirer de la liste locale si sauvegarde échoue ? (Moins critique pour LS)
        }
    } else if (distractions.some(d => d.toLowerCase() === newDistraction.toLowerCase())) {
        alert("Cette distraction existe déjà.");
    }
    return false;
}

/** Supprime une distraction (appelée par le listener) */
function deleteDistraction(text, listElement) {
    let distractions = getDistractions();
    distractions = distractions.filter(d => d !== text); // Filtrer la distraction à supprimer
    if (saveDistractions(distractions)) {
        // Supprimer l'élément LI de l'UI
        const itemToRemove = listElement.querySelector(`li[data-distraction-text="${text}"]`); // Utiliser un data-attribute
        if (itemToRemove) itemToRemove.remove();
        // Afficher message si liste devient vide
        if (distractions.length === 0) {
             listElement.innerHTML = '<p class="no-distractions-message">Aucune distraction personnelle ajoutée.</p>';
        }
    } else {
         alert("Erreur lors de la suppression de la distraction.");
    }
}

/** Ajoute un élément LI à la liste des distractions */
function appendDistractionToList(listElement, distractionText) {
     if (!listElement) return;
     const li = document.createElement('li');
     li.dataset.distractionText = distractionText; // Stocker texte pour suppression facile
     const textNode = document.createTextNode(distractionText + ' ');
     const deleteBtn = document.createElement('button');
     deleteBtn.textContent = '×';
     deleteBtn.className = 'delete-distraction-btn button-delete';
     deleteBtn.title = 'Supprimer cette distraction';
     deleteBtn.setAttribute('aria-label', `Supprimer la distraction: ${distractionText}`);
     deleteBtn.addEventListener('click', () => {
          if (confirm(`Supprimer "${distractionText}" de vos distractions ?`)) {
               deleteDistraction(distractionText, listElement);
          }
     });
     li.appendChild(textNode);
     li.appendChild(deleteBtn);
     listElement.appendChild(li);
}


// --- Fonctions de Rendu des Outils ---

/** Affiche l'outil "Observer l'Envie" */
function renderObserveTool(contentArea) {
    let stepsHtml = '<ol class="steps-list">'; // Ajouter une classe pour styler
    observeToolContent.steps.forEach(step => {
        stepsHtml += `<li>${step}</li>`;
    });
    stepsHtml += '</ol>';
    // Ajouter le contenu après le bouton retour déjà présent
    contentArea.insertAdjacentHTML('beforeend', `
        <h4>${observeToolContent.title}</h4>
        <div class="tool-content">${stepsHtml}</div>
    `);
}

/** Affiche l'outil "Défier la Pensée" */
function renderChallengeTool(contentArea) {
    let promptsHtml = '<div class="challenge-prompts">';
    challengeToolContent.prompts.forEach((prompt, index) => {
        promptsHtml += `
            <div class="prompt-item">
                <label for="challenge-response-${index}"><strong>${index + 1}. ${prompt}</strong></label>
                <textarea id="challenge-response-${index}" rows="3" placeholder="Votre réflexion..."></textarea>
            </div>
        `;
    });
    promptsHtml += '</div><p class="tool-footnote"><em>Ces réflexions sont pour vous, elles ne sont pas sauvegardées.</em></p>';
    contentArea.insertAdjacentHTML('beforeend', `
        <h4>${challengeToolContent.title}</h4>
        <div class="tool-content">${promptsHtml}</div>
    `);
}

/** Affiche l'outil "Boîte à Distractions" */
function renderDistractionTool(contentArea) {
    const distractions = getDistractions(); // Charger depuis LS
    let listHtml = '<p class="no-distractions-message">Aucune distraction personnelle ajoutée.</p>';
    if (distractions.length > 0) {
        // Créer le UL ici
        listHtml = '<ul id="distractionList"></ul>';
    }

    // Ajouter le contenu après le bouton retour
    contentArea.insertAdjacentHTML('beforeend', `
        <h4> distract_box: Boîte à Distractions</h4>
        <div class="tool-content">
            <p>Vos idées rapides pour vous changer les idées :</p>
            ${listHtml}
            <div class="add-distraction-form">
                <label for="newDistractionInput" class="visually-hidden">Nouvelle idée:</label>
                <input type="text" id="newDistractionInput" placeholder="Ajouter une idée (marche, musique...)" maxlength="80">
                <button id="addDistractionBtn" class="button-secondary">Ajouter</button>
            </div>
        </div>
    `);

    // Populer la liste UL si elle existe et s'il y a des données
    const listUl = contentArea.querySelector('#distractionList');
    if (listUl && distractions.length > 0) {
         distractions.forEach(d => appendDistractionToList(listUl, d));
    }

    // Ajouter listener au bouton d'ajout
    const addBtn = contentArea.querySelector('#addDistractionBtn');
    const input = contentArea.querySelector('#newDistractionInput');

    if (addBtn && input) {
        addBtn.addEventListener('click', () => {
            const text = input.value;
            let currentListUl = contentArea.querySelector('#distractionList'); // Retrouver la liste
            if (!currentListUl) { // Si elle n'existait pas (première distraction ajoutée)
                 const pMsg = contentArea.querySelector('.no-distractions-message');
                 if (pMsg) pMsg.remove();
                 currentListUl = document.createElement('ul');
                 currentListUl.id = 'distractionList';
                 const formDiv = contentArea.querySelector('.add-distraction-form');
                 if(formDiv) formDiv.parentNode.insertBefore(currentListUl, formDiv);
            }
            if (addDistraction(text, currentListUl, input)) { /* Input vidé dans addDistraction */ }
        });
         input.addEventListener('keydown', (event) => { if(event.key === 'Enter' && addBtn) { event.preventDefault(); addBtn.click(); } });
    }
}


/** Charge et affiche le contenu de l'outil sélectionné. */
function loadToolContent(toolId, contentArea) {
    contentArea.innerHTML = ''; // Vider l'ancien contenu

    const backButton = document.createElement('button');
    backButton.id = 'backToCravingMenu';
    backButton.className = 'back-button button-secondary';
    backButton.innerHTML = '← Choisir un autre outil';
    backButton.addEventListener('click', () => {
         contentArea.innerHTML = ''; // Vider
         document.querySelectorAll('.cravings-tools-menu .tool-button.active').forEach(btn => btn.classList.remove('active'));
    });
    contentArea.appendChild(backButton); // Ajouter le bouton retour d'abord

    // Créer un div pour le contenu spécifique
    const toolSpecificContent = document.createElement('div');
    contentArea.appendChild(toolSpecificContent);

    switch (toolId) {
        case 'observe': renderObserveTool(toolSpecificContent); break;
        case 'challenge': renderChallengeTool(toolSpecificContent); break;
        case 'distract': renderDistractionTool(toolSpecificContent); break;
        // Le cas 'sos' est géré directement dans setupToolButtons
        default: toolSpecificContent.innerHTML = '<p>Outil non reconnu.</p>';
    }
}


/** Ajoute les listeners aux boutons du menu d'outils. */
function setupToolButtons(containerElement) {
    const menu = containerElement.querySelector('.cravings-tools-menu');
    const contentArea = containerElement.querySelector('#cravingsToolContent');
    if (!menu || !contentArea) { console.error("Éléments menu/contenu cravings introuvables."); return; }

    menu.addEventListener('click', (event) => {
        const button = event.target.closest('button[data-tool]');
        if (!button) return;
        const tool = button.dataset.tool;

        if (tool === 'sos') {
            if (typeof window.showView === 'function') { window.showView('sosView'); }
            else { console.error("Fonction showView non accessible pour SOS."); contentArea.innerHTML = '<p>Erreur chargement SOS.</p>'; }
            return;
        }

        menu.querySelectorAll('.tool-button').forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');
        loadToolContent(tool, contentArea);
    });
}

/** Initialise la vue de gestion des envies. */
export function initCravingsView(containerElement) {
    if (!containerElement) { console.error("Conteneur vue Gestion Envies introuvable."); return; }
    containerElement.innerHTML = `
        <h2>Gérer une Envie</h2>
        <p class="cravings-intro">Choisissez un outil pour vous aider à traverser ce moment :</p>
        <div class="cravings-tools-menu">
            <button data-tool="observe" class="tool-button button-secondary">🧘 Observer</button>
            <button data-tool="challenge" class="tool-button button-secondary">🤔 Défier</button>
            <button data-tool="distract" class="tool-button button-secondary">💡 Distractions</button> <!-- Emoji idée -->
            <button data-tool="sos" class="tool-button button-secondary">🆘 Urgence</button>
        </div>
        <div id="cravingsToolContent" class="tool-content-area">
            <!-- Contenu de l'outil s'affichera ici -->
            <p>Sélectionnez un outil ci-dessus.</p> <!-- Message initial -->
        </div>
    `;
    setupToolButtons(containerElement);
}
