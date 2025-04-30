// exercisesView.js

// --- Données des Exercices ---
const exercisesData = [
    {
        id: 'relaxation_rapide',
        title: "Relaxation Rapide (5 min)",
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
        id: 'respiration_carree',
        title: "Respiration Carrée (4x4)",
        description: "Une technique simple pour calmer le système nerveux et améliorer la concentration.",
        steps: [
            "Asseyez-vous confortablement, le dos droit mais détendu.",
            "Expirez complètement par la bouche.",
            "Inspirez lentement par le nez en comptant jusqu'à 4.",
            "Retenez votre souffle, poumons pleins, en comptant jusqu'à 4.",
            "Expirez lentement et complètement par la bouche en comptant jusqu'à 4.",
            "Retenez votre souffle, poumons vides, en comptant jusqu'à 4.",
            "Ceci est un cycle. Répétez le cycle pendant 1 à 5 minutes, en maintenant un rythme régulier et confortable.",
            "Concentrez-vous sur le comptage et la sensation de l'air qui entre et sort.",
            "Lorsque vous avez terminé, revenez à une respiration normale et observez comment vous vous sentez."
        ]
    }
    // Ajouter d'autres exercices ici...
];

// --- Fonctions d'Affichage ---

/**
 * Affiche le détail d'un exercice sélectionné.
 * @param {string} exerciseId - L'ID de l'exercice à afficher.
 */
function showExerciseDetail(exerciseId) {
    const exercise = exercisesData.find(ex => ex.id === exerciseId);
    if (!exercise) {
        console.error(`Exercice avec ID ${exerciseId} non trouvé.`);
        return;
    }

    const listContainer = document.getElementById('exerciseListContainer'); // Conteneur de la liste
    const detailContainer = document.getElementById('exerciseDetail');

    if (!listContainer || !detailContainer) {
        console.error("Conteneurs de liste ou de détail non trouvés.");
        return;
    }

    // Construire le HTML du détail
    let detailHtml = `
        <button id="backToListBtn" class="back-button button-secondary">&larr; Retour à la liste</button>
        <h3>${exercise.title}</h3>
        <div class="exercise-steps">
    `;
    exercise.steps.forEach((step, index) => {
        // Ajouter une classe pour un style potentiel différent par étape
        detailHtml += `<p class="step-${index + 1}"><strong>Étape ${index + 1}:</strong> ${step}</p>`;
    });
    detailHtml += `</div>`;

    detailContainer.innerHTML = detailHtml;

    // Gérer l'affichage
    listContainer.style.display = 'none';
    detailContainer.style.display = 'block';

    // Ajouter l'écouteur pour le bouton retour
    const backBtn = detailContainer.querySelector('#backToListBtn');
    if (backBtn) {
        backBtn.addEventListener('click', () => {
            detailContainer.style.display = 'none';
            detailContainer.innerHTML = ''; // Nettoyer le contenu
            listContainer.style.display = 'block';
        }, { once: true });
    }
}


/**
 * Affiche la liste des exercices disponibles.
 * @param {HTMLElement} listElement - L'élément UL où afficher la liste.
 */
function displayExerciseList(listElement) {
    listElement.innerHTML = ''; // Vider la liste précédente

    if (exercisesData.length === 0) {
        listElement.innerHTML = '<p>Aucun exercice disponible pour le moment.</p>';
        return;
    }

    exercisesData.forEach(exercise => {
        const li = document.createElement('li');
        li.className = 'exercise-list-item';
        li.dataset.exerciseId = exercise.id; // Stocker l'ID
        // Rendre l'élément focusable et lui donner un rôle de bouton pour l'accessibilité
        li.setAttribute('role', 'button');
        li.setAttribute('tabindex', '0'); // Permet la navigation au clavier

        // Utiliser textContent pour la sécurité
        const titleH4 = document.createElement('h4');
        titleH4.textContent = exercise.title;
        const descP = document.createElement('p');
        descP.textContent = exercise.description;

        li.appendChild(titleH4);
        li.appendChild(descP);

        // Écouteur de clic
        li.addEventListener('click', () => {
            showExerciseDetail(exercise.id);
        });

        // Écouteur pour la touche Entrée (accessibilité clavier)
        li.addEventListener('keydown', (event) => {
             if (event.key === 'Enter' || event.key === ' ') {
                 event.preventDefault(); // Empêche le comportement par défaut (ex: scroll avec Espace)
                 showExerciseDetail(exercise.id);
             }
        });


        listElement.appendChild(li);
    });
}

/**
 * Initialise la vue des Exercices Guidés.
 * @param {HTMLElement} containerElement - L'élément DOM où injecter l'interface.
 */
export function initExercisesView(containerElement) {
    if (!containerElement) {
        console.error("L'élément conteneur pour la vue Exercices n'a pas été trouvé.");
        return;
    }

    // Créer la structure HTML de base
    containerElement.innerHTML = `
        <h2>Exercices Guidés</h2>
        <div id="exerciseListContainer">
             <p class="exercises-intro">Choisissez un exercice ci-dessous pour commencer.</p>
             <ul id="exerciseList"></ul>
        </div>
        <div id="exerciseDetail" style="display: none;">
            <!-- Le détail de l'exercice sera injecté ici -->
        </div>
    `;

    const exerciseListUl = containerElement.querySelector('#exerciseList');
    if (exerciseListUl) {
        displayExerciseList(exerciseListUl);
    } else {
        console.error("Impossible de trouver l'élément #exerciseList.");
    }
}