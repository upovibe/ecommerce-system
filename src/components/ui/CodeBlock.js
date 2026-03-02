class CodeBlock extends HTMLElement {
    constructor() {
        super();
        this.container = document.createElement('div');
        this.container.className = 'upo-codeblock-container';
        this.pre = document.createElement('pre');
        this.code = document.createElement('code');
        this.pre.appendChild(this.code);
        this.container.appendChild(this.pre);
        this.addDefaultStyles();
        // Add copy button with smaller SVG icon and glassy background
        this.copyButton = document.createElement('button');
        this.copyButton.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <rect x="9" y="9" width="13" height="13" rx="2" fill="#fff" stroke="#3b82f6" stroke-width="2"/>
                <rect x="3" y="3" width="13" height="13" rx="2" fill="#fff" stroke="#3b82f6" stroke-width="2"/>
            </svg>
        `;
        this.copyButton.setAttribute('aria-label', 'Copy code');
        this.copyButton.className = 'upo-codeblock-copy-btn';
        this.copyButton.onclick = () => this.copyCode();
        this.container.appendChild(this.copyButton);
        this.appendChild(this.container);
    }

    connectedCallback() {
        // Use the 'code' attribute if present, otherwise use innerHTML/textContent
        let codeText = this.getAttribute('code');
        if (codeText === null) {
            // Use textContent to preserve newlines and spacing
            codeText = this.textContent;
        }
        this.code.textContent = codeText.trim();
        // Optionally, set language class for syntax highlighting
        if (this.hasAttribute('language')) {
            this.code.className = `language-${this.getAttribute('language')}`;
        }
    }

    copyCode() {
        const codeText = this.code.textContent;
        navigator.clipboard.writeText(codeText).then(() => {
            this.copyButton.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke="#22c55e" stroke-width="2" d="M5 13l4 4L19 7" fill="none"/>
                </svg>
            `;
            setTimeout(() => {
                this.copyButton.innerHTML = `
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <rect x="9" y="9" width="13" height="13" rx="2" fill="#fff" stroke="#3b82f6" stroke-width="2"/>
                        <rect x="3" y="3" width="13" height="13" rx="2" fill="#fff" stroke="#3b82f6" stroke-width="2"/>
                    </svg>
                `;
            }, 1200);
        });
    }

    addDefaultStyles() {
        if (!document.getElementById('upo-ui-codeblock-styles')) {
            const style = document.createElement('style');
            style.id = 'upo-ui-codeblock-styles';
            style.textContent = `
                .upo-codeblock-container {
                    position: relative;
                    margin: 1em 0;
                }
                pre {
                    background: #1a202c;
                    color: #f7fafc;
                    padding: 1rem;
                    border-radius: 0.5rem;
                    overflow: auto;
                    font-size: 0.95em;
                    margin: 0;
                    max-width: 100%;
                    height: fit-content;
                    max-height: 400px;
                    position: relative;
                }
                pre::-webkit-scrollbar {
                    width: 8px;
                    height: 8px;
                }
                pre::-webkit-scrollbar-track {
                    background: #2d3748;
                    border-radius: 4px;
                }
                pre::-webkit-scrollbar-thumb {
                    background: #4a5568;
                    border-radius: 4px;
                }
                pre::-webkit-scrollbar-thumb:hover {
                    background: #718096;
                }
                pre::-webkit-scrollbar-corner {
                    background: #2d3748;
                }
                code {
                    background: none;
                    color: inherit;
                    font-family: 'Fira Mono', 'Consolas', 'Menlo', monospace;
                }
                .upo-codeblock-copy-btn {
                    position: absolute;
                    top: 0.75rem;
                    right: 1rem;
                    width: 28px;
                    height: 28px;
                    background: rgba(255,255,255,0.25);
                    backdrop-filter: blur(6px);
                    border: none;
                    border-radius: 0.375rem;
                    cursor: pointer;
                    transition: background 0.2s;
                    z-index: 10;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
                .upo-codeblock-copy-btn:hover {
                    background: rgba(255,255,255,0.45);
                }
                ui-codeblock {
                    display: block;
                }
            `;
            document.head.appendChild(style);
        }
    }
}

    customElements.define('ui-codeblock', CodeBlock);
export default CodeBlock; 