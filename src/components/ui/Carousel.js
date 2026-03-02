/**
 * Carousel Component
 * 
 * Rotating content display for images or promotions.
 * Supports navigation controls, indicators, and auto-play functionality.
 * 
 * Attributes:
 * - autoplay: boolean (default: false)
 * - interval: number (default: 5000)
 * - show-indicators: boolean (default: true)
 * - show-controls: boolean (default: true)
 * - items-per-view: number (default: 1) - How many items to show at once
 * 
 * Usage:
 * <ui-carousel items-per-view="2">
 *   <ui-carousel-item>
 *     <img src="image1.jpg" alt="Image 1">
 *   </ui-carousel-item>
 *   <ui-carousel-item>
 *     <img src="image2.jpg" alt="Image 2">
 *   </ui-carousel-item>
 * </ui-carousel>
 */
class Carousel extends HTMLElement {
    constructor() {
        super();
        
        // Create the carousel structure with navigation inside
        this.carouselContainer = document.createElement('div');
        this.contentContainer = document.createElement('div');
        this.carouselTrack = document.createElement('div');
        this.leftControls = document.createElement('div');
        this.rightControls = document.createElement('div');
        
        // Flag to prevent double processing
        this.initialized = false;
        
        // Carousel state
        this.currentIndex = 0;
        this.totalSlides = 0;
        this.autoplayInterval = null;
        this.isTransitioning = false;
        
        // Build the structure: carouselContainer > contentContainer > [carouselTrack + leftControls + rightControls]
        this.contentContainer.appendChild(this.carouselTrack);
        this.contentContainer.appendChild(this.leftControls);
        this.contentContainer.appendChild(this.rightControls);
        this.carouselContainer.appendChild(this.contentContainer);
        this.appendChild(this.carouselContainer);
        
        // Add default styles via CSS
        this.addDefaultStyles();
    }

    // Add default CSS styles to document if not already added
    addDefaultStyles() {
        if (!document.getElementById('upo-ui-carousel-styles')) {
            const style = document.createElement('style');
            style.id = 'upo-ui-carousel-styles';
            style.textContent = `
                .upo-carousel {
                    position: relative;
                    width: 100%;
                }
                
                .upo-carousel.single-item {
                    width: fit-content;
                    max-width: 100%;
                }
                
                .upo-carousel-wrapper {
                    position: relative;
                    height: 100%;
                    overflow: hidden;
                    border-radius: 0.5rem;
                }
                
                .upo-carousel-track {
                    display: flex;
                    transition: transform 0.5s ease-in-out;
                    height: 100%;
                }
                
                .upo-carousel-item {
                    height: 100%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    margin: 0 0.5rem;
                }
                
                .upo-carousel-item img {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                }
                
                /* Navigation Controls - positioned inside the carousel */
                .upo-carousel-controls {
                    position: absolute;
                    top: 50%;
                    transform: translateY(-50%);
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    pointer-events: none;
                    z-index: 20;
                }
                
                .upo-carousel-controls.left {
                    left: 1rem;
                }
                
                .upo-carousel-controls.right {
                    right: 1rem;
                }
                
                .upo-carousel-control {
                    width: 2.5rem;
                    height: 2.5rem;
                    border-radius: 50%;
                    background-color: rgba(255, 255, 255, 0.9);
                    border: none;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 1.2rem;
                    color: #374151;
                    transition: all 0.2s ease-in-out;
                    pointer-events: auto;
                    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
                    opacity: 0;
                }
                
                .upo-carousel-wrapper:hover .upo-carousel-control {
                    opacity: 0.5;
                }
                
                .upo-carousel-control:hover {
                    background-color: rgba(255, 255, 255, 1);
                }
                
                .upo-carousel-control:active {
                    transform: scale(0.95);
                }
                
                .upo-carousel-control:disabled {
                    opacity: 0.5;
                    cursor: not-allowed;
                }
                
                /* Indicators */
                .upo-carousel-indicators {
                    position: absolute;
                    bottom: 1rem;
                    left: 50%;
                    transform: translateX(-50%);
                    display: flex;
                    gap: 0.5rem;
                    pointer-events: none;
                    z-index: 10;
                }
                
                .upo-carousel-indicator {
                    width: 0.375rem;
                    height: 0.375rem;
                    border-radius: 50%;
                    background-color: rgba(255, 255, 255, 0.5);
                    border: none;
                    cursor: pointer;
                    transition: all 0.2s ease-in-out;
                    pointer-events: auto;
                }
                
                .upo-carousel-indicator.active {
                    background-color: rgba(255, 255, 255, 1);
                    transform: scale(1.2);
                }
                
                .upo-carousel-indicator:hover {
                    background-color: rgba(255, 255, 255, 0.8);
                }
                
                /* Responsive */
                @media (max-width: 640px) {
                    .upo-carousel-control {
                        width: 2rem;
                        height: 2rem;
                        font-size: 1rem;
                    }
                    
                    .upo-carousel-controls.left {
                        left: 0.5rem;
                    }
                    
                    .upo-carousel-controls.right {
                        right: 0.5rem;
                    }
                    
                    .upo-carousel-indicators {
                        bottom: 0.5rem;
                    }
                    
                    .upo-carousel-indicator {
                        width: 0.375rem;
                        height: 0.375rem;
                    }
                }
            `;
            document.head.appendChild(style);
        }
    }

