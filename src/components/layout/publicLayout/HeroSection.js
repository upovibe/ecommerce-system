import App from '@/core/App.js';
import { unescapeJsonFromAttribute } from '@/utils/jsonUtils.js';

/**
 * Hero Section Component
 *
 * Displays the hero banner with title, subtitle, buttons, and scroll indicator
 */
class HeroSection extends App {
  constructor() {
    super();
  }

  connectedCallback() {
    super.connectedCallback();
    this.currentImageIndex = 0;
    this.slideshowInterval = null;
    if (!this._navListenerAttached) {
      this.addEventListener('click', (e) => {
        const btn = e.target.closest('[data-hero-nav-idx]');
        if (btn) {
          const idx = parseInt(btn.getAttribute('data-hero-nav-idx'));
          this.goToImage(idx);
        }
      });
      this._navListenerAttached = true;
    }
    this.loadDataFromProps();
  }

  disconnectedCallback() {
    if (this.slideshowInterval) {
      clearInterval(this.slideshowInterval);
    }
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
                if (settings.hero_title) this.set('heroTitle', settings.hero_title);
                if (settings.hero_subtitle)
                    this.set('heroSubtitle', settings.hero_subtitle);
                if (settings.quote_of_the_day) this.set('quoteOfTheDay', settings.quote_of_the_day);
            }
        }

        // Render immediately with the data
        this.render();
        this.startSlideshow();
    }

  startSlideshow() {
    const bannerImages = this.getBannerImages(this.get('pageData')) || [];
    if (this.slideshowInterval) clearInterval(this.slideshowInterval);
    if (bannerImages.length <= 1) return;
    this.slideshowInterval = setInterval(() => {
      this.currentImageIndex =
        (this.currentImageIndex + 1) % bannerImages.length;
      window.requestAnimationFrame(() => this.render());
    }, 7000); // 7 seconds per image
  }

  goToImage(idx) {
    if (this.currentImageIndex !== idx) {
      this.currentImageIndex = idx;
      this.render();
      this.startSlideshow();
    }
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
    return bannerImages.filter((img) => img && img.trim() !== '');
  }

      render() {
        const pageData = this.get('pageData');
        const error = this.get('error');
        const heroTitle = pageData && pageData.title ? pageData.title : '';
        const heroSubtitle = pageData && pageData.subtitle ? pageData.subtitle : '';
        const quoteOfTheDay = this.get('quoteOfTheDay') || 'For God so loved the world that he gave his one and only Son, that whoever believes in him shall not perish but have eternal life. - John 3:16';
        const primaryColor = this.get('primary_color');
        const secondaryColor = this.get('secondary_color');
        const accentColor = this.get('accent_color');
        const textColor = this.get('text_color');
        const darkColor = this.get('dark_color');
        const hoverPrimary = this.get('hover_primary');
        const hoverSecondary = this.get('hover_secondary');
        const hoverAccent = this.get('hover_accent');

    if (error) {
      this.innerHTML = `
                <div class="container mx-auto flex items-center justify-center p-8">
                    <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                        ${error}
                    </div>
                </div>
            `;
      return;
    }

    const bannerImages = this.getBannerImages(pageData) || [];
    const currentIdx = this.currentImageIndex;
    const showImages = bannerImages.length > 0;

    // Navigation dots/numbers for images
    const navNumbers =
      bannerImages.length > 1
        ? `
            <div class="absolute bottom-6 right-6 z-40 flex flex-col items-end gap-3 select-none">
                ${bannerImages
                  .map(
                    (img, idx) => `
                    <button type="button"
                        class="flex items-start justify-start gap-3 font-bold text-3xl border-0 transition-all duration-200 w-fit h-fit px-0 py-1 bg-transparent shadow-none group"
                        aria-label="Go to image ${idx + 1}"
                        data-hero-nav-idx="${idx}"
                    >
                        <span class="inline-block w-12 mr-2 border-t-2 border-b-transparent border-l-transparent border-r-transparent align-top
                            ${
                              currentIdx === idx
                                ? `border-t-[${textColor}]`
                                : `border-t-transparent`
                            } 
                            transition-colors duration-200"></span>
                        <span class="font-light inline-block align-top leading-none -mt-2 ${
                          currentIdx === idx
                            ? `text-[${textColor}]`
                            : `text-[${textColor}]/50`
                        } transition-colors duration-200">
                            ${String(idx + 1).padStart(2, '0')}
                        </span>
                    </button>
                `,
                  )
                  .join('')}
            </div>
        `
        : '';

    this.innerHTML = `
            <!-- Hero Banner Section with Slideshow Background -->
            <div class="">
                <div class="relative w-full h-[500px] lg:h-[70vh] overflow-hidden">
                    ${
                      showImages
                        ? bannerImages
                            .map(
                              (img, idx) => `
                        <div
                             class="absolute inset-0 w-full h-full bg-cover bg-center transition-opacity duration-1000 ${
                               idx === this.currentImageIndex
                                 ? 'opacity-100 z-10'
                                 : 'opacity-0 z-0'
                             }"
                             style="background-image: url('${this.getImageUrl(
                               img,
                             )}'); transition-property: opacity;">
                        </div>
                    `,
                            )
                            .join('')
                        : ''
                    }
                    <!-- Dark gradient overlay from bottom to top -->
                    <div class="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent z-20"></div>
                    <!-- Hero Content Overlay -->
                    <div class="absolute inset-0 flex items-center justify-start z-30 container mx-auto">
                        <div class="text-left text-white px-4 lg:px-8 max-w-4xl space-y-6">
                            <h1 class="tracking-wide lg:max-w-[70%] text-4xl md:text-5xl lg:text-6xl font-black drop-shadow-lg" style="line-height: 1.1;">
                                ${heroTitle}
                            </h1>
                            <p class="text-xl md:text-2xl opacity-95 leading-relaxed mx-auto drop-shadow-md">
                                ${heroSubtitle}
                            </p>
                            <div class="flex flex-row gap-2 sm:gap-4 justify-center w-fit pt-6">
                                <blockquote class="px-6 py-4 bg-[${secondaryColor}] text-[${darkColor}] rounded-xl shadow-lg max-w-2xl border-l-4 border-[${accentColor}]">
                                    <div class="flex items-start gap-3">
                                        <i class="fas fa-quote-left text-2xl opacity-70"></i>
                                        <div class="flex-1">
                                            <p class="text-lg leading-relaxed italic">${quoteOfTheDay}</p>
                                        </div>
                                    </div>
                                </blockquote>
                            </div>
                        </div>
                    </div>
                    ${navNumbers}
                </div>
            </div>
        `;
  }
}

customElements.define('hero-section', HeroSection);
