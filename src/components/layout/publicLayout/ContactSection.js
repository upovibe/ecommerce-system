import App from '@/core/App.js';
import { unescapeJsonFromAttribute } from '@/utils/jsonUtils.js';

/**
 * Contact Section Component
 * 
 * Displays a contact banner with call-to-action overlay using page data
 */
class ContactSection extends App {
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

        if (settingsAttr) {
            const settings = unescapeJsonFromAttribute(settingsAttr);
            if (settings) {
                if (settings.contact_title) this.set('contactTitle', settings.contact_title);
                if (settings.contact_subtitle) this.set('contactSubtitle', settings.contact_subtitle);
            }
        }

        // Render immediately with the data
        this.render();
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

 
        // Only render if there's content
        if (!pageData?.content || pageData.content.trim() === '') {
            return '';
        }

        return `
            <!-- Contact Section -->
            <section class="mx-auto py-8 px-4">
                    <!-- Contact Banner Card -->
                    <div class="relative group rounded-3xl overflow-hidden shadow-2xl">
                        <!-- Banner Background -->
                        <div class="relative h-80 lg:h-96 overflow-hidden">
                            <img src="/api/${pageData.banner_image}" 
                                 alt="Contact Us" 
                                 class="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700"
                                 onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
                            <div class="absolute inset-0 hidden items-center justify-center bg-gray-100">
                                <div class="text-center">
                                    <i class="fas fa-envelope text-gray-400 text-4xl mb-2"></i>
                                    <p class="text-gray-500 font-medium">Contact banner</p>
                                </div>
                            </div>
                            
                            <!-- Overlay with content -->
                            <div class="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent"></div>
                            
                            <!-- Content overlay -->
                            <div class="absolute inset-0 flex items-center justify-center p-6">
                                <div class="text-center text-white relative z-10">
                                    <!-- Header with animated icon -->
                                    <div class="flex justify-center mb-6">
                                        <div class="size-10 bg-[${primaryColor}]/20 backdrop-blur-md rounded-lg flex items-center justify-center shadow-lg transform hover:rotate-12 transition-transform duration-300 border border-white/30">
                                            <i class="fas fa-envelope text-white animate-pulse"></i>
                                        </div>
                                    </div>
                                    
                                    <!-- Title and Subtitle -->
                                    <h2 class="text-3xl lg:text-5xl font-bold mb-4 drop-shadow-lg">
                                        ${this.get('contactTitle')}
                                    </h2>
                                    <p class="text-lg lg:text-xl mb-8 max-w-2xl mx-auto opacity-90 drop-shadow-md">
                                        ${this.get('contactSubtitle')}
                                    </p>
                                    
                                    <!-- Call to Action Button -->
                                    <div class="flex justify-center">
                                        <a href="/public/contact" 
                                           class="inline-flex items-center px-4 py-2 bg-[${primaryColor}]/20 backdrop-blur-md text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 group border border-white/30 hover:bg-[${accentColor}]/30">
                                            <span>Contact Us</span>
                                            <i class="fas fa-arrow-right ml-2 group-hover:translate-x-1 transition-transform duration-300"></i>
                                        </a>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
            </section>
        `;
    }
}

customElements.define('contact-section', ContactSection);
export default ContactSection; 