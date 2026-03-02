import App from '@/core/App.js';
import '@/components/ui/Modal.js';
import '@/components/ui/Button.js';
import '@/components/ui/Toast.js';
import '@/components/ui/Badge.js';
import api from '@/services/api.js';

/**
 * Video Gallery View Modal Component
 * 
 * Modal for viewing video galleries with embedded videos
 */
class VideoGalleryViewModal extends App {
    constructor() {
        super();
        this.videoGalleryData = null;
        this.loading = false;
        
        this.set('videoGalleryData', null);
        this.set('loading', false);
    }

    connectedCallback() {
        super.connectedCallback();
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Listen for cancel button click
        this.addEventListener('cancel', () => {
            this.close();
        });

        this.addEventListener('click', (e) => {
            const copyButton = e.target.closest('[data-action="copy-link"]');
            if (copyButton) {
                e.preventDefault();
                const link = copyButton.dataset.link;
                this.copyToClipboard(link);
            }

            const shareButton = e.target.closest('[data-action="share-link"]');
            if (shareButton) {
                e.preventDefault();
                const link = shareButton.dataset.link;
                this.shareLink(link);
            }

            const deleteButton = e.target.closest('[data-action="delete-video"]');
            if (deleteButton) {
                e.preventDefault();
                const index = parseInt(deleteButton.dataset.index);
                this.deleteVideo(index);
            }
        });
    }

    setVideoGalleryData(data) {
        this.set('videoGalleryData', data);
    }

    copyToClipboard(text) {
        navigator.clipboard.writeText(text).then(() => {
            Toast.show({
                title: 'Success',
                message: 'Link copied to clipboard',
                variant: 'success',
                duration: 2000
            });
        }).catch(() => {
            Toast.show({
                title: 'Error',
                message: 'Failed to copy link',
                variant: 'error',
                duration: 2000
            });
        });
    }

    shareLink(link) {
        if (navigator.share) {
            navigator.share({
                title: 'Video Gallery',
                text: 'Check out this video gallery',
                url: link
            });
        } else {
            this.copyToClipboard(link);
        }
    }

    async deleteVideo(index) {
        const videoGalleryData = this.get('videoGalleryData');
        if (!videoGalleryData || !videoGalleryData.video_links) return;

        const videoLinks = [...videoGalleryData.video_links];
        const deletedLink = videoLinks[index];
        videoLinks.splice(index, 1);
        
        try {
            this.set('loading', true);

            const token = localStorage.getItem('token');
            if (!token) {
                Toast.show({
                    title: 'Authentication Error',
                    message: 'Please log in to delete video',
                    variant: 'error',
                    duration: 3000
                });
                return;
            }

            const data = {
                name: videoGalleryData.name,
                description: videoGalleryData.description,
                is_active: videoGalleryData.is_active,
                video_links: videoLinks
            };

            const response = await api.withToken(token).put(`/video-galleries/${videoGalleryData.id}`, data);

            Toast.show({
                title: 'Success',
                message: 'Video deleted successfully',
                variant: 'success',
                duration: 3000
            });

            // Update the local data
            videoGalleryData.video_links = videoLinks;
            this.set('videoGalleryData', { ...videoGalleryData });

            // Dispatch event to parent component
            this.dispatchEvent(new CustomEvent('video-gallery-video-deleted', {
                detail: { videoGallery: response.data.data },
                bubbles: true
            }));

        } catch (error) {
            console.error('❌ Error deleting video:', error);
            
            Toast.show({
                title: 'Error',
                message: error.response?.data?.message || 'Failed to delete video',
                variant: 'error',
                duration: 3000
            });
        } finally {
            this.set('loading', false);
        }
    }

    getEmbedUrl(url) {
        if (!url) return null;

        // YouTube
        if (url.includes('youtube.com/watch') || url.includes('youtu.be/')) {
            const videoId = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/)?.[1];
            return videoId ? `https://www.youtube.com/embed/${videoId}` : null;
        }

