// cravingsView.js (Implémentation des outils de gestion des envies)
import { loadDataFromLS, saveDataToLS } from './storageUtils.js'; // Utiliser LS pour les distractions simples

const DISTRACTIONS_LS_KEY = 'claireAppDistractionsList'; // Clé pour localStorage

// --- Données Statiques (Contenu des exercices) ---
const observeToolContent = {
    title: "🧘 Observer l'Envie (Pleine Conscience)",
    steps: [
        "Reconnaissez l'envie sans jugement. Dites-vous : 'Ok, une envie est présente'.",
        "Installez-vous confortablement et fermez les yeux si possible, ou fixez un point neutre.",
        "Portez votre attention sur votre respiration. Observez l'air entrer et sortir, sans chercher à la modifier.",
        "Où ressentez-vous l'envie dans votre corps ? (Gorge serrée, ventre noué, agitation...). Observez ces sensations physiques comme des vagues, sans vous y accrocher.",
        "Quelles pensées accompagnent cette envie ? ('J\'en ai besoin', 'Juste un peu...', 'Ça va m'aider à me sentir mieux...'). Observez ces pensées passer comme des nuages, sans les croire ou les alimenter.",
        "Remarquez l'intensité de l'envie. Est-elle forte, moyenne, faible ? Est-ce qu'elle change ?",
        "Rappelez-vous que l'envie est temporaire. Comme une vague, elle va monter, atteindre un pic, puis redescendre. Votre travail est de rester présent(e) et de 'surfer' cette vague sans y céder.",
        "Continuez à respirer consciemment et à observer les sensations et pensées jusqu'à ce que l'intensité de l'envie diminue notablement.",
        "Félicitez-vous d'avoir pris ce temps pour observer plutôt que de réagir automatiquement."
    ]
};

const challengeToolContent = {
     title: "🤔 Défier la Pensée (TCC Simple)",
     prompts: [
         "Quelle est la pensée exacte associée à cette envie ? (Ex: 'J'ai besoin de [substance/comportement] pour me détendre')",
         "Quelles preuves avez-vous que cette pensée est 100% vraie maintenant ?",
         "Quelles preuves avez-vous qu'elle pourrait ne pas être entièrement vraie ou utile ?",
         "Quels seraient les avantages *immédiats* si vous cédiez à l'envie ?",
         "Quels seraient les inconvénients *à court terme* (dans les prochaines heures/jours) ?",
         "Quels seraient les inconvénients *à long terme* (par rapport à vos objectifs, valeurs, bien-être) ?",
         "Existe-t-il une pensée alternative plus réaliste ou plus utile ? (Ex: 'Je *veux* [substance], mais je n'en ai pas *besoin*. Je peux trouver une autre façon de me détendre.')",
         "Quelle action Saine pourriez-vous faire MAINTENANT à la place ?"
     ]
};

// --- Fonctions Outils ---

/** Charge les distractions depuis localStorage */
function loadDistractions() {
    const data = loadDataFromLS(DISTRACTIONS_LS_KEY); // Utilise le helper LS
    return Array.isArray(data) ? data : []; // Retourne un tableau vide si non trouvé/invalide
}

/** Sauvegarde les distractions dans localStorage */
function saveDistractions(distractionsList) {
    return saveDataToLS(DISTRACTIONS_LS_KEY, distractionsList); // Utilise le helper LS
}

