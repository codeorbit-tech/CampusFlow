/**
 * CampusFlow — Admin Controller
 * Dashboard stats, Event CRUD, Registration management.
 * All data read/written via shared LocalStorage keys (storage.js).
 */

let activeDeleteEventId = null;
let activeEditEventId   = null;

/* ── INIT ─────────────────────────────────────────────────── */

function initAdminView() {
    updateAdminStats();
    renderAdminEventsTable();
    renderAdminRegistrationsTable();
    populateAdminEventFilterDropdown();
}

/* ── STATS ────────────────────────────────────────────────── */

function updateAdminStats() {
    const events        = loadEvents();
    const registrations = loadRegistrations();

    const totalEvents      = events.length;
    const activeRegs       = registrations.filter(r => r.status === 'Registered').length;
    const availableSeats   = events.reduce((s, e) => s + (Number(e.availableSeats) || 0), 0);
    const cancelledRegs    = registrations.filter(r => r.status === 'Cancelled').length;

    setText('statTotalEvents',           totalEvents);
    setText('statTotalRegistrations',    activeRegs);
    setText('statAvailableSeats',        availableSeats);
    setText('statCancelledRegistrations',cancelledRegs);
}

function setText(id, val) {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
}

/* ── EVENTS TABLE ─────────────────────────────────────────── */

function renderAdminEventsTable() {
    const tbody = document.getElementById('adminEventsTableBody');
    if (!tbody) return;

    const events        = loadEvents();
    const registrations = loadRegistrations();
    const search        = (document.getElementById('adminEventSearch') || {}).value || '';
    const term          = search.toLowerCase().trim();

    const filtered = events.filter(e =>
        e.name.toLowerCase().includes(term) ||
        e.category.toLowerCase().includes(term) ||
        e.venue.toLowerCase().includes(term)
    );

    if (filtered.length === 0) {
        tbody.innerHTML = `<tr class="empty-row"><td colspan="7">No events found.</td></tr>`;
        return;
    }

    tbody.innerHTML = filtered.map(evt => {
        const booked     = registrations.filter(r => r.eventId === evt.id && r.status === 'Registered').length;
        const isFull     = evt.availableSeats <= 0;
        const isLow      = evt.availableSeats > 0 && evt.availableSeats < 10;
        const seatClass  = isFull ? 'seat-none' : (isLow ? 'seat-low' : 'seat-ok');
        const feeText    = evt.registrationFee === 0 ? 'Free' : `₹${evt.registrationFee}`;
        const badgeClass = getCategoryBadgeClass(evt.category);

        return `
        <tr>
            <td><span class="cell-id">${evt.id}</span></td>
            <td>
                <div class="cell-main">${escapeHTML(evt.name)}</div>
                <div class="cell-sub">${formatDate(evt.date)}</div>
            </td>
            <td><span class="badge ${badgeClass}">${evt.category}</span></td>
            <td style="color: var(--text-2);">${escapeHTML(evt.venue)}</td>
            <td style="font-weight:600;">${feeText}</td>
            <td>
                <span class="${seatClass}">${evt.availableSeats} / ${evt.totalSeats}</span>
                <div class="cell-sub">${booked} booked</div>
            </td>
            <td>
                <div class="action-group">
                    <button class="act-btn edit" title="Edit" onclick="openEditEventModal('${evt.id}')">
                        <svg width="13" height="13" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                        </svg>
                    </button>
                    <button class="act-btn destroy" title="Delete" onclick="openDeleteConfirmModal('${evt.id}')">
                        <svg width="13" height="13" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                        </svg>
                    </button>
                </div>
            </td>
        </tr>`;
    }).join('');
}

/* ── ADD / EDIT EVENT MODAL ───────────────────────────────── */

function openAddEventModal() {
    activeEditEventId = null;
    document.getElementById('eventForm').reset();
    document.getElementById('eventModalTitle').textContent = 'Add Event';
    document.getElementById('eventDate').value = new Date().toISOString().split('T')[0];
    document.getElementById('eventModal').classList.add('active');
}

