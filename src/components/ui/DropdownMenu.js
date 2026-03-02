/**
 * DropdownMenu Component
 * 
 * A flexible dropdown menu component that allows custom HTML content.
 * 
 * Usage:
 * <ui-dropdown-menu>
 *   <ui-dropdown-menu-trigger>Open</ui-dropdown-menu-trigger>
 *   <ui-dropdown-menu-content>
 *     <ui-dropdown-menu-label>My Account</ui-dropdown-menu-label>
 *     <ui-dropdown-menu-separator></ui-dropdown-menu-separator>
 *     <ui-dropdown-menu-item>
 *       <a href="/profile" data-action="navigate" class="flex items-center">
 *         <i class="fas fa-user w-4 h-4 mr-3"></i>
 *         Profile
 *       </a>
 *     </ui-dropdown-menu-item>
 *     <ui-dropdown-menu-item>
 *       <button data-action="settings" class="flex items-center">
 *         <i class="fas fa-cog w-4 h-4 mr-3"></i>
 *         Settings
 *       </button>
 *     </ui-dropdown-menu-item>
 *     <ui-dropdown-menu-separator></ui-dropdown-menu-separator>
 *     <ui-dropdown-menu-item color="red">
 *       <button data-action="logout" class="flex items-center text-red-500">
 *         <i class="fas fa-sign-out-alt w-4 h-4 mr-3"></i>
 *         Logout
 *       </button>
 *     </ui-dropdown-menu-item>
 *   </ui-dropdown-menu-content>
 * </ui-dropdown-menu>
 * 
 * Features:
 * - Flexible content: Put any HTML inside menu items
 * - Action-based events: Use data-action for custom actions
 * - Custom styling: Full control over appearance
 * - Event handling: item-click events with action details
 */

class DropdownMenu extends HTMLElement {
    constructor() {
        super();
        
        // Create the main container
        this.container = document.createElement('div');
        this.container.className = 'upo-dropdown-menu-container';
        
        // Create the trigger container
        this.triggerContainer = document.createElement('div');
        this.triggerContainer.className = 'upo-dropdown-menu-trigger-container';
        
        // Create the content container
        this.contentContainer = document.createElement('div');
        this.contentContainer.className = 'upo-dropdown-menu-content-container';
        
        // Assemble the structure
        this.container.appendChild(this.triggerContainer);
        this.container.appendChild(this.contentContainer);
        this.appendChild(this.container);
        
        // Initialize state
        this.isOpen = false;
        this.initialized = false;
        
        // Add default styles
        this.addDefaultStyles();
        
        // Set up event listeners
        this.setupEventListeners();
    }
    
