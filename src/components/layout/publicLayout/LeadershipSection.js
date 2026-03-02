import App from '@/core/App.js';
import { unescapeJsonFromAttribute } from '@/utils/jsonUtils.js';
import '@/components/ui/ContentDisplay.js';
import '@/components/ui/Avatar.js';

/**
 * Our Team Section Component
 *
 * Displays team content with a unique design layout
 */
class LeadershipSection extends App {
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

    // Get team members from props
    const teamMembersAttr = this.getAttribute('team-members');
    if (teamMembersAttr) {
      const teamMembers = unescapeJsonFromAttribute(teamMembersAttr);
      if (teamMembers) {
        this.set('teamMembers', teamMembers);
      }
    }

    // Render immediately with the data
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
    return bannerImages.filter((img) => img && img.trim() !== '');
  }

  render() {
    const pageData = this.get('pageData');
    const teamMembers = this.get('teamMembers') || [];

    // Get colors from state
    const primaryColor = this.get('primary_color');
    const secondaryColor = this.get('secondary_color');
    const accentColor = this.get('accent_color');
    const textColor = this.get('text_color');

    // Only render if there's content
    if (!pageData?.content || pageData.content.trim() === '') {
      return `
                <div class="container mx-auto px-4 text-center py-16">
                    <div class="bg-white rounded-3xl shadow-lg p-8">
                        <i class="fas fa-users text-gray-400 text-6xl mb-4"></i>
                        <h2 class="text-2xl font-semibold text-gray-600 mb-2">Our Team</h2>
                        <p class="text-gray-500">Our team information is being prepared.</p>
                    </div>
                </div>
            `;
    }

    return `
            <!-- Our Team Section -->
            <section class="container mx-auto px-4">
                <!-- Title and Subtitle Section -->
                <div class="text-center mb-12 mt-8">
                    <h1 class="text-4xl md:text-5xl lg:text-6xl font-black tracking-wide text-[${secondaryColor}] mb-4 drop-shadow-lg border-b-4 border-[${accentColor}] pb-4 inline-block">
                        ${pageData?.title || 'Our Leadership'}
                    </h1>
                    <p class="text-xl md:text-2xl text-[${secondaryColor}]/80 max-w-3xl mx-auto leading-relaxed">
                        ${pageData?.subtitle || 'Meet our dedicated team of pastors and ministry leaders'}
                    </p>
                </div>
                
                <!-- Main Content Section (No Banner, No BG) -->
                ${
                  pageData.content
                    ? `
                <div class="mx-auto mt-10 bg-[#898989]/90 rounded-2xl shadow p-8">
                    <content-display 
                        content="${pageData.content.replace(/"/g, '&quot;')}"
                        no-styles>
                    </content-display>
                </div>
                `
                    : ''
                }
                <!-- Team Members Grid -->
                ${
                  teamMembers.length > 0
                    ? `
                    <div class="mt-5">
                        <div class="text-center">
                            <h3 class="text-4xl lg:text-4xl font-bold text-[${secondaryColor}]">Leadership</h3>
                        </div>
                        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                            ${teamMembers
                              .map(
                                (member) => `
                                <div class="flex flex-col items-center justify-start py-8 group">
                                    <!-- Custom Square Avatar with Hover Effect -->
                                    <div class="relative w-full aspect-square mb-6 transform transition-all duration-300 group-hover:scale-110 group-hover:-translate-y-2 group-hover:shadow-2xl group-hover:shadow-[${accentColor}]/30">
                                        <div class="absolute inset-0 bg-gradient-to-br from-[${primaryColor}] to-[${accentColor}] rounded-2xl shadow-lg"></div>
                                        <div class="absolute inset-2 rounded-xl overflow-hidden">
                                            ${
                                              member.profile_image
                                                ? `
                                                <img 
                                                    src="${this.getImageUrl(member.profile_image)}" 
                                                    alt="${member.name}"
                                                    class="w-full h-full object-cover"
                                                    onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';"
                                                >
                                                `
                                                : ''
                                            }
                                            <!-- Fallback for no image -->
                                            <div class="w-full h-full bg-gradient-to-br from-gray-300 to-gray-500 flex items-center justify-center ${member.profile_image ? 'hidden' : ''}">
                                                <div class="text-center text-white">
                                                    <i class="fas fa-user text-6xl mb-2 opacity-70"></i>
                                                    <p class="text-sm font-medium">${member.name.split(' ').map(n => n[0]).join('')}</p>
                                                </div>
                                            </div>
                                        </div>
                                        <!-- Hover overlay effect -->
                                        <div class="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                                    </div>
                                    
                                    <!-- Name and Position Card -->
                                    <div class="mt-2 h-24 flex flex-col justify-center items-center px-4 py-2 rounded-xl bg-[#353535] shadow-lg text-center z-10 w-full transform transition-all duration-300 group-hover:bg-[#2a2a2a] group-hover:shadow-xl">
                                        <h4 class="text-xl font-bold text-white">${
                                          member.name
                                        }</h4>
                                        ${
                                          member.position
                                            ? `<p class="text-lg text-[#F9D423] mt-2">${member.position}</p>`
                                            : ''
                                        }
                                    </div>
                                </div>
                            `,
                              )
                              .join('')}
                        </div>
                    </div>
                `
                    : ''
                }
            </section>
        `;
  }
}

customElements.define('leadership-section', LeadershipSection);
export default LeadershipSection;
