import App from '@/core/App.js';
import { fetchColorSettings } from '@/utils/colorSettings.js';

/**
 * Sermon List Component
 * 
 * Displays a list of sermons with filtering by speaker
 */
class SermonList extends App {
    constructor() {
        super();
        this.set('sermons', []);
        this.set('loading', true);
    }

    async connectedCallback() {
        super.connectedCallback();
        await this.loadColorsFromSettings();
        this.loadSermonsData();
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

    async loadSermonsData() {
        try {
            const response = await fetch('/api/sermons/active');
            if (response.ok) {
                const data = await response.json();
                if (data.success && data.data) {
                    this.set('sermons', data.data);
                } else {
                    this.set('sermons', []);
                }
            } else {
                console.error('Failed to fetch sermons:', response.statusText);
                this.set('sermons', []);
            }
        } catch (error) {
            console.error('Error fetching sermons:', error);
            this.set('sermons', []);
        }
        
        // Set loading to false
        this.set('loading', false);
        
        // Render with the loaded data
        this.render();
    }

    searchSermons(query) {
        const searchTerm = query.toLowerCase().trim();
        const sermonCards = this.querySelectorAll('.sermon-card');
        let visibleCount = 0;
        
        sermonCards.forEach(card => {
            const sermonTitle = card.getAttribute('data-title') || '';
            const sermonSpeaker = card.getAttribute('data-speaker') || '';
            const titleLower = sermonTitle.toLowerCase();
            const speakerLower = sermonSpeaker.toLowerCase();
            
            if (searchTerm === '') {
                card.style.display = 'block';
                visibleCount++;
            } else {
                // Split title and speaker into words and check if any word starts with the search term
                const titleWords = titleLower.split(/\s+/);
                const speakerWords = speakerLower.split(/\s+/);
                const hasTitleMatch = titleWords.some(word => word.startsWith(searchTerm));
                const hasSpeakerMatch = speakerWords.some(word => word.startsWith(searchTerm));
                
                if (hasTitleMatch || hasSpeakerMatch) {
                    card.style.display = 'block';
                    visibleCount++;
                } else {
                    card.style.display = 'none';
                }
            }
        });
        
        this.showNoResultsMessage(visibleCount === 0, `No sermons found for "${query}"`);
    }

    filterBySpeaker(speaker) {
        const sermonCards = this.querySelectorAll('.sermon-card');
        let visibleCount = 0;
        
        sermonCards.forEach(card => {
            const sermonSpeaker = card.getAttribute('data-speaker') || '';
            
            if (speaker === '' || sermonSpeaker.toLowerCase() === speaker.toLowerCase()) {
                card.style.display = 'block';
                visibleCount++;
            } else {
                card.style.display = 'none';
            }
        });
        
        const speakerText = speaker ? speaker : 'All Speakers';
        this.showNoResultsMessage(visibleCount === 0, `No sermons by ${speakerText}`);
    }

    showNoResultsMessage(show, message) {
        let noResultsDiv = this.querySelector('.no-results-message');
        
        if (show) {
            if (!noResultsDiv) {
                noResultsDiv = document.createElement('div');
                noResultsDiv.className = 'no-results-message col-span-full text-center py-8 text-gray-500';
                noResultsDiv.innerHTML = `
                    <i class="fas fa-search text-2xl mb-2"></i>
                    <p>${message}</p>
                `;
                this.querySelector('#sermons-grid').appendChild(noResultsDiv);
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
        const searchInput = this.querySelector('#sermon-search');
        if (searchInput) {
            searchInput.value = '';
        }
        
        // Reset speaker filter
        const speakerFilter = this.querySelector('#speaker-filter');
        if (speakerFilter) {
            speakerFilter.value = '';
        }
        
        // Show all sermons
        const sermonCards = this.querySelectorAll('.sermon-card');
        sermonCards.forEach(card => {
            card.style.display = 'block';
        });
        
        // Hide no results message
        this.showNoResultsMessage(false);
    }

    openSermonPage(slugOrId) {
        // Navigate to the sermon page using SPA router
        const sermonUrl = `/public/sermons/${slugOrId}`;
        if (window.router) {
            window.router.navigate(sermonUrl);
        } else {
            // Fallback to regular navigation if router is not available
            window.location.href = sermonUrl;
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

    render() {
        const loading = this.get('loading');
        const sermons = this.get('sermons') || [];
        
        // Get colors from state
        const primaryColor = this.get('primary_color');
        const secondaryColor = this.get('secondary_color');

        // Get unique speakers for filter
        const speakers = [...new Set(sermons.map(sermon => sermon.speaker).filter(Boolean))];

        return `
            <!-- Search and Filter Bar -->
            <div class="mb-10">
                <div class="flex flex-col md:flex-row gap-4 max-w-4xl mx-auto">
                    <!-- Search Bar -->
                    <div class="relative flex-1">
                        <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <i class="fas fa-search text-white/70"></i>
                        </div>
                        <input 
                            type="text" 
                            id="sermon-search"
                            placeholder="Search sermons..." 
                            class="block w-full pl-10 pr-10 py-2 bg-transparent border border-gray-300 rounded-xl text-white placeholder-white/70 text-sm"
                            oninput="this.closest('sermon-list').searchSermons(this.value)"
                        >
                    </div>
                    
                    <!-- Speaker Filter -->
                    <div class="relative">
                        <select 
                            id="speaker-filter"
                            class="block w-full md:w-48 pl-4 pr-10 py-2 bg-transparent border border-gray-300 rounded-xl text-white text-sm appearance-none cursor-pointer"
                            onchange="this.closest('sermon-list').filterBySpeaker(this.value)"
                        >
                            <option value="" class="bg-gray-800 text-white">All Speakers</option>
                            ${speakers.map(speaker => `
                                <option value="${speaker}" class="bg-gray-800 text-white">${speaker}</option>
                            `).join('')}
                        </select>
                        <div class="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                            <i class="fas fa-chevron-down text-white/70"></i>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Sermons Grid -->
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" id="sermons-grid">
                ${loading ? `
                    <div class="rounded-lg overflow-hidden shadow-lg bg-white animate-pulse">
                        <div class="relative h-48 bg-gray-200"></div>
                        <div class="p-4">
                            <div class="h-6 bg-gray-200 rounded mb-2"></div>
                            <div class="h-4 bg-gray-200 rounded mb-3 w-3/4"></div>
                            <div class="flex items-center justify-between">
                                <div class="flex items-center gap-2">
                                    <div class="w-4 h-4 bg-gray-200 rounded"></div>
                                    <div class="h-4 bg-gray-200 rounded w-20"></div>
                                </div>
                                <div class="flex items-center gap-2">
                                    <div class="w-16 h-6 bg-gray-200 rounded-full"></div>
                                    <div class="w-16 h-6 bg-gray-200 rounded-full"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="rounded-lg overflow-hidden shadow-lg bg-white animate-pulse">
                        <div class="relative h-48 bg-gray-200"></div>
                        <div class="p-4">
                            <div class="h-6 bg-gray-200 rounded mb-2"></div>
                            <div class="h-4 bg-gray-200 rounded mb-3 w-3/4"></div>
                            <div class="flex items-center justify-between">
                                <div class="flex items-center gap-2">
                                    <div class="w-4 h-4 bg-gray-200 rounded"></div>
                                    <div class="h-4 bg-gray-200 rounded w-20"></div>
                                </div>
                                <div class="flex items-center gap-2">
                                    <div class="w-16 h-6 bg-gray-200 rounded-full"></div>
                                    <div class="w-16 h-6 bg-gray-200 rounded-full"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="rounded-lg overflow-hidden shadow-lg bg-white animate-pulse">
                        <div class="relative h-48 bg-gray-200"></div>
                        <div class="p-4">
                            <div class="h-6 bg-gray-200 rounded mb-2"></div>
                            <div class="h-4 bg-gray-200 rounded mb-3 w-3/4"></div>
                            <div class="flex items-center justify-between">
                                <div class="flex items-center gap-2">
                                    <div class="w-4 h-4 bg-gray-200 rounded"></div>
                                    <div class="h-4 bg-gray-200 rounded w-20"></div>
                                </div>
                                <div class="flex items-center gap-2">
                                    <div class="w-16 h-6 bg-gray-200 rounded-full"></div>
                                    <div class="w-16 h-6 bg-gray-200 rounded-full"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                ` : sermons.length > 0 ? sermons.map(sermon => {
                    // Get sermon image - handle different data formats
                    let sermonImage = '';
                    
                    if (sermon.images) {
                        // If images is already an array
                        if (Array.isArray(sermon.images)) {
                            if (sermon.images.length > 0) {
                                sermonImage = sermon.images[0];
                            }
                        }
                        // If images is a JSON string
                        else if (typeof sermon.images === 'string') {
                            try {
                                const images = JSON.parse(sermon.images);
                                if (Array.isArray(images) && images.length > 0) {
                                    sermonImage = images[0];
                                } else if (typeof images === 'string') {
                                    sermonImage = images;
                                }
                            } catch (error) {
                                // If parsing fails, treat as single path
                                sermonImage = sermon.images;
                            }
                        }
                    }

                    // Create background style with sermon image
                    const imageUrl = this.getImageUrl(sermonImage);
                    const backgroundStyle = imageUrl 
                        ? `background-image: url('${imageUrl}'); background-size: cover; background-position: center; background-repeat: no-repeat;`
                        : 'background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);';

                    return `
                        <div class="rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer sermon-card" 
                             data-title="${sermon.title || 'Untitled Sermon'}"
                             data-speaker="${sermon.speaker || ''}"
                             onclick="this.closest('sermon-list').openSermonPage('${sermon.slug || sermon.id}')">
                            
                            <!-- Image Container -->
                            <div class="relative h-48" style="${backgroundStyle}">
                                <!-- Play Icon Overlay -->
                                <div class="absolute inset-0 flex items-center justify-center bg-black/30 hover:bg-black/50 transition-all duration-300">
                                    <div class="w-16 h-16 bg-white/90 rounded-full flex items-center justify-center hover:bg-white transition-all duration-300">
                                        <i class="fas fa-play text-[${primaryColor}] text-xl ml-1"></i>
                                    </div>
                                </div>
                                
                                <!-- Date Badge -->
                                <div class="absolute top-3 left-3">
                                    <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-white/20 text-white backdrop-blur-sm">
                                        <i class="fas fa-calendar mr-1"></i>
                                        ${this.formatDate(sermon.date_preached)}
                                    </span>
                                </div>
                            </div>
                            
                            <!-- Content Below Image -->
                            <div class="p-4 bg-white">
                                <h4 class="font-bold text-lg text-gray-800 line-clamp-2 mb-2" title="${sermon.title || 'Untitled Sermon'}">
                                    ${sermon.title || 'Untitled Sermon'}
                                </h4>
                                <p class="text-sm text-gray-600 mb-3 line-clamp-2">
                                    ${sermon.description || 'No description available'}
                                </p>
                                <div class="flex items-center justify-between">
                                    <div class="flex items-center gap-2">
                                        <i class="fas fa-user text-[${primaryColor}] text-sm"></i>
                                        <span class="text-sm font-medium text-gray-700">${sermon.speaker || 'Unknown Speaker'}</span>
                                    </div>
                                    <div class="flex items-center gap-2">
                                        ${sermon.video_links ? `
                                            <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                <i class="fas fa-video mr-1"></i>
                                                Video
                                            </span>
                                        ` : ''}
                                        ${sermon.audio_links ? `
                                            <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                <i class="fas fa-headphones mr-1"></i>
                                                Audio
                                            </span>
                                        ` : ''}
                                    </div>
                                </div>
                            </div>
                        </div>
                    `;
                }).join('') : `
                    <div class="col-span-full text-center py-8 text-gray-500">
                        <i class="fas fa-microphone-slash text-2xl mb-2"></i>
                        <p>No sermons available</p>
                    </div>
                `}
            </div>
        `;
    }
}

customElements.define('sermon-list', SermonList);
export default SermonList; 