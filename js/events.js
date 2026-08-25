/**
 * CampusFlow - Event Discovery & Rendering Logic (Phase 4)
 * 
 * Handles dynamic event card rendering, formatting, search, filtering,
 * multi-criteria sorting, and dynamic seat statistics computation.
 */

/**
 * Formats a date string (YYYY-MM-DD) into readable format (e.g., "10 Sep 2026")
 * @param {string} dateString 
 * @returns {string} Formatted date
 */
function formatDate(dateString) {
    if (!dateString) return "";
    const options = { day: "numeric", month: "short", year: "numeric" };
    const date = new Date(dateString);
    return date.toLocaleDateString("en-GB", options);
}

/**
 * Formats fee to Indian Rupee currency format or "Free"
 * @param {number} fee 
 * @returns {string} Formatted fee string
 */
function formatFee(fee) {
    if (fee === 0 || fee === "0") {
        return "Free";
    }
    return `₹${fee}`;
}

/**
 * Retrieves a single event object by its unique ID from the active events array
 * @param {string} id - Event ID (e.g., "EVT001")
 * @returns {Object|undefined} The matching event object
 */
function getEventById(id) {
    return events.find(event => event.id === id);
}

/**
 * Calculates live statistics based on the active events and registrations arrays
 * @param {Array} eventList - Array of event objects
 * @returns {Object} Calculated stats { totalEvents, totalRegistrations, availableSeats }
 */
function calculateStats(eventList = events) {
    const totalEvents = eventList.length;
    
    const availableSeats = eventList.reduce((sum, event) => {
        return sum + (Number(event.availableSeats) || 0);
    }, 0);

    const activeRegistrations = registrations.filter(reg => reg.status === "Registered");
    const totalRegistrations = activeRegistrations.length;

    return {
        totalEvents,
        totalRegistrations,
        availableSeats
    };
}

/**
 * Updates the statistics displays across the DOM
 */
function updateStatisticsDisplay() {
    const stats = calculateStats(events);

    const totalEventsEl = document.getElementById("stat-total-events");
    const totalRegistrationsEl = document.getElementById("stat-total-registrations");
    const availableSeatsEl = document.getElementById("stat-available-seats");

    if (totalEventsEl) {
        totalEventsEl.textContent = stats.totalEvents;
    }
    if (totalRegistrationsEl) {
        totalRegistrationsEl.textContent = stats.totalRegistrations;
    }
    if (availableSeatsEl) {
        availableSeatsEl.textContent = stats.availableSeats;
    }
}

/**
 * Creates HTML template for an individual event card
 * @param {Object} event - Event data object
 * @returns {string} HTML markup string
 */
function createEventCard(event) {
    const isFull = Number(event.availableSeats) <= 0;
    const formattedDate = formatDate(event.date);
    const formattedFee = formatFee(event.registrationFee);
    const timeText = event.timeDisplay || (event.startTime && event.endTime ? `${event.startTime} – ${event.endTime}` : "");
    
    // Category-based badge class
    const categoryClass = `category-${event.category.toLowerCase().replace(/\s+/g, "-")}`;

    return `
        <article class="event-card ${isFull ? 'event-card--full' : ''}" data-event-id="${event.id}">
            <div class="event-card-header">
                <span class="category-badge ${categoryClass}">${event.category}</span>
                <span class="seat-badge ${isFull ? 'seat-badge--full' : 'seat-badge--available'}">
                    ${isFull ? 'FULL' : `${event.availableSeats} seats available`}
                </span>
            </div>

            <div class="event-card-body">
                <h3 class="event-title">${event.name}</h3>

                <div class="event-meta-list">
                    <div class="event-meta-item">
                        <svg class="meta-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                            <line x1="16" y1="2" x2="16" y2="6"></line>
                            <line x1="8" y1="2" x2="8" y2="6"></line>
                            <line x1="3" y1="10" x2="21" y2="10"></line>
                        </svg>
                        <span>${formattedDate}${timeText ? ` &bull; ${timeText}` : ''}</span>
                    </div>

                    <div class="event-meta-item">
                        <svg class="meta-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                            <circle cx="12" cy="10" r="3"></circle>
                        </svg>
                        <span>${event.venue}</span>
                    </div>
                </div>
            </div>

            <div class="event-card-footer">
                <div class="event-pricing">
                    <span class="price-label">Fee</span>
                    <span class="price-value">${formattedFee}</span>
                </div>

                <button 
                    type="button" 
                    class="btn btn-register ${isFull ? 'btn-disabled' : 'btn-primary'}" 
                    data-event-id="${event.id}"
                    ${isFull ? 'disabled aria-disabled="true"' : ''}
                >
                    ${isFull ? 'Sold Out' : 'Register'}
                </button>
            </div>
        </article>
    `;
}

/**
 * Renders all event cards into the event container element
 * @param {Array} eventList - Array of events to render
 */