function openEditEventModal(eventId) {
    const evt = loadEvents().find(e => e.id === eventId);
    if (!evt) return;

    activeEditEventId = eventId;
    document.getElementById('eventModalTitle').textContent = 'Edit Event';
    document.getElementById('eventName').value        = evt.name;
    document.getElementById('eventCategory').value    = evt.category;
    document.getElementById('eventDate').value        = evt.date;
    document.getElementById('eventVenue').value       = evt.venue;
    document.getElementById('eventFee').value         = evt.registrationFee;
    document.getElementById('eventSeats').value       = evt.totalSeats;
    document.getElementById('eventDescription').value = evt.description || '';
    document.getElementById('eventModal').classList.add('active');
}

function closeEventModal() {
    document.getElementById('eventModal').classList.remove('active');
    activeEditEventId = null;
}

function handleEventFormSubmit(e) {
    e.preventDefault();

    const payload = {
        name:            document.getElementById('eventName').value,
        category:        document.getElementById('eventCategory').value,
        date:            document.getElementById('eventDate').value,
        venue:           document.getElementById('eventVenue').value,
        registrationFee: Number(document.getElementById('eventFee').value)  || 0,
        totalSeats:      Number(document.getElementById('eventSeats').value) || 0,
        description:     document.getElementById('eventDescription').value,
    };

    const validation = validateEventForm(payload);
    if (!validation.isValid) { showToast(validation.message, 'danger'); return; }

    let events = loadEvents();

    if (activeEditEventId) {
        const idx = events.findIndex(e => e.id === activeEditEventId);
        if (idx !== -1) {
            const old       = events[idx];
            const booked    = old.totalSeats - old.availableSeats;
            events[idx] = {
                ...old,
                ...payload,
                name:           payload.name.trim(),
                venue:          payload.venue.trim(),
                description:    payload.description.trim(),
                availableSeats: Math.max(0, payload.totalSeats - booked),
            };
        }
        showToast(`"${payload.name}" updated.`, 'success');
    } else {
        // Generate unique ID even if events were deleted
        const existing = events.map(e => e.id);
        let n = events.length + 1;
        let newId;
        do { newId = 'EVT' + String(n).padStart(3, '0'); n++; } while (existing.includes(newId));

        events.push({
            id:              newId,
            name:            payload.name.trim(),
            category:        payload.category,
            date:            payload.date,
            time:            '09:00 AM – 05:00 PM',
            venue:           payload.venue.trim(),
            registrationFee: payload.registrationFee,
            totalSeats:      payload.totalSeats,
            availableSeats:  payload.totalSeats,
            description:     payload.description.trim(),
            status:          'Upcoming',
        });
        showToast(`"${payload.name}" created.`, 'success');
    }

    saveEvents(events);
    closeEventModal();
    initAdminView();
}

/* ── DELETE EVENT ─────────────────────────────────────────── */

function openDeleteConfirmModal(eventId) {
    const events        = loadEvents();
    const registrations = loadRegistrations();
    const evt           = events.find(e => e.id === eventId);
    if (!evt) return;

    activeDeleteEventId = eventId;
    document.getElementById('deleteEventName').textContent = evt.name;

    const activeCount  = registrations.filter(r => r.eventId === eventId && r.status === 'Registered').length;
    const warningBox   = document.getElementById('deleteWarningContainer');

    if (activeCount > 0) {
        warningBox.style.display = 'block';
        warningBox.innerHTML = `<strong>${activeCount} active registration(s)</strong> will be marked cancelled.`;
    } else {
        warningBox.style.display = 'none';
    }

    document.getElementById('deleteModal').classList.add('active');
}

function closeDeleteModal() {
    document.getElementById('deleteModal').classList.remove('active');
    activeDeleteEventId = null;
}

function confirmDeleteEvent() {
    if (!activeDeleteEventId) return;

    let events        = loadEvents();
    let registrations = loadRegistrations();

    events = events.filter(e => e.id !== activeDeleteEventId);
    registrations = registrations.map(r =>
        r.eventId === activeDeleteEventId ? { ...r, status: 'Cancelled' } : r
    );

    saveEvents(events);
    saveRegistrations(registrations);

    closeDeleteModal();
    showToast('Event deleted.', 'success');
    initAdminView();
}

/* ── REGISTRATIONS TABLE ──────────────────────────────────── */

