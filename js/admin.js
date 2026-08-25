/**
 * CampusFlow - Admin Controller Module
 * Handles Dashboard Statistics, Event Management (CRUD), and Registration Management.
 */

let activeDeleteEventId = null;
let activeEditEventId = null;

/**
 * Initializes the Admin Dashboard.
 */
function initAdminView() {
    updateAdminStats();
    renderAdminEventsTable();
    renderAdminRegistrationsTable();
    populateAdminEventFilterDropdown();
}

/**
 * Calculates and updates Admin Dashboard Statistics dynamically from LocalStorage.
 */
function updateAdminStats() {
    const events = loadEvents();
    const registrations = loadRegistrations();

    // 1. Total Events
    const totalEvents = events.length;

    // 2. Total Registrations (Active)
    const activeRegistrations = registrations.filter(r => r.status === 'Registered').length;

    // 3. Available Seats across all events
    const availableSeatsSum = events.reduce((acc, curr) => acc + (Number(curr.availableSeats) || 0), 0);

    // 4. Cancelled Registrations
    const cancelledRegistrations = registrations.filter(r => r.status === 'Cancelled').length;

    // DOM Elements update
    const elTotalEvents = document.getElementById('statTotalEvents');
    const elTotalRegs = document.getElementById('statTotalRegistrations');
    const elAvailableSeats = document.getElementById('statAvailableSeats');
    const elCancelledRegs = document.getElementById('statCancelledRegistrations');

    if (elTotalEvents) elTotalEvents.textContent = totalEvents;
    if (elTotalRegs) elTotalRegs.textContent = activeRegistrations;
    if (elAvailableSeats) elAvailableSeats.textContent = availableSeatsSum;
    if (elCancelledRegs) elCancelledRegs.textContent = cancelledRegistrations;
}

/**
 * Renders the Admin Events Table.
 */
