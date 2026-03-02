import App from '@/core/App.js';

/**
 * 📜 Scroll to Top Component
 *
 * A floating button that appears when users scroll down and
 * smoothly scrolls back to the top when clicked.
 */
class ScrollToTop extends App {
    constructor() {
        super();
        this.isVisible = false;
        this.scrollThreshold = 300; // Show button after scrolling 300px
    }

    connectedCallback() {
        super.connectedCallback();
        
        // Listen for scroll events
        this.handleScroll = this.handleScroll.bind(this);
        window.addEventListener('scroll', this.handleScroll);
        
        // Add click event listener
        setTimeout(() => {
            const button = this.querySelector('#scroll-to-top-btn');
            if (button) {
                button.addEventListener('click', this.scrollToTop.bind(this));
            }
        }, 100);
    }

    disconnectedCallback() {
        // Clean up event listeners
        window.removeEventListener('scroll', this.handleScroll);
    }

    handleScroll() {
        const scrollY = window.scrollY;
        const shouldShow = scrollY > this.scrollThreshold;
        
        if (shouldShow !== this.isVisible) {
            this.isVisible = shouldShow;
            this.updateVisibility();
        }
    }

    updateVisibility() {
        const button = this.querySelector('#scroll-to-top-btn');
        if (button) {
            if (this.isVisible) {
                button.classList.remove('opacity-0', 'pointer-events-none', 'translate-y-2');
                button.classList.add('opacity-100', 'pointer-events-auto', 'translate-y-0');
            } else {
                button.classList.remove('opacity-100', 'pointer-events-auto', 'translate-y-0');
                button.classList.add('opacity-0', 'pointer-events-none', 'translate-y-2');
            }
        }
    }

    scrollToTop() {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    }

    render() {
        return `
            <button
                id="scroll-to-top-btn"
                class="fixed bottom-6 right-6 z-50 w-12 h-12 bg-blue-500 hover:bg-blue-700 text-white rounded-full shadow-lg hover:shadow-xl transform transition-all duration-300 ease-in-out opacity-0 pointer-events-none translate-y-2 flex items-center justify-center group"
                aria-label="Scroll to top"
                title="Scroll to top"
            >
                <i class="fas fa-chevron-up text-lg group-hover:scale-110 transition-transform duration-200"></i>
            </button>
        `;
    }
}

customElements.define('ui-scroll-to-top', ScrollToTop);
export default ScrollToTop; 