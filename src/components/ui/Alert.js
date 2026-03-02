/**
 * Alert Component
 * 
 * Displays a callout for user attention. Supports different types:
 * - info (default)
 * - success
 * - warning
 * - error
 * 
 * Attributes:
 * - type: 'info' | 'success' | 'warning' | 'error'
 * - dismissible: boolean (shows close button)
 * - title: optional title text
 * 
 * Usage:
 * <ui-alert type="error" title="Error">Something went wrong!</ui-alert>
 * <ui-alert type="success" dismissible>Operation completed successfully</ui-alert>
 */
class Alert extends HTMLElement {
    constructor() {
        super();
        
        // Create the alert div element directly (no shadow DOM)
        this.alertDiv = document.createElement('div');
        
        // Flag to prevent double processing
        this.initialized = false;
        this.dismissed = false;
        
        // Add the alert div to the component
        this.appendChild(this.alertDiv);
        
        // Add default styles via CSS
        this.addDefaultStyles();
    }

    // Add default CSS styles to document if not already added
    addDefaultStyles() {
        if (!document.getElementById('upo-ui-alert-styles')) {
            const style = document.createElement('style');
            style.id = 'upo-ui-alert-styles';
            style.textContent = `
                .upo-alert-info {
                    display: flex;
                    align-items: start;
                    justify-content: center;
                    gap: 0.5rem;
                    margin: 0 auto;
                    padding: 1rem;
                    border: 1px solid #bfdbfe;
                    border-radius: 0.375rem;
                    background-color: #eff6ff;
                    color: #1e40af;
                }
                .upo-alert-success {
                    display: flex;
                    align-items: start;
                    justify-content: center;
                    gap: 0.5rem;
                    margin: 0 auto;
                    padding: 1rem;
                    border: 1px solid #bbf7d0;
                    border-radius: 0.375rem;
                    background-color: #f0fdf4;
                    color: #166534;
                }
                .upo-alert-warning {
                    display: flex;
                    align-items: start;
                    justify-content: center;
                    gap: 0.5rem;
                    margin: 0 auto;
                    padding: 1rem;
                    border: 1px solid #fde68a;
                    border-radius: 0.375rem;
                    background-color: #fffbeb;
                    color: #92400e;
                }
                .upo-alert-error {
                    display: flex;
                    align-items: start;
                    justify-content: center;
                    gap: 0.5rem;
                    margin: 0 auto;
                    padding: 1rem;
                    border: 1px solid #fecaca;
                    border-radius: 0.375rem;
                    background-color: #fef2f2;
                    color: #dc2626;
                }
                .upo-alert-icon {
                    flex-shrink: 0;
                    width: 1.25rem;
                    height: 1.25rem;
                }
                .upo-alert-icon-info { color: #3b82f6; }
                .upo-alert-icon-success { color: #10b981; }
                .upo-alert-icon-warning { color: #f59e0b; }
                .upo-alert-icon-error { color: #ef4444; }
                .upo-alert-content {
                    margin-left: 0.75rem;
                    flex: 1;
                    margin: 0 auto;
                }
                .upo-alert-title {
                    font-size: 0.875rem;
                    font-weight: 500;
                }
                .upo-alert-message {
                    font-size: 0.875rem;
                }
                .upo-alert-dismiss {
                    margin-left: auto;
                    padding-left: 0.75rem;
                }
                .upo-alert-dismiss button {
                    display: inline-flex;
                    border-radius: 0.375rem;
                    padding: 2px;
                    background: transparent;
                    border: none;
                    cursor: pointer;
                    opacity: 0.7;
                    transition: all 0.15s ease-in-out;
                }
                .upo-alert-dismiss button:hover {
                    opacity: 1;
                    background-color: rgba(0, 0, 0, 0.1);
                }
                .upo-alert-dismiss button:focus {
                    outline: 2px solid currentColor;
                    outline-offset: 2px;
                }
            `;
            document.head.appendChild(style);
        }
    }

    static get observedAttributes() {
        return ['type', 'dismissible', 'title'];
    }

    get type() {
        return this.getAttribute('type') || 'info';
    }

    get dismissible() {
        return this.hasAttribute('dismissible');
    }

    get title() {
        return this.getAttribute('title') || '';
    }

    getIconSvg() {
        const icons = {
            info: `<path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z" clip-rule="evenodd" />`,
            success: `<path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.236 4.53L8.073 10.5a.75.75 0 00-1.146 1l2.128 2.5a.75.75 0 001.18-.062l3.857-5.395z" clip-rule="evenodd" />`,
            warning: `<path fill-rule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clip-rule="evenodd" />`,
            error: `<path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clip-rule="evenodd" />`
        };
        
        return icons[this.type] || icons.info;
    }

    dismiss() {
        this.dismissed = true;
        this.style.display = 'none';
        
        // Dispatch custom event
        this.dispatchEvent(new CustomEvent('alert-dismissed', {
            bubbles: true,
            detail: { type: this.type }
        }));
    }

    // Connected callback - called when element is added to DOM
    connectedCallback() {
        // Prevent double processing
        if (this.initialized) return;
        this.initialized = true;

        // Store original content before building the alert
        const originalContent = Array.from(this.childNodes)
            .filter(node => node !== this.alertDiv)
            .map(node => node.textContent || '')
            .join('').trim();

        // Move any existing children (except our alertDiv) to avoid duplication
        const children = Array.from(this.childNodes);
        children.forEach(child => {
            if (child !== this.alertDiv) {
                this.removeChild(child);
            }
        });

        // Build the alert content
        const iconSvg = this.getIconSvg();
        this.alertDiv.className = `upo-alert-${this.type}`;
        this.alertDiv.innerHTML = `
            <svg class="upo-alert-icon upo-alert-icon-${this.type}" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                ${iconSvg}
            </svg>
            <div class="upo-alert-content">
                ${this.title ? `<div class="upo-alert-title">${this.title}</div>` : ''}
                <div class="upo-alert-message">${originalContent}</div>
            </div>
            ${this.dismissible ? `
                <div class="upo-alert-dismiss">
                    <button type="button" onclick="this.closest('ui-alert').dismiss()" aria-label="Dismiss alert">
                        <svg class="upo-alert-icon" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
                        </svg>
                    </button>
                </div>
            ` : ''}
        `;
    }

    // Called when attributes change
    attributeChangedCallback() {
        if (this.initialized) {
            // Re-render when attributes change
            const iconSvg = this.getIconSvg();
            const messageContent = this.alertDiv.querySelector('.upo-alert-message');
            const originalContent = messageContent ? messageContent.textContent : '';
            
            this.alertDiv.className = `upo-alert-${this.type}`;
            this.alertDiv.innerHTML = `
                <svg class="upo-alert-icon upo-alert-icon-${this.type}" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    ${iconSvg}
                </svg>
                <div class="upo-alert-content">
                    ${this.title ? `<div class="upo-alert-title">${this.title}</div>` : ''}
                    <div class="upo-alert-message">${originalContent}</div>
                </div>
                ${this.dismissible ? `
                    <div class="upo-alert-dismiss">
                        <button type="button" onclick="this.closest('ui-alert').dismiss()" aria-label="Dismiss alert">
                            <svg class="upo-alert-icon" viewBox="0 0 20 20" fill="currentColor">
                                <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
                            </svg>
                        </button>
                    </div>
                ` : ''}
            `;
        }
    }
}

customElements.define('ui-alert', Alert);
export default Alert; 