import App from '@/core/App.js';
import { fetchColorSettings } from '@/utils/colorSettings.js';

/**
 * Event List Component
 * 
 * Displays a list of events with filtering by status
 */
class EventList extends App {
    constructor() {
        super();
        this.set('events', []);
        this.set('loading', true);
    }

    async connectedCallback() {
        super.connectedCallback();
        await this.loadColorsFromSettings();
        this.loadEventsData();
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

    async loadEventsData() {
        try {
            const response = await fetch('/api/events/active');
            if (response.ok) {
                const data = await response.json();
                if (data.success && data.data) {
                    this.set('events', data.data);
                } else {
                    this.set('events', []);
                }
            } else {
                console.error('Failed to fetch events:', response.statusText);
                this.set('events', []);
            }
        } catch (error) {
            console.error('Error fetching events:', error);
            this.set('events', []);
        }
        
        // Set loading to false
        this.set('loading', false);
        
        // Render with the loaded data
        this.render();
        

    }



    searchEvents(query) {
        const searchTerm = query.toLowerCase().trim();
        const eventCards = this.querySelectorAll('.event-card');
        let visibleCount = 0;
        
        eventCards.forEach(card => {
            const eventTitle = card.getAttribute('data-title') || '';
            const titleLower = eventTitle.toLowerCase();
            
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
        
        this.showNoResultsMessage(visibleCount === 0, `No events found for "${query}"`);
    }

    filterByStatus(status) {
        const eventCards = this.querySelectorAll('.event-card');
        let visibleCount = 0;
        
        eventCards.forEach(card => {
            const eventStatus = card.getAttribute('data-status') || '';
            const normalizedStatus = this.normalizeStatus(eventStatus);
            
            if (status === '' || normalizedStatus === status) {
                card.style.display = 'block';
                visibleCount++;
            } else {
                card.style.display = 'none';
            }
        });
        
        const statusText = status ? status.charAt(0).toUpperCase() + status.slice(1) : 'All';
        this.showNoResultsMessage(visibleCount === 0, `No ${status} events available`);
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
                this.querySelector('#events-grid').appendChild(noResultsDiv);
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
        const searchInput = this.querySelector('#event-search');
        if (searchInput) {
            searchInput.value = '';
        }
        
        // Reset status filter
        const statusFilter = this.querySelector('#status-filter');
        if (statusFilter) {
            statusFilter.value = '';
        }
        
        // Show all events
        const eventCards = this.querySelectorAll('.event-card');
        eventCards.forEach(card => {
            card.style.display = 'block';
        });
        
        // Hide no results message
        this.showNoResultsMessage(false);
    }

    openEventPage(slugOrId) {
        // Navigate to the event page using SPA router
        const eventUrl = `/public/service-events/${slugOrId}`;
        if (window.router) {
            window.router.navigate(eventUrl);
        } else {
            // Fallback to regular navigation if router is not available
            window.location.href = eventUrl;
        }
    }

    // Helper function to get status badge styling
    getStatusBadge(status) {
        switch (status?.toLowerCase()) {
            case 'upcoming':
                return {
                    class: 'bg-blue-100 text-blue-800',
                    icon: 'fas fa-clock',
                    text: 'Upcoming'
                };
            case 'ongoing':
                return {
                    class: 'bg-green-100 text-green-800',
                    icon: 'fas fa-play',
                    text: 'Ongoing'
                };
            case 'completed':
                return {
                    class: 'bg-gray-100 text-gray-800',
                    icon: 'fas fa-check',
                    text: 'Completed'
                };
            case 'cancelled':
                return {
                    class: 'bg-red-100 text-red-800',
                    icon: 'fas fa-times',
                    text: 'Cancelled'
                };
            default:
                return {
                    class: 'bg-gray-100 text-gray-800',
                    icon: 'fas fa-circle',
                    text: status || 'Unknown'
                };
        }
    }

    // Helper function to normalize status for filtering
    normalizeStatus(status) {
        if (!status) return 'unknown';
        const normalized = status.toLowerCase().trim();
        
        // Map common variations to standard statuses
        switch (normalized) {
            case 'upcoming':
            case 'scheduled':
            case 'planned':
                return 'upcoming';
            case 'ongoing':
            case 'in progress':
            case 'active':
                return 'ongoing';
            case 'completed':
            case 'finished':
            case 'done':
                return 'completed';
            case 'cancelled':
            case 'canceled':
            case 'cancelled':
                return 'cancelled';
            default:
                return normalized;
        }
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

    // Helper function to format time
    formatTime(timeString) {
        if (!timeString) return 'TBD';
        try {
            // If it's a full datetime string, extract time
            if (timeString.includes(' ')) {
                const timePart = timeString.split(' ')[1];
                return timePart.substring(0, 5); // Return HH:MM format
            }
            return timeString;
        } catch (error) {
            return timeString;
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

    render() {
        const loading = this.get('loading');
        const events = this.get('events') || [];
        
        // Get colors from state
        const primaryColor = this.get('primary_color');
        const secondaryColor = this.get('secondary_color');

        return `
            <!-- Search and Filter Bar -->
            <div class="mb-10">
                <div class="flex flex-row gap-4 max-w-4xl mx-auto">
                    <!-- Search Bar -->
                    <div class="relative flex-1">
                        <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <i class="fas fa-search text-white/70"></i>
                        </div>
                        <input 
                            type="text" 
                            id="event-search"
                            placeholder="Search events..." 
                            class="block w-full pl-10 pr-10 py-2 bg-transparent border border-gray-300 rounded-xl text-white placeholder-white/70 text-sm"
                            oninput="this.closest('event-list').searchEvents(this.value)"
                        >
                    </div>
                    
                    <!-- Status Filter -->
                    <div class="relative">
                        <select 
                            id="status-filter"
                            class="block w-full md:w-48 pl-4 pr-10 py-2 bg-transparent border border-gray-300 rounded-xl text-white text-sm appearance-none cursor-pointer"
                            onchange="this.closest('event-list').filterByStatus(this.value)"
                        >
                            <option value="" class="bg-gray-800 text-white">All Status</option>
                            <option value="upcoming" class="bg-gray-800 text-white">Upcoming</option>
                            <option value="ongoing" class="bg-gray-800 text-white">Ongoing</option>
                            <option value="completed" class="bg-gray-800 text-white">Completed</option>
                            <option value="cancelled" class="bg-gray-800 text-white">Cancelled</option>
                        </select>
                        <div class="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                            <i class="fas fa-chevron-down text-white/70"></i>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Events Grid -->
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" id="events-grid">
                ${loading ? `
                    <div class="rounded-lg p-4 shadow-sm border-l-4 border-gray-300 h-64 relative overflow-hidden bg-gray-200 animate-pulse">
                        <div class="absolute inset-0 bg-gradient-to-t from-gray-300 via-gray-200 to-transparent"></div>
                        <div class="absolute top-3 right-3 w-20 h-6 bg-gray-300 rounded-full"></div>
                        <div class="absolute top-3 left-3 w-16 h-6 bg-gray-300 rounded-full"></div>
                        <div class="absolute bottom-4 left-4 right-4">
                            <div class="h-6 bg-gray-300 rounded mb-2"></div>
                            <div class="h-4 bg-gray-300 rounded w-3/4"></div>
                        </div>
                    </div>
                    <div class="rounded-lg p-4 shadow-sm border-l-4 border-gray-300 h-64 relative overflow-hidden bg-gray-200 animate-pulse">
                        <div class="absolute inset-0 bg-gradient-to-t from-gray-300 via-gray-200 to-transparent"></div>
                        <div class="absolute top-3 right-3 w-20 h-6 bg-gray-300 rounded-full"></div>
                        <div class="absolute top-3 left-3 w-16 h-6 bg-gray-300 rounded-full"></div>
                        <div class="absolute bottom-4 left-4 right-4">
                            <div class="h-6 bg-gray-300 rounded mb-2"></div>
                            <div class="h-4 bg-gray-300 rounded w-3/4"></div>
                        </div>
                    </div>
                    <div class="rounded-lg p-4 shadow-sm border-l-4 border-gray-300 h-64 relative overflow-hidden bg-gray-200 animate-pulse">
                        <div class="absolute inset-0 bg-gradient-to-t from-gray-300 via-gray-200 to-transparent"></div>
                        <div class="absolute top-3 right-3 w-20 h-6 bg-gray-300 rounded-full"></div>
                        <div class="absolute top-3 left-3 w-16 h-6 bg-gray-300 rounded-full"></div>
                        <div class="absolute bottom-4 left-4 right-4">
                            <div class="h-6 bg-gray-300 rounded mb-2"></div>
                            <div class="h-4 bg-gray-300 rounded w-3/4"></div>
                        </div>
                    </div>
                ` : events.length > 0 ? events.map(event => {
                    const statusBadge = this.getStatusBadge(event.status);
                    
                    // Get banner image from event
                    let bannerImage = '';
                    if (event.banner_image) {
                        try {
                            const bannerImages = JSON.parse(event.banner_image);
                            if (bannerImages && bannerImages.length > 0) {
                                bannerImage = bannerImages[0]; // Use the first image
                            }
                        } catch (error) {
                            // If parsing fails, treat as single path
                            bannerImage = event.banner_image;
                        }
                    }

                    // Create background style with banner image
                    const backgroundStyle = bannerImage 
                        ? `background-image: url('${this.getImageUrl(bannerImage)}'); background-size: cover; background-position: center; background-repeat: no-repeat;`
                        : 'background-color: white;';

                    return `
                        <div class="rounded-lg p-4 shadow-sm hover:shadow-md transition-all duration-300 border-l-4 border-[${primaryColor}] cursor-pointer h-64 relative overflow-hidden event-card" 
                             style="${backgroundStyle}"
                             data-title="${event.title || 'Untitled Event'}"
                             data-status="${event.status || ''}"
                             onclick="this.closest('event-list').openEventPage('${event.slug || event.id}')">
                            <!-- Dark overlay for better text readability -->
                            <div class="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
                            
                            <!-- Status badge at top right -->
                            <div class="absolute top-3 right-3 z-20">
                                <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${statusBadge.class}">
                                    <i class="${statusBadge.icon} mr-1 text-xs"></i>
                                    ${statusBadge.text}
                                </span>
                            </div>
                            
                            <!-- Category tag at top left -->
                            <div class="absolute top-3 left-3 z-20">
                                <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-white/20 text-white backdrop-blur-sm">
                                    <i class="fas fa-tag mr-1"></i>
                                    ${event.category || 'General'}
                                </span>
                            </div>
                            
                            <!-- Content at bottom left -->
                            <div class="absolute bottom-4 left-4 right-4 z-20 text-white">
                                <h4 class="font-bold text-lg line-clamp-2 capitalize mb-2" title="${event.title || 'Untitled Event'}">${event.title || 'Untitled Event'}</h4>
                                <div class="flex items-center gap-4 text-sm text-white/90">
                                    <span class="flex items-center gap-1">
                                        <i class="fas fa-calendar text-white"></i>
                                        ${this.formatDate(event.start_date || event.event_date)}
                                    </span>
                                    <span class="flex items-center gap-1">
                                        <i class="fas fa-clock text-white"></i>
                                        ${this.formatTime(event.start_date || event.event_time)}
                                    </span>
                                </div>
                            </div>
                        </div>
                    `;
                }).join('') : `
                    <div class="col-span-full text-center py-8 text-gray-500">
                        <i class="fas fa-calendar-times text-2xl mb-2"></i>
                        <p>No events available</p>
                    </div>
                `}
            </div>
        `;
    }
}

customElements.define('event-list', EventList);
export default EventList; 