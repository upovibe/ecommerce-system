/**
 * Badge Component
 * 
 * Displays small status indicators for notifications, labels, and status indicators.
 * Supports different colors, sizes, and variants.
 * 
 * Attributes:
 * - color: 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info'
 * - size: 'sm' | 'md' | 'lg' (default: 'md')
 * - variant: 'solid' | 'outline' | 'soft' (default: 'solid')
 * - rounded: boolean (default: false)
 * 
 * Usage:
 * <ui-badge>Default</ui-badge>
 * <ui-badge color="success" size="sm">New</ui-badge>
 * <ui-badge color="error" variant="outline">Error</ui-badge>
 */
class Badge extends HTMLElement {
    constructor() {
        super();
        
        // Create the badge element directly (no shadow DOM)
        this.badgeElement = document.createElement('span');
        
        // Flag to prevent double processing
        this.initialized = false;
        
        // Add the badge element to the component
        this.appendChild(this.badgeElement);
        
        // Add default styles via CSS
        this.addDefaultStyles();
    }

    // Add default CSS styles to document if not already added
    addDefaultStyles() {
        if (!document.getElementById('upo-ui-badge-styles')) {
            const style = document.createElement('style');
            style.id = 'upo-ui-badge-styles';
            style.textContent = `
                .upo-badge {
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    font-weight: 500;
                    font-size: 0.75rem;
                    line-height: 1;
                    border-radius: 0.375rem;
                    padding: 0.25rem 0.5rem;
                    white-space: nowrap;
                    transition: all 0.2s ease-in-out;
                }
                
                /* Sizes */
                .upo-badge-sm {
                    font-size: 0.625rem;
                    padding: 0.125rem 0.375rem;
                }
                
                .upo-badge-md {
                    font-size: 0.75rem;
                    padding: 0.25rem 0.5rem;
                }
                
                .upo-badge-lg {
                    font-size: 0.875rem;
                    padding: 0.375rem 0.75rem;
                }
                
                /* Rounded variant */
                .upo-badge-rounded {
                    border-radius: 9999px;
                }
                
                /* Solid variants */
                .upo-badge-solid-primary {
                    background-color: #3b82f6;
                    color: #ffffff;
                }
                
                .upo-badge-solid-secondary {
                    background-color: #6b7280;
                    color: #ffffff;
                }
                
                .upo-badge-solid-success {
                    background-color: #10b981;
                    color: #ffffff;
                }
                
                .upo-badge-solid-warning {
                    background-color: #f59e0b;
                    color: #ffffff;
                }
                
                .upo-badge-solid-error {
                    background-color: #ef4444;
                    color: #ffffff;
                }
                
                .upo-badge-solid-info {
                    background-color: #06b6d4;
                    color: #ffffff;
                }
                
                /* Outline variants */
                .upo-badge-outline-primary {
                    background-color: transparent;
                    color: #3b82f6;
                    border: 1px solid #3b82f6;
                }
                
                .upo-badge-outline-secondary {
                    background-color: transparent;
                    color: #6b7280;
                    border: 1px solid #6b7280;
                }
                
                .upo-badge-outline-success {
                    background-color: transparent;
                    color: #10b981;
                    border: 1px solid #10b981;
                }
                
                .upo-badge-outline-warning {
                    background-color: transparent;
                    color: #f59e0b;
                    border: 1px solid #f59e0b;
                }
                
                .upo-badge-outline-error {
                    background-color: transparent;
                    color: #ef4444;
                    border: 1px solid #ef4444;
                }
                
                .upo-badge-outline-info {
                    background-color: transparent;
                    color: #06b6d4;
                    border: 1px solid #06b6d4;
                }
                
                /* Soft variants */
                .upo-badge-soft-primary {
                    background-color: #dbeafe;
                    color: #1e40af;
                }
                
                .upo-badge-soft-secondary {
                    background-color: #f3f4f6;
                    color: #374151;
                }
                
                .upo-badge-soft-success {
                    background-color: #dcfce7;
                    color: #166534;
                }
                
                .upo-badge-soft-warning {
                    background-color: #fef3c7;
                    color: #92400e;
                }
                
                .upo-badge-soft-error {
                    background-color: #fee2e2;
                    color: #dc2626;
                }
                
                .upo-badge-soft-info {
                    background-color: #cffafe;
                    color: #0e7490;
                }
            `;
            document.head.appendChild(style);
        }
    }

    static get observedAttributes() {
        return ['color', 'size', 'variant', 'rounded'];
    }

    get color() {
        return this.getAttribute('color') || 'primary';
    }

    get size() {
        return this.getAttribute('size') || 'md';
    }

    get variant() {
        return this.getAttribute('variant') || 'solid';
    }

    get rounded() {
        return this.hasAttribute('rounded');
    }

    // Connected callback - called when element is added to DOM
    connectedCallback() {
        // Prevent double processing
        if (this.initialized) return;
        this.initialized = true;

        // Store original content before building the badge (preserve HTML)
        const originalContent = Array.from(this.childNodes)
            .filter(node => node !== this.badgeElement)
            .map(node => node.outerHTML || node.textContent || '')
            .join('').trim();

        // Move any existing children (except our badgeElement) to avoid duplication
        const children = Array.from(this.childNodes);
        children.forEach(child => {
            if (child !== this.badgeElement) {
                this.removeChild(child);
            }
        });

        // Set up the badge element
        this.badgeElement.className = `upo-badge upo-badge-${this.size} upo-badge-${this.variant}-${this.color}`;
        
        // Add rounded class if specified
        if (this.rounded) {
            this.badgeElement.classList.add('upo-badge-rounded');
        }
        
        // Set the content from the original content (support HTML)
        this.badgeElement.innerHTML = originalContent || 'Badge';
    }

    // Called when attributes change
    attributeChangedCallback(name, oldValue, newValue) {
        if (!this.initialized) return;
        
        switch (name) {
            case 'color':
                this.updateClasses();
                break;
            case 'size':
                this.updateClasses();
                break;
            case 'variant':
                this.updateClasses();
                break;
            case 'rounded':
                if (this.rounded) {
                    this.badgeElement.classList.add('upo-badge-rounded');
                } else {
                    this.badgeElement.classList.remove('upo-badge-rounded');
                }
                break;
        }
    }

    updateClasses() {
        this.badgeElement.className = `upo-badge upo-badge-${this.size} upo-badge-${this.variant}-${this.color}`;
        if (this.rounded) {
            this.badgeElement.classList.add('upo-badge-rounded');
        }
    }
}

customElements.define('ui-badge', Badge);
export default Badge; 