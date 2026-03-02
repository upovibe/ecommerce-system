/**
 * Button Component
 * 
 * Interactive button component with various styles, colors, and states.
 * Supports different variants, colors, sizes, and interactive states.
 * 
 * Attributes:
 * - variant: 'solid' | 'outline' | 'ghost' (default: 'solid')
 * - color: 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info'
 * - size: 'sm' | 'md' | 'lg' (default: 'md')
 * - disabled: boolean
 * - loading: boolean
 * 
 * Usage:
 * <ui-button>Default Button</ui-button>
 * <ui-button variant="outline" color="success">Success</ui-button>
 * <ui-button size="lg" disabled>Disabled</ui-button>
 */
class Button extends HTMLElement {
    constructor() {
        super();
        
        // Create the button element directly (no shadow DOM)
        this.buttonElement = document.createElement('button');
        
        // Flag to prevent double processing
        this.initialized = false;
        
        // Add the button element to the component
        this.appendChild(this.buttonElement);
        
        // Add default styles via CSS
        this.addDefaultStyles();
    }
    
    // Add default CSS styles to document if not already added
    addDefaultStyles() {
        if (!document.getElementById('upo-ui-button-styles')) {
            const style = document.createElement('style');
            style.id = 'upo-ui-button-styles';
            style.textContent = `
                .upo-button {
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    font-weight: 500;
                    border-radius: 0.375rem;
                    cursor: pointer;
                    text-decoration: none;
                    transition: all 0.15s ease-in-out;
                    outline: none;
                    box-sizing: border-box;
                    border: 1px solid transparent;
                    position: relative;
                }
                
                /* Sizes */
                .upo-button-sm {
                    padding: 0.25rem 0.5rem;
                    font-size: 0.75rem;
                    line-height: 1.25;
                }
                
                .upo-button-md {
                    padding: 0.375rem 0.75rem;
                    font-size: 0.875rem;
                    line-height: 1.25;
                }
                
                .upo-button-lg {
                    padding: 0.5rem 1rem;
                    font-size: 1rem;
                    line-height: 1.25;
                }
                
                /* Solid variants */
                .upo-button-solid-primary {
                    background-color: #3b82f6;
                    border-color: #3b82f6;
                    color: #ffffff;
                }
                
                .upo-button-solid-primary:hover {
                    background-color: #2563eb;
                    border-color: #2563eb;
                    transform: translateY(-1px);
                    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
                }
                
                .upo-button-solid-secondary {
                    background-color: #6b7280;
                    border-color: #6b7280;
                    color: #ffffff;
                }
                
                .upo-button-solid-secondary:hover {
                    background-color: #4b5563;
                    border-color: #4b5563;
                    transform: translateY(-1px);
                    box-shadow: 0 4px 12px rgba(107, 114, 128, 0.3);
                }
                
                .upo-button-solid-success {
                    background-color: #10b981;
                    border-color: #10b981;
                    color: #ffffff;
                }
                
                .upo-button-solid-success:hover {
                    background-color: #059669;
                    border-color: #059669;
                    transform: translateY(-1px);
                    box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
                }
                
                .upo-button-solid-warning {
                    background-color: #f59e0b;
                    border-color: #f59e0b;
                    color: #ffffff;
                }
                
                .upo-button-solid-warning:hover {
                    background-color: #d97706;
                    border-color: #d97706;
                    transform: translateY(-1px);
                    box-shadow: 0 4px 12px rgba(245, 158, 11, 0.3);
                }
                
                .upo-button-solid-error {
                    background-color: #ef4444;
                    border-color: #ef4444;
                    color: #ffffff;
                }
                
                .upo-button-solid-error:hover {
                    background-color: #dc2626;
                    border-color: #dc2626;
                    transform: translateY(-1px);
                    box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);
                }
                
                .upo-button-solid-info {
                    background-color: #06b6d4;
                    border-color: #06b6d4;
                    color: #ffffff;
                }
                
                .upo-button-solid-info:hover {
                    background-color: #0891b2;
                    border-color: #0891b2;
                    transform: translateY(-1px);
                    box-shadow: 0 4px 12px rgba(6, 182, 212, 0.3);
                }
                
                /* Outline variants */
                .upo-button-outline-primary {
                    background-color: transparent;
                    border-color: #3b82f6;
                    color: #3b82f6;
                }
                
                .upo-button-outline-primary:hover {
                    background-color: #3b82f6;
                    color: #ffffff;
                    transform: translateY(-1px);
                    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
                }
                
                .upo-button-outline-secondary {
                    background-color: transparent;
                    border-color: #6b7280;
                    color: #6b7280;
                }
                
                .upo-button-outline-secondary:hover {
                    background-color: #6b7280;
                    color: #ffffff;
                    transform: translateY(-1px);
                    box-shadow: 0 4px 12px rgba(107, 114, 128, 0.3);
                }
                
                .upo-button-outline-success {
                    background-color: transparent;
                    border-color: #10b981;
                    color: #10b981;
                }
                
                .upo-button-outline-success:hover {
                    background-color: #10b981;
                    color: #ffffff;
                    transform: translateY(-1px);
                    box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
                }
                
                .upo-button-outline-warning {
                    background-color: transparent;
                    border-color: #f59e0b;
                    color: #f59e0b;
                }
                
                .upo-button-outline-warning:hover {
                    background-color: #f59e0b;
                    color: #ffffff;
                    transform: translateY(-1px);
                    box-shadow: 0 4px 12px rgba(245, 158, 11, 0.3);
                }
                
                .upo-button-outline-error {
                    background-color: transparent;
                    border-color: #ef4444;
                    color: #ef4444;
                }
                
                .upo-button-outline-error:hover {
                    background-color: #ef4444;
                    color: #ffffff;
                    transform: translateY(-1px);
                    box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);
                }
                
                .upo-button-outline-info {
                    background-color: transparent;
                    border-color: #06b6d4;
                    color: #06b6d4;
                }
                
                .upo-button-outline-info:hover {
                    background-color: #06b6d4;
                    color: #ffffff;
                    transform: translateY(-1px);
                    box-shadow: 0 4px 12px rgba(6, 182, 212, 0.3);
                }
                
                /* Ghost variants */
                .upo-button-ghost-primary {
                    background-color: transparent;
                    border-color: transparent;
                    color: #3b82f6;
                }
                
                .upo-button-ghost-primary:hover {
                    background-color: rgba(59, 130, 246, 0.1);
                    color: #2563eb;
                }
                
                .upo-button-ghost-secondary {
                    background-color: transparent;
                    border-color: transparent;
                    color: #6b7280;
                }
                
                .upo-button-ghost-secondary:hover {
                    background-color: rgba(107, 114, 128, 0.1);
                    color: #4b5563;
                }
                
                .upo-button-ghost-success {
                    background-color: transparent;
                    border-color: transparent;
                    color: #10b981;
                }
                
                .upo-button-ghost-success:hover {
                    background-color: rgba(16, 185, 129, 0.1);
                    color: #059669;
                }
                
                .upo-button-ghost-warning {
                    background-color: transparent;
                    border-color: transparent;
                    color: #f59e0b;
                }
                
                .upo-button-ghost-warning:hover {
                    background-color: rgba(245, 158, 11, 0.1);
                    color: #d97706;
                }
                
                .upo-button-ghost-error {
                    background-color: transparent;
                    border-color: transparent;
                    color: #ef4444;
                }
                
                .upo-button-ghost-error:hover {
                    background-color: rgba(239, 68, 68, 0.1);
                    color: #dc2626;
                }
                
                .upo-button-ghost-info {
                    background-color: transparent;
                    border-color: transparent;
                    color: #06b6d4;
                }
                
                .upo-button-ghost-info:hover {
                    background-color: rgba(6, 182, 212, 0.1);
                    color: #0891b2;
                }
                
                /* Disabled state */
                .upo-button:disabled {
                    opacity: 0.5;
                    cursor: not-allowed;
                    transform: none !important;
                    box-shadow: none !important;
                }
                
                .upo-button:disabled:hover {
                    transform: none !important;
                    box-shadow: none !important;
                }
                
                /* Loading state */
                .upo-button-loading {
                    gap: 0.5rem;
                }
                
                .upo-button-loading::after {
                    content: '';
                    width: 1rem;
                    height: 1rem;
                    border: 2px solid currentColor;
                    border-radius: 50%;
                    border-top-color: transparent;
                    animation: spin 1s linear infinite;
                    flex-shrink: 0;
                }
                
                @keyframes spin {
                    to {
                        transform: rotate(360deg);
                    }
                }
                
                /* Focus states */
                .upo-button:focus {
                    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.3);
                }
                
                .upo-button:active {
                    transform: translateY(0);
                }
            `;
            document.head.appendChild(style);
        }
    }

