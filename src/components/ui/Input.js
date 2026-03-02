/**
 * Input Component
 * 
 * A versatile input component that supports various input types with enhanced functionality.
 * Based on shadcn/ui input design pattern.
 * 
 * Attributes:
 * - type: 'text' | 'password' | 'email' | 'number' | 'date' | 'datetime-local' | 'time' | 'search' | 'color' (default: 'text')
 * - placeholder: string (default: '')
 * - value: string (default: '')
 * - disabled: boolean (default: false)
 * - prefix: string (default: '') - Text or symbol to show before input
 * - suffix: string (default: '') - Text or symbol to show after input
 * - leading-icon: string (default: '') - SVG icon to show before input
 * - trailing-icon: string (default: '') - SVG icon to show after input
 * - floating-label: boolean (default: false) - Enable floating label behavior
 * - status: 'success' | 'warning' | 'error' | 'info' (default: '') - Validation state
 * 
 * Features:
 * - Password inputs have toggle visibility
 * - Email inputs have validation
 * - Number inputs use native browser controls
 * - Search inputs have search icon
 * - Date/time inputs use native browser picker
 * - Color inputs use native browser color picker
 * - Prefix and suffix support
 * - Leading and trailing icons
 * - Floating labels
 * - Validation states with visual indicators
 * 
 * Usage:
 * <ui-input></ui-input>
 * <ui-input prefix="$" placeholder="Amount"></ui-input>
 * <ui-input suffix="%" placeholder="Percentage"></ui-input>
 * <ui-input leading-icon="<svg>...</svg>" placeholder="With icon"></ui-input>
 * <ui-input floating-label placeholder="Floating label"></ui-input>
 * <ui-input type="password"></ui-input>
 * <ui-input type="email"></ui-input>
 * <ui-input type="number"></ui-input>
 * <ui-input type="date"></ui-input>
 * <ui-input type="datetime-local"></ui-input>
 * <ui-input type="time"></ui-input>
 * <ui-input type="search"></ui-input>
 * <ui-input type="color"></ui-input>
 * <ui-input status="success" placeholder="Success state"></ui-input>
 * <ui-input status="warning" placeholder="Warning state"></ui-input>
 * <ui-input status="error" placeholder="Error state"></ui-input>
 * <ui-input status="info" placeholder="Info state"></ui-input>
 */

class Input extends HTMLElement {
    constructor() {
        super();
        
        // Create the input element directly (no shadow DOM)
        this.input = document.createElement('input');
        
        // Add the input to the component
        this.appendChild(this.input);
        
        // Flag to prevent double processing
        this.initialized = false;
        
        // Add default styles via CSS
        this.addDefaultStyles();
        
        // Forward events from the internal input to the custom element
        this.input.addEventListener('input', (e) => {
            // Don't dispatch input events if the input is disabled or readonly
            if (this.input.disabled || this.input.readOnly) {
                e.preventDefault();
                return;
            }
            this.dispatchEvent(new CustomEvent('input', { 
                bubbles: true, 
                detail: { value: e.target.value } 
            }));
        });
        
        this.input.addEventListener('change', (e) => {
            this.dispatchEvent(new CustomEvent('change', { 
                bubbles: true, 
                detail: { value: e.target.value } 
            }));
        });
        
        this.input.addEventListener('focus', (e) => {
            // Prevent focus if the input is disabled
            if (this.input.disabled) {
                e.preventDefault();
                this.input.blur();
                return;
            }
            this.dispatchEvent(new CustomEvent('focus', { bubbles: true }));
        });
        
        this.input.addEventListener('blur', (e) => {
            this.dispatchEvent(new CustomEvent('blur', { bubbles: true }));
        });
        
        // Prevent keydown events on disabled/readonly inputs
        this.input.addEventListener('keydown', (e) => {
            if (this.input.disabled || this.input.readOnly) {
                e.preventDefault();
                return;
            }
        });
        
        // Prevent paste events on disabled/readonly inputs
        this.input.addEventListener('paste', (e) => {
            if (this.input.disabled || this.input.readOnly) {
                e.preventDefault();
                return;
            }
        });
        
        // Prevent cut events on disabled/readonly inputs
        this.input.addEventListener('cut', (e) => {
            if (this.input.disabled || this.input.readOnly) {
                e.preventDefault();
                return;
            }
        });
        
        // Prevent context menu on disabled/readonly inputs
        this.input.addEventListener('contextmenu', (e) => {
            if (this.input.disabled || this.input.readOnly) {
                e.preventDefault();
                return;
            }
        });
    }
    
