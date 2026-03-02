/**
 * Switch Component
 * 
 * A toggle switch component for binary states with smooth animations and accessibility features.
 * Supports multiple sizes, color variants, and can include labels and descriptions.
 * 
 * Attributes:
 * - checked: boolean - Whether the switch is in the checked state (default: false)
 * - disabled: boolean - Disable the switch interaction (default: false)
 * - size: 'sm' | 'md' | 'lg' - Size variant (default: 'md')
 * - variant: 'default' | 'primary' | 'success' | 'warning' | 'error' - Color variant (default: 'default')
 * - label: string - Label text displayed next to the switch
 * - description: string - Additional description text below the switch
 * 
 * Events:
 * - switch-change: Fired when switch state changes (detail: { checked: boolean })
 * 
 * Usage:
 * <ui-switch></ui-switch>
 * <ui-switch checked="true" label="Enable notifications"></ui-switch>
 * <ui-switch size="lg" variant="success" label="Dark mode" description="Switch between light and dark themes"></ui-switch>
 * <ui-switch disabled="true" label="Disabled switch"></ui-switch>
 * 
 * Accessibility:
 * - Supports keyboard navigation (Space/Enter keys)
 * - Proper ARIA attributes (role="switch", aria-checked, aria-disabled)
 * - Focus management with visual indicators
 * - Screen reader friendly
 */
class Switch extends HTMLElement {
    static get observedAttributes() {
        return ['checked', 'disabled', 'size', 'variant', 'label', 'description'];
    }

    constructor() {
        super();
        
        // Initialize with attribute values if they exist
        this.checked = this.hasAttribute('checked');
        this.disabled = this.hasAttribute('disabled');
        this.size = this.getAttribute('size') || 'md';
        this.variant = this.getAttribute('variant') || 'default';
        this.label = this.getAttribute('label') || '';
        this.description = this.getAttribute('description') || '';
        
        // Flag to prevent attributeChangedCallback from interfering with programmatic changes
        this.isUpdating = false;
        
        // Add default styles
        this.addDefaultStyles();
    }

