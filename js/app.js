/**
 * CampusFlow — Admin Application Entry Point
 * Initializes storage, renders admin UI, and registers event listeners.
 * The student portal (index.html) is handled by a separate developer.
 */

document.addEventListener('DOMContentLoaded', () => {
    initializeStorage();
    setupAdminEventListeners();
    initAdminView();

    // Cross-tab sync: if the student portal (running in another tab) updates
    // LocalStorage, the admin dashboard re-renders automatically.
    window.addEventListener('storage', (event) => {
        if (event.key === STORAGE_KEYS.EVENTS || event.key === STORAGE_KEYS.REGISTRATIONS) {
            initAdminView();
        }
    });
});

/**
 * Registers all event listeners for the Admin portal.
 */
function setupAdminEventListeners() {
    // Event search
    const eventSearch = document.getElementById('adminEventSearch');
    if (eventSearch) eventSearch.addEventListener('input', renderAdminEventsTable);

    // Event form (Add / Edit)
    const eventForm = document.getElementById('eventForm');
    if (eventForm) eventForm.addEventListener('submit', handleEventFormSubmit);

    // Registration filters
    const regSearch       = document.getElementById('adminRegSearch');
    const regEventFilter  = document.getElementById('adminRegEventFilter');
    const regStatusFilter = document.getElementById('adminRegStatusFilter');

    if (regSearch)       regSearch.addEventListener('input', renderAdminRegistrationsTable);
    if (regEventFilter)  regEventFilter.addEventListener('change', renderAdminRegistrationsTable);
    if (regStatusFilter) regStatusFilter.addEventListener('change', renderAdminRegistrationsTable);
}
