import '@/components/ui/Modal.js';
import '@/components/ui/Button.js';
import '@/components/ui/Input.js';
import '@/components/ui/Textarea.js';
import '@/components/ui/Toast.js';
import '@/components/ui/Switch.js';
import '@/components/ui/FileUpload.js';
import api from '@/services/api.js';

/**
 * Give Update Modal Component
 * 
 * Modal for updating existing give entries (payment methods)
 */
class GiveUpdateModal extends HTMLElement {
    constructor() {
        super();
        this.giveData = null;
        this.links = [''];
        this.handleSubmit = this.handleSubmit.bind(this);
    }

    connectedCallback() {
        // Initial render can be empty or a placeholder
        this.innerHTML = ''; 
        this.setupEventListeners();
    }

    disconnectedCallback() {
        // Clean up event listeners to prevent duplicates
        this.removeEventListener('confirm', this.handleSubmit);
        this.removeEventListener('cancel', this.close);
        this.removeEventListener('click', this.handleClick);
    }

    setupEventListeners() {
        // Remove existing listeners first to prevent duplicates
        this.removeEventListener('confirm', this.handleSubmit);
        this.removeEventListener('cancel', this.close);
        this.removeEventListener('click', this.handleClick);

        this.addEventListener('confirm', this.handleSubmit);
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

    setGiveData(data) {
        this.giveData = data;
        this.links = (data && data.links && data.links.length > 0) ? [...data.links] : [''];
        this.render();
        
        // Set the image value in the file upload component after render
        setTimeout(() => {
            const imageFileUpload = this.querySelector('ui-file-upload[data-field="banner"]');
            if (imageFileUpload && data.image) {
                imageFileUpload.setValue(data.image);
            }
        }, 100);
    }

    open() {
        this.setAttribute('open', '');
    }

    close() {
        this.removeAttribute('open');
    }

    _syncLinksFromDOM() {
        const linkInputs = this.querySelectorAll('input[data-link-index]');
        this.links = Array.from(linkInputs).map(input => input.value || '');
    }

    addLink() {
        this._syncLinksFromDOM();
        this.links.push('');
        this.render();
    }

    removeLink(index) {
        this._syncLinksFromDOM();
        if (this.links.length > 1) {
            this.links.splice(index, 1);
            this.render();
        }
    }

    async handleSubmit() {
        this._syncLinksFromDOM();

        if (!this.giveData || !this.giveData.id) {
            Toast.show({ title: 'Error', message: 'Give entry data not found', variant: 'error' });
            return;
        }

        try {
            const titleInput = this.querySelector('ui-input[data-field="title"]');
            const textTextarea = this.querySelector('ui-textarea[data-field="text"]');
            const isActiveSwitch = this.querySelector('ui-switch[name="is_active"]');
            const imageFileUpload = this.querySelector('ui-file-upload[data-field="banner"]');

            const filteredLinks = this.links.filter(link => link && link.trim() !== '');

            const data = {
                title: titleInput ? titleInput.value : '',
                text: textTextarea ? textTextarea.value : '',
                is_active: isActiveSwitch ? (isActiveSwitch.checked ? 1 : 0) : 1,
                links: filteredLinks
            };

            if (!data.title || !data.title.trim()) {
                Toast.show({ title: 'Validation Error', message: 'Title is required', variant: 'error' });
                return;
            }

            if (!data.text || !data.text.trim()) {
                Toast.show({ title: 'Validation Error', message: 'Description is required', variant: 'error' });
                return;
            }

            if (filteredLinks.length === 0) {
                Toast.show({ title: 'Validation Error', message: 'At least one payment link is required', variant: 'error' });
                return;
            }

            const token = localStorage.getItem('token');
            if (!token) {
                Toast.show({ title: 'Authentication Error', message: 'Please log in to update', variant: 'error' });
                return;
            }

            // Show loading toast
            Toast.show({
                title: 'Updating Give Entry',
                message: 'Please wait...',
                variant: 'info',
                duration: 2000
            });

            // Prepare form data for multipart request
            const formData = new FormData();
            
            // Add all form fields
            Object.keys(data).forEach(key => {
                if (key === 'links') {
                    formData.append(key, JSON.stringify(data[key]));
                } else {
                    formData.append(key, data[key]);
                }
            });
            
            // Add banner files if selected
            if (imageFileUpload && imageFileUpload.getFiles().length > 0) {
                const files = imageFileUpload.getFiles();
                // Filter out existing files (which are strings/paths) and only include new File objects
                const newFiles = files.filter(file => file instanceof File);
                newFiles.forEach(file => {
                    formData.append('banner', file, file.name);
                });
            }

            const response = await api.withToken(token).put(`/give/${this.giveData.id}`, formData);

            Toast.show({ 
                title: 'Give Entry Updated!', 
                message: `"${data.title}" has been successfully updated.`, 
                variant: 'success', 
                duration: 5000 
            });

            this.dispatchEvent(new CustomEvent('give-updated', {
                detail: { giveEntry: response.data.data },
                bubbles: true,
                composed: true
            }));

            this.close();

        } catch (error) {
            console.error('❌ Error updating give entry:', error);
            Toast.show({ title: 'Error', message: error.response?.data?.message || 'Failed to update give entry', variant: 'error' });
        }
    }

    render() {
        if (!this.giveData) {
            this.innerHTML = ''; // Or a loading state
            return;
        }

        this.innerHTML = `
            <ui-modal 
                open
                position="right" 
                close-button="true">
                <div slot="title">Update Give Entry</div>
                <form id="give-form" class="space-y-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Title</label>
                        <ui-input
                            data-field="title"
                            type="text"
                            placeholder="Enter payment method title"
                            value="${this.giveData.title || ''}"
                            required
                            class="w-full">
                        </ui-input>
                    </div>

                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Description</label>
                        <ui-textarea
                            data-field="text"
                            placeholder="Enter description for this payment method"
                            rows="4"
                            value="${this.giveData?.text || ''}"
                            class="w-full">
                        </ui-textarea>
                    </div>

                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Payment Image or QR Code Image</label>
                        <ui-file-upload 
                            data-field="banner"
                            accept="image/*"
                            multiple="false"
                            class="w-full">
                        </ui-file-upload>
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
                            ${this.giveData.is_active ? 'checked' : ''}
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

customElements.define('give-update-modal', GiveUpdateModal);
export default GiveUpdateModal;
