/**
 * CampusFlow — Admin Application Entry Point
 */

document.addEventListener('DOMContentLoaded', () => {
    initializeStorage();
    setupAdminEventListeners();
    initAdminView();

    // Cross-tab sync with student portal
    window.addEventListener('storage', (event) => {
        if (event.key === STORAGE_KEYS.EVENTS || event.key === STORAGE_KEYS.REGISTRATIONS) {
            initAdminView();
        }
    });
});

function setupAdminEventListeners() {
    // Topbar global search — searches whichever tab is active
    const globalSearch = document.getElementById('globalSearch');
    if (globalSearch) {
        globalSearch.addEventListener('input', () => {
            const active = document.querySelector('.tab-panel.active');
            if (!active) return;
            if (active.id === 'tabPanel-dashboard') {
                const el = document.getElementById('adminEventSearch');
                if (el) { el.value = globalSearch.value; renderAdminEventsTable(); }
            } else {
                const el = document.getElementById('adminRegSearch');
                if (el) { el.value = globalSearch.value; renderAdminRegistrationsTable(); }
            }
        });
    }

    // Event table search
    const eventSearch = document.getElementById('adminEventSearch');
    if (eventSearch) eventSearch.addEventListener('input', renderAdminEventsTable);

    // Event form
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
