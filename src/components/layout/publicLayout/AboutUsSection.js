import App from '@/core/App.js';
import { unescapeJsonFromAttribute } from '@/utils/jsonUtils.js';
import '@/components/ui/ContentDisplay.js';

/**
 * About Us Section Component
 *
 * Displays about us content with simple text.
 * Accepts color theming via 'colors' attribute and page data.
 */
class AboutUsSection extends App {
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
    const title = pageData.title || '';
    const subtitle = pageData.subtitle || '';
    const bannerImage = pageData.banner_image;
    const content = pageData.content || '';

    // Get textbox background color from settings
    const textboxBgColor = this.get('textboxBgColor');

    // Parse banner images (support JSON array, comma-separated string, or single string)
    let bannerImages = [];
    if (bannerImage) {
      if (typeof bannerImage === 'string') {
        try {
          const parsed = JSON.parse(bannerImage);
          if (Array.isArray(parsed)) {
            bannerImages = parsed;
          } else {
            bannerImages = [bannerImage];
          }
        } catch (e) {
          // Not JSON, try comma-separated
          if (bannerImage.includes(',')) {
            bannerImages = bannerImage
              .split(',')
              .map((s) => s.trim())
              .filter(Boolean);
          } else {
            bannerImages = [bannerImage];
          }
        }
      } else if (Array.isArray(bannerImage)) {
        bannerImages = bannerImage;
      }
    }

    // Only render if at least one of title, subtitle, bannerImage, or content exists
    if (!title && !subtitle && bannerImages.length === 0 && !content) {
      return '';
    }

    return `
        <style>
            .about-imgs-flex {
                display: flex;
                gap: 1.5rem;
                margin-bottom: 2.5rem;
            }
            .about-imgs-flex .about-img {
                flex: 1 1 0%;
                min-width: 0;
                transition: flex-basis 0.5s cubic-bezier(0.4,0,0.2,1), z-index 0.3s;
                z-index: 1;
            }
            .about-imgs-flex:hover .about-img {
                flex-basis: 15% !important;
                z-index: 1;
            }
            .about-imgs-flex .about-img:hover {
                flex-basis: 70% !important;
                z-index: 2;
            }
        </style>
        <section class="container mx-auto px-4 my-10">
            <div class="mx-auto mb-8">
                ${
                  title
                    ? `<h1 class="text-2xl md:text-4xl font-bold mb-4 text-white" style="line-height: 1.2;">${title}</h1>`
                    : ''
                }
                <!--  ${
                  subtitle
                    ? `<p class="text-xl text-white/80 mb-8">${subtitle}</p>`
                    : ''
                } -->
            </div>
            ${
              bannerImages.length > 1
                ? `
                <div class="about-imgs-flex">
                    ${bannerImages
                      .slice(0, 3)
                      .map(
                        (img, idx) => `
                        <div class="about-img rounded-3xl overflow-hidden shadow-lg bg-white/10 flex items-center justify-center">
                            <img src="/api/${img}"
                                 alt="About Us Banner"
                                 class="w-full h-[40vh] lg:h-[50vh] object-cover transition-all duration-500">
                        </div>
                    `,
                      )
                      .join('')}
                </div>
            `
                : bannerImages.length === 1
                ? `
                <div class="w-full mx-auto mb-10 rounded-3xl overflow-hidden shadow-lg">
                    <img src="/api/${bannerImages[0]}"
                         alt="About Us Banner"
                         class="w-full h-[40vh] lg:h-[50vh] object-cover">
                </div>
            `
                : ''
            }
            ${
              content
                ? `
            <div class="mx-auto mt-10 rounded-2xl shadow p-8 my-10" style="background-color: ${textboxBgColor}AA;">
                <content-display content="${content.replace(
                  /"/g,
                  '&quot;',
                )}" no-styles></content-display>
            </div>
            `
                : ''
            }
        </section>
        `;
  }
}

customElements.define('about-us-section', AboutUsSection);
export default AboutUsSection;
