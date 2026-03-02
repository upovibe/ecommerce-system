import App from '@/core/App.js';
import Toast from '@/components/ui/Toast.js';
import { fetchColorSettings } from '@/utils/colorSettings.js';
import '@/components/common/PageLoader.js';
import '@/components/ui/ContentDisplay.js';

/**
 * Video Gallery View Component
 * 
 * Displays detailed information for a specific video gallery
 * Can be used in individual video gallery pages or modals
 */
class VideoGalleryView extends App {
    constructor() {
        super();
        // Initialize with loading state
        this.set('loading', true);
        this.set('colorsLoaded', false);
        this.set('videoGallery', null);
        this.set('error', null);
    }

    // Method to copy gallery URL to clipboard and show toast
    copyGalleryUrl() {
        const videoGallery = this.get('videoGallery');
        const galleryName = videoGallery?.name ? videoGallery.name.charAt(0).toUpperCase() + videoGallery.name.slice(1) : 'Video Gallery';
        
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
            this.loadVideoGalleryData(slug);
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
            this.loadVideoGalleryData(newValue);
        }
    }

    // Method to load video gallery data (can be called externally)
    async loadVideoGalleryData(slug) {
        try {
            if (!slug) {
                this.set('error', 'Video gallery not found');
                this.set('loading', false);
                return;
            }

            // Fetch video gallery data by slug
            const apiUrl = `/api/video-galleries/slug/${slug}`;
            
            const response = await fetch(apiUrl);
            
            if (response.ok) {
                const data = await response.json();
                if (data.success && data.data) {
                    this.set('videoGallery', data.data);
                } else {
                    this.set('error', 'Video gallery not found');
                }
            } else {
                this.set('error', 'Failed to load video gallery');
            }
        } catch (error) {
            this.set('error', 'Error loading video gallery');
        }
        
        this.set('loading', false);
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

    // Helper function to get video platform and ID from URL
    getVideoInfo(videoUrl) {
        if (!videoUrl) {
            return { platform: 'unknown', id: null, embedUrl: null, displayType: 'link' };
        }
        
        // YouTube - Use embedded player (works reliably)
        if (videoUrl.includes('youtube.com/watch') || videoUrl.includes('youtu.be/')) {
            let videoId = null;
            if (videoUrl.includes('youtube.com/watch')) {
                const urlParams = new URLSearchParams(videoUrl.split('?')[1]);
                videoId = urlParams.get('v');
            } else if (videoUrl.includes('youtu.be/')) {
                videoId = videoUrl.split('youtu.be/')[1];
            }
            return {
                platform: 'youtube',
                id: videoId,
                embedUrl: videoId ? `https://www.youtube.com/embed/${videoId}` : null,
                displayType: 'embed',
                thumbnailUrl: videoId ? `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg` : null
            };
        }
        
        // Facebook - Use thumbnail + external link (embed requires login)
        if (videoUrl.includes('facebook.com/') && videoUrl.includes('/videos/')) {
            const videoId = videoUrl.match(/\/videos\/(\d+)/)?.[1];
            return {
                platform: 'facebook',
                id: videoId,
                embedUrl: null, // Don't use embed due to login requirements
                displayType: 'thumbnail',
                thumbnailUrl: null, // Facebook doesn't provide public thumbnails
                externalUrl: videoUrl
            };
        }
        
        // Vimeo - Use thumbnail + external link (some videos require login)
        if (videoUrl.includes('vimeo.com/')) {
            const videoId = videoUrl.match(/vimeo\.com\/(\d+)/)?.[1];
            return {
                platform: 'vimeo',
                id: videoId,
                embedUrl: null, // Don't use embed due to potential login requirements
                displayType: 'thumbnail',
                thumbnailUrl: videoId ? `https://vumbnail.com/${videoId}.jpg` : null,
                externalUrl: videoUrl
            };
        }
        
        // Dailymotion - Use thumbnail + external link (embed requires login)
        if (videoUrl.includes('dailymotion.com/video/')) {
            const videoId = videoUrl.match(/dailymotion\.com\/video\/([^_]+)/)?.[1];
            return {
                platform: 'dailymotion',
                id: videoId,
                embedUrl: null, // Don't use embed due to login requirements
                displayType: 'thumbnail',
                thumbnailUrl: null, // Dailymotion doesn't provide easy thumbnail access
                externalUrl: videoUrl
            };
        }
        
        // Direct video files - Use custom player or direct link
        if (videoUrl.match(/\.(mp4|webm|ogg|avi|mov)$/i)) {
            return {
                platform: 'direct',
                id: videoUrl,
                embedUrl: null,
                displayType: 'direct',
                thumbnailUrl: null,
                externalUrl: videoUrl
            };
        }
        
        // Default fallback - Use direct link
        return {
            platform: 'unknown',
            id: videoUrl,
            embedUrl: null,
            displayType: 'link',
            thumbnailUrl: null,
            externalUrl: videoUrl
        };
    }

    // Helper method to get platform icon
    getPlatformIcon(platform) {
        const icons = {
            'youtube': 'fab fa-youtube',
            'facebook': 'fab fa-facebook',
            'vimeo': 'fab fa-vimeo',
            'dailymotion': 'fas fa-play-circle',
            'direct': 'fas fa-video',
            'unknown': 'fas fa-link'
        };
        return icons[platform] || 'fas fa-video';
    }

    // Helper method to get platform display name
    getPlatformName(platform) {
        const names = {
            'youtube': 'YouTube',
            'facebook': 'Facebook',
            'vimeo': 'Vimeo',
            'dailymotion': 'Dailymotion',
            'direct': 'Direct Video',
            'unknown': 'External'
        };
        return names[platform] || 'Video';
    }

    render() {
        const loading = this.get('loading');
        const colorsLoaded = this.get('colorsLoaded');
        const error = this.get('error');
        const videoGallery = this.get('videoGallery');
        
        // Get colors from state
        const primaryColor = this.get('primary_color');
        const secondaryColor = this.get('secondary_color');
        const accentColor = this.get('accent_color');
        const textColor = this.get('text_color');
        
        // Show loading if either colors or gallery data is still loading
        if (loading || !colorsLoaded) {
            return `<page-loader></page-loader>`;
        }

        if (!loading && (error || !videoGallery)) {
            return `
                <div class="flex items-center justify-center min-h-96">
                    <div class="text-center">
                        <i class="fas fa-exclamation-triangle text-4xl text-red-500 mb-4"></i>
                        <h1 class="text-2xl font-bold text-gray-800 mb-2">Video Gallery Not Found</h1>
                        <p class="text-gray-600 mb-6">The video gallery you're looking for doesn't exist or has been removed.</p>
                        <a href="/public/gallery" 
                           class="inline-flex items-center gap-2 px-6 py-3 bg-[${primaryColor}] text-[${textColor}] font-semibold rounded-lg hover:bg-[${accentColor}] transition-colors">
                            <i class="fas fa-arrow-left"></i>
                            Back to Gallery
                        </a>
                    </div>
                </div>
            `;
        }

        return `
            <!-- Video Gallery Title and Description -->
            <div class="my-6">
                <div class="flex items-start justify-between mb-4">
                    <div class="flex-1">
                        <h1 class="text-3xl lg:text-4xl font-bold text-[${secondaryColor}] mb-4">
                            ${videoGallery.name}
                        </h1>
                        ${videoGallery.description ? `
                            <p class="text-lg text-gray-600 leading-relaxed mb-4">
                                ${videoGallery.description}
                            </p>
                        ` : ''}
                    </div>
                    <div class="flex gap-2 ml-4">
                        <button onclick="navigator.share ? navigator.share({title: '${videoGallery.name}', url: window.location.href}) : navigator.clipboard.writeText(window.location.href)" 
                               class="size-8 bg-[${primaryColor}] text-[${textColor}] rounded-lg font-semibold hover:bg-[${accentColor}] transition-colors flex items-center justify-center">
                            <i class="fas fa-share"></i>
                        </button>
                        <button onclick="this.closest('app-video-gallery-view').copyGalleryUrl()" 
                               class="size-8 bg-gray-100 text-gray-700 rounded-lg font-semibold hover:bg-gray-200 transition-colors flex items-center justify-center">
                            <i class="fas fa-copy"></i>
                        </button>
                    </div>
                </div>
                <div class="w-24 h-1 bg-gradient-to-r from-[${primaryColor}] to-[${accentColor}] rounded-full"></div>
            </div>

            <!-- Video Gallery Videos Grid -->
            ${videoGallery.video_links && videoGallery.video_links.length > 0 ? `
                <div class="bg-[${primaryColor}]/5 rounded-3xl shadow p-8 mb-6">
                    <div class="mb-6">
                        <h2 class="text-2xl font-bold text-[${secondaryColor}] mb-2">${videoGallery.video_links.length} Video${videoGallery.video_links.length === 1 ? '' : 's'}</h2>
                        <p class="text-gray-600">Watch all ${videoGallery.video_links.length} videos in this gallery</p>
                    </div>
                    
                    <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        ${videoGallery.video_links.map((videoUrl, index) => {
                            const videoInfo = this.getVideoInfo(videoUrl);
                            
                            // Render based on display type
                            if (videoInfo.displayType === 'embed') {
                                // YouTube embedded player
                                return `
                                    <div class="group relative overflow-hidden rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300">
                                        <div class="relative aspect-video">
                                            <iframe 
                                                src="${videoInfo.embedUrl}" 
                                                title="${videoGallery.name} - Video ${index + 1}"
                                                class="w-full h-full rounded-2xl"
                                                frameborder="0" 
                                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                                                allowfullscreen>
                                            </iframe>
                                            
                                            <!-- Video Number Badge -->
                                            <div class="absolute top-3 left-3">
                                                <span class="bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded-full">
                                                    ${index + 1}
                                                </span>
                                            </div>
                                            
                                            <!-- Platform Badge -->
                                            <div class="absolute top-3 right-3">
                                                <span class="bg-[${primaryColor}] text-white text-xs px-2 py-1 rounded-full capitalize">
                                                    ${videoInfo.platform}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                `;
                            } else if (videoInfo.displayType === 'thumbnail') {
                                // Thumbnail with external link
                                return `
                                    <div class="group relative overflow-hidden rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300">
                                        <div class="relative aspect-video">
                                            <div class="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center relative overflow-hidden">
                                                ${videoInfo.thumbnailUrl ? `
                                                    <img src="${videoInfo.thumbnailUrl}" 
                                                         alt="${videoGallery.name} - Video ${index + 1}"
                                                         class="w-full h-full object-cover"
                                                         onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
                                                ` : ''}
                                                <div class="absolute inset-0 flex items-center justify-center ${videoInfo.thumbnailUrl ? 'hidden' : 'flex'}">
                                                    <div class="text-center text-gray-600">
                                                        <i class="fas fa-${this.getPlatformIcon(videoInfo.platform)} text-4xl mb-3"></i>
                                                        <p class="text-lg font-medium">${this.getPlatformName(videoInfo.platform)} Video</p>
                                                        <p class="text-sm opacity-75">Click to watch on ${this.getPlatformName(videoInfo.platform)}</p>
                                                    </div>
                                                </div>
                                                <div class="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                                    <a href="${videoInfo.externalUrl}" 
                                                       target="_blank" 
                                                       rel="noopener noreferrer"
                                                       class="bg-white text-gray-800 px-6 py-3 rounded-lg font-medium hover:bg-gray-100 transition-colors duration-200 flex items-center gap-2">
                                                        <i class="fas fa-external-link-alt"></i>
                                                        Watch on ${this.getPlatformName(videoInfo.platform)}
                                                    </a>
                                                </div>
                                                
                                                <!-- Video Number Badge -->
                                                <div class="absolute top-3 left-3">
                                                    <span class="bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded-full">
                                                        ${index + 1}
                                                    </span>
                                                </div>
                                                
                                                <!-- Platform Badge -->
                                                <div class="absolute top-3 right-3">
                                                    <span class="bg-[${primaryColor}] text-white text-xs px-2 py-1 rounded-full capitalize">
                                                        ${videoInfo.platform}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                `;
                            } else if (videoInfo.displayType === 'direct') {
                                // Direct video file
                                return `
                                    <div class="group relative overflow-hidden rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300">
                                        <div class="relative aspect-video">
                                            <video 
                                                controls 
                                                class="w-full h-full rounded-2xl"
                                                poster="${videoInfo.thumbnailUrl || ''}">
                                                <source src="${videoInfo.externalUrl}" type="video/mp4">
                                                <source src="${videoInfo.externalUrl}" type="video/webm">
                                                <source src="${videoInfo.externalUrl}" type="video/ogg">
                                                Your browser does not support the video tag.
                                            </video>
                                            
                                            <!-- Video Number Badge -->
                                            <div class="absolute top-3 left-3">
                                                <span class="bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded-full">
                                                    ${index + 1}
                                                </span>
                                            </div>
                                            
                                            <!-- Platform Badge -->
                                            <div class="absolute top-3 right-3">
                                                <span class="bg-[${primaryColor}] text-white text-xs px-2 py-1 rounded-full capitalize">
                                                    ${videoInfo.platform}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                `;
                            } else {
                                // Fallback for unknown/other links
                                return `
                                    <div class="group relative overflow-hidden rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300">
                                        <div class="relative aspect-video">
                                            <div class="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center">
                                                <div class="text-center text-gray-600">
                                                    <i class="fas fa-link text-4xl mb-3"></i>
                                                    <p class="text-lg font-medium">Video Link</p>
                                                    <p class="text-sm opacity-75 mb-4">Click to open video</p>
                                                    <a href="${videoInfo.externalUrl}" 
                                                       target="_blank" 
                                                       rel="noopener noreferrer"
                                                       class="bg-white text-gray-800 px-6 py-3 rounded-lg font-medium hover:bg-gray-100 transition-colors duration-200 flex items-center gap-2 mx-auto w-fit">
                                                        <i class="fas fa-external-link-alt"></i>
                                                        Open Video
                                                    </a>
                                                </div>
                                                
                                                <!-- Video Number Badge -->
                                                <div class="absolute top-3 left-3">
                                                    <span class="bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded-full">
                                                        ${index + 1}
                                                    </span>
                                                </div>
                                                
                                                <!-- Platform Badge -->
                                                <div class="absolute top-3 right-3">
                                                    <span class="bg-[${primaryColor}] text-white text-xs px-2 py-1 rounded-full capitalize">
                                                        ${videoInfo.platform}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                `;
                            }
                        }).join('')}
                    </div>
                </div>
            ` : `
                <div class="bg-white rounded-2xl shadow-lg p-8 mb-6 text-center">
                    <div class="w-32 h-32 bg-gradient-to-br from-[${primaryColor}] to-[${accentColor}] rounded-full flex items-center justify-center mx-auto mb-6">
                        <i class="fas fa-video text-white text-4xl"></i>
                    </div>
                    <h3 class="text-2xl font-bold text-[${secondaryColor}] mb-3">No Videos Available</h3>
                    <p class="text-gray-600 mb-6">This video gallery doesn't have any videos yet.</p>
                    <button onclick="this.closest('app-video-gallery-view').goBackToList()" 
                            class="inline-flex items-center gap-2 px-6 py-3 border-2 border-[${primaryColor}] text-[${primaryColor}] font-semibold rounded-lg hover:bg-[${primaryColor}] hover:text-[${textColor}] transition-colors">
                        <i class="fas fa-arrow-left"></i>
                        Back to Gallery
                    </button>
                </div>
            `}
        `;
    }
}

customElements.define('app-video-gallery-view', VideoGalleryView);
export default VideoGalleryView; 