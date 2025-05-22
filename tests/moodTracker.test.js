// tests/moodTracker.test.js (for simple HTML runner)
import { initMoodTracker } from '../moodTracker.js';
import * as storageUtils from '../storageUtils.js';

// Store original functions
const originalGetMoodEntryForDate = storageUtils.getMoodEntryForDate;
const originalSaveMoodEntry = storageUtils.saveMoodEntry;
const originalGetCurrentDateString = storageUtils.getCurrentDateString;
let alertCalledWithMessage = null;
const originalAlert = window.alert;

function setupDOM() {
    document.body.innerHTML = '<div id="moodTrackerViewTestContainer" style="display: none;"><div id="moodTrackerView"></div></div>';
    return document.getElementById('moodTrackerView');
}

describe('moodTracker.js Tests', () => {
    let containerElement;
    const mockToday = '2023-10-26';

    beforeEach(async () => { // Make beforeEach async if initMoodTracker is async
        containerElement = setupDOM();
        
        // Mock implementations
        storageUtils.getCurrentDateString = () => mockToday;
        storageUtils.getMoodEntryForDate = async (date) => {
            // This allows us to change the resolved value per test
            if (typeof storageUtils.getMoodEntryForDate.mockReturnValueOnce !== 'undefined') {
                const temp = storageUtils.getMoodEntryForDate.mockReturnValueOnce;
                storageUtils.getMoodEntryForDate.mockReturnValueOnce = undefined; // Consume it
                return temp;
            }
            if (storageUtils.getMoodEntryForDate.mockResolvedValue) {
                return storageUtils.getMoodEntryForDate.mockResolvedValue;
            }
            return null; // Default mock behavior
        };
        storageUtils.saveMoodEntry = async (entry) => {
            if (storageUtils.saveMoodEntry.mockResolvedValue) {
                return storageUtils.saveMoodEntry.mockResolvedValue;
            }
            // For the specific test 'should save a new mood entry...'
            if (storageUtils.saveMoodEntry.customMockLogic) {
                 return storageUtils.saveMoodEntry.customMockLogic(entry);
            }
            return { success: true }; // Default mock behavior
        };
        window.alert = (message) => { alertCalledWithMessage = message; }; // Mock alert
        alertCalledWithMessage = null; // Reset alert spy

        // Reset internal state of moodTracker by re-initializing its view
        // The initMoodTracker itself will call the mocked getCurrentDateString and getMoodEntryForDate
    });

    afterEach(() => {
        // Restore original functions
        storageUtils.getMoodEntryForDate = originalGetMoodEntryForDate;
        storageUtils.saveMoodEntry = originalSaveMoodEntry;
        storageUtils.getCurrentDateString = originalGetCurrentDateString;
        window.alert = originalAlert;
        delete storageUtils.getMoodEntryForDate.mockResolvedValue; // Clean up mock state
        delete storageUtils.getMoodEntryForDate.mockReturnValueOnce; // Clean up mock state
        delete storageUtils.saveMoodEntry.mockResolvedValue; // Clean up mock state
        delete storageUtils.saveMoodEntry.customMockLogic; // Clean up mock state
        document.body.innerHTML = ''; // Clean up DOM
    });

    it('should initialize UI and load existing mood if present for today', async () => {
        const existingMood = { date: mockToday, mood: 5, energy: 3, anxiety: 1 };
        storageUtils.getMoodEntryForDate.mockResolvedValue = existingMood; // Set mock return value

        await initMoodTracker(containerElement); // This will call the mocked functions

        const saveButton = containerElement.querySelector('#saveMoodEntry');
        const messageElement = containerElement.querySelector('#moodMessage');
        assert(saveButton.disabled, 'Save button should be disabled if mood exists');
        assert(messageElement.textContent.includes("Humeur enregistrée pour aujourd'hui"), 'Message should indicate mood already recorded');
    });

    it('should initialize UI for new mood entry if none exists for today', async () => {
        storageUtils.getMoodEntryForDate.mockResolvedValue = null; // No existing mood

        await initMoodTracker(containerElement);

        const saveButton = containerElement.querySelector('#saveMoodEntry');
        const messageElement = containerElement.querySelector('#moodMessage');
        assert(saveButton.disabled, 'Save button should be disabled initially (no selection)');
        assertEquals(messageElement.textContent, '', 'Message should be empty for new entry');
    });
    
    // Helper to simulate selections
    function makeSelections(moodVal = '3', energyVal = '2', anxietyVal = '1') {
        const moodButton = containerElement.querySelector(`.mood-selector button[data-group="mood"][data-value="${moodVal}"]`);
        const energyButton = containerElement.querySelector(`.mood-selector button[data-group="energy"][data-value="${energyVal}"]`);
        const anxietyButton = containerElement.querySelector(`.mood-selector button[data-group="anxiety"][data-value="${anxietyVal}"]`);
        
        if (moodButton) moodButton.click();
        if (energyButton) energyButton.click();
        if (anxietyButton) anxietyButton.click();
    }

    it('should save a new mood entry when selections are made and save button clicked', async () => {
        storageUtils.getMoodEntryForDate.mockResolvedValue = null; // No existing entry initially
        let savedEntry = null;
        // More specific mock for this test to capture the argument
        storageUtils.saveMoodEntry.customMockLogic = async (entry) => {
            savedEntry = entry;
            return { success: true };
        };
        
        await initMoodTracker(containerElement);
        makeSelections('4', '2', '1');

        const saveButton = containerElement.querySelector('#saveMoodEntry');
        assert(!saveButton.disabled, 'Save button should be enabled after selections');
        
        saveButton.click();
        await new Promise(resolve => setTimeout(resolve, 0)); // Wait for async ops

        const expectedEntry = { date: mockToday, mood: 4, energy: 2, anxiety: 1 };
        assertDeepEquals(savedEntry, expectedEntry, `Saved entry mismatch. Expected ${JSON.stringify(expectedEntry)}, got ${JSON.stringify(savedEntry)}`);
        assert(saveButton.disabled, 'Save button should be disabled after save');
        assert(containerElement.querySelector('#moodMessage').textContent.includes("Humeur enregistrée"), 'Message should indicate successful save');
    });

    it('should not save if mood already exists (checked on save attempt)', async () => {
        // Initial load: no entry
        storageUtils.getMoodEntryForDate.mockReturnValueOnce = null; // For init
        let saveMoodEntryCalled = false;
        storageUtils.saveMoodEntry.customMockLogic = async (entry) => { 
            saveMoodEntryCalled = true; 
            return {success: false}; // Does not really matter what it returns
        };

        await initMoodTracker(containerElement);
        makeSelections('3','2','1');
        
        // Simulate that by the time save is clicked, an entry was made
        storageUtils.getMoodEntryForDate.mockResolvedValue = { date: mockToday, mood: 1, energy: 1, anxiety: 1 }; // For the check within saveMood

        const saveButton = containerElement.querySelector('#saveMoodEntry');
        saveButton.click();
        await new Promise(resolve => setTimeout(resolve, 0)); // Wait for async ops

        assert(!saveMoodEntryCalled, 'saveMoodEntry should not have been called');
        assertEquals(alertCalledWithMessage, "Humeur déjà enregistrée.", "Alert message mismatch");
        assert(saveButton.disabled, 'Save button should be disabled if mood exists on save attempt');
    });
});
