/**
 * Dropdown Component
 * 
 * A customizable dropdown/select component with modern UI
 * 
 * Attributes:
 * - placeholder: string (default: 'Select an option')
 * - value: string (default: '') - Selected value(s)
 * - multiple: boolean (default: false) - Enable multi-select
 * - searchable: boolean (default: false) - Enable search functionality
 * - disabled: boolean (default: false) - Disable the dropdown
 * - size: 'sm' | 'md' | 'lg' (default: 'md') - Size variant
 * - status: 'success' | 'warning' | 'error' | 'info' (default: '') - Validation state
 * 
 * Features:
 * - Single and multi-select modes
 * - Searchable options
 * - Custom styling with Tailwind CSS
 * - Keyboard navigation
 * - Clear selection
 * - Loading state
 * - Custom option rendering
 * 
 * Usage:
 * <ui-dropdown>
 *   <ui-option value="option1">Option 1</ui-option>
 *   <ui-option value="option2">Option 2</ui-option>
 * </ui-dropdown>
 * 
 * <ui-dropdown multiple searchable>
 *   <ui-option value="option1">Option 1</ui-option>
 *   <ui-option value="option2">Option 2</ui-option>
 * </ui-dropdown>
 */

class Dropdown extends HTMLElement {
    constructor() {
        super();
        
        // Create the main container
        this.container = document.createElement('div');
        this.container.className = 'upo-dropdown';
        
        // Create the trigger
        this.trigger = document.createElement('div');
        this.trigger.className = 'upo-dropdown-trigger';
        this.trigger.tabIndex = 0;
        
        // Create the selection display
        this.selection = document.createElement('div');
        this.selection.className = 'upo-dropdown-selection';
        
        // Create the arrow
        this.arrow = document.createElement('div');
        this.arrow.className = 'upo-dropdown-arrow';
        this.arrow.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m6 9 6 6 6-6"/></svg>';
        
        // Create the menu
        this.menu = document.createElement('div');
        this.menu.className = 'upo-dropdown-menu';
        
        // Create the search container
        this.searchContainer = document.createElement('div');
        this.searchContainer.className = 'upo-dropdown-search';
        this.searchContainer.style.display = 'none';
        
        // Create the search input
        this.searchInput = document.createElement('input');
        this.searchInput.type = 'text';
        this.searchInput.className = 'upo-dropdown-search-input';
        this.searchInput.placeholder = 'Search...';
        
        // Create the options container
        this.optionsContainer = document.createElement('div');
        this.optionsContainer.className = 'upo-dropdown-options';
        
        // Assemble the structure
        this.trigger.appendChild(this.selection);
        this.trigger.appendChild(this.arrow);
        this.searchContainer.appendChild(this.searchInput);
        this.menu.appendChild(this.searchContainer);
        this.menu.appendChild(this.optionsContainer);
        this.container.appendChild(this.trigger);
        this.container.appendChild(this.menu);
        this.appendChild(this.container);
        
        // Initialize state - ensure we start with no selections
        this.isOpen = false;
        this.selectedValues = new Set();
        this.filteredOptions = [];
        this.focusedIndex = -1;
        this.searchTerm = '';
        
        // Flag to prevent double processing
        this.initialized = false;
        
        // Add default styles
        this.addDefaultStyles();
        
        // Set up event listeners
        this.setupEventListeners();
    }
    
