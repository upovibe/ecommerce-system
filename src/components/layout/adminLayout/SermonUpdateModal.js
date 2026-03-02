import '@/components/ui/Modal.js';
import '@/components/ui/Toast.js';
import '@/components/ui/Input.js';
import '@/components/ui/Textarea.js';
import '@/components/ui/Switch.js';
import '@/components/ui/FileUpload.js';
import '@/components/ui/Wysiwyg.js';
import api from '@/services/api.js';

/**
 * Sermon Update Modal Component
 *
 * A modal component for updating existing sermons in the admin panel
 *
 * Attributes:
 * - open: boolean - controls modal visibility
 *
 * Events:
 * - sermon-updated: Fired when a sermon is successfully updated
 * - modal-closed: Fired when modal is closed
 */
class SermonUpdateModal extends HTMLElement {
    constructor() {
        super();
        this.sermonData = null;
        this.videoLinks = [''];
        this.isSubmitting = false;
    }

    static get observedAttributes() {
        return ['open'];
    }

    connectedCallback() {
        this.render();
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Remove existing listeners to prevent duplicates
        this.removeEventListener('confirm', this.updateSermon);
        this.removeEventListener('cancel', this.close);
        this.removeEventListener('click', this.handleClick);
        
        this.addEventListener('confirm', () => this.updateSermon());
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

    setSermonData(sermonData) {
        this.sermonData = sermonData;
        this.videoLinks = (sermonData && sermonData.video_links && sermonData.video_links.length > 0) ? [...sermonData.video_links] : [''];
        this.render();
        setTimeout(() => {
            const imagesFileUpload = this.querySelector('ui-file-upload[data-field="images"]');
            if (imagesFileUpload && sermonData.images && sermonData.images.length > 0) {
                imagesFileUpload.setValue(sermonData.images);
            }
            const audioFileUpload = this.querySelector('ui-file-upload[data-field="audio"]');
            if (audioFileUpload && sermonData.audio_links && sermonData.audio_links.length > 0) {
                audioFileUpload.setValue(sermonData.audio_links);
            }
        }, 0);
    }

    open() {
        this.setAttribute('open', '');
    }

    close() {
        this.removeAttribute('open');
        this.isSubmitting = false;
    }

    _syncVideoLinksFromDOM() {
        const videoLinkInputs = this.querySelectorAll('input[data-video-index]');
        this.videoLinks = Array.from(videoLinkInputs).map(input => input.value || '');
    }

    addVideoLink() {
        this._syncVideoLinksFromDOM();
        this.videoLinks.push('');
        this.render();
    }

    removeVideoLink(index) {
        this._syncVideoLinksFromDOM();
        if (this.videoLinks.length > 1) {
            this.videoLinks.splice(index, 1);
            this.render();
        }
    }

    async updateSermon() {
        if (this.isSubmitting) {
            return;
        }
        this.isSubmitting = true;
        
        if (!this.sermonData || !this.sermonData.id) {
            Toast.show({ title: 'Error', message: 'Sermon data not found', variant: 'error' });
            this.isSubmitting = false;
            return;
        }
        try {
            // Sync video links from DOM right before creating sermon data
            this._syncVideoLinksFromDOM();
            
            const titleInput = this.querySelector('ui-input[data-field="title"]');
            const speakerInput = this.querySelector('ui-input[data-field="speaker"]');
            const dateInput = this.querySelector('ui-input[data-field="date_preached"]');
            const descriptionTextarea = this.querySelector('ui-textarea[data-field="description"]');
            const contentWysiwyg = this.querySelector('ui-wysiwyg[data-field="content"]');
            const isActiveSwitch = this.querySelector('ui-switch[name="is_active"]');
            const imagesFileUpload = this.querySelector('ui-file-upload[data-field="images"]');
            const audioFileUpload = this.querySelector('ui-file-upload[data-field="audio"]');

            const filteredVideoLinks = this.videoLinks.filter(link => link && link.trim() !== '');

            const sermonData = {
                title: titleInput ? titleInput.value : '',
                speaker: speakerInput ? speakerInput.value : '',
                date_preached: dateInput ? dateInput.value : '',
                description: descriptionTextarea ? descriptionTextarea.value : '',
                content: contentWysiwyg ? contentWysiwyg.value : '',
                is_active: isActiveSwitch ? (isActiveSwitch.checked ? 1 : 0) : 1,
                video_links: filteredVideoLinks
            };

            // Validate required fields
            if (!sermonData.title) {
                Toast.show({ title: 'Validation Error', message: 'Please fill in the sermon title', variant: 'error', duration: 3000 });
                return;
            }
            if (!sermonData.speaker) {
                Toast.show({ title: 'Validation Error', message: 'Please fill in the speaker', variant: 'error', duration: 3000 });
                return;
            }
            if (!sermonData.date_preached) {
                Toast.show({ title: 'Validation Error', message: 'Please select the date preached', variant: 'error', duration: 3000 });
                return;
            }
            if (!sermonData.content) {
                Toast.show({ title: 'Validation Error', message: 'Please fill in the sermon content', variant: 'error', duration: 3000 });
                return;
            }

            const token = localStorage.getItem('token');
            if (!token) {
                Toast.show({ title: 'Authentication Error', message: 'Please log in to update sermon', variant: 'error', duration: 3000 });
                return;
            }

            // Prepare form data for multipart request
            const formData = new FormData();
            Object.keys(sermonData).forEach(key => {
                if (key === 'video_links') {
                    sermonData.video_links.forEach(link => formData.append('video_links[]', link));
                } else {
                    formData.append(key, sermonData[key]);
                }
            });

            // Add images files if selected
            if (imagesFileUpload && imagesFileUpload.getFiles().length > 0) {
                const files = imagesFileUpload.getFiles();
                const newFiles = files.filter(file => file instanceof File);
                newFiles.forEach(file => {
                    formData.append('images', file, file.name);
                });
            }

            // Add audio files if selected
            if (audioFileUpload && audioFileUpload.getFiles().length > 0) {
                const files = audioFileUpload.getFiles();
                const newFiles = files.filter(file => file instanceof File);
                newFiles.forEach(file => {
                    formData.append('audio', file, file.name);
                });
            }

            // Show loading toast
            Toast.show({
                title: 'Updating Sermon',
                message: 'Please wait...',
                variant: 'info',
                duration: 2000
            });

            const response = await api.withToken(token).put(`/sermons/${this.sermonData.id}`, formData);

            Toast.show({ 
                title: 'Sermon Updated!', 
                message: `"${sermonData.title}" has been successfully updated in the sermons library.`, 
                variant: 'success', 
                duration: 5000 
            });

            this.close();
            this.dispatchEvent(new CustomEvent('sermon-updated', {
                detail: { sermon: response.data.data },
                bubbles: true,
                composed: true
            }));
        } catch (error) {
            Toast.show({ title: 'Error', message: error.response?.data?.message || 'Failed to update sermon', variant: 'error', duration: 3000 });
        } finally {
            this.isSubmitting = false;
        }
    }

    render() {
        if (!this.sermonData) {
            this.innerHTML = '';
            return;
        }
        this.innerHTML = `
            <ui-modal 
                open
                position="right" 
                close-button="true">
                <div slot="title">Update Sermon</div>
                <form id="sermon-update-form" class="space-y-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Sermon Title</label>
                        <ui-input 
                            data-field="title"
                            type="text" 
                            placeholder="Enter sermon title"
                            value="${this.sermonData.title || ''}"
                            class="w-full">
                        </ui-input>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Speaker</label>
                        <ui-input 
                            data-field="speaker"
                            type="text" 
                            placeholder="Enter speaker name"
                            value="${this.sermonData.speaker || ''}"
                            class="w-full">
                        </ui-input>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Date Preached</label>
                        <ui-input 
                            data-field="date_preached"
                            type="date" 
                            placeholder="Select date preached"
                            value="${this.sermonData.date_preached || ''}"
                            class="w-full">
                        </ui-input>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Description</label>
                        <ui-textarea 
                            data-field="description"
                            placeholder="Enter sermon description"
                            rows="3"
                            value="${this.sermonData.description || ''}"
                            class="w-full">
                        </ui-textarea>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Content</label>
                        <ui-wysiwyg 
                            data-field="content"
                            placeholder="Enter sermon content"
                            value="${this.sermonData.content || ''}"
                            class="w-full">
                        </ui-wysiwyg>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Images</label>
                        <ui-file-upload 
                            data-field="images"
                            accept="image/*"
                            multiple="true"
                            value="${this.sermonData.images ? JSON.stringify(this.sermonData.images) : ''}"
                            class="w-full">
                        </ui-file-upload>
                        <p class="text-xs text-gray-500 mt-1">You can select multiple images for this sermon</p>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Audio Files</label>
                        <ui-file-upload 
                            data-field="audio"
                            accept="audio/*"
                            multiple="true"
                            value="${this.sermonData.audio_links ? JSON.stringify(this.sermonData.audio_links) : ''}"
                            class="w-full">
                        </ui-file-upload>
                        <p class="text-xs text-gray-500 mt-1">You can select multiple audio files for this sermon</p>
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
                                        <button
                                            type="button"
                                            data-action="remove-video-link"
                                            data-index="${index}"
                                            class="px-2 py-1 text-red-500 hover:text-red-700">
                                            <i class="fas fa-trash"></i>
                                        </button>
                                    ` : ''}
                                </div>
                            `).join('')}
                        </div>
                        <div class="flex justify-end mt-2">
                            <button
                                type="button"
                                data-action="add-video-link"
                                class="px-3 py-1 border rounded text-sm text-gray-700 hover:bg-gray-100">
                                <i class="fas fa-plus mr-1"></i>
                                Add Link
                            </button>
                        </div>
                        <p class="text-xs text-gray-500 mt-1">Supports YouTube, Facebook, Vimeo, etc.</p>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Sermon Status</label>
                        <ui-switch 
                            name="is_active"
                            ${this.sermonData.is_active == 1 ? 'checked' : ''}
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

customElements.define('sermon-update-modal', SermonUpdateModal);
export default SermonUpdateModal; 