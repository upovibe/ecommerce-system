/**
 * Table Component
 * 
 * A comprehensive table component with sorting, pagination, selection, search, and responsive design.
 * Supports various data formats, customizable columns, and accessibility features.
 * 
 * Attributes:
 * - data: string - JSON string of table data (default: '[]')
 * - columns: string - JSON string of column definitions (default: '[]')
 * - title: string - Table title (default: 'Table')
 * - sortable: boolean - Enable column sorting (default: true)
 * - selectable: boolean - Enable row selection (default: false)
 * - pagination: boolean - Enable pagination (default: false)
 * - page-size: number - Number of rows per page (default: 10)
 * - striped: boolean - Enable striped rows (default: false)
 * - bordered: boolean - Enable table borders (default: false)
 * - compact: boolean - Enable compact mode (default: false)
 * - searchable: boolean - Enable search functionality (default: false)
 * - search-placeholder: string - Placeholder text for search input (default: 'Search...')
 * - refresh: boolean - Enable refresh button (default: false)
 * - print: boolean - Enable print button (default: false)
 * 
 * Events:
 * - table-sort: Fired when column is sorted (detail: { column: string, direction: string })
 * - table-select: Fired when row is selected (detail: { row: object, selected: boolean })
 * - table-page-change: Fired when page changes (detail: { page: number })
 * - table-search: Fired when search query changes (detail: { query: string, results: number })
 * - table-refresh: Fired when refresh button is clicked
 * 
 * Usage:
 * <ui-table data='[{"id":1,"name":"John","age":25}]' columns='[{"key":"name","label":"Name"}]'></ui-table>
 * <ui-table sortable="true" selectable="true" pagination="true" page-size="5" searchable="true"></ui-table>
 * 
 * Accessibility:
 * - Proper table semantics with thead, tbody, th, td
 * - ARIA attributes for sorting and selection
 * - Keyboard navigation support
 * - Screen reader friendly
 */
class Table extends HTMLElement {
    static get observedAttributes() {
        return ['data', 'columns', 'title', 'sortable', 'selectable', 'pagination', 'page-size', 'striped', 'bordered', 'compact', 'searchable', 'search-placeholder', 'clickable', 'filterable', 'addable', 'action', 'actions', 'custom-actions', 'refresh', 'print'];
    }

    constructor() {
        super();
        
        // Initialize with attribute values if they exist
        this.data = this.parseJSONAttribute('data', []);
        this.columns = this.parseJSONAttribute('columns', []);
        this.title = this.getAttribute('title') || 'Table';
        this.sortable = this.hasAttribute('sortable');
        this.selectable = this.hasAttribute('selectable');
        this.pagination = this.hasAttribute('pagination');
        this.pageSize = parseInt(this.getAttribute('page-size')) || 10;
        this.striped = this.hasAttribute('striped');
        this.bordered = this.hasAttribute('bordered');
        this.compact = this.hasAttribute('compact');
        this.searchable = this.hasAttribute('searchable');
        this.searchPlaceholder = this.getAttribute('search-placeholder') || 'Search...';
        this.clickable = this.hasAttribute('clickable');
        this.filterable = this.hasAttribute('filterable');
        this.addable = this.hasAttribute('addable');
        this.action = this.hasAttribute('action');
        this.refresh = this.hasAttribute('refresh');
        this.print = this.hasAttribute('print');
        this.actions = (this.getAttribute('actions') || '').split(',').map(a => a.trim()).filter(Boolean);
        this.customActions = this.parseJSONAttribute('custom-actions', []);
        
        // Internal state
        this.currentPage = 1;
        this.sortColumn = null;
        this.sortDirection = 'asc';
        this.selectedRows = new Set();
        this.searchQuery = '';
        this.filterValue = '';
        this.filteredData = [...this.data];
        
        // Flag to prevent attributeChangedCallback from interfering
        this.isUpdating = false;
        
        // Add default styles
        this.addDefaultStyles();
    }

    /**
     * Parse JSON attribute safely with data cleaning
     * @param {string} attrName - The attribute name
     * @param {any} defaultValue - Default value if parsing fails
     * @returns {any} Parsed value or default
     */
    parseJSONAttribute(attrName, defaultValue) {
        const value = this.getAttribute(attrName);
        if (!value) return defaultValue;
        
        
        try {
            // First try to parse as-is
            return JSON.parse(value);
        } catch (e) {
            console.warn(`Failed to parse ${attrName} attribute, attempting to clean data:`, e);
            console.log(`🔍 Error at position:`, e.message);
            
            try {
                // Try to clean the JSON string and parse again
                const cleanedValue = this.cleanJSONString(value);
                console.log(`🔍 Cleaned value length:`, cleanedValue.length);
                console.log(`🔍 Cleaned first 200 chars:`, cleanedValue.substring(0, 200));
                return JSON.parse(cleanedValue);
            } catch (e2) {
                console.error(`Failed to parse ${attrName} attribute even after cleaning:`, e2);
                console.log(`🔍 Final cleaned value:`, this.cleanJSONString(value));
                return defaultValue;
            }
        }
    }

