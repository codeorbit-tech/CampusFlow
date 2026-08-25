/**
 * CampusFlow — Shared utility functions
 * Used by admin.js. Kept separate so the student-side developer
 * can import independently when building their portal.
 */

/**
 * Escapes HTML special characters to prevent XSS.
 * @param {string} str
 * @returns {string}
 */
function escapeHTML(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

/**
 * Formats an ISO date string into a human-readable short date.
 * @param {string} dateStr
 * @returns {string}
 */
function formatDate(dateStr) {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

/**
 * Returns the CSS badge class for a given event category.
 * @param {string} category
 * @returns {string}
 */
function getCategoryBadgeClass(category) {
    switch ((category || '').toLowerCase()) {
        case 'technical':  return 'badge-tech';
        case 'workshop':   return 'badge-workshop';
        case 'cultural':   return 'badge-cultural';
        case 'sports':     return 'badge-sports';
        case 'conference': return 'badge-conference';
        default:           return 'badge-tech';
    }
}

/**
 * Displays a transient toast notification.
 * @param {string} message
 * @param {'success'|'danger'|'info'} type
 */
function showToast(message, type = 'info') {
    let container = document.querySelector('.toast-container');
    if (!container) {
        container = document.createElement('div');
        container.className = 'toast-container';
        document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;

    container.appendChild(toast);

    setTimeout(() => toast.remove(), 4000);
}
