import App from '@/core/App.js';
import { unescapeJsonFromAttribute } from '@/utils/jsonUtils.js';
import api from '@/services/api.js';

/**
 * Photo Gallery Section Component
 * 
 * Displays photo galleries from the API with creative design
 */
class PhotoGallerySection extends App {
    constructor() {
        super();
    }

    connectedCallback() {
        super.connectedCallback();
        this.loadDataFromProps();
        this.loadPhotoGalleries();
    }

    loadDataFromProps() {
        // Get data from props/attributes
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

        // Render immediately with the data
        this.render();
    }

    async loadPhotoGalleries() {
        try {
            const response = await api.get('/galleries/active');
            if (response.data.success) {
                // Filter for photo galleries (you can add a type field to galleries later)
                const allGalleries = response.data.data;
                this.set('galleries', allGalleries);
                this.render();
            }
        } catch (error) {
            console.error('Error loading photo galleries:', error);
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
        const galleries = this.get('galleries');
        
        // Don't render until galleries data is loaded
        if (galleries === undefined) {
            return '';
        }
        
        // Get colors from state
        const primaryColor = this.get('primary_color');
        const secondaryColor = this.get('secondary_color');
        const accentColor = this.get('accent_color');
        const textColor = this.get('text_color');
        const hoverPrimary = this.get('hover_primary');
        const hoverSecondary = this.get('hover_secondary');
        const hoverAccent = this.get('hover_accent');

        return `
            <!-- Photo Gallery Section -->
            <section class="mx-auto py-10">
                
                <!-- Creative Header -->
                <div class="relative mb-16">
                    <!-- Animated Background Shapes -->
                    <div class="absolute inset-0 overflow-hidden">
                        <div class="absolute top-0 left-1/4 w-32 h-32 bg-[${primaryColor}]/10 rounded-full blur-xl animate-pulse"></div>
                        <div class="absolute top-20 right-1/4 w-24 h-24 bg-[${accentColor}]/15 rounded-full blur-lg animate-pulse delay-1000"></div>
                        <div class="absolute bottom-10 left-1/3 w-20 h-20 bg-[${secondaryColor}]/10 rounded-full blur-md animate-pulse delay-500"></div>
                    </div>
                    
                    <div class="relative text-center">
                        <div class="inline-block mb-6">
                            <div class="w-24 h-24 bg-gradient-to-br from-[${primaryColor}] to-[${accentColor}] rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
                                <i class="fas fa-images text-white text-3xl"></i>
                            </div>
                        </div>
                        <h1 class="text-4xl lg:text-5xl font-bold text-[${secondaryColor}] mb-4 bg-gradient-to-r from-[${primaryColor}] to-[${accentColor}] bg-clip-text text-transparent">
                            Photo Gallery
                        </h1>
                        <p class="text-lg text-gray-600 max-w-2xl mx-auto mb-6">
                            Explore our collection of beautiful photographs capturing precious moments from our school community
                        </p>
                        <div class="w-32 h-1 bg-gradient-to-r from-[${primaryColor}] via-[${accentColor}] to-[${secondaryColor}] mx-auto rounded-full"></div>
                    </div>
                </div>

                <!-- Photo Galleries Grid -->
                ${galleries.length > 0 ? `
                    <div class="relative">
                        <!-- Animated Background -->
                        <div class="absolute inset-0">
                            <div class="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-[${primaryColor}]/5 via-transparent to-[${accentColor}]/5 rounded-[3rem]"></div>
                            <div class="absolute top-10 left-10 w-20 h-20 bg-[${primaryColor}]/10 rounded-full animate-spin-slow"></div>
                            <div class="absolute bottom-10 right-10 w-16 h-16 bg-[${accentColor}]/10 rounded-full animate-spin-slow-reverse"></div>
                        </div>
                        
                        <div class="relative">
                            <!-- Galleries Grid -->
                            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 p-5 lg:p-8">
                                ${galleries.map((gallery, index) => `
                                    <a href="/public/gallery/photos/${gallery.slug}" class="group perspective-1000">
                                        <div class="relative transform-style-preserve-3d transition-all duration-700 group-hover:rotate-y-12">
                                            <div class="relative bg-white rounded-[2rem] shadow-2xl overflow-hidden hover:shadow-3xl transition-all duration-700 transform hover:-translate-y-4 cursor-pointer">
                                                <!-- Gallery Header -->
                                                <div class="relative h-48 bg-gradient-to-br from-[${primaryColor}] to-[${accentColor}] overflow-hidden">
                                                    <!-- Animated Background Pattern -->
                                                    <div class="absolute inset-0 opacity-30">
                                                        <div class="absolute top-4 left-4 w-8 h-8 border-2 border-white/30 rounded-full animate-ping"></div>
                                                        <div class="absolute bottom-4 right-4 w-6 h-6 border-2 border-white/20 rounded-full animate-ping delay-300"></div>
                                                    </div>
                                                    
                                                    <!-- Gallery Image or Icon -->
                                                    ${gallery.images && gallery.images.length > 0 ? `
                                                        <img src="${this.getImageUrl(gallery.images[0])}" 
                                                             alt="${gallery.name}" 
                                                             class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                                             onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
                                                        <div class="absolute inset-0 hidden items-center justify-center bg-gray-100">
                                                            <div class="text-center">
                                                                <i class="fas fa-image text-gray-400 text-2xl mb-1"></i>
                                                                <p class="text-gray-500 text-sm">No image</p>
                                                            </div>
                                                        </div>
                                                    ` : `
                                                        <div class="absolute inset-0 flex items-center justify-center">
                                                            <div class="relative">
                                                                <div class="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center border border-white/30 group-hover:scale-110 transition-transform duration-500">
                                                                    <i class="fas fa-images text-white text-3xl group-hover:rotate-12 transition-transform duration-500"></i>
                                                                </div>
                                                                <div class="absolute -top-2 -right-2 w-8 h-8 bg-[${accentColor}] rounded-full animate-bounce"></div>
                                                                <div class="absolute -bottom-2 -left-2 w-6 h-6 bg-white/40 rounded-full animate-pulse"></div>
                                                            </div>
                                                        </div>
                                                    `}
                                                    
                                                    <!-- Image Count Badge -->
                                                    ${gallery.images && gallery.images.length > 0 ? `
                                                        <div class="absolute top-4 right-4">
                                                            <span class="bg-black bg-opacity-50 text-white text-xs px-3 py-1 rounded-full backdrop-blur-sm">
                                                                ${gallery.images.length} ${gallery.images.length === 1 ? 'photo' : 'photos'}
                                                            </span>
                                                        </div>
                                                    ` : ''}
                                                    
                                                    <!-- Floating Elements -->
                                                    <div class="absolute top-6 left-6 w-4 h-4 bg-white/40 rounded-full animate-pulse"></div>
                                                    <div class="absolute bottom-6 right-6 w-3 h-3 bg-white/30 rounded-full animate-pulse delay-500"></div>
                                                </div>
                                                
                                                <!-- Gallery Content -->
                                                <div class="p-6">
                                                    <div class="mb-4">
                                                        <h3 class="text-xl font-bold text-[${secondaryColor}] mb-2 group-hover:text-[${primaryColor}] transition-colors duration-300">
                                                            ${gallery.name}
                                                        </h3>
                                                        <div class="w-12 h-1 bg-gradient-to-r from-[${primaryColor}] to-[${accentColor}] rounded-full"></div>
                                                    </div>
                                                    
                                                    ${gallery.description ? `
                                                        <p class="text-gray-600 text-sm leading-relaxed mb-4 line-clamp-2">
                                                            ${gallery.description}
                                                        </p>
                                                    ` : ''}
                                                    
                                                    <!-- Action Area -->
                                                    <div class="flex items-center justify-between">
                                                        <div class="flex items-center gap-2">
                                                            <div class="w-2 h-2 bg-[${primaryColor}] rounded-full animate-pulse"></div>
                                                            <span class="text-xs text-gray-500 font-medium">View Gallery</span>
                                                        </div>
                                                        <div class="relative">
                                                            <div class="w-10 h-10 bg-gradient-to-r from-[${primaryColor}]/10 to-[${accentColor}]/10 rounded-full flex items-center justify-center group-hover:bg-gradient-to-r group-hover:from-[${primaryColor}] group-hover:to-[${accentColor}] group-hover:text-white transition-all duration-500">
                                                                <i class="fas fa-arrow-right text-sm group-hover:scale-110 transition-transform duration-300"></i>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </a>
                                `).join('')}
                            </div>
                        </div>
                    </div>
                ` : `
                    <!-- Empty State -->
                    <div class="text-center py-20">
                        <div class="w-32 h-32 bg-gradient-to-br from-[${primaryColor}] to-[${accentColor}] rounded-full flex items-center justify-center mx-auto mb-8 animate-pulse">
                            <i class="fas fa-images text-white text-5xl"></i>
                        </div>
                        <h3 class="text-3xl font-bold text-[${secondaryColor}] mb-4">No Photo Galleries Available</h3>
                        <p class="text-gray-600 max-w-md mx-auto mb-8">
                            We're working on adding beautiful photo galleries. Check back soon for our latest collections!
                        </p>
                        <a href="/public/gallery" 
                           class="inline-flex items-center justify-center gap-3 px-8 py-4 bg-gradient-to-r from-[${primaryColor}] to-[${accentColor}] text-[${textColor}] font-bold rounded-2xl hover:from-[${accentColor}] hover:to-[${primaryColor}] transition-all duration-500 transform hover:-translate-y-2 hover:scale-105 shadow-xl hover:shadow-2xl">
                            <i class="fas fa-arrow-left"></i>
                            <span>Back to Gallery</span>
                        </a>
                    </div>
                `}
            </section>
        `;
    }
}

customElements.define('photo-gallery-section', PhotoGallerySection);
export default PhotoGallerySection; 