/**
 * CampusFlow - Registration & Smart Seat Management Logic (Phase 4 & 5)
 * 
 * Implements:
 * 1. Client-side form validation
 * 2. Full event prevention
 * 3. Duplicate registration prevention
 * 4. Smart Event Time-Conflict Detection (USP)
 * 5. Dynamic seat decrement & increment on registration/cancellation
 * 6. LocalStorage persistence integration
 * 7. My Registrations Dashboard dynamic rendering & live cancellation (Phase 5)
 */

/**
 * Parses time string (e.g. "09:00", "14:30", "09:00 AM", "05:00 PM") into minutes from midnight.
 * @param {string} timeStr 
 * @returns {number} Minutes from midnight (0 to 1440)
 */
function parseTimeToMinutes(timeStr) {
    if (!timeStr) return 0;
    const clean = timeStr.trim().toUpperCase();
    const isPM = clean.includes("PM");
    const isAM = clean.includes("AM");
    const timePart = clean.replace(/(AM|PM)/g, "").trim();
    const parts = timePart.split(":");
    let hours = parseInt(parts[0], 10) || 0;
    const minutes = parseInt(parts[1], 10) || 0;

    if (isPM && hours < 12) {
        hours += 12;
    } else if (isAM && hours === 12) {
        hours = 0;
    }

    return hours * 60 + minutes;
}

/**
 * Checks for time overlaps between two events on the same date.
 * Touching boundaries (e.g. 10:00-11:00 and 11:00-12:00) DO NOT conflict.
 * Overlap formula: newStart < existingEnd && newEnd > existingStart
 * @param {string} registerNumber 
 * @param {Object} targetEvent 
 * @returns {Object} { hasConflict: boolean, conflictEvent: Object|null }
 */
function checkEventConflict(registerNumber, targetEvent) {
    if (!registerNumber || !targetEvent || !targetEvent.date) {
        return { hasConflict: false, conflictEvent: null };
    }

    const formattedRegNum = registerNumber.trim().toLowerCase();

    // Find all active registrations for this student
    const studentRegistrations = registrations.filter(reg => 
        reg.registerNumber &&
        reg.registerNumber.trim().toLowerCase() === formattedRegNum &&
        reg.status === "Registered"
    );

    const targetStart = parseTimeToMinutes(targetEvent.startTime || "09:00");
    const targetEnd = parseTimeToMinutes(targetEvent.endTime || "17:00");

    for (const reg of studentRegistrations) {
        const registeredEvent = getEventById(reg.eventId);
        if (!registeredEvent) continue;

        // Conflicts can only happen on the exact same date and different event IDs
        if (registeredEvent.id !== targetEvent.id && registeredEvent.date === targetEvent.date) {
            const regStart = parseTimeToMinutes(registeredEvent.startTime || "09:00");
            const regEnd = parseTimeToMinutes(registeredEvent.endTime || "17:00");

            // Overlap condition: targetStart < regEnd AND targetEnd > regStart
            if (targetStart < regEnd && targetEnd > regStart) {
                return {
                    hasConflict: true,
                    conflictEvent: registeredEvent
                };
            }
        }
    }

    return { hasConflict: false, conflictEvent: null };
}

/**
 * Checks whether a student is already actively registered for a specific event.
 * @param {string} registerNumber 
 * @param {string} eventId 
 * @returns {boolean} True if student already registered for this event
 */
function isDuplicateRegistration(registerNumber, eventId) {
    const formattedRegNum = registerNumber.trim().toLowerCase();
    return registrations.some(reg => 
        reg.registerNumber &&
        reg.registerNumber.trim().toLowerCase() === formattedRegNum && 
        reg.eventId === eventId &&
        reg.status === "Registered"
    );
}

/**
 * Generates a unique, non-duplicate Registration ID in format REG001, REG002...
 * @returns {string} Unique Registration ID
 */
function generateRegistrationId() {
    let maxIdNum = 0;
    
    registrations.forEach(reg => {
        if (reg.registrationId && reg.registrationId.startsWith("REG")) {
            const num = parseInt(reg.registrationId.replace("REG", ""), 10);
            if (!isNaN(num) && num > maxIdNum) {
                maxIdNum = num;
            }
        }
    });

    const nextNum = Math.max(registrations.length + 1, maxIdNum + 1);
    return `REG${String(nextNum).padStart(3, "0")}`;
}