    // Add default CSS styles to document if not already added
    addDefaultStyles() {
        if (!document.getElementById('upo-ui-input-styles')) {
            const style = document.createElement('style');
            style.id = 'upo-ui-input-styles';
            style.textContent = `
                .upo-input-default {
                    display: block;
                    width: 100%;
                    padding: 0.5rem 0.75rem;
                    font-size: 0.875rem;
                    line-height: 1.25;
                    color: #374151;
                    background-color: #ffffff;
                    border: 1px solid #d1d5db;
                    border-radius: 0.375rem;
                    box-sizing: border-box;
                    transition: border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out;
                }
                .upo-input-default:focus {
                    outline: none;
                    border-color: #3b82f6;
                    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
                }
                .upo-input-default:disabled {
                    background-color: #f9fafb;
                    color: #6b7280;
                    cursor: not-allowed;
                }
                .upo-input-default::placeholder {
                    color: #9ca3af;
                }
                
                /* Search input styles */
                .upo-input-search {
                    position: relative;
                    display: inline-block;
                    width: 100%;
                }
                
                .upo-input-search .upo-input-default {
                    padding-left: 2.5rem;
                    padding-right: 0.75rem;
                }
                
                .upo-input-search .search-icon {
                    position: absolute;
                    left: 0.75rem;
                    top: 50%;
                    transform: translateY(-50%);
                    color: #9ca3af;
                    pointer-events: none;
                    width: 1rem;
                    height: 1rem;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
                
                .upo-input-search .search-icon svg {
                    width: 100%;
                    height: 100%;
                }
                
                .upo-input-search:focus-within .search-icon {
                    color: #3b82f6;
                }
                
                /* Password input styles - fix icon positioning */
                .upo-input-password {
                    position: relative;
                    display: inline-block;
                    width: 100%;
                }
                
                .upo-input-password .upo-input-default {
                    padding-right: 2.5rem;
                }
                
                .upo-input-password .toggle-password {
                    position: absolute;
                    right: 0.75rem;
                    top: 50%;
                    transform: translateY(-50%);
                    color: #9ca3af;
                    cursor: pointer;
                    transition: color 0.15s ease-in-out;
                    z-index: 10;
                    width: 1rem;
                    height: 1rem;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: none;
                    border: none;
                    padding: 0;
                    margin: 0;
                }
                
                .upo-input-password .toggle-password svg {
                    width: 100%;
                    height: 100%;
                }
                
                .upo-input-password .toggle-password:hover {
                    color: #374151;
                }
                
                .upo-input-password:focus-within .toggle-password {
                    color: #3b82f6;
                }
                
                /* Email input validation styles */
                .upo-input-email.upo-input-invalid .upo-input-default {
                    border-color: #ef4444;
                    box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
                }
                
                .upo-input-email.upo-input-valid .upo-input-default {
                    border-color: #10b981;
                    box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.1);
                }
                
                /* Input with prefix/suffix styles */
                .upo-input-with-prefix,
                .upo-input-with-suffix {
                    position: relative;
                    display: inline-block;
                    width: 100%;
                }
                
                .upo-input-with-prefix .upo-input-default {
                    padding-left: 2.5rem;
                }
                
                .upo-input-with-suffix .upo-input-default {
                    padding-right: 2.5rem;
                }
                
                .upo-input-prefix,
                .upo-input-suffix {
                    position: absolute;
                    top: 50%;
                    transform: translateY(-50%);
                    color: #6b7280;
                    font-size: 0.875rem;
                    font-weight: 500;
                    pointer-events: none;
                    z-index: 10;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
                
                .upo-input-prefix {
                    left: 0.75rem;
                }
                
                .upo-input-suffix {
                    right: 0.75rem;
                }
                
                /* FontAwesome icon support in prefix/suffix */
                .upo-input-prefix i,
                .upo-input-suffix i {
                    font-size: 0.875rem;
                    width: 1rem;
                    height: 1rem;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
                
                /* Input with icons styles */
                .upo-input-with-leading-icon,
                .upo-input-with-trailing-icon {
                    position: relative;
                    display: inline-block;
                    width: 100%;
                }
                
                .upo-input-with-leading-icon .upo-input-default {
                    padding-left: 2.5rem;
                }
                
                .upo-input-with-trailing-icon .upo-input-default {
                    padding-right: 2.5rem;
                }
                
                .upo-input-leading-icon,
                .upo-input-trailing-icon {
                    position: absolute;
                    top: 50%;
                    transform: translateY(-50%);
                    color: #6b7280;
                    pointer-events: none;
                    z-index: 10;
                    width: 1rem;
                    height: 1rem;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
                
                .upo-input-leading-icon {
                    left: 0.75rem;
                }
                
                .upo-input-trailing-icon {
                    right: 0.75rem;
                }
                
                .upo-input-leading-icon svg,
                .upo-input-trailing-icon svg {
                    width: 100%;
                    height: 100%;
                }
                
                /* Floating label styles */
                .upo-input-floating {
                    position: relative;
                    display: inline-block;
                    width: 100%;
                }
                
                .upo-input-floating .upo-input-default {
                    padding-top: 1.25rem;
                    padding-bottom: 0.25rem;
                    padding-left: 0.75rem;
                    padding-right: 0.75rem;
                    font-size: 0.875rem;
                    line-height: 1.25;
                }
                
                .upo-input-floating-label {
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
                
                .upo-input-floating:focus-within .upo-input-floating-label,
                .upo-input-floating.has-value .upo-input-floating-label {
                    top: -0.5rem;
                    font-size: 0.75rem;
                    color: #3b82f6;
                }
                
                .upo-input-floating:focus-within .upo-input-floating-label {
                    color: #3b82f6;
                }
                
                /* Password input styles */
                .upo-input-password {
                    position: relative;
                    display: inline-block;
                    width: 100%;
                }
                
                .upo-input-password .upo-input-default {
                    padding-right: 2.5rem;
                }
                
                .upo-input-password .toggle-password {
                    position: absolute;
                    right: 0.75rem;
                    top: 50%;
                    transform: translateY(-50%);
                    color: #9ca3af;
                    cursor: pointer;
                    transition: color 0.15s ease-in-out;
                    z-index: 10;
                    width: 1rem;
                    height: 1rem;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: none;
                    border: none;
                    padding: 0;
                    margin: 0;
                }
                
                .upo-input-password .toggle-password svg {
                    width: 100%;
                    height: 100%;
                }
                
                .upo-input-password .toggle-password:hover {
                    color: #374151;
                }
                
                .upo-input-password:focus-within .toggle-password {
                    color: #3b82f6;
                }

                /* Validation status styles */
                .upo-input-success .upo-input-default {
                    border-color: #10b981;
                    box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.1);
                }
                .upo-input-warning .upo-input-default {
                    border-color: #f59e0b;
                    box-shadow: 0 0 0 3px rgba(245, 158, 11, 0.1);
                }
                .upo-input-error .upo-input-default {
                    border-color: #ef4444;
                    box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
                }
                .upo-input-info .upo-input-default {
                    border-color: #3b82f6;
                    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
                }

                /* Color input styles */
                .upo-input-color {
                    position: relative;
                    display: inline-block;
                    width: 100%;
                }
                
                .upo-input-color .color-preview {
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                    padding: 0.5rem 0.75rem;
                    border: 1px solid #d1d5db;
                    border-radius: 0.375rem;
                    background-color: #ffffff;
                    cursor: pointer;
                    transition: border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out;
                    position: relative;
                    z-index: 2;
                }
                
                .upo-input-color .color-preview:hover {
                    border-color: #9ca3af;
                }
                
                .upo-input-color .color-preview:focus-within {
                    border-color: #3b82f6;
                    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
                }
                
                .upo-input-color .color-swatch {
                    width: 2rem;
                    height: 2rem;
                    border-radius: 0.375rem;
                    border: 2px solid #d1d5db;
                    background-color: #000000;
                    flex-shrink: 0;
                }
                
                .upo-input-color .color-value {
                    font-size: 0.875rem;
                    color: #374151;
                    font-weight: 500;
                    font-family: 'Courier New', monospace;
                }
            `;
            document.head.appendChild(style);
        }
    }
    
