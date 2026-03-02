/**
 * Search Dropdown Component (V4 - Robust)
 * A robust, encapsulated, searchable dropdown using a Shadow DOM to prevent style and event conflicts.
 * This version correctly handles the web component lifecycle to prevent race conditions.
 */
class SearchDropdown extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });

        // --- State ---
        this.isInitialized = false;
        this.isOpen = false;
        this.selectedValues = new Set();
        this.searchTerm = '';
        this._options = [];
        this.focusedIndex = -1;
    }

    static get observedAttributes() {
        return ['value', 'disabled', 'multiple', 'placeholder'];
    }

    // --- Lifecycle Callbacks ---
        connectedCallback() {
        if (this.isInitialized) return;

        this.shadowRoot.innerHTML = this._renderTemplate();

        // --- Element References ---
        this.container = this.shadowRoot.querySelector('.UpoSearchDropdown');
        this.trigger = this.shadowRoot.querySelector('.UpoSearchDropdown__trigger');
        this.selection = this.shadowRoot.querySelector('.UpoSearchDropdown__selection');
        this.searchInput = this.shadowRoot.querySelector('.UpoSearchDropdown__searchInput');
        this.optionsContainer = this.shadowRoot.querySelector('.UpoSearchDropdown__options');
        this.slotEl = this.shadowRoot.querySelector('slot');

        this._setupEventListeners();
        this._onSlotChange(); // Process initial options
        this._updateFromAttributes(); // Sync with initial attributes
        
        this.isInitialized = true;
        
        // Force update after initialization to handle any initial values
        setTimeout(() => {
            this._updateFromAttributes();
        }, 0);
    }

    attributeChangedCallback(name, oldValue, newValue) {
        // Only process if the value actually changed
        if (oldValue === newValue) return;
        
        // Defer attribute updates until the component is fully initialized.
        if (this.isInitialized) {
            this._updateFromAttributes();
        }
    }

    // --- Event Setup ---
    _setupEventListeners() {
        this.trigger.addEventListener('click', (e) => { e.stopPropagation(); this.toggleDropdown(); });
        this.searchInput.addEventListener('input', (e) => this._onSearch(e));
        this.searchInput.addEventListener('keydown', (e) => this._onSearchKeydown(e));
        this.slotEl.addEventListener('slotchange', () => this._onSlotChange());

        // Prevent clicks within the dropdown from bubbling to parent layers
        this.container.addEventListener('click', (e) => { e.stopPropagation(); });

        document.addEventListener('click', (e) => {
            if (!e.composedPath().includes(this)) {
                this.closeDropdown();
            }
        }, true);
    }

    // --- State & Attribute Updates ---
    _updateFromAttributes() {
        this._updateValueFromAttribute();
        this._updateDisabled();
    }

    _updateValueFromAttribute() {
        const valueAttr = this.getAttribute('value');
        const currentValues = new Set();
        if (valueAttr) {
            try {
                const values = this.hasAttribute('multiple') ? JSON.parse(valueAttr) : [valueAttr];
                if (Array.isArray(values)) {
                    values.forEach(v => currentValues.add(String(v)));
                }
            } catch (e) { /* Ignore malformed attribute */ }
        }

        // Avoid re-rendering if the values haven't actually changed.
        if (!this._areSetsEqual(this.selectedValues, currentValues)) {
            this.selectedValues = currentValues;
            this._renderSelection();
        }
    }

    _updateDisabled() {
        this.trigger.classList.toggle('disabled', this.hasAttribute('disabled'));
        if (this.hasAttribute('disabled')) this.closeDropdown();
    }

    // --- Core Logic ---
    toggleDropdown() {
        if (this.hasAttribute('disabled')) return;
        this.isOpen ? this.closeDropdown() : this.openDropdown();
    }

    openDropdown() {
        if (this.isOpen) return;
        this.isOpen = true;
        this.container.classList.add('open');
        this._renderOptions();
        this.searchInput.focus();
    }

    closeDropdown() {
        if (!this.isOpen) return;
        this.isOpen = false;
        this.container.classList.remove('open');
        this.searchTerm = '';
        this.searchInput.value = '';
        this.focusedIndex = -1;
    }

    _onSearch(e) {
        this.searchTerm = e.target.value;
        this.focusedIndex = -1;
        this._renderOptions();
    }

    _onSearchKeydown(e) {
        const options = this._getFilteredOptions();
        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                let nextIndex = (this.focusedIndex + 1) % options.length;
                // Skip disabled options
                while (nextIndex !== this.focusedIndex && options[nextIndex] && options[nextIndex].hasAttribute('disabled')) {
                    nextIndex = (nextIndex + 1) % options.length;
                }
                this.focusedIndex = nextIndex;
                break;
            case 'ArrowUp':
                e.preventDefault();
                let prevIndex = (this.focusedIndex - 1 + options.length) % options.length;
                // Skip disabled options
                while (prevIndex !== this.focusedIndex && options[prevIndex] && options[prevIndex].hasAttribute('disabled')) {
                    prevIndex = (prevIndex - 1 + options.length) % options.length;
                }
                this.focusedIndex = prevIndex;
                break;
            case 'Enter':
                e.preventDefault();
                if (this.focusedIndex > -1 && options[this.focusedIndex] && !options[this.focusedIndex].hasAttribute('disabled')) {
                    this._selectOption(options[this.focusedIndex]);
                }
                break;
            case 'Escape': this.closeDropdown(); break;
        }
        this._renderOptions();
    }

    _onSlotChange() {
        this._options = this.slotEl.assignedElements({ flatten: true }).filter(el => el.tagName === 'UI-OPTION');
        this._renderOptions();
        this._renderSelection();
    }

    _selectOption(option) {
        if (option.hasAttribute('disabled')) return;
        const value = option.getAttribute('value');

        if (this.hasAttribute('multiple')) {
            this.selectedValues.has(value) ? this.selectedValues.delete(value) : this.selectedValues.add(value);
        } else {
            this.selectedValues.clear();
            this.selectedValues.add(value);
            this.closeDropdown();
        }
        this._renderSelection();
        this._renderOptions();
        this._dispatchChangeEvent();
    }

    _dispatchChangeEvent() {
        const value = this.hasAttribute('multiple')
            ? JSON.stringify(Array.from(this.selectedValues))
            : (this.selectedValues.values().next().value || null);

        if (this.getAttribute('value') !== value) {
            this.setAttribute('value', value);
        }

        this.dispatchEvent(new CustomEvent('change', { detail: { value }, bubbles: true, composed: true }));
    }

    // --- Rendering ---
    _getFilteredOptions() {
        if (!this.searchTerm) return this._options;
        const term = this.searchTerm.toLowerCase();
        return this._options.filter(option =>
            option.textContent.toLowerCase().includes(term) ||
            (option.getAttribute('value') || '').toLowerCase().includes(term)
        );
    }

    _renderSelection() {
        if (this.selectedValues.size === 0) {
            this.selection.innerHTML = `<span class="UpoSearchDropdown__placeholder">${this.getAttribute('placeholder') || 'Select an option'}</span>`;
            return;
        }

        if (this.hasAttribute('multiple')) {
            this.selection.innerHTML = Array.from(this.selectedValues).map(value => {
                const option = this._options.find(opt => opt.getAttribute('value') === value);
                return `
                    <span class="UpoSearchDropdown__tag" data-value="${value}">
                        ${option ? option.textContent.trim() : value}
                        <button class="UpoSearchDropdown__tagRemove" aria-label="Remove">×</button>
                    </span>
                `;
            }).join('');
            this.selection.querySelectorAll('.UpoSearchDropdown__tagRemove').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const value = e.currentTarget.parentElement.dataset.value;
                    this.selectedValues.delete(value);
                    this._renderSelection();
                    this._renderOptions();
                    this._dispatchChangeEvent();
                });
            });
        } else {
            const value = this.selectedValues.values().next().value;
            const option = this._options.find(opt => opt.getAttribute('value') === value);
            this.selection.innerHTML = `<span>${option ? option.textContent.trim() : (value || '')}</span>`;
        }
    }

    _renderOptions() {
        const options = this._getFilteredOptions();
        if (options.length === 0) {
            this.optionsContainer.innerHTML = `<div class="UpoSearchDropdown__empty">No results found</div>`;
            return;
        }

        this.optionsContainer.innerHTML = options.map((option, index) => {
            const value = option.getAttribute('value');
            const text = option.textContent.trim();
            const isSelected = this.selectedValues.has(value);
            const isFocused = this.focusedIndex === index;
            const isDisabled = option.hasAttribute('disabled');

            let classes = 'UpoSearchDropdown__option';
            if (isSelected) classes += ' selected';
            if (isFocused) classes += ' focused';
            if (isDisabled) classes += ' disabled';

            return `
                <div class="${classes}" data-value="${value}" role="option" aria-selected="${isSelected}">
                    ${this.hasAttribute('multiple') ? `<div class="UpoSearchDropdown__optionCheckbox">${isSelected ? '✓' : ''}</div>` : ''}
                    <span class="UpoSearchDropdown__optionText">${text}</span>
                </div>
            `;
        }).join('');

        this.optionsContainer.querySelectorAll('.UpoSearchDropdown__option').forEach(el => {
            // Prevent click-through to underlying elements (e.g., buttons behind the dropdown)
            el.addEventListener('mousedown', (e) => { e.preventDefault(); e.stopPropagation(); });
            el.addEventListener('click', (e) => { 
                e.preventDefault(); 
                e.stopPropagation(); 
                const option = this._options.find(o => o.getAttribute('value') === el.dataset.value); 
                if (option && !option.hasAttribute('disabled')) {
                    this._selectOption(option);
                }
            });
            el.addEventListener('mouseup', (e) => { e.stopPropagation(); });
        });
    }

    // --- Template & Styles ---
    _renderTemplate() {
        return `
            <style>
                :host { display: inline-block; width: 100%; position: relative; font-family: sans-serif; }
                .UpoSearchDropdown { position: relative; }
                .UpoSearchDropdown__trigger { 
                    display: flex; 
                    align-items: center; 
                    justify-content: space-between; 
                    width: 100%; 
                    padding: 0.375rem 0.5rem; 
                    border: 1px solid #d1d5db; 
                    border-radius: 0.35rem; 
                    background-color: #ffffff; 
                    cursor: pointer; 
                    min-height: 2rem; 
                    box-sizing: border-box;
                    font-size: 0.75rem;
                    line-height: 1.25;
                    color: #374151;
                    transition: border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out;
                }
                
                .UpoSearchDropdown__trigger:hover,
.UpoSearchDropdown__trigger:active {
    border-color: #0d53df;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}
                
                .UpoSearchDropdown__trigger:hover,
.UpoSearchDropdown__trigger:focus,
.UpoSearchDropdown__trigger:active {
    border-color: #0d53df;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}
                .UpoSearchDropdown__trigger.disabled { 
                    background-color: #f9fafb; 
                    color: #9ca3af; 
                    cursor: not-allowed; 
                    border-color: #e5e7eb;
                }
                .UpoSearchDropdown__selection { flex: 1; display: flex; align-items: center; gap: 4px; flex-wrap: wrap; min-height: 20px; }
                .UpoSearchDropdown__placeholder { color: #9ca3af; }
                .UpoSearchDropdown__tag { display: inline-flex; align-items: center; gap: 4px; padding: 2px 8px; background-color: #e0e7ff; color: #3730a3; border-radius: 4px; font-size: 12px; }
                .UpoSearchDropdown__tagRemove { cursor: pointer; background: none; border: none; font-size: 16px; color: #6b7280; padding: 0; line-height: 1; }
                .UpoSearchDropdown__arrow { display: flex; align-items: center; color: #6b7280; transition: transform 0.2s; }
                .UpoSearchDropdown.open .UpoSearchDropdown__arrow { transform: rotate(180deg); }
                .UpoSearchDropdown__menu { display: none; position: absolute; top: calc(100% + 4px); left: 0; right: 0; background-color: #fff; border: 1px solid #ccc; border-radius: 4px; z-index: 1000; }
                .UpoSearchDropdown.open .UpoSearchDropdown__menu { display: block; }
                .UpoSearchDropdown__searchContainer { 
                    padding: 0.375rem; 
                    border-bottom: 1px solid #e5e7eb; 
                }
                .UpoSearchDropdown__searchInput { 
                    width: 100%; 
                    padding: 0.375rem 0.5rem; 
                    border: 1px solid #d1d5db; 
                    border-radius: 0.25rem; 
                    font-size: 0.75rem; 
                    line-height: 1.25;
                    color: #374151;
                    background-color: #ffffff;
                    box-sizing: border-box;
                    outline: none;
                    transition: border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out;
                }
                
                .UpoSearchDropdown__searchInput:focus {
                    border-color: #3b82f6;
                    box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
                }
                
                .UpoSearchDropdown__searchInput::placeholder {
                    color: #9ca3af;
                }
                .UpoSearchDropdown__options { max-height: 192px; overflow-y: auto; }
                .UpoSearchDropdown__option { padding: 8px 12px; cursor: pointer; display: flex; align-items: center; gap: 8px; }
                .UpoSearchDropdown__option:hover { background-color: #f0f0f0; }
                .UpoSearchDropdown__option.focused { background-color: #e6f7ff; }
                .UpoSearchDropdown__option.selected { background-color: #dbeafe; color: #1e40af; }
                .UpoSearchDropdown__option.disabled { color: #aaa; cursor: not-allowed; }
                .UpoSearchDropdown__optionCheckbox { width: 16px; height: 16px; border: 1px solid #ccc; border-radius: 4px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
                .UpoSearchDropdown__option.selected .UpoSearchDropdown__optionCheckbox { background-color: #3b82f6; border-color: #3b82f6; color: white; }
                .UpoSearchDropdown__empty { padding: 8px 12px; color: #666; text-align: center; }
            </style>
            <div class="UpoSearchDropdown">
                <div class="UpoSearchDropdown__trigger">
                    <div class="UpoSearchDropdown__selection"></div>
                    <div class="UpoSearchDropdown__arrow">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m6 9 6 6 6-6"/></svg>
                    </div>
                </div>
                <div class="UpoSearchDropdown__menu">
                    <div class="UpoSearchDropdown__searchContainer">
                        <input type="text" class="UpoSearchDropdown__searchInput" placeholder="Search...">
                    </div>
                    <div class="UpoSearchDropdown__options"></div>
                </div>
            </div>
            <slot style="display: none;"></slot>
        `;
    }

    // --- Utility ---
    _areSetsEqual(set1, set2) {
        if (set1.size !== set2.size) return false;
        for (const item of set1) {
            if (!set2.has(item)) return false;
        }
        return true;
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
        this._renderSelection();
        this._renderOptions();
    }
}

customElements.define('ui-search-dropdown', SearchDropdown);
export default SearchDropdown;
