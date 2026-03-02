/**
 * Avatar Component
 * 
 * Displays a circular avatar with image or initials. Supports:
 * - Circular image display
 * - Fallback to initials when no image
 * - Different sizes (sm, md, lg, xl)
 * - Status indicators (online, offline, away)
 * - Custom colors for initials
 * 
 * Attributes:
 * - src: image source URL
 * - alt: image alt text
 * - name: name for initials (e.g., "John Doe" -> "JD")
 * - size: 'sm' | 'md' | 'lg' | 'xl' (default: 'md')
 * - status: 'online' | 'offline' | 'away'
 * - color: custom color for initials background
 * 
 * Usage:
 * <ui-avatar src="/path/to/image.jpg" alt="User" name="John Doe" size="lg"></ui-avatar>
 * <ui-avatar name="Jane Smith" size="md" status="online"></ui-avatar>
 */
class Avatar extends HTMLElement {
    constructor() {
        super();
        
        // Create the avatar container element directly (no shadow DOM)
        this.avatarContainer = document.createElement('div');
        this.avatarImage = document.createElement('img');
        this.avatarInitials = document.createElement('div');
        this.statusIndicator = document.createElement('div');
        
        // Flag to prevent double processing
        this.initialized = false;
        
        // Add elements to the component
        this.avatarContainer.appendChild(this.avatarImage);
        this.avatarContainer.appendChild(this.avatarInitials);
        this.avatarContainer.appendChild(this.statusIndicator);
        this.appendChild(this.avatarContainer);
        
        // Add default styles via CSS
        this.addDefaultStyles();
    }

    // Add default CSS styles to document if not already added
    addDefaultStyles() {
        if (!document.getElementById('upo-ui-avatar-styles')) {
            const style = document.createElement('style');
            style.id = 'upo-ui-avatar-styles';
            style.textContent = `
                .upo-avatar {
                    position: relative;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border-radius: 50%;
                    overflow: hidden;
                    background-color: #e5e7eb;
                    color: #374151;
                    font-weight: 500;
                    text-align: center;
                    line-height: 1;
                    height: fit-content;
                }
                .upo-avatar-sm {
                    width: 2rem;
                    height: 2rem;
                    font-size: 0.75rem;
                }
                .upo-avatar-md {
                    width: 2.5rem;
                    height: 2.5rem;
                    font-size: 0.875rem;
                }
                .upo-avatar-lg {
                    width: 3rem;
                    height: 3rem;
                    font-size: 1rem;
                }
                .upo-avatar-xl {
                    width: 4rem;
                    height: 4rem;
                    font-size: 1.25rem;
                }
                .upo-avatar-2xl {
                    width: 6rem;
                    height: 6rem;
                    font-size: 1.5rem;
                }
                .upo-avatar-3xl {
                    width: 8rem;
                    height: 8rem;
                    font-size: 2rem;
                }
                .upo-avatar img {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                    display: block;
                }
                .upo-avatar-initials {
                    width: 100%;
                    height: 100%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background-color: #e5e7eb;
                    color: #374151;
                }
                .upo-avatar-initials[data-color="blue"] {
                    background-color: #dbeafe;
                    color: #1e40af;
                }
                .upo-avatar-initials[data-color="green"] {
                    background-color: #dcfce7;
                    color: #166534;
                }
                .upo-avatar-initials[data-color="yellow"] {
                    background-color: #fef3c7;
                    color: #92400e;
                }
                .upo-avatar-initials[data-color="red"] {
                    background-color: #fee2e2;
                    color: #dc2626;
                }
                .upo-avatar-initials[data-color="purple"] {
                    background-color: #f3e8ff;
                    color: #7c3aed;
                }
                .upo-avatar-initials[data-color="pink"] {
                    background-color: #fce7f3;
                    color: #be185d;
                }
                .upo-avatar-initials[data-color="indigo"] {
                    background-color: #e0e7ff;
                    color: #3730a3;
                }
                .upo-avatar-initials[data-color="gray"] {
                    background-color: #f3f4f6;
                    color: #374151;
                }
                .upo-avatar-status {
                    position: absolute;
                    bottom: 0;
                    right: 0;
                    width: 0.5rem;
                    height: 0.5rem;
                    border-radius: 50%;
                    border: 2px solid #ffffff;
                    box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.1);
                }
                .upo-avatar-sm .upo-avatar-status {
                    width: 0.375rem;
                    height: 0.375rem;
                }
                .upo-avatar-lg .upo-avatar-status {
                    width: 0.625rem;
                    height: 0.625rem;
                }
                .upo-avatar-xl .upo-avatar-status {
                    width: 0.75rem;
                    height: 0.75rem;
                }
                .upo-avatar-status-online {
                    background-color: #10b981;
                }
                .upo-avatar-status-offline {
                    background-color: #6b7280;
                }
                .upo-avatar-status-away {
                    background-color: #f59e0b;
                }
            `;
            document.head.appendChild(style);
        }
    }

