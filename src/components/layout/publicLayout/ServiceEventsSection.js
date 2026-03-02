import App from '@/core/App.js';
import { unescapeJsonFromAttribute } from '@/utils/jsonUtils.js';
import '@/components/layout/publicLayout/EventList.js';
import '@/components/layout/publicLayout/SermonList.js';

/**
 * Service Events Section Component
 *
 * Displays service events content with simple text.
 * Accepts color theming via 'colors' attribute and page data.
 */
class ServiceEventsSection extends App {
    constructor() {
        super();
        this.set('activeTab', 'events'); // Default to events tab
    }

    connectedCallback() {
        super.connectedCallback();
        this.loadDataFromProps();
    }

    // Helper method to get proper image URL (same as HeroSection)
    getImageUrl(imagePath) {
        if (!imagePath) return null;
        
        // If it's already a full URL, return as is
        if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
            return imagePath;
        }
        
        // If it's a relative path starting with /, construct the full URL
        if (imagePath.startsWith('/')) {
            const baseUrl = window.location.origin;
            return baseUrl + imagePath;
        }
        
        // If it's a relative path without /, construct the URL
        const baseUrl = window.location.origin;
        const apiPath = '/api';
        return baseUrl + apiPath + '/' + imagePath;
    }

    // Helper method to parse banner images from various formats (same as HeroSection)
    getBannerImages(pageData) {
        if (!pageData || !pageData.banner_image) {
            return [];
        }

        let bannerImages = pageData.banner_image;

        // If it's a string, try to parse as JSON
        if (typeof bannerImages === 'string') {
            try {
                const parsed = JSON.parse(bannerImages);
                if (Array.isArray(parsed)) {
                    bannerImages = parsed;
                } else {
                    bannerImages = [bannerImages];
                }
            } catch (e) {
                // If parsing fails, treat as single path
                bannerImages = [bannerImages];
            }
        } else if (!Array.isArray(bannerImages)) {
            // If it's not an array, wrap in array
            bannerImages = [bannerImages];
        }

        // Filter out empty/null values and return all images
        return bannerImages.filter(img => img && img.trim() !== '');
    }

    loadDataFromProps() {
        // Get data from props/attributes
        const colorsAttr = this.getAttribute('colors');
        const pageDataAttr = this.getAttribute('page-data');

        if (colorsAttr) {
            try {
                const colors = JSON.parse(colorsAttr);
                Object.entries(colors).forEach(([key, value]) => {
                    this.set(key, value);
                });
            } catch (error) {
                console.error('Error parsing colors:', error);
            }
        }

        if (pageDataAttr) {
            const pageData = unescapeJsonFromAttribute(pageDataAttr);
            if (pageData) {
                this.set('pageData', pageData);
            }
        }

        // Load sermon page data
        this.loadSermonPageData();

        // Render immediately with the data
        this.innerHTML = this.render();
    }

    async loadSermonPageData() {
        try {
            const response = await fetch('/api/pages/slug/sermons');
            if (response.ok) {
                const data = await response.json();
                if (data.success && data.data) {
                    this.set('sermonPageData', data.data);
                }
            }
        } catch (error) {
            console.error('Error loading sermon page data:', error);
        }
    }

    switchTab(tab) {
        this.set('activeTab', tab);
        
        // Force complete re-render
        const newContent = this.render();
        this.innerHTML = newContent;
        
        // Also try to trigger a re-render of child components
        const eventList = this.querySelector('event-list');
        const sermonList = this.querySelector('sermon-list');
        if (eventList && eventList.render) eventList.render();
        if (sermonList && sermonList.render) sermonList.render();
    }

    render() {
        // Get page data from state
        const pageData = this.get('pageData') || {};
        const sermonPageData = this.get('sermonPageData') || {};
        
        // Get active tab first
        const activeTab = this.get('activeTab');
        
        // Get banner images based on active tab
        let bannerImages = [];
        if (activeTab === 'sermons') {
            // For sermons tab, use sermon page data images
            bannerImages = this.getBannerImages(sermonPageData) || [];
        } else {
            // For events tab, use page data images
            bannerImages = this.getBannerImages(pageData) || [];
        }
        
        const showImages = bannerImages.length > 0;
        let heroTitle, heroSubtitle;
        
        if (activeTab === 'sermons') {
            heroTitle = (sermonPageData && sermonPageData.title) ? sermonPageData.title : 'Sermons';
            heroSubtitle = (sermonPageData && sermonPageData.subtitle) ? sermonPageData.subtitle : 'Listen to inspiring messages and teachings from our church';
        } else {
            // Default to events
            heroTitle = (pageData && pageData.title) ? pageData.title : 'Service Events';
            heroSubtitle = (pageData && pageData.subtitle) ? pageData.subtitle : 'Welcome to our service events page';
        }

        // Get colors from state (same as HeroSection)
        const primaryColor = this.get('primary_color');
        const secondaryColor = this.get('secondary_color');
        const accentColor = this.get('accent_color');
        const textColor = this.get('text_color');
        const darkColor = this.get('dark_color');
        const hoverPrimary = this.get('hover_primary');
        const hoverSecondary = this.get('hover_secondary');
        const hoverAccent = this.get('hover_accent');

        const bannerHtml = showImages ? bannerImages.map((img, idx) => `
                    <div
                         class="absolute inset-0 w-full h-full bg-cover bg-center transition-opacity duration-1000 ${idx === 0 ? 'opacity-100 z-10' : 'opacity-0 z-0'}"
                         style="background-image: url('${this.getImageUrl(img)}'); transition-property: opacity;">
                    </div>
                `).join('') : `
                    <!-- Placeholder Banner -->
                    <div class="absolute inset-0 bg-gradient-to-br from-gray-600 to-gray-800 flex items-center justify-center">
                        <div class="text-center text-white">
                            <i class="fas fa-church text-6xl mb-4 opacity-50"></i>
                            <h1 class="text-3xl font-bold mb-2">${heroTitle}</h1>
                            <p class="text-lg opacity-75">${heroSubtitle}</p>
                        </div>
                    </div>
                `;
        
        return `
        <!-- Service Events Banner Section with Background -->
        <div class="">
            <div class="relative w-full h-[500px] lg:h-[45vh] overflow-hidden">
                ${bannerHtml}
                <!-- Dark gradient overlay from bottom to top -->
                <div class="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent z-20"></div>
                <!-- Content Overlay -->
                <div class="absolute inset-0 flex items-center justify-start z-30 container mx-auto">
                    <div class="text-left text-white px-4 lg:px-8 max-w-4xl space-y-6">
                        <h1 class="text-4xl md:text-5xl lg:text-6xl font-bold drop-shadow-lg pb-2 border-b-4 border-[${accentColor}] w-fit" style="line-height: 1.1">
                            ${heroTitle}
                    </h1>
                        <p class="text-lg md:text-xl lg:text-2xl opacity-95 leading-relaxed drop-shadow-md">
                            ${heroSubtitle}
                        </p>
                        <div class="flex flex-row gap-2 sm:gap-4 justify-start w-fit">
                            <button 
                                class="px-5 py-2 rounded-xl text-lg shadow-lg flex items-center gap-2 transition-all duration-300 ${this.get('activeTab') === 'events' ? `bg-[${accentColor}] text-[${darkColor}]` : `bg-white/20 text-white hover:bg-white/30`}"
                                onclick="this.closest('service-events-section').switchTab('events')">
                                <i class="fas fa-calendar-alt text-base"></i>
                                Events
                            </button>
                            <button 
                                class="px-5 py-2 rounded-xl text-lg shadow-lg flex items-center gap-2 transition-all duration-300 ${this.get('activeTab') === 'sermons' ? `bg-[${secondaryColor}] text-[${darkColor}]` : `bg-white/20 text-white hover:bg-white/30`}"
                                onclick="this.closest('service-events-section').switchTab('sermons')">
                                <i class="fas fa-play text-base"></i>
                                Sermons
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        
        <!-- Content Sections -->
        <div class="container mx-auto px-4 py-8">
            ${this.get('activeTab') === 'events' ? `
                <!-- Events List Section -->
                <div class="animate-fade-in">
                    <event-list></event-list>
                </div>
            ` : `
                <!-- Sermons List Section -->
                <div class="animate-fade-in">
                    <sermon-list></sermon-list>
                </div>
            `}
        </div>
        `;
    }
}

customElements.define('service-events-section', ServiceEventsSection);
export default ServiceEventsSection; 