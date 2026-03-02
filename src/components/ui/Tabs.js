/**
 * Tabs Component
 * 
 * Creates a tabbed interface with multiple panels. Supports:
 * - Tab switching with smooth transitions
 * - Active state management
 * - Accessible keyboard navigation
 * 
 * Usage:
 * <ui-tabs>
 *   <ui-tab-list>
 *     <ui-tab value="tab1">Tab 1</ui-tab>
 *     <ui-tab value="tab2">Tab 2</ui-tab>
 *   </ui-tab-list>
 *   <ui-tab-panel value="tab1">Content 1</ui-tab-panel>
 *   <ui-tab-panel value="tab2">Content 2</ui-tab-panel>
 * </ui-tabs>
 */
class TabList extends HTMLElement {
    constructor() {
        super();
        
        // Create the tab list div element directly (no shadow DOM)
        this.tabListDiv = document.createElement('div');
        
        // Flag to prevent double processing
        this.initialized = false;
        
        // Add the tab list div to the component
        this.appendChild(this.tabListDiv);
        
        // Add default styles via CSS
        this.addDefaultStyles();
    }

    // Add default CSS styles to document if not already added
    addDefaultStyles() {
        if (!document.getElementById('upo-ui-tabs-styles')) {
            const style = document.createElement('style');
            style.id = 'upo-ui-tabs-styles';
            style.textContent = `
                .upo-tab-list {
                    display: flex;
                    gap: 0.125rem;
                    padding: 0.25rem;
                    background: rgba(243, 244, 246, 0.6);
                    backdrop-filter: blur(8px);
                    border-radius: 0.5rem;
                    border: 1px solid rgba(229, 231, 235, 0.8);
                    width: fit-content;
                }
                .upo-tab {
                    display: inline-block;
                }
                .upo-tab button {
                    padding: 0.375rem 0.875rem;
                    border: none;
                    background: transparent;
                    cursor: pointer;
                    font-size: 0.8rem;
                    font-weight: 500;
                    color: #6b7280;
                    border-radius: 0.375rem;
                    transition: all 0.15s cubic-bezier(0.4, 0, 0.2, 1);
                    outline: none;
                    position: relative;
                    white-space: nowrap;
                    letter-spacing: 0.025em;
                    min-width: fit-content;
                    text-align: center;
                }
                .upo-tab button:hover {
                    color: #374151;
                    background: rgba(255, 255, 255, 0.7);
                }
                .upo-tab button:focus {
                    box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.3);
                }
                .upo-tab[active] button {
                    color: #1f2937;
                    background: #ffffff;
                    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.06);
                    font-weight: 500;
                    text-shadow: 0 0 1px rgba(31, 41, 55, 0.2);
                }
                .upo-tab-panel {
                    display: none;
                    margin-top: 0.75rem;
                }
                .upo-tab-panel[active] {
                    display: block;
                }
            `;
            document.head.appendChild(style);
        }
    }

    // Connected callback - called when element is added to DOM
    connectedCallback() {
        // Prevent double processing
        if (this.initialized) return;
        this.initialized = true;

        // Set the tab list class
        this.tabListDiv.className = 'upo-tab-list';
        
        // Move any existing children to the tab list div
        const children = Array.from(this.childNodes);
        children.forEach(child => {
            if (child !== this.tabListDiv) {
                this.tabListDiv.appendChild(child);
            }
        });
    }
}

class Tab extends HTMLElement {
    constructor() {
        super();
        
        // Create the tab button element directly (no shadow DOM)
        this.tabButton = document.createElement('button');
        
        // Flag to prevent double processing
        this.initialized = false;
        
        // Add the button to the component
        this.appendChild(this.tabButton);
        
        // Add default styles via CSS (handled by TabList)
        this.addDefaultStyles();
    }

    // Add default CSS styles to document if not already added
    addDefaultStyles() {
        // Styles are already added by TabList component
        // This method exists for consistency with the pattern
    }
    
    connectedCallback() {
        // Prevent double processing
        if (this.initialized) return;
        this.initialized = true;

        // Set the tab class
        this.className = 'upo-tab';
        this.tabButton.type = 'button';
        
        // Store original content before building the tab
        const originalContent = Array.from(this.childNodes)
            .filter(node => node !== this.tabButton)
            .map(node => node.textContent || '')
            .join('').trim();

        // Move any existing children (except our button) to the button content
        const children = Array.from(this.childNodes);
        children.forEach(child => {
            if (child !== this.tabButton) {
                // Clone the child to preserve HTML structure
                const clonedChild = child.cloneNode(true);
                this.tabButton.appendChild(clonedChild);
                this.removeChild(child);
            }
        });

        // If no HTML content was found, fall back to text content
        if (this.tabButton.children.length === 0) {
            this.tabButton.textContent = originalContent;
        }
        
        // Add click event listener
        this.tabButton.addEventListener('click', this._handleClick.bind(this));
    }
    
    disconnectedCallback() {
        if (this.tabButton) {
            this.tabButton.removeEventListener('click', this._handleClick.bind(this));
        }
    }
    
    _handleClick() {
        const tabsContainer = this.closest('ui-tabs');
        if (tabsContainer) {
            tabsContainer.setActiveTab(this.getAttribute('value'));
        }
    }
}

class TabPanel extends HTMLElement {
    constructor() {
        super();
        
        // Create the panel div element directly (no shadow DOM)
        this.panelDiv = document.createElement('div');
        
        // Flag to prevent double processing
        this.initialized = false;
        
        // Add the panel div to the component
        this.appendChild(this.panelDiv);
        
        // Add default styles via CSS (handled by TabList)
        this.addDefaultStyles();
    }

    // Add default CSS styles to document if not already added
    addDefaultStyles() {
        // Styles are already added by TabList component
        // This method exists for consistency with the pattern
    }
    
    connectedCallback() {
        // Prevent double processing
        if (this.initialized) return;
        this.initialized = true;

        // Set the panel class
        this.className = 'upo-tab-panel';
        
        // Move any existing children to the panel div
        const children = Array.from(this.childNodes);
        children.forEach(child => {
            if (child !== this.panelDiv) {
                this.panelDiv.appendChild(child);
            }
        });
    }
}

class Tabs extends HTMLElement {
    constructor() {
        super();
        this.currentTab = null;
    }
    
    connectedCallback() {
        // Set the first tab as active by default if no active tab is specified
        setTimeout(() => {
            if (!this.currentTab) {
                const firstTab = this.querySelector('ui-tab');
                if (firstTab) {
                    this.setActiveTab(firstTab.getAttribute('value'));
                }
            }
        }, 0);
    }
    
    setActiveTab(value) {
        this.currentTab = value;
        
        // Update tabs
        const tabs = this.querySelectorAll('ui-tab');
        tabs.forEach(tab => {
            if (tab.getAttribute('value') === value) {
                tab.setAttribute('active', '');
            } else {
                tab.removeAttribute('active');
            }
        });
        
        // Update panels
        const panels = this.querySelectorAll('ui-tab-panel');
        panels.forEach(panel => {
            if (panel.getAttribute('value') === value) {
                panel.setAttribute('active', '');
            } else {
                panel.removeAttribute('active');
            }
        });
        
        // Dispatch custom event for tab change
        this.dispatchEvent(new CustomEvent('tab-changed', {
            detail: { activeTab: value },
            bubbles: true,
            composed: true
        }));
    }
}

customElements.define('ui-tab-list', TabList);
customElements.define('ui-tab', Tab);
customElements.define('ui-tab-panel', TabPanel);
customElements.define('ui-tabs', Tabs);
export default Tabs; 