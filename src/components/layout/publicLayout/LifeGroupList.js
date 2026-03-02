import App from '@/core/App.js';
import { fetchColorSettings } from '@/utils/colorSettings.js';

/**
 * Life Group List Component
 *
 * Displays a list of life groups with banner images on the left and content on the right
 */
class LifeGroupList extends App {
    constructor() {
        super();
        this.set('lifeGroups', []);
        this.set('loading', true);
    }

    async connectedCallback() {
        super.connectedCallback();
        await this.loadColorsFromSettings();
        this.loadLifeGroupsData();
    }

    async loadColorsFromSettings() {
        try {
            // Fetch colors from API
            const colors = await fetchColorSettings();

            // Set colors in component state
            Object.entries(colors).forEach(([key, value]) => {
                this.set(key, value);
            });

            // Also load textbox_bg_color setting
            try {
                const response = await fetch('/api/settings/key/textbox_bg_color');
                if (response.ok) {
                    const data = await response.json();
                    if (data.success) {
                        this.set('textboxBgColor', data.data.setting_value);
                    }
                }
            } catch (error) {
                console.error('Error loading textbox_bg_color setting:', error);
            }
        } catch (error) {
            console.error('Error loading color settings:', error);
        }
    }

    async loadLifeGroupsData() {
        try {
            const response = await fetch('/api/life-groups/active');
            if (response.ok) {
                const data = await response.json();
                if (data.success && data.data) {
                    this.set('lifeGroups', data.data);
                } else {
                    this.set('lifeGroups', []);
                }
            } else {
                console.error('Failed to fetch life groups:', response.statusText);
                this.set('lifeGroups', []);
            }
        } catch (error) {
            console.error('Error fetching life groups:', error);
            this.set('lifeGroups', []);
        }
        
        // Set loading to false
        this.set('loading', false);
        
        // Render with the loaded data
        this.render();
    }