/**
 * Clears all error messages and invalid styling from the registration form
 */
function clearFormErrors() {
    const errorElements = document.querySelectorAll(".field-error");
    errorElements.forEach(el => {
        el.textContent = "";
        el.style.display = "none";
    });

    const formAlert = document.getElementById("form-general-alert");
    if (formAlert) {
        formAlert.textContent = "";
        formAlert.style.display = "none";
    }

    const inputElements = document.querySelectorAll(".form-input");
    inputElements.forEach(input => {
        input.classList.remove("form-input--invalid");
    });
}

/**
 * Shows an error message for a specific input field
 * @param {string} fieldId - ID of the input field
 * @param {string} errorId - ID of the error message container
 * @param {string} message - Error message to display
 */
function showFieldError(fieldId, errorId, message) {
    const input = document.getElementById(fieldId);
    const errorEl = document.getElementById(errorId);

    if (input) {
        input.classList.add("form-input--invalid");
    }

    if (errorEl) {
        errorEl.textContent = message;
        errorEl.style.display = "block";
    }
}

/**
 * Sets general alert banner message in the modal
 * @param {string} message 
 */
function setGeneralAlert(message) {
    const formAlert = document.getElementById("form-general-alert");
    if (formAlert) {
        formAlert.textContent = message;
        formAlert.style.display = "block";
    }
}

/**
 * Validates registration form inputs in exact logical order:
 * 1. Form field validations
 * 2. Event existence check
 * 3. Event FULL check
 * 4. Duplicate registration check
 * 5. Smart Event Time-Conflict check
 * @returns {Object} { isValid: boolean, data: Object|null }
 */
function validateRegistrationForm() {
    clearFormErrors();

    const nameInput = document.getElementById("reg-student-name");
    const regNumInput = document.getElementById("reg-register-number");
    const emailInput = document.getElementById("reg-email");
    const phoneInput = document.getElementById("reg-phone");
    const eventIdInput = document.getElementById("reg-event-id");

    const name = nameInput ? nameInput.value.trim() : "";
    const registerNumber = regNumInput ? regNumInput.value.trim() : "";
    const email = emailInput ? emailInput.value.trim() : "";
    const phone = phoneInput ? phoneInput.value.trim() : "";
    const eventId = eventIdInput ? eventIdInput.value.trim() : "";

    let isValid = true;

    // 1. Field Validations
    if (!name) {
        showFieldError("reg-student-name", "error-student-name", "Please enter your name.");
        isValid = false;
    }

    if (!registerNumber) {
        showFieldError("reg-register-number", "error-register-number", "Please enter your register number.");
        isValid = false;
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) {
        showFieldError("reg-email", "error-email", "Please enter your email address.");
        isValid = false;
    } else if (!emailPattern.test(email)) {
        showFieldError("reg-email", "error-email", "Please enter a valid email address.");
        isValid = false;
    }

    const phonePattern = /^\d{10}$/;
    if (!phone) {
        showFieldError("reg-phone", "error-phone", "Please enter your phone number.");
        isValid = false;
    } else if (!phonePattern.test(phone)) {
        showFieldError("reg-phone", "error-phone", "Phone number must contain 10 digits.");
        isValid = false;
    }

    if (!isValid) {
        return { isValid: false, data: null };
    }

    // 2. Check Event Existence
    const targetEvent = getEventById(eventId);
    if (!targetEvent) {
        setGeneralAlert("Selected event was not found. Please refresh the page.");
        return { isValid: false, data: null };
    }

    // 3. Check Event FULL Status (Available Seats === 0)
    if (Number(targetEvent.availableSeats) <= 0) {
        setGeneralAlert("This event is currently FULL. Registration is closed.");
        return { isValid: false, data: null };
    }

    // 4. Check Duplicate Registration
    if (isDuplicateRegistration(registerNumber, eventId)) {
        setGeneralAlert("You are already registered for this event.");
        showFieldError("reg-register-number", "error-register-number", "Already registered for this event.");
        return { isValid: false, data: null };
    }

    // 5. Smart Event Time Conflict Detection (USP)
    const conflictResult = checkEventConflict(registerNumber, targetEvent);
    if (conflictResult.hasConflict && conflictResult.conflictEvent) {
        const cEvt = conflictResult.conflictEvent;
        const timeSpan = cEvt.timeDisplay || `${cEvt.startTime} to ${cEvt.endTime}`;
        const message = `Registration conflict: You are already registered for ${cEvt.name} from ${timeSpan}.`;
        setGeneralAlert(message);
        return { isValid: false, data: null };
    }

    return {
        isValid: true,
        data: {
            studentName: name,
            registerNumber: registerNumber,
            email: email,
            phone: phone,
            eventId: eventId,
            targetEvent: targetEvent
        }
    };
}

