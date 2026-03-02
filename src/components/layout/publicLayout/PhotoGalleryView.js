import App from '@/core/App.js';
import Toast from '@/components/ui/Toast.js';
import { fetchColorSettings } from '@/utils/colorSettings.js';
import '@/components/common/PageLoader.js';
import '@/components/ui/ContentDisplay.js';

/**
 * Photo Gallery View Component
 * 
 * Displays detailed information for a specific gallery
 * Can be used in individual gallery pages or modals
 */
class PhotoGalleryView extends App {
    constructor() {
        super();
        // Initialize with loading state
        this.set('loading', true);
        this.set('colorsLoaded', false);
        this.set('gallery', null);
        this.set('error', null);
    }

    // Method to copy gallery URL to clipboard and show toast
    copyGalleryUrl() {
        const gallery = this.get('gallery');
        const galleryName = gallery?.name ? gallery.name.charAt(0).toUpperCase() + gallery.name.slice(1) : 'Gallery';
        
        navigator.clipboard.writeText(window.location.href).then(() => {
            Toast.show({ 
                message: `${galleryName} copied to clipboard!`, 
                variant: 'success', 
                duration: 3000 
            });
        });
    }

    async connectedCallback() {
        super.connectedCallback();
        
        // Load colors from settings
        await this.loadColorsFromSettings();
        
        // Check if slug attribute is provided and load data
        const slug = this.getAttribute('slug');
        if (slug) {
            this.loadGalleryData(slug);
        }
    }

    async loadColorsFromSettings() {
        try {
            // Fetch colors from API
            const colors = await fetchColorSettings();
            
            // Set colors in component state
            Object.entries(colors).forEach(([key, value]) => {
                this.set(key, value);
            });
            
            // Mark colors as loaded
            this.set('colorsLoaded', true);
        } catch (error) {
            this.set('colorsLoaded', true);
        }
    }

    // Watch for slug attribute changes
    static get observedAttributes() {
        return ['slug'];
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (name === 'slug' && newValue && newValue !== oldValue) {
            this.loadGalleryData(newValue);
        }
    }

