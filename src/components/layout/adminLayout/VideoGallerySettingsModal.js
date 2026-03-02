import '@/components/ui/Modal.js';
import '@/components/ui/Toast.js';
import '@/components/ui/Input.js';
import '@/components/ui/Textarea.js';
import '@/components/ui/Switch.js';
import '@/components/ui/Button.js';
import api from '@/services/api.js';

/**
 * Video Gallery Settings Modal Component
 * 
 * A modal component for adding new video galleries in the admin panel
 */
class VideoGallerySettingsModal extends HTMLElement {
    constructor() {
        super();
        this.videoLinks = [''];
        this.saveVideoGallery = this.saveVideoGallery.bind(this); // Bind the method to the instance
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
        this.removeEventListener('confirm', this.saveVideoGallery);
        this.removeEventListener('cancel', this.close);
        this.removeEventListener('click', this.handleClick);
    }

    setupEventListeners() {
        // Remove existing listeners first to prevent duplicates
        this.removeEventListener('confirm', this.saveVideoGallery);
        this.removeEventListener('cancel', this.close);
        this.removeEventListener('click', this.handleClick);

        this.addEventListener('confirm', this.saveVideoGallery);
        this.addEventListener('cancel', () => this.close());
        this.addEventListener('click', this.handleClick);
    }

    handleClick = (e) => {
        if (e.target.closest('[data-action="add-video-link"]')) {
            e.preventDefault();
            this.addVideoLink();
        }
        if (e.target.closest('[data-action="remove-video-link"]')) {
            e.preventDefault();
            const index = parseInt(e.target.closest('[data-action="remove-video-link"]').dataset.index, 10);
            this.removeVideoLink(index);
        }
    }

    open() {
        this.setAttribute('open', '');
    }

    close() {
        this.removeAttribute('open');
        this.videoLinks = ['']; // Reset state
        this.render(); // Re-render to clear the form
    }

    // Helper to read the current values from the DOM into our state array
    _syncVideoLinksFromDOM() {
        const videoLinkInputs = this.querySelectorAll('input[data-video-index]');
        this.videoLinks = Array.from(videoLinkInputs).map(input => input.value || '');
    }

    addVideoLink() {
        this._syncVideoLinksFromDOM(); // Save current values before adding a new one
        this.videoLinks.push('');
        this.render();
        this.setupEventListeners(); // Re-attach listeners after render
    }

    removeVideoLink(index) {
        this._syncVideoLinksFromDOM(); // Save current values before removing one
        if (this.videoLinks.length > 1) {
            this.videoLinks.splice(index, 1);
            this.render();
            this.setupEventListeners(); // Re-attach listeners after render
        }
    }

    async saveVideoGallery() {
        this._syncVideoLinksFromDOM(); // Get the latest values before saving

        try {
            const nameInput = this.querySelector('ui-input[data-field="name"]');
            const descriptionTextarea = this.querySelector('ui-textarea[data-field="description"]');
            const isActiveSwitch = this.querySelector('ui-switch[name="is_active"]');

            const filteredVideoLinks = this.videoLinks.filter(link => link && link.trim() !== '');

            const videoGalleryData = {
                name: nameInput ? nameInput.value : '',
                description: descriptionTextarea ? descriptionTextarea.value : '',
                is_active: isActiveSwitch ? (isActiveSwitch.checked ? 1 : 0) : 1,
                video_links: filteredVideoLinks
            };

            if (!videoGalleryData.name) {
                Toast.show({ title: 'Validation Error', message: 'Please fill in the gallery name', variant: 'error' });
                return;
            }

            if (videoGalleryData.video_links.length === 0) {
                Toast.show({ title: 'Validation Error', message: 'At least one video link is required', variant: 'error' });
                return;
            }

            const token = localStorage.getItem('token');
            if (!token) {
                Toast.show({ title: 'Authentication Error', message: 'Please log in', variant: 'error' });
                return;
            }

            // Show loading toast
            Toast.show({
                title: 'Adding Video Gallery',
                message: 'Please wait...',
                variant: 'info',
                duration: 2000
            });

            const response = await api.withToken(token).post('/video-galleries', videoGalleryData);
            
            Toast.show({ 
                title: 'Video Gallery Added!', 
                message: `"${videoGalleryData.name}" has been successfully added to the video galleries.`, 
                variant: 'success', 
                duration: 5000 
            });

            const newVideoGallery = response.data.data;

            this.dispatchEvent(new CustomEvent('video-gallery-saved', {
                detail: { videoGallery: newVideoGallery },
                bubbles: true,
                composed: true
            }));
            this.close();

        } catch (error) {
            console.error('❌ Error saving video gallery:', error);
            Toast.show({ title: 'Error', message: error.response?.data?.message || 'Failed to create video gallery', variant: 'error' });
        }
    }

    render() {
        this.innerHTML = `
            <ui-modal 
                ${this.hasAttribute('open') ? 'open' : ''} 
                position="right" 
                close-button="true">
                <div slot="title">Video Gallery Settings</div>
                <form id="video-gallery-form" class="space-y-4">
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
                        <label class="block text-sm font-medium text-gray-700 mb-1">Video Links</label>
                        <div class="space-y-2" id="video-links-container">
                            ${this.videoLinks.map((link, index) => `
                                <div class="flex gap-2 items-center">
                                    <div class="flex-1">
                                        <input
                                            type="url"
                                            placeholder="Enter video URL"
                                            value="${link}"
                                            data-video-index="${index}"
                                            class="w-full upo-input-default">
                                    </div>
                                    ${this.videoLinks.length > 1 ? `
                                        <ui-button
                                            type="button"
                                            variant="danger-outline"
                                            size="sm"
                                            data-action="remove-video-link"
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
                                data-action="add-video-link"
                                class="px-3">
                                <i class="fas fa-plus mr-1"></i>
                                Add Link
                            </ui-button>
                        </div>
                        <p class="text-xs text-gray-500 mt-1">Supports YouTube, Facebook, Vimeo, etc.</p>
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
        // Don't re-attach listeners here as they're already attached in connectedCallback
    }
}

customElements.define('video-gallery-settings-modal', VideoGallerySettingsModal);
export default VideoGallerySettingsModal;