    /**
     * Clean JSON string to fix common parsing issues
     * @param {string} jsonString - The JSON string to clean
     * @returns {string} Cleaned JSON string
     */
    cleanJSONString(jsonString) {
        if (typeof jsonString !== 'string') return jsonString;
        
        let cleaned = jsonString
            // Fix common HTML entity issues
            .replace(/&quot;/g, '"')
            .replace(/&#39;/g, "'")
            .replace(/&amp;/g, '&')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            // Handle escaped characters from escapeJsonForAttribute
            .replace(/\\\\/g, '\\')
            .replace(/\\n/g, '\n')
            .replace(/\\r/g, '\r')
            .replace(/\\t/g, '\t')
            // Remove any remaining problematic characters
            .replace(/[\x00-\x1F\x7F-\x9F]/g, '')
            // Fix any malformed quotes or commas
            .replace(/,(\s*[}\]])/g, '$1') // Remove trailing commas
            .replace(/([{\[])\s*,/g, '$1') // Remove leading commas
            .trim();
        
        // Handle unterminated strings by finding the last complete object/array
        if (cleaned.includes('[') && !cleaned.endsWith(']')) {
            // Find the last complete array element
            const lastCompleteBracket = cleaned.lastIndexOf(']');
            if (lastCompleteBracket > 0) {
                cleaned = cleaned.substring(0, lastCompleteBracket + 1);
            } else {
                // If no complete array found, try to close it
                cleaned = cleaned + ']';
            }
        }
        
        if (cleaned.includes('{') && !cleaned.endsWith('}')) {
            // Find the last complete object
            const lastCompleteBrace = cleaned.lastIndexOf('}');
            if (lastCompleteBrace > 0) {
                cleaned = cleaned.substring(0, lastCompleteBrace + 1);
            } else {
                // If no complete object found, try to close it
                cleaned = cleaned + '}';
            }
        }
        
        return cleaned;
    }

    /**
     * Escape HTML to prevent XSS attacks
     * @param {string} text - The text to escape
     * @returns {string} Escaped HTML
     */
    escapeHtml(text) {
        if (typeof text !== 'string') return text;
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * Add default CSS styles to document if not already added
     * Creates a unique style element with all table styles
     */
    addDefaultStyles() {
        if (!document.getElementById('upo-ui-table-styles')) {
            const style = document.createElement('style');
            style.id = 'upo-ui-table-styles';
            style.textContent = `
                .upo-table {
                    width: 100%;
                    border-collapse: collapse;
                    font-size: 0.875rem;
                    line-height: 1.25;
                }
                
                .upo-table-bordered {
                    border: 1px solid #e5e7eb;
                }
                
                .upo-table-bordered th,
                .upo-table-bordered td {
                    border: 1px solid #e5e7eb;
                }
                
                .upo-table th {
                    background-color: #f9fafb;
                    font-weight: 600;
                    text-align: left;
                    padding: 0.75rem;
                    color: #374151;
                    border-bottom: 1px solid #e5e7eb;
                    white-space: nowrap;
                }
                
                .upo-table td {
                    padding: 0.75rem;
                    border-bottom: 1px solid #e5e7eb;
                    color: #111827;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    max-width: 200px;
                }
                
                .upo-table-compact th,
                .upo-table-compact td {
                    padding: 0.5rem;
                }
                
                .upo-table-compact td {
                    max-width: 150px;
                }
                
                .upo-table-striped tbody tr:nth-child(even) {
                    background-color: #f9fafb;
                }
                
                .upo-table tbody tr:hover {
                    background-color: #f3f4f6;
                }
                
                .upo-table-clickable tbody tr {
                    cursor: pointer;
                    transition: background-color 0.15s ease-in-out;
                }
                
                .upo-table-clickable tbody tr:hover {
                    background-color: #e5f3ff;
                }
                
                .upo-table-clickable tbody tr:active {
                    background-color: #b3d9ff;
                }
                
                .upo-table-sortable th {
                    cursor: pointer;
                    user-select: none;
                }
                
                .upo-table-sortable th:hover {
                    background-color: #f3f4f6;
                }
                
                .upo-table-sortable th::after {
                    content: '';
                    margin-left: 0.5rem;
                    opacity: 0.5;
                    display: inline-block;
                    width: 16px;
                    height: 16px;
                    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%236b7280' stroke-width='2'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' d='M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4'/%3E%3C/svg%3E");
                    background-size: contain;
                    background-repeat: no-repeat;
                    background-position: center;
                }
                
                .upo-table-sortable th.upo-sort-asc::after {
                    content: '';
                    opacity: 1;
                    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%233b82f6' stroke-width='2'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' d='M5 15l7-7 7 7'/%3E%3C/svg%3E");
                }
                
                .upo-table-sortable th.upo-sort-desc::after {
                    content: '';
                    opacity: 1;
                    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%233b82f6' stroke-width='2'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' d='M19 9l-7 7-7-7'/%3E%3C/svg%3E");
                }
                
                .upo-table-selectable tbody tr {
                    cursor: pointer;
                }
                
                .upo-table-selectable tbody tr.selected {
                    background-color: #dbeafe;
                }
                
                .upo-table-selectable tbody tr.selected:hover {
                    background-color: #bfdbfe;
                }
                
                .upo-table-action-column {
                    position: sticky;
                    right: 0;
                    background-color: #ffffff;
                    z-index: 10;
                    border-left: 2px solid #e5e7eb;
                    max-width: 120px;
                    width: 120px;
                }
                
                .upo-table-action-buttons {
                    display: flex;
                    gap: 0.25rem;
                    justify-content: start;
                    align-items: center;
                }
                
                .upo-table-action-button {
                    padding: 0.25rem;
                    border: none;
                    background: none;
                    color: #6b7280;
                    border-radius: 0.25rem;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    transition: all 0.15s ease-in-out;
                    font-size: 0.75rem;
                }
                
                .upo-table-action-button:hover {
                    background-color: #f3f4f6;
                }
                
                .upo-table-action-button.view:hover {
                    color: #3b82f6;
                }
                
                .upo-table-action-button.edit:hover {
                    color: #f59e0b;
                }
                
                .upo-table-action-button.delete:hover {
                    color: #ef4444;
                }

                .upo-table-action-button.custom {
                    background-color: #f3f4f6;
                    color: #374151;
                }

                .upo-table-action-button.custom:hover {
                    background-color: #e5e7eb;
                    color: #111827;
                }
                
                .upo-table-checkbox {
                    width: 1rem;
                    height: 1rem;
                    margin: 0;
                    cursor: pointer;
                    accent-color: #3b82f6;
                    border: 2px solid #d1d5db;
                    border-radius: 0.25rem;
                    transition: all 0.15s ease-in-out;
                    appearance: none;
                    -webkit-appearance: none;
                    -moz-appearance: none;
                    position: relative;
                    background-color: white;
                }
                
                .upo-table-checkbox:checked {
                    background-color: #3b82f6;
                    border-color: #3b82f6;
                }
                
                .upo-table-checkbox:checked::after {
                    content: '';
                    position: absolute;
                    left: 50%;
                    top: 50%;
                    transform: translate(-50%, -50%);
                    width: 0.25rem;
                    height: 0.5rem;
                    border: 2px solid white;
                    border-top: none;
                    border-left: none;
                    transform: translate(-50%, -60%) rotate(45deg);
                }
                
                .upo-table-checkbox:focus {
                    outline: 2px solid #3b82f6;
                    outline-offset: 2px;
                }
                
                .upo-table-checkbox:hover {
                    border-color: #3b82f6;
                }
                
                .upo-table-container {
                    border-radius:0.375rem 0.375rem 0 0;
                    border: 1px solid #e5e7eb;
                    border-bottom: none;
                }
                
                .upo-table-scroll-container {
                    overflow-x: auto;
                    overflow-y: auto;
                    -webkit-overflow-scrolling: touch;
                }

                .upo-table-scroll-container::-webkit-scrollbar {
                    width: 8px;
                    height: 8px;
                }

                .upo-table-scroll-container::-webkit-scrollbar-track {
                    background: transparent;
                }

                .upo-table-scroll-container::-webkit-scrollbar-thumb {
                    background: linear-gradient(45deg, #00c6ff, #0072ff);
                    border-radius: 10px;
                    border: 1px solid rgba(255, 255, 255, 0.2);
                    box-shadow: 0 0 10px rgba(0, 198, 255, 0.7);
                }

                .upo-table-scroll-container::-webkit-scrollbar-thumb:hover {
                    background: linear-gradient(45deg, #00eaff, #008cff);
                    box-shadow: 0 0 15px rgba(0, 234, 255, 1);
                }

                .upo-table-scroll-container::-webkit-scrollbar-button {
                    display: none;
                }

                .upo-table-scroll-container {
                    scrollbar-width: thin;
                    scrollbar-color: #00c6ff transparent;
                }
                
                .upo-table-header {
                    padding: 1rem 1rem 0.5rem 1rem;
                    background-color: #f9fafb;
                    border-bottom: 1px solid #e5e7eb;

                }
                
                .upo-table-title {
                    font-size: 1.125rem;
                    font-weight: 600;
                    color: #111827;
                    margin-bottom: 0.5rem;
                }
                
                .upo-table-count {
                    font-size: 0.875rem;
                    color: #6b7280;
                }
                
                .upo-table-controls-row {
                    display: flex;
                    flex-direction: row;
                    justify-content: space-between;
                    align-items: flex-start;
                    gap: 0.75rem;
                }
                
                .upo-table-controls-left {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    width: auto;
                }
                
                .upo-table-controls-right {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    justify-content: flex-end;
                }
                
                /* Responsive layout - switch to vertical on small screens */
                @media (max-width: 640px) {
                    .upo-table-controls-row {
                        gap: 0.75rem;
                    }
                    
                    .upo-table-controls-left {
                        // flex-direction: column;
                        align-items: stretch;
                        width: 100%;
                    }
                    
                    .upo-table-search-input {
                        width: 100%;
                    }
                    
                    .upo-table-filter-select {
                        width: 100%;
                    }
                    
                    .upo-table-pagination {
                        flex-direction: column;
                        gap: 1rem;
                    }
                    
                    .upo-table-pagination-left {
                        flex-direction: column;
                        align-items: flex-start;
                        gap: 0.75rem;
                    }
                }
                
                .upo-table-search {
                    position: relative;
                    display: flex;
                    align-items: center;
                }
                
                .upo-table-search-input {
                    padding: 0.5rem 0.75rem 0.5rem 2.5rem;
                    font-size: 0.875rem;
                    border: 1px solid #d1d5db;
                    border-radius: 0.375rem;
                    outline: none;
                    transition: all 0.15s ease-in-out;
                    width: 100%;
                }
                
                .upo-table-search-input:focus {
                    border-color: #3b82f6;
                    box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
                }
                
                .upo-table-search-icon {
                    position: absolute;
                    left: 0.75rem;
                    color: #6b7280;
                    pointer-events: none;
                }
                
                .upo-table-search-clear {
                    position: absolute;
                    right: 2.2rem;
                    padding: 0.25rem;
                    font-size: 0.875rem;
                    color: #6b7280;
                    background-color: transparent;
                    border: none;
                    cursor: pointer;
                    border-radius: 0.25rem;
                    transition: all 0.15s ease-in-out;
                }
                
                .upo-table-search-clear:hover {
                    background-color: #f3f4f6;
                    color: #374151;
                }
                
                .upo-table-refresh {
                    padding: 0.5rem;
                    border: none;
                    background: none;
                    color: #6b7280;
                    border-radius: 0.375rem;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    transition: background 0.15s;
                }
                
                .upo-table-refresh:hover {
                    background-color: #f3f4f6;
                    color: #2563eb;
                }
                
                .upo-table-filter {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                }
                
                .upo-table-filter-select {
                    padding: 0.5rem 0.75rem;
                    font-size: 0.875rem;
                    border: 1px solid #d1d5db;
                    border-radius: 0.375rem;
                    outline: none;
                    background-color: #ffffff;
                    color: #374151;
                    cursor: pointer;
                    transition: all 0.15s ease-in-out;
                    width: 100%;
                }
                
                .upo-table-filter-select:focus {
                    border-color: #3b82f6;
                    box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
                }
                
                .upo-table-filter-select:hover {
                    border-color: #9ca3af;
                }
                
                .upo-table-print {
                    padding: 0.5rem;
                    border: none;
                    background: none;
                    color: #6b7280;
                    border-radius: 0.375rem;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    transition: background 0.15s;
                }
                
                .upo-table-print:hover {
                    background-color: #f3f4f6;
                    color: #2563eb;
                }
                
                .upo-table-add {
                    padding: 0.5rem;
                    border: none;
                    background: none;
                    color: #6b7280;
                    border-radius: 0.375rem;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    transition: background 0.15s;
                }
                
                .upo-table-add:hover {
                    background-color: #f3f4f6;
                    color: #10b981;
                }
                
                .upo-table-pagination {
                    display: flex;
                    flex-direction: col;
                    justify-content: space-between;
                    align-items: center;
                    gap: 1rem;
                    padding: 1rem;
                    background-color: #f9fafb;
                    border-top: 1px solid #e5e7eb;
                }
                
                .upo-table-pagination-left {
                    display: flex;
                    align-items: center;
                    gap: 1rem;
                }
                
                .upo-table-page-size {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    font-size: 0.875rem;
                    color: #6b7280;
                }
                
                .upo-table-page-size-input {
                    padding: 0.25rem 0.5rem;
                    font-size: 0.875rem;
                    border: 1px solid #d1d5db;
                    border-radius: 0.375rem;
                    outline: none;
                    background-color: #ffffff;
                    color: #374151;
                    width: 60px;
                    text-align: center;
                    transition: all 0.15s ease-in-out;
                }
                
                .upo-table-page-size-input:focus {
                    border-color: #3b82f6;
                    box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
                }
                
                .upo-table-page-size-input:hover {
                    border-color: #9ca3af;
                }
                
                .upo-table-pagination-info {
                    font-size: 0.875rem;
                    color: #6b7280;
                }
                
                .upo-table-pagination-controls {
                    display: flex;
                    gap: 0.25rem;
                }
                
                .upo-table-pagination-button {
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    min-width: 2rem;
                    height: 2rem;
                    padding: 0 0.5rem;
                    border: 1px solid #d1d5db;
                    background: white;
                    color: #374151;
                    text-decoration: none;
                    border-radius: 0.375rem;
                    font-size: 0.75rem;
                    font-weight: 500;
                    cursor: pointer;
                    transition: all 0.15s ease-in-out;
                    user-select: none;
                }
                
                .upo-table-pagination-button:hover:not(:disabled) {
                    background-color: #f9fafb;
                    border-color: #9ca3af;
                    color: #111827;
                }
                
                .upo-table-pagination-button.active {
                    background-color: #3b82f6;
                    border-color: #3b82f6;
                    color: white;
                }
                
                .upo-table-pagination-button.active:hover {
                    background-color: #2563eb;
                    border-color: #2563eb;
                }
                
                .upo-table-pagination-button:disabled {
                    opacity: 0.5;
                    cursor: not-allowed;
                    background-color: #f3f4f6;
                    color: #9ca3af;
                }
                
                .upo-table-pagination-button:disabled:hover {
                    background-color: #f3f4f6;
                    border-color: #d1d5db;
                    color: #9ca3af;
                }
                
                /* Ellipsis styling */
                .upo-table-pagination-ellipsis {
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    min-width: 2rem;
                    height: 2rem;
                    padding: 0 0.5rem;
                    color: #6b7280;
                    font-size: 0.75rem;
                    user-select: none;
                }
                
                .upo-table-pagination-button:disabled {
                    opacity: 0.5;
                    cursor: not-allowed;
                }
                
                .upo-table-pagination-button.active {
                    background-color: #3b82f6;
                    border-color: #3b82f6;
                    color: #ffffff;
                }
                
                .upo-table-empty {
                    text-align: center;
                    padding: 2rem;
                    color: #6b7280;
                    font-style: italic;
                }
            `;
            document.head.appendChild(style);
        }
    }

    /**
     * Called when the element is connected to the DOM
     * Sets up event listeners and initial state
     */
    connectedCallback() {
        this.render();
    }

    /**
     * Called when attributes are changed
     * Updates the component state and re-renders
     * @param {string} name - The name of the changed attribute
     * @param {string} oldValue - The previous value
     * @param {string} newValue - The new value
     */
    attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue !== newValue && !this.isUpdating) {
            if (name === 'data' || name === 'columns') {
                this[name] = this.parseJSONAttribute(name, name === 'data' ? [] : []);
                this.filteredData = [...this.data];
            } else if (name === 'sortable' || name === 'selectable' || name === 'pagination' || name === 'striped' || name === 'bordered' || name === 'compact' || name === 'searchable' || name === 'clickable' || name === 'filterable' || name === 'addable' || name === 'action' || name === 'refresh' || name === 'print') {
                this[name] = this.hasAttribute(name);
            } else if (name === 'actions') {
                this.actions = (newValue || '').split(',').map(a => a.trim()).filter(Boolean);
            } else if (name === 'custom-actions') {
                this.customActions = this.parseJSONAttribute('custom-actions', []);
            } else if (name === 'page-size') {
                this.pageSize = parseInt(newValue) || 10;
            } else if (name === 'search-placeholder') {
                this.searchPlaceholder = newValue || 'Search...';
            } else if (name === 'title') {
                this.title = newValue || 'Table';
            }
            this.render();
        }
    }