function renderAdminEventsTable() {
    const tbody = document.getElementById('adminEventsTableBody');
    if (!tbody) return;

    const events = loadEvents();
    const registrations = loadRegistrations();
    const searchInput = document.getElementById('adminEventSearch');
    const searchTerm = searchInput ? searchInput.value.toLowerCase().trim() : '';

    const filteredEvents = events.filter(e => 
        e.name.toLowerCase().includes(searchTerm) ||
        e.category.toLowerCase().includes(searchTerm) ||
        e.venue.toLowerCase().includes(searchTerm)
    );

    if (filteredEvents.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" class="empty-state" style="padding: 40px; text-align: center;">
                    <p style="color: var(--text-muted);">No events found matching your criteria.</p>
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = filteredEvents.map(evt => {
        const activeRegsCount = registrations.filter(r => r.eventId === evt.id && r.status === 'Registered').length;
        const badgeClass = getCategoryBadgeClass(evt.category);
        const feeText = evt.registrationFee === 0 ? 'FREE' : `₹${evt.registrationFee}`;
        const isFull = evt.availableSeats <= 0;

        return `
            <tr>
                <td><strong style="color: #818cf8;">${evt.id}</strong></td>
                <td>
                    <div class="table-cell-main">${escapeHTML(evt.name)}</div>
                    <div class="table-subtext">${formatDate(evt.date)}</div>
                </td>
                <td><span class="badge ${badgeClass}">${evt.category}</span></td>
                <td>${escapeHTML(evt.venue)}</td>
                <td><strong>${feeText}</strong></td>
                <td>
                    <div>
                        <strong style="color: ${isFull ? 'var(--danger-color)' : 'var(--success-color)'};">
                            ${evt.availableSeats} / ${evt.totalSeats}
                        </strong>
                        <div class="table-subtext">${activeRegsCount} booked</div>
                    </div>
                </td>
                <td>
                    <div class="action-buttons">
                        <button class="btn-icon edit" title="Edit Event" onclick="openEditEventModal('${evt.id}')">
                            ✏️
                        </button>
                        <button class="btn-icon delete" title="Delete Event" onclick="openDeleteConfirmModal('${evt.id}')">
                            🗑️
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

/**
 * Opens Add Event Modal.
 */
function openAddEventModal() {
    activeEditEventId = null;
    const form = document.getElementById('eventForm');
    if (form) form.reset();
    document.getElementById('eventModalTitle').textContent = 'Add New Campus Event';
    
    // Set default date to today or future date
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('eventDate').value = today;

    const modal = document.getElementById('eventModal');
    if (modal) modal.classList.add('active');
}

/**
 * Opens Edit Event Modal with pre-filled fields.
 */
function openEditEventModal(eventId) {
    const events = loadEvents();
    const evt = events.find(e => e.id === eventId);
    if (!evt) return;

    activeEditEventId = eventId;
    document.getElementById('eventModalTitle').textContent = `Edit Event: ${evt.name}`;
    
    document.getElementById('eventName').value = evt.name;
    document.getElementById('eventCategory').value = evt.category;
    document.getElementById('eventDate').value = evt.date;
    document.getElementById('eventVenue').value = evt.venue;
    document.getElementById('eventFee').value = evt.registrationFee;
    document.getElementById('eventSeats').value = evt.totalSeats;
    document.getElementById('eventDescription').value = evt.description || '';

    const modal = document.getElementById('eventModal');
    if (modal) modal.classList.add('active');
}

/**
 * Closes Add/Edit Event Modal.
 */
function closeEventModal() {
    const modal = document.getElementById('eventModal');
    if (modal) modal.classList.remove('active');
    activeEditEventId = null;
}

/**
 * Handles Form Submission for Add or Edit Event.
 */
function handleEventFormSubmit(event) {
    event.preventDefault();

    const name = document.getElementById('eventName').value;
    const category = document.getElementById('eventCategory').value;
    const date = document.getElementById('eventDate').value;
    const venue = document.getElementById('eventVenue').value;
    const registrationFee = Number(document.getElementById('eventFee').value) || 0;
    const totalSeats = Number(document.getElementById('eventSeats').value) || 0;
    const description = document.getElementById('eventDescription').value;

    const eventPayload = { name, category, date, venue, registrationFee, totalSeats, description };

    const validation = validateEventForm(eventPayload);
    if (!validation.isValid) {
        showToast(validation.message, "danger");
        return;
    }

    const events = loadEvents();

    if (activeEditEventId) {
        // Edit Mode
        const index = events.findIndex(e => e.id === activeEditEventId);
        if (index !== -1) {
            const existingEvt = events[index];
            const bookedSeats = existingEvt.totalSeats - existingEvt.availableSeats;
            
            // Calculate new available seats preserving existing bookings
            const newAvailableSeats = Math.max(0, totalSeats - bookedSeats);

            events[index] = {
                ...existingEvt,
                name: name.trim(),
                category: category,
                date: date,
                venue: venue.trim(),
                registrationFee: registrationFee,
                totalSeats: totalSeats,
                availableSeats: newAvailableSeats,
                description: description.trim()
            };

            saveEvents(events);
            showToast(`Event "${name}" updated successfully!`, "success");
        }
    } else {
        // Add Mode
        const newId = 'EVT' + String(events.length + 1).padStart(3, '0');
        const newEvent = {
            id: newId,
            name: name.trim(),
            category: category,
            date: date,
            time: "09:00 AM - 05:00 PM",
            venue: venue.trim(),
            registrationFee: registrationFee,
            totalSeats: totalSeats,
            availableSeats: totalSeats, // Initially all seats available
            description: description.trim(),
            status: "Upcoming"
        };

        events.push(newEvent);
        saveEvents(events);
        showToast(`New Event "${name}" created successfully!`, "success");
    }

    closeEventModal();
    initAdminView();
}

/**
 * Opens Delete Confirmation Modal with active registration warnings.
 */
function openDeleteConfirmModal(eventId) {
    const events = loadEvents();
    const registrations = loadRegistrations();
    const evt = events.find(e => e.id === eventId);
    if (!evt) return;

    activeDeleteEventId = eventId;
    const activeRegsCount = registrations.filter(r => r.eventId === eventId && r.status === 'Registered').length;

    document.getElementById('deleteEventName').textContent = evt.name;
    const warningBox = document.getElementById('deleteWarningContainer');

    if (activeRegsCount > 0) {
        warningBox.style.display = 'block';
        warningBox.innerHTML = `
            <strong>⚠️ Warning:</strong> This event currently has <strong>${activeRegsCount} active registration(s)</strong>. 
            Deleting this event will mark all associated registrations as cancelled.
        `;
    } else {
        warningBox.style.display = 'none';
    }

    const modal = document.getElementById('deleteModal');
    if (modal) modal.classList.add('active');
}

/**
 * Closes Delete Modal.
 */
function closeDeleteModal() {
    const modal = document.getElementById('deleteModal');
    if (modal) modal.classList.remove('active');
    activeDeleteEventId = null;
}

/**
 * Confirms deletion of event and updates shared LocalStorage.
 */
function confirmDeleteEvent() {
    if (!activeDeleteEventId) return;

    let events = loadEvents();
    let registrations = loadRegistrations();

    // 1. Remove event from events[]
    events = events.filter(e => e.id !== activeDeleteEventId);
    saveEvents(events);

    // 2. Mark associated registrations as Cancelled
    registrations = registrations.map(r => {
        if (r.eventId === activeDeleteEventId) {
            return { ...r, status: 'Cancelled' };
        }
        return r;
    });
    saveRegistrations(registrations);

    closeDeleteModal();
    showToast("Event deleted successfully.", "success");
    initAdminView();
}

/**
 * Renders Admin Registrations Management Table.
 */
function renderAdminRegistrationsTable() {
    const tbody = document.getElementById('adminRegistrationsTableBody');
    if (!tbody) return;

    const registrations = loadRegistrations();
    const events = loadEvents();

    const searchInput = document.getElementById('adminRegSearch');
    const eventFilter = document.getElementById('adminRegEventFilter');
    const statusFilter = document.getElementById('adminRegStatusFilter');

    const searchTerm = searchInput ? searchInput.value.toLowerCase().trim() : '';
    const selectedEvent = eventFilter ? eventFilter.value : 'All';
    const selectedStatus = statusFilter ? statusFilter.value : 'All';

    const filtered = registrations.filter(r => {
        const evt = events.find(e => e.id === r.eventId) || { name: '' };
        const matchesSearch = r.studentName.toLowerCase().includes(searchTerm) ||
                              r.registerNumber.toLowerCase().includes(searchTerm) ||
                              r.registrationId.toLowerCase().includes(searchTerm) ||
                              r.email.toLowerCase().includes(searchTerm);
        const matchesEvent = selectedEvent === 'All' || r.eventId === selectedEvent;
        const matchesStatus = selectedStatus === 'All' || r.status === selectedStatus;

        return matchesSearch && matchesEvent && matchesStatus;
    });

    if (filtered.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" class="empty-state" style="padding: 40px; text-align: center;">
                    <p style="color: var(--text-muted);">No registrations found.</p>
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = filtered.map(reg => {
        const evt = events.find(e => e.id === reg.eventId) || { name: 'Deleted Event', date: '' };
        const isCancelled = reg.status === 'Cancelled';

        return `
            <tr>
                <td><strong style="color: var(--gold-accent);">${reg.registrationId}</strong></td>
                <td>
                    <div class="table-cell-main">${escapeHTML(reg.studentName)}</div>
                    <div class="table-subtext">${escapeHTML(reg.email)} | ${escapeHTML(reg.phone || '')}</div>
                </td>
                <td><strong>${escapeHTML(reg.registerNumber)}</strong></td>
                <td>
                    <div class="table-cell-main">${escapeHTML(evt.name)}</div>
                    <div class="table-subtext">ID: ${reg.eventId}</div>
                </td>
                <td>${formatDate(evt.date)}</td>
                <td>
                    <span class="badge ${isCancelled ? 'badge-cancelled' : 'badge-registered'}">
                        ${reg.status}
                    </span>
                </td>
                <td>
                    ${!isCancelled ? `
                        <button class="btn btn-secondary" style="font-size: 0.8rem; padding: 4px 10px; color: #f87171; border-color: rgba(239, 68, 68, 0.4);"
                                onclick="adminCancelRegistration('${reg.registrationId}')">
                            Cancel
                        </button>
                    ` : '<span style="color: var(--text-muted); font-size: 0.8rem;">No actions</span>'}
                </td>
            </tr>
        `;
    }).join('');
}

/**
 * Populates event filter dropdown for registration management.
 */
function populateAdminEventFilterDropdown() {
    const dropdown = document.getElementById('adminRegEventFilter');
    if (!dropdown) return;

    const events = loadEvents();
    dropdown.innerHTML = `<option value="All">All Events</option>` + 
        events.map(e => `<option value="${e.id}">${escapeHTML(e.name)}</option>`).join('');
}

/**
 * Admin cancels student registration and releases seat.
 */
function adminCancelRegistration(regId) {
    if (!confirm(`Are you sure you want to cancel registration ${regId}?`)) return;

    const registrations = loadRegistrations();
    const events = loadEvents();

    const regIndex = registrations.findIndex(r => r.registrationId === regId);
    if (regIndex === -1) return;

    const targetReg = registrations[regIndex];
    if (targetReg.status === 'Cancelled') return;

    // Mark registration status as Cancelled
    registrations[regIndex].status = 'Cancelled';
    saveRegistrations(registrations);

    // Release seat back to event
    const eventIndex = events.findIndex(e => e.id === targetReg.eventId);
    if (eventIndex !== -1) {
        events[eventIndex].availableSeats = Math.min(
            events[eventIndex].totalSeats,
            events[eventIndex].availableSeats + 1
        );
        saveEvents(events);
    }

    showToast(`Registration ${regId} cancelled and seat released.`, "success");
    initAdminView();
}

/**
 * Admin Navigation Tabs Switcher
 */
function switchAdminTab(tabName) {
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.tab-panel').forEach(panel => panel.classList.remove('active'));

    const activeBtn = document.getElementById(`tabBtn-${tabName}`);
    const activePanel = document.getElementById(`tabPanel-${tabName}`);

    if (activeBtn) activeBtn.classList.add('active');
    if (activePanel) activePanel.classList.add('active');
}
