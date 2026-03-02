/**
 * Enhanced WYSIWYG Editor Component
 * 
 * A rich text editor component using Quill.js with improved styling and functionality
 * 
 * Attributes:
 * - placeholder: string (default: 'Start writing...') - placeholder text
 * - value: string (default: '') - initial content
 * - readonly: boolean (default: false) - read-only mode
 * - theme: string (default: 'snow') - editor theme ('snow' or 'bubble')
 * - height: string (default: '300px') - editor height
 * - toolbar: string (default: 'full') - toolbar configuration: 'full', 'basic', 'minimal', 'custom', 'none'
 * - formats: string - comma-separated list of allowed formats (default: all)
 * - bounds: string - CSS selector for container to constrain editor within
 * - color-scheme: string - force color scheme: 'light', 'dark', or auto (default: auto)
 * 
 * Events:
 * - change: Fired when content changes (detail: { html: string, text: string, delta: object })
 * - focus: Fired when editor gains focus
 * - blur: Fired when editor loses focus
 * - ready: Fired when editor is fully initialized
 * 
 * Methods:
 * - getValue(): string - Get HTML content
 * - setValue(html: string): void - Set HTML content
 * - getText(): string - Get plain text content
 * - setText(text: string): void - Set plain text content
 * - getDelta(): Delta - Get Quill delta
 * - setDelta(delta: Delta): void - Set Quill delta
 * - enable(): void - Enable editor
 * - disable(): void - Disable editor
 * - focus(): void - Focus editor
 * - blur(): void - Blur editor
 * - insertEmbed(index: number, type: string, value: any): void - Insert embed
 * - format(name: string, value: any): void - Apply format
 * - formatLine(index: number, length: number, name: string, value: any): void - Format line
 * - formatText(index: number, length: number, name: string, value: any): void - Format text
 * - getSelection(): Range - Get current selection range
 * - setSelection(index: number, length: number): void - Set selection range
 * 
 * Usage:
 * <ui-wysiwyg placeholder="Write your content here..."></ui-wysiwyg>
 * <ui-wysiwyg toolbar="basic" height="200px"></ui-wysiwyg>
 * <ui-wysiwyg readonly value="<p>Read-only content</p>"></ui-wysiwyg>
 * <ui-wysiwyg color-scheme="light" placeholder="Light mode editor"></ui-wysiwyg>
 */
class Wysiwyg extends HTMLElement {
    constructor() {
      super();
      this._editor = null;
      this._quillLoaded = false;
      this._initialized = false;
      this._pendingValue = null;
      this._formats = null;
    }
  
    static get observedAttributes() {
      return ['placeholder', 'value', 'readonly', 'theme', 'height', 'toolbar', 'formats', 'bounds', 'color-scheme'];
    }
  
    connectedCallback() {
      this.loadQuill();
    }
  
    disconnectedCallback() {
      this._cleanup();
    }
  
    attributeChangedCallback(name, oldValue, newValue) {
      if (!this._initialized) return;
  
      switch (name) {
        case 'placeholder':
          this._updatePlaceholder(newValue);
          break;
        case 'value':
          this._updateValue(newValue);
          break;
        case 'readonly':
          this._updateReadonly(newValue !== null);
          break;
        case 'height':
          this._updateHeight(newValue);
          break;
        case 'theme':
          this._updateTheme(newValue);
          break;
        case 'toolbar':
          this._updateToolbar(newValue);
          break;
        case 'formats':
          this._updateFormats(newValue);
          break;
        case 'bounds':
          this._updateBounds(newValue);
          break;
        case 'color-scheme':
          this._updateColorScheme(newValue);
          break;
      }
    }
  