    addDefaultStyles() {
        if (!document.getElementById('upo-ui-dropdown-styles')) {
            const style = document.createElement('style');
            style.id = 'upo-ui-dropdown-styles';
            style.textContent = `
                .upo-dropdown {
                    position: relative;
                    display: inline-block;
                    width: 100%;
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                }
                
                .upo-dropdown-trigger {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    width: 100%;
                    padding: 0.5rem 0.75rem;
                    border: 1px solid #d1d5db;
                    border-radius: 0.375rem;
                    background-color: #ffffff;
                    cursor: pointer;
                    transition: border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out;
                    font-size: 0.875rem;
                    line-height: 1.25;
                    color: #374151;
                    min-height: 2.5rem;
                    user-select: none;
                    box-sizing: border-box;
                }
                
                .upo-dropdown-trigger:hover {
                    border-color: #9ca3af;
                }
                
                .upo-dropdown-trigger:focus {
                    outline: none;
                    border-color: #3b82f6;
                    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
                }
                
                .upo-dropdown-trigger.disabled {
                    background-color: #f9fafb;
                    color: #9ca3af;
                    cursor: not-allowed;
                    border-color: #e5e7eb;
                }
                
                .upo-dropdown-selection {
                    flex: 1;
                    display: flex;
                    align-items: center;
                    gap: 0.25rem;
                    flex-wrap: wrap;
                    min-height: 1.25rem;
                }
                
                .upo-dropdown-placeholder {
                    color: #9ca3af;
                }
                
                .upo-dropdown-selected {
                    display: flex;
                    align-items: center;
                    gap: 0.25rem;
                    flex-wrap: wrap;
                }
                
                .upo-dropdown-tag {
                    display: inline-flex;
                    align-items: center;
                    gap: 0.25rem;
                    padding: 0.125rem 0.5rem;
                    background-color: #e0e7ff;
                    color: #3730a3;
                    border-radius: 0.25rem;
                    font-size: 0.75rem;
                    font-weight: 500;
                }
                
                .upo-dropdown-tag-remove {
                    cursor: pointer;
                    padding: 0.125rem;
                    border-radius: 0.125rem;
                    transition: background-color 0.15s ease-in-out;
                }
                
                .upo-dropdown-tag-remove:hover {
                    background-color: rgba(55, 48, 163, 0.1);
                }
                
                .upo-dropdown-arrow {
                    display: flex;
                    align-items: center;
                    color: #6b7280;
                    transition: transform 0.15s ease-in-out;
                    flex-shrink: 0;
                    margin-left: 0.5rem;
                }
                
                .upo-dropdown.open .upo-dropdown-arrow {
                    transform: rotate(180deg);
                }
                
                .upo-dropdown-menu {
                    position: absolute;
                    top: calc(100% + 4px);
                    left: 0;
                    right: 0;
                    background-color: #ffffff;
                    border: 1px solid #d1d5db;
                    border-radius: 0.375rem;
                    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
                    z-index: 9999;
                    max-height: 15rem;
                    overflow: hidden;
                    display: none;
                }
                
                .upo-dropdown.open .upo-dropdown-menu {
                    display: block;
                }
                
                .upo-dropdown-search {
                    padding: 0.5rem;
                    border-bottom: 1px solid #e5e7eb;
                }
                
                .upo-dropdown-search-input {
                    width: 100%;
                    padding: 0.375rem 0.5rem;
                    border: 1px solid #d1d5db;
                    border-radius: 0.25rem;
                    font-size: 0.875rem;
                    outline: none;
                    transition: border-color 0.15s ease-in-out;
                }
                
                .upo-dropdown-search-input:focus {
                    border-color: #3b82f6;
                    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
                }
                
                .upo-dropdown-options {
                    max-height: 12rem;
                    overflow-y: auto;
                }
                
                .upo-dropdown-option {
                    padding: 0.5rem 0.75rem;
                    cursor: pointer;
                    transition: background-color 0.15s ease-in-out;
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                }
                
                .upo-dropdown-option:hover {
                    background-color: #f3f4f6;
                }
                
                .upo-dropdown-option.selected {
                    background-color: #dbeafe;
                    color: #1e40af;
                }
                
                .upo-dropdown-option.focused {
                    background-color: #eff6ff;
                }
                
                .upo-dropdown-option.disabled {
                    color: #9ca3af;
                    cursor: not-allowed;
                    background-color: #f9fafb;
                }
                
                .upo-dropdown-option-checkbox {
                    width: 1rem;
                    height: 1rem;
                    border: 1px solid #d1d5db;
                    border-radius: 0.25rem;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    flex-shrink: 0;
                }
                
                .upo-dropdown-option.selected .upo-dropdown-option-checkbox {
                    background-color: #3b82f6;
                    border-color: #3b82f6;
                    color: white;
                }
                
                .upo-dropdown-option-text {
                    flex: 1;
                }
                
                .upo-dropdown-empty {
                    padding: 0.75rem;
                    text-align: center;
                    color: #6b7280;
                    font-size: 0.875rem;
                }
                
                /* Size variants */
                .upo-dropdown.size-sm .upo-dropdown-trigger {
                    padding: 0.375rem 0.5rem;
                    min-height: 2rem;
                    font-size: 0.75rem;
                }
                
                .upo-dropdown.size-lg .upo-dropdown-trigger {
                    padding: 0.75rem 1rem;
                    min-height: 3rem;
                    font-size: 1rem;
                }
                
                /* Status variants */
                .upo-dropdown.status-success .upo-dropdown-trigger {
                    border-color: #10b981;
                }
                
                .upo-dropdown.status-success .upo-dropdown-trigger:focus {
                    border-color: #10b981;
                    box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.1);
                    }
                
                .upo-dropdown.status-warning .upo-dropdown-trigger {
                    border-color: #f59e0b;
                }
                
                .upo-dropdown.status-warning .upo-dropdown-trigger:focus {
                    border-color: #f59e0b;
                    box-shadow: 0 0 0 3px rgba(245, 158, 11, 0.1);
                }
                
                .upo-dropdown.status-error .upo-dropdown-trigger {
                    border-color: #ef4444;
                }
                
                .upo-dropdown.status-error .upo-dropdown-trigger:focus {
                    border-color: #ef4444;
                    box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
                }
                
                .upo-dropdown.status-info .upo-dropdown-trigger {
                    border-color: #3b82f6;
                }
                
                .upo-dropdown.status-info .upo-dropdown-trigger:focus {
                    border-color: #3b82f6;
                    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
                }
            `;
            document.head.appendChild(style);
        }
    }
    