    static get observedAttributes() {
        return ['variant', 'color', 'size', 'disabled', 'loading', 'class'];
    }

    get variant() {
        return this.getAttribute('variant') || 'solid';
    }

    get color() {
        return this.getAttribute('color') || 'primary';
    }

    get size() {
        return this.getAttribute('size') || 'md';
    }

    get disabled() {
        return this.hasAttribute('disabled');
    }

    get loading() {
        return this.hasAttribute('loading');
    }
    
    // Connected callback - called when element is added to DOM
    connectedCallback() {
        // Prevent double processing
        if (this.initialized) return;
        this.initialized = true;
        
        // Store original HTML content before building the button
        const originalNodes = Array.from(this.childNodes)
            .filter(node => node !== this.buttonElement);

        // Move any existing children (except our buttonElement) to avoid duplication
        const children = Array.from(this.childNodes);
        children.forEach(child => {
            if (child !== this.buttonElement) {
                this.removeChild(child);
            }
        });

        // Set up the button element
        this.updateClasses();
        
        // Move the original HTML content to the button element (preserves icons)
        if (originalNodes.length > 0) {
            originalNodes.forEach(node => {
                this.buttonElement.appendChild(node.cloneNode(true));
            });
        } else {
            this.buttonElement.textContent = 'Button';
        }
        
        // Set disabled state
        if (this.disabled) {
            this.buttonElement.disabled = true;
        }
    }

    // Called when attributes change
    attributeChangedCallback(name, oldValue, newValue) {
        if (!this.initialized) return;
        
        switch (name) {
            case 'variant':
            case 'color':
            case 'size':
            case 'class':
                this.updateClasses();
                break;
            case 'disabled':
                this.buttonElement.disabled = this.disabled;
                break;
            case 'loading':
                this.updateClasses();
                break;
        }
    }

    updateClasses() {
        const baseClasses = [
            'upo-button',
            `upo-button-${this.size}`,
            `upo-button-${this.variant}-${this.color}`
        ];
        
        if (this.loading) {
            baseClasses.push('upo-button-loading');
        }
        
        // Get custom classes from the component itself
        const customClasses = Array.from(this.classList);
        
        // Apply base classes first, then custom classes (custom classes will override)
        this.buttonElement.className = baseClasses.join(' ') + ' ' + customClasses.join(' ');
    }
    
    // Forward common methods to the internal button
    focus() {
        this.buttonElement.focus();
    }
    
    blur() {
        this.buttonElement.blur();
    }
    
    click() {
        this.buttonElement.click();
    }
}

    customElements.define('ui-button', Button);
export default Button; 