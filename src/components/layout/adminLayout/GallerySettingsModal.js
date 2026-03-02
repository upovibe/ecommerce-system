import '@/components/ui/Modal.js';
import '@/components/ui/Toast.js';
import '@/components/ui/Input.js';
import '@/components/ui/Textarea.js';
import '@/components/ui/Switch.js';
import '@/components/ui/FileUpload.js';
import api from '@/services/api.js';

/**
 * Gallery Settings Modal Component
 * 
 * A modal component for adding new galleries in the admin panel
 * 
 * Attributes:
 * - open: boolean - controls modal visibility
 * 
 * Events:
 * - gallery-saved: Fired when a gallery is successfully saved
 * - modal-closed: Fired when modal is closed
 */
class GallerySettingsModal extends HTMLElement {
    constructor() {
        super();
    }

    static get observedAttributes() {
        return ['open'];
    }

    connectedCallback() {
        this.render();
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Listen for confirm button click (Save Gallery)
        this.addEventListener('confirm', () => {
            this.saveGallery();
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

    // Save the new gallery
    async saveGallery() {
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
                    message: 'Please log in to add gallery',
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

            // Create the gallery with multipart data
            const response = await api.withToken(token).post('/galleries', formData);
            
            Toast.show({
                title: 'Success',
                message: 'Gallery created successfully',
                variant: 'success',
                duration: 3000
            });

            // Construct the new gallery data from response
            const newGallery = {
                id: response.data.data?.id || response.data.id,
                name: galleryData.name,
                description: galleryData.description,
                is_active: galleryData.is_active,
                images: response.data.data?.images || [],
                created_at: new Date().toISOString().slice(0, 19).replace('T', ' '),
                updated_at: new Date().toISOString().slice(0, 19).replace('T', ' ')
            };

            // Close modal and dispatch event
            this.close();
            this.dispatchEvent(new CustomEvent('gallery-saved', {
                detail: { gallery: newGallery },
                bubbles: true,
                composed: true
            }));

        } catch (error) {
            console.error('❌ Error saving gallery:', error);
            Toast.show({
                title: 'Error',
                message: error.response?.data?.message || 'Failed to create gallery',
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
                <div slot="title">Gallery Settings</div>
                    <form id="gallery-form" class="space-y-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Gallery Name</label>
                            <ui-input 
                                data-field="name"
                                type="text" 
                                placeholder="Enter gallery name"
                                class="w-full">
                            </ui-input>
                        </div>
                        
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Description</label>
                            <ui-textarea 
                                data-field="description"
                                placeholder="Enter gallery description"
                                rows="4"
                                class="w-full">
                            </ui-textarea>
                        </div>

                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Images</label>
                            <ui-file-upload 
                                data-field="images"
                                accept="image/*"
                                multiple="true"
                                class="w-full">
                            </ui-file-upload>
                            <p class="text-xs text-gray-500 mt-1">You can select multiple images for this gallery</p>
                        </div>

                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Gallery Status</label>
                            <ui-switch 
                                name="is_active"
                                checked
                                class="w-full">
                                <span slot="label">Active</span>
                            </ui-switch>
                        </div>
                    </form>
            </ui-modal>
        `;
    }
}

customElements.define('gallery-settings-modal', GallerySettingsModal);
export default GallerySettingsModal; 