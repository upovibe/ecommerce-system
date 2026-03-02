import App from '@/core/App.js';
import { unescapeJsonFromAttribute } from '@/utils/jsonUtils.js';
import '@/components/layout/publicLayout/EventList.js';
import '@/components/ui/ContentDisplay.js';

// Load Quill CSS for content display
if (!document.querySelector('link[href*="quill"]')) {
    const link = document.createElement('link');
    link.href = 'https://cdn.quilljs.com/1.3.6/quill.snow.css';
    link.rel = 'stylesheet';
    document.head.appendChild(link);
}

/**
 * Events Section Component
 * 
 * Displays events information with content from the events page
 */
class EventsSection extends App {
    constructor() {
        super();
    }

    connectedCallback() {
        super.connectedCallback();
        this.loadDataFromProps();
    }

    loadDataFromProps() {
        // Get data from props/attributes
        const colorsAttr = this.getAttribute('colors');
        const pageDataAttr = this.getAttribute('page-data');
        const settingsAttr = this.getAttribute('settings');

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

        // Load events data from API
        this.loadEventsData();
    }

    async loadEventsData() {
        // This method is now handled by the EventList component
        // Render with the loaded data
        this.render();
    }

    // Helper method to get proper image URL
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

    // Helper method to parse banner images from various formats
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

        // Filter out empty/null values
        return bannerImages.filter(img => img && img.trim() !== '');
    }

    render() {
        const pageData = this.get('pageData');
        
        // Get colors from state
        const primaryColor = this.get('primary_color');
        const secondaryColor = this.get('secondary_color');
        const accentColor = this.get('accent_color');
        const textColor = this.get('text_color');
        const darkColor = this.get('dark_color');
        const hoverPrimary = this.get('hover_primary');
        const hoverSecondary = this.get('hover_secondary');
        const hoverAccent = this.get('hover_accent');

        // Only render if there's content
        if (!pageData?.content || pageData.content.trim() === '') {
            return '';
        }



        return `
            <!-- Events Section -->
            <section class="mx-auto py-10">
                <!-- Banner Image at Top -->
                ${this.getBannerImages(pageData).length > 0 ? `
                    <div class="mb-8">
                        <div class="relative w-full h-96">
                            <img src="${this.getImageUrl(this.getBannerImages(pageData)[0])}" 
                                 alt="Events Banner" 
                                 class="w-full h-full object-cover rounded-3xl shadow-lg"
                                 onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
                            <div class="absolute inset-0 hidden items-center justify-center bg-gray-50 rounded-3xl">
                                <div class="text-center">
                                    <i class="fas fa-image text-gray-400 text-4xl mb-2"></i>
                                    <p class="text-gray-500 font-medium">Events banner image</p>
                                </div>
                            </div>
                            <!-- Dark gradient overlay from bottom to top -->
                            <div class="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent rounded-3xl"></div>
                        </div>
                    </div>
                ` : `
                    <!-- Placeholder Banner -->
                    <div class="mb-8">
                        <div class="relative w-full h-96 bg-gradient-to-br from-gray-600 to-gray-800 rounded-3xl shadow-lg flex items-center justify-center">
                            <div class="text-center text-white">
                                <i class="fas fa-calendar-alt text-6xl mb-4 opacity-50"></i>
                                <h1 class="text-3xl font-bold mb-2">Events</h1>
                                <p class="text-lg opacity-75">Stay updated with our latest events and activities</p>
                            </div>
                        </div>
                    </div>
                `}


                
                <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <!-- Content Container -->
                    <div class="bg-white rounded-3xl shadow-lg overflow-hidden border border-gray-100 flex-1 w-full">
                        <div class="p-5 lg:p-12">
                            <content-display 
                                content="${pageData.content.replace(/"/g, '&quot;')}"
                                no-styles>
                            </content-display>
                            
                            ${window.location.pathname !== '/public/community/events' ? `
                                <div class="mt-8">
                                    <a href="/public/community/events" 
                                       class="inline-flex items-center justify-center gap-2 px-6 py-1.5 bg-[${primaryColor}] text-[${textColor}] font-semibold rounded-lg hover:bg-[${accentColor}] transition-all duration-300 transform hover:-translate-y-1 hover:scale-105 shadow-lg hover:shadow-xl group">
                                        View All Events
                                        <i class="fas fa-arrow-right transition-transform duration-300 group-hover:translate-x-1"></i>
                                    </a>
                                </div>
                            ` : ''}
                        </div>
                    </div>

                    <!-- Events List Container -->
                    <event-list primary_color="${primaryColor}" secondary_color="${secondaryColor}"></event-list>
                </div>
                

            </section>
        `;
    }
}

customElements.define('events-section', EventsSection);
export default EventsSection; 