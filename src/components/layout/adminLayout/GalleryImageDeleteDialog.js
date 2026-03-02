import '@/components/ui/Dialog.js';
import '@/components/ui/Toast.js';
import api from '@/services/api.js';

/**
 * Gallery Image Delete Dialog Component
 * 
 * A dialog component for confirming deletion of individual gallery images
 * 
 * Attributes:
 * - open: boolean - controls dialog visibility
 * 
 * Events:
 * - image-deleted: Fired when an image is successfully deleted
 * - dialog-closed: Fired when dialog is closed
 */
class GalleryImageDeleteDialog extends HTMLElement {
    constructor() {
        super();
        this.galleryData = null;
        this.imageIndex = null;
        this.imagePath = null;
    }

    static get observedAttributes() {
        return ['open'];
    }

    connectedCallback() {
        this.render();
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Listen for confirm button click (Delete Image)
        this.addEventListener('confirm', () => {
            this.deleteImage();
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

    // Set gallery and image data for deletion
    setImageData(galleryData, imageIndex, imagePath) {
        this.galleryData = galleryData;
        this.imageIndex = imageIndex;
        this.imagePath = imagePath;
        this.render();
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

    // Delete the image
    async deleteImage() {
        try {
            // Get the auth token
            const token = localStorage.getItem('token');
            if (!token) {
                Toast.show({
                    title: 'Authentication Error',
                    message: 'Please log in to delete images',
                    variant: 'error',
                    duration: 3000
                });
                return;
            }

            // Delete the image
            const response = await api.withToken(token).delete(`/galleries/${this.galleryData.id}/images/${this.imageIndex}`);
            
            Toast.show({
                title: 'Success',
                message: 'Image deleted successfully',
                variant: 'success',
                duration: 3000
            });

            // Close dialog and dispatch event with the updated data
            this.close();
            this.dispatchEvent(new CustomEvent('image-deleted', {
                detail: { 
                    gallery: response.data.data, 
                    imageIndex: this.imageIndex,
                    imagePath: this.imagePath
                },
                bubbles: true,
                composed: true
            }));

        } catch (error) {
            console.error('❌ Error deleting image:', error);
            Toast.show({
                title: 'Error',
                message: error.response?.data?.message || 'Failed to delete image',
                variant: 'error',
                duration: 3000
            });
        }
    }

    render() {
        const imageUrl = this.imagePath ? this.getImageUrl(this.imagePath) : null;
        
        this.innerHTML = `
            <ui-dialog 
                ${this.hasAttribute('open') ? 'open' : ''} 
                title="Delete Image"
                variant="danger"
                close-button="true"
                style="z-index: 9999;">
                <div slot="content">
                    <div class="space-y-4">
                        <!-- Simple Warning -->
                        <p class="text-gray-700">Are you sure you want to delete this image? This action cannot be undone.</p>

                        <!-- Image Preview -->
                        ${imageUrl ? `
                            <div class="flex justify-center">
                                <img src="${imageUrl}" 
                                     alt="Image to delete" 
                                     class="w-24 h-24 object-cover rounded-lg border border-gray-200">
                            </div>
                        ` : ''}
                    </div>
                </div>
            </ui-dialog>
        `;
    }
}

customElements.define('gallery-image-delete-dialog', GalleryImageDeleteDialog);
export default GalleryImageDeleteDialog; 