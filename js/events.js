/**
 * CampusFlow - Events Module (Student Portal)
 * Manages event rendering, searching, filtering, and sorting on index.html.
 */

let currentEventsList = [];

/**
 * Initializes and renders events on the student portal.
 */
function initEventsView() {
    currentEventsList = loadEvents();
    renderCategoryFilterOptions(currentEventsList);
    applyEventFilters();
}

/**
 * Renders category filter dropdown dynamically from available events.
 */
function renderCategoryFilterOptions(events) {
    const categorySelect = document.getElementById('categoryFilter');
    if (!categorySelect) return;

    // Retain "All Categories" default option
    const categories = ['All', ...new Set(events.map(e => e.category))];
    categorySelect.innerHTML = categories.map(cat => 
        `<option value="${cat}">${cat === 'All' ? 'All Categories' : cat}</option>`
    ).join('');
}

/**
 * Applies search, category filter, and sorting to events array and renders grid.
 */
function applyEventFilters() {
    const searchInput = document.getElementById('eventSearch');
    const categorySelect = document.getElementById('categoryFilter');
    const sortSelect = document.getElementById('sortFilter');
    const eventsContainer = document.getElementById('eventsGrid');

    if (!eventsContainer) return;

    const searchTerm = searchInput ? searchInput.value.toLowerCase().trim() : '';
    const selectedCategory = categorySelect ? categorySelect.value : 'All';
    const sortBy = sortSelect ? sortSelect.value : 'date-asc';

    let filtered = loadEvents().filter(evt => {
        const matchesSearch = evt.name.toLowerCase().includes(searchTerm) ||
                              evt.description.toLowerCase().includes(searchTerm) ||
                              evt.venue.toLowerCase().includes(searchTerm);
        const matchesCategory = selectedCategory === 'All' || evt.category === selectedCategory;
        return matchesSearch && matchesCategory;
    });

    // Sorting logic
    filtered.sort((a, b) => {
        if (sortBy === 'date-asc') return new Date(a.date) - new Date(b.date);
        if (sortBy === 'date-desc') return new Date(b.date) - new Date(a.date);
        if (sortBy === 'seats-desc') return b.availableSeats - a.availableSeats;
        if (sortBy === 'fee-asc') return a.registrationFee - b.registrationFee;
        return 0;
    });

    renderEventsGrid(filtered, eventsContainer);
}

/**
 * Renders the array of events into the DOM grid.
 */
function renderEventsGrid(events, container) {
    if (!events || events.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <p>No events match your search. Try a different keyword or category.</p>
            </div>
        `;
        return;
    }

    container.innerHTML = events.map(evt => {
        const badgeClass = getCategoryBadgeClass(evt.category);
        const isFull = evt.availableSeats <= 0;
        const seatStatusClass = isFull ? 'empty' : (evt.availableSeats < 10 ? 'limited' : 'available');
        const feeText = evt.registrationFee === 0 ? 'Free' : `₹${evt.registrationFee}`;

        return `
            <div class="event-card" id="card-${evt.id}">
                <div>
                    <div class="event-card-header">
                        <span class="badge ${badgeClass}">${evt.category}</span>
                        <span class="event-seats ${seatStatusClass}">
                            ${isFull ? 'Sold out' : `${evt.availableSeats} / ${evt.totalSeats} left`}
                        </span>
                    </div>
                    <h3 class="event-title">${escapeHTML(evt.name)}</h3>
                    <p class="event-desc">${escapeHTML(evt.description || '')}</p>
                    <div class="event-meta">
                        <div class="event-meta-row">
                            <span>${formatDate(evt.date)}</span>
                            <span class="event-meta-dot"></span>
                            <span>${evt.time || 'TBA'}</span>
                        </div>
                        <div class="event-meta-row">
                            <span>${escapeHTML(evt.venue)}</span>
                        </div>
                    </div>
                </div>
                <div class="event-card-footer">
                    <div class="event-price">${feeText}</div>
                    <button class="btn ${isFull ? 'btn-secondary btn-disabled' : 'btn-primary'}"
                            onclick="${isFull ? '' : `openRegistrationModal('${evt.id}')`}"
                            style="padding: 7px 14px; font-size: 12px;">
                        ${isFull ? 'Sold out' : 'Register'}
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

/**
 * Returns a specific CSS badge class based on category name.
 */
function getCategoryBadgeClass(category) {
    switch ((category || '').toLowerCase()) {
        case 'technical': return 'badge-tech';
        case 'workshop': return 'badge-workshop';
        case 'cultural': return 'badge-cultural';
        case 'sports': return 'badge-sports';
        case 'conference': return 'badge-conference';
        default: return 'badge-tech';
    }
}

function formatDate(dateStr) {
    if (!dateStr) return '';
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateStr).toLocaleDateString(undefined, options);
}

function escapeHTML(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}