    /**
     * Add default CSS styles to document if not already added
     * Creates a unique style element with all switch styles
     */
    addDefaultStyles() {
        if (!document.getElementById('upo-ui-switch-styles')) {
            const style = document.createElement('style');
            style.id = 'upo-ui-switch-styles';
            style.textContent = `
                .upo-switch {
                    display: inline-flex;
                    align-items: center;
                    position: relative;
                    cursor: pointer;
                    user-select: none;
                }
                
                .upo-switch-track {
                    position: relative;
                    display: inline-flex;
                    align-items: center;
                    border-radius: 9999px;
                    transition: all 0.2s ease-in-out;
                    outline: none;
                    box-sizing: border-box;
                }
                
                .upo-switch-track:focus {
                    box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.5);
                }
                
                .upo-switch-thumb {
                    position: absolute;
                    border-radius: 50%;
                    transition: transform 0.2s ease-in-out;
                    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
                }
                
                /* Sizes */
                .upo-switch-sm .upo-switch-track {
                    width: 2.25rem;
                    height: 1.25rem;
                }
                
                .upo-switch-sm .upo-switch-thumb {
                    width: 1rem;
                    height: 1rem;
                    transform: translateX(0.125rem);
                }
                
                .upo-switch-sm.upo-switch-checked .upo-switch-thumb {
                    transform: translateX(1.125rem);
                }
                
                .upo-switch-md .upo-switch-track {
                    width: 2.75rem;
                    height: 1.5rem;
                }
                
                .upo-switch-md .upo-switch-thumb {
                    width: 1.25rem;
                    height: 1.25rem;
                    transform: translateX(0.125rem);
                }
                
                .upo-switch-md.upo-switch-checked .upo-switch-thumb {
                    transform: translateX(1.375rem);
                }
                
                .upo-switch-lg .upo-switch-track {
                    width: 3.5rem;
                    height: 1.75rem;
                }
                
                .upo-switch-lg .upo-switch-thumb {
                    width: 1.5rem;
                    height: 1.5rem;
                    transform: translateX(0.125rem);
                }
                
                .upo-switch-lg.upo-switch-checked .upo-switch-thumb {
                    transform: translateX(1.875rem);
                }
                
                /* Variants */
                .upo-switch-default .upo-switch-track {
                    background-color: #d1d5db;
                }
                
                .upo-switch-default.upo-switch-checked .upo-switch-track {
                    background-color: #3b82f6;
                }
                
                .upo-switch-primary .upo-switch-track {
                    background-color: #d1d5db;
                }
                
                .upo-switch-primary.upo-switch-checked .upo-switch-track {
                    background-color: #3b82f6;
                }
                
                .upo-switch-success .upo-switch-track {
                    background-color: #d1d5db;
                }
                
                .upo-switch-success.upo-switch-checked .upo-switch-track {
                    background-color: #10b981;
                }
                
                .upo-switch-warning .upo-switch-track {
                    background-color: #d1d5db;
                }
                
                .upo-switch-warning.upo-switch-checked .upo-switch-track {
                    background-color: #f59e0b;
                }
                
                .upo-switch-error .upo-switch-track {
                    background-color: #d1d5db;
                }
                
                .upo-switch-error.upo-switch-checked .upo-switch-track {
                    background-color: #ef4444;
                }
                
                .upo-switch-thumb {
                    background-color: #ffffff;
                }
                
                /* Disabled state */
                .upo-switch-disabled {
                    opacity: 0.5;
                    cursor: not-allowed;
                }
                
                .upo-switch-disabled .upo-switch-track {
                    cursor: not-allowed;
                }
                
                /* Label styles */
                .upo-switch-label {
                    margin-left: 0.75rem;
                    font-size: 0.875rem;
                    font-weight: 500;
                    color: #111827;
                }
                
                .upo-switch-disabled .upo-switch-label {
                    color: #9ca3af;
                }
                
                .upo-switch-description {
                    margin-left: 0.75rem;
                    margin-top: 0.25rem;
                    font-size: 0.875rem;
                    color: #6b7280;
                }
                
                .upo-switch-disabled .upo-switch-description {
                    color: #9ca3af;
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
        this.addEventListener('click', this.handleClick.bind(this));
        this.addEventListener('keydown', this.handleKeydown.bind(this));
        this.setAttribute('role', 'switch');
        this.setAttribute('tabindex', '0');
        this.updateAccessibility();
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
            // Handle boolean attributes
            if (name === 'checked' || name === 'disabled') {
                this[name] = this.hasAttribute(name);
            } else {
                this[name] = newValue;
            }
            this.render();
            this.updateAccessibility();
        }
    }

    /**
     * Handle click events on the switch
     * Toggles the switch state if not disabled
     * @param {Event} event - The click event
     */
    handleClick(event) {
        if (this.disabled) return;
        
        event.preventDefault();
        event.stopPropagation();
        this.toggle();
    }

    /**
     * Handle keyboard events for accessibility
     * Supports Space and Enter keys for toggling
     * @param {KeyboardEvent} event - The keyboard event
     */
    handleKeydown(event) {
        if (this.disabled) return;

        if (event.key === ' ' || event.key === 'Enter') {
            event.preventDefault();
            event.stopPropagation();
            this.toggle();
        }
    }

    /**
     * Toggle the switch state
     * Updates the checked state, re-renders, and dispatches change event
     */
    toggle() {
        // Set flag to prevent attributeChangedCallback from interfering
        this.isUpdating = true;
        
        // Toggle the boolean state
        this.checked = !this.checked;
        
        // Update the attribute to match the state
        if (this.checked) {
            this.setAttribute('checked', '');
        } else {
            this.removeAttribute('checked');
        }
        
        // Re-render and dispatch event
        this.render();
        this.updateAccessibility();
        
        this.dispatchEvent(new CustomEvent('switch-change', {
            detail: { checked: this.checked },
            bubbles: true
        }));
        
        // Reset flag
        this.isUpdating = false;
    }

    /**
     * Update accessibility attributes
     * Sets ARIA attributes for screen readers
     */
    updateAccessibility() {
        this.setAttribute('aria-checked', this.checked.toString());
        this.setAttribute('aria-disabled', this.disabled.toString());
        
        if (this.label) {
            this.setAttribute('aria-label', this.label);
        }
    }

    /**
     * Render the switch component
     * Creates the HTML structure with appropriate CSS classes
     */
    render() {
        const sizeClass = `upo-switch-${this.size}`;
        const variantClass = `upo-switch-${this.variant}`;
        const checkedClass = this.checked ? 'upo-switch-checked' : '';
        const disabledClass = this.disabled ? 'upo-switch-disabled' : '';
        
        const containerClasses = [
            'upo-switch',
            sizeClass,
            variantClass,
            checkedClass,
            disabledClass
        ].filter(Boolean).join(' ');

        this.innerHTML = `
            <div class="${containerClasses}">
                <div class="upo-switch-track" tabindex="0">
                    <div class="upo-switch-thumb"></div>
                </div>
                ${this.label ? `<span class="upo-switch-label">${this.label}</span>` : ''}
            </div>
            ${this.description ? `<div class="upo-switch-description">${this.description}</div>` : ''}
        `;
    }
}

customElements.define('ui-switch', Switch);
export default Switch; 