/**
 * Breadcrumb Component
 * 
 * Displays navigation hierarchy for better UX context.
 * Supports different separators, sizes, and responsive behavior.
 * 
 * Attributes:
 * - separator: 'slash' | 'chevron' | 'arrow' | 'dot' (default: 'slash')
 * - size: 'sm' | 'md' | 'lg' (default: 'md')
 * - color: 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info'
 * 
 * Usage:
 * <ui-breadcrumb>
 *   <ui-breadcrumb-item href="/">Home</ui-breadcrumb-item>
 *   <ui-breadcrumb-item href="/docs">Docs</ui-breadcrumb-item>
 *   <ui-breadcrumb-item>Components</ui-breadcrumb-item>
 * </ui-breadcrumb>
 */
class Breadcrumb extends HTMLElement {
    constructor() {
        super();
        
        // Create the breadcrumb container element directly (no shadow DOM)
        this.breadcrumbContainer = document.createElement('nav');
        this.breadcrumbList = document.createElement('ol');
        
        // Flag to prevent double processing
        this.initialized = false;
        
        // Add elements to the component
        this.breadcrumbContainer.appendChild(this.breadcrumbList);
        this.appendChild(this.breadcrumbContainer);
        
        // Add default styles via CSS
        this.addDefaultStyles();
    }

    // Add default CSS styles to document if not already added
    addDefaultStyles() {
        if (!document.getElementById('upo-ui-breadcrumb-styles')) {
            const style = document.createElement('style');
            style.id = 'upo-ui-breadcrumb-styles';
            style.textContent = `
                .upo-breadcrumb {
                    display: flex;
                    align-items: center;
                    font-size: 0.875rem;
                    line-height: 1.25rem;
                }
                
                .upo-breadcrumb-sm {
                    font-size: 0.75rem;
                }
                
                .upo-breadcrumb-lg {
                    font-size: 1rem;
                }
                
                .upo-breadcrumb ol {
                    display: flex;
                    align-items: center;
                    list-style: none;
                    margin: 0;
                    padding: 0;
                    flex-wrap: wrap;
                }
                
                .upo-breadcrumb-item {
                    display: flex;
                    align-items: center;
                    color: #6b7280;
                    transition: color 0.2s ease-in-out;
                }
                
                .upo-breadcrumb-item:last-child {
                    color: #111827;
                    font-weight: 500;
                }
                
                .upo-breadcrumb-item a {
                    color: inherit;
                    text-decoration: none;
                    transition: color 0.2s ease-in-out;
                }
                
                .upo-breadcrumb-item a:hover {
                    color: #3b82f6;
                }
                
                .upo-breadcrumb-separator {
                    margin: 0 0.5rem;
                    color: #9ca3af;
                    display: flex;
                    align-items: center;
                }
                
                .upo-breadcrumb-separator-slash::after {
                    content: '/';
                }
                
                .upo-breadcrumb-separator-chevron::after {
                    content: '›';
                }
                
                .upo-breadcrumb-separator-arrow::after {
                    content: '→';
                }
                
                .upo-breadcrumb-separator-dot::after {
                    content: '•';
                }
                
                /* Color variants */
                .upo-breadcrumb-primary .upo-breadcrumb-item a:hover {
                    color: #3b82f6;
                }
                
                .upo-breadcrumb-secondary .upo-breadcrumb-item a:hover {
                    color: #6b7280;
                }
                
                .upo-breadcrumb-success .upo-breadcrumb-item a:hover {
                    color: #10b981;
                }
                
                .upo-breadcrumb-warning .upo-breadcrumb-item a:hover {
                    color: #f59e0b;
                }
                
                .upo-breadcrumb-error .upo-breadcrumb-item a:hover {
                    color: #ef4444;
                }
                
                .upo-breadcrumb-info .upo-breadcrumb-item a:hover {
                    color: #06b6d4;
                }
            `;
            document.head.appendChild(style);
        }
    }

