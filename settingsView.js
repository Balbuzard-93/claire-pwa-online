// settingsView.js
import { getAllAppData } from './storageUtils.js'; // Importer la fonction clé

/**
 * Déclenche le téléchargement des données de l'application.
 * @param {HTMLButtonElement} exportButton - Le bouton qui a déclenché l'export.
 */
async function exportAllData(exportButton) {
    if (exportButton) exportButton.disabled = true; // Désactiver pendant l'export
    const statusElement = document.getElementById('exportStatus');
    if (statusElement) statusElement.textContent = 'Préparation de vos données...';

    try {
        console.log("Récupération de toutes les données de l'application...");
        const allData = await getAllAppData(); // Appel asynchrone
        console.log("Données récupérées, génération du fichier...");

        // Convertir en JSON formaté
        const jsonString = JSON.stringify(allData, null, 2); // Indentation pour lisibilité
        const blob = new Blob([jsonString], { type: 'application/json;charset=utf-8' });

        // Créer URL et lien pour téléchargement
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        const dateSuffix = new Date().toISOString().split('T')[0].replace(/-/g, ''); // YYYYMMDD
        link.download = `claire_data_${dateSuffix}.json`; // Nom du fichier

        // Simuler clic pour télécharger
        document.body.appendChild(link); // Requis pour Firefox
        link.click();
        document.body.removeChild(link); // Nettoyer
        URL.revokeObjectURL(url); // Libérer la mémoire

        console.log("Exportation terminée.");
        if (statusElement) statusElement.textContent = 'Exportation réussie ! Conservez ce fichier en lieu sûr.';
        // Afficher le message pendant quelques secondes
         setTimeout(() => { if(statusElement) statusElement.textContent = ''; }, 5000);

    } catch (error) {
        console.error("Erreur lors de l'exportation des données:", error);
        alert("Une erreur s'est produite pendant l'exportation. Vérifiez la console pour plus de détails.");
        if (statusElement) statusElement.textContent = 'Échec de l\'exportation.';
    } finally {
        if (exportButton) exportButton.disabled = false; // Réactiver le bouton
    }
}


/**
 * Initialise la vue des Paramètres.
 * @param {HTMLElement} containerElement - L'élément DOM où injecter l'interface.
 */
export function initSettingsView(containerElement) {
    if (!containerElement) {
        console.error("Conteneur vue Paramètres introuvable.");
        return;
    }

    containerElement.innerHTML = `
        <h2>Paramètres & Données</h2>

        <div class="settings-section">
            <h3>Exporter Mes Données</h3>
            <p>Téléchargez une copie de toutes vos données enregistrées dans Clair·e (journal, humeurs, routines, plans, victoires, paramètres) dans un fichier JSON.</p>
            <p><strong>Important :</strong> Réalisez des exports régulièrement et conservez ce fichier en lieu sûr (ex: Drive, autre appareil) pour pouvoir restaurer vos données en cas de problème.</p>
            <button id="exportDataBtn" class="button-primary">Exporter Toutes Mes Données</button>
            <p id="exportStatus" class="status-message" aria-live="polite"></p>
        </div>

        <!-- Ajouter ici d'autres sections de paramètres plus tard -->
        <!-- Ex:
        <div class="settings-section">
            <h3>Thème d'Affichage</h3>
             Options pour choisir un thème
        </div>
        <div class="settings-section">
            <h3>Notifications</h3>
             Options pour gérer les permissions ou types de notifications (si implémenté)
        </div>
         -->
    `;

    const exportBtn = containerElement.querySelector('#exportDataBtn');
    if (exportBtn) {
        exportBtn.addEventListener('click', () => exportAllData(exportBtn));
    }
}
