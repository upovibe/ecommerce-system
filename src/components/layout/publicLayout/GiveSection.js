import App from '@/core/App.js';
import { unescapeJsonFromAttribute } from '@/utils/jsonUtils.js';
import '@/components/layout/publicLayout/GiveList.js';
import '@/components/ui/ContentDisplay.js';

/**
 * Give Section Component
 *
 * Displays give content with banner, title, and content from page data.
 * Accepts color theming via 'colors' attribute and page data.
 */
class GiveSection extends App {
    constructor() {
        super();
    }

    connectedCallback() {
        super.connectedCallback();
        this.loadDataFromProps();
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

        // Filter out empty/null values and return only the first image
        const filteredImages = bannerImages.filter(img => img && img.trim() !== '');
        return filteredImages.length > 0 ? [filteredImages[0]] : [];
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

        if (settingsAttr) {
            const settings = unescapeJsonFromAttribute(settingsAttr);
            if (settings) {
                // Set textbox background color for content styling
                if (settings.textbox_bg_color) {
                    this.set('textboxBgColor', settings.textbox_bg_color);
                }
            }
        }

        // Render immediately with the data
        this.render();
    }

    render() {
        // Get page data from state
        const pageData = this.get('pageData') || {};
        
        // Get banner images
        const bannerImages = this.getBannerImages(pageData) || [];
        const showImages = bannerImages.length > 0;

        // Get title and subtitle from page data
        const heroTitle = (pageData && pageData.title) ? pageData.title : 'Give to Our Church';
        const heroSubtitle = (pageData && pageData.subtitle) ? pageData.subtitle : 'Supporting our ministry';

        // Get colors from state
        const primaryColor = this.get('primary_color');
        const secondaryColor = this.get('secondary_color');
        const accentColor = this.get('accent_color');
        const textColor = this.get('text_color');
        const darkColor = this.get('dark_color');
        const hoverPrimary = this.get('hover_primary');
        const hoverSecondary = this.get('hover_secondary');
        const hoverAccent = this.get('hover_accent');
        const textboxBgColor = this.get('textboxBgColor');

        return `
        <!-- Give Banner Section with Background -->
        <div class="">
            <div class="relative w-full h-[500px] lg:h-[45vh] overflow-hidden">
                ${showImages ? bannerImages.map((img, idx) => `
                    <div
                         class="absolute inset-0 w-full h-full bg-cover bg-center transition-opacity duration-1000 ${idx === 0 ? 'opacity-100 z-10' : 'opacity-0 z-0'}"
                         style="background-image: url('${this.getImageUrl(img)}'); transition-property: opacity;">
                    </div>
                `).join('') : ''}
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
                        
                        <!-- Mouse Scroll Indicator -->
                        <div class="absolute bottom-8 left-1/2 transform -translate-x-1/2">
                            <div class="flex flex-col items-center text-white cursor-pointer group" onclick="window.scrollTo({top: window.innerHeight, behavior: 'smooth'})">
                                <div class="w-6 h-10 border-2 border-white rounded-full flex justify-center transition-all duration-300 group-hover:scale-110 group-hover:border-[${accentColor}]">
                                    <div class="w-1.5 h-3 bg-white rounded-full mt-2 animate-bounce transition-all duration-300 group-hover:bg-[${accentColor}]"></div>
                                </div>
                                <span class="text-sm mt-3 opacity-90 transition-all duration-300 group-hover:opacity-100 group-hover:scale-105 font-medium">Scroll</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        
        <!-- Give Content Section -->
        <div id="give-list-section" class="container mx-auto px-4 py-12 mb-20">
            <div class="max-w-6xl mx-auto">
            <!-- Content Display -->
            ${pageData.content ? `
                <div class="rounded-3xl shadow-lg overflow-hidden mb-20" style="background-color: ${textboxBgColor}AA;">
                    <div class="p-5 lg:p-12">
                        <content-display
                            content="${pageData.content.replace(/"/g, '&quot;')}"
                            no-styles>
                        </content-display>
                    </div>
                </div>
            ` : ''}
            
            <!-- Give List Component -->
            <give-list></give-list>
            </div>
        </div>
        `;
    }
}

customElements.define('give-section', GiveSection);
export default GiveSection;