    // Private methods
    async loadQuill() {
      if (window.Quill) {
        this._initializeEditor();
        return;
      }
  
      // Load Quill CSS
      if (!document.querySelector('link[href*="quill"]')) {
        const link = document.createElement('link');
        link.href = 'https://cdn.quilljs.com/1.3.6/quill.snow.css';
        link.rel = 'stylesheet';
        document.head.appendChild(link);
      }
  
      // Load Quill JS
      if (!document.querySelector('script[src*="quill"]')) {
        const script = document.createElement('script');
        script.src = 'https://cdn.quilljs.com/1.3.6/quill.min.js';
        script.onload = () => this._initializeEditor();
        script.onerror = () => console.error('Failed to load Quill.js');
        document.head.appendChild(script);
      } else {
        const checkQuill = setInterval(() => {
          if (window.Quill) {
            clearInterval(checkQuill);
            this._initializeEditor();
          }
        }, 100);
      }
    }
  
    _initializeEditor() {
      if (this._initialized || !window.Quill) return;
  
      // Clear any existing content
      this.innerHTML = '';
      
      // Create editor container
      const container = document.createElement('div');
      container.className = 'wysiwyg-editor-container';
      this.appendChild(container);
  
      // Get configuration
      const placeholder = this.getAttribute('placeholder') || 'Start writing...';
      const theme = this.getAttribute('theme') || 'snow';
      const height = this.getAttribute('height') || '300px';
      const toolbar = this.getAttribute('toolbar') || 'full';
      const readonly = this.hasAttribute('readonly');
      const bounds = this.getAttribute('bounds');
      const formats = this.getAttribute('formats');
      const colorScheme = this.getAttribute('color-scheme');
  
      // Initialize Quill
      this._editor = new window.Quill(container, {
        theme: theme,
        placeholder: placeholder,
        readOnly: readonly,
        bounds: bounds ? document.querySelector(bounds) : this,
        modules: {
          toolbar: this._getToolbarConfig(toolbar),
          clipboard: {
            matchVisual: false
          }
        },
        formats: formats ? this._parseFormats(formats) : null
      });
  
      // Set initial content
      const initialValue = this.getAttribute('value');
      if (initialValue) {
        this._pendingValue = initialValue;
      }
  
      // Set height
      this._updateHeight(height);
  
      // Set color scheme
      this._updateColorScheme(colorScheme);
  
      // Add custom styles
      this._addCustomStyles();
  
      // Setup event listeners
      this._setupEventListeners();
  
      // Mark as initialized
      this._initialized = true;
      this.dispatchEvent(new CustomEvent('ready', { bubbles: true }));
  
      // Apply pending value if exists
      if (this._pendingValue) {
        this._updateValue(this._pendingValue);
        this._pendingValue = null;
      }
    }
  