    /**
     * Sort the table data
     * @param {string} column - The column to sort by
     */
    sort(column) {
        if (!this.sortable) return;

        if (this.sortColumn === column) {
            this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
        } else {
            this.sortColumn = column;
            this.sortDirection = 'asc';
        }

        // Sort the data that's currently being displayed
        const dataToSort = (this.searchable && this.filteredData.length > 0) ? this.filteredData : this.data;
        
        dataToSort.sort((a, b) => {
            const aVal = a[column];
            const bVal = b[column];
            
            if (aVal === bVal) return 0;
            
            const comparison = aVal < bVal ? -1 : 1;
            return this.sortDirection === 'asc' ? comparison : -comparison;
        });

        this.render();
        this.dispatchEvent(new CustomEvent('table-sort', {
            detail: { column, direction: this.sortDirection },
            bubbles: true
        }));
    }

    /**
     * Toggle row selection
     * @param {number} rowIndex - The index of the row to toggle
     */
    toggleRowSelection(rowIndex) {
        if (!this.selectable) return;

        const row = this.getVisibleData()[rowIndex];
        if (!row) return;

        if (this.selectedRows.has(row)) {
            this.selectedRows.delete(row);
        } else {
            this.selectedRows.add(row);
        }

        this.render();
        this.dispatchEvent(new CustomEvent('table-select', {
            detail: { row, selected: this.selectedRows.has(row) },
            bubbles: true
        }));
    }

