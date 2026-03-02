import App from '@/core/App.js';
import { unescapeJsonFromAttribute } from '@/utils/jsonUtils.js';
import '@/components/ui/ContentDisplay.js';
import '@/components/layout/publicLayout/PhotoGalleryList.js';
import '@/components/layout/publicLayout/VideoGalleryList.js';

/**
 * Gallery Section Component
 * 
 * Displays gallery information with content from the gallery page and galleries from API
 */
class GallerySection extends App {
    constructor() {
        super();
        this.set('activeTab', 'photos'); // Default to photos tab
    }

    connectedCallback() {
        super.connectedCallback();
        this.loadDataFromProps();
    }

    switchTab(tab) {
        this.set('activeTab', tab);
        this.render();
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

        // Render immediately with the data
        this.render();
    }

    // Helper method to get proper image URL (copied from ServiceEventsSection)
    getImageUrl(imagePath) {
        if (!imagePath) return null;
        if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
            return imagePath;
        }
        if (imagePath.startsWith('/')) {
            const baseUrl = window.location.origin;
            return baseUrl + imagePath;
        }
        // For relative paths like "uploads/galleries/filename.jpg"
        // Construct the URL by adding the base URL and /api
        const baseUrl = window.location.origin;
        const apiPath = '/api';
        return baseUrl + apiPath + '/' + imagePath;
    }

    // Helper method to parse banner images (copied from ServiceEventsSection)
    getBannerImages(pageData) {
        if (!pageData || !pageData.banner_image) {
            return [];
        }
        let bannerImages = pageData.banner_image;
        if (typeof bannerImages === 'string') {
            try {
                const parsed = JSON.parse(bannerImages);
                if (Array.isArray(parsed)) {
                    bannerImages = parsed;
                } else {
                    bannerImages = [bannerImages];
                }
            } catch (e) {
                bannerImages = [bannerImages];
            }
        } else if (!Array.isArray(bannerImages)) {
            bannerImages = [bannerImages];
        }
        // Filter out empty/null values and return only the first image
        const filteredImages = bannerImages.filter(img => img && img.trim() !== '');
        return filteredImages.length > 0 ? [filteredImages[0]] : [];
    }

    render() {
        const pageData = this.get('pageData');
        
        // Get colors from state
        const primaryColor = this.get('primary_color');
        const secondaryColor = this.get('secondary_color');
        const accentColor = this.get('accent_color');
        const textColor = this.get('text_color');
        const hoverPrimary = this.get('hover_primary');
        const hoverSecondary = this.get('hover_secondary');
        const hoverAccent = this.get('hover_accent');
        // Banner logic
        const bannerImages = this.getBannerImages(pageData) || [];
        const showImages = bannerImages.length > 0;
        // Only render if there's content
        if (!pageData) {
            return '';
        }

        return `
            <!-- Gallery Section -->
            <section class="mx-auto">
                <!-- Banner Section (EXACTLY like ServiceEventsSection.js) -->
                <div class="relative w-full h-[500px] lg:h-[55vh] overflow-hidden">
                    ${showImages ? bannerImages.map((img, idx) => `
                        <div
                            class="absolute inset-0 w-full h-full bg-cover bg-center transition-opacity duration-1000 ${idx === 0 ? 'opacity-100 z-10' : 'opacity-0 z-0'}"
                            style="background-image: url('${this.getImageUrl(img)}'); transition-property: opacity;">
                        </div>
                    `).join('') : `
                        <div class="absolute inset-0 w-full h-full bg-gray-200 flex items-center justify-center z-10">
                            <div class="text-center">
                                <i class="fas fa-image text-gray-400 text-6xl mb-2"></i>
                                <p class="text-gray-500 font-medium">No Gallery Banner Image</p>
                            </div>
                        </div>
                    `}
                    <!-- Dark gradient overlay from bottom to top -->
                    <div class="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent z-20"></div>
                    <!-- Content Overlay -->
                    <div class="absolute inset-0 flex items-center justify-start z-30 container mx-auto">
                        <div class="text-left text-white px-4 lg:px-8 max-w-4xl space-y-6">
                            <h1 class="text-4xl md:text-5xl lg:text-6xl font-bold drop-shadow-lg pb-2 border-b-4 border-[${accentColor}] w-fit" style="line-height: 1.1">
                                ${pageData && pageData.title ? pageData.title : 'Creative Gallery'}
                            </h1>
                            ${pageData && pageData.subtitle ? `
                                <p class="text-lg md:text-xl lg:text-2xl opacity-95 leading-relaxed drop-shadow-md">
                                    ${pageData.subtitle}
                                </p>
                            ` : ''}
                            <div class="flex flex-row gap-2 sm:gap-4 justify-start w-fit">
                                <button 
                                    class="px-5 py-2 rounded-xl text-lg shadow-lg flex items-center gap-2 transition-all duration-300 ${this.get('activeTab') === 'photos' ? `bg-[${accentColor}] text-[${primaryColor}]` : `bg-white/20 text-white hover:bg-white/30`}"
                                    onclick="this.closest('gallery-section').switchTab('photos')">
                                    <i class="fas fa-images text-base"></i>
                                    Photos
                                </button>
                                <button 
                                    class="px-5 py-2 rounded-xl text-lg shadow-lg flex items-center gap-2 transition-all duration-300 ${this.get('activeTab') === 'videos' ? `bg-[${secondaryColor}] text-[${primaryColor}]` : `bg-white/20 text-white hover:bg-white/30`}"
                                    onclick="this.closest('gallery-section').switchTab('videos')">
                                    <i class="fas fa-video text-base"></i>
                                    Videos
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
                <!-- Content Sections -->
                <div class="container mx-auto px-4 py-8">
                    ${this.get('activeTab') === 'photos' ? `
                        <div class="animate-fade-in">
                            <photo-gallery-list></photo-gallery-list>
                        </div>
                    ` : `
                        <div class="animate-fade-in">
                            <video-gallery-list></video-gallery-list>
                        </div>
                    `}
                </div>
            </section>
        `;
    }
}

customElements.define('gallery-section', GallerySection);
export default GallerySection; 