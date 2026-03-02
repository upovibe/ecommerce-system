import '@/components/ui/Dialog.js';
import '@/components/ui/Toast.js';
import api from '@/services/api.js';

/**
 * Gallery Delete Dialog Component
 * 
 * A dialog component for confirming gallery deletion in the admin panel
 * 
 * Attributes:
 * - open: boolean - controls dialog visibility
 * 
 * Events:
 * - gallery-deleted: Fired when a gallery is successfully deleted
 * - modal-closed: Fired when dialog is closed
 */
class GalleryDeleteDialog extends HTMLElement {
    constructor() {
        super();
        this.galleryData = null;
    }

    static get observedAttributes() {
        return ['open'];
    }

    connectedCallback() {
        this.render();
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Listen for confirm button click (Delete Gallery)
        this.addEventListener('confirm', () => {
            this.deleteGallery();
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

    // Set gallery data for deletion
    setGalleryData(galleryData) {
        this.galleryData = galleryData;
        this.populateDialog();
    }

    // Populate dialog with gallery data
    populateDialog() {
        if (!this.galleryData) return;

        const galleryNameElement = this.querySelector('#gallery-name');
        const gallerySlugElement = this.querySelector('#gallery-slug');
        const galleryStatusElement = this.querySelector('#gallery-status');
        const galleryImagesElement = this.querySelector('#gallery-images');

        if (galleryNameElement) galleryNameElement.textContent = this.galleryData.name || 'Unknown Gallery';
        if (gallerySlugElement) gallerySlugElement.textContent = this.galleryData.slug || 'N/A';
        if (galleryStatusElement) {
            const status = this.galleryData.is_active ? 'Active' : 'Inactive';
            galleryStatusElement.textContent = status;
        }
        if (galleryImagesElement) {
            const imageCount = this.galleryData.images ? this.galleryData.images.length : 0;
            galleryImagesElement.textContent = `${imageCount} image${imageCount !== 1 ? 's' : ''}`;
        }
    }

    // Delete the gallery
    async deleteGallery() {
        try {
            if (!this.galleryData) {
                Toast.show({
                    title: 'Error',
                    message: 'No gallery data available for deletion',
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
                    message: 'Please log in to delete gallery',
                    variant: 'error',
                    duration: 3000
                });
                return;
            }

            // Delete the gallery
            const response = await api.withToken(token).delete(`/galleries/${this.galleryData.id}`);
            
            Toast.show({
                title: 'Success',
                message: 'Gallery deleted successfully',
                variant: 'success',
                duration: 3000
            });

            // Close dialog and dispatch event
            this.close();
            this.dispatchEvent(new CustomEvent('gallery-deleted', {
                detail: { galleryId: this.galleryData.id },
                bubbles: true,
                composed: true
            }));

        } catch (error) {
            console.error('❌ Error deleting gallery:', error);
            Toast.show({
                title: 'Error',
                message: error.response?.data?.message || 'Failed to delete gallery',
                variant: 'error',
                duration: 3000
            });
        }
    }

    render() {
        this.innerHTML = `
            <ui-dialog 
                ${this.hasAttribute('open') ? 'open' : ''} 
                title="Delete Gallery"
                variant="danger">
                <div slot="content" class="space-y-4">
                    <div class="flex items-center space-x-2 mb-4">
                        <i class="fas fa-exclamation-triangle text-red-500"></i>
                        <span class="font-semibold text-red-900">Delete Gallery</span>
                    </div>
                    
                    <p class="text-gray-700">
                        Are you sure you want to delete this gallery? This action cannot be undone.
                    </p>
                    
                    <div class="bg-red-50 border border-red-200 rounded-lg p-4">
                        <div class="flex items-start space-x-3">
                            <i class="fas fa-images text-red-500 mt-1"></i>
                            <div class="flex-1">
                                <h4 id="gallery-name" class="font-semibold text-red-900">Gallery Name</h4>
                                <div class="mt-1 text-sm text-red-700">
                                    <span id="gallery-slug">Slug</span> • 
                                    <span id="gallery-status">Status</span> • 
                                    <span id="gallery-images">Images</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <p class="text-sm text-gray-600">
                        This will permanently remove the gallery and all its images from the system and cannot be recovered.
                    </p>
                </div>
            </ui-dialog>
        `;
    }
}

customElements.define('gallery-delete-dialog', GalleryDeleteDialog);
export default GalleryDeleteDialog; 