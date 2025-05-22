# Clair·e - Personal Companion PWA

**Clair·e** is a Progressive Web Application (PWA) designed to be your personal companion for promoting well-being, supporting sobriety, and enhancing productivity. It provides a suite of tools to help you track various aspects of your daily life, reflect on your thoughts and moods, and build positive routines.

## Key Features

*   **Mood Tracking:** Log your mood, energy, and anxiety levels daily.
*   **Journaling:** Keep a personal journal for reflections and thoughts.
*   **Activity Log:** Track your activities and link them to personal values.
*   **Consumption Tracking:** Monitor consumption habits (e.g., alcohol).
*   **Progress Visualization:** View your progress over time with charts.
*   **Guided Exercises:** Access exercises for mindfulness and well-being.
*   **Thought Record:** Analyze and reframe negative thoughts.
*   **Routine Builder:** Establish and track daily routines.
*   **Planner:** Plan your daily tasks and goals.
*   **Cravings Management:** Tools to help manage and overcome cravings.
*   **Focus Timer:** A timer to help you concentrate on tasks.
*   **Victory Log:** Record your achievements and successes.
*   **Testimonials & SOS:** View testimonials for motivation and access an SOS feature for urgent help.
*   **Settings & Customization:** Personalize aspects of the app, like personal values and distractions.
*   **Offline Capable:** Works offline thanks to service worker caching.
*   **Data Privacy:** All data is stored locally in your browser (LocalStorage and IndexedDB).

## Running the Project

As Clair·e is a PWA built with HTML, CSS, and vanilla JavaScript, there's no complex build process required:

1.  Clone this repository:
    ```bash
    git clone https://github.com/your-username/claire-pwa-online.git
    ```
2.  Navigate to the project directory:
    ```bash
    cd claire-pwa-online
    ```
3.  Open the `index.html` file in your web browser.
    *   For the best experience and PWA features (like installation and offline support), it's recommended to serve the files through a local web server. Many simple HTTP servers can do this. For example, using Python's built-in server:
        ```bash
        python -m http.server
        ```
        Or using Node.js's `http-server` package:
        ```bash
        npx http-server
        ```
        Then open `http://localhost:8000` (or the port shown by the server) in your browser.

## Project Structure

The project is organized as follows:

*   **`index.html`**: The main entry point of the application.
*   **`style.css`**: Contains all the styling for the application.
*   **`app.js`**: The main JavaScript file that initializes views, handles navigation, and manages the service worker.
*   **`service-worker.js`**: Implements caching strategies for offline availability.
*   **`manifest.json`**: Defines PWA properties (name, icons, theme, etc.).
*   **`storageUtils.js`**: A crucial utility module for managing all data persistence using LocalStorage and IndexedDB.
*   **`*.view.js` / `*.js` (e.g., `moodTracker.js`, `journal.js`)**: Individual JavaScript modules for each feature/view of the application. These typically handle the UI and logic for their specific section.
*   **`icons/`**: Contains the application icons for different resolutions.
*   **`README.md`**: This file - providing an overview of the project.
*   **`LICENSE`**: The license for the project.
*   **`.gitignore`**: Specifies intentionally untracked files that Git should ignore.

## Contributing

(Details to be added if contributions are open)

## License

(Refer to the LICENSE file - currently appears to be missing, should be added if one is intended)

This updated `README.md` should provide a good starting point for anyone looking to understand or work with the Clair·e application.