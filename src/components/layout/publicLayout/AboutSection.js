import App from '@/core/App.js';
import { unescapeJsonFromAttribute } from '@/utils/jsonUtils.js';
import '@/components/ui/ContentDisplay.js';

/**
 * About Section Component
 *
 * Displays information about the school with content from the home page
 */
class AboutSection extends App {
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
    const serviceTimesAttr = this.getAttribute('service-times');

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

    if (serviceTimesAttr) {
      const serviceTimes = unescapeJsonFromAttribute(serviceTimesAttr);
      if (serviceTimes) {
        this.set('serviceTimes', serviceTimes);
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
    const serviceTimes = this.get('serviceTimes');

    // Only render if there's content
    if (!pageData?.content || pageData.content.trim() === '') {
      return '';
    }

    // Render service times section
    const renderServiceTimes = () => {
      if (!serviceTimes || !Array.isArray(serviceTimes) || serviceTimes.length === 0) {
        return '';
      }

      return `
        <div class="mt-6 p-4 bg-white/10 backdrop-blur-sm rounded-lg border border-white/20">
          <h3 class="text-3xl font-semibold text-[${secondaryColor}] mb-3 flex items-center">
            Service Times
          </h3>
          <div class="space-y-2">
            ${serviceTimes.map(time => `
              <div class="flex items-center text-[${secondaryColor}]/90">
                <i class="fas fa-church mr-3 text-[${accentColor}]"></i>
                <span class="text-sm">${time}</span>
              </div>
            `).join('')}
          </div>
        </div>
      `;
    };

    return `
        
        
        <style>
            .floating-card {
                animation: float 6s ease-in-out infinite;
            }
            
            @keyframes float {
                0%, 100% { transform: translateY(0px) rotate(0deg); }
                50% { transform: translateY(-20px) rotate(2deg); }
            }
            
            .glow-effect {
                box-shadow: 0 0 30px rgba(59, 130, 246, 0.3), 0 0 60px rgba(59, 130, 246, 0.2);
            }
            
            .hover-lift {
                transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
            }
            
            .hover-lift:hover {
                transform: translateY(-15px) scale(1.05) rotate(1deg);
                box-shadow: 0 25px 50px rgba(0, 0, 0, 0.3), 0 0 40px rgba(59, 130, 246, 0.4);
            }
        </style>


        <!-- About Section -->
        <section class="py-10 bg-[${primaryColor}]">
            <div class="container mx-auto w-full flex flex-col md:flex-row items-center gap-8">
                <!-- Left: Title and Subtitle -->
                <div class="w-full md:w-1/2 flex flex-col gap-3 justify-center items-start text-[${secondaryColor}] lg:pl-8 self-start p-5">
                    <h2 class="text-4xl md:text-5xl lg:text-6xl tracking-wide font-black drop-shadow-lg" style="line-height: 1.2;">
                        ${pageData.title || ''}
                    </h2>
                    <p class="text-lg lg:text-xl leading-8 text-gray-500 mt-4"  >
                        ${pageData.meta_description || ''}
                    </p>
                    ${renderServiceTimes()}
                </div>
                <!-- Right: Modern Square Banner Image with Effects -->
                <div class="w-full md:w-1/2 flex justify-center items-center">
                    <div class="relative group">
                        <!-- Floating Square Card with Hover Effects -->
                        <div class="relative w-80 h-80 sm:w-96 sm:h-96 md:w-[28rem] md:h-[28rem] lg:w-[32rem] lg:h-[32rem] floating-card hover-lift">
                            <!-- Gradient Border -->
                            <div class="absolute inset-0 bg-gradient-to-br from-[${accentColor}] via-[${secondaryColor}] to-[${primaryColor}] rounded-3xl p-1 glow-effect">
                                <!-- Inner Card -->
                                <div class="relative w-full h-full bg-white rounded-3xl overflow-hidden shadow-2xl">
                                    <!-- Image Container -->
                                    <div class="relative w-full h-full">
                                        <img src="/api/${(() => {
                                          let img = pageData.banner_image;
                                          if (typeof img === 'string') {
                                            try {
                                              const arr = JSON.parse(img);
                                              if (Array.isArray(arr) && arr.length > 0)
                                                return arr[0];
                                            } catch (e) {
                                              if (img.includes(','))
                                                return img.split(',')[0].trim();
                                              return img;
                                            }
                                          } else if (Array.isArray(img) && img.length > 0) {
                                            return img[0];
                                          }
                                          return img || '';
                                        })()}"
                                             alt="About Our Church"
                                             class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                             onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
                                        
                                        <!-- Fallback for no image -->
                                        <div class="absolute inset-0 hidden items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
                                            <div class="text-center">
                                                <i class="fas fa-church text-[${primaryColor}] text-6xl mb-4"></i>
                                                <p class="text-[${primaryColor}] font-semibold text-lg">About Our Church</p>
                                            </div>
                                        </div>
                                        
                                        <!-- Hover Overlay -->
                                        <div class="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                                        
                                        <!-- Shine Effect -->
                                        <div class="absolute inset-0 -top-1 -left-1 bg-gradient-to-r from-transparent via-white/20 to-transparent transform -skew-x-12 translate-x-[-100%] group-hover:translate-x-[200%] transition-transform duration-1000"></div>
                                    </div>
                                </div>
                            </div>
                            
                            <!-- Floating Elements -->
                            <div class="absolute -top-4 -right-4 w-8 h-8 bg-[${accentColor}] rounded-full opacity-80 group-hover:opacity-100 transition-opacity duration-300"></div>
                            <div class="absolute -bottom-2 -left-2 w-6 h-6 bg-[${secondaryColor}] rounded-full opacity-60 group-hover:opacity-100 transition-opacity duration-300"></div>
                            <div class="absolute top-1/2 -left-6 w-4 h-4 bg-[${primaryColor}] rounded-full opacity-70 group-hover:opacity-100 transition-opacity duration-300"></div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    `;
  }
}

customElements.define('about-section', AboutSection);
export default AboutSection;
