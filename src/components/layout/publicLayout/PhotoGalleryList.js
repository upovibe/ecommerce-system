import App from '@/core/App.js';
import { fetchColorSettings } from '@/utils/colorSettings.js';
import '@/components/layout/publicLayout/PhotoGalleryView.js';

/**
 * Photo Gallery List Component
 * 
 * Displays a grid/list of photo gallery cards. Clicking a card shows the PhotoGalleryView for that gallery.
 */
class PhotoGalleryList extends App {
    constructor() {
        super();
        this.set('galleries', []);
        this.set('loading', true);
        this.set('colorsLoaded', false);
        this.set('selectedGallerySlug', null);
    }

    async connectedCallback() {
        super.connectedCallback();
        await this.loadColorsFromSettings();
        this.loadGalleries();
    }

    async loadColorsFromSettings() {
        try {
            const colors = await fetchColorSettings();
            Object.entries(colors).forEach(([key, value]) => {
                this.set(key, value);
            });
            this.set('colorsLoaded', true);
        } catch (error) {
            this.set('colorsLoaded', true);
        }
    }

    async loadGalleries() {
        try {
            const response = await fetch('/api/galleries/active');
            if (response.ok) {
                const data = await response.json();
                if (data.success && data.data) {
                    this.set('galleries', data.data);
                } else {
                    this.set('galleries', []);
                }
            } else {
                this.set('galleries', []);
            }
        } catch (error) {
            this.set('galleries', []);
        }
        this.set('loading', false);
        this.render();
    }

    selectGallery(slug) {
        this.set('selectedGallerySlug', slug);
        this.render();
    }

    goBackToList() {
        this.set('selectedGallerySlug', null);
        this.render();
    }

    getImageUrl(imagePath) {
        if (!imagePath) return null;
        if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
            return imagePath;
        }
        if (imagePath.startsWith('/')) {
            const baseUrl = window.location.origin;
            return baseUrl + imagePath;
        }
        const baseUrl = window.location.origin;
        const apiPath = '/api';
        return baseUrl + apiPath + '/' + imagePath;
    }

    render() {
        const loading = this.get('loading');
        const colorsLoaded = this.get('colorsLoaded');
        const galleries = this.get('galleries');
        const selectedGallerySlug = this.get('selectedGallerySlug');
        const primaryColor = this.get('primary_color');
        const secondaryColor = this.get('secondary_color');
        const accentColor = this.get('accent_color');
        const textColor = this.get('text_color');

        if (loading || !colorsLoaded) {
            return `
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    <div class="group relative overflow-hidden rounded-2xl shadow-lg bg-white animate-pulse">
                        <div class="relative aspect-square bg-gray-200"></div>
                        <div class="p-4">
                            <div class="h-6 bg-gray-200 rounded mb-2"></div>
                            <div class="h-4 bg-gray-200 rounded mb-2 w-3/4"></div>
                            <div class="w-16 h-1 bg-gray-200 rounded-full mb-2"></div>
                        </div>
                    </div>
                    <div class="group relative overflow-hidden rounded-2xl shadow-lg bg-white animate-pulse">
                        <div class="relative aspect-square bg-gray-200"></div>
                        <div class="p-4">
                            <div class="h-6 bg-gray-200 rounded mb-2"></div>
                            <div class="h-4 bg-gray-200 rounded mb-2 w-3/4"></div>
                            <div class="w-16 h-1 bg-gray-200 rounded-full mb-2"></div>
                        </div>
                    </div>
                    <div class="group relative overflow-hidden rounded-2xl shadow-lg bg-white animate-pulse">
                        <div class="relative aspect-square bg-gray-200"></div>
                        <div class="p-4">
                            <div class="h-6 bg-gray-200 rounded mb-2"></div>
                            <div class="h-4 bg-gray-200 rounded mb-2 w-3/4"></div>
                            <div class="w-16 h-1 bg-gray-200 rounded-full mb-2"></div>
                        </div>
                    </div>
                    <div class="group relative overflow-hidden rounded-2xl shadow-lg bg-white animate-pulse">
                        <div class="relative aspect-square bg-gray-200"></div>
                        <div class="p-4">
                            <div class="h-6 bg-gray-200 rounded mb-2"></div>
                            <div class="h-4 bg-gray-200 rounded mb-2 w-3/4"></div>
                            <div class="w-16 h-1 bg-gray-200 rounded-full mb-2"></div>
                        </div>
                    </div>
                </div>
            `;
        }

        if (selectedGallerySlug) {
            return `
                <button onclick="this.closest('photo-gallery-list').goBackToList()" class="mb-6 border-2 border-transparent text-[${textColor}] font-semibold hover:border-b-2 hover:border-b-[${accentColor}] transition-colors flex items-center gap-2">
                    <i class="fas fa-arrow-left"></i> Back to Galleries
                </button>
                <app-photo-gallery-view slug="${selectedGallerySlug}"></app-photo-gallery-view>
            `;
        }

        if (!galleries.length) {
            return `<div class="text-center text-gray-500 py-12">No photo galleries found.</div>`;
        }

        return `
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                ${galleries.map(gallery => `
                    <div class="group relative overflow-hidden rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 bg-white cursor-pointer" onclick="this.closest('photo-gallery-list').selectGallery('${gallery.slug}')">
                        <div class="relative aspect-square">
                            <img src="${this.getImageUrl(gallery.images && gallery.images[0])}" 
                                 alt="${gallery.name}" 
                                 class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                 onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
                            <div class="absolute inset-0 hidden items-center justify-center bg-gray-100">
                                <div class="text-center">
                                    <i class="fas fa-image text-gray-400 text-2xl mb-1"></i>
                                    <p class="text-gray-500 text-sm">Image not found</p>
                                </div>
                            </div>
                            
                            <!-- Gallery Count Badge -->
                            <div class="absolute bottom-3 left-3">
                                <span class="bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded-full">
                                    ${gallery.images ? gallery.images.length : 0} photo${gallery.images && gallery.images.length === 1 ? '' : 's'}
                                </span>
                            </div>
                            
                            <!-- View Gallery Button Overlay -->
                            <div class="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100">
                                <button class="bg-white text-gray-800 px-4 py-2 rounded-lg font-semibold transform scale-90 group-hover:scale-100 transition-transform duration-300">
                                    <i class="fas fa-images mr-2"></i>
                                    View Gallery
                                </button>
                            </div>
                        </div>
                        <div class="p-4">
                            <h3 class="text-xl font-bold mb-2 truncate">${gallery.name}</h3>
                            ${gallery.description ? `<p class="text-gray-600 text-sm mb-2 truncate">${gallery.description}</p>` : ''}
                            <div class="w-16 h-1 bg-gradient-to-r from-[${primaryColor}] to-[${accentColor}] rounded-full mb-2"></div>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }
}

customElements.define('photo-gallery-list', PhotoGalleryList);
export default PhotoGalleryList; 