/** Ajoute une distraction */
function addDistraction(text, listElement) {
    const distractions = loadDistractions();
    const newDistraction = text.trim();
    if (newDistraction && !distractions.includes(newDistraction)) {
        distractions.push(newDistraction);
        if (saveDistractions(distractions)) {
            // Ajouter directement à la liste affichée
            const li = document.createElement('li');
            li.textContent = newDistraction;
            // Ajouter bouton supprimer à côté
             const deleteBtn = document.createElement('button');
             deleteBtn.textContent = '×';
             deleteBtn.className = 'delete-distraction-btn button-delete'; // Style léger
             deleteBtn.title = 'Supprimer cette distraction';
             deleteBtn.addEventListener('click', () => deleteDistraction(newDistraction, listElement.parentElement)); // Passe le conteneur pour re-render
            li.appendChild(deleteBtn);
            listElement.appendChild(li);
             // Enlever message "aucune distraction" s'il existe
             const noDistractionMsg = listElement.querySelector('.no-distractions-message');
             if (noDistractionMsg) noDistractionMsg.remove();

            return true; // Succès
        }
    } else if (distractions.includes(newDistraction)) {
        alert("Cette distraction existe déjà.");
    }
    return false; // Échec ou déjà existant
}

/** Supprime une distraction */
function deleteDistraction(text, contentArea) {
    let distractions = loadDistractions();
    distractions = distractions.filter(d => d !== text);
    if (saveDistractions(distractions)) {
        // Re-rendre la section distraction
        renderDistractionTool(contentArea);
    } else {
         alert("Erreur lors de la suppression de la distraction.");
    }
}


// --- Fonctions de Rendu des Outils ---

function renderObserveTool(contentArea) {
    let stepsHtml = '<ol>';
    observeToolContent.steps.forEach(step => {
        stepsHtml += `<li>${step}</li>`;
    });
    stepsHtml += '</ol>';
    contentArea.innerHTML += `<h4>${observeToolContent.title}</h4><div class="tool-content">${stepsHtml}</div>`;
}

function renderChallengeTool(contentArea) {
    let promptsHtml = '<div class="challenge-prompts">';
    challengeToolContent.prompts.forEach((prompt, index) => {
        promptsHtml += `
            <div class="prompt-item">
                <p><strong>${index + 1}. ${prompt}</strong></p>
                <label for="challenge-response-${index}" class="visually-hidden">Votre réponse ${index + 1}</label>
                <textarea id="challenge-response-${index}" rows="2" placeholder="Votre réflexion..."></textarea>
            </div>
        `;
    });
    promptsHtml += '</div><p><em>Prenez le temps de répondre honnêtement pour vous-même. Il n\'est pas nécessaire de sauvegarder ces réponses ici.</em></p>';
    contentArea.innerHTML += `<h4>${challengeToolContent.title}</h4><div class="tool-content">${promptsHtml}</div>`;
}

function renderDistractionTool(contentArea) {
    const distractions = loadDistractions();
    let listHtml = '<p class="no-distractions-message">Aucune distraction personnelle ajoutée.</p>';
    if (distractions.length > 0) {
        listHtml = '<ul id="distractionList">';
        distractions.forEach(d => {
            // Création sécurisée
            const li = document.createElement('li');
            const textNode = document.createTextNode(d + ' '); // Ajoute espace avant bouton
            const deleteBtn = document.createElement('button');
             deleteBtn.textContent = '×';
             deleteBtn.className = 'delete-distraction-btn button-delete';
             deleteBtn.title = 'Supprimer cette distraction';
             deleteBtn.addEventListener('click', () => deleteDistraction(d, contentArea));
            li.appendChild(textNode);
            li.appendChild(deleteBtn);
            listHtml += li.outerHTML; // Ajouter l'élément sérialisé
        });
        listHtml += '</ul>';
    }

    contentArea.innerHTML += `
        <h4> distract_box: Boîte à Distractions</h4>
        <div class="tool-content">
            <p>Voici quelques idées que vous avez ajoutées pour vous changer les idées rapidement :</p>
            ${listHtml}
            <div class="add-distraction-form">
                <label for="newDistractionInput" class="visually-hidden">Nouvelle distraction:</label>
                <input type="text" id="newDistractionInput" placeholder="Ajouter une idée (ex: boire un thé, marcher 5 min)..." maxlength="80">
                <button id="addDistractionBtn" class="button-secondary">Ajouter</button>
            </div>
        </div>`;

    // Ajouter listener au bouton d'ajout
    const addBtn = contentArea.querySelector('#addDistractionBtn');
    const input = contentArea.querySelector('#newDistractionInput');
    const listUl = contentArea.querySelector('#distractionList'); // Peut être null si vide initialement

    if (addBtn && input) {
        addBtn.addEventListener('click', () => {
            const text = input.value;
            // Recréer la liste UL si elle n'existait pas avant l'ajout
            let currentListUl = contentArea.querySelector('#distractionList');
            if (!currentListUl) {
                 const pMsg = contentArea.querySelector('.no-distractions-message');
                 if (pMsg) pMsg.remove(); // Enlever le message "aucune"
                 currentListUl = document.createElement('ul');
                 currentListUl.id = 'distractionList';
                 // Insérer avant le formulaire d'ajout
                 const formDiv = contentArea.querySelector('.add-distraction-form');
                 if(formDiv) formDiv.parentNode.insertBefore(currentListUl, formDiv);
            }

            if (addDistraction(text, currentListUl)) { // Passe la liste UL
                input.value = ''; // Vider si succès
            }
        });
         // Permettre ajout avec Entrée
         input.addEventListener('keydown', (event) => {
             if(event.key === 'Enter' && addBtn) {
                  event.preventDefault();
                  addBtn.click();
             }
         });
    }
}