        // Facebook
        if (url.includes('facebook.com/') && url.includes('/videos/')) {
            const videoId = url.match(/\/videos\/(\d+)/)?.[1];
            return videoId ? `https://www.facebook.com/plugins/video.php?href=https://www.facebook.com/videos/${videoId}` : null;
        }

        // Vimeo
        if (url.includes('vimeo.com/')) {
            const videoId = url.match(/vimeo\.com\/(\d+)/)?.[1];
            return videoId ? `https://player.vimeo.com/video/${videoId}` : null;
        }

        // Dailymotion
        if (url.includes('dailymotion.com/video/')) {
            const videoId = url.match(/dailymotion\.com\/video\/([^_]+)/)?.[1];
            return videoId ? `https://www.dailymotion.com/embed/video/${videoId}` : null;
        }

        return null;
    }

    close() {
        const modal = this.querySelector('ui-modal');
        if (modal) {
            modal.close();
        }
    }

    render() {
        const videoGalleryData = this.get('videoGalleryData');
        const loading = this.get('loading');

        if (!videoGalleryData) {
            return `<ui-modal 
                ${this.hasAttribute('open') ? 'open' : ''} 
                title="View Video Gallery" 
                size="xl"
                close-button="true">
                <div class="text-center py-8 text-gray-500">
                    <p>No video gallery data available</p>
                </div>
            </ui-modal>`;
        }

        return `
            <ui-modal 
                ${this.hasAttribute('open') ? 'open' : ''} 
                title="View Video Gallery" 
                size="xl"
                close-button="true">
                <div>
                    <!-- Video Gallery Title -->
                    <div class="flex items-center gap-3 border-b pb-4">
                        <h3 class="text-xl font-semibold text-gray-900">${videoGalleryData.name || 'N/A'}</h3>
                        <ui-badge color="${videoGalleryData.is_active ? 'success' : 'secondary'}">
                            <i class="fas ${videoGalleryData.is_active ? 'fa-check-circle' : 'fa-times-circle'} mr-1"></i>${videoGalleryData.is_active ? 'Active' : 'Inactive'}
                        </ui-badge>
                    </div>

                    <!-- Video Gallery Information -->
                    <div class="border-b pb-4">
                        <div class="flex items-center gap-2 mb-3">
                            <i class="fas fa-info-circle text-blue-500"></i>
                            <h4 class="text-md font-semibold text-gray-800">Video Gallery Information</h4>
                        </div>
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div class="bg-gray-50 p-3 rounded-lg">
                                <label class="block text-sm font-medium text-gray-700 mb-1">
                                    <i class="fas fa-link mr-1"></i>Slug
                                </label>
                                <p class="text-gray-900 text-sm font-mono">${videoGalleryData.slug || 'N/A'}</p>
                            </div>
                            <div class="bg-gray-50 p-3 rounded-lg">
                                <label class="block text-sm font-medium text-gray-700 mb-1">
                                    <i class="fas fa-toggle-on mr-1"></i>Status
                                </label>
                                <p class="text-gray-900 text-sm">${videoGalleryData.is_active ? 'Active' : 'Inactive'}</p>
                            </div>
                        </div>
                    </div>

                    <!-- Description -->
                    <div class="border-b pb-4">
                        <div class="flex items-center gap-2 mb-3">
                            <i class="fas fa-file-text text-green-500"></i>
                            <h4 class="text-md font-semibold text-gray-800">Description</h4>
                        </div>
                        <div class="bg-gray-50 p-4 rounded-lg">
                            ${videoGalleryData.description ? `
                                <p class="text-gray-900 text-sm whitespace-pre-wrap">${videoGalleryData.description}</p>
                            ` : `
                                <p class="text-gray-500 italic">No description available</p>
                            `}
                        </div>
                    </div>

                    <!-- Videos Section -->
                    <div class="border-b pb-4">
                        <div class="flex items-center gap-2 mb-3">
                            <i class="fas fa-video text-purple-500"></i>
                            <h4 class="text-md font-semibold text-gray-800">Videos (${videoGalleryData.video_links ? videoGalleryData.video_links.length : 0})</h4>
                        </div>
                        ${videoGalleryData.video_links && videoGalleryData.video_links.length > 0 ? `
                            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                                ${videoGalleryData.video_links.map((link, index) => {
                                    const embedUrl = this.getEmbedUrl(link);
                                    return `
                                        <div class="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
                                            <div class="aspect-video bg-gray-100">
                                                ${embedUrl ? `
                                                    <iframe 
                                                        src="${embedUrl}" 
                                                        frameborder="0" 
                                                        allowfullscreen
                                                        class="w-full h-full">
                                                    </iframe>
                                                ` : `
                                                    <div class="flex items-center justify-center h-full">
                                                        <p class="text-gray-500 text-sm">Unsupported video format</p>
                                                    </div>
                                                `}
                                            </div>
                                            <div class="p-4">
                                                <div class="flex items-center justify-between mb-2">
                                                    <span class="text-sm text-gray-600">Video ${index + 1}</span>
                                                    <ui-button
                                                        type="button"
                                                        variant="outline"
                                                        size="sm"
                                                        data-action="delete-video"
                                                        data-index="${index}"
                                                        class="text-red-500 hover:text-red-700">
                                                        <i class="fas fa-trash"></i>
                                                    </ui-button>
                                                </div>
                                                <p class="text-xs text-gray-500 truncate mb-3">${link}</p>
                                                <div class="flex gap-2">
                                                    <ui-button
                                                        type="button"
                                                        variant="outline"
                                                        size="sm"
                                                        data-action="copy-link"
                                                        data-link="${link}"
                                                        class="flex-1">
                                                        <i class="fas fa-copy mr-1"></i>
                                                        Copy
                                                    </ui-button>
                                                    <ui-button
                                                        type="button"
                                                        variant="outline"
                                                        size="sm"
                                                        data-action="share-link"
                                                        data-link="${link}"
                                                        class="flex-1">
                                                        <i class="fas fa-share mr-1"></i>
                                                        Share
                                                    </ui-button>
                                                </div>
                                            </div>
                                        </div>
                                    `;
                                }).join('')}
                            </div>
                        ` : `
                            <div class="w-full h-48 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center">
                                <div class="text-center">
                                    <i class="fas fa-video text-gray-400 text-4xl mb-3"></i>
                                    <p class="text-gray-500 text-sm font-medium">No videos in this gallery</p>
                                    <p class="text-gray-400 text-xs mt-1">Add video links to create a beautiful video gallery</p>
                                </div>
                            </div>
                        `}
                    </div>

                    <!-- Timestamps -->
                    <div>
                        <div class="flex items-center gap-2 mb-3">
                            <i class="fas fa-history text-orange-500"></i>
                            <h4 class="text-md font-semibold text-gray-800">Timestamps</h4>
                        </div>
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div class="bg-gray-50 p-3 rounded-lg">
                                <label class="block text-sm font-medium text-gray-700 mb-1">
                                    <i class="fas fa-plus mr-1"></i>Created
                                </label>
                                <span class="text-gray-900 text-sm">${videoGalleryData.created_at ? new Date(videoGalleryData.created_at).toLocaleString() : 'N/A'}</span>
                            </div>
                            <div class="bg-gray-50 p-3 rounded-lg">
                                <label class="block text-sm font-medium text-gray-700 mb-1">
                                    <i class="fas fa-edit mr-1"></i>Last Updated
                                </label>
                                <span class="text-gray-900 text-sm">${videoGalleryData.updated_at ? new Date(videoGalleryData.updated_at).toLocaleString() : 'N/A'}</span>
                            </div>
                        </div>
                    </div>
                </div>
                <div slot="footer" class="flex justify-end">
                    <ui-button variant="outline" color="secondary" modal-action="cancel">Close</ui-button>
                </div>
            </ui-modal>
        `;
    }
}

customElements.define('video-gallery-view-modal', VideoGalleryViewModal);
export default VideoGalleryViewModal; 