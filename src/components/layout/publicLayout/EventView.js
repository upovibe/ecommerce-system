import App from '@/core/App.js';
import '@/components/common/PageLoader.js';
import { fetchColorSettings } from '@/utils/colorSettings.js';
import Toast from '@/components/ui/Toast.js';
import '@/components/ui/ContentDisplay.js';

/**
 * Event View Component
 * 
 * Displays detailed event information with banner and content sections.
 * Accepts slug via 'slug' attribute and fetches event data.
 */
class EventView extends App {
    constructor() {
        super();
        this.set('event', null);
        this.set('loading', true);
        this.set('error', null);
        this.set('colorsLoaded', false);
    }

    // Method to copy event URL to clipboard and show toast
    copyEventUrl() {
        const event = this.get('event');
        const eventTitle = event?.title ? event.title.charAt(0).toUpperCase() + event.title.slice(1) : 'Event';
        
        navigator.clipboard.writeText(window.location.href).then(() => {
            Toast.show({ 
                message: `${eventTitle} copied to clipboard!`, 
                variant: 'success', 
                duration: 3000 
            });
        });
    }

    async connectedCallback() {
        super.connectedCallback();

        // Load colors and settings from attributes or API
        await this.loadColorsFromAttributes();

        // Check if slug attribute is provided and load data
        const slug = this.getAttribute('slug');
        if (slug) {
            this.loadEventData(slug);
        }
    }

    // Watch for attribute changes
    static get observedAttributes() {
        return ['slug', 'colors', 'textbox-bg-color'];
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (name === 'slug' && newValue && newValue !== oldValue) {
            this.loadEventData(newValue);
        } else if (name === 'colors' && newValue && newValue !== oldValue) {
            this.loadColorsFromAttributes();
        } else if (name === 'textbox-bg-color' && newValue && newValue !== oldValue) {
            this.set('textboxBgColor', newValue);
        }
    }

