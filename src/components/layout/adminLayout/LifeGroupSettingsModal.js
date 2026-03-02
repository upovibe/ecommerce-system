import '@/components/ui/Modal.js';
import '@/components/ui/Toast.js';
import '@/components/ui/Input.js';
import '@/components/ui/Textarea.js';
import '@/components/ui/Switch.js';
import '@/components/ui/FileUpload.js';
import api from '@/services/api.js';

/**
 * Life Group Settings Modal Component
 * 
 * A modal component for adding new life groups in the admin panel
 * 
 * Attributes:
 * - open: boolean - controls modal visibility
 * 
 * Events:
 * - life-group-saved: Fired when a life group is successfully saved
 * - modal-closed: Fired when modal is closed
 */
class LifeGroupSettingsModal extends HTMLElement {
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
        // Listen for confirm button click (Save Life Group)
        this.addEventListener('confirm', () => {
            this.saveLifeGroup();
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

    // Save the new life group
    async saveLifeGroup() {
        try {
            // Get form data using the data-field attributes for reliable selection
            const titleInput = this.querySelector('ui-input[data-field="title"]');
            const descriptionTextarea = this.querySelector('ui-textarea[data-field="description"]');
            const linkInput = this.querySelector('ui-input[data-field="link"]');
            const isActiveSwitch = this.querySelector('ui-switch[name="is_active"]');
            const bannerFileUpload = this.querySelector('ui-file-upload[data-field="banner"]');

            const lifeGroupData = {
                title: titleInput ? titleInput.value : '',
                description: descriptionTextarea ? descriptionTextarea.value : '',
                link: linkInput ? linkInput.value : '',
                is_active: isActiveSwitch ? (isActiveSwitch.checked ? 1 : 0) : 1
            };

            console.log('Life group data being sent:', lifeGroupData); // Debug log

            // Validate required fields
            if (!lifeGroupData.title) {
                Toast.show({
                    title: 'Validation Error',
                    message: 'Please fill in the life group title',
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
                    message: 'Please log in to create life groups',
                    variant: 'error',
                    duration: 3000
                });
                return;
            }

            Toast.show({
                title: 'Adding Life Group',
                message: 'Please wait...',
                variant: 'info',
                duration: 2000
            });

            // Prepare form data for file upload
            const formData = new FormData();
            
            // Add text fields
            Object.keys(lifeGroupData).forEach(key => {
                formData.append(key, lifeGroupData[key]);
            });

            // Add banner file if selected
            if (bannerFileUpload && bannerFileUpload.getFiles().length > 0) {
                formData.append('banner', bannerFileUpload.getFiles()[0]);
            }

            // Show loading toast
            Toast.show({
                title: 'Adding Life Group',
                message: 'Please wait...',
                variant: 'info',
                duration: 2000
            });

            // Create the life group
            const response = await api.withToken(token).post('/life-groups', formData);

            if (response.data.success) {
                Toast.show({
                    title: 'Life Group Added!',
                    message: `"${lifeGroupData.title}" has been successfully added to the life groups.`,
                    variant: 'success',
                    duration: 5000
                });

                // Dispatch event with the created life group data
                this.dispatchEvent(new CustomEvent('life-group-saved', {
                    detail: { lifeGroup: response.data.data },
                    bubbles: true
                }));

                // Close the modal
                this.close();
            } else {
                Toast.show({
                    title: 'Error',
                    message: response.data.message || 'Failed to create life group',
                    variant: 'error',
                    duration: 3000
                });
            }

        } catch (error) {
            console.error('❌ Error creating life group:', error);
            
            Toast.show({
                title: 'Error',
                message: error.response?.data?.message || 'Failed to create life group',
                variant: 'error',
                duration: 3000
            });
        }
    }

    render() {
        this.innerHTML = `
            <ui-modal 
                title="Add New Life Group"
                size="lg"
                ${this.hasAttribute('open') ? 'open' : ''}>
                
                <div class="space-y-6">
                    <!-- Title -->
                    <div>
                        <label for="title" class="block text-sm font-medium text-gray-700 mb-2">
                            Title <span class="text-red-500">*</span>
                        </label>
                        <ui-input
                            data-field="title"
                            type="text"
                            placeholder="Enter life group title"
                            required>
                        </ui-input>
                    </div>

                    <!-- Description -->
                    <div>
                        <label for="description" class="block text-sm font-medium text-gray-700 mb-2">
                            Description
                        </label>
                        <ui-textarea
                            data-field="description"
                            placeholder="Enter life group description"
                            rows="4">
                        </ui-textarea>
                    </div>

                    <!-- Link -->
                    <div>
                        <label for="link" class="block text-sm font-medium text-gray-700 mb-2">
                            Link
                        </label>
                        <ui-input
                            data-field="link"
                            type="url"
                            placeholder="https://example.com">
                        </ui-input>
                    </div>

                    <!-- Banner Upload -->
                    <div>
                        <label for="banner" class="block text-sm font-medium text-gray-700 mb-2">
                            Banner Image
                        </label>
                        <ui-file-upload
                            data-field="banner"
                            accept="image/*"
                            multiple="false"
                            placeholder="Upload banner image">
                        </ui-file-upload>
                    </div>

                    <!-- Active Status -->
                    <div>
                        <label class="flex items-center">
                            <ui-switch name="is_active" checked></ui-switch>
                            <span class="ml-2 text-sm text-gray-700">Active</span>
                        </label>
                    </div>
                </div>
            </ui-modal>
        `;
    }
}

customElements.define('life-group-settings-modal', LifeGroupSettingsModal);
export default LifeGroupSettingsModal; 