/**
 * Opens the registration modal with details of the selected event
 * @param {string} eventId - Unique ID of the event
 */
function openRegistrationModal(eventId) {
    const event = getEventById(eventId);
    if (!event) return;

    // Do not open if event is sold out
    if (Number(event.availableSeats) <= 0) {
        return;
    }

    // Populate event summary details in modal header
    const nameEl = document.getElementById("modal-event-name");
    const categoryEl = document.getElementById("modal-event-category");
    const dateEl = document.getElementById("modal-event-date");
    const venueEl = document.getElementById("modal-event-venue");
    const feeEl = document.getElementById("modal-event-fee");
    const seatsEl = document.getElementById("modal-event-seats");
    const eventIdInput = document.getElementById("reg-event-id");

    const timeText = event.timeDisplay || (event.startTime && event.endTime ? `${event.startTime} – ${event.endTime}` : "");

    if (nameEl) nameEl.textContent = event.name;
    if (categoryEl) {
        categoryEl.textContent = event.category;
        categoryEl.className = `category-badge category-${event.category.toLowerCase().replace(/\s+/g, "-")}`;
    }
    if (dateEl) dateEl.textContent = `${formatDate(event.date)}${timeText ? ` (${timeText})` : ''}`;
    if (venueEl) venueEl.textContent = event.venue;
    if (feeEl) feeEl.textContent = formatFee(event.registrationFee);
    if (seatsEl) seatsEl.textContent = `${event.availableSeats} seats available`;
    if (eventIdInput) eventIdInput.value = event.id;

    // Reset views: show form, hide success
    const formView = document.getElementById("registration-form-view");
    const successView = document.getElementById("registration-success-view");
    const form = document.getElementById("registration-form");

    if (formView) formView.style.display = "block";
    if (successView) successView.style.display = "none";
    if (form) form.reset();

    clearFormErrors();

    // Open modal
    const modal = document.getElementById("registration-modal");
    if (modal) {
        modal.classList.add("modal--open");
        modal.setAttribute("aria-hidden", "false");
        document.body.classList.add("modal-open-scroll-lock");
    }

    // Focus first input field for accessibility
    setTimeout(() => {
        const firstInput = document.getElementById("reg-student-name");
        if (firstInput) firstInput.focus();
    }, 100);
}

/**
 * Closes the registration modal and resets its state
 */
function closeRegistrationModal() {
    const modal = document.getElementById("registration-modal");
    if (modal) {
        modal.classList.remove("modal--open");
        modal.setAttribute("aria-hidden", "true");
        document.body.classList.remove("modal-open-scroll-lock");
    }

    const form = document.getElementById("registration-form");
    if (form) form.reset();
    clearFormErrors();
}

/**
 * Handles registration form submission with seat decrement and conflict validation.
 * @param {Event} e - Form submit event
 */
