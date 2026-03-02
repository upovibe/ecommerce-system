/**
 * Dialog Component
 * 
 * A modal dialog component with header, content, and footer sections.
 * 
 * Attributes:
 * - open: boolean (default: false) - controls dialog visibility
 * - title: string - sets the header title
 * - position: string (default: "center") - dialog position: "top", "bottom", "left", "right", "center"
 * - variant: string (default: "default") - button variant: "default", "danger" for delete confirmations
 * - no-footer: boolean - hides default footer buttons when custom footer is provided
 * 
 * Usage:
 * <ui-dialog open title="My Dialog" position="top">
 *   <div slot="content">Dialog content goes here</div>
 *   <div slot="footer">Footer content goes here</div>
 * </ui-dialog>
 */
class Dialog extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.isOpen = this.hasAttribute('open');
    }

    connectedCallback() {
        this.render();
        this.setupEventListeners();
    }

    render() {
        const title = this.getAttribute('title') || 'Dialog';
        const position = this.getAttribute('position') || 'center';
        const variant = this.getAttribute('variant') || 'default';
        const noFooter = this.hasAttribute('no-footer');
        
        this.shadowRoot.innerHTML = `
            <style>
                :host {
                    display: block;
                    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
                }
                
                .dialog-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background-color: rgba(0, 0, 0, 0.5);
                    display: flex;
                    z-index: 1000;
                    opacity: 0;
                    visibility: hidden;
                    transition: opacity 0.3s ease, visibility 0.3s ease;
                }
                
                /* Position variants */
                .dialog-overlay.position-center {
                    align-items: center;
                    justify-content: center;
                }
                
                .dialog-overlay.position-top {
                    align-items: flex-start;
                    justify-content: center;
                    padding-top: 2rem;
                }
                
                .dialog-overlay.position-bottom {
                    align-items: flex-end;
                    justify-content: center;
                    padding-bottom: 2rem;
                }
                
                .dialog-overlay.position-left {
                    align-items: center;
                    justify-content: flex-start;
                    padding-left: 2rem;
                }
                
                .dialog-overlay.position-right {
                    align-items: center;
                    justify-content: flex-end;
                    padding-right: 2rem;
                }
                
                .dialog-overlay.open {
                    opacity: 1;
                    visibility: visible;
                }
                
                .dialog {
                    background: white;
                    border-radius: 0.5rem;
                    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
                    width: 90%;
                    max-width: 500px;
                    max-height: 90vh;
                    display: flex;
                    flex-direction: column;
                    transform: scale(0.95);
                    transition: transform 0.3s ease;
                    min-height: 0;
                }
                
                .dialog-overlay.open .dialog {
                    transform: scale(1);
                }
                
                .dialog-header {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    padding: 1rem 1.5rem;
                    border-bottom: 1px solid #e5e7eb;
                    background-color: #f9fafb;
                    border-radius: 0.5rem 0.5rem 0 0;
                }
                
                .dialog-title {
                    font-size: 1.125rem;
                    font-weight: 600;
                    color: #111827;
                    margin: 0;
                }
                
                .dialog-close {
                    background: none;
                    border: none;
                    color: #6b7280;
                    cursor: pointer;
                    padding: 0.25rem;
                    border-radius: 0.25rem;
                    transition: all 0.15s ease-in-out;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
                
                .dialog-close:hover {
                    background-color: #f3f4f6;
                    color: #374151;
                }
                
                .dialog-close svg {
                    width: 1.25rem;
                    height: 1.25rem;
                }
                
                .dialog-content {
                    padding: 1.5rem;
                    flex: 1;
                    overflow-y: auto;
                    color: #374151;
                    line-height: 1.6;
                    min-height: 0;
                }
                
                .dialog-footer {
                    display: flex;
                    align-items: center;
                    justify-content: flex-end;
                    gap: 0.75rem;
                    padding: 0.75rem 1.5rem;
                    border-top: 1px solid #e5e7eb;
                    background-color: #f9fafb;
                    border-radius: 0 0 0.5rem 0.5rem;
                    flex-shrink: 0;
                    min-height: 20px;
                }
                
                /* Mobile footer safety */
                @media (max-width: 640px) {
                    .dialog-footer {
                        padding: 0.5rem 1rem;
                        padding-bottom: max(0.5rem, env(safe-area-inset-bottom));
                        margin-bottom: env(safe-area-inset-bottom);
                    }
                }
                
                .dialog-footer button {
                    padding: 0.5rem 1rem;
                    font-size: 0.875rem;
                    font-weight: 500;
                    border-radius: 0.375rem;
                    border: 1px solid #d1d5db;
                    background: white;
                    color: #374151;
                    cursor: pointer;
                    transition: all 0.15s ease-in-out;
                }
                
                .dialog-footer button:hover {
                    background-color: #f9fafb;
                    border-color: #9ca3af;
                }
                
                .dialog-footer button.primary {
                    background-color: #3b82f6;
                    border-color: #3b82f6;
                    color: white;
                }
                
                .dialog-footer button.primary:hover {
                    background-color: #2563eb;
                    border-color: #2563eb;
                }
                
                .dialog-footer button.danger {
                    background-color: #ef4444;
                    border-color: #ef4444;
                    color: white;
                }
                
                .dialog-footer button.danger:hover {
                    background-color: #dc2626;
                    border-color: #dc2626;
                }
                
                /* Responsive */
                @media (max-width: 640px) {
                    .dialog {
                        width: 95%;
                        margin: 1rem;
                        max-height: calc(100vh - 2rem);
                        max-height: calc(100dvh - 2rem); /* Use dynamic viewport height for mobile */
                    }
                    
                    .dialog-header,
                    .dialog-content,
                    .dialog-footer {
                        padding: 1rem;
                    }
                    
                    .dialog-content {
                        max-height: calc(100vh - 180px);
                        max-height: calc(100dvh - 180px); /* Use dynamic viewport height for mobile */
                    }
                }
            </style>
            
            <div class="dialog-overlay position-${position} ${this.isOpen ? 'open' : ''}">
                <div class="dialog">
                    <div class="dialog-header">
                        <h2 class="dialog-title">${title}</h2>
                        <button class="dialog-close" id="close-dialog" aria-label="Close dialog">
                            <svg viewBox="0 0 20 20" fill="currentColor">
                                <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
                            </svg>
                        </button>
                    </div>
                    
                    <div class="dialog-content">
                        <slot name="content">
                            <p>Dialog content goes here. Use the <code>content</code> slot to add your content.</p>
                        </slot>
                    </div>
                    
                    <div class="dialog-footer">
                        <slot name="footer">
                            ${noFooter ? '' : `
                                <button class="secondary" id="cancel-btn">Cancel</button>
                                <button class="${variant === 'danger' ? 'danger' : 'primary'}" id="confirm-btn">
                                    ${variant === 'danger' ? 'Delete' : 'Confirm'}
                                </button>
                            `}
                        </slot>
                    </div>
                </div>
            </div>
        `;
    }

    setupEventListeners() {
        const overlay = this.shadowRoot.querySelector('.dialog-overlay');
        const closeBtn = this.shadowRoot.getElementById('close-dialog');
        const cancelBtn = this.shadowRoot.getElementById('cancel-btn');
        const confirmBtn = this.shadowRoot.getElementById('confirm-btn');
        
        // Bind custom footer buttons placed in the light DOM with dialog-action attributes
        if (!this._customFooterBound) {
            this.addEventListener('click', (e) => {
                try {
                    const path = (e.composedPath && e.composedPath()) || [];
                    const actionEl = path.find((el) => el && el.getAttribute && el.getAttribute('dialog-action'));
                    if (!actionEl) return;
                    const action = actionEl.getAttribute('dialog-action');
                    if (action === 'cancel') {
                        e.stopPropagation();
                        this.dispatchEvent(new CustomEvent('cancel', { bubbles: true }));
                        this.close();
                    } else if (action === 'confirm') {
                        e.stopPropagation();
                        this.dispatchEvent(new CustomEvent('confirm', { bubbles: true }));
                        this.close();
                    }
                } catch (_) { /* noop */ }
            });
            this._customFooterBound = true;
        }

        // Overlay click
        if (overlay) {
            overlay.onclick = (e) => {
                if (e.target === overlay) {
                    this.showCloseConfirmation();
                }
            };
        }

        // Close button - using direct onclick like Modal
        if (closeBtn) {
            closeBtn.onclick = (e) => {
                e.stopPropagation();
                this.close();
            };
        }

        // Cancel button
        if (cancelBtn) {
            cancelBtn.onclick = (e) => {
                e.stopPropagation();
                this.dispatchEvent(new CustomEvent('cancel', { bubbles: true }));
                this.close();
            };
        }

        // Confirm button
        if (confirmBtn) {
            confirmBtn.onclick = (e) => {
                e.stopPropagation();
                this.dispatchEvent(new CustomEvent('confirm', { bubbles: true }));
                this.close();
            };
        }

        // Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isOpen) {
                this.showCloseConfirmation();
            }
        });
    }

    showCloseConfirmation() {
        const userWantsToClose = confirm('Do you want to close this dialog?');
        if (userWantsToClose) {
            this.close();
        }
    }

    open() {
        if (this.isOpen) return;
        this.isOpen = true;
        this.setAttribute('open', '');
        
        // Update visual state
        const overlay = this.shadowRoot.querySelector('.dialog-overlay');
        if (overlay) {
            overlay.classList.add('open');
        }
        
        // Dispatch open event
        this.dispatchEvent(new CustomEvent('dialog-open', { bubbles: true }));
    }

    close() {
        if (!this.isOpen) return;
        this.isOpen = false;
        this.removeAttribute('open');
        
        // Update visual state
        const overlay = this.shadowRoot.querySelector('.dialog-overlay');
        if (overlay) {
            overlay.classList.remove('open');
        }
        
        // Dispatch close event
        this.dispatchEvent(new CustomEvent('dialog-close', { bubbles: true }));
    }

    static get observedAttributes() {
        return ['open', 'title', 'position', 'variant', 'no-footer'];
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (name === 'open') {
            const shouldBeOpen = this.hasAttribute('open');
            if (shouldBeOpen && !this.isOpen) {
                this.isOpen = true;
                this.shadowRoot.querySelector('.dialog-overlay').classList.add('open');
                this.dispatchEvent(new CustomEvent('dialog-open', { bubbles: true }));
            } else if (!shouldBeOpen && this.isOpen) {
                this.isOpen = false;
                this.shadowRoot.querySelector('.dialog-overlay').classList.remove('open');
                this.dispatchEvent(new CustomEvent('dialog-close', { bubbles: true }));
            }
        } else if (name === 'title' || name === 'position' || name === 'variant' || name === 'no-footer') {
            this.render();
            this.setupEventListeners();
        }
    }

    // Method to ensure event listeners are set up after render
    ensureEventListeners() {
        // Use setTimeout to ensure DOM is ready
        setTimeout(() => {
            this.setupEventListeners();
        }, 0);
    }
}

customElements.define('ui-dialog', Dialog);
export default Dialog; 