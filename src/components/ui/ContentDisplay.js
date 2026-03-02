/**
 * Content Display Component
 * 
 * A component for displaying formatted content (typically from WYSIWYG editor)
 * with consistent styling and dynamic content support.
 * 
 * Attributes:
 * - content: string (HTML content to display)
 * - max-height: string (max height with overflow, e.g., '300px')
 * - truncate: boolean (whether to truncate with ellipsis when overflowing)
 * - no-styles: boolean (disables default styles if needed)
 * 
 * Events:
 * - content-updated: Fires when content is updated
 * 
 * Methods:
 * - setContent(html): Update the content
 * - getContent(): Get current content
 * - clear(): Clear the content
 * 
 * Usage:
 * <content-display content="<p>Your HTML</p>"></content-display>
 * <content-display max-height="200px" truncate></content-display>
 */
class ContentDisplay extends HTMLElement {
    constructor() {
      super();
      this._content = '';
      this.attachShadow({ mode: 'open' });
    }
  
    static get observedAttributes() {
      return ['content', 'max-height', 'truncate', 'no-styles'];
    }
  
    connectedCallback() {
      this.render();
    }
  
    attributeChangedCallback(name, oldValue, newValue) {
      if (oldValue !== newValue) {
        if (name === 'content') {
          this._content = newValue || '';
          this.renderContent();
        } else {
          this.updateStyles();
        }
      }
    }
  
    render() {
      this.shadowRoot.innerHTML = `
        <style>
          ${this.getStyles()}
        </style>
        <div class="content-container" part="container">
          <div class="content" part="content"></div>
        </div>
      `;
      this.renderContent();
    }
  
    renderContent() {
      if (!this.shadowRoot) return;
      
      const contentEl = this.shadowRoot.querySelector('.content');
      if (contentEl) {
        contentEl.innerHTML = this._content;
        this.dispatchEvent(new CustomEvent('content-updated', {
          bubbles: true,
          detail: { content: this._content }
        }));
      }
    }
  
    updateStyles() {
      if (!this.shadowRoot) return;
      
      const container = this.shadowRoot.querySelector('.content-container');
      if (container) {
        container.style.maxHeight = this.getAttribute('max-height') || '';
        container.style.webkitLineClamp = this.hasAttribute('truncate') ? 'var(--max-lines, 3)' : '';
      }
    }
  
    getStyles() {
      if (this.hasAttribute('no-styles')) return '';
      
      return `
        :host {
          display: block;
          --max-lines: 3;
          --content-color: #374151;
          --content-bg: transparent;
          --heading-color: #111827;
          --link-color: #3b82f6;
          --link-hover: #2563eb;
          --code-bg: #f3f4f6;
          --code-color: #1f2937;
          --quote-border: #d1d5db;
          --quote-color: #4b5563;
          --content-font: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
          --line-height: 1.6;
        }
  
        .content-container {
          font-family: var(--content-font);
          color: var(--content-color);
          background: var(--content-bg);
          line-height: var(--line-height);
          overflow-wrap: break-word;
        }
  
        .content-container[truncate] {
          display: -webkit-box;
          -webkit-box-orient: vertical;
          overflow: hidden;
          text-overflow: ellipsis;
          -webkit-line-clamp: var(--max-lines);
        }
  
        .content {
          overflow: auto;
        }
  
        /* Typography */
        .content p {
          margin: 0 0 1rem 0;
        }
  
        .content h1,
        .content h2,
        .content h3,
        .content h4,
        .content h5,
        .content h6 {
          margin: 1.5rem 0 1rem 0;
          font-weight: 600;
          line-height: 1.25;
          color: var(--heading-color);
        }
  
        .content h1 { 
          font-size: 2rem;
          border-bottom: 1px solid var(--quote-border);
          padding-bottom: 0.5rem;
        }
  
        .content h2 { 
          font-size: 1.75rem;
          border-bottom: 1px solid var(--quote-border);
          padding-bottom: 0.4rem;
        }
  
        .content h3 { font-size: 1.5rem; }
        .content h4 { font-size: 1.25rem; }
        .content h5 { font-size: 1.125rem; }
        .content h6 { 
          font-size: 1rem;
          color: #6b7280;
        }
  
        /* Lists */
        .content ul,
        .content ol {
          padding-left: 1.75rem;
          margin: 1rem 0;
        }
  
        .content li {
          margin-bottom: 0.5rem;
        }
  
        .content li::marker {
          color: #6b7280;
        }
  
        /* Block Elements */
        .content blockquote {
          border-left: 4px solid var(--quote-border);
          margin: 1.5rem 0;
          padding-left: 1.5rem;
          color: var(--quote-color);
          font-style: italic;
        }
  
        .content pre {
          background: var(--code-bg);
          color: var(--code-color);
          padding: 1.25rem;
          border-radius: 0.375rem;
          overflow-x: auto;
          margin: 1.5rem 0;
          font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
          font-size: 0.875em;
          line-height: 1.5;
        }
  
        .content code {
          background: var(--code-bg);
          color: var(--code-color);
          padding: 0.2em 0.4em;
          border-radius: 0.25em;
          font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
          font-size: 0.875em;
        }
  
        .content pre code {
          background: none;
          padding: 0;
          font-size: inherit;
        }
  
        /* Links */
        .content a {
          color: var(--link-color);
          text-decoration: underline;
          transition: color 0.2s ease;
        }
  
        .content a:hover {
          color: var(--link-hover);
        }
  
        /* Media */
        .content img {
          max-width: 100%;
          height: auto;
          border-radius: 0.375rem;
          margin: 1rem 0;
        }
  
        .content iframe {
          max-width: 100%;
          border-radius: 0.375rem;
          margin: 1rem 0;
        }
  
        /* Tables */
        .content table {
          border-collapse: collapse;
          width: 100%;
          margin: 1.5rem 0;
        }
  
        .content th,
        .content td {
          border: 1px solid var(--quote-border);
          padding: 0.75rem;
          text-align: left;
        }
  
        .content th {
          background-color: #f9fafb;
          font-weight: 600;
        }
  
        /* Dark Mode */
        @media (prefers-color-scheme: dark) {
          :host {
            --content-color: #f3f4f6;
            --content-bg: #1f2937;
            --heading-color: #f9fafb;
            --link-color: #3b82f6;
            --link-hover: #93c5fd;
            --code-bg: #111827;
            --code-color: #f3f4f6;
            --quote-border: #4b5563;
            --quote-color: #d1d5db;
          }
  
          .content th {
            background-color: #111827;
          }
        }
      `;
    }
  
    // Public API
    setContent(html) {
      this._content = html || '';
      this.setAttribute('content', this._content);
      this.renderContent();
    }
  
    getContent() {
      return this._content;
    }
  
    clear() {
      this.setContent('');
    }
  
    // Getters/Setters
    get content() {
      return this.getContent();
    }
  
    set content(value) {
      this.setContent(value);
    }
  }
  
  customElements.define('content-display', ContentDisplay);
  export default ContentDisplay;