    // Connected callback - called when element is added to DOM
    static get observedAttributes() {
        return ['value', 'placeholder', 'type', 'disabled', 'readonly', 'prefix', 'suffix', 'leading-icon', 'trailing-icon', 'floating-label', 'status'];
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue !== newValue) {
            switch (name) {
                case 'value':
                    if (this.input) {
                        this.input.value = newValue || '';
                    }
                    break;
                case 'placeholder':
                    if (this.input) {
                        this.input.placeholder = newValue || '';
                    }
                    break;
                case 'type':
                    if (this.input) {
                        this.input.type = newValue || 'text';
                    }
                    break;
                case 'disabled':
                    if (this.input) {
                        if (newValue !== null) {
                            this.input.disabled = true;
                        } else {
                            this.input.disabled = false;
                        }
                    }
                    break;
                case 'readonly':
                    if (this.input) {
                        if (newValue !== null) {
                            this.input.readOnly = true;
                        } else {
                            this.input.readOnly = false;
                        }
                    }
                    break;
            }
        }
    }

    connectedCallback() {
        // Prevent double processing
        if (this.initialized) return;
        this.initialized = true;
        
        // Store special attributes before removing them
        this._prefix = this.getAttribute('prefix') || '';
        this._suffix = this.getAttribute('suffix') || '';
        this._leadingIcon = this.getAttribute('leading-icon') || '';
        this._trailingIcon = this.getAttribute('trailing-icon') || '';
        this._floatingLabel = this.hasAttribute('floating-label');
        this._status = this.getAttribute('status') || '';
        
        // Check if user provided classes
        const hasUserClass = this.hasAttribute('class');
        
        // Apply default class to input element
        if (!hasUserClass) {
            this.input.className = 'upo-input-default';
        } else {
            // If user provided classes, add the default class to them
            const userClasses = this.getAttribute('class');
            this.input.className = `upo-input-default ${userClasses}`;
        }
        
        // Transfer all attributes to the internal input
        const attributes = this.getAttributeNames();
        
        attributes.forEach(attr => {
            const value = this.getAttribute(attr);
            if (attr === 'class' && hasUserClass) {
                // Add user classes to the default class
                this.input.className = `upo-input-default ${value}`;
            } else if (attr !== 'class') {
                // Transfer all other attributes except class (already handled)
                this.input.setAttribute(attr, value);
            }
        });
        
        // Remove all attributes from the wrapper to avoid duplication, EXCEPT 'value', 'type', 'data-field', 'readonly', and 'disabled'
        attributes.forEach(attr => {
            if (attr !== 'value' && attr !== 'type' && attr !== 'data-field' && attr !== 'readonly' && attr !== 'disabled') this.removeAttribute(attr);
        });
        
        // Setup input type-specific functionality
        this.setupInputType();
        
        // Setup additional features
        this.setupPrefixSuffix();
        this.setupIcons();
        this.setupLabels();
        this.setupStatus();
    }
    
    // Getter methods for attributes
    get prefix() {
        return this._prefix || '';
    }
    
    get suffix() {
        return this._suffix || '';
    }
    
    get leadingIcon() {
        return this._leadingIcon || '';
    }
    
    get trailingIcon() {
        return this._trailingIcon || '';
    }
    
    get floatingLabel() {
        return this._floatingLabel || false;
    }
    
    get status() {
        return this._status || '';
    }
    
    get type() {
        return this.getAttribute('type') || 'text';
    }
    
    // Setup input type and additional features
    setupInputType() {
        const inputType = this.type;
        
        switch (inputType) {
            case 'search':
                this.setupSearchInput();
                break;
            case 'password':
                this.setupPasswordInput();
                break;
            case 'email':
                this.setupEmailInput();
                break;
            case 'number':
                this.setupNumberInput();
                break;
            case 'date':
            case 'datetime-local':
            case 'time':
                this.setupDateInput();
                break;
            case 'color':
                this.setupColorInput();
                break;
            default:
                // Basic text input - no additional setup needed
                break;
        }
    }
    
    // Setup search input with search icon
    setupSearchInput() {
        this.classList.add('upo-input-search');
        
        // Add search icon
        const icon = document.createElement('div');
        icon.className = 'search-icon';
        icon.innerHTML = '<svg fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/></svg>';
        
        this.appendChild(icon);
    }
    
    // Setup password input with toggle visibility
    setupPasswordInput() {
        this.classList.add('upo-input-password');
        
        // Add toggle password button
        const toggleBtn = document.createElement('button');
        toggleBtn.className = 'toggle-password';
        toggleBtn.type = 'button';
        toggleBtn.setAttribute('aria-label', 'Toggle password visibility');
        toggleBtn.innerHTML = '<svg fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/></svg>';
        
        toggleBtn.addEventListener('click', () => {
            const type = this.input.type === 'password' ? 'text' : 'password';
            this.input.type = type;
            
            // Update icon
            if (type === 'text') {
                toggleBtn.innerHTML = '<svg fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M12 7c2.76 0 5 2.24 5 5 0 .65-.13 1.26-.36 1.83l2.92 2.92c1.51-1.26 2.7-2.89 3.43-4.75-1.73-4.39-6-7.5-11-7.5-1.4 0-2.74.25-3.98.7l2.16 2.16C10.74 7.13 11.35 7 12 7zM2 4.27l2.28 2.28.46.46C3.08 8.3 1.78 10.02 1 12c1.73 4.39 6 7.5 11 7.5 1.55 0 3.03-.3 4.38-.84l.42.42L19.73 22 21 20.73 3.27 3 2 4.27zM7.53 9.8l1.55 1.55c-.05.21-.08.43-.08.65 0 1.66 1.34 3 3 3 .22 0 .44-.03.65-.08l1.55 1.55c-.67.33-1.41.53-2.2.53-2.76 0-5-2.24-5-5 0-.79.2-1.53.53-2.2zm4.31-.78l3.15 3.15.02-.16c0-1.66-1.34-3-3-3l-.17.01z"/></svg>';
            } else {
                toggleBtn.innerHTML = '<svg fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/></svg>';
            }
        });
        
        // Always append to wrapper for consistent positioning
        this.appendChild(toggleBtn);
    }
    
    // Setup email input with validation
    setupEmailInput() {
        this.classList.add('upo-input-email');
        
        // Add email validation
        this.input.addEventListener('blur', () => {
            this.validateEmail();
        });
        
        this.input.addEventListener('input', () => {
            // Clear validation state on input
            this.classList.remove('upo-input-valid', 'upo-input-invalid');
        });
    }
    
    // Validate email format
    validateEmail() {
        const email = this.input.value.trim();
        if (email === '') {
            this.classList.remove('upo-input-valid', 'upo-input-invalid');
            return;
        }
        
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const isValid = emailRegex.test(email);
        
        this.classList.remove('upo-input-valid', 'upo-input-invalid');
        this.classList.add(isValid ? 'upo-input-valid' : 'upo-input-invalid');
    }
    
    // Setup number input with native browser controls
    setupNumberInput() {
        // Use native browser number controls - no custom buttons needed
        // The browser will handle the number input UI automatically
    }
    
    // Setup date/time input with native browser picker
    setupDateInput() {
        // Use native browser date picker - no custom calendar needed
        // The browser will handle the date picker UI automatically
    }

    // Setup color input with native browser color picker
    setupColorInput() {
        this.classList.add('upo-input-color');
        
        // Position the hidden input relative to the wrapper
        this.input.style.position = 'absolute';
        this.input.style.top = '0';
        this.input.style.left = '0';
        this.input.style.width = '100%';
        this.input.style.height = '100%';
        this.input.style.opacity = '0';
        this.input.style.cursor = 'pointer';
        this.input.style.zIndex = '1';
        
        // Create color preview element
        const colorPreview = document.createElement('div');
        colorPreview.className = 'color-preview';
        colorPreview.innerHTML = `
            <div class="color-swatch"></div>
            <span class="color-value">#000000</span>
        `;
        
        // Make preview clickable to open color picker
        colorPreview.addEventListener('click', () => {
            this.input.click();
        });
        
        // Add color preview to the wrapper
        this.appendChild(colorPreview);
        
        // Update color preview when input changes
        this.input.addEventListener('input', () => {
            const color = this.input.value;
            const swatch = colorPreview.querySelector('.color-swatch');
            const value = colorPreview.querySelector('.color-value');
            
            swatch.style.backgroundColor = color;
            value.textContent = color;
        });
        
        // Set initial color if value exists
        if (this.input.value) {
            const swatch = colorPreview.querySelector('.color-swatch');
            const value = colorPreview.querySelector('.color-value');
            swatch.style.backgroundColor = this.input.value;
            value.textContent = this.input.value;
        }
    }
    
    // Setup prefix and suffix
    setupPrefixSuffix() {
        if (this.prefix) {
            this.classList.add('upo-input-with-prefix');
            const prefixEl = document.createElement('div');
            prefixEl.className = 'upo-input-prefix';
            prefixEl.innerHTML = this.prefix; // Use innerHTML to support HTML content like FontAwesome icons
            this.appendChild(prefixEl);
        }
        
        if (this.suffix) {
            this.classList.add('upo-input-with-suffix');
            const suffixEl = document.createElement('div');
            suffixEl.className = 'upo-input-suffix';
            suffixEl.innerHTML = this.suffix; // Use innerHTML to support HTML content like FontAwesome icons
            this.appendChild(suffixEl);
        }
    }
    
    // Setup leading and trailing icons
    setupIcons() {
        if (this.leadingIcon) {
            this.classList.add('upo-input-with-leading-icon');
            const iconEl = document.createElement('div');
            iconEl.className = 'upo-input-leading-icon';
            iconEl.innerHTML = this.leadingIcon;
            this.appendChild(iconEl);
        }
        
        if (this.trailingIcon) {
            this.classList.add('upo-input-with-trailing-icon');
            const iconEl = document.createElement('div');
            iconEl.className = 'upo-input-trailing-icon';
            iconEl.innerHTML = this.trailingIcon;
            this.appendChild(iconEl);
        }
    }
    
    // Setup floating labels
    setupLabels() {
        if (this.floatingLabel) {
            this.classList.add('upo-input-floating');
            const placeholder = this.input.getAttribute('placeholder') || '';
            if (placeholder) {
                const floatingLabelEl = document.createElement('div');
                floatingLabelEl.className = 'upo-input-floating-label';
                floatingLabelEl.textContent = placeholder;
                this.appendChild(floatingLabelEl);
                
                // Remove placeholder from input for floating label
                this.input.removeAttribute('placeholder');
                
                // Handle floating label behavior
                this.input.addEventListener('input', () => {
                    if (this.input.value) {
                        this.classList.add('has-value');
                    } else {
                        this.classList.remove('has-value');
                    }
                });
                
                this.input.addEventListener('focus', () => {
                    this.classList.add('has-value');
                });
                
                this.input.addEventListener('blur', () => {
                    if (!this.input.value) {
                        this.classList.remove('has-value');
                    }
                });
            }
        }
    }
    
    // Setup validation status
    setupStatus() {
        if (this.status && ['success', 'warning', 'error', 'info'].includes(this.status)) {
            this.classList.add(`upo-input-${this.status}`);
        }
    }
    

    
    // Get the value of the input
    get value() {
        return this.input.value;
    }
    
    // Set the value of the input
    set value(val) {
        if (this.input) {
            this.input.value = val;
            // Trigger input event to ensure any listeners are notified
            this.input.dispatchEvent(new Event('input', { bubbles: true }));
        }
    }

    // Public method to set value with proper initialization check
    setValue(val) {
        if (this.input && this.initialized) {
            this.input.value = val;
            this.setAttribute('value', val);
            // Trigger input event to ensure any listeners are notified
            this.input.dispatchEvent(new Event('input', { bubbles: true }));
        } else {
            // If input doesn't exist yet or not initialized, try again after a short delay
            setTimeout(() => {
                if (this.input && this.initialized) {
                    this.input.value = val;
                    this.setAttribute('value', val);
                    this.input.dispatchEvent(new Event('input', { bubbles: true }));
                }
            }, 100);
        }
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

    customElements.define('ui-input', Input);
export default Input; 