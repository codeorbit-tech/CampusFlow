/**
 * CampusFlow - Application Entry Point
 * Coordinates storage initialization, page-specific routing, event listeners, and cross-tab sync.
 */

document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
});

function initializeApp() {
    // 1. Initialize LocalStorage if empty
    initializeStorage();

    // 2. Detect Current Page Context
    const isAdminPage = window.location.pathname.includes('admin.html');

    if (isAdminPage) {
        setupAdminEventListeners();
        initAdminView();
    } else {
        setupStudentEventListeners();
        initEventsView();
        renderStudentRegistrations();
    }

    // 3. Register real-time cross-tab LocalStorage listener
    window.addEventListener('storage', (event) => {
        if (event.key === STORAGE_KEYS.EVENTS || event.key === STORAGE_KEYS.REGISTRATIONS) {
            console.log("Storage event detected from another tab. Syncing UI...");
            if (isAdminPage) {
                initAdminView();
            } else {
                applyEventFilters();
                renderStudentRegistrations();
            }
        }
    });
}

/**
 * Event Listeners for Student Portal (index.html)
 */
function setupStudentEventListeners() {
    // Search input
    const searchInput = document.getElementById('eventSearch');
    if (searchInput) {
        searchInput.addEventListener('input', applyEventFilters);
    }

    // Category filter
    const categorySelect = document.getElementById('categoryFilter');
    if (categorySelect) {
        categorySelect.addEventListener('change', applyEventFilters);
    }

    // Sort filter
    const sortSelect = document.getElementById('sortFilter');
    if (sortSelect) {
        sortSelect.addEventListener('change', applyEventFilters);
    }

    // Registration Form Submit
    const regForm = document.getElementById('registrationForm');
    if (regForm) {
        regForm.addEventListener('submit', submitRegistration);
    }
}

/**
 * Event Listeners for Admin Portal (admin.html)
 */
function setupAdminEventListeners() {
    // Admin Event Search
    const eventSearch = document.getElementById('adminEventSearch');
    if (eventSearch) {
        eventSearch.addEventListener('input', renderAdminEventsTable);
    }

    // Event Form Submit (Add/Edit)
    const eventForm = document.getElementById('eventForm');
    if (eventForm) {
        eventForm.addEventListener('submit', handleEventFormSubmit);
    }

    // Registration Search & Filters
    const regSearch = document.getElementById('adminRegSearch');
    const regEventFilter = document.getElementById('adminRegEventFilter');
    const regStatusFilter = document.getElementById('adminRegStatusFilter');

    if (regSearch) regSearch.addEventListener('input', renderAdminRegistrationsTable);
    if (regEventFilter) regEventFilter.addEventListener('change', renderAdminRegistrationsTable);
    if (regStatusFilter) regStatusFilter.addEventListener('change', renderAdminRegistrationsTable);
}