    addDefaultStyles() {
        if (!document.getElementById('upo-ui-dropdown-menu-styles')) {
            const style = document.createElement('style');
            style.id = 'upo-ui-dropdown-menu-styles';
            style.textContent = `
                .upo-dropdown-menu-container {
                    position: relative;
                    display: inline-block;
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                }
                
                .upo-dropdown-menu-trigger-container {
                    cursor: pointer;
                    user-select: none;
                }
                
                .upo-dropdown-menu-content-container {
                    position: absolute;
                    top: 100%;
                    left: 0;
                    right: 0;
                    min-width: 12rem;
                    background-color: #ffffff;
                    border: 1px solid #e5e7eb;
                    border-radius: 0.5rem;
                    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
                    z-index: 50;
                    opacity: 0;
                    visibility: hidden;
                    transform: translateY(-8px);
                    transition: all 0.2s ease-in-out;
                    margin-top: 0.25rem;
                    padding: 0.5rem;
                }
                
                .upo-dropdown-menu-content-container.open {
                    opacity: 1;
                    visibility: visible;
                    transform: translateY(0);
                }
                
                .upo-dropdown-menu-content-container.top {
                    top: auto;
                    bottom: 100%;
                    margin-top: 0;
                    margin-bottom: 0.25rem;
                    transform: translateY(8px);
                }
                
                .upo-dropdown-menu-content-container.top.open {
                    transform: translateY(0);
                }
                
                .upo-dropdown-menu-content-container.right {
                    left: auto;
                    right: 0;
                }
                
                .upo-dropdown-menu-content-container.left {
                    right: auto;
                    left: 0;
                }
                
                .upo-dropdown-menu-content-container.right-aligned {
                    left: auto;
                    right: 0;
                }
                
                /* Menu items */
                .upo-dropdown-menu-item {
                    display: flex;
                    align-items: center;
                    width: 100%;
                    padding: 0.5rem 0.75rem;
                    text-decoration: none;
                    color: #374151;
                    font-size: 0.875rem;
                    line-height: 1.25;
                    cursor: pointer;
                    transition: background-color 0.15s ease-in-out;
                    border: none;
                    background: none;
                    text-align: left;
                    margin: 0.125rem 0;
                    border-radius: 0.25rem;
                }
                
                .upo-dropdown-menu-item:hover {
                    background-color: #f3f4f6;
                }
                
                .upo-dropdown-menu-item:focus {
                    outline: none;
                    background-color: #f3f4f6;
                }
                
                .upo-dropdown-menu-item.disabled {
                    opacity: 0.5;
                    cursor: not-allowed;
                    pointer-events: none;
                }
                
                .upo-dropdown-menu-item-icon {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    width: 1rem;
                    height: 1rem;
                    margin-right: 0.5rem;
                    flex-shrink: 0;
                }
                
                .upo-dropdown-menu-item-content {
                    flex: 1;
                    min-width: 0;
                }
                
                /* Colors */
                .upo-dropdown-menu-item.red {
                    color: #dc2626;
                }
                
                .upo-dropdown-menu-item.red:hover {
                    background-color: #fef2f2;
                }
                
                .upo-dropdown-menu-item.green {
                    color: #059669;
                }
                
                .upo-dropdown-menu-item.green:hover {
                    background-color: #f0fdf4;
                }
                
                .upo-dropdown-menu-item.blue {
                    color: #2563eb;
                }
                
                .upo-dropdown-menu-item.blue:hover {
                    background-color: #eff6ff;
                }
                
                .upo-dropdown-menu-item.yellow {
                    color: #d97706;
                }
                
                .upo-dropdown-menu-item.yellow:hover {
                    background-color: #fffbeb;
                }
                
                .upo-dropdown-menu-item.purple {
                    color: #7c3aed;
                }
                
                .upo-dropdown-menu-item.purple:hover {
                    background-color: #faf5ff;
                }
                
                /* Separator */
                .upo-dropdown-menu-separator {
                    display: block;
                    height: 1px;
                    background-color: #9ca3af;
                    margin: 0.5rem 0;
                    width: 100%;
                }
                
                /* Label */
                .upo-dropdown-menu-label {
                    padding: 0.5rem 0.75rem;
                    font-size: 0.75rem;
                    font-weight: 500;
                    color: #6b7280;
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                    margin: 0.125rem 0;
                }
                
                /* Sizes */
                .upo-dropdown-menu-sm .upo-dropdown-menu-item {
                    padding: 0.375rem 0.5rem;
                    font-size: 0.75rem;
                }
                
                .upo-dropdown-menu-lg .upo-dropdown-menu-item {
                    padding: 0.75rem 1rem;
                    font-size: 1rem;
                }
            `;
            document.head.appendChild(style);
        }
    }
    
