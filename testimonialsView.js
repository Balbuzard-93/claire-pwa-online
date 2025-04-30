// testimonialsView.js

const testimonialsData = [
    { id: 'ta1', title: '"Le premier pas était le plus dur..."', text: "Pendant des années, j'ai cru que je ne pourrais jamais arrêter. L'alcool contrôlait ma vie... mais demander de l'aide et m'entourer de soutien a tout changé. Aujourd'hui, je redécouvre la vie... Si je peux le faire, vous le pouvez aussi. Accrochez-vous.", category: 'Sobriété' },
    { id: 'tt1', title: '"Comprendre mon TDA a été une révélation..."', text: "J'ai longtemps lutté contre le sentiment d'être différent... Le diagnostic a été un choc, mais aussi un soulagement... Apprendre à travailler *avec* mon cerveau, et non contre lui... m'a permis de retrouver confiance... Le chemin n'est pas toujours facile, mais il est possible.", category: 'TDA' },
    { id: 'td1', title: '"Même dans l\'obscurité..."', text: "La dépression m'a fait croire que je ne valais rien... Sortir du lit était une épreuve... Petit à petit, en acceptant l'aide... j'ai commencé à voir des éclaircies... La guérison est un voyage, mais elle est possible.", category: 'Dépression' },
    { id: 'tg1', title: '"La résilience, c\'est savoir se relever."', text: "J'ai affronté plusieurs défis... Ce qui m'a aidé, c'est de comprendre que la vulnérabilité n'est pas une faiblesse... chercher activement ce qui nous fait du bien... Se reconstruire prend du temps, mais chaque effort est un acte de courage.", category: 'Général' }
    // Ajouter d'autres témoignages ici...
];

/**
 * Affiche la liste des témoignages.
 * @param {HTMLElement} listContainer - L'élément où afficher la liste.
 */
function displayTestimonials(listContainer) {
    listContainer.innerHTML = ''; // Vider
    if (!Array.isArray(testimonialsData) || testimonialsData.length === 0) {
        listContainer.innerHTML = '<p>Aucun témoignage disponible pour le moment.</p>';
        return;
    }

    testimonialsData.forEach(testimonial => {
        const article = document.createElement('article');
        article.className = 'testimonial-item';
        article.dataset.category = testimonial.category || 'Général';

        // Utiliser textContent pour la sécurité des données
        const titleH4 = document.createElement('h4');
        titleH4.className = 'testimonial-title';
        titleH4.textContent = testimonial.title || ''; // Gérer titre optionnel

        const textDiv = document.createElement('div');
        textDiv.className = 'testimonial-text';
        const textP = document.createElement('p');
        textP.textContent = testimonial.text || ''; // Assurer une chaîne
        textP.style.whiteSpace = 'pre-wrap'; // Préserver les sauts de ligne potentiels
        textDiv.appendChild(textP);

        // Ajouter le titre seulement s'il n'est pas vide
        if (testimonial.title) {
             article.appendChild(titleH4);
        }
        article.appendChild(textDiv);

        listContainer.appendChild(article);
    });
}

/**
 * Initialise la vue des Témoignages.
 * @param {HTMLElement} containerElement - L'élément DOM où injecter l'interface.
 */
export function initTestimonialsView(containerElement) {
    if (!containerElement) {
        console.error("Conteneur vue Témoignages introuvable.");
        return;
    }
    containerElement.innerHTML = `
        <h2>Parcours Inspirants</h2>
        <p class="testimonials-intro">Des histoires de résilience et d'espoir partagées pour vous rappeler que vous n'êtes pas seul(e).</p>
        <div id="testimonialsList"></div>
    `;
    const listDiv = containerElement.querySelector('#testimonialsList');
    if (listDiv) {
        displayTestimonials(listDiv);
    } else {
         console.error("Impossible de trouver #testimonialsList pour afficher les témoignages.");
    }
}