    // Method to load gallery data (can be called externally)
    async loadGalleryData(slug) {
        try {
            if (!slug) {
                this.set('error', 'Gallery not found');
                this.set('loading', false);
                return;
            }

            // Fetch gallery data by slug
            const apiUrl = `/api/galleries/slug/${slug}`;
            
            const response = await fetch(apiUrl);
            
            if (response.ok) {
                const data = await response.json();
                if (data.success && data.data) {
                    this.set('gallery', data.data);
                } else {
                    this.set('error', 'Gallery not found');
                }
            } else {
                this.set('error', 'Failed to load gallery');
            }
        } catch (error) {
            this.set('error', 'Error loading gallery');
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
        
        // For relative paths like "uploads/galleries/filename.jpg"
        // Construct the URL by adding the base URL and /api
        const baseUrl = window.location.origin;
        const apiPath = '/api';
        return baseUrl + apiPath + '/' + imagePath;
    }

    // Helper function to format date
    formatDate(dateString) {
        if (!dateString) return 'TBD';
        try {
            const date = new Date(dateString);
            if (isNaN(date.getTime())) {
                return dateString;
            }
            return date.toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        } catch (error) {
            return dateString;
        }
    }

    render() {
        const loading = this.get('loading');
        const colorsLoaded = this.get('colorsLoaded');
        const error = this.get('error');
        const gallery = this.get('gallery');
        
        // Get colors from state
        const primaryColor = this.get('primary_color');
        const secondaryColor = this.get('secondary_color');
        const accentColor = this.get('accent_color');
        const textColor = this.get('text_color');
        
        // Show loading if either colors or gallery data is still loading
        if (loading || !colorsLoaded) {
            return `<page-loader></page-loader>`;
        }

        if (!loading && (error || !gallery)) {
            return `
                <div class="flex items-center justify-center min-h-96">
                    <div class="text-center">
                        <i class="fas fa-exclamation-triangle text-4xl text-red-500 mb-4"></i>
                        <h1 class="text-2xl font-bold text-gray-800 mb-2">Gallery Not Found</h1>
                        <p class="text-gray-600 mb-6">The gallery you're looking for doesn't exist or has been removed.</p>
                        <a href="/public/gallery" 
                           class="inline-flex items-center gap-2 px-6 py-3 bg-[${primaryColor}] text-[${textColor}] font-semibold rounded-lg hover:border-b-2 hover:border-b-[${accentColor}] transition-colors">
                            <i class="fas fa-arrow-left"></i>
                            Back to Gallery
                        </a>
                    </div>
                </div>
            `;
        }

        return `
            <!-- Gallery Banner -->
            ${gallery.images && gallery.images.length > 0 ? `
                <div class="relative w-full h-96 rounded-2xl overflow-hidden shadow-lg my-6">
                    <img src="${this.getImageUrl(gallery.images[0])}" 
                         alt="${gallery.name}" 
                         class="w-full h-full object-cover"
                         onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
                    <div class="absolute inset-0 hidden items-center justify-center bg-gray-100">
                        <div class="text-center">
                            <i class="fas fa-image text-gray-400 text-4xl mb-2"></i>
                            <p class="text-gray-500">Banner image not found</p>
                        </div>
                    </div>
                    
                    <!-- Dark gradient overlay from bottom to top -->
                    <div class="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent rounded-2xl"></div>
                    
                    <!-- Image Count Badge -->
                    <div class="absolute top-6 left-6">
                        <span class="bg-black bg-opacity-50 text-white text-sm px-3 py-1 rounded-full backdrop-blur-sm">
                            ${gallery.images.length} ${gallery.images.length === 1 ? 'photo' : 'photos'}
                        </span>
                    </div>
                </div>
            ` : ''}

            <!-- Gallery Title and Description -->
            <div class="my-6">
                <div class="flex items-start justify-between mb-4">
                    <div class="flex-1">
                        <h1 class="text-3xl lg:text-4xl font-bold text-[${secondaryColor}] mb-4">
                            ${gallery.name}
                        </h1>
                        ${gallery.description ? `
                            <p class="text-lg text-gray-600 leading-relaxed mb-4">
                                ${gallery.description}
                            </p>
                        ` : ''}
                    </div>
                    <div class="flex gap-2 ml-4">
                        <button onclick="navigator.share ? navigator.share({title: '${gallery.name}', url: window.location.href}) : navigator.clipboard.writeText(window.location.href)" 
                               class="size-8 bg-[${primaryColor}] text-[${textColor}] rounded-lg font-semibold hover:bg-[${accentColor}] transition-colors flex items-center justify-center">
                            <i class="fas fa-share"></i>
                        </button>
                        <button onclick="this.closest('app-photo-gallery-view').copyGalleryUrl()" 
                               class="size-8 bg-gray-100 text-gray-700 rounded-lg font-semibold hover:bg-gray-200 transition-colors flex items-center justify-center">
                            <i class="fas fa-copy"></i>
                        </button>
                    </div>
                </div>
                <div class="w-24 h-1 bg-gradient-to-r from-[${primaryColor}] to-[${accentColor}] rounded-full"></div>
            </div>

            <!-- Gallery Images Grid -->
            ${gallery.images && gallery.images.length > 0 ? `
                <div class="bg-[${primaryColor}]/5 rounded-3xl shadow p-8 mb-6">
                    <div class="mb-6">
                        <h2 class="text-2xl font-bold text-[${secondaryColor}] mb-2">${gallery.images.length} Gallery Image${gallery.images.length === 1 ? '' : 's'}</h2>
                        <p class="text-gray-600">Browse through all ${gallery.images.length} photos in this gallery</p>
                    </div>
                    
                    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        ${gallery.images.map((image, index) => `
                            <div class="group relative overflow-hidden rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2">
                                <div class="relative aspect-square">
                                    <img src="${this.getImageUrl(image)}" 
                                         alt="${gallery.name} - Image ${index + 1}" 
                                         class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                         onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
                                    <div class="absolute inset-0 hidden items-center justify-center bg-gray-100">
                                        <div class="text-center">
                                            <i class="fas fa-image text-gray-400 text-2xl mb-1"></i>
                                            <p class="text-gray-500 text-sm">Image not found</p>
                                        </div>
                                    </div>
                                    
                                    <!-- Image Number Badge -->
                                    <div class="absolute bottom-3 left-3">
                                        <span class="bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded-full">
                                            ${index + 1}
                                        </span>
                                    </div>
                                    
                                    <!-- View Full Size Button -->
                                    <div class="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100">
                                        <button onclick="window.open('${this.getImageUrl(image)}', '_blank')" 
                                                class="bg-white text-gray-800 px-4 py-2 rounded-lg font-semibold transform scale-90 group-hover:scale-100 transition-transform duration-300">
                                            <i class="fas fa-external-link-alt mr-2"></i>
                                            View Full Size
                                        </button>
                                    </div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            ` : `
                <div class="bg-slate-700 rounded-2xl shadow-lg p-8 mb-6 text-center">
                    <div class="w-32 h-32 bg-gradient-to-br from-[${primaryColor}] to-[${accentColor}] rounded-full flex items-center justify-center mx-auto mb-6">
                        <i class="fas fa-images text-white text-4xl"></i>
                    </div>
                    <h3 class="text-2xl font-bold text-[${secondaryColor}] mb-3">No Images Available</h3>
                    <p class="text-gray-600 mb-6">This gallery doesn't have any images yet.</p>
                </div>
            `}
        `;
    }
}

customElements.define('app-photo-gallery-view', PhotoGalleryView);
export default PhotoGalleryView; 