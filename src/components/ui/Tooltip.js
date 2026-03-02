/**
 * Tooltip Component
 * 
 * A flexible tooltip component that can be positioned around any element with various triggers.
 * 
 * Features:
 * - Multiple positions (top, bottom, left, right, top-start, top-end, etc.)
 * - Different triggers (hover, click, focus, manual)
 * - Various styling variants (default, primary, success, warning, error, info)
 * - Customizable delay and duration
 * - Arrow indicators
 * - Rich content support (HTML)
 * - Accessibility features
 * 
 * Usage:
 * <ui-tooltip content="Simple tooltip">
 *   <button>Hover me</button>
 * </ui-tooltip>
 * 
 * <ui-tooltip content="Click tooltip" trigger="click" position="bottom">
 *   <button>Click me</button>
 * </ui-tooltip>
 * 
 * <ui-tooltip content="Rich content" variant="success">
 *   <div>Rich <strong>HTML</strong> content</div>
 * </ui-tooltip>
 */

class Tooltip extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.isVisible = false;
        this.timeout = null;
        this.triggerElement = null;
        this.tooltipElement = null;
    }

    connectedCallback() {
        this.render();
        this.setupTooltip();
        this.setupEventListeners();
    }

    static get observedAttributes() {
        return [
            'content', 'position', 'trigger', 'variant', 'delay', 'duration',
            'max-width', 'disabled'
        ];
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue !== newValue) {
            switch (name) {
                case 'content':
                    this.updateContent();
                    break;
                case 'position':
                    this.updatePosition();
                    break;
                case 'variant':
                    this.updateVariant();
                    break;
                case 'disabled':
                    this.updateDisabledState();
                    break;
            }
        }
    }

    render() {
        const content = this.getAttribute('content') || '';
        const position = this.getAttribute('position') || 'top';
        const trigger = this.getAttribute('trigger') || 'hover';
        const variant = this.getAttribute('variant') || 'default';
        const delay = this.getAttribute('delay') || '200';
        const duration = this.getAttribute('duration') || '300';
        const maxWidth = this.getAttribute('max-width') || '200px';
        const disabled = this.hasAttribute('disabled');

        this.shadowRoot.innerHTML = `
            <style>
                :host {
                    display: inline-block;
                    position: relative;
                }

                .tooltip-trigger {
                    display: contents;
                }

                .tooltip {
                    position: fixed;
                    z-index: 9999;
                    background-color: #1f2937;
                    color: #ffffff;
                    padding: 0.375rem 0.5rem;
                    border-radius: 0.375rem;
                    font-size: 0.875rem;
                    line-height: 1.25rem;
                    max-width: ${maxWidth};
                    word-wrap: break-word;
                    opacity: 0;
                    visibility: hidden;
                    transition: opacity ${duration}ms ease-in-out, visibility ${duration}ms ease-in-out;
                    pointer-events: none;
                    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
                }

                .tooltip--visible {
                    opacity: 1;
                    visibility: visible;
                }

                /* Position variants */
                .tooltip--top {
                    transform: translateX(-50%);
                }

                .tooltip--top-start {
                    transform: translateX(0);
                }

                .tooltip--top-end {
                    transform: translateX(-100%);
                }

                .tooltip--bottom {
                    transform: translateX(-50%);
                }

                .tooltip--bottom-start {
                    transform: translateX(0);
                }

                .tooltip--bottom-end {
                    transform: translateX(-100%);
                }

                .tooltip--left {
                    transform: translateY(-50%);
                }

                .tooltip--left-start {
                    transform: translateY(0);
                }

                .tooltip--left-end {
                    transform: translateY(-100%);
                }

                .tooltip--right {
                    transform: translateY(-50%);
                }

                .tooltip--right-start {
                    transform: translateY(0);
                }

                .tooltip--right-end {
                    transform: translateY(-100%);
                }

                /* Variant styles */
                .tooltip--default {
                    background-color: #1f2937;
                    color: #ffffff;
                }

                .tooltip--primary {
                    background-color: #3b82f6;
                    color: #ffffff;
                }

                .tooltip--success {
                    background-color: #10b981;
                    color: #ffffff;
                }

                .tooltip--warning {
                    background-color: #f59e0b;
                    color: #ffffff;
                }

                .tooltip--error {
                    background-color: #ef4444;
                    color: #ffffff;
                }

                .tooltip--info {
                    background-color: #06b6d4;
                    color: #ffffff;
                }

                /* Disabled state */
                .tooltip--disabled {
                    pointer-events: none;
                }

                .tooltip--disabled .tooltip-trigger {
                    opacity: 0.5;
                    cursor: not-allowed;
                }
            </style>

            <div class="tooltip-trigger">
                <slot></slot>
            </div>
            <div class="tooltip tooltip--${position} tooltip--${variant}${disabled ? ' tooltip--disabled' : ''}">
                <div class="tooltip-content">${content}</div>
            </div>
        `;
    }

    setupTooltip() {
        this.tooltipElement = this.shadowRoot.querySelector('.tooltip');
        this.triggerElement = this.shadowRoot.querySelector('.tooltip-trigger');
    }

    setupEventListeners() {
        const trigger = this.getAttribute('trigger') || 'hover';
        const delay = parseInt(this.getAttribute('delay')) || 200;

        if (trigger === 'hover') {
            this.addEventListener('mouseenter', () => this.showTooltip(delay));
            this.addEventListener('mouseleave', () => this.hideTooltip(delay));
        } else if (trigger === 'click') {
            this.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.toggleTooltip();
            });
            
            // Hide on outside click
            document.addEventListener('click', (e) => {
                if (!this.contains(e.target)) {
                    this.hideTooltip();
                }
            });
        } else if (trigger === 'focus') {
            this.addEventListener('focusin', () => this.showTooltip(delay));
            this.addEventListener('focusout', () => this.hideTooltip(delay));
        } else if (trigger === 'manual') {
            // Manual trigger - no automatic events
        }

        // Handle keyboard events for accessibility
        this.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isVisible) {
                this.hideTooltip();
            }
        });
    }

    showTooltip(delay = 0) {
        if (this.hasAttribute('disabled')) return;

        if (this.timeout) {
            clearTimeout(this.timeout);
        }

        this.timeout = setTimeout(() => {
            this.positionTooltip();
            this.tooltipElement.classList.add('tooltip--visible');
            this.isVisible = true;
            this.dispatchEvent(new CustomEvent('tooltip-show'));
        }, delay);
    }

    hideTooltip(delay = 0) {
        if (this.timeout) {
            clearTimeout(this.timeout);
        }

        this.timeout = setTimeout(() => {
            this.tooltipElement.classList.remove('tooltip--visible');
            this.isVisible = false;
            this.dispatchEvent(new CustomEvent('tooltip-hide'));
        }, delay);
    }

    toggleTooltip() {
        if (this.isVisible) {
            this.hideTooltip();
        } else {
            this.showTooltip();
        }
    }

    positionTooltip() {
        const trigger = this.getBoundingClientRect();
        const tooltip = this.tooltipElement;
        const position = this.getAttribute('position') || 'top';
        const arrow = this.hasAttribute('arrow');

        // Reset position
        tooltip.style.top = '';
        tooltip.style.left = '';
        tooltip.style.right = '';
        tooltip.style.bottom = '';

        const tooltipRect = tooltip.getBoundingClientRect();
        const arrowSize = arrow ? 8 : 0;
        const margin = 8;

        switch (position) {
            case 'top':
                tooltip.style.left = trigger.left + trigger.width / 2 + 'px';
                tooltip.style.top = trigger.top - tooltipRect.height - margin - arrowSize + 'px';
                break;
            case 'top-start':
                tooltip.style.left = trigger.left + 'px';
                tooltip.style.top = trigger.top - tooltipRect.height - margin - arrowSize + 'px';
                break;
            case 'top-end':
                tooltip.style.left = trigger.right - tooltipRect.width + 'px';
                tooltip.style.top = trigger.top - tooltipRect.height - margin - arrowSize + 'px';
                break;
            case 'bottom':
                tooltip.style.left = trigger.left + trigger.width / 2 + 'px';
                tooltip.style.top = trigger.bottom + margin + arrowSize + 'px';
                break;
            case 'bottom-start':
                tooltip.style.left = trigger.left + 'px';
                tooltip.style.top = trigger.bottom + margin + arrowSize + 'px';
                break;
            case 'bottom-end':
                tooltip.style.left = trigger.right - tooltipRect.width + 'px';
                tooltip.style.top = trigger.bottom + margin + arrowSize + 'px';
                break;
            case 'left':
                tooltip.style.left = trigger.left - tooltipRect.width - margin - arrowSize + 'px';
                tooltip.style.top = trigger.top + trigger.height / 2 + 'px';
                break;
            case 'left-start':
                tooltip.style.left = trigger.left - tooltipRect.width - margin - arrowSize + 'px';
                tooltip.style.top = trigger.top + 'px';
                break;
            case 'left-end':
                tooltip.style.left = trigger.left - tooltipRect.width - margin - arrowSize + 'px';
                tooltip.style.top = trigger.bottom - tooltipRect.height + 'px';
                break;
            case 'right':
                tooltip.style.left = trigger.right + margin + arrowSize + 'px';
                tooltip.style.top = trigger.top + trigger.height / 2 + 'px';
                break;
            case 'right-start':
                tooltip.style.left = trigger.right + margin + arrowSize + 'px';
                tooltip.style.top = trigger.top + 'px';
                break;
            case 'right-end':
                tooltip.style.left = trigger.right + margin + arrowSize + 'px';
                tooltip.style.top = trigger.bottom - tooltipRect.height + 'px';
                break;
        }

        // Ensure tooltip stays within viewport
        this.adjustPosition();
    }

    adjustPosition() {
        const tooltip = this.tooltipElement;
        const tooltipRect = tooltip.getBoundingClientRect();
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;

        // Adjust horizontal position if tooltip goes outside viewport
        if (tooltipRect.left < 0) {
            tooltip.style.left = '8px';
        } else if (tooltipRect.right > viewportWidth) {
            tooltip.style.left = viewportWidth - tooltipRect.width - 8 + 'px';
        }

        // Adjust vertical position if tooltip goes outside viewport
        if (tooltipRect.top < 0) {
            tooltip.style.top = '8px';
        } else if (tooltipRect.bottom > viewportHeight) {
            tooltip.style.top = viewportHeight - tooltipRect.height - 8 + 'px';
        }
    }

    updateContent() {
        const content = this.getAttribute('content') || '';
        const contentElement = this.shadowRoot.querySelector('.tooltip-content');
        if (contentElement) {
            contentElement.innerHTML = content;
        }
    }

    updatePosition() {
        if (!this.tooltipElement) return;
        
        const position = this.getAttribute('position') || 'top';
        this.tooltipElement.className = this.tooltipElement.className.replace(/tooltip--(top|bottom|left|right)(-start|-end)?/, `tooltip--${position}`);
        
        if (this.isVisible) {
            this.positionTooltip();
        }
    }

    updateVariant() {
        if (!this.tooltipElement) return;
        
        const variant = this.getAttribute('variant') || 'default';
        this.tooltipElement.className = this.tooltipElement.className.replace(/tooltip--(default|primary|success|warning|error|info)/, `tooltip--${variant}`);
    }

    updateDisabledState() {
        if (!this.tooltipElement) return;
        
        const disabled = this.hasAttribute('disabled');
        this.tooltipElement.classList.toggle('tooltip--disabled', disabled);
        
        if (disabled && this.isVisible) {
            this.hideTooltip();
        }
    }

    // Public methods
    show() {
        this.showTooltip();
    }

    hide() {
        this.hideTooltip();
    }

    toggle() {
        this.toggleTooltip();
    }

    setContent(content) {
        this.setAttribute('content', content);
    }

    setPosition(position) {
        this.setAttribute('position', position);
    }

    setVariant(variant) {
        this.setAttribute('variant', variant);
    }

    enable() {
        this.removeAttribute('disabled');
    }

    disable() {
        this.setAttribute('disabled', '');
    }
}

customElements.define('ui-tooltip', Tooltip);
export default Tooltip; 