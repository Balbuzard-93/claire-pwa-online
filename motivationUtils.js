// motivationUtils.js

const dailyMotivations = [
    "Chaque pas compte, même les plus petits.", "Soyez fier(e) du chemin parcouru aujourd'hui.", "La douceur envers soi-même est une force.",
    "Vous avez en vous les ressources pour faire face.", "Permettez-vous de ressentir, sans jugement.", "Un jour à la fois.",
    "Votre valeur ne dépend pas de votre productivité.", "N'oubliez pas de respirer profondément.", "Le progrès n'est pas linéaire, et c'est normal.",
    "Cherchez la lumière, même dans les moments sombres.", "Faites confiance au processus et à votre résilience.", "Célébrez chaque victoire.",
    "Vous méritez la paix et la sérénité.", "Aujourd'hui est une nouvelle page.", "Le repos est aussi important que l'action.",
    "Écoutez vos besoins avec bienveillance.", "Vous êtes capable de surmonter les obstacles.", "Offrez-vous la même compassion qu'à un ami.",
    "Chaque respiration est une chance de recommencer.", "Croyez en votre capacité à guérir et à grandir.", "La patience est une vertu essentielle.",
    "Soyez curieux de ce que cette journée apporte.", "Vous êtes plus résilient(e) que vous ne le croyez.", "Un petit pas aujourd'hui peut mener à un grand changement."
];

/** Calcule le numéro du jour dans l'année (1-366). */
function getDayOfYear(date) {
    const start = new Date(date.getFullYear(), 0, 0); // Jour 0 de l'année
    const diff = date.getTime() - start.getTime(); // Différence en ms
    const oneDay = 1000 * 60 * 60 * 24; // ms dans un jour
    return Math.floor(diff / oneDay); // Retourne le jour de l'année (1 pour 1er Jan)
}

/** Récupère le message de motivation pour le jour actuel. */
export function getDailyMotivationMessage() {
    if (!Array.isArray(dailyMotivations) || dailyMotivations.length === 0) {
        return "Passez une excellente journée !"; // Fallback
    }
    const now = new Date();
    const dayIndex = getDayOfYear(now) -1; // Pour un index de tableau base 0
    // Utiliser Math.abs pour s'assurer que l'index n'est pas négatif si dayOfYear est 0 (rare)
    const messageIndex = Math.abs(dayIndex % dailyMotivations.length);
    return dailyMotivations[messageIndex];
}
