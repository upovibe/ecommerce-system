/**
 * Checkbox Component
 * 
 * Creates a checkbox with a label. Supports:
 * - Checked and unchecked states
 * - Accessibility features
 * - Custom colors
 * 
 * Usage:
 * <ui-checkbox label="Accept Terms" checked></ui-checkbox>
 * <ui-checkbox label="Warning" color="red"></ui-checkbox>
 * <ui-checkbox label="Success" color="#10b981"></ui-checkbox>
 */
class Checkbox extends HTMLElement {
    constructor() {
        super();
        
        // Create the checkbox elements
        this.checkbox = document.createElement('input');
        this.label = document.createElement('label');
        this.wrapper = document.createElement('div');
        
        // Add elements to the component
        this.wrapper.appendChild(this.checkbox);
        this.wrapper.appendChild(this.label);
        this.appendChild(this.wrapper);
        
        // Add default styles
        this.addDefaultStyles();
        
        // Bind event handlers
        this._onCheckboxChange = this._onCheckboxChange.bind(this);
        this._onWrapperClick = this._onWrapperClick.bind(this);
        this._onLabelClick = this._onLabelClick.bind(this);
    }

    addDefaultStyles() {
        if (!document.getElementById('upo-ui-checkbox-styles')) {
            const style = document.createElement('style');
            style.id = 'upo-ui-checkbox-styles';
            style.textContent = `
                .upo-checkbox-wrapper {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    cursor: pointer;
                    user-select: none;
                    padding: 0.125rem;
                    border-radius: 0.25rem;
                    transition: background-color 0.15s ease-in-out;
                    width: fit-content;
                    padding: 0.25rem;
                }
                
                .upo-checkbox-wrapper:hover {
                    background-color: rgba(59, 130, 246, 0.1);
                }
                
                .upo-checkbox-input {
                    width: 1rem;
                    height: 1rem;
                    cursor: pointer;
                    accent-color: #3b82f6;
                    border: 2px solid #d1d5db;
                    border-radius: 0.25rem;
                    transition: all 0.15s ease-in-out;
                    margin: 0;
                    appearance: none;
                    -webkit-appearance: none;
                    -moz-appearance: none;
                    position: relative;
                }
                
                .upo-checkbox-input:checked {
                    background-color: #3b82f6;
                    border-color: #3b82f6;
                }
                
                .upo-checkbox-input:checked::after {
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
                
                .upo-checkbox-input:focus {
                    outline: 2px solid #3b82f6;
                    outline-offset: 2px;
                }
                
                .upo-checkbox-input:hover {
                    border-color: #3b82f6;
                }
                
                .upo-checkbox-label {
                    font-size: 0.875rem;
                    color: #374151;
                    cursor: pointer;
                    line-height: 1.25;
                    font-weight: 500;
                }
                
                .upo-checkbox-disabled {
                    opacity: 0.5;
                    cursor: not-allowed;
                }
                
                .upo-checkbox-disabled .upo-checkbox-input {
                    cursor: not-allowed;
                }
                
                .upo-checkbox-disabled .upo-checkbox-label {
                    cursor: not-allowed;
                }
                
                /* Color variants */
                .upo-checkbox-input[data-color="red"] {
                    accent-color: #ef4444;
                }
                
                .upo-checkbox-input[data-color="red"]:checked {
                    background-color: #ef4444 !important;
                    border-color: #ef4444 !important;
                }
                
                .upo-checkbox-input[data-color="red"]:focus {
                    outline-color: #ef4444;
                }
                
                .upo-checkbox-input[data-color="red"]:hover {
                    border-color: #ef4444;
                }
                
                .upo-checkbox-wrapper:hover .upo-checkbox-input[data-color="red"] {
                    background-color: rgba(239, 68, 68, 0.15);
                }
                
                .upo-checkbox-input[data-color="green"] {
                    accent-color: #10b981;
                }
                
                .upo-checkbox-input[data-color="green"]:checked {
                    background-color: #10b981 !important;
                    border-color: #10b981 !important;
                }
                
                .upo-checkbox-input[data-color="green"]:focus {
                    outline-color: #10b981;
                }
                
                .upo-checkbox-input[data-color="green"]:hover {
                    border-color: #10b981;
                }
                
                .upo-checkbox-wrapper:hover .upo-checkbox-input[data-color="green"] {
                    background-color: rgba(16, 185, 129, 0.15);
                }
                
                .upo-checkbox-input[data-color="yellow"] {
                    accent-color: #f59e0b;
                }
                
                .upo-checkbox-input[data-color="yellow"]:checked {
                    background-color: #f59e0b !important;
                    border-color: #f59e0b !important;
                }
                
                .upo-checkbox-input[data-color="yellow"]:focus {
                    outline-color: #f59e0b;
                }
                
                .upo-checkbox-input[data-color="yellow"]:hover {
                    border-color: #f59e0b;
                }
                
                .upo-checkbox-wrapper:hover .upo-checkbox-input[data-color="yellow"] {
                    background-color: rgba(245, 158, 11, 0.15);
                }
                
                .upo-checkbox-input[data-color="purple"] {
                    accent-color: #8b5cf6;
                }
                
                .upo-checkbox-input[data-color="purple"]:checked {
                    background-color: #8b5cf6 !important;
                    border-color: #8b5cf6 !important;
                }
                
                .upo-checkbox-input[data-color="purple"]:focus {
                    outline-color: #8b5cf6;
                }
                
                .upo-checkbox-input[data-color="purple"]:hover {
                    border-color: #8b5cf6;
                }
                
                .upo-checkbox-wrapper:hover .upo-checkbox-input[data-color="purple"] {
                    background-color: rgba(139, 92, 246, 0.15);
                }
                
                .upo-checkbox-input[data-color="gray"] {
                    accent-color: #6b7280;
                }
                
                .upo-checkbox-input[data-color="gray"]:checked {
                    background-color: #6b7280 !important;
                    border-color: #6b7280 !important;
                }
                
                .upo-checkbox-input[data-color="gray"]:focus {
                    outline-color: #6b7280;
                }
                
                .upo-checkbox-input[data-color="gray"]:hover {
                    border-color: #6b7280;
                }
                
                .upo-checkbox-wrapper:hover .upo-checkbox-input[data-color="gray"] {
                    background-color: rgba(107, 114, 128, 0.15);
                }
            `;
            document.head.appendChild(style);
        }
    }

