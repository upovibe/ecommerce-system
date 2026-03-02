import App from '@/core/App.js';
import { fetchColorSettings } from '@/utils/colorSettings.js';
import '@/components/layout/publicLayout/VideoGalleryView.js';

/**
 * Video Gallery List Component
 * 
 * Displays a grid/list of video gallery cards. Clicking a card shows the VideoGalleryView for that gallery.
 */
class VideoGalleryList extends App {
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
            const response = await fetch('/api/video-galleries/active');
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

    // Helper function to get video platform from URL
    getVideoPlatform(videoUrl) {
        if (!videoUrl) return 'unknown';
        
        if (videoUrl.includes('youtube.com') || videoUrl.includes('youtu.be/')) {
            return 'youtube';
        }
        if (videoUrl.includes('facebook.com/')) {
            return 'facebook';
        }
        if (videoUrl.includes('vimeo.com/')) {
            return 'vimeo';
        }
        if (videoUrl.includes('dailymotion.com/')) {
            return 'dailymotion';
        }
        
        return 'other';
    }

    // Helper function to get video embed URL
    getVideoEmbedUrl(videoUrl) {
        if (!videoUrl) return null;
        
        const platform = this.getVideoPlatform(videoUrl);
        
        if (platform === 'youtube') {
            const videoId = videoUrl.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
            return videoId ? `https://www.youtube.com/embed/${videoId[1]}` : null;
        }
        if (platform === 'vimeo') {
            const videoId = videoUrl.match(/vimeo\.com\/(\d+)/);
            return videoId ? `https://player.vimeo.com/video/${videoId[1]}` : null;
        }
        
        return null;
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
                <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div class="group relative overflow-hidden rounded-2xl shadow-lg bg-white animate-pulse">
                        <div class="relative aspect-video bg-gray-200"></div>
                        <div class="p-4">
                            <div class="h-6 bg-gray-200 rounded mb-2"></div>
                            <div class="h-4 bg-gray-200 rounded mb-2 w-3/4"></div>
                            <div class="w-16 h-1 bg-gray-200 rounded-full mb-2"></div>
                            <div class="h-4 bg-gray-200 rounded w-1/2"></div>
                        </div>
                    </div>
                    <div class="group relative overflow-hidden rounded-2xl shadow-lg bg-white animate-pulse">
                        <div class="relative aspect-video bg-gray-200"></div>
                        <div class="p-4">
                            <div class="h-6 bg-gray-200 rounded mb-2"></div>
                            <div class="h-4 bg-gray-200 rounded mb-2 w-3/4"></div>
                            <div class="w-16 h-1 bg-gray-200 rounded-full mb-2"></div>
                            <div class="h-4 bg-gray-200 rounded w-1/2"></div>
                        </div>
                    </div>
                    <div class="group relative overflow-hidden rounded-2xl shadow-lg bg-white animate-pulse">
                        <div class="relative aspect-video bg-gray-200"></div>
                        <div class="p-4">
                            <div class="h-6 bg-gray-200 rounded mb-2"></div>
                            <div class="h-4 bg-gray-200 rounded mb-2 w-3/4"></div>
                            <div class="w-16 h-1 bg-gray-200 rounded-full mb-2"></div>
                            <div class="h-4 bg-gray-200 rounded w-1/2"></div>
                        </div>
                    </div>
                </div>
            `;
        }

        if (selectedGallerySlug) {
            return `
                <button onclick="this.closest('video-gallery-list').goBackToList()" class="mb-6 border-2 border-transparent text-[${textColor}] font-semibold hover:border-b-2 hover:border-b-[${accentColor}] transition-colors flex items-center gap-2">
                    <i class="fas fa-arrow-left"></i> Back to Video Galleries
                </button>
                <app-video-gallery-view slug="${selectedGallerySlug}"></app-video-gallery-view>
            `;
        }

        if (!galleries.length) {
            return `<div class="text-center text-gray-500 py-12">No video galleries found.</div>`;
        }

        return `
            <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
                ${galleries.map((gallery, index) => {
                    const firstVideo = gallery.video_links && gallery.video_links.length > 0 ? gallery.video_links[0] : null;
                    const videoInfo = firstVideo ? {
                        platform: this.getVideoPlatform(firstVideo),
                        embedUrl: this.getVideoEmbedUrl(firstVideo)
                    } : null;
                    
                    return `
                        <div class="group relative overflow-hidden rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 bg-white cursor-pointer" onclick="this.closest('video-gallery-list').selectGallery('${gallery.slug}')">
                            <div class="relative aspect-video">
                                ${firstVideo && videoInfo.embedUrl ? `
                                    <iframe 
                                        src="${videoInfo.embedUrl}" 
                                        title="${gallery.name} - Preview"
                                        class="w-full h-full rounded-t-2xl"
                                        frameborder="0" 
                                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                                        allowfullscreen>
                                    </iframe>
                                    ${gallery.video_links && gallery.video_links.length > 1 ? `
                                        <div class="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center rounded-t-2xl">
                                            <span class="text-white text-lg font-bold">+${gallery.video_links.length - 1} more</span>
                                        </div>
                                    ` : ''}
                                ` : firstVideo ? `
                                    <div class="w-full h-full bg-gray-100 rounded-t-2xl flex items-center justify-center">
                                        <div class="text-center">
                                            <i class="fas fa-video text-gray-400 text-4xl mb-2"></i>
                                            <p class="text-gray-500">Video not available</p>
                                            <a href="${firstVideo}" target="_blank" class="text-blue-500 hover:underline mt-2 inline-block">
                                                View on ${videoInfo.platform}
                                            </a>
                                        </div>
                                    </div>
                                    ${gallery.video_links && gallery.video_links.length > 1 ? `
                                        <div class="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center rounded-t-2xl">
                                            <span class="text-white text-lg font-bold">+${gallery.video_links.length - 1} more</span>
                                        </div>
                                    ` : ''}
                                ` : `
                                    <div class="w-full h-full bg-gray-100 rounded-t-2xl flex items-center justify-center">
                                        <div class="text-center">
                                            <i class="fas fa-video-slash text-gray-400 text-4xl mb-2"></i>
                                            <p class="text-gray-500">No videos</p>
                                        </div>
                                    </div>
                                `}
                                
                                <!-- Gallery Number Badge -->
                                <div class="absolute top-3 left-3">
                                    <span class="bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded-full">
                                        ${index + 1}
                                    </span>
                                </div>
                                
                                <!-- Video Count Badge -->
                                <div class="absolute top-3 right-3">
                                    <span class="bg-[${primaryColor}] text-white text-xs px-2 py-1 rounded-full">
                                        ${gallery.video_links ? gallery.video_links.length : 0} video${gallery.video_links && gallery.video_links.length === 1 ? '' : 's'}
                                    </span>
                                </div>
                                
                                <!-- Platform Badge (if has videos) -->
                                ${firstVideo ? `
                                    <div class="absolute bottom-3 left-3">
                                        <span class="bg-white bg-opacity-90 text-gray-800 text-xs px-2 py-1 rounded-full capitalize font-medium">
                                            ${videoInfo.platform}
                                        </span>
                                    </div>
                                ` : ''}
                                
                                <!-- View Gallery Button Overlay -->
                                <div class="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100">
                                    <button class="bg-white text-gray-800 px-4 py-2 rounded-lg font-semibold transform scale-90 group-hover:scale-100 transition-transform duration-300">
                                        <i class="fas fa-video mr-2"></i>
                                        View Gallery
                                    </button>
                                </div>
                            </div>
                            <div class="p-4">
                                <h3 class="text-xl font-bold text-[${secondaryColor}] mb-2 truncate">${gallery.name}</h3>
                                ${gallery.description ? `<p class="text-gray-600 text-sm mb-2 truncate">${gallery.description}</p>` : ''}
                                <div class="w-16 h-1 bg-gradient-to-r from-[${primaryColor}] to-[${accentColor}] rounded-full mb-2"></div>
                                ${firstVideo ? `
                                    <a href="${firstVideo}" target="_blank" 
                                       class="inline-flex items-center gap-2 text-[${primaryColor}] hover:text-[${accentColor}] transition-colors text-sm">
                                        <i class="fas fa-external-link-alt"></i>
                                        <span>View on ${videoInfo.platform}</span>
                                    </a>
                                ` : ''}
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
        `;
    }
}

customElements.define('video-gallery-list', VideoGalleryList);
export default VideoGalleryList; 