    /**
     * Select all rows
     */
    selectAll() {
        if (!this.selectable) return;

        const visibleData = this.getVisibleData();
        visibleData.forEach(row => this.selectedRows.add(row));
        this.render();
        
        this.dispatchEvent(new CustomEvent('table-select', {
            detail: { row: null, selected: true, all: true },
            bubbles: true
        }));
    }

    /**
     * Deselect all rows
     */
    deselectAll() {
        if (!this.selectable) return;

        this.selectedRows.clear();
        this.render();
        
        this.dispatchEvent(new CustomEvent('table-select', {
            detail: { row: null, selected: false, all: true },
            bubbles: true
        }));
    }

    /**
     * Check if all visible rows are selected
     * @returns {boolean} True if all visible rows are selected
     */
    areAllVisibleRowsSelected() {
        if (!this.selectable) return false;
        
        const visibleData = this.getVisibleData();
        if (visibleData.length === 0) return false;
        
        return visibleData.every(row => this.selectedRows.has(row));
    }

    /**
     * Refresh table data
     */
    resetTable() {
        // Reset search and filters
        this.searchQuery = '';
        this.filterValue = '';
        this.filteredData = [...this.data];
        this.currentPage = 1;
        this.sortColumn = null;
        this.sortDirection = 'asc';
        this.selectedRows.clear();
        
        // Clear the search input
        const searchInput = this.querySelector('.upo-table-search-input');
        if (searchInput) {
            searchInput.value = '';
        }
        
        // Clear the filter dropdown
        const filterSelect = this.querySelector('.upo-table-filter-select');
        if (filterSelect) {
            filterSelect.value = '';
        }
        
        // Re-render the table
        this.render();
        
        // Dispatch refresh event
        this.dispatchEvent(new CustomEvent('table-refresh', {
            detail: { timestamp: Date.now() },
            bubbles: true
        }));
    }

    /**
     * Add new item
     */
    add() {
        this.dispatchEvent(new CustomEvent('table-add', {
            detail: { timestamp: Date.now() },
            bubbles: true
        }));
    }

    /**
     * View row action
     * @param {number} rowIndex - The index of the row
     */
    viewRow(rowIndex) {
        const row = this.getVisibleData()[rowIndex];
        if (row) {
            this.dispatchEvent(new CustomEvent('table-view', {
                detail: { row, rowIndex },
                bubbles: true
            }));
        }
    }

    /**
     * Edit row action
     * @param {number} rowIndex - The index of the row
     */
    editRow(rowIndex) {
        const row = this.getVisibleData()[rowIndex];
        if (row) {
            this.dispatchEvent(new CustomEvent('table-edit', {
                detail: { row, rowIndex },
                bubbles: true
            }));
        }
    }

    /**
     * Delete row action
     * @param {number} rowIndex - The index of the row
     */
    deleteRow(rowIndex) {
        const row = this.getVisibleData()[rowIndex];
        if (row) {
            this.dispatchEvent(new CustomEvent('table-delete', {
                detail: { row, rowIndex },
                bubbles: true
            }));
        }
    }

    /**
     * Custom action handler
     * @param {number} rowIndex - The index of the row
     * @param {string} actionName - The name of the custom action
     */
    customAction(rowIndex, actionName) {
        const row = this.getVisibleData()[rowIndex];
        if (row) {
            this.dispatchEvent(new CustomEvent('table-custom-action', {
                detail: { row, rowIndex, actionName },
                bubbles: true
            }));
        }
    }

