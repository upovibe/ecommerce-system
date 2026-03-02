import Box from './Box.js';

/**
 * Card Component
 * 
 * An extension of the Box component with card-specific default styles.
 * It inherits all the functionality of Box and provides its own default look.
 */
class Card extends Box {
    // Override the addDefaultStyles method from Box
    addDefaultStyles() {
        if (!document.getElementById('upo-ui-card-styles')) {
            const style = document.createElement('style');
            style.id = 'upo-ui-card-styles';
            style.textContent = `
                .upo-card-default {
                    display: block;
                    padding: 1.5rem; /* 24px */
                    background-color: #ffffff;
                    border: 1px solid #e5e7eb;
                    border-radius: 0.75rem; /* 12px */
                    box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
                }
            `;
            document.head.appendChild(style);
        }
    }

    // Override connectedCallback to use the correct default class
    connectedCallback() {
        // Prevent double processing if already initialized by a parent
        if (this.initialized) return;

        // Create the div element if it doesn't exist (it should from Box)
        if (!this.div) {
            this.div = document.createElement('div');
            this.appendChild(this.div);
        }

        // Call the parent's connectedCallback but pass our default class
        super.connectedCallback({ defaultClass: 'upo-card-default' });
    }
}

    customElements.define('ui-card', Card);
export default Card; 