/**
 * JSON Utilities for HTML Attributes
 * 
 * Handles escaping and unescaping JSON strings for safe HTML attribute passing
 */

/**
 * Escapes JSON string for safe use in HTML attributes
 * @param {Object} data - The data object to escape
 * @returns {string} - Escaped JSON string safe for HTML attributes
 */
export function escapeJsonForAttribute(data) {
    try {
        const jsonString = JSON.stringify(data);
        return jsonString
            .replace(/\\/g, '\\\\')  // Escape backslashes first
            .replace(/"/g, '&quot;') // Escape double quotes
            .replace(/'/g, '&#39;')  // Escape single quotes
            .replace(/\n/g, '\\n')   // Escape newlines
            .replace(/\r/g, '\\r')   // Escape carriage returns
            .replace(/\t/g, '\\t');  // Escape tabs
    } catch (error) {
        console.error('Error escaping JSON:', error);
        return '{}';
    }
}

/**
 * Unescapes JSON string from HTML attributes
 * @param {string} escapedJson - The escaped JSON string from HTML attribute
 * @returns {Object|null} - Parsed JSON object or null if error
 */
export function unescapeJsonFromAttribute(escapedJson) {
    try {
        if (!escapedJson) return null;
        
        const unescaped = escapedJson
            .replace(/&quot;/g, '"')  // Unescape double quotes
            .replace(/&#39;/g, "'")   // Unescape single quotes
            .replace(/\\\\/g, '\\')   // Unescape backslashes
            .replace(/\\n/g, '\n')    // Unescape newlines
            .replace(/\\r/g, '\r')    // Unescape carriage returns
            .replace(/\\t/g, '\t');   // Unescape tabs
            
        return JSON.parse(unescaped);
    } catch (error) {
        console.error('Error unescaping JSON:', error);
        return null;
    }
}

/**
 * Safely sets data from HTML attributes
 * @param {HTMLElement} element - The element with attributes
 * @param {string} attributeName - The attribute name to read
 * @param {Function} setter - Function to set the parsed data
 */
export function setDataFromAttribute(element, attributeName, setter) {
    const attrValue = element.getAttribute(attributeName);
    if (attrValue) {
        const parsedData = unescapeJsonFromAttribute(attrValue);
        if (parsedData) {
            setter(parsedData);
        }
    }
} 