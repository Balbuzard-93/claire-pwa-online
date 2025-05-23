import { addGratitudeEntry, getGratitudeEntries, deleteGratitudeEntry } from './storageUtils.js';

export function initGratitudeJournal(containerElement) {
    containerElement.innerHTML = `
        <h2>Journal de Gratitude</h2>
        <textarea id="gratitudeEntryInput" placeholder="Qu'est-ce qui vous rend reconnaissant aujourd'hui ?"></textarea>
        <button id="saveGratitudeEntryBtn">Sauvegarder l'entrée</button>
        <div id="gratitudeEntriesList"></div>
    `;

    const gratitudeEntryInput = containerElement.querySelector('#gratitudeEntryInput');
    const saveGratitudeEntryBtn = containerElement.querySelector('#saveGratitudeEntryBtn');
    const gratitudeEntriesList = containerElement.querySelector('#gratitudeEntriesList');

    saveGratitudeEntryBtn.addEventListener('click', async () => {
        const text = gratitudeEntryInput.value.trim();
        if (text) {
            try {
                await addGratitudeEntry(text);
                gratitudeEntryInput.value = '';
                await loadAndDisplayGratitudeEntries();
            } catch (error) {
                console.error('Error saving gratitude entry:', error);
                // Optionally, display an error message to the user
            }
        }
    });

    async function loadAndDisplayGratitudeEntries() {
        try {
            const entries = await getGratitudeEntries();
            entries.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)); // Sort newest first

            gratitudeEntriesList.innerHTML = ''; // Clear previous entries

            if (entries.length === 0) {
                gratitudeEntriesList.innerHTML = '<p>Aucune entrée de gratitude pour le moment.</p>';
                return;
            }

            entries.forEach(entry => {
                const entryDiv = document.createElement('div');
                entryDiv.classList.add('gratitude-entry'); // For styling

                const dateOptions = { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' };
                const entryDate = new Date(entry.timestamp).toLocaleDateString('fr-FR', dateOptions);

                entryDiv.innerHTML = `
                    <p><strong>${entryDate}</strong></p>
                    <p>${entry.text.replace(/\n/g, '<br>')}</p>
                    <button class="delete-gratitude-btn" data-id="${entry.id}">Supprimer</button>
                `;
                gratitudeEntriesList.appendChild(entryDiv);
            });

            gratitudeEntriesList.querySelectorAll('.delete-gratitude-btn').forEach(button => {
                button.addEventListener('click', async (event) => {
                    const entryId = event.target.dataset.id;
                    try {
                        await deleteGratitudeEntry(Number(entryId)); // Ensure ID is a number if stored as such
                        await loadAndDisplayGratitudeEntries();
                    } catch (error) {
                        console.error('Error deleting gratitude entry:', error);
                        // Optionally, display an error message to the user
                    }
                });
            });
        } catch (error) {
            console.error('Error loading gratitude entries:', error);
            gratitudeEntriesList.innerHTML = '<p>Erreur lors du chargement des entrées de gratitude.</p>';
        }
    }

    // Initial load of entries
    loadAndDisplayGratitudeEntries();
}