    static get observedAttributes() {
        return ['value', 'placeholder', 'disabled', 'multiple', 'searchable'];
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue === newValue) return;
        
        switch (name) {
            case 'value':
                if (newValue) {
                    this.selectedValues.clear();
                    if (this.hasAttribute('multiple')) {
                        newValue.split(',').forEach(v => this.selectedValues.add(v.trim()));
                    } else {
                        this.selectedValues.add(newValue);
                    }
                    this.updateSelection();
                    this.updateOptions();
                }
                break;
            case 'placeholder':
                if (this.selectedValues.size === 0) {
                    this.updateSelection();
                }
                break;
            case 'disabled':
                if (this.hasAttribute('disabled')) {
                    this.trigger.classList.add('disabled');
                } else {
                    this.trigger.classList.remove('disabled');
                }
                break;
        }
    }

    connectedCallback() {
        // Prevent double processing
        if (this.initialized) return;
        this.initialized = true;

        // Move all ui-option children to an internal array and remove from DOM
        this._options = Array.from(this.querySelectorAll('ui-option'));
        this._options.forEach(option => this.removeChild(option));

        // Force clear any initial selections - start completely empty
        this.selectedValues.clear();

        // Set initial value if provided
        const initialValue = this.getAttribute('value');
        if (initialValue) {
            if (this.hasAttribute('multiple')) {
                initialValue.split(',').forEach(v => this.selectedValues.add(v.trim()));
            } else {
                this.selectedValues.add(initialValue);
            }
        }

        this.updateSelection();
        this.updateOptions();
    }

    setupEventListeners() {
        // Toggle dropdown
        this.trigger.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            if (this.hasAttribute('disabled')) return;
            this.toggleDropdown();
            });

        // Keyboard navigation
        this.trigger.addEventListener('keydown', (e) => {
            if (this.hasAttribute('disabled')) return;
            
            switch (e.key) {
                case 'Enter':
                case ' ':
                    e.preventDefault();
                    this.toggleDropdown();
                    break;
                case 'ArrowDown':
                    e.preventDefault();
                    this.openDropdown();
                    this.focusNextOption();
                    break;
                case 'Escape':
                    this.closeDropdown();
                    break;
            }
        });
        
        // Search functionality
        this.searchInput.addEventListener('input', (e) => {
            this.searchTerm = e.target.value.toLowerCase();
            this.filterOptions();
            this.updateOptions();
        });
        
        this.searchInput.addEventListener('keydown', (e) => {
            switch (e.key) {
                case 'ArrowDown':
                    e.preventDefault();
                    this.focusNextOption();
                    break;
                case 'ArrowUp':
                    e.preventDefault();
                    this.focusPrevOption();
                    break;
                case 'Enter':
                    e.preventDefault();
                    if (this.focusedIndex >= 0) {
                        this.selectOption(this.focusedIndex);
                    }
                    break;
                case 'Escape':
                    this.closeDropdown();
                    break;
            }
        });

        // Global click to close
        document.addEventListener('click', (e) => {
            if (!this.container.contains(e.target)) {
                this.closeDropdown();
            }
        });

        // Keyboard navigation for options
        this.optionsContainer.addEventListener('keydown', (e) => {
            switch (e.key) {
                case 'ArrowDown':
                    e.preventDefault();
                    this.focusNextOption();
                    break;
                case 'ArrowUp':
                    e.preventDefault();
                    this.focusPrevOption();
                    break;
                case 'Enter':
                case ' ':
                    e.preventDefault();
                    if (this.focusedIndex >= 0) {
                        this.selectOption(this.focusedIndex);
                    }
                    break;
                case 'Escape':
                    this.closeDropdown();
                    break;
            }
        });
    }

    toggleDropdown() {
        if (this.isOpen) {
            this.closeDropdown();
        } else {
            this.openDropdown();
        }
    }

    openDropdown() {
        this.isOpen = true;
        this.container.classList.add('open');
        
        // Show/hide search
        if (this.hasAttribute('searchable')) {
            this.searchContainer.style.display = 'block';
            setTimeout(() => this.searchInput.focus(), 0);
        } else {
            this.searchContainer.style.display = 'none';
        }
        
        this.updateOptions();
        this.dispatchEvent(new CustomEvent('open', { bubbles: true }));
    }

    closeDropdown() {
        this.isOpen = false;
        this.container.classList.remove('open');
        this.focusedIndex = -1;
        this.searchTerm = '';
        this.searchInput.value = '';
        
        this.dispatchEvent(new CustomEvent('close', { bubbles: true }));
    }
    
    updateSelection() {
        if (this.selectedValues.size === 0) {
            this.selection.innerHTML = `<span class="upo-dropdown-placeholder">${this.getAttribute('placeholder') || 'Select an option'}</span>`;
            return;
        }
        
        if (this.hasAttribute('multiple')) {
            // Multi-select mode
            const tags = Array.from(this.selectedValues).map(value => {
                // Find the option in this._options
                const option = (this._options || []).find(opt => opt.getAttribute('value') === value);
                const text = option ? option.textContent.trim() : value;
                return `
                    <span class="upo-dropdown-tag">
                        ${text}
                        <span class="upo-dropdown-tag-remove" data-value="${value}">×</span>
                    </span>
                `;
            }).join('');
            this.selection.innerHTML = tags;
            
            // Add remove event listeners
            this.selection.querySelectorAll('.upo-dropdown-tag-remove').forEach(removeBtn => {
                removeBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const value = removeBtn.dataset.value;
                    this.selectedValues.delete(value);
                    this.updateSelection();
                    this.dispatchChangeEvent();
                });
            });
        } else {
            // Single-select mode
            const value = Array.from(this.selectedValues)[0];
            // Find the option in this._options
            const option = (this._options || []).find(opt => opt.getAttribute('value') === value);
            const text = option ? option.textContent.trim() : value;
            this.selection.innerHTML = `<span>${text}</span>`;
    }
    }
    
        updateOptions() {
        // Use internal options array
        const options = this._options || [];
        this.filteredOptions = options.filter(option => {
            if (this.searchTerm) {
                return option.textContent.toLowerCase().includes(this.searchTerm) ||
                       option.getAttribute('value').toLowerCase().includes(this.searchTerm);
            }
            return true;
        });
        
        if (this.filteredOptions.length === 0) {
            this.optionsContainer.innerHTML = `
                <div class="upo-dropdown-empty">
                    ${this.searchTerm ? 'No options found' : 'No options available'}
                </div>
            `;
            return;
        }

        const optionsHtml = this.filteredOptions.map((option, index) => {
            const value = option.getAttribute('value');
            const text = option.textContent.trim();
            const disabled = option.hasAttribute('disabled');
            const selected = this.selectedValues.has(value);
            const focused = index === this.focusedIndex;
            
            let optionHtml = `<div class="upo-dropdown-option`;
            if (selected) optionHtml += ' selected';
            if (focused) optionHtml += ' focused';
            if (disabled) optionHtml += ' disabled';
            optionHtml += `" data-value="${value}" data-index="${index}">`;
            
            if (this.hasAttribute('multiple')) {
                optionHtml += `
                    <div class="upo-dropdown-option-checkbox">
                        ${selected ? '✓' : ''}
                    </div>
                `;
            }
            
            optionHtml += `<span class="upo-dropdown-option-text">${text}</span></div>`;
            return optionHtml;
        }).join('');
        
        this.optionsContainer.innerHTML = optionsHtml;
        
        // Add click event listeners
        this.optionsContainer.querySelectorAll('.upo-dropdown-option').forEach(optionEl => {
            optionEl.addEventListener('click', (e) => {
                const value = optionEl.dataset.value;
                const index = parseInt(optionEl.dataset.index);
                this.selectOption(index);
            });
        });
    }
    
    selectOption(index) {
        if (index < 0 || index >= this.filteredOptions.length) return;
        
        const option = this.filteredOptions[index];
        const value = option.getAttribute('value');
        
        if (option.hasAttribute('disabled')) return;
        
        if (this.hasAttribute('multiple')) {
            // Multi-select mode
            if (this.selectedValues.has(value)) {
                this.selectedValues.delete(value);
            } else {
                this.selectedValues.add(value);
            }
        } else {
            // Single-select mode
            this.selectedValues.clear();
            this.selectedValues.add(value);
            this.closeDropdown();
        }
        
        this.updateSelection();
        this.updateOptions();
        this.dispatchChangeEvent();
            }
    
    filterOptions() {
        // Options are filtered in updateOptions()
    }

    focusNextOption() {
        this.focusedIndex = Math.min(this.focusedIndex + 1, this.filteredOptions.length - 1);
        this.updateOptions();
    }

    focusPrevOption() {
        this.focusedIndex = Math.max(this.focusedIndex - 1, 0);
        this.updateOptions();
    }

    dispatchChangeEvent() {
        const value = this.hasAttribute('multiple') 
            ? Array.from(this.selectedValues).join(',')
            : Array.from(this.selectedValues)[0] || '';
        
        this.dispatchEvent(new CustomEvent('change', {
            bubbles: true,
            detail: { value }
        }));
    }

    // Public methods
    get value() {
        if (this.hasAttribute('multiple')) {
            return Array.from(this.selectedValues);
        }
        return Array.from(this.selectedValues)[0] || '';
    }
    
    set value(val) {
        this.selectedValues.clear();
        if (this.hasAttribute('multiple')) {
            if (Array.isArray(val)) {
                val.forEach(v => this.selectedValues.add(v));
            } else if (typeof val === 'string') {
                val.split(',').forEach(v => this.selectedValues.add(v.trim()));
            }
        } else {
            this.selectedValues.add(val);
        }
        this.updateSelection();
        this.updateOptions();
    }
    
    open() {
        this.openDropdown();
    }
    
    close() {
        this.closeDropdown();
        }
    }

// Register the component
customElements.define('ui-dropdown', Dropdown);
export default Dropdown;

/**
 * Dropdown Option Component
 */
class DropdownOption extends HTMLElement {
    constructor() {
        super();
    }

    connectedCallback() {
        // Ensure the option is inside a dropdown; no console noise
        if (!this.closest('ui-dropdown')) {
            // no-op
        }
    }
}

customElements.define('ui-option', DropdownOption);