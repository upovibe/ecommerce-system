import '@/components/ui/Modal.js';
import '@/components/ui/Toast.js';
import '@/components/ui/Input.js';
import '@/components/ui/Textarea.js';
import '@/components/ui/Switch.js';
import '@/components/ui/Button.js';
import '@/components/ui/FileUpload.js';
import api from '@/services/api.js';

/**
 * Give Settings Modal Component
 * 
 * A modal component for adding new give entries (payment methods) in the admin panel
 */
class GiveSettingsModal extends HTMLElement {
    constructor() {
        super();
        this.links = [''];
        this.saveGiveEntry = this.saveGiveEntry.bind(this);
    }

    static get observedAttributes() {
        return ['open'];
    }

    connectedCallback() {
        this.render();
        this.setupEventListeners();
    }

    disconnectedCallback() {
        // Clean up event listeners to prevent duplicates
        this.removeEventListener('confirm', this.saveGiveEntry);
        this.removeEventListener('cancel', this.close);
        this.removeEventListener('click', this.handleClick);
    }

    setupEventListeners() {
        // Remove existing listeners first to prevent duplicates
        this.removeEventListener('confirm', this.saveGiveEntry);
        this.removeEventListener('cancel', this.close);
        this.removeEventListener('click', this.handleClick);

        this.addEventListener('confirm', this.saveGiveEntry);
        this.addEventListener('cancel', () => this.close());
        this.addEventListener('click', this.handleClick);
    }

    handleClick = (e) => {
        if (e.target.closest('[data-action="add-link"]')) {
            e.preventDefault();
            this.addLink();
        }
        if (e.target.closest('[data-action="remove-link"]')) {
            e.preventDefault();
            const index = parseInt(e.target.closest('[data-action="remove-link"]').dataset.index, 10);
            this.removeLink(index);
        }
    }

    open() {
        this.setAttribute('open', '');
    }

    close() {
        this.removeAttribute('open');
        this.links = ['']; // Reset state
        this.render(); // Re-render to clear the form
    }

    // Helper to read the current values from the DOM into our state array
    _syncLinksFromDOM() {
        const linkInputs = this.querySelectorAll('input[data-link-index]');
        this.links = Array.from(linkInputs).map(input => input.value || '');
    }

    addLink() {
        this._syncLinksFromDOM(); // Save current values before adding a new one
        this.links.push('');
        this.render();
    }

    removeLink(index) {
        this._syncLinksFromDOM(); // Save current values before removing one
        if (this.links.length > 1) {
            this.links.splice(index, 1);
            this.render();
        }
    }

