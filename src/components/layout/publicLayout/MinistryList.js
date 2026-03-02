import App from '@/core/App.js';
import { fetchColorSettings } from '@/utils/colorSettings.js';

/**
 * Ministry List Component
 * 
 * Displays a list of ministries/news items with banner images on the left and content on the right
 */
class MinistryList extends App {
    constructor() {
        super();
        this.set('ministries', []);
        this.set('loading', true);
    }

    async connectedCallback() {
        super.connectedCallback();
        await this.loadColorsFromSettings();
        this.loadMinistriesData();
    }

    async loadColorsFromSettings() {
        try {
            // Fetch colors from API
            const colors = await fetchColorSettings();
            
            // Set colors in component state
            Object.entries(colors).forEach(([key, value]) => {
                this.set(key, value);
            });
        } catch (error) {
            console.error('Error loading color settings:', error);
        }
    }

    async loadMinistriesData() {
        try {
            const response = await fetch('/api/news/active');
            if (response.ok) {
                const data = await response.json();
                if (data.success && data.data) {
                    this.set('ministries', data.data);
                } else {
                    this.set('ministries', []);
                }
            } else {
                console.error('Failed to fetch ministries:', response.statusText);
                this.set('ministries', []);
            }
        } catch (error) {
            console.error('Error fetching ministries:', error);
            this.set('ministries', []);
        }
        
        // Set loading to false
        this.set('loading', false);
        
        // Render with the loaded data
        this.render();
    }

    searchMinistries(query) {
        const searchTerm = query.toLowerCase().trim();
        const ministryCards = this.querySelectorAll('.ministry-card');
        let visibleCount = 0;
        
        ministryCards.forEach(card => {
            const ministryTitle = card.getAttribute('data-title') || '';
            const titleLower = ministryTitle.toLowerCase();
            
            if (searchTerm === '') {
                card.style.display = 'block';
                visibleCount++;
            } else {
                // Split title into words and check if any word starts with the search term
                const titleWords = titleLower.split(/\s+/);
                const hasMatch = titleWords.some(word => word.startsWith(searchTerm));
                
                if (hasMatch) {
                    card.style.display = 'block';
                    visibleCount++;
                } else {
                    card.style.display = 'none';
                }
            }
        });
        
        this.showNoResultsMessage(visibleCount === 0, `No ministries found for "${query}"`);
    }

    showNoResultsMessage(show, message) {
        let noResultsDiv = this.querySelector('.no-results-message');
        
        if (show) {
            if (!noResultsDiv) {
                noResultsDiv = document.createElement('div');
                noResultsDiv.className = 'no-results-message text-center py-8 text-gray-500';
                noResultsDiv.innerHTML = `
                    <i class="fas fa-search text-2xl mb-2"></i>
                    <p>${message}</p>
                `;
                this.querySelector('#ministries-list').appendChild(noResultsDiv);
            } else {
                noResultsDiv.innerHTML = `
                    <i class="fas fa-search text-2xl mb-2"></i>
                    <p>${message}</p>
                `;
                noResultsDiv.style.display = 'block';
            }
        } else if (noResultsDiv) {
            noResultsDiv.style.display = 'none';
        }
    }

    clearFilters() {
        // Clear search input
        const searchInput = this.querySelector('#ministry-search');
        if (searchInput) {
            searchInput.value = '';
        }
        
        // Show all ministries
        const ministryCards = this.querySelectorAll('.ministry-card');
        ministryCards.forEach(card => {
            card.style.display = 'block';
        });
        
        // Hide no results message
        this.showNoResultsMessage(false);
    }

    openMinistryPage(slugOrId) {
        // Navigate to the ministry page using SPA router
        const ministryUrl = `/public/ministries/${slugOrId}`;
        if (window.router) {
            window.router.navigate(ministryUrl);
        } else {
            // Fallback to regular navigation if router is not available
            window.location.href = ministryUrl;
        }
    }