    searchLifeGroups(query) {
        const searchTerm = query.toLowerCase().trim();
        const lifeGroupCards = this.querySelectorAll('.life-group-card');
        let visibleCount = 0;
        
        lifeGroupCards.forEach(card => {
            const lifeGroupTitle = card.getAttribute('data-title') || '';
            const titleLower = lifeGroupTitle.toLowerCase();
            
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
        
        this.showNoResultsMessage(visibleCount === 0, `No life groups found for "${query}"`);
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
                this.querySelector('#life-groups-list').appendChild(noResultsDiv);
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
        const searchInput = this.querySelector('#life-group-search');
        if (searchInput) {
            searchInput.value = '';
        }
        
        // Show all life groups
        const lifeGroupCards = this.querySelectorAll('.life-group-card');
        lifeGroupCards.forEach(card => {
            card.style.display = 'block';
        });
        
        // Hide no results message
        this.showNoResultsMessage(false);
    }

    openLifeGroupPage(slugOrId) {
        // Navigate to the life group page using SPA router
        const lifeGroupUrl = `/public/life-groups/${slugOrId}`;
        if (window.router) {
            window.router.navigate(lifeGroupUrl);
        } else {
            // Fallback to regular navigation if router is not available
            window.location.href = lifeGroupUrl;
        }
    }

    openLifeGroupDialog(lifeGroup) {
        // Create dialog element
        const dialog = document.createElement('div');
        dialog.className = 'fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4';
        dialog.innerHTML = `
            <div class="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
                <!-- Banner Section -->
                <div class="relative h-64 bg-gradient-to-br from-gray-400 to-gray-600 overflow-hidden">
                    ${lifeGroup.banner ? `
                        <img src="${this.getImageUrl(lifeGroup.banner)}" 
                            alt="${lifeGroup.title || 'Life Group Banner'}" 
                            class="w-full h-full object-cover"
                            onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
                    ` : ''}
                    
                    <!-- Fallback placeholder -->
                    <div class="w-full h-full bg-gradient-to-br from-gray-400 to-gray-600 flex items-center justify-center ${lifeGroup.banner ? 'hidden' : ''}">
                        <div class="text-center text-white">
                            <i class="fas fa-users text-6xl mb-4 opacity-50"></i>
                            <p class="text-lg opacity-75">No Banner Image</p>
                        </div>
                    </div>

                    <!-- Close Button -->
                    <button onclick="this.closest('.fixed').remove()" 
                            class="absolute top-4 right-4 size-10 flex items-center justify-center bg-white/20 backdrop-blur-sm border border-white/30 rounded-lg hover:bg-white/30 transition-colors">
                        <i class="fas fa-times text-white"></i>
                    </button>
                </div>

                <!-- Content Section -->
                <div class="p-6 max-h-[calc(90vh-16rem)] overflow-y-auto" style="background-color: ${this.get('textboxBgColor')}AA;">
                    <h2 class="text-3xl font-bold text-gray-800 mb-4">${lifeGroup.title || 'Untitled Life Group'}</h2>
                    
                    <div class="prose max-w-none text-gray-600 leading-relaxed">
                        ${lifeGroup.description || '<p>No description available</p>'}
                    </div>

                    <!-- Action Buttons -->
                    <div class="mt-8 pt-6 border-t border-gray-200 flex justify-end gap-4">
                        <button onclick="this.closest('.fixed').remove()" 
                                class="inline-flex items-center px-6 py-3 rounded-xl text-sm font-medium bg-gray-200 text-gray-700 hover:bg-gray-300 transition-colors">
                            <i class="fas fa-times mr-2"></i>
                            Close
                        </button>
                        ${lifeGroup.link ? `
                            <a href="${lifeGroup.link}" target="_blank" 
                               class="inline-flex items-center px-6 py-3 rounded-xl text-sm font-medium bg-[${this.get('accent_color')}] text-white hover:opacity-90 transition-opacity">
                                <i class="fas fa-external-link-alt mr-2"></i>
                                Join Life Group
                            </a>
                        ` : ''}
                    </div>
                </div>
            </div>
        `;

        // Add to body and show
        document.body.appendChild(dialog);
        
        // Add click outside to close
        dialog.addEventListener('click', (e) => {
            if (e.target === dialog) {
                dialog.remove();
            }
        });
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
        const lifeGroups = this.get('lifeGroups') || [];
                
        // Get colors from state
        const primaryColor = this.get('primary_color');
        const secondaryColor = this.get('secondary_color');
        const textColor = this.get('text_color');
        const accentColor = this.get('accent_color');
        const textboxBgColor = this.get('textboxBgColor');

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
                            id="life-group-search"
                            placeholder="Search life groups..." 
                            class="block w-full pl-10 pr-10 py-2 bg-transparent border border-gray-300 rounded-xl text-white placeholder-white/70 text-sm"
                            oninput="this.closest('life-group-list').searchLifeGroups(this.value)"
                        >
                    </div>
                </div>
            </div>
            
            <!-- Life Groups Grid -->
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" id="life-groups-list">
                ${loading ? `
                    <div class="bg-slate-700 rounded-xl shadow-lg overflow-hidden p-5 animate-pulse flex flex-col">
                        <div class="h-48 bg-gray-500 rounded-lg mb-4"></div>
                        <div class="flex-1 flex flex-col justify-between">
                            <div>
                                <div class="h-6 bg-gray-400 rounded w-3/4 mb-2"></div>
                                <div class="h-4 bg-gray-600 rounded w-full mb-2"></div>
                                <div class="h-4 bg-gray-600 rounded w-2/3 mb-4"></div>
                            </div>
                            <div class="mt-4 pt-4 border-t border-gray-600">
                                <div class="h-10 bg-gray-700 rounded-xl w-1/2 mx-auto"></div>
                            </div>
                        </div>
                    </div>
                    <div class="bg-slate-700 rounded-xl shadow-lg overflow-hidden p-5 animate-pulse flex flex-col">
                        <div class="h-48 bg-gray-500 rounded-lg mb-4"></div>
                        <div class="flex-1 flex flex-col justify-between">
                            <div>
                                <div class="h-6 bg-gray-400 rounded w-3/4 mb-2"></div>
                                <div class="h-4 bg-gray-600 rounded w-full mb-2"></div>
                                <div class="h-4 bg-gray-600 rounded w-2/3 mb-4"></div>
                            </div>
                            <div class="mt-4 pt-4 border-t border-gray-600">
                                <div class="h-10 bg-gray-700 rounded-xl w-1/2 mx-auto"></div>
                            </div>
                        </div>
                    </div>
                    <div class="bg-slate-700 rounded-xl shadow-lg overflow-hidden p-5 animate-pulse flex flex-col">
                        <div class="h-48 bg-gray-500 rounded-lg mb-4"></div>
                        <div class="flex-1 flex flex-col justify-between">
                            <div>
                                <div class="h-6 bg-gray-400 rounded w-3/4 mb-2"></div>
                                <div class="h-4 bg-gray-600 rounded w-full mb-2"></div>
                                <div class="h-4 bg-gray-600 rounded w-2/3 mb-4"></div>
                            </div>
                            <div class="mt-4 pt-4 border-t border-gray-600">
                                <div class="h-10 bg-gray-700 rounded-xl w-1/2 mx-auto"></div>
                            </div>
                        </div>
                    </div>
                ` : lifeGroups.length > 0 ? lifeGroups.map(lifeGroup => {
                    // Get banner image from life group
                    const bannerImage = lifeGroup.banner || '';

                    // Strip HTML from content for preview
                    const contentPreview = this.stripHtml(lifeGroup.description || '');
                    const truncatedContent = this.truncateText(contentPreview, 120);

                    return `
                        <div class="bg-slate-700 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 life-group-card overflow-hidden p-5 cursor-pointer" 
                             data-title="${lifeGroup.title || 'Untitled Life Group'}"
                             onclick="this.closest('life-group-list').openLifeGroupDialog(${JSON.stringify(lifeGroup).replace(/"/g, '&quot;')})">
                            
                            <!-- Image Section -->
                            <div class="h-48 relative overflow-hidden">
                                ${bannerImage ? `
                                    <img src="${this.getImageUrl(bannerImage)}" 
                                         alt="${lifeGroup.title || 'Life Group Image'}" 
                                         class="w-full h-full object-cover"
                                         onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
                                ` : ''}
                                <!-- Fallback placeholder -->
                                <div class="w-full h-full bg-gradient-to-br from-gray-400 to-gray-600 flex items-center justify-center ${bannerImage ? 'hidden' : ''}">
                                    <div class="text-center text-white">
                                        <i class="fas fa-users text-4xl mb-2 opacity-50"></i>
                                        <p class="text-sm opacity-75">No Image</p>
                                    </div>
                                </div>
                            </div>
                            
                            <!-- Content Section -->
                            <div class="py-6 flex flex-col h-48">
                                <div class="flex-1">
                                    <h3 class="text-xl font-bold mb-2 text-white line-clamp-2 italic" title="${lifeGroup.title || 'Untitled Life Group'}">
                                        ${lifeGroup.title || 'Untitled Life Group'}
                                    </h3>
                                    <p class="text-sm leading-relaxed text-gray-300 line-clamp-3">
                                        ${truncatedContent || 'No description available'}
                                        ${truncatedContent && truncatedContent.length > 120 ? '<span class="text-blue-300 font-medium">... Read more</span>' : ''}
                                    </p>
                                </div>
                                
                                <!-- Footer -->
                                <div class="mt-4 pt-4 border-t border-gray-600">
                                    <div class="flex items-center justify-center">
                                        ${lifeGroup.link ? `
                                            <a href="${lifeGroup.link}" target="_blank" class="inline-flex items-center px-4 py-2 rounded-xl text-sm font-medium bg-[${accentColor}] transition-colors" onclick="event.stopPropagation();">
                                                <i class="fas fa-external-link-alt mr-2"></i>
                                                Join Life Group
                                            </a>
                                        ` : `
                                            <span class="text-gray-400 text-sm">No link available</span>
                                        `}
                                    </div>
                                </div>
                            </div>
                        </div>
                    `;
                }).join('') : `
                    <div class="col-span-full text-center py-8 text-gray-500">
                        <i class="fas fa-users text-2xl mb-2"></i>
                        <p>No life groups available</p>
                    </div>
                `}
            </div>
        `;
    }
}

customElements.define('life-group-list', LifeGroupList);
export default LifeGroupList;