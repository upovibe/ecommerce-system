/**
 * Toast Component
 * 
 * Displays toast notifications with different variants and positions.
 * Supports different types: success, error, warning, info, default
 * 
 * Attributes:
 * - variant: 'success' | 'error' | 'warning' | 'info' | 'default'
 * - position: 'top-right' | 'top-left' | 'top' | 'bottom-right' | 'bottom-left' | 'bottom'
 * - duration: number (milliseconds, 0 = no auto-hide)
 * - message: string
 * - title: string (optional)
 * 
 * Usage:
 * <ui-toast message="Hello World!" variant="success"></ui-toast>
 * Toast.show({ message: "Success!", variant: "success" });
 */
class Toast extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.isVisible = false;
    this.timeoutId = null;
  }

  connectedCallback() {
    this.render();
    this.setupStyles();
  }

  static get observedAttributes() {
    return ['variant', 'position', 'duration', 'message', 'title'];
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (oldValue !== newValue) {
      this.render();
    }
  }

  setupStyles() {
    const style = document.createElement('style');
    style.textContent = `
      :host {
        display: block;
        position: fixed;
        z-index: 9999;
        max-width: 400px;
        min-width: 300px;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        opacity: 0;
        transform: translateY(-20px) scale(0.95);
      }

      :host([visible]) {
        opacity: 1;
        transform: translateY(0) scale(1);
      }

      :host([visible][position="top"]) {
        opacity: 1;
        transform: translateY(0) translateX(-50%) scale(1);
      }

      :host([visible][position="bottom"]) {
        opacity: 1;
        transform: translateY(0) translateX(-50%) scale(1);
      }

      :host([position="top-right"]) {
        top: 20px;
        right: 20px;
      }

      :host([position="top-left"]) {
        top: 20px;
        left: 20px;
      }

      :host([position="top"]) {
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
      }

      :host([position="bottom-right"]) {
        bottom: 20px;
        right: 20px;
      }

      :host([position="bottom-left"]) {
        bottom: 20px;
        left: 20px;
      }

      :host([position="bottom"]) {
        bottom: 20px;
        left: 50%;
        transform: translateX(-50%);
      }

      .toast {
        background: white;
        border-radius: 8px;
        box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
        overflow: hidden;
      }

      .toast-content {
        padding: 16px;
        display: flex;
        align-items: flex-start;
        gap: 12px;
      }

      .icon {
        flex-shrink: 0;
        width: 20px;
        height: 20px;
        margin-top: 2px;
      }

      .icon.success {
        color: #10b981;
      }

      .icon.error {
        color: #ef4444;
      }

      .icon.warning {
        color: #f59e0b;
      }

      .icon.info {
        color: #3b82f6;
      }

      .icon.default {
        color: #6b7280;
      }

      .content {
        flex: 1;
        min-width: 0;
      }

      .title {
        font-weight: 600;
        font-size: 14px;
        color: #111827;
        margin: 0 0 4px 0;
        line-height: 1.4;
      }

      .message {
        font-size: 13px;
        color: #6b7280;
        margin: 0;
        line-height: 1.4;
      }

      .close-btn {
        background: none;
        border: none;
        color: #9ca3af;
        cursor: pointer;
        padding: 6px;
        border-radius: 4px;
        transition: all 0.2s ease;
        flex-shrink: 0;
        width: 28px;
        height: 28px;
        display: flex;
        align-items: center;
        justify-content: center;
        user-select: none;
        -webkit-user-select: none;
        -moz-user-select: none;
        -ms-user-select: none;
      }

      .close-btn:hover {
        background: #f3f4f6;
        color: #6b7280;
        transform: scale(1.1);
      }

      .close-btn:active {
        background: #e5e7eb;
        color: #374151;
        transform: scale(0.95);
      }

      .close-btn:focus {
        outline: 2px solid #3b82f6;
        outline-offset: 2px;
      }

      .close-btn svg {
        width: 16px;
        height: 16px;
        pointer-events: none;
      }

      .progress-bar {
        height: 4px;
        background: #f3f4f6;
        position: relative;
        overflow: hidden;
        border-radius: 0 0 8px 8px;
      }

      .progress-fill {
        height: 100%;
        border-radius: 0 0 8px 8px;
        transition: width linear;
        position: relative;
      }

      .progress-fill::after {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
        animation: shimmer 2s infinite;
      }

      @keyframes shimmer {
        0% { transform: translateX(-100%); }
        100% { transform: translateX(100%); }
      }

      .progress-fill.success {
        background: linear-gradient(90deg, #10b981, #059669);
      }

      .progress-fill.error {
        background: linear-gradient(90deg, #ef4444, #dc2626);
      }

      .progress-fill.warning {
        background: linear-gradient(90deg, #f59e0b, #d97706);
      }

      .progress-fill.info {
        background: linear-gradient(90deg, #3b82f6, #2563eb);
      }

      .progress-fill.default {
        background: linear-gradient(90deg, #6b7280, #4b5563);
      }
    `;
    this.shadowRoot.appendChild(style);
  }

  getIcon(variant) {
    const icons = {
      success: `<svg class="icon ${variant}" fill="currentColor" viewBox="0 0 20 20">
        <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
      </svg>`,
      error: `<svg class="icon ${variant}" fill="currentColor" viewBox="0 0 20 20">
        <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"/>
      </svg>`,
      warning: `<svg class="icon ${variant}" fill="currentColor" viewBox="0 0 20 20">
        <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/>
      </svg>`,
      info: `<svg class="icon ${variant}" fill="currentColor" viewBox="0 0 20 20">
        <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"/>
      </svg>`,
      default: `<svg class="icon ${variant}" fill="currentColor" viewBox="0 0 20 20">
        <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"/>
      </svg>`
    };
    return icons[variant] || icons.default;
  }

  render() {
    const variant = this.getAttribute('variant') || 'default';
    const position = this.getAttribute('position') || 'top-right';
    const title = this.getAttribute('title') || '';
    const message = this.getAttribute('message') || '';
    const duration = parseInt(this.getAttribute('duration')) || 5000;

    this.setAttribute('position', position);

    this.shadowRoot.innerHTML = `
      <div class="toast" variant="${variant}">
        <div class="toast-content">
          ${this.getIcon(variant)}
          <div class="content">
            ${title ? `<div class="title">${title}</div>` : ''}
            ${message ? `<div class="message">${message}</div>` : ''}
          </div>
          <button class="close-btn" aria-label="Close toast">
            <svg fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"/>
            </svg>
          </button>
        </div>
        <div class="progress-bar">
          <div class="progress-fill ${variant}" style="width: 100%"></div>
        </div>
      </div>
    `;

    this.setupEventListeners();
    this.startProgress(duration);
  }

  setupEventListeners() {
    const closeBtn = this.shadowRoot.querySelector('.close-btn');
    if (closeBtn) {
      // Remove any existing listeners to prevent duplicates
      closeBtn.removeEventListener('click', this.handleClose);
      closeBtn.removeEventListener('mousedown', this.handleClose);
      
      // Add click listener
      closeBtn.addEventListener('click', this.handleClose.bind(this));
      
      // Also add mousedown for better responsiveness
      closeBtn.addEventListener('mousedown', this.handleClose.bind(this));
    }
  }

  handleClose(event) {
    event.preventDefault();
    event.stopPropagation();
    console.log('Close button clicked');
    this.hide();
  }

  startProgress(duration) {
    const progressFill = this.shadowRoot.querySelector('.progress-fill');
    if (progressFill && duration > 0) {
      progressFill.style.transition = `width ${duration}ms linear`;
      setTimeout(() => {
        progressFill.style.width = '0%';
      }, 100);
    }
  }

  show() {
    this.isVisible = true;
    this.setAttribute('visible', '');
    this.dispatchEvent(new CustomEvent('toast-show'));
  }

  hide() {
    this.isVisible = false;
    this.removeAttribute('visible');
    this.dispatchEvent(new CustomEvent('toast-hide'));
    
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
  }

  // Static method to create and show a toast
  static show(options = {}) {
    const {
      message = '',
      title = '',
      variant = 'default',
      position = 'top-right',
      duration = 5000
    } = options;

    const toast = document.createElement('ui-toast');
    toast.setAttribute('message', message);
    toast.setAttribute('title', title);
    toast.setAttribute('variant', variant);
    toast.setAttribute('position', position);
    toast.setAttribute('duration', duration.toString());

    document.body.appendChild(toast);
    
    // Show after a brief delay to ensure rendering
    setTimeout(() => toast.show(), 10);

    // Auto-hide after duration
    if (duration > 0) {
      toast.timeoutId = setTimeout(() => toast.hide(), duration);
    }

    return toast;
  }
}

// Register the component
customElements.define('ui-toast', Toast);

// Make Toast available globally immediately
if (typeof window !== 'undefined') {
  window.Toast = Toast;
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = Toast;
}

export default Toast; 