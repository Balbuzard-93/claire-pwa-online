// cravingsView.js
// TODO: Implémenter la logique de la vue "Gérer une Envie"

/**
 * Initialise la vue de gestion des envies.
 * @param {HTMLElement} containerElement - L'élément DOM où injecter l'interface.
 */
export function initCravingsView(containerElement) {
    if (!containerElement) {
        console.error("Conteneur vue Gestion Envies introuvable.");
        return;
    }
    containerElement.innerHTML = `
        <h2>Gérer une Envie</h2>
        <p class="cravings-intro">Choisissez un outil pour vous aider à traverser ce moment :</p>
        <div class="cravings-tools-menu">
            <button data-tool="observe" class="tool-button button-secondary">🧘 Observer l'Envie</button>
            <button data-tool="challenge" class="tool-button button-secondary">🤔 Défier la Pensée</button>
            <button data-tool="distract" class="tool-button button-secondary"> distract_box: Boîte à Distractions</button>
            <button data-tool="sos" class="tool-button button-secondary">🆘 Ressources SOS</button>
        </div>
        <div id="cravingsToolContent" class="tool-content-area">
            <!-- Le contenu de l'outil sélectionné s'affichera ici -->
        </div>
    `;

    // Ajouter les écouteurs d'événements aux boutons d'outils (sera fait ensuite)
    setupToolButtons(containerElement);
}

/**
 * Ajoute les listeners aux boutons du menu d'outils.
 * @param {HTMLElement} containerElement
 */
function setupToolButtons(containerElement) {
    const menu = containerElement.querySelector('.cravings-tools-menu');
    const contentArea = containerElement.querySelector('#cravingsToolContent');
    if (!menu || !contentArea) return;

    menu.addEventListener('click', (event) => {
        const button = event.target.closest('button[data-tool]');
        if (!button) return;

        const tool = button.dataset.tool;
        // console.log("Outil sélectionné:", tool); // Debug

        // Marquer le bouton actif (optionnel)
        menu.querySelectorAll('.tool-button').forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');

        // Charger le contenu de l'outil
        loadToolContent(tool, contentArea);
    });
}

/**
 * Charge et affiche le contenu de l'outil sélectionné.
 * @param {string} toolId - L'ID de l'outil ('observe', 'challenge', 'distract', 'sos').
 * @param {HTMLElement} contentArea - La zone où afficher le contenu.
 */
function loadToolContent(toolId, contentArea) {
    contentArea.innerHTML = ''; // Vider l'ancien contenu
    // Ajouter le bouton Retour en haut de chaque outil
    contentArea.innerHTML = `<button id="backToCravingMenu" class="back-button button-secondary">← Choisir un autre outil</button>`;
    const backButton = contentArea.querySelector('#backToCravingMenu');
    if(backButton) {
        backButton.addEventListener('click', () => {
             contentArea.innerHTML = ''; // Vider le contenu de l'outil
             // Désélectionner bouton actif (optionnel)
             document.querySelectorAll('.cravings-tools-menu .tool-button.active').forEach(btn => btn.classList.remove('active'));
        });
    }


    switch (toolId) {
        case 'observe':
            renderObserveTool(contentArea);
            break;
        case 'challenge':
            renderChallengeTool(contentArea);
            break;
        case 'distract':
            renderDistractionTool(contentArea);
            break;
        case 'sos':
            // Rediriger vers la vue SOS existante
            // Note: Assurer que showView est accessible globalement ou utiliser une autre méthode (event)
            if (typeof showView === 'function') {
                showView('sosView');
            } else {
                console.error("Fonction showView non accessible pour rediriger vers SOS.");
                contentArea.innerHTML += '<p>Erreur: Impossible de charger les ressources SOS.</p>';
            }
            // Vider le contenu ici car on change de vue
            contentArea.innerHTML = '';
            break;
        default:
            contentArea.innerHTML += '<p>Outil non reconnu.</p>';
    }
}

// --- Fonctions de rendu pour chaque outil (à implémenter) ---

function renderObserveTool(contentArea) {
    // Contenu sera ajouté à l'étape suivante
    contentArea.innerHTML += `<h4>🧘 Observer l'Envie (Pleine Conscience)</h4><p>Contenu de l'exercice ici...</p>`;
}

function renderChallengeTool(contentArea) {
     // Contenu sera ajouté à l'étape suivante
    contentArea.innerHTML += `<h4>🤔 Défier la Pensée (TCC Simple)</h4><p>Contenu des questions ici...</p>`;
}

function renderDistractionTool(contentArea) {
     // Contenu sera ajouté à l'étape suivante (avec gestion localStorage)
    contentArea.innerHTML += `<h4> distract_box: Boîte à Distractions</h4><p>Liste et ajout de distractions ici...</p>`;
}

// Pas de fonction refresh spécifique nécessaire pour l'instant
// La vue est générée à chaque affichage via initCravingsView
