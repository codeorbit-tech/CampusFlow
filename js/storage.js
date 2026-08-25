/**
 * CampusFlow - LocalStorage Persistence Module (Phase 4)
 * 
 * Handles reading and writing shared events and registrations data in LocalStorage.
 */

/**
 * Initializes LocalStorage on first run or loads active data.
 */
function initializeStorage() {
    try {
        const storedEvents = localStorage.getItem(STORAGE_KEYS.EVENTS);
        if (!storedEvents) {
            saveEvents(initialEvents);
            events = [...initialEvents];
        } else {
            events = JSON.parse(storedEvents);
        }

        const storedRegistrations = localStorage.getItem(STORAGE_KEYS.REGISTRATIONS);
        if (!storedRegistrations) {
            saveRegistrations([]);
            registrations = [];
        } else {
            registrations = JSON.parse(storedRegistrations);
        }
    } catch (e) {
        console.error("Error accessing LocalStorage, falling back to in-memory state:", e);
        events = [...initialEvents];
        registrations = [];
    }
}

/**
 * Loads events from LocalStorage
 * @returns {Array} Array of event objects
 */
function loadEvents() {
    try {
        const raw = localStorage.getItem(STORAGE_KEYS.EVENTS);
        if (raw) {
            return JSON.parse(raw);
        }
    } catch (e) {
        console.error("Error loading events:", e);
    }
    return events || initialEvents;
}

/**
 * Saves events array to LocalStorage
 * @param {Array} eventList 
 */
function saveEvents(eventList) {
    events = eventList;
    try {
        localStorage.setItem(STORAGE_KEYS.EVENTS, JSON.stringify(eventList));
    } catch (e) {
        console.error("Error saving events to LocalStorage:", e);
    }
}

/**
 * Loads registrations from LocalStorage
 * @returns {Array} Array of registration objects
 */
function loadRegistrations() {
    try {
        const raw = localStorage.getItem(STORAGE_KEYS.REGISTRATIONS);
        if (raw) {
            return JSON.parse(raw);
        }
    } catch (e) {
        console.error("Error loading registrations:", e);
    }
    return registrations || [];
}

/**
 * Saves registrations array to LocalStorage
 * @param {Array} regList 
 */
function saveRegistrations(regList) {
    registrations = regList;
    try {
        localStorage.setItem(STORAGE_KEYS.REGISTRATIONS, JSON.stringify(regList));
    } catch (e) {
        console.error("Error saving registrations to LocalStorage:", e);
    }
}

/**
 * Resets storage back to default initial state
 */
function resetStorageToDefault() {
    saveEvents(initialEvents);
    saveRegistrations([]);
}
