/**
 * CampusFlow - Application Entry Point (Student & Admin Unified)
 * 
 * Automatically detects whether current page is Student Portal (index.html)
 * or Admin Portal (admin.html) and initializes the corresponding modules.
 */

function setupNavigation() {
    const mobileToggle = document.getElementById("mobile-menu-toggle");
    const navLinks = document.getElementById("nav-links");

    if (mobileToggle && navLinks) {
        mobileToggle.addEventListener("click", () => {
            const isExpanded = mobileToggle.getAttribute("aria-expanded") === "true";
            mobileToggle.setAttribute("aria-expanded", !isExpanded);
            navLinks.classList.toggle("nav-links--open");
        });

        navLinks.querySelectorAll(".nav-link").forEach(link => {
            link.addEventListener("click", () => {
                navLinks.classList.remove("nav-links--open");
                mobileToggle.setAttribute("aria-expanded", "false");
            });
        });
    }
}

/**
 * Main application initialization
 */
document.addEventListener("DOMContentLoaded", () => {
    // 1. Initialize LocalStorage persistence
    if (typeof initializeStorage === "function") {
        initializeStorage();
    }

    // 2. Initialize Student Portal (if present on page)
    const eventsGrid = document.getElementById("events-grid");
    if (eventsGrid) {
        if (typeof renderEvents === "function") {
            renderEvents(events);
        }
        if (typeof updateStatisticsDisplay === "function") {
            updateStatisticsDisplay();
        }
        if (typeof setupEventFilters === "function") {
            setupEventFilters();
        }
        if (typeof setupRegistrationListeners === "function") {
            setupRegistrationListeners();
        }
        setupNavigation();
        console.log("CampusFlow Student Portal initialized.");
    }

    // 3. Initialize Admin Portal (detected by sidebar element)
    const adminSidebar = document.querySelector(".sidebar");
    if (adminSidebar) {
        setupAdminEventListeners();
        initAdminView();
        console.log("CampusFlow Admin Portal initialized.");
    }

    // 4. Cross-tab synchronization via storage event
    window.addEventListener("storage", (event) => {
        if (typeof STORAGE_KEYS !== "undefined" && (event.key === STORAGE_KEYS.EVENTS || event.key === STORAGE_KEYS.REGISTRATIONS)) {
            if (typeof loadEvents === "function") {
                events = loadEvents();
            }
            if (typeof loadRegistrations === "function") {
                registrations = loadRegistrations();
            }

            if (document.getElementById("events-grid")) {
                if (typeof applyEventFilters === "function") applyEventFilters();
                if (typeof updateStatisticsDisplay === "function") updateStatisticsDisplay();
            }

            if (document.getElementById("adminEventSearch")) {
                if (typeof initAdminView === "function") initAdminView();
            }
        }
    });
});

/**
 * Admin Portal Event Listeners
 * Wires search, filters, and form submissions for admin.html.
 */
function setupAdminEventListeners() {
    // Topbar global search — proxies to whichever tab is active
    const globalSearch = document.getElementById('globalSearch');
    if (globalSearch) {
        globalSearch.addEventListener('input', () => {
            const activePanel = document.querySelector('.tab-panel.active');
            if (!activePanel) return;
            if (activePanel.id === 'tabPanel-dashboard') {
                const el = document.getElementById('adminEventSearch');
                if (el) { el.value = globalSearch.value; renderAdminEventsTable(); }
            } else {
                const el = document.getElementById('adminRegSearch');
                if (el) { el.value = globalSearch.value; renderAdminRegistrationsTable(); }
            }
        });
    }

    // Event table search
    const evtSearch = document.getElementById('adminEventSearch');
    if (evtSearch) evtSearch.addEventListener('input', renderAdminEventsTable);

    // Event Add/Edit form
    const eventForm = document.getElementById('eventForm');
    if (eventForm) eventForm.addEventListener('submit', handleEventFormSubmit);

    // Registration search and filters
    const regSearch  = document.getElementById('adminRegSearch');
    const regEvent   = document.getElementById('adminRegEventFilter');
    const regStatus  = document.getElementById('adminRegStatusFilter');
    if (regSearch)  regSearch.addEventListener('input', renderAdminRegistrationsTable);
    if (regEvent)   regEvent.addEventListener('change', renderAdminRegistrationsTable);
    if (regStatus)  regStatus.addEventListener('change', renderAdminRegistrationsTable);
}
