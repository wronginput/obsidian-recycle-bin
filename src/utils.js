/**
 * Recycle Bin Plugin - Utility Functions
 * 
 * @module utils
 */

'use strict';

/**
 * Format file size in human readable format
 * @param {number} bytes - Size in bytes
 * @returns {string} Formatted size
 */
function formatFileSize(bytes) {
    if (bytes === 0) return '0 B';
    if (!bytes || isNaN(bytes)) return '? B';

    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

/**
 * Format date relative to today
 * @param {number} timestamp - Unix timestamp in ms
 * @param {object} translations - Translation strings
 * @returns {string} Formatted date
 */
function formatDate(timestamp, translations = {}) {
    if (!timestamp) return translations.unknown || 'Unknown';

    const date = new Date(timestamp);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today.getTime() - 86400000);

    if (date >= today) {
        return translations.today || 'Today';
    } else if (date >= yesterday) {
        return translations.yesterday || 'Yesterday';
    } else {
        const days = Math.floor((today.getTime() - date.getTime()) / 86400000);
        return `${days} ${translations.daysAgo || 'days ago'}`;
    }
}

/**
 * Get file extension from path
 * @param {string} path - File path
 * @returns {string} Extension without dot
 */
function getExtension(path) {
    if (!path || typeof path !== 'string') return '';
    const parts = path.split('.');
    return parts.length > 1 ? parts.pop().toLowerCase() : '';
}

/**
 * Sanitize HTML to prevent XSS
 * @param {string} text - Raw text
 * @returns {string} Escaped HTML
 */
function escapeHtml(text) {
    if (!text || typeof text !== 'string') return '';
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
}

/**
 * Validate file path for safety
 * @param {string} path - File path to validate
 * @returns {boolean} True if path is safe
 */
function isValidPath(path) {
    if (!path || typeof path !== 'string') return false;

    // Block path traversal
    if (path.includes('..')) return false;

    // Block absolute paths outside vault
    if (path.startsWith('/') || path.startsWith('\\')) return false;

    // Block protocol handlers
    if (path.includes('://')) return false;

    return true;
}

/**
 * Debounce function calls
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in ms
 * @returns {Function} Debounced function
 */
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

module.exports = {
    formatFileSize,
    formatDate,
    getExtension,
    escapeHtml,
    isValidPath,
    debounce
};
