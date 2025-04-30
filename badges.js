// badges.js

/**
 * Définitions des badges et des paliers de sobriété requis.
 */
export const badgeDefinitions = [
    { id: 'badge_1_day', name: 'Premier Jour !', description: 'Vous avez tenu 1 jour. C\'est un début formidable !', requiredDays: 1, icon: '🌟' },
    { id: 'badge_3_days', name: 'Trois Jours', description: 'Félicitations pour ces 3 jours de sobriété !', requiredDays: 3, icon: '🥉' },
    { id: 'badge_1_week', name: 'Une Semaine', description: 'Incroyable ! Une semaine complète !', requiredDays: 7, icon: '🗓️' },
    { id: 'badge_2_weeks', name: 'Deux Semaines', description: 'Deux semaines, un cap important franchi !', requiredDays: 14, icon: '✨' },
    { id: 'badge_1_month', name: 'Un Mois', description: 'Bravo pour ce premier mois complet !', requiredDays: 30, icon: '🥈' },
    { id: 'badge_3_months', name: 'Trois Mois', description: 'Un trimestre de sobriété, quelle réussite !', requiredDays: 90, icon: '🌿' },
    { id: 'badge_6_months', name: 'Six Mois', description: 'Une demi-année ! Vous êtes incroyable !', requiredDays: 180, icon: '☀️' },
    { id: 'badge_1_year', name: 'Un An', description: 'Joyeux anniversaire de sobriété ! Un an complet !', requiredDays: 365, icon: '🥇' },
    // { id: 'badge_2_years', name: 'Deux Ans', description: 'Deux années de croissance et de force !', requiredDays: 730, icon: '🏆' },
];

/**
 * Retourne les IDs de tous les badges mérités pour un nombre de jours donné.
 * @param {number} soberDays - Le nombre de jours de sobriété.
 * @returns {string[]} Un tableau des IDs des badges gagnés.
 */
function getEarnedBadgeIds(soberDays) {
    // Assurer que soberDays est un nombre valide
    if (typeof soberDays !== 'number' || isNaN(soberDays) || soberDays < 0) {
        return [];
    }
    return badgeDefinitions
        .filter(badge => soberDays >= badge.requiredDays)
        .map(badge => badge.id);
}

/**
 * Vérifie les badges gagnés par rapport à ceux déjà stockés et identifie les nouveaux.
 * @param {number} soberDays - Le nombre actuel de jours de sobriété.
 * @param {string[]} previouslyEarnedIds - Tableau des IDs de badges déjà enregistrés.
 * @returns {{newlyEarnedIds: string[], totalEarnedIds: string[]}} Un objet contenant les nouveaux badges et tous les badges gagnés.
 */
export function checkAndStoreEarnedBadges(soberDays, previouslyEarnedIds) {
    // S'assurer que previouslyEarnedIds est bien un tableau
    const validPreviousIds = Array.isArray(previouslyEarnedIds) ? previouslyEarnedIds : [];

    const currentlyEarnedIds = getEarnedBadgeIds(soberDays);
    const newlyEarnedIds = currentlyEarnedIds.filter(id => !validPreviousIds.includes(id));

    return {
        newlyEarnedIds: newlyEarnedIds,
        totalEarnedIds: currentlyEarnedIds // Retourne la liste complète calculée
    };
}

/**
 * Récupère les détails complets d'un badge à partir de son ID.
 * @param {string} badgeId - L'ID du badge.
 * @returns {object | null} L'objet de définition du badge ou null si non trouvé.
 */
export function getBadgeDetails(badgeId) {
    return badgeDefinitions.find(badge => badge.id === badgeId) || null;
}