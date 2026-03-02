import '@/components/ui/Modal.js';
import '@/components/ui/Toast.js';
import '@/components/ui/Badge.js';
import '@/components/layout/adminLayout/GalleryImageDeleteDialog.js';

/**
 * Gallery View Modal Component
 * 
 * A modal component for viewing gallery details and images in the admin panel
 * 
 * Attributes:
 * - open: boolean - controls modal visibility
 * 
 * Events:
 * - modal-closed: Fired when modal is closed
 */
class GalleryViewModal extends HTMLElement {
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
        // Listen for close button click (cancel)
        this.addEventListener('cancel', () => {
            this.close();
        });

        // Listen for confirm button click (close)
        this.addEventListener('confirm', () => {
            this.close();
        });

        // Listen for image delete events
        this.addEventListener('click', (e) => {
            if (e.target.closest('.delete-image-btn')) {
                e.preventDefault();
                const imageIndex = parseInt(e.target.closest('.delete-image-btn').dataset.imageIndex);
                const imagePath = this.galleryData.images[imageIndex];
                this.showDeleteDialog(imageIndex, imagePath);
            }
        });

        // Listen for image deleted event from dialog
        this.addEventListener('image-deleted', (event) => {
            // Update the gallery data with the response
            this.galleryData = event.detail.gallery;
            
            // Re-render the modal
            this.render();
            
            // Dispatch event to notify parent components
            this.dispatchEvent(new CustomEvent('gallery-image-deleted', {
                detail: { gallery: this.galleryData, imageIndex: event.detail.imageIndex },
                bubbles: true,
                composed: true
            }));
        });
    }

    open() {
        this.setAttribute('open', '');
    }

    close() {
        this.removeAttribute('open');
    }

    // Set gallery data for viewing
    setGalleryData(galleryData) {
        this.galleryData = galleryData;
        // Re-render the modal with the new data
        this.render();
    }

    // Show delete dialog for image
    showDeleteDialog(imageIndex, imagePath) {
        const deleteDialog = this.querySelector('gallery-image-delete-dialog');
        if (deleteDialog) {
            deleteDialog.setImageData(this.galleryData, imageIndex, imagePath);
            deleteDialog.open();
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
        
        // For relative paths like "uploads/galleries/filename.jpg"
        // Construct the URL by adding the base URL and /api
        const baseUrl = window.location.origin;
        const apiPath = '/api';
        return baseUrl + apiPath + '/' + imagePath;
    }

    // Helper method to get status badge color
    getStatusBadgeColor(isActive) {
        return isActive ? 'success' : 'secondary';
    }

    // Helper method to get status icon
    getStatusIcon(isActive) {
        return isActive ? 'fa-check-circle' : 'fa-times-circle';
    }

    render() {
        this.innerHTML = `
            <ui-modal 
                ${this.hasAttribute('open') ? 'open' : ''} 
                position="right" 
                size="lg"
                close-button="true">
                <div slot="title">View Gallery Details</div>
                
                <div>
                    ${this.galleryData ? `
                        <!-- Gallery Title -->
                        <div class="flex items-center gap-3 border-b pb-4">
                            <h3 class="text-xl font-semibold text-gray-900">${this.galleryData.name || 'N/A'}</h3>
                            <ui-badge color="${this.getStatusBadgeColor(this.galleryData.is_active)}">
                                <i class="fas ${this.getStatusIcon(this.galleryData.is_active)} mr-1"></i>${this.galleryData.is_active ? 'Active' : 'Inactive'}
                            </ui-badge>
                        </div>

                        <!-- Gallery Information -->
                        <div class="border-b pb-4">
                            <div class="flex items-center gap-2 mb-3">
                                <i class="fas fa-info-circle text-blue-500"></i>
                                <h4 class="text-md font-semibold text-gray-800">Gallery Information</h4>
                            </div>
                            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div class="bg-gray-50 p-3 rounded-lg">
                                    <label class="block text-sm font-medium text-gray-700 mb-1">
                                        <i class="fas fa-link mr-1"></i>Slug
                                    </label>
                                    <p class="text-gray-900 text-sm font-mono">${this.galleryData.slug || 'N/A'}</p>
                                </div>
                                <div class="bg-gray-50 p-3 rounded-lg">
                                    <label class="block text-sm font-medium text-gray-700 mb-1">
                                        <i class="fas fa-toggle-on mr-1"></i>Status
                                    </label>
                                    <p class="text-gray-900 text-sm">${this.galleryData.is_active ? 'Active' : 'Inactive'}</p>
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
                                ${this.galleryData.description ? `
                                    <p class="text-gray-900 text-sm whitespace-pre-wrap">${this.galleryData.description}</p>
                                ` : `
                                    <p class="text-gray-500 italic">No description available</p>
                                `}
                            </div>
                        </div>

                        <!-- Images Gallery -->
                        <div class="border-b pb-4">
                            <div class="flex items-center gap-2 mb-3">
                                <i class="fas fa-images text-purple-500"></i>
                                <h4 class="text-md font-semibold text-gray-800">Images (${this.galleryData.images ? this.galleryData.images.length : 0})</h4>
                            </div>
                            ${this.galleryData.images && this.galleryData.images.length > 0 ? `
                                <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                    ${this.galleryData.images.map((image, index) => `
                                        <div class="relative group">
                                            <div class="relative w-full h-32">
                                                <img src="${this.getImageUrl(image)}" 
                                                     alt="Gallery Image ${index + 1}" 
                                                     class="w-full h-full object-cover rounded-lg border border-gray-200"
                                                     onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
                                                <div class="absolute inset-0 hidden items-center justify-center bg-gray-50 rounded-lg border border-gray-200">
                                                    <div class="text-center">
                                                        <i class="fas fa-image text-gray-400 text-lg mb-1"></i>
                                                        <p class="text-gray-500 text-xs">Image not found</p>
                                                    </div>
                                                </div>
                                            </div>
                                            <div class="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                                                <button onclick="window.open('${this.getImageUrl(image)}', '_blank')" 
                                                        class="bg-white bg-opacity-90 text-blue-500 hover:text-blue-700 text-xs px-2 py-1 rounded border border-blue-200 hover:bg-blue-50">
                                                    <i class="fas fa-external-link-alt"></i>
                                                </button>
                                                <button class="delete-image-btn bg-white bg-opacity-90 text-red-500 hover:text-red-700 text-xs px-2 py-1 rounded border border-red-200 hover:bg-red-50"
                                                        data-image-index="${index}">
                                                    <i class="fas fa-trash"></i>
                                                </button>
                                            </div>
                                            <div class="absolute bottom-2 left-2">
                                                <span class="bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">${index + 1}</span>
                                            </div>
                                        </div>
                                    `).join('')}
                                </div>
                            ` : `
                                <div class="w-full h-48 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center">
                                    <div class="text-center">
                                        <i class="fas fa-images text-gray-400 text-4xl mb-3"></i>
                                        <p class="text-gray-500 text-sm font-medium">No images in this gallery</p>
                                        <p class="text-gray-400 text-xs mt-1">Upload images to create a beautiful gallery</p>
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
                                    <span class="text-gray-900 text-sm">${this.galleryData.created_at ? new Date(this.galleryData.created_at).toLocaleString() : 'N/A'}</span>
                                </div>
                                <div class="bg-gray-50 p-3 rounded-lg">
                                    <label class="block text-sm font-medium text-gray-700 mb-1">
                                        <i class="fas fa-edit mr-1"></i>Last Updated
                                    </label>
                                    <span class="text-gray-900 text-sm">${this.galleryData.updated_at ? new Date(this.galleryData.updated_at).toLocaleString() : 'N/A'}</span>
                                </div>
                            </div>
                        </div>
                    ` : `
                        <div class="text-center py-8 text-gray-500">
                            <i class="fas fa-image text-4xl mb-4"></i>
                            <p>No gallery data available</p>
                        </div>
                    `}
                </div>
                <div slot="footer" class="flex justify-end">
                    <ui-button variant="outline" color="secondary" modal-action="cancel">Close</ui-button>
                </div>
            </ui-modal>
            
            <!-- Image Delete Dialog -->
            <gallery-image-delete-dialog></gallery-image-delete-dialog>
        `;
    }
}

customElements.define('gallery-view-modal', GalleryViewModal);
export default GalleryViewModal; 