    /**
     * Print table data
     */
    printTable() {
        try {
            // Create a print-friendly version of the table
            const printWindow = window.open('', '_blank', 'width=800,height=600,scrollbars=yes,resizable=yes');
            
            if (!printWindow) {
                // Fallback for Edge and other browsers with strict popup blockers
                this.printFallback();
                return;
            }
            
            const dataToUse = this.searchable ? this.filteredData : this.data;
            const visibleData = this.getVisibleData();
            
            const printHTML = `
                <!DOCTYPE html>
                <html>
                <head>
                    <title>${this.title} - Print</title>
                    <style>
                        body { font-family: Arial, sans-serif; margin: 20px; }
                        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                        th { background-color: #f2f2f2; font-weight: bold; }
                        .print-header { text-align: center; margin-bottom: 20px; }
                        .print-title { font-size: 24px; font-weight: bold; margin-bottom: 10px; }
                        .print-info { font-size: 14px; color: #666; }
                        @media print {
                            body { margin: 0; }
                            .no-print { display: none; }
                        }
                    </style>
                </head>
                <body>
                    <div class="print-header">
                        <div class="print-title">${this.title}</div>
                        <div class="print-info">
                            Printed on: ${new Date().toLocaleString()}<br>
                            Total Records: ${dataToUse.length}
                            ${this.searchable && this.searchQuery ? `<br>Filtered by: "${this.searchQuery}"` : ''}
                        </div>
                    </div>
                    <table>
                        <thead>
                            <tr>
                                ${this.columns.map(col => `<th>${col.label || col.key}</th>`).join('')}
                            </tr>
                        </thead>
                        <tbody>
                            ${visibleData.map(row => `
                                <tr>
                                    ${this.columns.map(col => `<td>${row[col.key] || ''}</td>`).join('')}
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                    <script>
                        // Auto-print when page loads
                        window.onload = function() {
                            setTimeout(function() {
                                window.print();
                                window.close();
                            }, 100);
                        };
                    </script>
                </body>
                </html>
            `;
            
            printWindow.document.write(printHTML);
            printWindow.document.close();
            
        } catch (error) {
            console.warn('Print window failed, using fallback:', error);
            this.printFallback();
        }
        
        this.dispatchEvent(new CustomEvent('table-print', {
            detail: { timestamp: Date.now() },
            bubbles: true
        }));
    }

    /**
     * Fallback print method for Edge and other browsers
     */
    printFallback() {
        // Create a temporary div with the table content
        const tempDiv = document.createElement('div');
        tempDiv.style.position = 'absolute';
        tempDiv.style.left = '-9999px';
        tempDiv.style.top = '0';
        
        const dataToUse = this.searchable ? this.filteredData : this.data;
        const visibleData = this.getVisibleData();
        
        tempDiv.innerHTML = `
            <div style="font-family: Arial, sans-serif; margin: 20px;">
                <div style="text-align: center; margin-bottom: 20px;">
                    <div style="font-size: 24px; font-weight: bold; margin-bottom: 10px;">${this.title}</div>
                    <div style="font-size: 14px; color: #666;">
                        Printed on: ${new Date().toLocaleString()}<br>
                        Total Records: ${dataToUse.length}
                        ${this.searchable && this.searchQuery ? `<br>Filtered by: "${this.searchQuery}"` : ''}
                    </div>
                </div>
                <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
                    <thead>
                        <tr>
                            ${this.columns.map(col => `<th style="border: 1px solid #ddd; padding: 8px; text-align: left; background-color: #f2f2f2; font-weight: bold;">${col.label || col.key}</th>`).join('')}
                        </tr>
                    </thead>
                    <tbody>
                        ${visibleData.map(row => `
                            <tr>
                                ${this.columns.map(col => `<td style="border: 1px solid #ddd; padding: 8px; text-align: left;">${row[col.key] || ''}</td>`).join('')}
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
        
        document.body.appendChild(tempDiv);
        
        // Print the current page
        window.print();
        
        // Remove the temporary div after a short delay
        setTimeout(() => {
            if (document.body.contains(tempDiv)) {
                document.body.removeChild(tempDiv);
            }
        }, 1000);
    }

    /**
     * Filter data based on search query
     * @param {string} query - The search query
     */
    filterData(query, filterValue = '') {
        this.searchQuery = query.toLowerCase().trim();
        this.filterValue = filterValue;
        
        if (!this.searchQuery && !this.filterValue) {
            this.filteredData = [...this.data];
        } else {
            this.filteredData = this.data.filter(row => {
                let matchesSearch = true;
                let matchesFilter = true;
                
                // Check search query
                if (this.searchQuery) {
                    matchesSearch = this.columns.some(col => {
                        const value = row[col.key];
                        if (value === null || value === undefined) return false;
                        return String(value).toLowerCase().includes(this.searchQuery);
                    });
                }
                
                // Check filter value (if filterable is enabled, filter by the first column)
                if (this.filterValue && this.filterable) {
                    const firstColumn = this.columns[0];
                    if (firstColumn) {
                        const value = row[firstColumn.key];
                        matchesFilter = String(value) === this.filterValue;
                    }
                }
                
                return matchesSearch && matchesFilter;
            });
            
            // Preserve all metadata fields needed for custom actions
            this.filteredData = this.filteredData.map(row => {
                // Find the original row with all metadata
                const originalRow = this.data.find(original => {
                    // Try to match by ID first, then by student_id_meta if available
                    if (original.id && row.id && original.id === row.id) return true;
                    if (original.student_id_meta && row.student_id_meta && original.student_id_meta === row.student_id_meta) return true;
                    // Fallback: match by all visible column values
                    return this.columns.every(col => original[col.key] === row[col.key]);
                });
                
                // Return the original row with all metadata preserved
                return originalRow || row;
            });
        }
        
        // Apply current sort to filtered data if sorting is active
        if (this.sortColumn && this.sortable) {
            this.filteredData.sort((a, b) => {
                const aVal = a[this.sortColumn];
                const bVal = b[this.sortColumn];
                
                if (aVal === bVal) return 0;
                
                const comparison = aVal < bVal ? -1 : 1;
                return this.sortDirection === 'asc' ? comparison : -comparison;
            });
        }
        
        // Reset to first page when filtering
        this.currentPage = 1;
        
        this.render();
        this.dispatchEvent(new CustomEvent('table-search', {
            detail: { query: this.searchQuery, filterValue: this.filterValue, results: this.filteredData.length },
            bubbles: true
        }));
    }

    /**
     * Filter data without triggering a full re-render
     * Used to preserve input focus during search
     * @param {string} query - The search query
     * @param {string} filterValue - The filter value
     */
    filterDataWithoutRender(query, filterValue = '') {
        this.searchQuery = query.toLowerCase().trim();
        this.filterValue = filterValue;
        
        if (!this.searchQuery && !this.filterValue) {
            this.filteredData = [...this.data];
        } else {
            this.filteredData = this.data.filter(row => {
                let matchesSearch = true;
                let matchesFilter = true;
                
                // Check search query
                if (this.searchQuery) {
                    matchesSearch = this.columns.some(col => {
                        const value = row[col.key];
                        if (value === null || value === undefined) return false;
                        return String(value).toLowerCase().includes(this.searchQuery);
                    });
                }
                
                // Check filter value (if filterable is enabled, filter by the first column)
                if (this.filterValue && this.filterable) {
                    const firstColumn = this.columns[0];
                    if (firstColumn) {
                        const value = row[firstColumn.key];
                        matchesFilter = String(value) === this.filterValue;
                    }
                }
                
                return matchesSearch && matchesFilter;
            });
            
            // Preserve all metadata fields needed for custom actions
            this.filteredData = this.filteredData.map(row => {
                // Find the original row with all metadata
                const originalRow = this.data.find(original => {
                    // Try to match by ID first, then by student_id_meta if available
                    if (original.id && row.id && original.id === row.id) return true;
                    if (original.student_id_meta && row.student_id_meta && original.student_id_meta === row.student_id_meta) return true;
                    // Fallback: match by all visible column values
                    return this.columns.every(col => original[col.key] === row[col.key]);
                });
                
                // Return the original row with all metadata preserved
                return originalRow || row;
            });
        }
        
        // Apply current sort to filtered data if sorting is active
        if (this.sortColumn && this.sortable) {
            this.filteredData.sort((a, b) => {
                const aVal = a[this.sortColumn];
                const bVal = b[this.sortColumn];
                
                if (aVal === bVal) return 0;
                
                const comparison = aVal < bVal ? -1 : 1;
                return this.sortDirection === 'asc' ? comparison : -comparison;
            });
        }
        
        // Reset to first page when filtering
        this.currentPage = 1;
        
        // Dispatch event without re-rendering
        this.dispatchEvent(new CustomEvent('table-search', {
            detail: { query: this.searchQuery, filterValue: this.filterValue, results: this.filteredData.length },
            bubbles: true
        }));
    }

    /**
     * Handle search input changes
     * @param {Event} event - The input event
     */
    handleSearchInput(event) {
        const query = event.target.value;
        this.searchQuery = query;
        
        // Store the current cursor position and selection
        const input = event.target;
        const cursorPosition = input.selectionStart;
        const selectionEnd = input.selectionEnd;
        
        // Update filtered data without full re-render
        this.filterDataWithoutRender(query, this.filterValue);
        
        // Update only the table body and pagination
        this.updateTableBodyOnly();
        
        // Restore cursor position and selection after a brief delay
        setTimeout(() => {
            if (input && document.contains(input)) {
                input.setSelectionRange(cursorPosition, selectionEnd);
                input.focus();
            }
        }, 0);
    }

    /**
     * Handle search input keydown events
     * @param {Event} event - The keydown event
     */
    handleSearchKeydown(event) {
        if (event.key === 'Escape') {
            event.target.value = '';
            this.filterData('', this.filterValue);
        }
    }

    /**
     * Handle filter dropdown changes
     * @param {Event} event - The change event
     */
    handleFilterChange(event) {
        const filterValue = event.target.value;
        this.filterData(this.searchQuery, filterValue);
    }

    /**
     * Handle page size changes
     * @param {Event} event - The change event
     */
    handlePageSizeChange(event) {
        let newPageSize = parseInt(event.target.value);
        
        // Validate input
        if (isNaN(newPageSize) || newPageSize < 1) {
            newPageSize = 10; // Default fallback
        } else if (newPageSize > 1000) {
            newPageSize = 1000; // Max limit
        }
        
        // Update input value if it was invalid
        event.target.value = newPageSize;
        
        if (newPageSize !== this.pageSize) {
            this.pageSize = newPageSize;
            this.currentPage = 1; // Reset to first page
            this.render();
            this.dispatchEvent(new CustomEvent('table-page-size-change', {
                detail: { pageSize: newPageSize },
                bubbles: true
            }));
        }
    }

    /**
     * Go to a specific page
     * @param {number} page - The page number
     */
    goToPage(page) {
        if (!this.pagination) return;

        const dataToUse = (this.searchable || this.filterable) ? this.filteredData : this.data;
        const maxPage = Math.ceil(dataToUse.length / this.pageSize);
        if (page < 1 || page > maxPage) return;

        this.currentPage = page;
        this.render();
        this.dispatchEvent(new CustomEvent('table-page-change', {
            detail: { page },
            bubbles: true
        }));
    }

    /**
     * Get the currently visible data based on pagination and search
     * @returns {Array} The visible data
     */
    getVisibleData() {
        const dataToUse = (this.searchable || this.filterable) ? this.filteredData : this.data;
        
        if (!this.pagination) return dataToUse;

        const start = (this.currentPage - 1) * this.pageSize;
        const end = start + this.pageSize;
        return dataToUse.slice(start, end);
    }

    /**
     * Update only the table body without re-rendering the entire table
     * This prevents search input from losing focus
     */
    updateTableBodyOnly() {
        const tbody = this.querySelector('tbody');
        if (!tbody) return;

        const visibleData = this.getVisibleData();
        const dataToUse = (this.searchable || this.filterable) ? this.filteredData : this.data;
        
        // Update the count display in the header
        const countElement = this.querySelector('.upo-table-count');
        if (countElement) {
            const totalCount = this.data.length;
            const filteredCount = dataToUse.length;
            countElement.textContent = `(${(this.searchable && this.searchQuery) || (this.filterable && this.filterValue) ? filteredCount : totalCount})`;
        }

        // Update table body
        tbody.innerHTML = visibleData.map((row, index) => {
            const isSelected = this.selectedRows.has(row);
            
            return `
                <tr class="${isSelected ? 'selected' : ''}" data-row-index="${index}">
                    ${this.selectable ? `
                        <td class="upo-table-checkbox-column">
                            <input type="checkbox" class="upo-table-checkbox" data-row-index="${index}" ${isSelected ? 'checked' : ''}>
                        </td>
                    ` : ''}
                    ${this.columns.map(col => {
                        const value = row[col.key];
                        if (col.html) {
                            return `<td class="upo-table-cell">${value || ''}</td>`;
                        } else {
                            return `<td class="upo-table-cell">${this.escapeHtml(value || '')}</td>`;
                        }
                    }).join('')}
                    ${this.action ? `
                        <td class="upo-table-action-column">
                            <div class="upo-table-action-buttons">
                                ${(!this.actions.length || this.actions.includes('view')) ? `
                                <button class="upo-table-action-button view" onclick="this.closest('ui-table').viewRow(${index})" aria-label="View item">
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                                        <circle cx="12" cy="12" r="3"></circle>
                                    </svg>
                                </button>
                                ` : ''}
                                ${(!this.actions.length || this.actions.includes('edit')) && (!row._hidden_actions || !row._hidden_actions.includes('edit')) ? `
                                <button class="upo-table-action-button edit" onclick="this.closest('ui-table').editRow(${index})" aria-label="Edit item">
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                                    </svg>
                                </button>
                                ` : ''}
                                ${(!this.actions.length || this.actions.includes('delete')) && (!row._hidden_actions || !row._hidden_actions.includes('delete')) ? `
                                <button class="upo-table-action-button delete" onclick="this.closest('ui-table').deleteRow(${index})" aria-label="Delete item">
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                        <polyline points="3,6 5,6 21,6"></polyline>
                                        <path d="M19,6v14a2,2 0 0,1 -2,2H7a2,2 0 0,1 -2,-2V6m3,0V4a2,2 0 0,1 2,-2h4a2,2 0 0,1 2,2v2"></path>
                                    </svg>
                                </button>
                                ` : ''}
                                ${this.customActions.map(customAction => {
                                    // Check if the custom action should be shown for this row
                                    let shouldShow = true;
                                    if (typeof customAction.show === 'function') {
                                        shouldShow = customAction.show(row);
                                    } else if (customAction.showField) {
                                        // If a showField string is provided, use the row boolean value
                                        try { shouldShow = !!row[customAction.showField]; } catch (_) { shouldShow = false; }
                                    }
                                    if (!shouldShow) return '';
                                    
                                    return `
                                    <button class="upo-table-action-button custom" onclick="this.closest('ui-table').customAction(${index}, '${customAction.name}')" aria-label="${customAction.label || customAction.name}" title="${customAction.tooltip || customAction.label || customAction.name}">
                                        ${customAction.icon ? `<i class="${customAction.icon}"></i>` : customAction.text || customAction.name}
                                    </button>
                                    `;
                                }).join('')}
                            </div>
                        </td>
                    ` : ''}
                </tr>
            `;
        }).join('');

        // Re-add event listeners for the new rows
        if (this.selectable || this.clickable) {
            tbody.querySelectorAll('tr').forEach(tr => {
                tr.addEventListener('click', this.handleRowClick.bind(this));
            });
        }

        if (this.selectable) {
            tbody.querySelectorAll('.upo-table-checkbox').forEach(checkbox => {
                checkbox.addEventListener('change', this.handleCheckboxChange.bind(this));
            });
        }

        // Update pagination if needed
        if (this.pagination) {
            this.updatePaginationOnly();
        }
    }

    /**
     * Update only the pagination without re-rendering the entire table
     */
    updatePaginationOnly() {
        const paginationElement = this.querySelector('.upo-table-pagination');
        if (!paginationElement) return;

        const dataToUse = (this.searchable || this.filterable) ? this.filteredData : this.data;
        const maxPage = Math.ceil(dataToUse.length / this.pageSize);
        const startItem = (this.currentPage - 1) * this.pageSize + 1;
        const endItem = Math.min(this.currentPage * this.pageSize, dataToUse.length);

        // Update pagination info
        const infoElement = paginationElement.querySelector('.upo-table-pagination-info');
        if (infoElement) {
            infoElement.textContent = `Showing ${startItem} to ${endItem} of ${dataToUse.length} results${(this.searchable && this.searchQuery) || (this.filterable && this.filterValue) ? ` (filtered from ${this.data.length} total)` : ''}`;
        }

        // Update pagination controls
        const controlsElement = paginationElement.querySelector('.upo-table-pagination-controls');
        if (controlsElement) {
            // This is a simplified update - in a real implementation you might want to
            // update the pagination buttons more carefully to preserve their event listeners
            // For now, we'll just update the disabled states
            const prevButton = controlsElement.querySelector('button:first-child');
            const nextButton = controlsElement.querySelector('button:last-child');
            
            if (prevButton) {
                prevButton.disabled = this.currentPage === 1;
            }
            if (nextButton) {
                nextButton.disabled = this.currentPage === maxPage;
            }
        }
    }

    /**
     * Handle click events on table headers for sorting
     * @param {Event} event - The click event
     */
    handleHeaderClick(event) {
        const th = event.target.closest('th');
        if (!th || !this.sortable) return;

        const column = th.dataset.column;
        if (column) {
            this.sort(column);
        }
    }

    /**
     * Handle click events on table rows for selection
     * @param {Event} event - The click event
     */
    handleRowClick(event) {
        const tr = event.target.closest('tr');
        if (!tr) {
            return;
        }

        const rowIndex = parseInt(tr.dataset.rowIndex);
        
        if (!isNaN(rowIndex)) {
            // Handle selection if selectable
            if (this.selectable) {
                this.toggleRowSelection(rowIndex);
            }
            
            // Handle row click if clickable
            if (this.clickable) {
                const row = this.getVisibleData()[rowIndex];
                if (row) {
                    this.dispatchEvent(new CustomEvent('table-row-click', {
                        detail: { row, rowIndex, event },
                        bubbles: true
                    }));
                }
            }
        }
    }

    /**
     * Handle refresh button click
     * @param {Event} event - The click event
     */
    handleRefreshClick(event) {
        event.preventDefault();
        event.stopPropagation();
        this.resetTable();
    }

    /**
     * Handle checkbox change events
     * @param {Event} event - The change event
     */
    handleCheckboxChange(event) {
        const checkbox = event.target;
        const rowIndex = parseInt(checkbox.dataset.rowIndex);
        
        if (!isNaN(rowIndex)) {
            this.toggleRowSelection(rowIndex);
        } else if (checkbox.dataset.selectAll) {
            if (checkbox.checked) {
                this.selectAll();
            } else {
                this.deselectAll();
            }
        }
    }

    /**
     * Render the table component
     * Creates the HTML structure with appropriate CSS classes
     */
    render() {
        const visibleData = this.getVisibleData();
        const dataToUse = (this.searchable || this.filterable) ? this.filteredData : this.data;
        const maxPage = Math.ceil(dataToUse.length / this.pageSize);
        const totalCount = this.data.length;
        const filteredCount = dataToUse.length;
        
        const tableClasses = [
            'upo-table',
            this.sortable ? 'upo-table-sortable' : '',
            this.selectable ? 'upo-table-selectable' : '',
            this.clickable ? 'upo-table-clickable' : '',
            this.striped ? 'upo-table-striped' : '',
            this.bordered ? 'upo-table-bordered' : '',
            this.compact ? 'upo-table-compact' : ''
        ].filter(Boolean).join(' ');

        let tableHTML = `
            <div class="upo-table-container">
        `;

        // Header: Title on top, then controls row (search, refresh)
        tableHTML += `
            <div class="upo-table-header">
                <div class="upo-table-title">
                    ${this.title}
                    <span class="upo-table-count">(${(this.searchable && this.searchQuery) || (this.filterable && this.filterValue) ? filteredCount : totalCount})</span>
                </div>
                <div class="upo-table-controls-row">
                    <div class="upo-table-controls-left">
        `;

        // Search bar and refresh button (left side)
        if (this.searchable) {
            tableHTML += `
                <div class="upo-table-search">
                    <svg class="upo-table-search-icon" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                        <path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001c.03.04.062.078.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1.007 1.007 0 0 0-.115-.1zM12 6.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0z"/>
                    </svg>
                    <input 
                        type="text" 
                        class="upo-table-search-input" 
                        placeholder="${this.searchPlaceholder}"
                        value="${this.searchQuery}"
                        aria-label="Search table"
                    >
                    ${this.searchQuery ? `
                        <button class="upo-table-search-clear" aria-label="Clear search">
                            ×
                        </button>
                    ` : ''}
                </div>
            `;
        }

        // Filter dropdown (if filterable is enabled)
        if (this.filterable && this.columns.length > 0) {
            const firstColumn = this.columns[0];
            const uniqueValues = [...new Set(this.data.map(row => row[firstColumn.key]).filter(val => val != null))];
            
            tableHTML += `
                <div class="upo-table-filter">
                    <select class="upo-table-filter-select" aria-label="Filter by ${firstColumn.label || firstColumn.key}">
                        <option value="">All ${firstColumn.label || firstColumn.key}</option>
                        ${uniqueValues.map(value => `
                            <option value="${value}" ${this.filterValue === value ? 'selected' : ''}>
                                ${value}
                            </option>
                        `).join('')}
                    </select>
                </div>
            `;
        }

        // Refresh button (icon only) - only if refresh is enabled
        if (this.refresh) {
            tableHTML += `
                <button class="upo-table-refresh" aria-label="Refresh table">
                    <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99"/>
                    </svg>
                </button>
            `;
        }
        
        tableHTML += `
                    </div>
                    <div class="upo-table-controls-right">
        `;
        
        // Print button (icon only) - right side (only if print is enabled)
        if (this.print) {
            tableHTML += `
                <button class="upo-table-print" aria-label="Print table">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M6 9V2H18V9" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M6 18H4C3.46957 18 2.96086 17.7893 2.58579 17.4142C2.21071 17.0391 2 16.5304 2 16V11C2 10.4696 2.21071 9.96086 2.58579 9.58579C2.96086 9.21071 3.46957 9 4 9H20C20.5304 9 21.0391 9.21071 21.4142 9.58579C21.7893 9.96086 22 10.4696 22 11V16C22 16.5304 21.7893 17.0391 21.4142 17.4142C21.0391 17.7893 20.5304 18 20 18H18" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M18 14H6V22H18V14Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    </button>
            `;
        }
        
        // Add button (icon only) - right side (only if addable is enabled)
        if (this.addable) {
            tableHTML += `
                <button class="upo-table-add" onclick="event.stopPropagation(); this.closest('ui-table').add()" aria-label="Add new item">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <line x1="12" y1="5" x2="12" y2="19"></line>
                        <line x1="5" y1="12" x2="19" y2="12"></line>
                    </svg>
                </button>
            `;
        }
        
        tableHTML += `
                    </div>
                </div>
        `;

        tableHTML += `
                </div>
            </div>
        `;

        tableHTML += `
                <div class="upo-table-scroll-container">
                    <table class="${tableClasses}" role="table">
                        <thead>
                            <tr>
                                ${this.selectable ? `<th><input type="checkbox" class="upo-table-checkbox" data-select-all ${this.areAllVisibleRowsSelected() ? 'checked' : ''}></th>` : ''}
                                ${this.columns.map(col => {
                                    const isSorted = this.sortColumn === col.key;
                                    const sortClass = isSorted ? (this.sortDirection === 'asc' ? 'upo-sort-asc' : 'upo-sort-desc') : '';
                                    return `
                                        <th data-column="${col.key}" ${this.sortable ? 'tabindex="0" role="button"' : ''} class="${sortClass}">
                                            ${col.label || col.key}
                                        </th>
                                    `;
                                }).join('')}
                                ${this.action ? '<th class="upo-table-action-column">Actions</th>' : ''}
                            </tr>
                        </thead>
                        <tbody>
        `;

        if (visibleData.length === 0) {
            const noDataMessage = this.searchable && this.searchQuery 
                ? `No results found for "${this.searchQuery}"`
                : 'No data available';
            
            tableHTML += `
                        <tr>
                            <td colspan="${this.columns.length + (this.selectable ? 1 : 0)}" class="upo-table-empty">
                                ${noDataMessage}
                            </td>
                        </tr>
            `;
        } else {
            visibleData.forEach((row, index) => {
                const isSelected = this.selectedRows.has(row);
                const rowClasses = isSelected ? 'selected' : '';
                
                tableHTML += `
                    <tr data-row-index="${index}" class="${rowClasses}">
                        ${this.selectable ? `
                            <td>
                                <input type="checkbox" class="upo-table-checkbox" data-row-index="${index}" ${isSelected ? 'checked' : ''}>
                            </td>
                        ` : ''}
                        ${this.columns.map(col => {
                            const cellValue = row[col.key] || '';
                            // Check if the column should render HTML
                            const renderHTML = col.html !== false; // Default to true unless explicitly set to false
                            return `
                                <td>${renderHTML ? cellValue : this.escapeHtml(cellValue)}</td>
                            `;
                        }).join('')}
                        ${this.action ? `
                            <td class="upo-table-action-column">
                                <div class="upo-table-action-buttons">
                                    ${(!this.actions.length || this.actions.includes('view')) ? `
                                    <button class="upo-table-action-button view" onclick="this.closest('ui-table').viewRow(${index})" aria-label="View item">
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                                            <circle cx="12" cy="12" r="3"></circle>
                                        </svg>
                                    </button>
                                    ` : ''}
                                    ${(!this.actions.length || this.actions.includes('edit')) && (!row._hidden_actions || !row._hidden_actions.includes('edit')) ? `
                                    <button class="upo-table-action-button edit" onclick="this.closest('ui-table').editRow(${index})" aria-label="Edit item">
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                                        </svg>
                                    </button>
                                    ` : ''}
                                    ${(!this.actions.length || this.actions.includes('delete')) && (!row._hidden_actions || !row._hidden_actions.includes('delete')) ? `
                                    <button class="upo-table-action-button delete" onclick="this.closest('ui-table').deleteRow(${index})" aria-label="Delete item">
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                            <polyline points="3,6 5,6 21,6"></polyline>
                                            <path d="M19,6v14a2,2 0 0,1 -2,2H7a2,2 0 0,1 -2,-2V6m3,0V4a2,2 0 0,1 2,-2h4a2,2 0 0,1 2,2v2"></path>
                                        </svg>
                                    </button>
                                    ` : ''}
                                    ${this.customActions.map(customAction => {
                                        // Check if the custom action should be shown for this row
                                        let shouldShow = true;
                                        if (typeof customAction.show === 'function') {
                                            shouldShow = customAction.show(row);
                                        } else if (customAction.showField) {
                                            // If a showField string is provided, use the row boolean value
                                            try { shouldShow = !!row[customAction.showField]; } catch (_) { shouldShow = false; }
                                        }
                                        if (!shouldShow) return '';
                                        
                                        return `
                                        <button class="upo-table-action-button custom" onclick="this.closest('ui-table').customAction(${index}, '${customAction.name}')" aria-label="${customAction.label || customAction.name}" title="${customAction.tooltip || customAction.label || customAction.name}">
                                            ${customAction.icon ? `<i class="${customAction.icon}"></i>` : customAction.text || customAction.name}
                                        </button>
                                        `;
                                    }).join('')}
                                </div>
                            </td>
                        ` : ''}
                    </tr>
                `;
            });
        }

        tableHTML += `
                        </tbody>
                    </table>
                </div>
        `;

        if (this.pagination && dataToUse.length > 0) {
            const startItem = (this.currentPage - 1) * this.pageSize + 1;
            const endItem = Math.min(this.currentPage * this.pageSize, dataToUse.length);
            
            tableHTML += `
                <div class="upo-table-pagination">
                    <div class="upo-table-pagination-left">
                        <div class="upo-table-pagination-info">
                            Showing ${startItem} to ${endItem} of ${dataToUse.length} results
                            ${(this.searchable && this.searchQuery) || (this.filterable && this.filterValue) ? ` (filtered from ${this.data.length} total)` : ''}
                        </div>
                        <div class="upo-table-page-size">
                            <label for="page-size-input">Show:</label>
                            <input type="number" id="page-size-input" class="upo-table-page-size-input" value="${this.pageSize}" min="1" max="1000">
                            <span>entries</span>
                        </div>
                    </div>
                    <div class="upo-table-pagination-controls">
                        <button class="upo-table-pagination-button" ${this.currentPage === 1 ? 'disabled' : ''} onclick="this.closest('ui-table').goToPage(${this.currentPage - 1})" aria-label="Go to previous page">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <polyline points="15,18 9,12 15,6"></polyline>
                            </svg>
                        </button>
            `;

            // Page numbers with ellipsis
            const maxVisible = 5; // Show max 5 page numbers
            let startPage = Math.max(1, this.currentPage - Math.floor(maxVisible / 2));
            let endPage = Math.min(maxPage, startPage + maxVisible - 1);
            
            // Adjust if we're near the end
            if (endPage - startPage + 1 < maxVisible) {
                startPage = Math.max(1, endPage - maxVisible + 1);
            }
            
            // Show ellipsis before first page if needed
            if (startPage > 1) {
                tableHTML += `
                    <button class="upo-table-pagination-button" onclick="this.closest('ui-table').goToPage(1)">
                        1
                    </button>
                `;
                if (startPage > 2) {
                    tableHTML += `
                        <span class="upo-table-pagination-ellipsis">...</span>
                    `;
                }
            }
            
            // Show visible page numbers
            for (let i = startPage; i <= endPage; i++) {
                tableHTML += `
                    <button class="upo-table-pagination-button ${i === this.currentPage ? 'active' : ''}" onclick="this.closest('ui-table').goToPage(${i})">
                        ${i}
                    </button>
                `;
            }
            
            // Show ellipsis after last page if needed
            if (endPage < maxPage) {
                if (endPage < maxPage - 1) {
                    tableHTML += `
                        <span class="upo-table-pagination-ellipsis">...</span>
                    `;
                }
                tableHTML += `
                    <button class="upo-table-pagination-button" onclick="this.closest('ui-table').goToPage(${maxPage})">
                        ${maxPage}
                    </button>
                `;
            }

            tableHTML += `
                        <button class="upo-table-pagination-button" ${this.currentPage === maxPage ? 'disabled' : ''} onclick="this.closest('ui-table').goToPage(${this.currentPage + 1})" aria-label="Go to next page">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <polyline points="9,18 15,12 9,6"></polyline>
                            </svg>
                        </button>
                    </div>
                </div>
            `;
        }

        tableHTML += '</div>';

        this.innerHTML = tableHTML;

        // Add event listeners
        if (this.sortable) {
            this.querySelectorAll('th[data-column]').forEach(th => {
                th.addEventListener('click', this.handleHeaderClick.bind(this));
                th.addEventListener('keydown', (e) => {
                    if (e.key === ' ' || e.key === 'Enter') {
                        e.preventDefault();
                        this.handleHeaderClick(e);
                    }
                });
            });
        }

        if (this.selectable || this.clickable) {
            this.querySelectorAll('tbody tr').forEach(tr => {
                tr.addEventListener('click', this.handleRowClick.bind(this));
            });
        }

        if (this.selectable) {
            this.querySelectorAll('.upo-table-checkbox').forEach(checkbox => {
                checkbox.addEventListener('change', this.handleCheckboxChange.bind(this));
            });
        }

        // Add search event listeners
        if (this.searchable) {
            const searchInput = this.querySelector('.upo-table-search-input');
            if (searchInput) {
                // Set the current search value
                if (this.searchQuery) {
                    searchInput.value = this.searchQuery;
                }
                
                searchInput.addEventListener('input', this.handleSearchInput.bind(this));
                searchInput.addEventListener('keydown', this.handleSearchKeydown.bind(this));
            }

            const clearButton = this.querySelector('.upo-table-search-clear');
            if (clearButton) {
                clearButton.addEventListener('click', () => {
                    this.searchQuery = '';
                    this.querySelector('.upo-table-search-input').value = '';
                    this.filterData('', this.filterValue);
                });
            }
        }

        // Add filter dropdown event listeners
        if (this.filterable) {
            const filterSelect = this.querySelector('.upo-table-filter-select');
            if (filterSelect) {
                filterSelect.addEventListener('change', this.handleFilterChange.bind(this));
            }
        }

        // Add page size input event listeners
        if (this.pagination) {
            const pageSizeInput = this.querySelector('.upo-table-page-size-input');
            if (pageSizeInput) {
                pageSizeInput.addEventListener('change', this.handlePageSizeChange.bind(this));
                pageSizeInput.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter') {
                        e.target.blur(); // Trigger change event
                    }
                });
            }
        }

        // Add refresh button event listener
        if (this.refresh) {
            const refreshButton = this.querySelector('.upo-table-refresh');
            if (refreshButton) {
                // Remove any existing event listeners
                refreshButton.onclick = null;
                
                // Add new event listener using arrow function to preserve 'this' context
                refreshButton.addEventListener('click', (event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    this.resetTable();
                });
            }
        }

        // Add print button event listener
        if (this.print) {
            const printButton = this.querySelector('.upo-table-print');
            if (printButton) {
                printButton.addEventListener('click', () => {
                    this.printTable();
                });
            }
        }
    }
}

// Force reload of component by undefining first
if (customElements.get('ui-table')) {
    customElements.undefine('ui-table');
}
customElements.define('ui-table', Table);
export default Table; 