    static get observedAttributes() {
        return ['autoplay', 'interval', 'show-indicators', 'show-controls', 'items-per-view'];
    }

    get autoplay() {
        return this.hasAttribute('autoplay');
    }

    get interval() {
        return parseInt(this.getAttribute('interval')) || 5000;
    }

    get showIndicators() {
        return this.getAttribute('show-indicators') !== 'false';
    }

    get showControls() {
        return this.getAttribute('show-controls') !== 'false';
    }

    get itemsPerView() {
        return parseInt(this.getAttribute('items-per-view')) || 1;
    }

    // Connected callback - called when element is added to DOM
    connectedCallback() {
        // Prevent double processing
        if (this.initialized) return;
        this.initialized = true;

        // Set up the carousel container
        this.carouselContainer.className = 'upo-carousel';
        this.leftControls.className = 'upo-carousel-controls left';
        this.contentContainer.className = 'upo-carousel-wrapper';
        this.carouselTrack.className = 'upo-carousel-track';
        this.rightControls.className = 'upo-carousel-controls right';
        
        // Process child elements
        this.processChildren();
        
        // Apply single-item class if only one slide
        if (this.totalSlides === 1) {
            this.carouselContainer.classList.add('single-item');
        }
        
        // Start autoplay if enabled
        if (this.autoplay) {
            this.startAutoplay();
        }
    }

    processChildren() {
        // Store original content before building the carousel
        const originalContent = Array.from(this.childNodes)
            .filter(node => node !== this.carouselContainer)
            .map(node => node.textContent || '')
            .join('').trim();

        // Get carousel items BEFORE removing children
        const items = this.querySelectorAll('ui-carousel-item');
        this.totalSlides = items.length;
        
        // Move any existing children (except our carouselContainer) to avoid duplication
        const children = Array.from(this.childNodes);
        children.forEach(child => {
            if (child !== this.carouselContainer) {
                this.removeChild(child);
            }
        });

        // Clear the carousel track
        this.carouselTrack.innerHTML = '';

        if (items.length === 0) {
            // If no carousel items found, create a simple carousel from text content
            const item = document.createElement('div');
            item.className = 'upo-carousel-item';
            item.textContent = originalContent || 'Carousel Content';
            this.carouselTrack.appendChild(item);
            this.totalSlides = 1;
        } else {
            items.forEach((item, index) => {
                const itemDiv = document.createElement('div');
                itemDiv.className = 'upo-carousel-item';
                itemDiv.innerHTML = item.innerHTML || item.textContent || `Slide ${index + 1}`;
                this.carouselTrack.appendChild(itemDiv);
            });
        }

        // Add navigation controls
        if (this.showControls && this.totalSlides > 1) {
            this.addControls();
        }

        // Add indicators
        if (this.showIndicators && this.totalSlides > 1) {
            this.addIndicators();
        }

        // Update the track position
        this.updateTrackPosition();
        
        // Ensure the first item is visible by default
        if (this.totalSlides > 0) {
            this.currentIndex = 0;
            // Use setTimeout to ensure items are fully rendered
            setTimeout(() => {
                this.updateTrackPosition();
            }, 0);
        }
    }

    addControls() {
        const prevButton = document.createElement('button');
        prevButton.className = 'upo-carousel-control';
        prevButton.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15,18 9,12 15,6"></polyline></svg>';
        prevButton.setAttribute('aria-label', 'Previous slide');
        prevButton.addEventListener('click', () => this.previous());
        this.leftControls.appendChild(prevButton);

        const nextButton = document.createElement('button');
        nextButton.className = 'upo-carousel-control';
        nextButton.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9,18 15,12 9,6"></polyline></svg>';
        nextButton.setAttribute('aria-label', 'Next slide');
        nextButton.addEventListener('click', () => this.next());
        this.rightControls.appendChild(nextButton);
    }

    addIndicators() {
        const indicators = document.createElement('div');
        indicators.className = 'upo-carousel-indicators';

        for (let i = 0; i < this.totalSlides; i++) {
            const indicator = document.createElement('button');
            indicator.className = 'upo-carousel-indicator';
            indicator.setAttribute('aria-label', `Go to slide ${i + 1}`);
            indicator.addEventListener('click', () => this.goToSlide(i));
            indicators.appendChild(indicator);
        }

        this.contentContainer.appendChild(indicators);
        this.updateIndicators();
    }