function submitRegistration(e) {
    e.preventDefault();

    // Perform checks in order
    const validation = validateRegistrationForm();
    if (!validation.isValid || !validation.data) {
        return;
    }

    const formData = validation.data;
    const targetEvent = formData.targetEvent || getEventById(formData.eventId);

    if (!targetEvent) {
        setGeneralAlert("Event not found.");
        return;
    }

    // Generate unique Registration ID
    const registrationId = generateRegistrationId();

    // Smart Seat Decrement (Decrease availableSeats by exactly 1)
    targetEvent.availableSeats = Math.max(0, Number(targetEvent.availableSeats) - 1);
    targetEvent.registeredCount = (Number(targetEvent.registeredCount) || 0) + 1;

    // Create registration record
    const newRegistration = {
        registrationId: registrationId,
        studentName: formData.studentName,
        registerNumber: formData.registerNumber,
        email: formData.email,
        phone: formData.phone,
        eventId: targetEvent.id,
        status: "Registered",
        registeredAt: new Date().toISOString()
    };

    // Save to active state and persist to LocalStorage
    registrations.push(newRegistration);
    saveEvents(events);
    saveRegistrations(registrations);

    // Immediately update UI without page reload
    applyEventFilters();
    updateStatisticsDisplay();
    renderMyRegistrations();

    // Populate success view in modal
    const formView = document.getElementById("registration-form-view");
    const successView = document.getElementById("registration-success-view");

    const successIdEl = document.getElementById("success-registration-id");
    const successNameEl = document.getElementById("success-student-name");
    const successEventEl = document.getElementById("success-event-name");
    const successRegNumEl = document.getElementById("success-register-number");

    if (successIdEl) successIdEl.textContent = registrationId;
    if (successNameEl) successNameEl.textContent = formData.studentName;
    if (successEventEl) successEventEl.textContent = targetEvent.name;
    if (successRegNumEl) successRegNumEl.textContent = formData.registerNumber;

    if (formView) formView.style.display = "none";
    if (successView) successView.style.display = "block";

    console.log(`Registration confirmed: ${registrationId}. Available seats for ${targetEvent.name} is now ${targetEvent.availableSeats}.`);
}

/**
 * Cancels a registration, restores available seats by 1, and saves to LocalStorage.
 * @param {string} registrationId 
 * @returns {boolean} True if cancellation succeeded
 */
function cancelRegistration(registrationId) {
    const reg = registrations.find(r => r.registrationId === registrationId);
    if (!reg || reg.status === "Cancelled") {
        return false;
    }

    reg.status = "Cancelled";

    // Restore available seats by 1
    const event = getEventById(reg.eventId);
    if (event) {
        event.availableSeats = Math.min(Number(event.totalSeats) || 999, Number(event.availableSeats) + 1);
        event.registeredCount = Math.max(0, (Number(event.registeredCount) || 1) - 1);
    }

    // Persist changes
    saveEvents(events);
    saveRegistrations(registrations);

    // Update UI across all sections immediately
    applyEventFilters();
    updateStatisticsDisplay();
    renderMyRegistrations();

    console.log(`Registration ${registrationId} cancelled. Seat restored for ${event ? event.name : 'event'}.`);
    return true;
}

/**
 * Renders all active student registrations into the My Registrations dashboard section.
 */
