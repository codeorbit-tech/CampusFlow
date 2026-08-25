/**
 * CampusFlow - Validation Module
 * Standard form validation routines for both Student and Admin sides.
 */

function validateName(name) {
    if (!name || name.trim().length < 2) {
        return { isValid: false, message: "Name must be at least 2 characters long." };
    }
    return { isValid: true };
}

function validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email.trim())) {
        return { isValid: false, message: "Please enter a valid email address." };
    }
    return { isValid: true };
}

function validatePhone(phone) {
    const phoneRegex = /^[0-9]{10}$/;
    if (!phone || !phoneRegex.test(phone.trim())) {
        return { isValid: false, message: "Phone number must be exactly 10 digits." };
    }
    return { isValid: true };
}

function validateRegisterNumber(regNo) {
    if (!regNo || regNo.trim().length < 3) {
        return { isValid: false, message: "Register Number is required." };
    }
    return { isValid: true };
}

/**
 * Validates student registration attempt.
 */
function validateRegistration(formData, events, registrations) {
    const nameCheck = validateName(formData.studentName);
    if (!nameCheck.isValid) return nameCheck;

    const regNoCheck = validateRegisterNumber(formData.registerNumber);
    if (!regNoCheck.isValid) return regNoCheck;

    const emailCheck = validateEmail(formData.email);
    if (!emailCheck.isValid) return emailCheck;

    const phoneCheck = validatePhone(formData.phone);
    if (!phoneCheck.isValid) return phoneCheck;

    // Check if event exists
    const targetEvent = events.find(e => e.id === formData.eventId);
    if (!targetEvent) {
        return { isValid: false, message: "Selected event does not exist." };
    }

    // Check if event is full
    if (targetEvent.availableSeats <= 0) {
        return { isValid: false, message: "Sorry, this event is already full!" };
    }

    // Check if student is already registered for this event
    const alreadyRegistered = registrations.some(
        r => r.eventId === formData.eventId &&
             r.registerNumber.toLowerCase() === formData.registerNumber.trim().toLowerCase() &&
             r.status === 'Registered'
    );
    if (alreadyRegistered) {
        return { isValid: false, message: "You are already registered for this event." };
    }

    return { isValid: true };
}

/**
 * Validates admin Event Form (Add / Edit)
 */
function validateEventForm(eventData) {
    if (!eventData.name || eventData.name.trim().length < 3) {
        return { isValid: false, message: "Event name must be at least 3 characters long." };
    }

    if (!eventData.category) {
        return { isValid: false, message: "Please select an event category." };
    }

    if (!eventData.date) {
        return { isValid: false, message: "Event date is required." };
    }

    if (!eventData.venue || eventData.venue.trim().length < 2) {
        return { isValid: false, message: "Venue is required." };
    }

    if (isNaN(eventData.registrationFee) || Number(eventData.registrationFee) < 0) {
        return { isValid: false, message: "Registration fee must be 0 or a positive amount." };
    }

    if (isNaN(eventData.totalSeats) || Number(eventData.totalSeats) <= 0) {
        return { isValid: false, message: "Total seats must be a number greater than 0." };
    }

    return { isValid: true };
}