/** Charge et affiche le contenu de l'outil sélectionné. */
function loadToolContent(toolId, contentArea) {
    contentArea.innerHTML = ''; // Vider l'ancien contenu

    // Ajouter systématiquement le bouton Retour
    const backButton = document.createElement('button');
    backButton.id = 'backToCravingMenu';
    backButton.className = 'back-button button-secondary';
    backButton.innerHTML = '← Choisir un autre outil';
    backButton.addEventListener('click', () => {
         contentArea.innerHTML = ''; // Vider le contenu de l'outil
         document.querySelectorAll('.cravings-tools-menu .tool-button.active').forEach(btn => btn.classList.remove('active'));
    });
    contentArea.appendChild(backButton);

    // Créer un div pour le contenu spécifique de l'outil
    const toolSpecificContent = document.createElement('div');
    contentArea.appendChild(toolSpecificContent);

    // Appeler la fonction de rendu appropriée en lui passant le nouveau div
    switch (toolId) {
        case 'observe':
            renderObserveTool(toolSpecificContent);
            break;
        case 'challenge':
            renderChallengeTool(toolSpecificContent);
            break;
        case 'distract':
            renderDistractionTool(toolSpecificContent);
            break;
        case 'sos':
            // Redirection gérée dans setupToolButtons
            contentArea.innerHTML = ''; // Vider si on clique sur SOS
            break;
        default:
            toolSpecificContent.innerHTML = '<p>Outil non reconnu.</p>';
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

        // Gérer la redirection SOS séparément
        if (tool === 'sos') {
            if (typeof window.showView === 'function') {
                window.showView('sosView'); // Utilise la fonction globale
            } else {
                console.error("Fonction showView non accessible pour rediriger vers SOS.");
                contentArea.innerHTML = '<p>Erreur: Impossible de charger les ressources SOS.</p>';
            }
            return; // Ne pas continuer pour SOS
        }

        // Marquer le bouton actif (pour les autres outils)
        menu.querySelectorAll('.tool-button').forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');

        // Charger le contenu de l'outil
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
            <button data-tool="distract" class="tool-button button-secondary"> distract_box: Distractions</button> <!-- Utiliser un emoji ou icône -->
            <button data-tool="sos" class="tool-button button-secondary">🆘 Urgence</button> <!-- Simplifier texte -->
        </div>
        <div id="cravingsToolContent" class="tool-content-area">
            <!-- Contenu de l'outil -->
        </div>
    `;
    setupToolButtons(containerElement);
}