function renderEvents(eventList = events) {
    const container = document.getElementById("events-grid");
    if (!container) return;

    if (!eventList || eventList.length === 0) {
        container.innerHTML = `
            <div class="no-events-state">
                <div class="no-events-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                        <circle cx="11" cy="11" r="8"></circle>
                        <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                        <line x1="8" y1="11" x2="14" y2="11"></line>
                    </svg>
                </div>
                <h4 class="no-events-title">No events found</h4>
                <p class="no-events-subtitle">Try changing your search or filters.</p>
            </div>
        `;
        return;
    }

    const cardsHtml = eventList.map(event => createEventCard(event)).join("");
    container.innerHTML = cardsHtml;
}

/* ==========================================================================
   Search, Filter & Sort Functions
   ========================================================================== */

/**
 * Filters events by searching in event name and venue (case-insensitive)
 * @param {Array} eventList - Array of events
 * @param {string} query - Search term
 * @returns {Array} Filtered events
 */
function searchEvents(eventList, query) {
    const trimmed = (query || "").trim().toLowerCase();
    if (!trimmed) {
        return eventList;
    }

    return eventList.filter(event => {
        const nameMatches = event.name.toLowerCase().includes(trimmed);
        const venueMatches = event.venue.toLowerCase().includes(trimmed);
        return nameMatches || venueMatches;
    });
}

/**
 * Filters events by category
 * @param {Array} eventList - Array of events
 * @param {string} category - Category name (e.g. "Technical", "Workshop", "all")
 * @returns {Array} Filtered events
 */
function filterEventsByCategory(eventList, category) {
    if (!category || category === "all") {
        return eventList;
    }

    return eventList.filter(event => {
        return event.category.toLowerCase() === category.toLowerCase();
    });
}

/**
 * Sorts events according to the selected criterion without mutating the original array
 * @param {Array} eventList - Array of events
 * @param {string} sortBy - Sort key ("default", "date", "fee", "seats")
 * @returns {Array} Sorted new array of events
 */
function sortEvents(eventList, sortBy) {
    const clonedList = [...eventList];

    switch (sortBy) {
        case "date":
            // Earliest event date first
            return clonedList.sort((a, b) => new Date(a.date) - new Date(b.date));

        case "fee":
            // Lowest registration fee first
            return clonedList.sort((a, b) => Number(a.registrationFee) - Number(b.registrationFee));

        case "seats":
            // Most available seats first
            return clonedList.sort((a, b) => Number(b.availableSeats) - Number(a.availableSeats));

        case "default":
        default:
            // Maintain original order
            return clonedList;
    }
}

/**
 * Updates result count feedback display
 * @param {number} count - Number of matched events
 */
function updateResultCount(count) {
    const countBadge = document.getElementById("events-count-badge");
    if (!countBadge) return;

    if (count === 1) {
        countBadge.textContent = "1 event found";
    } else {
        countBadge.textContent = `${count} events found`;
    }
}

/**
 * Central pipeline function that combines search, category filtering, and sorting
 */
function applyEventFilters() {
    const searchInput = document.getElementById("search-input");
    const categorySelect = document.getElementById("category-filter");
    const sortSelect = document.getElementById("sort-select");

    const searchQuery = searchInput ? searchInput.value : "";
    const selectedCategory = categorySelect ? categorySelect.value : "all";
    const selectedSort = sortSelect ? sortSelect.value : "default";

    // Pipeline: events -> search -> category filter -> sort
    let result = [...events];
    result = searchEvents(result, searchQuery);
    result = filterEventsByCategory(result, selectedCategory);
    result = sortEvents(result, selectedSort);

    // Render result cards & update count
    renderEvents(result);
    updateResultCount(result.length);
}

/**
 * Clears all filters and resets UI controls to default state
 */
function clearFilters() {
    const searchInput = document.getElementById("search-input");
    const categorySelect = document.getElementById("category-filter");
    const sortSelect = document.getElementById("sort-select");

    if (searchInput) searchInput.value = "";
    if (categorySelect) categorySelect.value = "all";
    if (sortSelect) sortSelect.value = "default";

    applyEventFilters();
}

/**
 * Attaches event listeners for all filter, search, sort, and clear controls
 */
function setupEventFilters() {
    const searchInput = document.getElementById("search-input");
    const categorySelect = document.getElementById("category-filter");
    const sortSelect = document.getElementById("sort-select");
    const clearButton = document.getElementById("btn-clear-filters");

    if (searchInput) {
        searchInput.addEventListener("input", applyEventFilters);
    }

    if (categorySelect) {
        categorySelect.addEventListener("change", applyEventFilters);
    }

    if (sortSelect) {
        sortSelect.addEventListener("change", applyEventFilters);
    }

    if (clearButton) {
        clearButton.addEventListener("click", clearFilters);
    }
}
