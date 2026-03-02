/**
 * Skeleton Loader Component
 * 
 * Creates animated skeleton loading placeholders with various shapes and styles.
 * 
 * Attributes:
 * - type: string - skeleton type: "text", "avatar", "button", "card", "image"
 * - width: string - width of the skeleton (e.g., "100%", "200px", "50%")
 * - height: string - height of the skeleton (e.g., "20px", "100px", "auto")
 * - lines: number - number of text lines (for text type)
 * - animated: boolean - enable pulse animation
 * - rounded: boolean - apply border radius
 * 
 * Events:
 * - loaded: Fired when skeleton is replaced with content
 * 
 * Usage:
 * <ui-skeleton type="text" lines="3"></ui-skeleton>
 * <ui-skeleton type="avatar" width="40px" height="40px"></ui-skeleton>
 * <ui-skeleton type="card" width="300px" height="200px"></ui-skeleton>
 */
class Skeleton extends HTMLElement {
    constructor() {
        super();
        
        // Create the skeleton container
        this.container = document.createElement('div');
        this.appendChild(this.container);
        
        // Add default styles
        this.addDefaultStyles();
    }

    addDefaultStyles() {
        if (!document.getElementById('upo-ui-skeleton-styles')) {
            const style = document.createElement('style');
            style.id = 'upo-ui-skeleton-styles';
            style.textContent = `
                .upo-skeleton {
                    background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
                    background-size: 200% 100%;
                    border-radius: 4px;
                    display: inline-block;
                    position: relative;
                    overflow: hidden;
                }

                .upo-skeleton.animated {
                    animation: upo-skeleton-loading 1.5s infinite;
                }

                @keyframes upo-skeleton-loading {
                    0% {
                        background-position: 200% 0;
                    }
                    100% {
                        background-position: -200% 0;
                    }
                }

                .upo-skeleton.rounded {
                    border-radius: 8px;
                }

                .upo-skeleton.avatar {
                    border-radius: 50%;
                }

                .upo-skeleton.text {
                    height: 1rem;
                    margin-bottom: 0.5rem;
                }

                .upo-skeleton.text:last-child {
                    margin-bottom: 0;
                }

                .upo-skeleton.button {
                    height: 2.5rem;
                    border-radius: 6px;
                }

                .upo-skeleton.card {
                    border-radius: 8px;
                    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
                }

                .upo-skeleton.image {
                    border-radius: 4px;
                }

                /* Text lines with different widths */
                .upo-skeleton.text-line-1 {
                    width: 100%;
                }

                .upo-skeleton.text-line-2 {
                    width: 85%;
                }

                .upo-skeleton.text-line-3 {
                    width: 70%;
                }

                .upo-skeleton.text-line-4 {
                    width: 60%;
                }

                .upo-skeleton.text-line-5 {
                    width: 45%;
                }

                /* Responsive */
                @media (max-width: 640px) {
                    .upo-skeleton.text {
                        height: 0.875rem;
                        margin-bottom: 0.375rem;
                    }
                    
                    .upo-skeleton.button {
                        height: 2.25rem;
                    }
                }
            `;
            document.head.appendChild(style);
        }
    }

    connectedCallback() {
        this.updateSkeleton();
    }

    static get observedAttributes() {
        return ['type', 'width', 'height', 'lines', 'animated', 'rounded'];
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue !== newValue) {
            this.updateSkeleton();
        }
    }

    updateSkeleton() {
        const type = this.getAttribute('type') || 'text';
        const width = this.getAttribute('width') || '100%';
        const height = this.getAttribute('height') || 'auto';
        const lines = parseInt(this.getAttribute('lines')) || 1;
        const animated = this.getAttribute('animated') !== 'false';
        const rounded = this.getAttribute('rounded') === 'true';

        // Clear existing content
        this.container.innerHTML = '';

        if (type === 'text') {
            this.createTextSkeleton(lines, width, height, animated, rounded);
        } else if (type === 'avatar') {
            this.createAvatarSkeleton(width, height, animated, rounded);
        } else if (type === 'button') {
            this.createButtonSkeleton(width, height, animated, rounded);
        } else if (type === 'card') {
            this.createCardSkeleton(width, height, animated, rounded);
        } else if (type === 'image') {
            this.createImageSkeleton(width, height, animated, rounded);
        } else {
            // Default text skeleton
            this.createTextSkeleton(1, width, height, animated, rounded);
        }
    }

    createTextSkeleton(lines, width, height, animated, rounded) {
        const lineWidths = ['text-line-1', 'text-line-2', 'text-line-3', 'text-line-4', 'text-line-5'];
        
        for (let i = 0; i < lines; i++) {
            const line = document.createElement('div');
            line.className = `upo-skeleton text ${animated ? 'animated' : ''} ${rounded ? 'rounded' : ''} ${lineWidths[i % lineWidths.length]}`;
            line.style.width = width;
            line.style.height = height === 'auto' ? '1rem' : height;
            this.container.appendChild(line);
        }
    }

    createAvatarSkeleton(width, height, animated, rounded) {
        const avatar = document.createElement('div');
        avatar.className = `upo-skeleton avatar ${animated ? 'animated' : ''}`;
        avatar.style.width = width;
        avatar.style.height = height;
        this.container.appendChild(avatar);
    }

    createButtonSkeleton(width, height, animated, rounded) {
        const button = document.createElement('div');
        button.className = `upo-skeleton button ${animated ? 'animated' : ''} ${rounded ? 'rounded' : ''}`;
        button.style.width = width;
        button.style.height = height === 'auto' ? '2.5rem' : height;
        this.container.appendChild(button);
    }

    createCardSkeleton(width, height, animated, rounded) {
        const card = document.createElement('div');
        card.className = `upo-skeleton card ${animated ? 'animated' : ''} ${rounded ? 'rounded' : ''}`;
        card.style.width = width;
        card.style.height = height === 'auto' ? '200px' : height;
        this.container.appendChild(card);
    }

    createImageSkeleton(width, height, animated, rounded) {
        const image = document.createElement('div');
        image.className = `upo-skeleton image ${animated ? 'animated' : ''} ${rounded ? 'rounded' : ''}`;
        image.style.width = width;
        image.style.height = height === 'auto' ? '200px' : height;
        this.container.appendChild(image);
    }

    // Public method to replace skeleton with content
    replaceWithContent(content) {
        this.innerHTML = content;
        this.dispatchEvent(new CustomEvent('loaded', {
            detail: { content: content }
        }));
    }

    // Public method to show/hide skeleton
    show() {
        this.style.display = 'block';
    }

    hide() {
        this.style.display = 'none';
    }

    // Public method to toggle animation
    setAnimated(animated) {
        this.setAttribute('animated', animated ? 'true' : 'false');
    }
}

// Register the component
customElements.define('ui-skeleton', Skeleton);
export default Skeleton; 