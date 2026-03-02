/**
 * Radio Group Component
 * 
 * Creates a group of radio buttons with labels. Supports:
 * - Multiple radio options
 * - Selected state management
 * - Accessibility features
 * - Vertical and horizontal layouts
 * 
 * Attributes:
 * - name: string - name for the radio group (required)
 * - value: string - currently selected value
 * - layout: string - "vertical" or "horizontal" (default: "vertical")
 * - disabled: boolean - disable the entire group
 * 
 * Events:
 * - change: Fired when selection changes (detail: { value: string, name: string })
 * 
 * Usage:
 * <ui-radio-group name="favorite-color" value="blue">
 *   <ui-radio-option value="red" label="Red"></ui-radio-option>
 *   <ui-radio-option value="blue" label="Blue"></ui-radio-option>
 *   <ui-radio-option value="green" label="Green"></ui-radio-option>
 * </ui-radio-group>
 */
class RadioGroup extends HTMLElement {
    constructor() {
        super();
        
        // Create the radio group container
        this.container = document.createElement('div');
        this.appendChild(this.container);
        
        // Add default styles
        this.addDefaultStyles();
        
        // Bind event handlers
        this._onRadioChange = this._onRadioChange.bind(this);
    }

    addDefaultStyles() {
        if (!document.getElementById('upo-ui-radio-group-styles')) {
            const style = document.createElement('style');
            style.id = 'upo-ui-radio-group-styles';
            style.textContent = `
                .upo-radio-group {
                    display: flex;
                    flex-direction: column;
                    gap: 0.75rem;
                    width: 100%;
                }
                
                .upo-radio-group.horizontal {
                    flex-direction: row;
                    flex-wrap: wrap;
                    gap: 1rem;
                }
                
                .upo-radio-group.disabled {
                    opacity: 0.5;
                    pointer-events: none;
                }
                
                .upo-radio-option {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    cursor: pointer;
                    user-select: none;
                    padding: 0.25rem;
                    border-radius: 0.25rem;
                    transition: background-color 0.15s ease-in-out;
                    width: fit-content;
                }
                
                .upo-radio-option:hover {
                    background-color: rgba(59, 130, 246, 0.1);
                }
                
                .upo-radio-input {
                    width: 1rem;
                    height: 1rem;
                    cursor: pointer;
                    accent-color: #3b82f6;
                    border: 2px solid #d1d5db;
                    border-radius: 50%;
                    transition: all 0.15s ease-in-out;
                    margin: 0;
                    appearance: none;
                    -webkit-appearance: none;
                    -moz-appearance: none;
                    position: relative;
                }
                
                .upo-radio-input:checked {
                    background-color: #3b82f6;
                    border-color: #3b82f6;
                }
                
                .upo-radio-input:checked::after {
                    content: '';
                    position: absolute;
                    left: 50%;
                    top: 50%;
                    transform: translate(-50%, -50%);
                    width: 0.25rem;
                    height: 0.25rem;
                    background-color: white;
                    border-radius: 50%;
                }
                
                .upo-radio-input:focus {
                    outline: 2px solid #3b82f6;
                    outline-offset: 2px;
                }
                
                .upo-radio-input:hover {
                    border-color: #3b82f6;
                }
                
                .upo-radio-label {
                    font-size: 0.875rem;
                    color: #374151;
                    cursor: pointer;
                    line-height: 1.25;
                    font-weight: 500;
                }
                
                .upo-radio-option.disabled {
                    opacity: 0.5;
                    cursor: not-allowed;
                }
                
                .upo-radio-option.disabled .upo-radio-input {
                    cursor: not-allowed;
                }
                
                .upo-radio-option.disabled .upo-radio-label {
                    cursor: not-allowed;
                }
                
                /* Responsive */
                @media (max-width: 640px) {
                    .upo-radio-group.horizontal {
                        flex-direction: column;
                        gap: 0.75rem;
                    }
                }
            `;
            document.head.appendChild(style);
        }
    }

    connectedCallback() {
        this.updateLayout();
        this.updateDisabledState();
        this.setupEventListeners();
        
        // Wait for child radio options to be created before setting the selected value
        setTimeout(() => {
            this.updateSelectedValue();
        }, 0);
    }

    disconnectedCallback() {
        this.removeEventListeners();
    }