    static get observedAttributes() {
        return ['src', 'alt', 'name', 'size', 'status', 'color'];
    }

    get size() {
        return this.getAttribute('size') || 'md';
    }

    get name() {
        return this.getAttribute('name') || '';
    }

    get status() {
        return this.getAttribute('status') || '';
    }

    get color() {
        return this.getAttribute('color') || '';
    }

    getInitials(name) {
        if (!name) return '';
        
        return name
            .split(' ')
            .map(word => word.charAt(0))
            .join('')
            .toUpperCase()
            .slice(0, 2);
    }

    getRandomColor() {
        const colors = ['blue', 'green', 'yellow', 'red', 'purple', 'pink', 'indigo', 'gray'];
        return colors[Math.floor(Math.random() * colors.length)];
    }

    // Connected callback - called when element is added to DOM
    connectedCallback() {
        // Prevent double processing
        if (this.initialized) return;
        this.initialized = true;

        // Set up the avatar container
        this.avatarContainer.className = `upo-avatar upo-avatar-${this.size}`;
        
        // Set up the image
        this.avatarImage.alt = this.getAttribute('alt') || '';
        this.avatarImage.src = this.getAttribute('src') || '';
        
        // Set up the initials
        this.avatarInitials.className = 'upo-avatar-initials';
        const initials = this.getInitials(this.name);
        this.avatarInitials.textContent = initials;
        
        // Set color for initials
        const color = this.color || this.getRandomColor();
        this.avatarInitials.setAttribute('data-color', color);
        
        // Set up the status indicator
        this.statusIndicator.className = 'upo-avatar-status';
        if (this.status) {
            this.statusIndicator.classList.add(`upo-avatar-status-${this.status}`);
        }
        
        // Show/hide elements based on image availability
        this.updateDisplay();
        
        // Handle image load/error events
        this.avatarImage.addEventListener('load', () => this.updateDisplay());
        this.avatarImage.addEventListener('error', () => this.updateDisplay());
    }

    updateDisplay() {
        const hasValidImage = this.avatarImage.src && this.avatarImage.complete && this.avatarImage.naturalWidth !== 0;
        
        if (hasValidImage) {
            this.avatarImage.style.display = 'block';
            this.avatarInitials.style.display = 'none';
        } else {
            this.avatarImage.style.display = 'none';
            this.avatarInitials.style.display = 'flex';
        }
    }

    // Called when attributes change
    attributeChangedCallback(name, oldValue, newValue) {
        if (!this.initialized) return;
        
        switch (name) {
            case 'src':
                this.avatarImage.src = newValue || '';
                this.updateDisplay();
                break;
            case 'alt':
                this.avatarImage.alt = newValue || '';
                break;
            case 'name':
                const initials = this.getInitials(newValue);
                this.avatarInitials.textContent = initials;
                break;
            case 'size':
                this.avatarContainer.className = `upo-avatar upo-avatar-${newValue || 'md'}`;
                break;
            case 'status':
                this.statusIndicator.className = 'upo-avatar-status';
                if (newValue) {
                    this.statusIndicator.classList.add(`upo-avatar-status-${newValue}`);
                }
                break;
            case 'color':
                const color = newValue || this.getRandomColor();
                this.avatarInitials.setAttribute('data-color', color);
                break;
        }
    }
}

customElements.define('ui-avatar', Avatar);
export default Avatar; 