    updateTrackPosition() {
        const items = this.carouselTrack.querySelectorAll('.upo-carousel-item');
        if (items.length === 0) return;
        
        const itemWidth = items[0].offsetWidth;
        const itemMargin = 16; // 0.5rem = 8px on each side = 16px total
        const totalItemWidth = itemWidth + itemMargin;
        const translateX = -(this.currentIndex * totalItemWidth);
        this.carouselTrack.style.transform = `translateX(${translateX}px)`;
        
        // Set container width to show items-per-view number of items (including margins)
        const containerWidth = totalItemWidth * this.itemsPerView;
        this.contentContainer.style.width = `${containerWidth}px`;
        this.contentContainer.style.minWidth = `${containerWidth}px`;
    }

    updateIndicators() {
        const indicators = this.querySelectorAll('.upo-carousel-indicator');
        indicators.forEach((indicator, index) => {
            if (index === this.currentIndex) {
                indicator.classList.add('active');
            } else {
                indicator.classList.remove('active');
            }
        });
    }

    updateControls() {
        const prevButton = this.leftControls.querySelector('.upo-carousel-control');
        const nextButton = this.rightControls.querySelector('.upo-carousel-control');

        if (prevButton) {
            prevButton.style.opacity = this.currentIndex === 0 ? '0.3' : '1';
            prevButton.style.pointerEvents = this.currentIndex === 0 ? 'none' : 'auto';
        }
        if (nextButton) {
            const maxIndex = Math.max(0, this.totalSlides - this.itemsPerView);
            nextButton.style.opacity = this.currentIndex >= maxIndex ? '0.3' : '1';
            nextButton.style.pointerEvents = this.currentIndex >= maxIndex ? 'none' : 'auto';
        }
    }

    next() {
        if (this.isTransitioning) return;
        
        const maxIndex = Math.max(0, this.totalSlides - this.itemsPerView);
        if (this.currentIndex < maxIndex) {
            this.currentIndex = this.currentIndex + 1;
            this.updateTrackPosition();
            this.updateIndicators();
            this.updateControls();
            
            // Restart autoplay
            if (this.autoplay) {
                this.restartAutoplay();
            }
        }
    }

    previous() {
        if (this.isTransitioning) return;
        
        if (this.currentIndex > 0) {
            this.currentIndex = this.currentIndex - 1;
            this.updateTrackPosition();
            this.updateIndicators();
            this.updateControls();
            
            // Restart autoplay
            if (this.autoplay) {
                this.restartAutoplay();
            }
        }
    }

    goToSlide(index) {
        if (this.isTransitioning || index < 0 || index >= this.totalSlides) return;
        
        this.currentIndex = index;
        this.updateTrackPosition();
        this.updateIndicators();
        this.updateControls();
        
        // Restart autoplay
        if (this.autoplay) {
            this.restartAutoplay();
        }
    }

    startAutoplay() {
        if (this.autoplayInterval) {
            clearInterval(this.autoplayInterval);
        }
        
        this.autoplayInterval = setInterval(() => {
            this.next();
        }, this.interval);
    }

    stopAutoplay() {
        if (this.autoplayInterval) {
            clearInterval(this.autoplayInterval);
            this.autoplayInterval = null;
        }
    }

    restartAutoplay() {
        this.stopAutoplay();
        this.startAutoplay();
    }

    // Called when attributes change
    attributeChangedCallback(name, oldValue, newValue) {
        if (!this.initialized) return;
        
        switch (name) {
            case 'autoplay':
                if (this.autoplay) {
                    this.startAutoplay();
                } else {
                    this.stopAutoplay();
                }
                break;
            case 'interval':
                if (this.autoplay) {
                    this.restartAutoplay();
                }
                break;
            case 'show-indicators':
            case 'show-controls':
                // Re-process children to add/remove controls and indicators
                this.processChildren();
                break;
            case 'items-per-view':
                // Re-process children to update the number of items per view
                this.processChildren();
                break;
        }
    }

    // Cleanup on disconnect
    disconnectedCallback() {
        this.stopAutoplay();
    }
}

// Carousel Item component
class CarouselItem extends HTMLElement {
    constructor() {
        super();
        this.initialized = false;
    }

    connectedCallback() {
        if (this.initialized) return;
        this.initialized = true;
        
        // This component just serves as a marker for the parent carousel
        // The actual rendering is handled by the parent carousel component
    }
}

customElements.define('ui-carousel', Carousel);
customElements.define('ui-carousel-item', CarouselItem);
export default Carousel; 