    static get observedAttributes() {
        return ['name', 'value', 'layout', 'disabled'];
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue !== newValue) {
            switch (name) {
                case 'layout':
                    this.updateLayout();
                    break;
                case 'disabled':
                    this.updateDisabledState();
                    break;
                case 'value':
                    this.updateSelectedValue();
                    break;
            }
        }
    }

    updateLayout() {
        const layout = this.getAttribute('layout') || 'vertical';
        this.container.className = `upo-radio-group ${layout === 'horizontal' ? 'horizontal' : ''}`;
    }

    updateDisabledState() {
        const disabled = this.hasAttribute('disabled');
        if (disabled) {
            this.container.classList.add('disabled');
        } else {
            this.container.classList.remove('disabled');
        }
        
        // Update all radio inputs
        const radioInputs = this.querySelectorAll('.upo-radio-input');
        radioInputs.forEach(input => {
            if (disabled) {
                input.disabled = true;
                input.closest('.upo-radio-option').classList.add('disabled');
            } else {
                input.disabled = false;
                input.closest('.upo-radio-option').classList.remove('disabled');
            }
        });
    }

    setupEventListeners() {
        this.removeEventListeners();
        this.addEventListener('change', this._onRadioChange);
    }

    removeEventListeners() {
        this.removeEventListener('change', this._onRadioChange);
    }

    updateSelectedValue() {
        const selectedValue = this.getAttribute('value');
        const radioInputs = this.querySelectorAll('.upo-radio-input');
        
        radioInputs.forEach(input => {
            input.checked = input.value === selectedValue;
        });
    }

    _onRadioChange(event) {
        if (event.target.type === 'radio' && event.target.checked) {
            const newValue = event.target.value;
            const name = this.getAttribute('name');
            
            // Update the value attribute
            this.setAttribute('value', newValue);
            
            // Dispatch change event
            this.dispatchEvent(new CustomEvent('change', {
                detail: {
                    value: newValue,
                    name: name
                }
            }));
        }
    }

    // Public method to get selected value
    getValue() {
        return this.getAttribute('value');
    }

    // Public method to set selected value
    setValue(value) {
        this.setAttribute('value', value);
        this.updateSelectedValue();
    }

    // Public method to get all options
    getOptions() {
        const options = [];
        const radioInputs = this.querySelectorAll('.upo-radio-input');
        radioInputs.forEach(input => {
            const label = input.nextElementSibling?.textContent || '';
            options.push({
                value: input.value,
                label: label,
                checked: input.checked
            });
        });
        return options;
    }
}

/**
 * Radio Option Component
 * 
 * Individual radio button option for use within RadioGroup
 * 
 * Attributes:
 * - value: string - value for this option (required)
 * - label: string - label text for this option
 * - disabled: boolean - disable this specific option
 * 
 * Usage:
 * <ui-radio-option value="option1" label="Option 1"></ui-radio-option>
 */
class RadioOption extends HTMLElement {
    constructor() {
        super();
        
        // Create the radio option elements
        this.radio = document.createElement('input');
        this.label = document.createElement('label');
        this.wrapper = document.createElement('div');
        
        // Add elements to the component
        this.wrapper.appendChild(this.radio);
        this.wrapper.appendChild(this.label);
        this.appendChild(this.wrapper);
        
        // Set up the radio input
        this.radio.type = 'radio';
        this.radio.className = 'upo-radio-input';
        
        // Set up the wrapper
        this.wrapper.className = 'upo-radio-option';
        
        // Set up the label
        this.label.className = 'upo-radio-label';
        
        // Bind event handlers
        this._onRadioChange = this._onRadioChange.bind(this);
        this._onWrapperClick = this._onWrapperClick.bind(this);
        this._onLabelClick = this._onLabelClick.bind(this);
    }

    connectedCallback() {
        this.updateAttributes();
        this.setupEventListeners();
    }

    disconnectedCallback() {
        this.removeEventListeners();
    }

    static get observedAttributes() {
        return ['value', 'label', 'disabled'];
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue !== newValue) {
            this.updateAttributes();
        }
    }

    updateAttributes() {
        const value = this.getAttribute('value');
        const label = this.getAttribute('label');
        const disabled = this.hasAttribute('disabled');
        
        if (value) {
            this.radio.value = value;
        }
        
        if (label) {
            this.label.textContent = label;
        }
        
        if (disabled) {
            this.radio.disabled = true;
            this.wrapper.classList.add('disabled');
        } else {
            this.radio.disabled = false;
            this.wrapper.classList.remove('disabled');
        }
        
        // Set the name from parent radio group
        const radioGroup = this.closest('ui-radio-group');
        if (radioGroup) {
            const groupName = radioGroup.getAttribute('name');
            if (groupName) {
                this.radio.name = groupName;
            }
        }
    }

    setupEventListeners() {
        this.removeEventListeners();
        this.radio.addEventListener('change', this._onRadioChange);
        this.wrapper.addEventListener('click', this._onWrapperClick);
        this.label.addEventListener('click', this._onLabelClick);
    }

    removeEventListeners() {
        this.radio.removeEventListener('change', this._onRadioChange);
        this.wrapper.removeEventListener('click', this._onWrapperClick);
        this.label.removeEventListener('click', this._onLabelClick);
    }

    _onRadioChange() {
        // Let the parent radio group handle the change
        this.dispatchEvent(new Event('change', { bubbles: true }));
    }

    _onWrapperClick(e) {
        if (e.target === this.wrapper || e.target === this.label) {
            e.preventDefault();
            this.radio.click();
        }
    }

    _onLabelClick(e) {
        e.preventDefault();
        this.radio.click();
    }
}

// Register the components
customElements.define('ui-radio-group', RadioGroup);
customElements.define('ui-radio-option', RadioOption);

export default RadioGroup; 