// tests/storageUtils.test.js
import { getCurrentDateString, loadDataFromLS, saveDataToLS, getEarnedBadgesFromStorage, saveEarnedBadgesToStorage, getDistractions, saveDistractions, getPersonalValues, savePersonalValues } from '../storageUtils.js';

// Mock LocalStorage
let mockLocalStorageStore = {};
const mockLocalStorage = {
    getItem: key => mockLocalStorageStore[key] || null,
    setItem: (key, value) => {
        mockLocalStorageStore[key] = String(value);
    },
    removeItem: key => {
        delete mockLocalStorageStore[key];
    },
    clear: () => {
        mockLocalStorageStore = {};
    }
};
globalThis.localStorage = mockLocalStorage; // Override global localStorage for tests

describe('storageUtils.js Tests', () => {
    beforeEach(() => {
        mockLocalStorage.clear(); // Clear mock LS before each test
    });

    describe('getCurrentDateString', () => {
        it('should return the current date in YYYY-MM-DD format', () => {
            const dateString = getCurrentDateString();
            assert(/^\d{4}-\d{2}-\d{2}$/.test(dateString), 'Date string format is invalid');
            // Further checks could involve parsing the date and comparing components,
            // but for now, format and type check is a good start.
            const [year, month, day] = dateString.split('-').map(Number);
            const now = new Date();
            assertEquals(year, now.getUTCFullYear(), 'Year does not match UTC year');
            assertEquals(month, now.getUTCMonth() + 1, 'Month does not match UTC month');
            assertEquals(day, now.getUTCDate(), 'Day does not match UTC day');
        });
    });

    describe('LocalStorage Functions', () => {
        it('saveDataToLS and loadDataFromLS should save and retrieve basic data', () => {
            const key = 'testKey';
            const data = { message: 'Hello World' };
            saveDataToLS(key, data);
            const loadedData = loadDataFromLS(key);
            assertDeepEquals(loadedData, data, 'Loaded data does not match saved data');
        });

        it('loadDataFromLS should return null for non-existent keys', () => {
            const loadedData = loadDataFromLS('nonExistentKey');
            assertEquals(loadedData, null, 'Expected null for non-existent key');
        });
        
        it('loadDataFromLS should return null if JSON parsing fails', () => {
            mockLocalStorage.setItem('badJSONKey', 'this is not json');
            const loadedData = loadDataFromLS('badJSONKey');
            assertEquals(loadedData, null, 'Expected null for malformed JSON');
        });

        it('saveEarnedBadgesToStorage and getEarnedBadgesFromStorage should manage badges', () => {
            const badges = ['badge1', 'badge2'];
            saveEarnedBadgesToStorage(badges);
            const loadedBadges = getEarnedBadgesFromStorage();
            assertDeepEquals(loadedBadges, badges, 'Loaded badges do not match saved badges');
            
            // Test with empty array
            saveEarnedBadgesToStorage([]);
            assertDeepEquals(getEarnedBadgesFromStorage(), [], 'Should handle empty array for badges');

            // Test with invalid data (should be filtered by save, or handled by get)
             saveEarnedBadgesToStorage(['badge1', 123, null, 'badge2']);
             assertDeepEquals(getEarnedBadgesFromStorage(), ['badge1', 'badge2'], 'Should filter invalid badge types');
        });
        
        it('getEarnedBadgesFromStorage should return empty array if nothing in LS', () => {
            assertDeepEquals(getEarnedBadgesFromStorage(), [], 'Expected empty array for badges by default');
        });

        it('saveDistractions and getDistractions should manage distractions', () => {
            const distractions = ['distraction1', 'distraction2'];
            saveDistractions(distractions);
            const loadedDistractions = getDistractions();
            assertDeepEquals(loadedDistractions, distractions, 'Loaded distractions do not match saved distractions');

            saveDistractions([]);
            assertDeepEquals(getDistractions(), [], 'Should handle empty array for distractions');

            saveDistractions(['d1', '', '  ', 'd2']); // save should filter empty/whitespace
            assertDeepEquals(getDistractions(), ['d1', 'd2'], 'Should filter empty/whitespace strings for distractions');
        });
        
        it('getDistractions should return empty array if nothing in LS', () => {
            assertDeepEquals(getDistractions(), [], 'Expected empty array for distractions by default');
        });

        it('savePersonalValues and getPersonalValues should manage personal values', () => {
            const values = ['value1', 'value2', 'value1']; // includes duplicate
            savePersonalValues(values);
            const loadedValues = getPersonalValues();
            assertDeepEquals(loadedValues, ['value1', 'value2'], 'Loaded values do not match saved values (duplicates should be removed)');
            
            savePersonalValues([]);
            assertDeepEquals(getPersonalValues(), [], 'Should handle empty array for values');

            savePersonalValues(['v1', '  ', 'v2', '']); // save should filter and trim
            assertDeepEquals(getPersonalValues(), ['v1', 'v2'], 'Should filter empty/whitespace and trim values');
        });

        it('getPersonalValues should return empty array if nothing in LS', () => {
            assertDeepEquals(getPersonalValues(), [], 'Expected empty array for personal values by default');
        });
    });
    
    // Placeholder for IndexedDB tests - these are more complex to set up
    // describe('IndexedDB Functions', () => {
    //     it('should correctly save and retrieve a journal entry', async () => {
    //         // This will require more setup, potentially mocking IndexedDB or
    //         // ensuring the test environment can handle it.
    //         // For now, this is a placeholder.
    //         assert(true, 'IndexedDB tests not yet implemented');
    //     });
    // });
});

// This is crucial for the HTML runner to pick up tests if not using a global runner function
// For the current runner, this file is imported, and describe/it are global.
// If we had a run() function in the runner:
// runAllTests();
