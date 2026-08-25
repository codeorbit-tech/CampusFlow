/**
 * CampusFlow - Student Registration Module
 * Manages modal interactions, form submissions, and seat adjustments for students.
 */

let activeRegistrationEventId = null;

/**
 * Opens the Registration Modal pre-populated with target event details.
 */
function openRegistrationModal(eventId) {
    const events = loadEvents();
    const targetEvent = events.find(e => e.id === eventId);
    if (!targetEvent) return;

    if (targetEvent.availableSeats <= 0) {
        showToast("Sorry, this event is already fully booked!", "danger");
        return;
    }

    activeRegistrationEventId = eventId;

    // Fill modal details
    document.getElementById('modalEventId').value = eventId;
    document.getElementById('modalEventTitle').textContent = targetEvent.name;
    document.getElementById('modalEventVenue').textContent = targetEvent.venue;
    document.getElementById('modalEventDate').textContent = `${formatDate(targetEvent.date)} (${targetEvent.time || ''})`;
    document.getElementById('modalEventFee').textContent = targetEvent.registrationFee === 0 ? 'FREE' : `₹${targetEvent.registrationFee}`;

    // Reset form errors & values
    document.getElementById('registrationForm').reset();
    clearFormErrors();

    // Show modal
    const modal = document.getElementById('registrationModal');
    if (modal) modal.classList.add('active');
}

/**
 * Closes the Registration Modal.
 */
function closeRegistrationModal() {
    const modal = document.getElementById('registrationModal');
    if (modal) modal.classList.remove('active');
    activeRegistrationEventId = null;
}

/**
 * Submits the student registration form.
 */
function submitRegistration(event) {
    event.preventDefault();
    clearFormErrors();

    const studentName = document.getElementById('studentName').value;
    const registerNumber = document.getElementById('registerNumber').value;
    const email = document.getElementById('studentEmail').value;
    const phone = document.getElementById('studentPhone').value;
    const eventId = activeRegistrationEventId;

    const formData = { studentName, registerNumber, email, phone, eventId };

    const events = loadEvents();
    const registrations = loadRegistrations();

    // Perform validation checks
    const validation = validateRegistration(formData, events, registrations);
    if (!validation.isValid) {
        showToast(validation.message, "danger");
        return;
    }

    // 1. Create Registration Object
    const regId = 'REG' + String(Date.now()).slice(-6);
    const newRegistration = {
        registrationId: regId,
        studentName: studentName.trim(),
        registerNumber: registerNumber.trim().toUpperCase(),
        email: email.trim(),
        phone: phone.trim(),
        eventId: eventId,
        status: 'Registered',
        registeredAt: new Date().toISOString()
    };

    registrations.push(newRegistration);
    saveRegistrations(registrations);

    // 2. Update Available Seats in events[]
    const eventIndex = events.findIndex(e => e.id === eventId);
    if (eventIndex !== -1) {
        events[eventIndex].availableSeats = Math.max(0, events[eventIndex].availableSeats - 1);
        saveEvents(events);
    }

    // 3. UI Updates
    closeRegistrationModal();
    showToast(`Registration Successful! Pass ID: ${regId}`, "success");

    // Refresh active student views
    applyEventFilters();
    renderStudentRegistrations();
}

/**
 * Renders student's registrations inside "My Registrations" view.
 */
function renderStudentRegistrations() {
    const container = document.getElementById('myRegistrationsGrid');
    if (!container) return;

    const registrations = loadRegistrations();
    const events = loadEvents();

    if (registrations.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <p>You haven't registered for any events yet. Explore events above and sign up!</p>
            </div>
        `;
        return;
    }

    container.innerHTML = registrations.map(reg => {
        const evt = events.find(e => e.id === reg.eventId) || { name: 'Unknown Event', date: '', venue: '' };
        const isCancelled = reg.status === 'Cancelled';

        return `
            <div class="registration-card">
                <div>
                    <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                        <span class="badge ${isCancelled ? 'badge-cancelled' : 'badge-registered'}">${reg.status}</span>
                        <small style="color: var(--text-muted); font-size: 0.75rem;">ID: ${reg.registrationId}</small>
                    </div>
                    <h4 style="font-size: 1.1rem; font-weight: 700; margin-bottom: 4px;">${escapeHTML(evt.name)}</h4>
                    <p style="font-size: 0.85rem; color: var(--text-secondary); margin-bottom: 12px;">
                        ${escapeHTML(reg.studentName)} (${escapeHTML(reg.registerNumber)})
                    </p>
                    <div style="font-size: 0.82rem; color: var(--text-muted); display: flex; flex-direction: column; gap: 4px;">
                        <span>📅 Date: ${formatDate(evt.date)}</span>
                        <span>📍 Venue: ${escapeHTML(evt.venue)}</span>
                    </div>
                </div>
                ${!isCancelled ? `
                    <button class="btn btn-secondary" style="margin-top: 16px; font-size: 0.85rem; padding: 6px 12px; border-color: rgba(239, 68, 68, 0.4); color: #f87171;"
                            onclick="cancelRegistrationByStudent('${reg.registrationId}')">
                        Cancel Registration
                    </button>
                ` : ''}
            </div>
        `;
    }).join('');
}

/**
 * Student cancels their registration.
 */
function cancelRegistrationByStudent(regId) {
    if (!confirm("Are you sure you want to cancel this registration?")) return;

    const registrations = loadRegistrations();
    const events = loadEvents();

    const regIndex = registrations.findIndex(r => r.registrationId === regId);
    if (regIndex === -1) return;

    const targetReg = registrations[regIndex];
    if (targetReg.status === 'Cancelled') return;

    // Update status to Cancelled
    registrations[regIndex].status = 'Cancelled';
    saveRegistrations(registrations);

    // Increase available seats in corresponding event
    const eventIndex = events.findIndex(e => e.id === targetReg.eventId);
    if (eventIndex !== -1) {
        events[eventIndex].availableSeats = Math.min(
            events[eventIndex].totalSeats,
            events[eventIndex].availableSeats + 1
        );
        saveEvents(events);
    }

    showToast("Registration cancelled successfully.", "success");

    // Re-render views
    applyEventFilters();
    renderStudentRegistrations();
}

/**
 * Clear form error highlights.
 */
function clearFormErrors() {
    document.querySelectorAll('.form-group').forEach(el => el.classList.remove('has-error'));
}

/**
 * Displays toast notifications.
 */
function showToast(message, type = 'info') {
    let toastContainer = document.querySelector('.toast-container');
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.className = 'toast-container';
        document.body.appendChild(toastContainer);
    }

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
        <span>${escapeHTML(message)}</span>
    `;

    toastContainer.appendChild(toast);

    setTimeout(() => {
        toast.remove();
    }, 4000);
}