    connectedCallback() {
        // Set up the wrapper
        this.wrapper.className = 'upo-checkbox-wrapper';
        
        // Set up the checkbox
        this.checkbox.type = 'checkbox';
        this.checkbox.className = 'upo-checkbox-input';
        this.checkbox.checked = this.hasAttribute('checked');
        this.checkbox.disabled = this.hasAttribute('disabled');
        
        // Set up the label
        this.label.className = 'upo-checkbox-label';
        this.label.textContent = this.getAttribute('label') || 'Checkbox';
        
        // Set up accessibility
        const id = this.getAttribute('id') || `checkbox-${Math.random().toString(36).substr(2, 9)}`;
        this.checkbox.id = id;
        this.label.setAttribute('for', id);
        
        // Add event listeners
        this.checkbox.addEventListener('change', this._onCheckboxChange);
        this.wrapper.addEventListener('click', this._onWrapperClick);
        this.label.addEventListener('click', this._onLabelClick);
        
        // Update disabled state
        this.updateDisabledState();
        
        // Update color
        this.updateColor();
    }

    disconnectedCallback() {
        this.checkbox.removeEventListener('change', this._onCheckboxChange);
        this.wrapper.removeEventListener('click', this._onWrapperClick);
        this.label.removeEventListener('click', this._onLabelClick);
    }

    static get observedAttributes() {
        return ['checked', 'label', 'disabled', 'color'];
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (name === 'checked') {
            this.checkbox.checked = this.hasAttribute('checked');
        }
        if (name === 'label') {
            this.label.textContent = newValue;
        }
        if (name === 'disabled') {
            this.updateDisabledState();
        }
        if (name === 'color') {
            this.updateColor();
        }
    }

    updateDisabledState() {
        const isDisabled = this.hasAttribute('disabled');
        this.checkbox.disabled = isDisabled;
        
        if (isDisabled) {
            this.wrapper.classList.add('upo-checkbox-disabled');
        } else {
            this.wrapper.classList.remove('upo-checkbox-disabled');
        }
    }

    updateColor() {
        const color = this.getAttribute('color');
        
        // Remove any existing color data attributes
        this.checkbox.removeAttribute('data-color');
        
        if (color) {
            // Check if it's a predefined color
            const predefinedColors = ['red', 'green', 'yellow', 'purple', 'gray'];
            
            if (predefinedColors.includes(color)) {
                this.checkbox.setAttribute('data-color', color);
            } else {
                // Custom hex color
                this.checkbox.style.accentColor = color;
                this.checkbox.style.setProperty('--custom-color', color);
                
                // Add custom color styles
                this.addCustomColorStyles(color);
            }
        }
    }

    addCustomColorStyles(color) {
        const styleId = `upo-checkbox-custom-${color.replace('#', '')}`;
        
        if (!document.getElementById(styleId)) {
            const style = document.createElement('style');
            style.id = styleId;
            style.textContent = `
                .upo-checkbox-input[style*="--custom-color: ${color}"]:checked {
                    background-color: ${color} !important;
                    border-color: ${color} !important;
                }
                
                .upo-checkbox-input[style*="--custom-color: ${color}"]:focus {
                    outline-color: ${color} !important;
                }
                
                .upo-checkbox-input[style*="--custom-color: ${color}"]:hover {
                    border-color: ${color} !important;
                }
            `;
            document.head.appendChild(style);
        }
    }

    _onCheckboxChange() {
        if (this.checkbox.checked) {
            this.setAttribute('checked', '');
        } else {
            this.removeAttribute('checked');
        }
        
        this.dispatchEvent(new CustomEvent('change', {
            detail: { checked: this.checkbox.checked },
            bubbles: true
        }));
    }

    _onWrapperClick(e) {
        if (e.target === this.checkbox) {
            return;
        }
        
        if (!this.hasAttribute('disabled')) {
            this.checkbox.checked = !this.checkbox.checked;
            this._onCheckboxChange();
        }
    }

    _onLabelClick(e) {
        if (!this.hasAttribute('disabled')) {
            this.checkbox.checked = !this.checkbox.checked;
            this._onCheckboxChange();
        }
    }
}

customElements.define('ui-checkbox', Checkbox);
export default Checkbox; 