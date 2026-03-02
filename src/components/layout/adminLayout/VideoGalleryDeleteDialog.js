import '@/components/ui/Dialog.js';
import '@/components/ui/Toast.js';
import api from '@/services/api.js';

/**
 * Video Gallery Delete Dialog Component
 * 
 * Dialog for confirming video gallery deletion
 */
class VideoGalleryDeleteDialog extends HTMLElement {
    constructor() {
        super();
        this.videoGalleryData = null;
    }
        
    static get observedAttributes() {
        return ['open'];
    }

    connectedCallback() {
        this.render();
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Listen for confirm button click (Delete Video Gallery)
        this.addEventListener('confirm', () => {
            this.deleteVideoGallery();
        });

        // Listen for cancel button click
        this.addEventListener('cancel', () => {
            this.close();
        });
    }

    open() {
        this.setAttribute('open', '');
    }

    close() {
        this.removeAttribute('open');
    }

    // Set video gallery data for deletion
    setVideoGalleryData(videoGalleryData) {
        this.videoGalleryData = videoGalleryData;
        this.populateDialog();
    }

    // Populate dialog with video gallery data
    populateDialog() {
        if (!this.videoGalleryData) return;

        const videoGalleryNameElement = this.querySelector('#video-gallery-name');
        const videoGallerySlugElement = this.querySelector('#video-gallery-slug');
        const videoGalleryStatusElement = this.querySelector('#video-gallery-status');
        const videoGalleryVideosElement = this.querySelector('#video-gallery-videos');

        if (videoGalleryNameElement) videoGalleryNameElement.textContent = this.videoGalleryData.name || 'Unknown Video Gallery';
        if (videoGallerySlugElement) videoGallerySlugElement.textContent = this.videoGalleryData.slug || 'N/A';
        if (videoGalleryStatusElement) {
            const status = this.videoGalleryData.is_active ? 'Active' : 'Inactive';
            videoGalleryStatusElement.textContent = status;
        }
        if (videoGalleryVideosElement) {
            const videoCount = this.videoGalleryData.video_links ? this.videoGalleryData.video_links.length : 0;
            videoGalleryVideosElement.textContent = `${videoCount} video${videoCount !== 1 ? 's' : ''}`;
        }
    }

    // Delete the video gallery
    async deleteVideoGallery() {
        try {
            if (!this.videoGalleryData) {
            Toast.show({
                title: 'Error',
                    message: 'No video gallery data available for deletion',
                variant: 'error',
                duration: 3000
            });
            return;
        }

            // Get the auth token
            const token = localStorage.getItem('token');
            if (!token) {
                Toast.show({
                    title: 'Authentication Error',
                    message: 'Please log in to delete video gallery',
                    variant: 'error',
                    duration: 3000
                });
                return;
            }

            // Delete the video gallery
            const response = await api.withToken(token).delete(`/video-galleries/${this.videoGalleryData.id}`);

            Toast.show({
                title: 'Success',
                message: 'Video gallery deleted successfully',
                variant: 'success',
                duration: 3000
            });

            // Close dialog and dispatch event
            this.close();
            this.dispatchEvent(new CustomEvent('video-gallery-deleted', {
                detail: { videoGalleryId: this.videoGalleryData.id },
                bubbles: true,
                composed: true
            }));

        } catch (error) {
            console.error('❌ Error deleting video gallery:', error);
            Toast.show({
                title: 'Error',
                message: error.response?.data?.message || 'Failed to delete video gallery',
                variant: 'error',
                duration: 3000
            });
        }
    }

    render() {
        this.innerHTML = `
            <ui-dialog 
                ${this.hasAttribute('open') ? 'open' : ''} 
                title="Delete Video Gallery"
                variant="danger">
                <div slot="content" class="space-y-4">
                    <div class="flex items-center space-x-2 mb-4">
                        <i class="fas fa-exclamation-triangle text-red-500"></i>
                        <span class="font-semibold text-red-900">Delete Video Gallery</span>
                    </div>

                    <p class="text-gray-700">
                        Are you sure you want to delete this video gallery? This action cannot be undone.
                    </p>
                    
                    <div class="bg-red-50 border border-red-200 rounded-lg p-4">
                        <div class="flex items-start space-x-3">
                            <i class="fas fa-video text-red-500 mt-1"></i>
                            <div class="flex-1">
                                <h4 id="video-gallery-name" class="font-semibold text-red-900">Video Gallery Name</h4>
                                <div class="mt-1 text-sm text-red-700">
                                    <span id="video-gallery-slug">Slug</span> • 
                                    <span id="video-gallery-status">Status</span> • 
                                    <span id="video-gallery-videos">Videos</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <p class="text-sm text-gray-600">
                        This will permanently remove the video gallery and all its videos from the system and cannot be recovered.
                    </p>
                </div>
            </ui-dialog>
        `;
    }
}

customElements.define('video-gallery-delete-dialog', VideoGalleryDeleteDialog);
export default VideoGalleryDeleteDialog; 