    _getToolbarConfig(toolbar) {
      switch (toolbar) {
        case 'none':
          return false;
        case 'basic':
          return [
            ['bold', 'italic', 'underline'],
            ['link', 'blockquote', 'code-block'],
            [{ 'list': 'ordered'}, { 'list': 'bullet' }],
            ['clean']
          ];
        case 'minimal':
          return [
            ['bold', 'italic'],
            ['link']
          ];
        case 'custom':
          return [
            ['bold', 'italic', 'underline', 'strike'],
            ['blockquote', 'code-block'],
            [{ 'header': 1 }, { 'header': 2 }],
            [{ 'list': 'ordered'}, { 'list': 'bullet' }],
            [{ 'script': 'sub'}, { 'script': 'super' }],
            [{ 'indent': '-1'}, { 'indent': '+1' }],
            [{ 'direction': 'rtl' }],
            [{ 'size': ['small', false, 'large', 'huge'] }],
            [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
            [{ 'color': [] }, { 'background': [] }],
            [{ 'font': [] }],
            [{ 'align': [] }],
            ['clean'],
            ['link', 'image', 'video']
          ];
        default: // 'full'
          return [
            [{ 'font': [] }],
            [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
            ['bold', 'italic', 'underline', 'strike'],
            [{ 'color': [] }, { 'background': [] }],
            [{ 'script': 'sub'}, { 'script': 'super' }],
            [{ 'list': 'ordered'}, { 'list': 'bullet' }, { 'indent': '-1'}, { 'indent': '+1' }],
            [{ 'direction': 'rtl' }],
            [{ 'align': [] }],
            ['blockquote', 'code-block'],
            ['link', 'image', 'video'],
            ['clean']
          ];
      }
    }
  
    _parseFormats(formats) {
      if (!formats) return null;
      return formats.split(',').map(f => f.trim());
    }
  
    _addCustomStyles() {
      if (document.getElementById('wysiwyg-editor-styles')) return;
  
      const style = document.createElement('style');
      style.id = 'wysiwyg-editor-styles';
      style.textContent = `
        /* Base Container Styles */
        .wysiwyg-editor-container {
          --editor-border: 1px solid #d1d5db;
          --editor-border-radius: 0.375rem;
          --editor-bg: #ffffff;
          --editor-text: #1f2937;
          --editor-placeholder: #9ca3af;
          --editor-toolbar-bg: #f9fafb;
          --editor-toolbar-border: #d1d5db;
          --editor-toolbar-button-hover: #e5e7eb;
          --editor-toolbar-button-active: #dbeafe;
          --editor-toolbar-icon: #4b5563;
          --editor-toolbar-icon-active: #1d4ed8;
          --editor-focus-ring: 0 0 0 3px rgba(59, 130, 246, 0.1);
          --editor-blockquote-border: #d1d5db;
          --editor-blockquote-text: #4b5563;
          --editor-code-bg: #f3f4f6;
          --editor-code-text: #1f2937;
          --editor-link: #3b82f6;
          --editor-link-hover: #2563eb;
          --editor-selection-bg: #bfdbfe;
          
          border: var(--editor-border);
          border-radius: var(--editor-border-radius);
          background: var(--editor-bg);
          overflow: hidden;
          transition: border-color 0.2s ease, box-shadow 0.2s ease;
        }
  
        /* Focus State */
        .wysiwyg-editor-container:focus-within {
          border-color: #3b82f6;
          box-shadow: var(--editor-focus-ring);
        }
  
        /* Toolbar Styles */
        .wysiwyg-editor-container .ql-toolbar {
          border: none;
          border-bottom: var(--editor-border);
          background: var(--editor-toolbar-bg);
          padding: 0.5rem;
        }
  
        .wysiwyg-editor-container .ql-toolbar.ql-snow {
          border: none;
          border-bottom: var(--editor-border);
        }
  
        .wysiwyg-editor-container .ql-toolbar .ql-formats {
          margin-right: 0.75rem;
        }
  
        .wysiwyg-editor-container .ql-toolbar button {
          width: 2rem;
          height: 2rem;
          border-radius: 0.25rem;
          transition: background-color 0.2s ease;
        }
  
        .wysiwyg-editor-container .ql-toolbar button:hover {
          background-color: var(--editor-toolbar-button-hover);
        }
  
        .wysiwyg-editor-container .ql-toolbar button.ql-active {
          background-color: var(--editor-toolbar-button-active);
        }
  
        .wysiwyg-editor-container .ql-toolbar .ql-stroke {
          stroke: var(--editor-toolbar-icon);
        }
  
        .wysiwyg-editor-container .ql-toolbar .ql-fill {
          fill: var(--editor-toolbar-icon);
        }
  
        .wysiwyg-editor-container .ql-toolbar button:hover .ql-stroke,
        .wysiwyg-editor-container .ql-toolbar button:focus .ql-stroke,
        .wysiwyg-editor-container .ql-toolbar button.ql-active .ql-stroke {
          stroke: var(--editor-toolbar-icon-active);
        }
  
        .wysiwyg-editor-container .ql-toolbar button:hover .ql-fill,
        .wysiwyg-editor-container .ql-toolbar button:focus .ql-fill,
        .wysiwyg-editor-container .ql-toolbar button.ql-active .ql-fill {
          fill: var(--editor-toolbar-icon-active);
        }
  
        .wysiwyg-editor-container .ql-toolbar .ql-picker-label {
          color: var(--editor-toolbar-icon);
          border: 1px solid transparent;
        }
  
        .wysiwyg-editor-container .ql-toolbar .ql-picker-label:hover {
          color: var(--editor-toolbar-icon-active);
        }
  
        .wysiwyg-editor-container .ql-toolbar .ql-picker-options {
          background-color: var(--editor-bg);
          border: var(--editor-border);
          border-radius: var(--editor-border-radius);
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
          padding: 0.5rem;
        }
  
        .wysiwyg-editor-container .ql-toolbar .ql-picker-item {
          padding: 0.25rem 0.5rem;
          border-radius: 0.25rem;
        }
  
        .wysiwyg-editor-container .ql-toolbar .ql-picker-item:hover {
          background-color: var(--editor-toolbar-button-hover);
        }
  
        /* Editor Container */
        .wysiwyg-editor-container .ql-container {
          border: none;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
          font-size: 1rem;
          line-height: 1.5;
          color: var(--editor-text);
        }
  
        .wysiwyg-editor-container .ql-container.ql-snow {
          border: none;
        }
  
        /* Editor Content */
        .wysiwyg-editor-container .ql-editor {
          padding: 1rem;
          min-height: 150px;
          color: var(--editor-text);
        }
  
        .wysiwyg-editor-container .ql-editor.ql-blank::before {
          color: var(--editor-placeholder);
          font-style: normal;
          left: 1rem;
        }
  
        .wysiwyg-editor-container .ql-editor:focus {
          outline: none;
        }
  
        /* Typography */
        .wysiwyg-editor-container .ql-editor p {
          margin-bottom: 1rem;
        }
  
        .wysiwyg-editor-container .ql-editor h1,
        .wysiwyg-editor-container .ql-editor h2,
        .wysiwyg-editor-container .ql-editor h3,
        .wysiwyg-editor-container .ql-editor h4,
        .wysiwyg-editor-container .ql-editor h5,
        .wysiwyg-editor-container .ql-editor h6 {
          margin-top: 1.5rem;
          margin-bottom: 1rem;
          font-weight: 600;
          line-height: 1.25;
          color: var(--editor-text);
        }
  
        .wysiwyg-editor-container .ql-editor h1 { 
          font-size: 2rem;
          border-bottom: 1px solid var(--editor-toolbar-border);
          padding-bottom: 0.5rem;
        }
  
        .wysiwyg-editor-container .ql-editor h2 { 
          font-size: 1.75rem;
          border-bottom: 1px solid var(--editor-toolbar-border);
          padding-bottom: 0.4rem;
        }
  
        .wysiwyg-editor-container .ql-editor h3 { 
          font-size: 1.5rem;
        }
  
        .wysiwyg-editor-container .ql-editor h4 { 
          font-size: 1.25rem;
        }
  
        .wysiwyg-editor-container .ql-editor h5 { 
          font-size: 1.125rem;
        }
  
        .wysiwyg-editor-container .ql-editor h6 { 
          font-size: 1rem;
          color: #6b7280;
        }
  
        /* Block Elements */
        .wysiwyg-editor-container .ql-editor blockquote {
          border-left: 4px solid var(--editor-blockquote-border);
          margin: 1.5rem 0;
          padding-left: 1.5rem;
          color: var(--editor-blockquote-text);
          font-style: italic;
        }
  
        .wysiwyg-editor-container .ql-editor code {
          background: var(--editor-code-bg);
          color: var(--editor-code-text);
          padding: 0.2em 0.4em;
          border-radius: 0.25em;
          font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
          font-size: 0.875em;
        }
  
        .wysiwyg-editor-container .ql-editor pre {
          background: var(--editor-code-bg);
          color: var(--editor-code-text);
          padding: 1.25rem;
          border-radius: var(--editor-border-radius);
          overflow-x: auto;
          margin: 1.5rem 0;
          font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
          font-size: 0.875em;
          line-height: 1.5;
        }
  
        .wysiwyg-editor-container .ql-editor pre code {
          background: none;
          padding: 0;
          font-size: inherit;
        }
  
        /* Lists */
        .wysiwyg-editor-container .ql-editor ul,
        .wysiwyg-editor-container .ql-editor ol {
          padding-left: 1.75rem;
          margin: 1rem 0;
        }
  
        .wysiwyg-editor-container .ql-editor li {
          margin-bottom: 0.5rem;
          padding-left: 0.25rem;
        }
  
        .wysiwyg-editor-container .ql-editor li::marker {
          color: #6b7280;
        }
  
        /* Links */
        .wysiwyg-editor-container .ql-editor a {
          color: var(--editor-link);
          text-decoration: underline;
          transition: color 0.2s ease;
        }
  
        .wysiwyg-editor-container .ql-editor a:hover {
          color: var(--editor-link-hover);
        }
  
        /* Media */
        .wysiwyg-editor-container .ql-editor img {
          max-width: 100%;
          height: auto;
          border-radius: var(--editor-border-radius);
          margin: 1rem 0;
        }
  
        .wysiwyg-editor-container .ql-editor iframe {
          max-width: 100%;
          border-radius: var(--editor-border-radius);
          margin: 1rem 0;
        }
  
        /* Selection */
        .wysiwyg-editor-container .ql-editor ::selection {
          background: var(--editor-selection-bg);
        }
  
        /* Readonly State */
        .wysiwyg-editor-container.readonly .ql-toolbar {
          display: none;
        }
  
        .wysiwyg-editor-container.readonly .ql-editor {
          background: var(--editor-toolbar-bg);
        }
  
        /* Responsive */
        @media (max-width: 768px) {
          .wysiwyg-editor-container .ql-toolbar {
            padding: 0.25rem;
          }
  
          .wysiwyg-editor-container .ql-toolbar .ql-formats {
            margin-right: 0.5rem;
          }
  
          .wysiwyg-editor-container .ql-toolbar button {
            width: 1.75rem;
            height: 1.75rem;
          }
  
          .wysiwyg-editor-container .ql-editor {
            padding: 0.75rem;
          }
        }
  
        /* Dark Mode - Only apply when explicitly requested or system preference is dark */
        .wysiwyg-editor-container[data-theme="dark"],
        @media (prefers-color-scheme: dark) {
          .wysiwyg-editor-container:not([data-theme="light"]) {
            --editor-border: 1px solid #4b5563;
            --editor-bg: #1f2937;
            --editor-text: #f3f4f6;
            --editor-placeholder: #9ca3af;
            --editor-toolbar-bg: #111827;
            --editor-toolbar-border: #4b5563;
            --editor-toolbar-button-hover: #374151;
            --editor-toolbar-button-active: #1e40af;
            --editor-toolbar-icon: #d1d5db;
            --editor-toolbar-icon-active: #93c5fd;
            --editor-blockquote-border: #4b5563;
            --editor-blockquote-text: #d1d5db;
            --editor-code-bg: #111827;
            --editor-code-text: #f3f4f6;
            --editor-link: #3b82f6;
            --editor-link-hover: #93c5fd;
            --editor-selection-bg: #1e40af;
          }
        }
      `;
      document.head.appendChild(style);
    }
  
    _setupEventListeners() {
      if (!this._editor) return;
  
      // Content change event
      this._editor.on('text-change', (delta, oldDelta, source) => {
        if (source === 'user') {
          this.dispatchEvent(new CustomEvent('change', {
            detail: {
              html: this._editor.root.innerHTML,
              text: this._editor.getText(),
              delta: delta
            },
            bubbles: true
          }));
        }
      });
  
      // Focus event
      this._editor.on('focus', () => {
        this.dispatchEvent(new CustomEvent('focus', { bubbles: true }));
      });
  
      // Blur event
      this._editor.on('blur', () => {
        this.dispatchEvent(new CustomEvent('blur', { bubbles: true }));
      });
  
      // Selection change
      this._editor.on('selection-change', (range) => {
        this.dispatchEvent(new CustomEvent('selection-change', {
          detail: { range },
          bubbles: true
        }));
      });
    }
  
    _cleanup() {
      if (this._editor) {
        this._editor = null;
      }
      this._initialized = false;
    }
  
    _updatePlaceholder(value) {
      if (this._editor) {
        this._editor.root.setAttribute('data-placeholder', value || '');
      }
    }
  
    _updateValue(value) {
      if (!this._editor) {
        this._pendingValue = value;
        return;
      }
      
      const currentContent = this._editor.root.innerHTML;
      if (currentContent !== value) {
        this._editor.root.innerHTML = value || '';
      }
    }
  
    _updateReadonly(readonly) {
      if (this._editor) {
        this._editor.enable(!readonly);
      }
    }
  
    _updateHeight(height) {
      if (this._editor && this._editor.root) {
        this._editor.root.style.height = height;
      }
    }
  
    _updateTheme(theme) {
      console.warn('Theme cannot be changed after initialization');
    }
  
    _updateToolbar(toolbar) {
      console.warn('Toolbar configuration cannot be changed after initialization');
    }
  
    _updateFormats(formats) {
      console.warn('Formats cannot be changed after initialization');
    }
  
    _updateBounds(bounds) {
      console.warn('Bounds cannot be changed after initialization');
    }
  
    _updateColorScheme(colorScheme) {
      if (this._editor && this._editor.container) {
        const container = this._editor.container;
        if (colorScheme === 'light') {
          container.setAttribute('data-theme', 'light');
        } else if (colorScheme === 'dark') {
          container.setAttribute('data-theme', 'dark');
        } else {
          container.removeAttribute('data-theme');
        }
      }
    }
  
    // Public API methods
    getValue() {
      return this._editor ? this._editor.root.innerHTML : '';
    }
  
    setValue(html) {
      this._updateValue(html);
    }
  
    getText() {
      return this._editor ? this._editor.getText() : '';
    }
  
    setText(text) {
      if (this._editor) {
        this._editor.setText(text);
      }
    }
  
    getDelta() {
      return this._editor ? this._editor.getContents() : null;
    }
  
    setDelta(delta) {
      if (this._editor) {
        this._editor.setContents(delta);
      }
    }
  
    enable() {
      if (this._editor) {
        this._editor.enable(true);
        this.removeAttribute('readonly');
      }
    }
  
    disable() {
      if (this._editor) {
        this._editor.disable();
        this.setAttribute('readonly', '');
      }
    }
  
    focus() {
      if (this._editor) {
        this._editor.focus();
      }
    }
  
    blur() {
      if (this._editor) {
        this._editor.blur();
      }
    }
  
    insertEmbed(index, type, value) {
      if (this._editor) {
        this._editor.insertEmbed(index, type, value);
      }
    }
  
    format(name, value) {
      if (this._editor) {
        this._editor.format(name, value);
      }
    }
  
    formatLine(index, length, name, value) {
      if (this._editor) {
        this._editor.formatLine(index, length, name, value);
      }
    }
  
    formatText(index, length, name, value) {
      if (this._editor) {
        this._editor.formatText(index, length, name, value);
      }
    }
  
    getSelection() {
      return this._editor ? this._editor.getSelection() : null;
    }
  
    setSelection(index, length) {
      if (this._editor) {
        this._editor.setSelection(index, length);
      }
    }
  
    // Getters and setters for attributes
    get value() {
      return this.getValue();
    }
  
    set value(val) {
      this.setValue(val);
    }
  
    get placeholder() {
      return this.getAttribute('placeholder') || 'Start writing...';
    }
  
    set placeholder(val) {
      this.setAttribute('placeholder', val);
    }
  
    get editor() {
      return this._editor;
    }
  
    get colorScheme() {
      return this.getAttribute('color-scheme');
    }
  
    set colorScheme(val) {
      this.setAttribute('color-scheme', val);
    }
  }
  
  customElements.define('ui-wysiwyg', Wysiwyg);
  export default Wysiwyg;