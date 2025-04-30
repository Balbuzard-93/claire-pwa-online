// victoriesView.js
import { getVictories, saveVictories } from './storageUtils.js';

/**
 * Supprime une victoire de la liste et sauvegarde.
 * @param {number} victoryId - L'ID unique de la victoire à supprimer.
 */
function deleteVictory(victoryId) {
    const currentVictories = getVictories();
    // S'assurer que c'est bien un tableau
    if (!Array.isArray(currentVictories)) return;

    const updatedVictories = currentVictories.filter(v => v.id !== victoryId);

    if (saveVictories(updatedVictories)) {
        displayVictoriesList(); // Rafraîchir la liste après suppression
    } else {
        // Erreur gérée (alerte) dans saveVictories
        console.error("Échec de la sauvegarde après suppression de victoire.");
    }
}

/**
 * Affiche la liste des victoires enregistrées.
 */
function displayVictoriesList() {
    const listContainer = document.getElementById('victoriesList');
    if (!listContainer) { console.error("Conteneur #victoriesList introuvable."); return; }

    const victories = getVictories();
    listContainer.innerHTML = ''; // Nettoyer

    if (victories.length === 0) {
        listContainer.innerHTML = '<p class="no-victories-message">Votre musée est vide pour le moment. Ajoutez votre première victoire ! ✨</p>';
        return;
    }

    // Trier par date décroissante (plus récent en premier)
    victories.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    victories.forEach(victory => {
        const itemDiv = document.createElement('div');
        itemDiv.className = 'victory-item';
        itemDiv.dataset.victoryId = victory.id;

        let formattedDate = 'Date inconnue';
        try {
             formattedDate = new Date(victory.timestamp).toLocaleDateString('fr-FR', {
                year: 'numeric', month: 'short', day: 'numeric' // Format plus court
            });
        } catch(e) { console.warn("Date victoire invalide:", victory.timestamp); }


        // Sécuriser l'affichage du texte
        const textP = document.createElement('p');
        textP.className = 'victory-text';
        textP.textContent = victory.text || ''; // Assurer string

        // Construire l'innerHTML (plus simple mais moins sécurisé si text contenait du HTML)
        // Alternative: construire avec appendChild comme dans d'autres modules
        itemDiv.innerHTML = `
            <div class="victory-content">
                <span class="victory-date">${formattedDate}</span>
                ${textP.outerHTML} <!-- Insérer le paragraphe sécurisé -->
            </div>
            <button class="delete-victory-btn button-delete" title="Supprimer cette victoire" aria-label="Supprimer la victoire: ${victory.text || 'sans titre'}">×</button>
        `;

        // Ajouter l'écouteur pour le bouton supprimer
        const deleteBtn = itemDiv.querySelector('.delete-victory-btn');
        if (deleteBtn) {
            deleteBtn.addEventListener('click', (event) => {
                event.stopPropagation();
                // Utiliser textContent du p créé plus haut pour le confirm
                if (confirm(`Supprimer cette victoire ?\n"${textP.textContent}"`)) {
                    deleteVictory(victory.id);
                }
            });
        }

        listContainer.appendChild(itemDiv);
    });
}

/**
 * Ajoute une nouvelle victoire à la liste.
 */
function addVictory() {
    const inputElement = document.getElementById('newVictoryInput');
    if(!inputElement) return;
    const text = inputElement.value.trim();

    if (!text) {
        alert("Veuillez décrire votre victoire.");
        return;
    }

    const newVictory = {
        id: Date.now(), // Utiliser timestamp comme ID unique
        timestamp: new Date().toISOString(), // Format standard pour stockage
        text: text
    };

    const currentVictories = getVictories(); // Récupère le tableau actuel
    // Ajout au début pour affichage récent en premier sans re-tri complet
    const updatedVictories = [newVictory, ...currentVictories];

    if (saveVictories(updatedVictories)) {
        inputElement.value = ''; // Nettoyer l'input
        displayVictoriesList(); // Rafraîchir la liste complète
    }
    // Erreur gérée dans saveVictories
}


/**
 * Initialise la vue du Musée des Victoires.
 * @param {HTMLElement} containerElement - L'élément DOM où injecter l'interface.
 */
export function initVictoriesView(containerElement) {
    if (!containerElement) { console.error("Conteneur vue Victoires introuvable."); return; }

    // Créer la structure HTML de base
    containerElement.innerHTML = `
        <h2>Musée des Victoires</h2>
        <div class="victory-add-form">
             <label for="newVictoryInput" class="visually-hidden">Nouvelle victoire :</label>
            <textarea id="newVictoryInput" placeholder="Quelle petite ou grande victoire célébrer ?" rows="3" aria-label="Nouvelle victoire" maxlength="300"></textarea> <!-- Limite longueur -->
            <button id="addVictoryBtn">Ajouter au musée ✨</button>
        </div>
        <div id="victoriesList">
            <!-- La liste sera injectée ici -->
        </div>
    `;

    // Ajouter l'écouteur pour le bouton Ajouter
    const addBtn = containerElement.querySelector('#addVictoryBtn');
    if (addBtn) {
         // Appliquer style spécifique "or" ici si on n'utilise pas de classe CSS dédiée
        addBtn.style.backgroundColor = '#FFD700';
        addBtn.style.color = '#333';
        // Ajouter listener
        addBtn.addEventListener('click', addVictory);
         // Permettre ajout avec Entrée (Shift+Enter pour saut ligne) dans textarea
         const inputEl = containerElement.querySelector('#newVictoryInput');
         if(inputEl) {
              inputEl.addEventListener('keydown', (event) => {
                  if (event.key === 'Enter' && !event.shiftKey) {
                       event.preventDefault(); // Empêche le saut de ligne
                       addBtn.click(); // Déclenche l'ajout
                  }
              });
         }

    } else {
         console.error("Bouton #addVictoryBtn introuvable.");
    }

    // Afficher la liste initiale
    displayVictoriesList();
}