    // Helper method to get proper image URL
    getImageUrl(imagePath) {
        if (!imagePath || typeof imagePath !== 'string') return null;
        
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

    // Helper function to format date
    formatDate(dateString) {
        if (!dateString) return 'TBD';
        try {
            // Handle different date formats from API
            const date = new Date(dateString);
            if (isNaN(date.getTime())) {
                return dateString;
            }
            return date.toLocaleDateString();
        } catch (error) {
            return dateString;
        }
    }

    // Helper function to strip HTML tags for preview
    stripHtml(html) {
        if (!html) return '';
        const tmp = document.createElement('div');
        tmp.innerHTML = html;
        return tmp.textContent || tmp.innerText || '';
    }

    // Helper function to truncate text
    truncateText(text, maxLength = 150) {
        if (!text) return '';
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength) + '...';
    }

    render() {
        const loading = this.get('loading');
        const ministries = this.get('ministries') || [];
        
        // Get colors from state
        const primaryColor = this.get('primary_color');
        const secondaryColor = this.get('secondary_color');
        const textColor = this.get('text_color');

        return `
            <!-- Search Bar -->
            <div class="mb-10">
                <div class="max-w-4xl mx-auto">
                    <div class="relative">
                        <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <i class="fas fa-search text-white/70"></i>
                        </div>
                        <input 
                            type="text" 
                            id="ministry-search"
                            placeholder="Search ministries..." 
                            class="block w-full pl-10 pr-10 py-2 bg-transparent border border-gray-300 rounded-xl text-white placeholder-white/70 text-sm"
                            oninput="this.closest('ministry-list').searchMinistries(this.value)"
                        >
                    </div>
                </div>
            </div>
            
                         <!-- Ministries List -->
             <div class="space-y-6" id="ministries-list">
                 ${loading ? `
                     <!-- Loading Skeleton -->
                     <div class="space-y-6">
                         <div class="bg-slate-700 rounded-xl shadow-lg overflow-hidden p-5 animate-pulse">
                             <div class="flex flex-col md:flex-row">
                                 <!-- Image Skeleton -->
                                 <div class="md:w-1/3 h-48 md:h-52 bg-gray-600 rounded-xl flex-shrink-0" style="height: 12rem; min-height: 12rem; max-height: 12rem;"></div>
                                 <!-- Content Skeleton -->
                                 <div class="md:w-2/3 p-6 flex flex-col justify-between">
                                     <div>
                                         <div class="h-8 bg-gray-600 rounded mb-2"></div>
                                         <div class="h-4 bg-gray-600 rounded mb-1"></div>
                                         <div class="h-4 bg-gray-600 rounded mb-1"></div>
                                         <div class="h-4 bg-gray-600 rounded w-3/4"></div>
                                     </div>
                                     <div class="flex items-center justify-between mt-4">
                                         <div class="h-6 bg-gray-600 rounded w-20"></div>
                                         <div class="h-4 bg-gray-600 rounded w-24"></div>
                                     </div>
                                 </div>
                             </div>
                         </div>
                         
                         <div class="bg-slate-700 rounded-xl shadow-lg overflow-hidden p-5 animate-pulse">
                             <div class="flex flex-col md:flex-row">
                                 <!-- Image Skeleton -->
                                 <div class="md:w-1/3 h-48 md:h-52 bg-gray-600 rounded-xl flex-shrink-0" style="height: 12rem; min-height: 12rem; max-height: 12rem;"></div>
                                 <!-- Content Skeleton -->
                                 <div class="md:w-2/3 p-6 flex flex-col justify-between">
                                     <div>
                                         <div class="h-8 bg-gray-600 rounded mb-2"></div>
                                         <div class="h-4 bg-gray-600 rounded mb-1"></div>
                                         <div class="h-4 bg-gray-600 rounded mb-1"></div>
                                         <div class="h-4 bg-gray-600 rounded w-3/4"></div>
                                     </div>
                                     <div class="flex items-center justify-between mt-4">
                                         <div class="h-6 bg-gray-600 rounded w-20"></div>
                                         <div class="h-4 bg-gray-600 rounded w-24"></div>
                                     </div>
                                 </div>
                             </div>
                         </div>
                         
                         <div class="bg-slate-700 rounded-xl shadow-lg overflow-hidden p-5 animate-pulse">
                             <div class="flex flex-col md:flex-row">
                                 <!-- Image Skeleton -->
                                 <div class="md:w-1/3 h-48 md:h-52 bg-gray-600 rounded-xl flex-shrink-0" style="height: 12rem; min-height: 12rem; max-height: 12rem;"></div>
                                 <!-- Content Skeleton -->
                                 <div class="md:w-2/3 p-6 flex flex-col justify-between">
                                     <div>
                                         <div class="h-8 bg-gray-600 rounded mb-2"></div>
                                         <div class="h-4 bg-gray-600 rounded mb-1"></div>
                                         <div class="h-4 bg-gray-600 rounded mb-1"></div>
                                         <div class="h-4 bg-gray-600 rounded w-3/4"></div>
                                     </div>
                                     <div class="flex items-center justify-between mt-4">
                                         <div class="h-6 bg-gray-600 rounded w-20"></div>
                                         <div class="h-4 bg-gray-600 rounded w-24"></div>
                                     </div>
                                 </div>
                             </div>
                         </div>
                     </div>
                 ` : ministries.length > 0 ? ministries.map(ministry => {
                    // Get banner image from ministry
                    let bannerImage = '';
                    if (ministry.banner_image) {
                        try {
                            const bannerImages = JSON.parse(ministry.banner_image);
                            if (bannerImages && bannerImages.length > 0) {
                                bannerImage = bannerImages[0]; // Use the first image
                            }
                        } catch (error) {
                            // If parsing fails, treat as single path
                            bannerImage = ministry.banner_image;
                        }
                    }

                    // Strip HTML from content for preview
                    const contentPreview = this.stripHtml(ministry.content || '');
                    const truncatedContent = this.truncateText(contentPreview, 200);

                    return `
                        <div class="bg-slate-700 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer ministry-card overflow-hidden p-5" 
                             data-title="${ministry.title || 'Untitled Ministry'}"
                             onclick="this.closest('ministry-list').openMinistryPage('${ministry.slug || ministry.id}')">
                            
                            <div class="flex flex-col md:flex-row">
                                <!-- Image Section -->
                                <div class="md:w-1/3 h-48 md:h-52 relative rounded-xl overflow-hidden flex-shrink-0" style="height: 12rem; min-height: 12rem; max-height: 12rem;">
                                    ${bannerImage ? `
                                        <img src="${this.getImageUrl(bannerImage)}" 
                                             alt="${ministry.title || 'Ministry Image'}" 
                                             class="w-full h-full object-cover rounded-xl"
                                             style="width: 100%; height: 100%; object-fit: cover;"
                                             onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
                                    ` : ''}
                                    <!-- Fallback placeholder -->
                                    <div class="w-full h-full bg-gradient-to-br from-gray-400 to-gray-600 flex items-center justify-center rounded-xl ${bannerImage ? 'hidden' : ''}" style="width: 100%; height: 100%;">
                                        <div class="text-center text-white">
                                            <i class="fas fa-church text-4xl mb-2 opacity-50"></i>
                                            <p class="text-sm opacity-75">No Image</p>
                                        </div>
                                    </div>                                    

                                </div>
                                
                                <!-- Content Section -->
                                <div class="md:w-2/3 p-6 flex flex-col justify-between">
                                    <div class="text-white ">
                                        <h3 class="text-2xl font-bold mb-1 line-clamp-2" title="${ministry.title || 'Untitled Ministry'}">
                                            ${ministry.title || 'Untitled Ministry'}
                                        </h3>
                                        <p class="text-sm leading-relaxed mb-4 line-clamp-3">
                                            ${truncatedContent || 'No description available'}
                                        </p>
                                    </div>
                                    
                                    <!-- Footer -->
                                    <div class="flex items-center justify-between">
                                        <div class="flex items-center gap-2">
                                            <span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-white text-black">
                                                <i class="fas fa-church mr-1"></i>
                                                Ministry
                                            </span>
                                        </div>
                                        <div class="flex items-center gap-2 text-gray-500 text-sm">
                                            <i class="fas fa-arrow-right"></i>
                                            <span>Read More</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    `;
                }).join('') : `
                    <div class="text-center py-8 text-gray-500">
                        <i class="fas fa-church text-2xl mb-2"></i>
                        <p>No ministries available</p>
                    </div>
                `}
            </div>
        `;
    }
}

customElements.define('ministry-list', MinistryList);
export default MinistryList; 