        async loadColorsFromAttributes() {
            // Get colors from attributes
            const colorsAttr = this.getAttribute('colors');
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

            // Get textbox_bg_color from attribute
            const textboxBgColorAttr = this.getAttribute('textbox-bg-color');
            if (textboxBgColorAttr) {
                this.set('textboxBgColor', textboxBgColorAttr);
            }

            // Mark colors as loaded
            this.set('colorsLoaded', true);
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

                // Mark colors as loaded
                this.set('colorsLoaded', true);
            } catch (error) {
                this.set('colorsLoaded', true);
            }
        }

    // Method to load event data
    async loadEventData(slug) {
        try {
            if (!slug) {
                this.set('error', 'Event not found');
                this.set('loading', false);
                return;
            }
            
            // Fetch event data by slug
            const apiUrl = `/api/events/slug/${slug}`;
            const response = await fetch(apiUrl);
            
            if (response.ok) {
                const data = await response.json();
                
                if (data.success && data.data) {
                    this.set('event', data.data);
                } else {
                    this.set('error', 'Event not found');
                }
            } else {
                this.set('error', 'Failed to load event');
            }
        } catch (error) {
            this.set('error', 'Error loading event');
        }
        
        this.set('loading', false);
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
    getBannerImages(event) {
        if (!event || !event.banner_image) {
            return [];
        }

        let bannerImages = event.banner_image;

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
        return bannerImages.filter(img => img && img.trim() !== '');
    }

    // Helper method to format date
    formatDate(dateString) {
        if (!dateString) return '';
        
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }

    // Helper method to format time
    formatTime(dateString) {
        if (!dateString) return '';
        
        const date = new Date(dateString);
        return date.toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        });
    }

    render() {
        const loading = this.get('loading');
        const colorsLoaded = this.get('colorsLoaded');
        const error = this.get('error');
        const event = this.get('event');
        
        // Get colors from state
        const primaryColor = this.get('primary_color');
        const secondaryColor = this.get('secondary_color');
        const accentColor = this.get('accent_color');
        const textColor = this.get('text_color');
        const darkColor = this.get('dark_color');
        const textboxBgColor = this.get('textboxBgColor');
        
        // Show loading if either colors or event data is still loading
        if (loading || !colorsLoaded) {
            return `
                <div class="container flex items-center justify-center mx-auto p-8">
                    <page-loader></page-loader>
                </div>
            `;
        }
        


        if (!loading && (error || !event)) {
            return `
                <div class="flex items-center justify-center min-h-96">
                    <div class="text-center">
                        <i class="fas fa-exclamation-triangle text-4xl text-red-500 mb-4"></i>
                        <h1 class="text-2xl font-bold text-gray-800 mb-2">Event Not Found</h1>
                        <p class="text-gray-600 mb-6">The event you're looking for doesn't exist or has been removed.</p>
                        <a href="/public/service-events" 
                           class="inline-flex items-center gap-2 px-6 py-3 bg-[${primaryColor}] text-[${textColor}] font-semibold rounded-lg hover:bg-[${accentColor}] transition-colors">
                            <i class="fas fa-arrow-left"></i>
                            Back to Events
                        </a>
                    </div>
                </div>
            `;
        }

        // Format dates
        const startDate = this.formatDate(event.start_date);
        const startTime = this.formatTime(event.start_date);
        const endTime = this.formatTime(event.end_date);

        return `
            <div class="min-h-screen">
                <!-- Event Banner - Always show (placeholder if no image) -->
                <div class="relative w-full h-[500px] lg:h-[45vh] overflow-hidden">
                    ${event.banner_image ? `
                        <img src="/api/${event.banner_image}" 
                             alt="${event.title}" 
                             class="w-full h-full object-cover"
                             onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
                    ` : ''}
                    <div class="absolute inset-0 ${event.banner_image ? 'hidden' : 'flex'} items-center justify-center bg-gray-100">
                        <div class="text-center">
                            <i class="fas fa-calendar-alt text-gray-400 text-6xl mb-4"></i>
                            <h2 class="text-2xl font-bold text-gray-700 mb-2">${event.title ? event.title.charAt(0).toUpperCase() + event.title.slice(1) : 'Event'}</h2>
                            <p class="text-lg text-gray-600">${event.category ? event.category.charAt(0).toUpperCase() + event.category.slice(1) : 'Event'} • ${this.formatDate(event.start_date)}</p>
                        </div>
                    </div>
                    
                    <!-- Dark gradient overlay from bottom to top -->
                    <div class="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent z-20"></div>
                    
                    <!-- Content Overlay -->
                    <div class="absolute inset-0 flex items-center justify-start z-30 container mx-auto">
                        <div class="text-left text-white px-4 lg:px-8 max-w-4xl space-y-4">
                            <h1 class="text-4xl md:text-5xl lg:text-6xl font-bold drop-shadow-lg pb-2 border-b-4 border-[${accentColor}] w-fit" style="line-height: 1.1">
                                ${event.title ? event.title.charAt(0).toUpperCase() + event.title.slice(1) : 'Event'}
                            </h1>
                            
                            <!-- Date/Time and Location - Flex row layout -->
                            <div class="flex flex-row flex-wrap gap-4 items-center">
                                <div class="bg-[${darkColor}] bg-opacity-70 backdrop-blur-sm rounded-lg px-4 py-2 text-[${textColor}] whitespace-nowrap">
                                    <div class="flex items-center gap-2">
                                        <i class="fas fa-calendar-alt text-[${accentColor}]"></i>
                                        <span class="text-sm font-medium">${startDate} • ${startTime}</span>
                                    </div>
                                </div>
                                
                                ${event.location ? `
                                    <div class="bg-[${darkColor}] bg-opacity-70 backdrop-blur-sm rounded-lg px-4 py-2 text-[${textColor}] whitespace-nowrap">
                                        <div class="flex items-center gap-2">
                                            <i class="fas fa-map-marker-alt text-[${accentColor}]"></i>
                                            <span class="text-sm font-medium">${event.location}</span>
                                        </div>
                                    </div>
                                ` : ''}
                            </div>
                        </div>
                    </div>
                    
                    <!-- Status Badge - Absolute positioned at bottom-right corner -->
                    <div class="absolute bottom-4 right-4 z-10">
                        <span class="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-[${primaryColor}] text-[${textColor}] shadow-lg">
                            <i class="fas fa-clock mr-2"></i>
                            ${event.status ? event.status.charAt(0).toUpperCase() + event.status.slice(1) : 'Upcoming'}
                        </span>
                    </div>
                </div>

                <!-- Event Details Section -->
                <div class="container mx-auto px-4 py-8">
                    <!-- Title with Share/Copy buttons -->
                    <div class="flex items-start justify-between mb-6">
                        <div class="flex-1">
                            <h2 class="text-2xl font-bold text-[${secondaryColor}] mb-2">${event.description || 'Event Description'}</h2>
                        </div>
                        <div class="flex gap-3 ml-4">
                            <i onclick="navigator.share ? navigator.share({title: '${event.title}', url: window.location.href}) : navigator.clipboard.writeText(window.location.href)" 
                               class="fas fa-share size-8 text-gray-600 hover:text-[${primaryColor}] cursor-pointer transition-colors bg-white/80 backdrop-blur-sm border border-gray-200 rounded-lg p-1.5 shadow-sm"></i>
                            <i onclick="this.closest('event-view').copyEventUrl()" 
                               class="fas fa-copy size-8 text-gray-600 hover:text-gray-800 cursor-pointer transition-colors bg-white/80 backdrop-blur-sm border border-gray-200 rounded-lg p-1.5 shadow-sm"></i>
                        </div>
                    </div>

                    <!-- Event Content -->
                    ${event.content ? `
                        <div class="rounded-3xl shadow-lg overflow-hidden mb-20" style="background-color: ${textboxBgColor}AA;">
                            <div class="p-5 lg:p-12">
                                <content-display 
                                    content="${event.content.replace(/"/g, '&quot;')}"
                                    no-styles>
                                </content-display>
                            </div>
                        </div>
                    ` : `
                        <div class="rounded-xl shadow-lg p-4" style="background-color: ${textboxBgColor}AA;">
                            <div class="text-center py-8 text-gray-500">
                                <i class="fas fa-file-alt text-4xl mb-4"></i>
                                <p>No content available for this event.</p>
                            </div>
                        </div>
                    `}
                </div>
            </div>
        `;
    }
}

customElements.define('event-view', EventView);
export default EventView; 