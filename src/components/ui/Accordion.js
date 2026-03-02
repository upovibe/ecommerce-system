/**
 * Accordion Component
 * 
 * Creates collapsible content sections. Supports:
 * - Single or multiple open sections
 * - Smooth animations
 * - Keyboard navigation
 * - Accessibility features
 * 
 * Usage:
 * <ui-accordion>
 *   <ui-accordion-item title="Section 1">Content 1</ui-accordion-item>
 *   <ui-accordion-item title="Section 2">Content 2</ui-accordion-item>
 * </ui-accordion>
 */
class AccordionItem extends HTMLElement {
    constructor() {
        super();
        
        // Create the accordion item elements directly (no shadow DOM)
        this.header = document.createElement('button');
        this.content = document.createElement('div');
        
        // Flag to prevent double processing
        this.initialized = false;
        
        // Add elements to the component
        this.appendChild(this.header);
        this.appendChild(this.content);
        
        // Add default styles via CSS
        this.addDefaultStyles();
        
        // Bind event handlers
        this._onHeaderClick = this._onHeaderClick.bind(this);
        this._onHeaderKeyDown = this._onHeaderKeyDown.bind(this);
    }
        
    // Add default CSS styles to document if not already added
    addDefaultStyles() {
        if (!document.getElementById('upo-ui-accordion-styles')) {
            const style = document.createElement('style');
            style.id = 'upo-ui-accordion-styles';
            style.textContent = `
                .upo-accordion-header {
                    width: 100%;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    cursor: pointer;
                    padding: 0.5rem 1rem;
                    background: #fff;
                    border: none;
                    border-bottom: 1px solid #e5e7eb;
                    font-weight: 500;
                    font-size: 1rem;
                    color: #22223b;
                    transition: background 0.2s, color 0.2s, border-radius 0.2s;
                    outline: none;
                    gap: 0.5rem;
                    border-radius: 0.375rem 0.375rem 0 0;
                }
                .upo-accordion-header:focus {
                    box-shadow: none;
                    background: #f6f8fa;
                }
                .upo-accordion-header:hover {
                    background: #f6f8fa;
                    color: #3b82f6;
                }
                .upo-accordion-item[open] .upo-accordion-header {
                    background: #f6f8fa;
                    border-radius: 0.375rem 0.375rem 0 0;
                }
                .upo-accordion-title {
                    flex: 1;
                    text-align: left;
                }
                .upo-accordion-chevron {
                    transition: transform 0.2s;
                    color: #6b7280;
                    font-size: 1.1em;
                }
                .upo-accordion-content {
                    padding: 0.75rem 1rem;
                    background: #fafbfc;
                    font-size: 0.98rem;
                    color: #22223b;
                    max-height: 0;
                    opacity: 0;
                    overflow: hidden;
                    border-bottom: 1px solid #e5e7eb;
                    border-radius: 0 0 0.375rem 0.375rem;
                    transition: max-height 0.3s cubic-bezier(0.4,0,0.2,1), opacity 0.2s, border-radius 0.2s;
                }
                .upo-accordion-item[open] .upo-accordion-content {
                    opacity: 1;
                    max-height: var(--content-height, 1000px);
                    border-radius: 0 0 0.375rem 0.375rem;
                }
            `;
            document.head.appendChild(style);
        }
    }