    setupEventListeners() {
        // Toggle on trigger click
        this.triggerContainer.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            if (!this.disabled) {
                this.toggle();
            }
        });
        
        // Close on escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isOpen) {
                this.close();
            }
        });
        
        // Close when clicking outside
        document.addEventListener('click', (e) => {
            if (!this.container.contains(e.target) && this.isOpen) {
                this.close();
            }
        });
        
        // Handle menu item clicks
        this.contentContainer.addEventListener('click', (e) => {
            const menuItem = e.target.closest('.upo-dropdown-menu-item');
            if (menuItem && !menuItem.classList.contains('disabled')) {
                // Check if click was on a custom element with data-action
                const customElement = e.target.closest('[data-action]');
                if (customElement) {
                    e.preventDefault();
                    e.stopPropagation();
                    this.close();
                    
                    const eventDetail = {
                        text: customElement.textContent.trim(),
                        action: customElement.getAttribute('data-action'),
                        icon: menuItem.querySelector('.upo-dropdown-menu-item-icon')?.innerHTML || '',
                        color: this.getMenuItemColor(menuItem)
                    };
                    
                    // Dispatch on the dropdown menu element
                    this.dispatchEvent(new CustomEvent('item-click', {
                        detail: eventDetail
                    }));
                    
                    // Also dispatch on document to ensure it bubbles up
                    document.dispatchEvent(new CustomEvent('item-click', {
                        detail: eventDetail
                    }));
                    return;
                }
                
                // If the item contains a link, navigate even if the click wasn't directly on the link
                const anchorEl = menuItem.querySelector('a[href]');
                if (anchorEl) {
                    const href = anchorEl.getAttribute('href');
                    if (href && href !== '#') {
                        e.preventDefault();
                        e.stopPropagation();
                        this.close();
                        window.location.href = href;
                        return;
                    }
                }

                this.close();
                // Dispatch custom event
                this.dispatchEvent(new CustomEvent('item-click', {
                    detail: {
                        text: menuItem.textContent.trim(),
                        icon: menuItem.querySelector('.upo-dropdown-menu-item-icon')?.innerHTML || '',
                        color: this.getMenuItemColor(menuItem)
                    }
                }));
            }
        });
    }
    
    getMenuItemColor(menuItem) {
        const colors = ['red', 'green', 'blue', 'yellow', 'purple'];
        for (const color of colors) {
            if (menuItem.classList.contains(color)) {
                return color;
            }
        }
        return null;
    }
    
    toggle() {
        if (this.isOpen) {
            this.close();
        } else {
            this.open();
        }
    }
    
    open() {
        this.isOpen = true;
        this.contentContainer.classList.add('open');
        this.triggerContainer.setAttribute('aria-expanded', 'true');
        
        // Check for overflow and adjust position
        this.adjustPosition();
    }
    
    close() {
        this.isOpen = false;
        this.contentContainer.classList.remove('open');
        this.triggerContainer.setAttribute('aria-expanded', 'false');
    }
    
    connectedCallback() {
        if (this.initialized) return;
        this.initialized = true;
        
        // Process trigger and content
        this.processTrigger();
        this.processContent();
        
        // Set position
        const position = this.getAttribute('position') || 'bottom';
        this.contentContainer.classList.add(position);
        
        // Set size
        const size = this.getAttribute('size') || 'md';
        this.container.classList.add(`upo-dropdown-menu-${size}`);
        
        // Set disabled state
        if (this.hasAttribute('disabled')) {
            this.triggerContainer.classList.add('disabled');
        }
        
        // Set ARIA attributes
        this.triggerContainer.setAttribute('role', 'button');
        this.triggerContainer.setAttribute('aria-haspopup', 'true');
        this.triggerContainer.setAttribute('aria-expanded', 'false');
        this.contentContainer.setAttribute('role', 'menu');
    }
    
    processTrigger() {
        const trigger = this.querySelector('ui-dropdown-menu-trigger');
        if (trigger) {
            // Move trigger content to trigger container
            this.triggerContainer.innerHTML = '';
            this.triggerContainer.appendChild(trigger.cloneNode(true));
            trigger.remove();
        }
    }
    
    processContent() {
        const content = this.querySelector('ui-dropdown-menu-content');
        if (content) {
            // Move content to content container
            this.contentContainer.innerHTML = '';
            this.contentContainer.appendChild(content.cloneNode(true));
            content.remove();
            
            // Process the content after moving it
            this.processContentItems();
        }
    }
    
    processContentItems() {
        // Process all items in the content container
        const items = this.contentContainer.querySelectorAll('ui-dropdown-menu-label, ui-dropdown-menu-separator, ui-dropdown-menu-item');
        
        items.forEach(item => {
            if (item.tagName === 'UI-DROPDOWN-MENU-LABEL') {
                // Label is already processed by its own component
            } else if (item.tagName === 'UI-DROPDOWN-MENU-SEPARATOR') {
                // Separator is already processed by its own component
            } else if (item.tagName === 'UI-DROPDOWN-MENU-ITEM') {
                // Menu item is already processed by its own component
            }
        });
    }
    
    static get observedAttributes() {
        return ['position', 'size', 'disabled'];
    }
    
    attributeChangedCallback(name, oldValue, newValue) {
        if (!this.initialized) return;
        
        switch (name) {
            case 'position':
                this.contentContainer.className = this.contentContainer.className.replace(/top|bottom|left|right/g, '');
                this.contentContainer.classList.add(newValue || 'bottom');
                break;
            case 'size':
                this.container.className = this.container.className.replace(/upo-dropdown-menu-(sm|md|lg)/g, '');
                this.container.classList.add(`upo-dropdown-menu-${newValue || 'md'}`);
                break;
            case 'disabled':
                if (newValue !== null) {
                    this.triggerContainer.classList.add('disabled');
                } else {
                    this.triggerContainer.classList.remove('disabled');
                }
                break;
        }
    }
    
    get position() {
        return this.getAttribute('position') || 'bottom';
    }
    
    set position(value) {
        this.setAttribute('position', value);
    }
    
    get size() {
        return this.getAttribute('size') || 'md';
    }
    
    set size(value) {
        this.setAttribute('size', value);
    }
    
    get disabled() {
        return this.hasAttribute('disabled');
    }
    
    set disabled(value) {
        if (value) {
            this.setAttribute('disabled', '');
        } else {
            this.removeAttribute('disabled');
        }
    }
    
    // Public methods
    openDropdown() {
        this.open();
    }
    
    closeDropdown() {
        this.close();
    }
    
    adjustPosition() {
        // Wait for the next frame to ensure the dropdown is rendered
        requestAnimationFrame(() => {
            const container = this.container;
            const content = this.contentContainer;
            
            if (!container || !content) return;
            
            // Get container and content dimensions
            const containerRect = container.getBoundingClientRect();
            const contentRect = content.getBoundingClientRect();
            
            // Check if content would overflow to the right
            const wouldOverflowRight = containerRect.left + contentRect.width > window.innerWidth;
            
            // Remove any existing alignment classes
            content.classList.remove('right-aligned');
            
            // If it would overflow, align to the right
            if (wouldOverflowRight) {
                content.classList.add('right-aligned');
            }
        });
    }
}

