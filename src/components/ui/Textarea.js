/**
 * Textarea Component
 * 
 * A flexible textarea component with validation, styling options, and accessibility features.
 * 
 * Features:
 * - Multiple variants (default, primary, secondary, success, warning, error)
 * - Different sizes (sm, md, lg)
 * - Validation states with error messages
 * - Character count and max length
 * - Placeholder and label support
 * - Floating label animation (same as Input component)
 * - Disabled and readonly states
 * - Auto-resize functionality
 * 
 * Usage:
 * <ui-textarea placeholder="Enter your message"></ui-textarea>
 * <ui-textarea variant="error" error="This field is required"></ui-textarea>
 * <ui-textarea size="lg" maxlength="500" show-count></ui-textarea>
 * <ui-textarea floating-label placeholder="Floating label"></ui-textarea>
 */

class Textarea extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.value = '';
        this.maxLength = null;
        this.showCount = false;
        this.autoResize = false;
        this.hasFloatingLabel = false;
    }

    connectedCallback() {
        this.render();
        this.setupEventListeners();
        this.updateCharacterCount();
        if (this.autoResize) {
            this.adjustHeight();
        }
        this.updateFloatingLabel();
    }

    static get observedAttributes() {
        return [
            'placeholder', 'value', 'disabled', 'readonly', 'maxlength',
            'variant', 'size', 'error', 'label', 'floating-label', 'show-count', 'auto-resize'
        ];
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue !== newValue) {
            switch (name) {
                case 'value':
                    this.value = newValue || '';
                    this.updateTextareaValue();
                    this.updateCharacterCount();
                    this.updateFloatingLabel();
                    break;
                case 'error':
                    this.updateErrorState();
                    break;
                case 'variant':
                case 'size':
                    this.updateStyling();
                    break;
                case 'show-count':
                    this.showCount = this.hasAttribute('show-count');
                    this.updateCharacterCount();
                    break;
                case 'auto-resize':
                    this.autoResize = this.hasAttribute('auto-resize');
                    if (this.autoResize) {
                        this.adjustHeight();
                    }
                    break;
                case 'maxlength':
                    this.maxLength = newValue ? parseInt(newValue) : null;
                    this.updateCharacterCount();
                    break;
                case 'floating-label':
                    this.hasFloatingLabel = !!newValue;
                    this.updateFloatingLabel();
                    break;
            }
        }
    }

    render() {
        const placeholder = this.getAttribute('placeholder') || '';
        const value = this.getAttribute('value') || '';
        const disabled = this.hasAttribute('disabled');
        const readonly = this.hasAttribute('readonly');
        const maxlength = this.getAttribute('maxlength');
        const variant = this.getAttribute('variant') || 'default';
        const size = this.getAttribute('size') || 'md';
        const error = this.getAttribute('error');
        const label = this.getAttribute('label');
        const floatingLabel = this.hasAttribute('floating-label');
        const showCount = this.hasAttribute('show-count');
        const autoResize = this.hasAttribute('auto-resize');

        this.shadowRoot.innerHTML = `
            <style>
                :host {
                    display: block;
                    font-family: inherit;
                }

                .textarea-container {
                    position: relative;
                    width: 100%;
                }

                .textarea-label {
                    display: block;
                    font-size: 0.875rem;
                    font-weight: 500;
                    color: #374151;
                    margin-bottom: 0.5rem;
                }

                .textarea-wrapper {
                    position: relative;
                    width: 100%;
                }

                .textarea {
                    width: 100%;
                    border: 1px solid #d1d5db;
                    border-radius: 0.375rem;
                    font-family: inherit;
                    font-size: 0.875rem;
                    line-height: 1.25rem;
                    padding: 0.75rem;
                    background-color: #ffffff;
                    color: #111827;
                    transition: all 0.2s ease-in-out;
                    resize: vertical;
                    min-height: 2.5rem;
                    box-sizing: border-box;
                }

                .textarea:focus {
                    outline: none;
                    border-color: #3b82f6;
                    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
                }

                .textarea:disabled {
                    background-color: #f9fafb;
                    color: #6b7280;
                    cursor: not-allowed;
                }

                .textarea:read-only {
                    background-color: #f9fafb;
                    color: #6b7280;
                }

                /* Floating label styles - same as Input component */
                .textarea-floating {
                    position: relative;
                    display: inline-block;
                    width: 100%;
                }

                .textarea-floating .textarea {
                    padding-top: 1.25rem;
                    padding-bottom: 0.25rem;
                    padding-left: 0.75rem;
                    padding-right: 0.75rem;
                    font-size: 0.875rem;
                    line-height: 1.25;
                    min-height: 3.5rem;
                }

                .textarea-floating-label {
                    position: absolute;
                    top: 0.75rem;
                    left: 0.75rem;
                    font-size: 0.875rem;
                    color: #6b7280;
                    transition: all 0.15s ease-in-out;
                    pointer-events: none;
                    z-index: 10;
                    background: white;
                    padding: 0 0.25rem;
                }

                .textarea-floating:focus-within .textarea-floating-label,
                .textarea-floating.has-value .textarea-floating-label {
                    top: -0.5rem;
                    font-size: 0.75rem;
                    color: #3b82f6;
                }

                .textarea-floating:focus-within .textarea-floating-label {
                    color: #3b82f6;
                }

                /* Size variants */
                .textarea--sm {
                    font-size: 0.75rem;
                    padding: 0.5rem 0.75rem;
                    min-height: 2rem;
                }

                .textarea--md {
                    font-size: 0.875rem;
                    padding: 0.75rem;
                    min-height: 2.5rem;
                }

                .textarea--lg {
                    font-size: 1rem;
                    padding: 1rem;
                    min-height: 3rem;
                }

                /* Floating label size adjustments */
                .textarea-floating .textarea--sm {
                    padding-top: 1rem;
                    padding-bottom: 0.25rem;
                    min-height: 3rem;
                }

                .textarea-floating .textarea--lg {
                    padding-top: 1.5rem;
                    padding-bottom: 0.25rem;
                    min-height: 4rem;
                }

                /* Variant styles */
                .textarea--default {
                    border-color: #d1d5db;
                }

                .textarea--primary {
                    border-color: #3b82f6;
                }

                .textarea--secondary {
                    border-color: #6b7280;
                }

                .textarea--success {
                    border-color: #10b981;
                }

                .textarea--warning {
                    border-color: #f59e0b;
                }

                .textarea--error {
                    border-color: #ef4444;
                }

                .textarea--error:focus {
                    border-color: #ef4444;
                    box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
                }

                /* Error state */
                .textarea--error {
                    border-color: #ef4444;
                }

                .error-message {
                    display: block;
                    font-size: 0.75rem;
                    color: #ef4444;
                    margin-top: 0.25rem;
                }

                .character-count {
                    display: block;
                    font-size: 0.75rem;
                    color: #6b7280;
                    text-align: right;
                    margin-top: 0.25rem;
                }

                .character-count--error {
                    color: #ef4444;
                }

                /* Auto-resize */
                .textarea--auto-resize {
                    resize: none;
                    overflow: hidden;
                }
            </style>

            <div class="textarea-container">
                ${label && !floatingLabel ? `<label class="textarea-label">${label}</label>` : ''}
                <div class="textarea-wrapper">
                    ${floatingLabel ? `
                        <div class="textarea-floating">
                            <div class="textarea-floating-label">${placeholder}</div>
                            <textarea 
                                class="textarea textarea--${size} textarea--${variant}${autoResize ? ' textarea--auto-resize' : ''}"
                                placeholder=""
                                ${disabled ? 'disabled' : ''}
                                ${readonly ? 'readonly' : ''}
                                ${maxlength ? `maxlength="${maxlength}"` : ''}
                            >${value}</textarea>
                        </div>
                    ` : `
                        <textarea 
                            class="textarea textarea--${size} textarea--${variant}${autoResize ? ' textarea--auto-resize' : ''}"
                            placeholder="${placeholder}"
                            ${disabled ? 'disabled' : ''}
                            ${readonly ? 'readonly' : ''}
                            ${maxlength ? `maxlength="${maxlength}"` : ''}
                        >${value}</textarea>
                    `}
                </div>
                ${error ? `<div class="error-message">${error}</div>` : ''}
                ${showCount ? `<div class="character-count" id="char-count"></div>` : ''}
            </div>
        `;
    }

    setupEventListeners() {
        const textarea = this.shadowRoot.querySelector('textarea');
        const floatingContainer = this.shadowRoot.querySelector('.textarea-floating');
        
        textarea.addEventListener('input', (e) => {
            this.value = e.target.value;
            this.updateCharacterCount();
            this.updateFloatingLabel();
            if (this.autoResize) {
                this.adjustHeight();
            }
            this.dispatchEvent(new CustomEvent('input', { detail: { value: this.value } }));
        });

        textarea.addEventListener('change', (e) => {
            this.dispatchEvent(new CustomEvent('change', { detail: { value: this.value } }));
        });

        textarea.addEventListener('focus', () => {
            this.updateFloatingLabel();
            this.dispatchEvent(new CustomEvent('focus'));
        });

        textarea.addEventListener('blur', () => {
            this.updateFloatingLabel();
            this.dispatchEvent(new CustomEvent('blur'));
        });
    }

    updateTextareaValue() {
        const textarea = this.shadowRoot.querySelector('textarea');
        if (textarea) {
            textarea.value = this.value;
        }
    }

    updateCharacterCount() {
        const charCount = this.shadowRoot.querySelector('#char-count');
        if (charCount && this.showCount) {
            const currentLength = this.value.length;
            const maxLength = this.maxLength;
            
            if (maxLength) {
                charCount.textContent = `${currentLength}/${maxLength}`;
                charCount.classList.toggle('character-count--error', currentLength > maxLength);
            } else {
                charCount.textContent = `${currentLength} characters`;
            }
        }
    }

    updateFloatingLabel() {
        const floatingContainer = this.shadowRoot.querySelector('.textarea-floating');
        const textarea = this.shadowRoot.querySelector('textarea');
        
        if (floatingContainer && textarea) {
            const hasValue = this.value.length > 0;
            const isFocused = textarea.matches(':focus');
            
            // Remove has-value class
            floatingContainer.classList.remove('has-value');
            
            // Add has-value class if has value or is focused
            if (hasValue || isFocused) {
                floatingContainer.classList.add('has-value');
            }
        }
    }

    updateErrorState() {
        const error = this.getAttribute('error');
        const textarea = this.shadowRoot.querySelector('textarea');
        const errorMessage = this.shadowRoot.querySelector('.error-message');
        
        if (textarea) {
            textarea.classList.toggle('textarea--error', !!error);
        }
        
        if (errorMessage) {
            errorMessage.textContent = error || '';
        }
    }

    updateStyling() {
        const textarea = this.shadowRoot.querySelector('textarea');
        if (textarea) {
            const variant = this.getAttribute('variant') || 'default';
            const size = this.getAttribute('size') || 'md';
            
            // Remove all variant and size classes
            textarea.className = textarea.className.replace(/textarea--(default|primary|secondary|success|warning|error)/g, '');
            textarea.className = textarea.className.replace(/textarea--(sm|md|lg)/g, '');
            
            // Add new classes
            textarea.classList.add(`textarea--${variant}`, `textarea--${size}`);
        }
    }

    adjustHeight() {
        const textarea = this.shadowRoot.querySelector('textarea');
        if (textarea) {
            textarea.style.height = 'auto';
            textarea.style.height = textarea.scrollHeight + 'px';
        }
    }

    // Public methods
    getValue() {
        return this.value;
    }

    setValue(value) {
        this.value = value;
        this.setAttribute('value', value);
        this.updateTextareaValue();
        this.updateCharacterCount();
        this.updateFloatingLabel();
    }

    focus() {
        const textarea = this.shadowRoot.querySelector('textarea');
        if (textarea) {
            textarea.focus();
        }
    }

    blur() {
        const textarea = this.shadowRoot.querySelector('textarea');
        if (textarea) {
            textarea.blur();
        }
    }

    setError(message) {
        this.setAttribute('error', message);
    }

    clearError() {
        this.removeAttribute('error');
    }
}

customElements.define('ui-textarea', Textarea);
export default Textarea; 