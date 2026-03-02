/**
 * Progress Component
 * 
 * A customizable progress bar component with various styles and variants.
 * 
 * Usage:
 * <ui-progress value="75" max="100" variant="primary" size="md" show-label="true"></ui-progress>
 * 
 * Attributes:
 * - value: Current progress value (number)
 * - max: Maximum value (number, default: 100)
 * - variant: Color variant (primary, success, warning, error, info)
 * - size: Size variant (sm, md, lg)
 * - show-label: Whether to show the percentage label (boolean)
 * - animated: Whether to show animation (boolean)
 * - striped: Whether to show striped pattern (boolean)
 */

class Progress extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
    }

    connectedCallback() {
        this.render();
    }

    static get observedAttributes() {
        return ['value', 'max', 'variant', 'size', 'show-label', 'animated', 'striped'];
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue !== newValue) {
            this.render();
        }
    }

    get value() {
        return parseInt(this.getAttribute('value')) || 0;
    }

    get max() {
        return parseInt(this.getAttribute('max')) || 100;
    }

    get variant() {
        return this.getAttribute('variant') || 'primary';
    }

    get size() {
        return this.getAttribute('size') || 'md';
    }

    get showLabel() {
        return this.hasAttribute('show-label');
    }

    get animated() {
        return this.hasAttribute('animated');
    }

    get striped() {
        return this.hasAttribute('striped');
    }

    get percentage() {
        return Math.min(Math.max((this.value / this.max) * 100, 0), 100);
    }

    getVariantClasses() {
        const variants = {
            primary: 'bg-blue-500',
            success: 'bg-green-500',
            warning: 'bg-yellow-500',
            error: 'bg-red-500',
            info: 'bg-blue-400',
            secondary: 'bg-gray-500'
        };
        return variants[this.variant] || variants.primary;
    }

    getSizeClasses() {
        const sizes = {
            sm: 'h-1',
            md: 'h-2',
            lg: 'h-3',
            xl: 'h-4'
        };
        return sizes[this.size] || sizes.md;
    }

    getAnimationClasses() {
        let classes = '';
        if (this.animated) {
            classes += ' animate-pulse ';
        }
        if (this.striped) {
            classes += ' bg-gradient-to-r from-transparent via-white/20 to-transparent bg-[length:20px_100%] animate-pulse ';
        }
        return classes;
    }

    render() {
        const progressBarClasses = `
            ${this.getVariantClasses()} 
            ${this.getSizeClasses()} 
            ${this.getAnimationClasses()}
            rounded-full transition-all duration-300 ease-in-out
        `.trim();

        this.shadowRoot.innerHTML = `
            <style>
                :host {
                    display: block;
                    width: 100%;
                }

                .progress-container {
                    width: 100%;
                    background-color: #e5e7eb;
                    border-radius: 9999px;
                    overflow: hidden;
                    position: relative;
                }

                .progress-bar {
                    height: 100%;
                    border-radius: 9999px;
                    transition: width 0.3s ease-in-out;
                    position: relative;
                }

                .progress-label {
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    font-size: 0.75rem;
                    font-weight: 600;
                    color: white;
                    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
                    z-index: 10;
                }

                .progress-info {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 0.5rem;
                    font-size: 0.875rem;
                    color: #6b7280;
                }

                .progress-value {
                    font-weight: 600;
                    color: #374151;
                }

                .progress-max {
                    color: #9ca3af;
                }

                /* Animation classes */
                .animate-pulse {
                    animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
                }

                @keyframes pulse {
                    0%, 100% {
                        opacity: 1;
                    }
                    50% {
                        opacity: .5;
                    }
                }

                /* Size variants */
                .h-1 { height: 0.25rem; }
                .h-2 { height: 0.5rem; }
                .h-3 { height: 0.75rem; }
                .h-4 { height: 1rem; }

                /* Color variants */
                .bg-blue-500 { background-color: #3b82f6; }
                .bg-green-500 { background-color: #10b981; }
                .bg-yellow-500 { background-color: #f59e0b; }
                .bg-red-500 { background-color: #ef4444; }
                .bg-blue-400 { background-color: #60a5fa; }
                .bg-gray-500 { background-color: #6b7280; }

                /* Striped animation */
                .bg-gradient-to-r {
                    background-image: linear-gradient(to right, transparent, rgba(255, 255, 255, 0.2), transparent);
                }

                .bg-\\[length\\:20px_100\\%\\] {
                    background-size: 20px 100%;
                }

                /* Responsive text sizing */
                @media (max-width: 640px) {
                    .progress-label {
                        font-size: 0.625rem;
                    }
                }
            </style>

            <div class="progress-container">
                ${this.showLabel ? `
                    <div class="progress-info">
                        <span class="progress-value">${this.value}</span>
                        <span class="progress-max">/ ${this.max}</span>
                    </div>
                ` : ''}
                
                <div class="progress-bar ${progressBarClasses}" style="width: ${this.percentage}%">
                    ${this.showLabel && this.percentage > 15 ? `
                        <div class="progress-label">${Math.round(this.percentage)}%</div>
                    ` : ''}
                </div>
            </div>
        `;
    }
}

customElements.define('ui-progress', Progress);
export default Progress; 