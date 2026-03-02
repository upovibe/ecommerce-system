import App from '@/core/App.js';
import { unescapeJsonFromAttribute } from '@/utils/jsonUtils.js';

/**
 * Connect Section Component
 *
 * Displays connect content with title/subtitle on left and banner images on right.
 * Accepts color theming via 'colors' attribute and page data.
 */
class ConnectSection extends App {
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

  render() {
    // Get colors from state
    const primaryColor = this.get('primary_color');
    const secondaryColor = this.get('secondary_color');
    const accentColor = this.get('accent_color');
    const textColor = this.get('text_color');

    // Get page data from state
    const pageData = this.get('pageData') || {};

    // Get banner images
    let bannerImages = [];
    if (pageData.banner_image) {
      try {
        const banners =
          typeof pageData.banner_image === 'string'
            ? JSON.parse(pageData.banner_image)
            : pageData.banner_image;
        if (Array.isArray(banners)) {
          bannerImages = banners.slice(0, 2); // Take first 2 images
        } else {
          bannerImages = [banners];
        }
      } catch {}
    }

    return `
        <section class="px-5 py-4">
            <div class="container mx-auto bg-slate-400 rounded-2xl shadow-2xl p-8 py-20 backdrop-blur-sm bg-opacity-95">
                <div class="grid grid-cols-1 lg:grid-cols-2 gap-4 items-center">
                    <!-- Left: Title and Subtitle -->
                    <div class="flex flex-col justify-center mb-auto space-y-6">
                        <div class="space-y-4">
                            <h2 class="text-4xl md:text-5xl lg:text-6xl font-bold  text-[${textColor}] ">${
      pageData.title || 'Connect With Us'
    }</h2>
                            <p class="text-2xl text-[${textColor}]/80 leading-relaxed px-2">${
      pageData.subtitle ||
      'Join our community and be part of something meaningful. Connect with us through various channels and get involved in our ministries.'
    }</p>
                        </div>
                        
                        <!-- Simple Glowing Contact Button -->
                        <div class="flex justify-center lg:justify-start">
                            <a href="/public/contact" 
                               class="inline-flex items-center px-6 py-3 text-white font-semibold rounded-lg shadow-lg transform transition-all duration-300 hover:scale-105"
                               style="background: linear-gradient(135deg, ${primaryColor}, ${accentColor}); box-shadow: 0 0 20px ${primaryColor}60;">
                                <i class="fas fa-envelope mr-2"></i>
                                Contact Us
                            </a>
                        </div>
                    </div>

                    <!-- Right: Banner Images in Cards -->
                    <div class="relative flex items-center justify-center mx-auto w-full h-full">
                        ${
                          bannerImages.length > 0
                            ? bannerImages
                                .map(
                                  (image, index) => `
                            <div class="bg-gray-200 rounded-xl shadow-lg overflow-hidden transform hover:scale-105 hover:z-50 transition-all duration-300 ${
                              index === 1
                                ? 'absolute top-8 left-8 z-0'
                                : 'relative z-10'
                            } size-[18rem]">
                                <img src="/api/${image}" alt="Connect Banner ${
                                    index + 1
                                  }" class="w-full h-full object-cover">
                            </div>
                        `,
                                )
                                .join('')
                            : `
                            <div class="bg-gray-200 rounded-xl shadow-lg overflow-hidden transform hover:scale-105 hover:z-50 transition-all duration-300 relative z-0 size-[16rem]">
                                <div class="w-full h-full bg-gradient-to-br from-slate-300 to-slate-400 flex items-center justify-center">
                                    <div class="text-center text-slate-600">
                                        <i class="fas fa-image text-2xl mb-1"></i>
                                        <p class="text-xs">Banner Image 1</p>
                                    </div>
                                </div>
                            </div>
                            <div class="bg-gray-200 rounded-xl shadow-lg overflow-hidden transform hover:scale-105 hover:z-50 transition-all duration-300 absolute top-8 left-8 z-10 size-[16rem]">
                                <div class="w-full h-full bg-gradient-to-br from-slate-300 to-slate-400 flex items-center justify-center">
                                    <div class="text-center text-slate-600">
                                        <i class="fas fa-image text-2xl mb-1"></i>
                                        <p class="text-xs">Banner Image 2</p>
                                    </div>
                                </div>
                            </div>
                        `
                        }
                    </div>
                </div>
            </div>
        </section>
        `;
  }
}

customElements.define('connect-section', ConnectSection);
export default ConnectSection;
