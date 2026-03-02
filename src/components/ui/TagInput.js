/**
 * Tag Input Component
 * 
 * A tag input component that allows users to add and remove tags with validation.
 * 
 * Attributes:
 * - placeholder: string (default: 'Add tags...') - Placeholder text for input
 * - min-tags: number (default: 0) - Minimum number of tags required
 * - max-tags: number (default: 10) - Maximum number of tags allowed
 * - value: string (default: '') - Initial tags as comma-separated string
 * - disabled: boolean (default: false) - Disable the input
 * - status: 'success' | 'warning' | 'error' | 'info' (default: '') - Validation state
 * 
 * Features:
 * - Add tags by typing and pressing Enter or comma
 * - Remove tags by clicking the X button
 * - Minimum and maximum tag limits
 * - Validation states
 * - Duplicate tag prevention
 * - Tag trimming and validation
 * 
 * Usage:
 * <ui-tag-input></ui-tag-input>
 * <ui-tag-input min-tags="2" max-tags="5" placeholder="Add skills"></ui-tag-input>
 * <ui-tag-input value="tag1,tag2,tag3"></ui-tag-input>
 * <ui-tag-input status="error" placeholder="Required tags"></ui-tag-input>
 */

class TagInput extends HTMLElement {
    constructor() {
        super();
        
        // Create the main container
        this.container = document.createElement('div');
        this.container.className = 'tag-input-container';
        
        // Create the input element
        this.input = document.createElement('input');
        this.input.type = 'text';
        this.input.className = 'tag-input-field';
        
        // Create the tags container
        this.tagsContainer = document.createElement('div');
        this.tagsContainer.className = 'tag-input-tags';
        
        // Add elements to the container
        this.container.appendChild(this.tagsContainer);
        this.container.appendChild(this.input);
        
        // Add the container to the component
        this.appendChild(this.container);
        
        // Initialize tags array
        this.tags = [];
        
        // Flag to prevent double processing
        this.initialized = false;
        
        // Add default styles
        this.addDefaultStyles();
        
        // Set up event listeners
        this.setupEventListeners();
    }
    
    // Add default CSS styles to document if not already added
    addDefaultStyles() {
        if (!document.getElementById('upo-ui-tag-input-styles')) {
            const style = document.createElement('style');
            style.id = 'upo-ui-tag-input-styles';
            style.textContent = `
                .tag-input-container {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 0.5rem;
                    padding: 0.5rem 0.75rem;
                    border: 1px solid #d1d5db;
                    border-radius: 0.375rem;
                    background-color: #ffffff;
                    min-height: 2.5rem;
                    align-items: center;
                    transition: border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out;
                }
                
                .tag-input-container:focus-within {
                    border-color: #3b82f6;
                    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
                }
                
                .tag-input-container:disabled {
                    background-color: #f9fafb;
                    color: #6b7280;
                    cursor: not-allowed;
                }
                
                .tag-input-field {
                    flex: 1;
                    min-width: 120px;
                    border: none;
                    outline: none;
                    background: transparent;
                    font-size: 0.875rem;
                    color: #374151;
                    padding: 0;
                }
                
                .tag-input-field::placeholder {
                    color: #9ca3af;
                }
                
                .tag-input-field:disabled {
                    color: #6b7280;
                    cursor: not-allowed;
                }
                
                .tag-input-tags {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 0.5rem;
                    align-items: center;
                }
                
                .tag-input-tag {
                    display: inline-flex;
                    align-items: center;
                    gap: 0.25rem;
                    padding: 0.25rem 0.5rem;
                    background-color: #e5e7eb;
                    border: 1px solid #d1d5db;
                    border-radius: 0.25rem;
                    font-size: 0.75rem;
                    color: #374151;
                    font-weight: 500;
                    max-width: 200px;
                }
                
                .tag-input-tag .tag-text {
                    overflow: hidden;
                    text-overflow: ellipsis;
                    white-space: nowrap;
                }
                
                .tag-input-tag .tag-remove {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    width: 1rem;
                    height: 1rem;
                    border: none;
                    background: none;
                    color: #6b7280;
                    cursor: pointer;
                    border-radius: 50%;
                    transition: all 0.15s ease-in-out;
                    flex-shrink: 0;
                }
                
                .tag-input-tag .tag-remove:hover {
                    background-color: #d1d5db;
                    color: #374151;
                }
                
                .tag-input-tag .tag-remove svg {
                    width: 0.75rem;
                    height: 0.75rem;
                }
                
                /* Validation status styles */
                .tag-input-success .tag-input-container {
                    border-color: #10b981;
                    box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.1);
                }
                
                .tag-input-warning .tag-input-container {
                    border-color: #f59e0b;
                    box-shadow: 0 0 0 3px rgba(245, 158, 11, 0.1);
                }
                
                .tag-input-error .tag-input-container {
                    border-color: #ef4444;
                    box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
                }
                
                .tag-input-info .tag-input-container {
                    border-color: #3b82f6;
                    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
                }
                
                /* Error message */
                .tag-input-error-message {
                    margin-top: 0.25rem;
                    font-size: 0.75rem;
                    color: #ef4444;
                }
            `;
            document.head.appendChild(style);
        }
    }
    