    static get observedAttributes() {
        return ['separator', 'size', 'color'];
    }

    get separator() {
        return this.getAttribute('separator') || 'slash';
    }

    get size() {
        return this.getAttribute('size') || 'md';
    }

    get color() {
        return this.getAttribute('color') || 'primary';
    }

    // Connected callback - called when element is added to DOM
    connectedCallback() {
        // Prevent double processing
        if (this.initialized) return;
        this.initialized = true;

        // Set up the breadcrumb container
        this.breadcrumbContainer.className = `upo-breadcrumb upo-breadcrumb-${this.size} upo-breadcrumb-${this.color}`;
        this.breadcrumbList.className = 'upo-breadcrumb-list';
        
        // Listen for breadcrumb items being added
        this.addEventListener('breadcrumb-item-added', () => {
            setTimeout(() => this.processChildren(), 0);
        });
        
        // Process child elements
        this.processChildren();
    }

    processChildren() {
        // Store original content before building the breadcrumb
        const originalContent = Array.from(this.childNodes)
            .filter(node => node !== this.breadcrumbContainer)
            .map(node => node.textContent || '')
            .join('').trim();

        // Get breadcrumb items BEFORE removing children
        const items = this.querySelectorAll('ui-breadcrumb-item');
        
        // Move any existing children (except our breadcrumbContainer) to avoid duplication
        const children = Array.from(this.childNodes);
        children.forEach(child => {
            if (child !== this.breadcrumbContainer) {
                this.removeChild(child);
            }
        });

        // Clear the list
        this.breadcrumbList.innerHTML = '';

        // If no breadcrumb items found, create a simple breadcrumb from text content
        if (items.length === 0) {
            const li = document.createElement('li');
            li.className = 'upo-breadcrumb-item';
            li.textContent = originalContent || 'Breadcrumb';
            this.breadcrumbList.appendChild(li);
            return;
        }
        
        items.forEach((item, index) => {
            const li = document.createElement('li');
            li.className = 'upo-breadcrumb-item';
            
            // Get the text content from the breadcrumb item
            const itemText = item.textContent || item.getAttribute('href') || 'Item';
            
            // Create link if href is provided
            if (item.getAttribute('href')) {
                const link = document.createElement('a');
                link.href = item.getAttribute('href');
                link.textContent = itemText;
                li.appendChild(link);
            } else {
                // Just set the text content for the current page
                li.textContent = itemText;
            }
            
            // Add separator if not the last item
            if (index < items.length - 1) {
                const separator = document.createElement('span');
                separator.className = `upo-breadcrumb-separator upo-breadcrumb-separator-${this.separator}`;
                li.appendChild(separator);
            }
            
            this.breadcrumbList.appendChild(li);
        });
    }

    // Called when attributes change
    attributeChangedCallback(name, oldValue, newValue) {
        if (!this.initialized) return;
        
        switch (name) {
            case 'separator':
            case 'size':
            case 'color':
                this.breadcrumbContainer.className = `upo-breadcrumb upo-breadcrumb-${this.size} upo-breadcrumb-${this.color}`;
                this.processChildren();
                break;
        }
    }
}

// Breadcrumb Item component
class BreadcrumbItem extends HTMLElement {
    constructor() {
        super();
        this.initialized = false;
    }

    connectedCallback() {
        if (this.initialized) return;
        this.initialized = true;
        
        // This component just serves as a marker for the parent breadcrumb
        // The actual rendering is handled by the parent breadcrumb component
        // We need to ensure the parent breadcrumb processes this item
        this.dispatchEvent(new CustomEvent('breadcrumb-item-added', { bubbles: true }));
    }

    // Get the text content of this breadcrumb item
    get textContent() {
        return super.textContent || this.getAttribute('href') || 'Item';
    }
}

customElements.define('ui-breadcrumb', Breadcrumb);
customElements.define('ui-breadcrumb-item', BreadcrumbItem);
export default Breadcrumb; 