import '@/components/ui/Modal.js';
import '@/components/ui/Toast.js';
import '@/components/ui/Input.js';
import '@/components/ui/Textarea.js';
import '@/components/ui/Switch.js';
import '@/components/ui/FileUpload.js';
import '@/components/ui/Wysiwyg.js';
import api from '@/services/api.js';

/**
 * News Settings Modal Component
 * 
 * A modal component for adding new news articles in the admin panel
 * 
 * Attributes:
 * - open: boolean - controls modal visibility
 * 
 * Events:
 * - news-saved: Fired when a news article is successfully saved
 * - modal-closed: Fired when modal is closed
 */
class NewsSettingsModal extends HTMLElement {
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
        // Listen for confirm button click (Save News)
        this.addEventListener('confirm', () => {
            this.saveNews();
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

    // Save the new news article
    async saveNews() {
        try {
            // Get form data using the data-field attributes for reliable selection
            const titleInput = this.querySelector('ui-input[data-field="title"]');
            const contentWysiwyg = this.querySelector('ui-wysiwyg[data-field="content"]');
            const isActiveSwitch = this.querySelector('ui-switch[name="is_active"]');
            const bannerFileUpload = this.querySelector('ui-file-upload[data-field="banner"]');

            const newsData = {
                title: titleInput ? titleInput.value : '',
                content: contentWysiwyg ? contentWysiwyg.value : '',
                is_active: isActiveSwitch ? (isActiveSwitch.checked ? 1 : 0) : 1
            };

            // Validate required fields
            if (!newsData.title) {
                Toast.show({
                    title: 'Validation Error',
                    message: 'Please fill in the news title',
                    variant: 'error',
                    duration: 3000
                });
                return;
            }

            if (!newsData.content) {
                Toast.show({
                    title: 'Validation Error',
                    message: 'Please fill in the news content',
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
                    message: 'Please log in to add news',
                    variant: 'error',
                    duration: 3000
                });
                return;
            }

            // Prepare form data for multipart request
            const formData = new FormData();
            
            // Add all form fields
            Object.keys(newsData).forEach(key => {
                formData.append(key, newsData[key]);
            });
            
            // Add banner files if selected
            if (bannerFileUpload && bannerFileUpload.getFiles().length > 0) {
                const files = bannerFileUpload.getFiles();
                // Filter out existing files (which are strings/paths) and only include new File objects
                const newFiles = files.filter(file => file instanceof File);
                newFiles.forEach(file => {
                    formData.append('banner', file, file.name);
                });
            }



            // Show loading toast
            Toast.show({
                title: 'Adding News Article',
                message: 'Please wait...',
                variant: 'info',
                duration: 2000
            });

            // Create the news article with multipart data
            const response = await api.withToken(token).post('/news', formData);
            
            Toast.show({
                title: 'News Article Added!',
                message: `"${newsData.title}" has been successfully added to the news.`,
                variant: 'success',
                duration: 5000
            });

            // Construct the new news data from response
            const newNews = {
                id: response.data.data?.id || response.data.id,
                title: newsData.title,
                content: newsData.content,
                is_active: newsData.is_active,
                banner_image: response.data.data?.banner_image || null,
                created_at: new Date().toISOString().slice(0, 19).replace('T', ' '),
                updated_at: new Date().toISOString().slice(0, 19).replace('T', ' ')
            };

            // Close modal and dispatch event
            this.close();
            this.dispatchEvent(new CustomEvent('news-saved', {
                detail: { news: newNews },
                bubbles: true,
                composed: true
            }));

        } catch (error) {
            console.error('❌ Error saving news:', error);
            Toast.show({
                title: 'Error',
                message: error.response?.data?.message || 'Failed to create news article',
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
                <div slot="title">News Settings</div>
                    <form id="news-form" class="space-y-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">News Title</label>
                            <ui-input 
                                data-field="title"
                                type="text" 
                                placeholder="Enter news title"
                                class="w-full">
                            </ui-input>
                        </div>
                        
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Content</label>
                            <ui-wysiwyg 
                                data-field="content"
                                placeholder="Enter news content"
                                class="w-full">
                            </ui-wysiwyg>
                        </div>

                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Banner Image</label>
                            <ui-file-upload 
                                data-field="banner"
                                accept="image/*"
                                multiple="false"
                                class="w-full">
                            </ui-file-upload>
                        </div>

                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">News Status</label>
                            <ui-switch 
                                name="is_active"
                                checked
                                class="w-full">
                                <span slot="label">Published</span>
                            </ui-switch>
                        </div>
                    </form>
            </ui-modal>
        `;
    }
}

customElements.define('news-settings-modal', NewsSettingsModal);
export default NewsSettingsModal; 