    // Set up event listeners
    setupEventListeners() {
        // Handle input events
        this.input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ',') {
                e.preventDefault();
                this.addTag();
            } else if (e.key === 'Backspace' && this.input.value === '') {
                // Remove last tag on backspace if input is empty
                this.removeLastTag();
            }
        });
        
        this.input.addEventListener('input', () => {
            // Clear validation state on input
            this.clearValidationState();
        });
        
        // Handle blur event for validation
        this.input.addEventListener('blur', () => {
            this.validateTags();
        });
        
        // Forward events from the internal input to the custom element
        this.input.addEventListener('input', (e) => {
            this.dispatchEvent(new CustomEvent('input', { 
                bubbles: true, 
                detail: { value: this.getValue() } 
            }));
        });
        
        this.input.addEventListener('change', (e) => {
            this.dispatchEvent(new CustomEvent('change', { 
                bubbles: true, 
                detail: { value: this.getValue() } 
            }));
        });
        
        this.input.addEventListener('focus', (e) => {
            this.dispatchEvent(new CustomEvent('focus', { bubbles: true }));
        });
        
        this.input.addEventListener('blur', (e) => {
            this.dispatchEvent(new CustomEvent('blur', { bubbles: true }));
        });
    }
    
    // Connected callback
    connectedCallback() {
        if (this.initialized) return;
        this.initialized = true;
        
        // Get attributes
        this._placeholder = this.getAttribute('placeholder') || 'Add tags...';
        this._minTags = parseInt(this.getAttribute('min-tags')) || 0;
        this._maxTags = parseInt(this.getAttribute('max-tags')) || 10;
        this._disabled = this.hasAttribute('disabled');
        this._status = this.getAttribute('status') || '';
        this._value = this.getAttribute('value') || '';
        
        // Set up the input
        this.setupInput();
        
        // Load initial value
        if (this._value) {
            this.setValue(this._value);
        }
        
        // Apply status
        if (this._status) {
            this.setupStatus();
        }
        
        // Remove attributes from wrapper
        const attributes = this.getAttributeNames();
        attributes.forEach(attr => {
            this.removeAttribute(attr);
        });
    }
    
    // Set up the input
    setupInput() {
        this.input.placeholder = this._placeholder;
        this.input.disabled = this._disabled;
        
        if (this._disabled) {
            this.container.style.pointerEvents = 'none';
        }
    }
    
    // Set up status
    setupStatus() {
        if (['success', 'warning', 'error', 'info'].includes(this._status)) {
            this.classList.add(`tag-input-${this._status}`);
        }
    }
    
    // Add a tag
    addTag() {
        const tagText = this.input.value.trim();
        
        if (!tagText) return;
        
        // Check if tag already exists
        if (this.tags.includes(tagText)) {
            this.showError('Tag already exists');
            return;
        }
        
        // Check max tags limit
        if (this.tags.length >= this._maxTags) {
            this.showError(`Maximum ${this._maxTags} tags allowed`);
            return;
        }
        
        // Add the tag
        this.tags.push(tagText);
        this.renderTags();
        this.input.value = '';
        this.validateTags();
        
        // Dispatch change event
        this.dispatchEvent(new CustomEvent('change', { 
            bubbles: true, 
            detail: { value: this.getValue() } 
        }));
    }
    
    // Remove a tag
    removeTag(tagText) {
        const index = this.tags.indexOf(tagText);
        if (index > -1) {
            this.tags.splice(index, 1);
            this.renderTags();
            this.validateTags();
            
            // Dispatch change event
            this.dispatchEvent(new CustomEvent('change', { 
                bubbles: true, 
                detail: { value: this.getValue() } 
            }));
        }
    }
    
    // Remove last tag
    removeLastTag() {
        if (this.tags.length > 0) {
            this.removeTag(this.tags[this.tags.length - 1]);
        }
    }
    
    // Render tags
    renderTags() {
        this.tagsContainer.innerHTML = '';
        
        this.tags.forEach(tag => {
            const tagElement = document.createElement('div');
            tagElement.className = 'tag-input-tag';
            tagElement.innerHTML = `
                <span class="tag-text">${this.escapeHtml(tag)}</span>
                <button type="button" class="tag-remove" aria-label="Remove tag">
                    <svg fill="currentColor" viewBox="0 0 24 24">
                        <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                    </svg>
                </button>
            `;
            
            // Add remove event listener
            const removeBtn = tagElement.querySelector('.tag-remove');
            removeBtn.addEventListener('click', () => {
                this.removeTag(tag);
            });
            
            this.tagsContainer.appendChild(tagElement);
        });
    }
    
    // Validate tags
    validateTags() {
        this.clearValidationState();
        
        if (this.tags.length < this._minTags) {
            this.showError(`Minimum ${this._minTags} tags required`);
            return false;
        }
        
        return true;
    }
    
    // Show error
    showError(message) {
        this.classList.add('tag-input-error');
        
        // Remove existing error message
        const existingError = this.querySelector('.tag-input-error-message');
        if (existingError) {
            existingError.remove();
        }
        
        // Add error message
        const errorElement = document.createElement('div');
        errorElement.className = 'tag-input-error-message';
        errorElement.textContent = message;
        this.appendChild(errorElement);
    }
    
    // Clear validation state
    clearValidationState() {
        this.classList.remove('tag-input-error');
        const errorElement = this.querySelector('.tag-input-error-message');
        if (errorElement) {
            errorElement.remove();
        }
    }
    
    // Escape HTML
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    // Get value as comma-separated string
    getValue() {
        return this.tags.join(',');
    }
    
    // Set value from comma-separated string
    setValue(value) {
        if (typeof value === 'string') {
            this.tags = value.split(',').map(tag => tag.trim()).filter(tag => tag);
        } else if (Array.isArray(value)) {
            this.tags = [...value];
        } else {
            this.tags = [];
        }
        this.renderTags();
        this.validateTags();
    }
    
    // Getter methods
    get placeholder() {
        return this._placeholder || '';
    }
    
    get minTags() {
        return this._minTags || 0;
    }
    
    get maxTags() {
        return this._maxTags || 10;
    }
    
    get disabled() {
        return this._disabled || false;
    }
    
    get status() {
        return this._status || '';
    }
    
    // Value getter/setter
    get value() {
        return this.getValue();
    }
    
    set value(val) {
        this.setValue(val);
    }
    
    // Focus method
    focus() {
        this.input.focus();
    }
    
    // Blur method
    blur() {
        this.input.blur();
    }
}

customElements.define('ui-tag-input', TagInput);
export default TagInput; 