function renderMyRegistrations() {
    const container = document.getElementById("my-registrations-container");
    if (!container) return;

    // Filter to active registered passes
    const activeRegistrations = registrations.filter(r => r.status === "Registered");

    if (activeRegistrations.length === 0) {
        container.innerHTML = `
            <div class="no-registrations-state">
                <div class="no-events-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                        <polyline points="14 2 14 8 20 8"></polyline>
                        <line x1="16" y1="13" x2="8" y2="13"></line>
                        <line x1="16" y1="17" x2="8" y2="17"></line>
                        <polyline points="10 9 9 9 8 9"></polyline>
                    </svg>
                </div>
                <h3 class="no-events-title">No registrations yet</h3>
                <p class="no-events-subtitle">You haven't reserved a seat for any campus events yet.</p>
                <a href="#events" class="btn btn-primary" style="margin-top: 0.85rem;">Browse Available Events</a>
            </div>
        `;
        return;
    }

    const cardsHtml = activeRegistrations.map(reg => {
        const event = getEventById(reg.eventId);
        const eventName = event ? event.name : "Event " + reg.eventId;
        const category = event ? event.category : "Campus";
        const formattedDate = event ? formatDate(event.date) : "";
        const timeText = event ? (event.timeDisplay || (event.startTime && event.endTime ? `${event.startTime} – ${event.endTime}` : "")) : "";
        const venue = event ? event.venue : "Campus";
        const feeFormatted = event ? formatFee(event.registrationFee) : "₹0";
        const categoryClass = `category-${category.toLowerCase().replace(/\s+/g, "-")}`;

        return `
            <article class="registration-card" data-registration-id="${reg.registrationId}">
                <div class="registration-card-header">
                    <div class="reg-meta-left">
                        <span class="reg-id-badge">${reg.registrationId}</span>
                        <span class="category-badge ${categoryClass}">${category}</span>
                    </div>
                    <span class="status-badge status-badge-success">Registered</span>
                </div>

                <div class="registration-card-body">
                    <h3 class="registration-event-title">${eventName}</h3>
                    <div class="reg-student-info">
                        <span>Attendee: </span>
                        <strong>${reg.studentName}</strong>
                        <span>(${reg.registerNumber})</span>
                    </div>

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
                            <span>${venue}</span>
                        </div>
                    </div>
                </div>

                <div class="registration-card-footer">
                    <div class="event-pricing">
                        <span class="price-label">Fee Paid</span>
                        <span class="price-value">${feeFormatted}</span>
                    </div>

                    <button 
                        type="button" 
                        class="btn btn-cancel-reg" 
                        data-reg-id="${reg.registrationId}"
                    >
                        Cancel Registration
                    </button>
                </div>
            </article>
        `;
    }).join("");

    container.innerHTML = `<div class="registrations-grid">${cardsHtml}</div>`;
}

/**
 * Sets up all event listeners for the registration modal, form, and My Registrations
 */
function setupRegistrationListeners() {
    // 1. Delegate click on Register buttons in events grid
    const eventsGrid = document.getElementById("events-grid");
    if (eventsGrid) {
        eventsGrid.addEventListener("click", (e) => {
            const registerBtn = e.target.closest(".btn-register");
            if (registerBtn && !registerBtn.disabled) {
                const eventId = registerBtn.getAttribute("data-event-id");
                if (eventId) {
                    openRegistrationModal(eventId);
                }
            }
        });
    }

    // 2. Delegate click on Cancel Registration buttons in My Registrations
    const myRegContainer = document.getElementById("my-registrations-container");
    if (myRegContainer) {
        myRegContainer.addEventListener("click", (e) => {
            const cancelBtn = e.target.closest(".btn-cancel-reg");
            if (cancelBtn) {
                const regId = cancelBtn.getAttribute("data-reg-id");
                if (regId) {
                    cancelRegistration(regId);
                }
            }
        });
    }

    // 3. Close modal buttons
    const closeBtn = document.getElementById("modal-close-btn");
    const cancelBtn = document.getElementById("modal-cancel-btn");
    const doneBtn = document.getElementById("modal-done-btn");

    if (closeBtn) closeBtn.addEventListener("click", closeRegistrationModal);
    if (cancelBtn) cancelBtn.addEventListener("click", closeRegistrationModal);
    if (doneBtn) doneBtn.addEventListener("click", closeRegistrationModal);

    // 4. Click outside modal dialog to close
    const modal = document.getElementById("registration-modal");
    if (modal) {
        modal.addEventListener("click", (e) => {
            if (e.target === modal) {
                closeRegistrationModal();
            }
        });
    }

    // 5. Escape key press to close modal
    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape" && modal && modal.classList.contains("modal--open")) {
            closeRegistrationModal();
        }
    });

    // 6. Form submission
    const form = document.getElementById("registration-form");
    if (form) {
        form.addEventListener("submit", submitRegistration);
    }

    // 7. Clear individual field errors on typing
    const inputs = ["reg-student-name", "reg-register-number", "reg-email", "reg-phone"];
    inputs.forEach(id => {
        const input = document.getElementById(id);
        if (input) {
            input.addEventListener("input", () => {
                input.classList.remove("form-input--invalid");
                const errorEl = input.parentElement.querySelector(".field-error");
                if (errorEl) {
                    errorEl.textContent = "";
                    errorEl.style.display = "none";
                }
                const formAlert = document.getElementById("form-general-alert");
                if (formAlert) {
                    formAlert.textContent = "";
                    formAlert.style.display = "none";
                }
            });
        }
    });
}
