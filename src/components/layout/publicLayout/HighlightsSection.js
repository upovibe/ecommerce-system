import App from '@/core/App.js';
import { unescapeJsonFromAttribute } from '@/utils/jsonUtils.js';

/**
 * Highlights Section Component
 *
 * Displays a highlights area for events, sermons, testimonies, etc.
 * Accepts color theming via 'colors' attribute.
 */
class HighlightsSection extends App {
  constructor() {
    super();
    this.currentTestimonialIndex = 0;
    this.isNavigating = false; // Track if user has started navigating
  }

  connectedCallback() {
    super.connectedCallback();
    this.loadDataFromProps();
  }

  loadDataFromProps() {
    // Get data from props/attributes
    const colorsAttr = this.getAttribute('colors');
    const pagesAttr = this.getAttribute('pages');
    const testimonialsDataAttr = this.getAttribute('testimonials-data');

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

    if (pagesAttr) {
      const pages = unescapeJsonFromAttribute(pagesAttr);
      if (pages) {
        this.set('pages', pages);
      }
    }

    if (testimonialsDataAttr) {
      const testimonialsData = unescapeJsonFromAttribute(testimonialsDataAttr);
      if (testimonialsData) {
        this.set('testimonialsData', testimonialsData);
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
    const hoverPrimary = this.get('hover_primary');
    const hoverSecondary = this.get('hover_secondary');
    const hoverAccent = this.get('hover_accent');

    // Get pages from state
    const pages = this.get('pages') || {};
    const sermon = pages.sermons || {};
    let bannerImg = '';
    if (sermon.banner_image) {
      let img = sermon.banner_image;
      if (typeof img === 'string') {
        try {
          const arr = JSON.parse(img);
          if (Array.isArray(arr) && arr.length > 0) bannerImg = arr[0];
          else bannerImg = img;
        } catch (e) {
          if (img.includes(',')) bannerImg = img.split(',')[0].trim();
          else bannerImg = img;
        }
      } else if (Array.isArray(img) && img.length > 0) {
        bannerImg = img[0];
      }
    }

    const event = pages.events || {};
    let eventBanner = '';
    if (event.banner_image) {
      let img = event.banner_image;
      if (typeof img === 'string') {
        try {
          const arr = JSON.parse(img);
          if (Array.isArray(arr) && arr.length > 0) eventBanner = arr[0];
          else eventBanner = img;
        } catch (e) {
          if (img.includes(',')) eventBanner = img.split(',')[0].trim();
          else eventBanner = img;
        }
      } else if (Array.isArray(img) && img.length > 0) {
        eventBanner = img[0];
      }
    }

    // Get testimonials data
    const testimonialsData = this.get('testimonialsData') || [];
    const currentTestimonial =
      testimonialsData[this.currentTestimonialIndex] || {};

    const testimonial =
      (pages.testimonials && Array.isArray(pages.testimonials)
        ? pages.testimonials[0]
        : pages.testimonials) || {};
    let testimonialBanner = '';
    if (testimonial && testimonial.banner_image) {
      let img = testimonial.banner_image;
      if (typeof img === 'string') {
        try {
          const arr = JSON.parse(img);
          if (Array.isArray(arr) && arr.length > 0) testimonialBanner = arr[0];
          else testimonialBanner = img;
        } catch (e) {
          if (img.includes(',')) testimonialBanner = img.split(',')[0].trim();
          else testimonialBanner = img;
        }
      } else if (Array.isArray(img) && img.length > 0) {
        testimonialBanner = img[0];
      }
    }

    return `
        <section class="py-10 bg-[${primaryColor}]">
            <div class="container mx-auto w-full flex flex-col items-center gap-8 px-4">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
                    <!-- Sermon Card -->
                    <a href="/public/service-events" class="rounded-xl shadow relative flex-1 items-center justify-center h-[20rem] min-h-[20rem] overflow-hidden p-0 no-underline hover:ring-2 hover:ring-[${accentColor}] transition-all cursor-pointer">
                        ${
                          bannerImg
                            ? `<img src="/api/${bannerImg}" alt="Sermon Banner" class="absolute inset-0 w-full h-full object-cover opacity-70">`
                            : `
                        <div class='absolute inset-0 flex items-center justify-center bg-[${accentColor}] rounded-xl'>
                            <i class='fas fa-image text-white text-5xl'></i>
                        </div>`
                        }
                        <div class="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent z-10"></div>
                        <div class="absolute bottom-0 left-0 w-full flex flex-col items-start p-4 z-20">
                            <div class="flex items-start gap-2">
                                <i class="fas fa-circle-play text- text-2xl mt-2 text-[${accentColor}]"></i>
                                <div class="flex flex-col items-start">
                                    <h2 class="text-3xl lg:text-4xl font-extrabold italic text-white drop-shadow-lg mb-1 flex items-center gap-2">
                                    ${sermon.title || 'Sermon'}
                                    </h2>
                                    <span class="inline-block bg-[${primaryColor}] bg-opacity-80 text-white text-xs font-semibold px-3 py-1 rounded shadow">Watch now</span>
                                </div>
                            </div>
                        </div>
                    </a>
                    <!-- Event Card -->
                    <a href="/public/service-events" class="rounded-xl shadow relative flex-1 items-center justify-center h-[20rem] min-h-[20rem] overflow-hidden p-0 no-underline hover:ring-2 hover:ring-[${accentColor}] transition-all cursor-pointer">
                        ${
                          eventBanner
                            ? `<img src="/api/${eventBanner}" alt="Event Banner" class="absolute inset-0 w-full h-full object-cover opacity-70">`
                            : `
                        <div class='absolute inset-0 flex items-center justify-center bg-[${accentColor}] rounded-xl'>
                            <i class='fas fa-image text-white text-5xl'></i>
                        </div>`
                        }
                        <div class="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent z-10"></div>
                        <div class="absolute bottom-0 left-0 w-full flex flex-col items-start p-4 z-20">
                            <div class="flex items-start gap-2">
                                <i class="fas fa-calendar-alt text- text-2xl mt-2 text-[${accentColor}]"></i>
                                <div class="flex flex-col items-start">
                                    <h2 class="text-3xl lg:text-4xl font-extrabold italic text-white drop-shadow-lg mb-1 flex items-center gap-2">
                                    ${event.title || 'Events'}
                                    </h2>
                                    <span class="inline-block bg-[${primaryColor}] bg-opacity-80 text-white text-xs font-semibold px-3 py-1 rounded shadow">See events</span>
                                </div>
                            </div>
                        </div>
                    </a>
                </div>

                <!-- Testimonial Section -->
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6 w-full bg-slate-400 rounded-2xl shadow-2xl p-8 border border-slate-600 backdrop-blur-sm bg-opacity-95">
                    <!-- Left: Text -->
                    <div class="flex-1 lg:p-8 min-h-[18rem]">
                        <div class="flex flex-col justify-center items-start pl-3">
                            <div class="flex-col justify-center items-start border-r-4 border-[${accentColor}] pr-1 w-full">
                            <h3 class="text-4xl font-black text-[${textColor}] text-wrapmb-4" id="testimonial-title">${
      this.isNavigating
        ? currentTestimonial.title || 'Testimonial'
        : testimonial.title || 'Testimonial'
    }</h3>
                            <p class="text-base sm:text-lg md:text-xl lg:text-2xl italic text-[${textColor}]/90" id="testimonial-description" style="display: ${
      this.isNavigating ? 'none' : 'block'
    }">"${
      testimonial.subtitle || 'No testimonial available.'
    }"</p>                        
                        </div>
                            <div class="flex gap-4 mt-8">
                                <button class="flex items-center justify-center text-[${accentColor}] text-2xl border-2 border-[${accentColor}] rounded-full p-2 focus:outline-none size-10 hover:text-[${accentColor}]/50 hover:border-[${accentColor}]/50 transition-all" onclick="this.closest('highlights-section').navigateTestimonial(-1)"><i class="fas fa-chevron-left"></i></button>
                                <button class="flex items-center justify-center text-[${accentColor}] text-2xl border-2 border-[${accentColor}] rounded-full p-2 focus:outline-none size-10 hover:text-[${accentColor}]/50 hover:border-[${accentColor}]/50 transition-all" onclick="this.closest('highlights-section').navigateTestimonial(1)"><i class="fas fa-chevron-right"></i></button>
                            </div>                    
                        </div>
                    </div>
                    <!-- Right: Banner/Description -->
                    <div class="flex-1 flex items-center justify-center min-h-[18rem]" id="testimonial-right-content">
                        ${
                          this.isNavigating && testimonialsData.length > 0
                            ? `
                        <div class='flex items-center justify-center w-full h-full min-h-[18rem] p-8'>
                            <div class="bg-slate-800 rounded-2xl shadow-2xl p-8 border border-slate-600 transform hover:scale-105 transition-all duration-300 backdrop-blur-sm bg-opacity-95">
                                <div class="flex items-center justify-center mb-4">
                                    <i class="fas fa-quote-left text-4xl text-slate-400"></i>
                                </div>
                                <p class="text-slate-100 text-base sm:text-lg md:text-xl lg:text-2xl italic text-center leading-relaxed font-medium">"${
                                  currentTestimonial.description ||
                                  'No testimonial available.'
                                }"</p>
                                <div class="flex items-center justify-center mt-4">
                                    <i class="fas fa-quote-right text-4xl text-slate-400"></i>
                                </div>
                            </div>
                        </div>`
                            : testimonialBanner
                            ? `<img src="/api/${testimonialBanner}" alt="Testimonial Banner" class="w-full h-full object-cover rounded-xl max-h-72">`
                            : `
                        <div class='flex items-center justify-center w-full h-full bg-[${accentColor}] rounded-xl min-h-[18rem]'>
                            <i class='fas fa-image text-white text-5xl'></i>
                        </div>`
                        }
                    </div>
                </div>
            </div>
        </section>
        `;
  }

  navigateTestimonial(direction) {
    const testimonialsData = this.get('testimonialsData') || [];
    if (testimonialsData.length === 0) return;

    // Set navigating flag to true on first navigation
    this.isNavigating = true;

    this.currentTestimonialIndex += direction;

    // Wrap around
    if (this.currentTestimonialIndex < 0) {
      this.currentTestimonialIndex = testimonialsData.length - 1;
    } else if (this.currentTestimonialIndex >= testimonialsData.length) {
      this.currentTestimonialIndex = 0;
    }

    const currentTestimonial = testimonialsData[this.currentTestimonialIndex];

    // Update the title and description
    const titleElement = this.querySelector('#testimonial-title');
    const descriptionElement = this.querySelector('#testimonial-description');
    const rightContentElement = this.querySelector(
      '#testimonial-right-content',
    );

    if (titleElement) {
      titleElement.textContent = currentTestimonial.title || 'Testimonial';
    }

    if (descriptionElement) {
      descriptionElement.style.display = 'none'; // Hide the meta description when navigating
    }

    if (rightContentElement) {
      rightContentElement.innerHTML = `
                <div class='flex items-center justify-center w-full h-full min-h-[18rem]'>
                    <div class="bg-slate-800 rounded-2xl shadow-2xl p-8 border border-slate-600 transform hover:scale-105 transition-all duration-300 backdrop-blur-sm bg-opacity-95">
                        <div class="flex items-center justify-center mb-4">
                            <i class="fas fa-quote-left text-4xl text-slate-400"></i>
                        </div>
                        <p class="text-slate-100 text-base sm:text-lg md:text-xl lg:text-2xl italic text-center leading-relaxed font-medium">"${
                          currentTestimonial.description ||
                          'No testimonial available.'
                        }"</p>
                        <div class="flex items-center justify-center mt-4">
                            <i class="fas fa-quote-right text-4xl text-slate-400"></i>
                        </div>
                    </div>
                </div>
            `;
    }
  }
}

customElements.define('highlights-section', HighlightsSection);
export default HighlightsSection;
