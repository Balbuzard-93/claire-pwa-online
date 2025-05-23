// resourcesView.js

export function initResourcesView(containerElement) {
    containerElement.innerHTML = `
        <h2>Ressources Éducatives</h2>
        <p>Explorez ces ressources pour approfondir vos connaissances et pratiques de bien-être.</p>
        <div id="resourcesListContainer">
            <p>Chargement des ressources...</p>
        </div>
    `;

    const resourcesListContainer = containerElement.querySelector('#resourcesListContainer');

    async function fetchAndDisplayResources() {
        try {
            const response = await fetch('./resources.json');
            if (!response.ok) {
                throw new Error(`Erreur HTTP: ${response.status} - ${response.statusText}`);
            }
            const resources = await response.json();

            if (!Array.isArray(resources) || resources.length === 0) {
                resourcesListContainer.innerHTML = '<p>Aucune ressource disponible pour le moment.</p>';
                return;
            }

            // Group resources by category
            const groupedResources = resources.reduce((acc, resource) => {
                const category = resource.category || 'Autres'; // Default category if undefined
                if (!acc[category]) {
                    acc[category] = [];
                }
                acc[category].push(resource);
                return acc;
            }, {});

            resourcesListContainer.innerHTML = ''; // Clear loading message

            for (const category in groupedResources) {
                const categoryTitle = document.createElement('h3');
                categoryTitle.textContent = category;
                resourcesListContainer.appendChild(categoryTitle);

                const resourceList = document.createElement('ul');
                resourceList.classList.add('resource-category-list');

                groupedResources[category].forEach(resource => {
                    const listItem = document.createElement('li');
                    listItem.classList.add('resource-item');

                    const link = document.createElement('a');
                    link.href = resource.url;
                    link.textContent = resource.title;
                    link.target = '_blank'; // Open in new tab
                    link.rel = 'noopener noreferrer'; // Security best practice

                    const description = document.createElement('p');
                    description.textContent = resource.description;

                    listItem.appendChild(link);
                    listItem.appendChild(description);
                    resourceList.appendChild(listItem);
                });
                resourcesListContainer.appendChild(resourceList);
            }

        } catch (error) {
            console.error('Erreur lors du chargement des ressources:', error);
            resourcesListContainer.innerHTML = `
                <p style="color: red;">Impossible de charger les ressources.</p>
                <p style="font-size: 0.8em;">Détail: ${error.message}</p>
                <p style="font-size: 0.8em;">Veuillez vérifier que le fichier 'resources.json' existe et est correctement formaté.</p>
            `;
        }
    }

    // Fetch and display resources when the view is initialized
    fetchAndDisplayResources();
}
