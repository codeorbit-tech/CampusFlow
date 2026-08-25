/**
 * CampusFlow - Storage Module
 * Manages reading and writing shared events and registrations data in LocalStorage.
 */

/**
 * Initializes LocalStorage on first launch with defaultEvents.
 */
function initializeStorage() {
    if (!localStorage.getItem(STORAGE_KEYS.EVENTS)) {
        console.log("Initializing default events in LocalStorage...");
        saveEvents(defaultEvents);
    }
    if (!localStorage.getItem(STORAGE_KEYS.REGISTRATIONS)) {
        console.log("Initializing empty registrations in LocalStorage...");
        saveRegistrations([]);
    }
}

/**
 * Loads events from LocalStorage.
 * @returns {Array} Array of event objects
 */
function loadEvents() {
    const rawData = localStorage.getItem(STORAGE_KEYS.EVENTS);
    if (!rawData) {
        initializeStorage();
        return defaultEvents;
    }
    try {
        return JSON.parse(rawData);
    } catch (e) {
        console.error("Error parsing events from LocalStorage:", e);
        return defaultEvents;
    }
}

/**
 * Saves events to LocalStorage.
 * @param {Array} events 
 */
function saveEvents(events) {
    localStorage.setItem(STORAGE_KEYS.EVENTS, JSON.stringify(events));
}

/**
 * Loads registrations from LocalStorage.
 * @returns {Array} Array of registration objects
 */
function loadRegistrations() {
    const rawData = localStorage.getItem(STORAGE_KEYS.REGISTRATIONS);
    if (!rawData) {
        initializeStorage();
        return [];
    }
    try {
        return JSON.parse(rawData);
    } catch (e) {
        console.error("Error parsing registrations from LocalStorage:", e);
        return [];
    }
}

/**
 * Saves registrations to LocalStorage.
 * @param {Array} registrations 
 */
function saveRegistrations(registrations) {
    localStorage.setItem(STORAGE_KEYS.REGISTRATIONS, JSON.stringify(registrations));
}

/**
 * Resets storage back to default initial state.
 */
function resetStorageToDefault() {
    saveEvents(defaultEvents);
    saveRegistrations([]);
}
