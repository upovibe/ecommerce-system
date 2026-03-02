import '@/components/ui/Modal.js';
import '@/components/ui/Toast.js';
import '@/components/ui/Input.js';
import '@/components/ui/Textarea.js';
import '@/components/ui/Switch.js';
import '@/components/ui/FileUpload.js';
import api from '@/services/api.js';

/**
 * Gallery Update Modal Component
 * 
 * A modal component for updating existing galleries in the admin panel
 * 
 * Attributes:
 * - open: boolean - controls modal visibility
 * 
 * Events:
 * - gallery-updated: Fired when a gallery is successfully updated
 * - modal-closed: Fired when modal is closed
 */
class GalleryUpdateModal extends HTMLElement {
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
        // Listen for confirm button click (Update Gallery)
        this.addEventListener('confirm', () => {
            this.updateGallery();
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

    // Set gallery data for editing
    setGalleryData(galleryData) {
        this.galleryData = galleryData;
        // Re-render the modal with the new data
        this.render();
        
        // Set the images value in the file upload component after render
        setTimeout(() => {
            const imagesFileUpload = this.querySelector('ui-file-upload[data-field="images"]');
            if (imagesFileUpload && galleryData.images && galleryData.images.length > 0) {
                imagesFileUpload.setValue(galleryData.images);
            }
        }, 0); // Increased timeout to ensure DOM is ready
    }

    // Update the gallery
    async updateGallery() {
        try {
            // Get form data using the data-field attributes for reliable selection
            const nameInput = this.querySelector('ui-input[data-field="name"]');
            const descriptionTextarea = this.querySelector('ui-textarea[data-field="description"]');
            const isActiveSwitch = this.querySelector('ui-switch[name="is_active"]');
            const imagesFileUpload = this.querySelector('ui-file-upload[data-field="images"]');

            const galleryData = {
                name: nameInput ? nameInput.value : '',
                description: descriptionTextarea ? descriptionTextarea.value : '',
                is_active: isActiveSwitch ? (isActiveSwitch.checked ? 1 : 0) : 1
            };

            // Validate required fields
            if (!galleryData.name) {
                Toast.show({
                    title: 'Validation Error',
                    message: 'Please fill in the gallery name',
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
                    message: 'Please log in to update gallery',
                    variant: 'error',
                    duration: 3000
                });
                return;
            }

            // Prepare form data for multipart request
            const formData = new FormData();
            
            // Add all form fields
            Object.keys(galleryData).forEach(key => {
                formData.append(key, galleryData[key]);
            });
            
            // Add images files if selected
            if (imagesFileUpload && imagesFileUpload.getFiles().length > 0) {
                const files = imagesFileUpload.getFiles();
                // Filter out existing files (which are strings/paths) and only include new File objects
                const newFiles = files.filter(file => file instanceof File);
                newFiles.forEach(file => {
                    formData.append('images[]', file, file.name);
                });
            }

            // Update the gallery with multipart data
            let response;
            try {
                response = await api.withToken(token).put(`/galleries/${this.galleryData.id}`, formData);
            } catch (apiError) {
                throw apiError;
            }
            
            Toast.show({
                title: 'Success',
                message: 'Gallery updated successfully',
                variant: 'success',
                duration: 3000
            });

            // Close modal and dispatch event with the updated data from the server
            this.close();
            this.dispatchEvent(new CustomEvent('gallery-updated', {
                detail: { gallery: response.data.data },
                bubbles: true,
                composed: true
            }));

        } catch (error) {
            console.error('❌ Error updating gallery:', error);
            Toast.show({
                title: 'Error',
                message: error.response?.data?.message || 'Failed to update gallery',
                variant: 'error',
                duration: 3000
            });
        }
    }

    render() {
        this.innerHTML = `
            <ui-modal 
                ${this.hasAttribute('open') ? 'open' : ''} 
                position="right" 
                close-button="true">
                <div slot="title">Update Gallery</div>
                    <form id="gallery-update-form" class="space-y-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Gallery Name</label>
                            <ui-input 
                                data-field="name"
                                type="text" 
                                placeholder="Enter gallery name"
                                value="${this.galleryData?.name || ''}"
                                class="w-full">
                            </ui-input>
                        </div>
                        
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Description</label>
                            <ui-textarea 
                                data-field="description"
                                placeholder="Enter gallery description"
                                rows="4"
                                value="${this.galleryData?.description || ''}"
                                class="w-full">
                            </ui-textarea>
                        </div>

                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Images</label>
                            <ui-file-upload 
                                data-field="images"
                                accept="image/*"
                                multiple="true"
                                value="${this.galleryData?.images ? JSON.stringify(this.galleryData.images) : ''}"
                                class="w-full">
                            </ui-file-upload>
                            <p class="text-xs text-gray-500 mt-1">You can select multiple images for this gallery</p>
                        </div>

                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Gallery Status</label>
                            <ui-switch 
                                name="is_active"
                                ${this.galleryData?.is_active == 1 ? 'checked' : ''}
                                class="w-full">
                                <span slot="label">Active</span>
                            </ui-switch>
                        </div>
                    </form>
            </ui-modal>
        `;
    }
}

customElements.define('gallery-update-modal', GalleryUpdateModal);
export default GalleryUpdateModal; 