// DropdownMenuTrigger Component
class DropdownMenuTrigger extends HTMLElement {
    constructor() {
        super();
    }
    
    connectedCallback() {
        // This component is processed by the parent DropdownMenu
    }
}

// DropdownMenuContent Component
class DropdownMenuContent extends HTMLElement {
    constructor() {
        super();
    }
    
    connectedCallback() {
        // This component is processed by the parent DropdownMenu
    }
}

// DropdownMenuLabel Component
class DropdownMenuLabel extends HTMLElement {
    constructor() {
        super();
    }
    
    connectedCallback() {
        this.className = 'upo-dropdown-menu-label';
    }
}

// DropdownMenuSeparator Component
class DropdownMenuSeparator extends HTMLElement {
    constructor() {
        super();
    }
    
    connectedCallback() {
        this.className = 'upo-dropdown-menu-separator';
    }
}

// DropdownMenuItem Component
class DropdownMenuItem extends HTMLElement {
    constructor() {
        super();
    }
    
    connectedCallback() {
        this.className = 'upo-dropdown-menu-item';
        this.setAttribute('role', 'menuitem');
        
        // Add color class if specified
        if (this.hasAttribute('color')) {
            this.classList.add(this.getAttribute('color'));
        }
        
        // Add disabled class if specified
        if (this.hasAttribute('disabled')) {
            this.classList.add('disabled');
        }
        
        // No automatic icon creation - let users put whatever they want inside
    }
}

// Register components
customElements.define('ui-dropdown-menu', DropdownMenu);
customElements.define('ui-dropdown-menu-trigger', DropdownMenuTrigger);
customElements.define('ui-dropdown-menu-content', DropdownMenuContent);
customElements.define('ui-dropdown-menu-label', DropdownMenuLabel);
customElements.define('ui-dropdown-menu-separator', DropdownMenuSeparator);
customElements.define('ui-dropdown-menu-item', DropdownMenuItem);

export default DropdownMenu; 