    async saveGiveEntry() {
        this._syncLinksFromDOM(); // Get the latest values before saving

        try {
            const titleInput = this.querySelector('ui-input[data-field="title"]');
            const textTextarea = this.querySelector('ui-textarea[data-field="text"]');
            const isActiveSwitch = this.querySelector('ui-switch[name="is_active"]');
            const imageFileUpload = this.querySelector('ui-file-upload[data-field="banner"]');

            const filteredLinks = this.links.filter(link => link && link.trim() !== '');

            const giveData = {
                title: titleInput ? titleInput.value : '',
                text: textTextarea ? textTextarea.value : '',
                is_active: isActiveSwitch ? (isActiveSwitch.checked ? 1 : 0) : 1,
                links: filteredLinks
            };

            // Validate required fields
            if (!giveData.title) {
                Toast.show({ 
                    title: 'Validation Error', 
                    message: 'Please fill in the title', 
                    variant: 'error' 
                });
                return;
            }

            if (!giveData.text) {
                Toast.show({ 
                    title: 'Validation Error', 
                    message: 'Please fill in the description', 
                    variant: 'error' 
                });
                return;
            }

            if (filteredLinks.length === 0) {
                Toast.show({ 
                    title: 'Validation Error', 
                    message: 'At least one payment link is required', 
                    variant: 'error' 
                });
                return;
            }

            const token = localStorage.getItem('token');
            if (!token) {
                Toast.show({ 
                    title: 'Authentication Error', 
                    message: 'Please log in', 
                    variant: 'error' 
                });
                return;
            }

            // Prepare form data for multipart request
            const formData = new FormData();
            
            // Add all form fields
            Object.keys(giveData).forEach(key => {
                if (key === 'links') {
                    formData.append(key, JSON.stringify(giveData[key]));
                } else {
                    formData.append(key, giveData[key]);
                }
            });
            
            // Add banner file if selected
            if (imageFileUpload && imageFileUpload.getFiles().length > 0) {
                const files = imageFileUpload.getFiles();
                // Filter out existing files (which are strings/paths) and only include new File objects
                const newFiles = files.filter(file => file instanceof File);
                newFiles.forEach(file => {
                    formData.append('banner', file, file.name);
                });
            }

            const response = await api.withToken(token).post('/give', formData);
            
            Toast.show({ 
                title: 'Success', 
                message: 'Give entry created successfully', 
                variant: 'success' 
            });

            const newGiveEntry = response.data.data;

            this.dispatchEvent(new CustomEvent('give-saved', {
                detail: { giveEntry: newGiveEntry },
                bubbles: true,
                composed: true
            }));
            this.close();

        } catch (error) {
            console.error('❌ Error saving give entry:', error);
            Toast.show({ 
                title: 'Error', 
                message: error.response?.data?.message || 'Failed to create give entry', 
                variant: 'error' 
            });
        }
    }

    render() {
        this.innerHTML = `
            <ui-modal 
                ${this.hasAttribute('open') ? 'open' : ''} 
                position="right" 
                close-button="true">
                <div slot="title">Give Settings</div>
                <form id="give-form" class="space-y-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Title</label>
                        <ui-input 
                            data-field="title"
                            type="text" 
                            placeholder="Enter payment method title (e.g., Paystack, Stripe)"
                            class="w-full">
                        </ui-input>
                    </div>
                    
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Description</label>
                        <ui-textarea 
                            data-field="text"
                            placeholder="Enter description for this payment method"
                            rows="4"
                            class="w-full">
                        </ui-textarea>
                    </div>

                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">QR Code Image</label>
                        <ui-file-upload 
                            data-field="banner"
                            accept="image/*"
                            multiple="false"
                            class="w-full">
                        </ui-file-upload>
                        <p class="text-xs text-gray-500 mt-1">Upload QR code image for this payment method</p>
                    </div>

                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Payment Links</label>
                        <div class="space-y-2" id="links-container">
                            ${this.links.map((link, index) => `
                                <div class="flex gap-2 items-center">
                                    <div class="flex-1">
                                        <input
                                            type="url"
                                            placeholder="Enter payment URL"
                                            value="${link}"
                                            data-link-index="${index}"
                                            class="w-full upo-input-default">
                                    </div>
                                    ${this.links.length > 1 ? `
                                        <ui-button
                                            type="button"
                                            variant="danger-outline"
                                            size="sm"
                                            data-action="remove-link"
                                            data-index="${index}"
                                            class="px-3">
                                            <i class="fas fa-trash"></i>
                                        </ui-button>
                                    ` : ''}
                                </div>
                            `).join('')}
                        </div>
                        <div class="flex justify-end mt-2">
                            <ui-button
                                type="button"
                                variant="outline"
                                size="sm"
                                data-action="add-link"
                                class="px-3">
                                <i class="fas fa-plus mr-1"></i>
                                Add Link
                            </ui-button>
                        </div>
                        <p class="text-xs text-gray-500 mt-1">Add payment links for this method (e.g., Paystack, Stripe, Mobile Money URLs)</p>
                    </div>

                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Status</label>
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
        // Don't re-attach listeners here as they're already attached in connectedCallback
    }
}

customElements.define('give-settings-modal', GiveSettingsModal);
export default GiveSettingsModal;