    connectedCallback() {
        // Prevent double processing
        if (this.initialized) return;
        this.initialized = true;

        // Set up the header
        this.header.className = 'upo-accordion-header';
        this.header.type = 'button';
        this.header.setAttribute('tabindex', '0');
        
        // Store original content before building the accordion item
        const originalContent = Array.from(this.childNodes)
            .filter(node => node !== this.header && node !== this.content)
            .map(node => node.textContent || '')
            .join('').trim();

        // Move any existing children (except our elements) to the content
        const children = Array.from(this.childNodes);
        children.forEach(child => {
            if (child !== this.header && child !== this.content) {
                this.content.appendChild(child);
            }
        });

        // Build the header content
        const title = this.getAttribute('title') || 'Section';
        this.header.innerHTML = `
            <span class="upo-accordion-title">${title}</span>
                <span class="upo-accordion-chevron" aria-hidden="true">
                    <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="#6b7280" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 8 10 12 14 8"/></svg>
                </span>
        `;

        // Set up the content
        this.content.className = 'upo-accordion-content';
        
        // Add event listeners
        this.header.addEventListener('click', this._onHeaderClick);
        this.header.addEventListener('keydown', this._onHeaderKeyDown);
        
        // Update content height and set initial state
        this.updateContentHeight();
        
        // Create intersection observer to detect when accordion becomes visible
        this.observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting && this.hasAttribute('open')) {
                    // Small delay to ensure layout is complete
                    setTimeout(() => this.updateContentHeight(), 0);
                }
            });
        }, { threshold: 0.1 });
        
        this.observer.observe(this);
    }

    disconnectedCallback() {
        this.header.removeEventListener('click', this._onHeaderClick);
        this.header.removeEventListener('keydown', this._onHeaderKeyDown);
        
        // Clean up intersection observer
        if (this.observer) {
            this.observer.disconnect();
        }
    }

    static get observedAttributes() {
        return ['open', 'title'];
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (name === 'open') {
            this.updateContentHeight();
            this.header.setAttribute('aria-expanded', this.hasAttribute('open'));
            const chevron = this.querySelector('.upo-accordion-chevron');
            if (chevron) {
                chevron.style.transform = this.hasAttribute('open') ? 'rotate(90deg)' : 'rotate(0deg)';
            }
        }
        if (name === 'title') {
            this.renderHeader();
        }
    }

    renderHeader() {
        const title = this.getAttribute('title') || 'Section';
        const titleElement = this.querySelector('.upo-accordion-title');
        if (titleElement) {
            titleElement.textContent = title;
        }
        
        const chevron = this.querySelector('.upo-accordion-chevron');
        if (chevron) {
            chevron.style.transform = this.hasAttribute('open') ? 'rotate(90deg)' : 'rotate(0deg)';
        }
    }

    updateContentHeight() {
        if (this.hasAttribute('open')) {
            // Temporarily set max-height to auto to measure actual content
            this.content.style.maxHeight = 'auto';
            this.content.style.opacity = '1';
            
            // Force a layout update
            this.content.offsetHeight;
            
            // Calculate the actual content height
            const children = Array.from(this.content.childNodes);
            let height = 0;
            
            children.forEach(node => {
                if (node.nodeType === Node.ELEMENT_NODE) {
                    // Use getBoundingClientRect for more accurate measurement
                    const rect = node.getBoundingClientRect();
                    height += rect.height;
                    
                    // Also account for margins
                    const style = window.getComputedStyle(node);
                    height += parseFloat(style.marginTop) + parseFloat(style.marginBottom);
                }
            });
            
            // Add padding to the height calculation
            const contentStyle = window.getComputedStyle(this.content);
            const paddingTop = parseFloat(contentStyle.paddingTop);
            const paddingBottom = parseFloat(contentStyle.paddingBottom);
            height += paddingTop + paddingBottom;
            
            this.content.style.setProperty('--content-height', `${height}px`);
            this.content.style.maxHeight = 'var(--content-height)';
        } else {
            this.content.style.maxHeight = '0';
            this.content.style.opacity = '0';
        }
    }

    _onHeaderClick() {
        // Check if parent accordion has "single" attribute
        const accordion = this.closest('ui-accordion');
        if (accordion && accordion.hasAttribute('single')) {
            // Close all other accordion items in this accordion
            const allItems = accordion.querySelectorAll('ui-accordion-item');
            allItems.forEach(item => {
                if (item !== this) {
                    item.removeAttribute('open');
                }
            });
        }
            
        // Toggle this item
            if (this.hasAttribute('open')) {
                this.removeAttribute('open');
            } else {
                this.setAttribute('open', '');
        }
    }

    _onHeaderKeyDown(e) {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            this._onHeaderClick();
        }
    }
}

class Accordion extends HTMLElement {
    constructor() {
        super();
    }
    
    addDefaultStyles() {
        // Styles are already added by AccordionItem component
        // This method exists for consistency with the pattern
    }
    
    static get observedAttributes() {
        return ['single'];
    }
    
    attributeChangedCallback(name, oldValue, newValue) {
        if (name === 'single' && newValue !== null) {
            // If single mode is enabled, ensure only one item is open
            const items = this.querySelectorAll('ui-accordion-item');
            let openItem = null;
            
            items.forEach(item => {
                if (item.hasAttribute('open')) {
                    if (openItem) {
                        // Close the previously open item
                        item.removeAttribute('open');
                    } else {
                        openItem = item;
                }
            }
            });
    }
}
}

customElements.define('ui-accordion-item', AccordionItem);
customElements.define('ui-accordion', Accordion);
export default Accordion;