function renderAdminRegistrationsTable() {
    const tbody = document.getElementById('adminRegistrationsTableBody');
    if (!tbody) return;

    const registrations = loadRegistrations();
    const events        = loadEvents();

    const term          = ((document.getElementById('adminRegSearch') || {}).value || '').toLowerCase().trim();
    const selEvent      = ((document.getElementById('adminRegEventFilter') || {}).value || 'All');
    const selStatus     = ((document.getElementById('adminRegStatusFilter') || {}).value || 'All');

    const filtered = registrations.filter(r => {
        const matchSearch = (
            r.studentName.toLowerCase().includes(term) ||
            r.registerNumber.toLowerCase().includes(term) ||
            r.email.toLowerCase().includes(term) ||
            r.registrationId.toLowerCase().includes(term)
        );
        const matchEvent  = selEvent  === 'All' || r.eventId === selEvent;
        const matchStatus = selStatus === 'All' || r.status  === selStatus;
        return matchSearch && matchEvent && matchStatus;
    });

    if (filtered.length === 0) {
        tbody.innerHTML = `<tr class="empty-row"><td colspan="7">No registrations found.</td></tr>`;
        return;
    }

    tbody.innerHTML = filtered.map(reg => {
        const evt        = events.find(e => e.id === reg.eventId) || { name: 'Deleted Event', date: '' };
        const cancelled  = reg.status === 'Cancelled';

        return `
        <tr>
            <td><span class="cell-id">${reg.registrationId}</span></td>
            <td>
                <div class="cell-main">${escapeHTML(reg.studentName)}</div>
                <div class="cell-sub">${escapeHTML(reg.email)}</div>
            </td>
            <td style="font-weight:600; color:var(--text-2);">${escapeHTML(reg.registerNumber)}</td>
            <td>
                <div class="cell-main">${escapeHTML(evt.name)}</div>
                <div class="cell-sub">${evt.id || ''}</div>
            </td>
            <td style="color:var(--text-2);">${formatDate(evt.date)}</td>
            <td><span class="badge ${cancelled ? 'badge-cancelled' : 'badge-registered'}">${reg.status}</span></td>
            <td>
                ${!cancelled ? `
                <button class="btn btn-secondary" style="font-size:11.5px; padding:4px 10px; color:var(--red); border-color:var(--red-border);"
                        onclick="adminCancelRegistration('${reg.registrationId}')">
                    Cancel
                </button>` : `<span style="color:var(--text-3); font-size:11.5px;">—</span>`}
            </td>
        </tr>`;
    }).join('');
}

function populateAdminEventFilterDropdown() {
    const dd = document.getElementById('adminRegEventFilter');
    if (!dd) return;
    const events = loadEvents();
    dd.innerHTML = `<option value="All">All events</option>` +
        events.map(e => `<option value="${e.id}">${escapeHTML(e.name)}</option>`).join('');
}

function adminCancelRegistration(regId) {
    if (!confirm(`Cancel registration ${regId}?`)) return;

    let registrations = loadRegistrations();
    let events        = loadEvents();

    const idx = registrations.findIndex(r => r.registrationId === regId);
    if (idx === -1 || registrations[idx].status === 'Cancelled') return;

    const targetEventId = registrations[idx].eventId;
    registrations[idx].status = 'Cancelled';
    saveRegistrations(registrations);

    const evtIdx = events.findIndex(e => e.id === targetEventId);
    if (evtIdx !== -1) {
        events[evtIdx].availableSeats = Math.min(
            events[evtIdx].totalSeats,
            events[evtIdx].availableSeats + 1
        );
        saveEvents(events);
    }

    showToast(`Registration ${regId} cancelled. Seat released.`, 'success');
    initAdminView();
}

/* ── TAB SWITCHING ────────────────────────────────────────── */

function switchAdminTab(tab) {
    // Sidebar buttons
    document.querySelectorAll('.sidebar-btn').forEach(b => b.classList.remove('active'));
    const map = { dashboard: 0, registrations: 1 };
    const btns = document.querySelectorAll('.sidebar-btn');
    if (btns[map[tab]]) btns[map[tab]].classList.add('active');

    // Panels
    document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
    const panel = document.getElementById(`tabPanel-${tab}`);
    if (panel) panel.classList.add('active');

    // Topbar title
    const titles = { dashboard: 'Overview', registrations: 'Registrations' };
    const titleEl = document.getElementById('topbarTitle');
    if (titleEl) titleEl.textContent = titles[tab] || 'Overview';
}
