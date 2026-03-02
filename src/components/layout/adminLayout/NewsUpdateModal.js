import '@/components/ui/Modal.js';
import '@/components/ui/Toast.js';
import '@/components/ui/Input.js';
import '@/components/ui/Switch.js';
import '@/components/ui/FileUpload.js';
import '@/components/ui/Wysiwyg.js';
import api from '@/services/api.js';

/**
 * News Update Modal Component
 * 
 * A modal component for updating existing news articles in the admin panel
 * 
 * Attributes:
 * - open: boolean - controls modal visibility
 * 
 * Events:
 * - news-updated: Fired when a news article is successfully updated
 * - modal-closed: Fired when modal is closed
 */
class NewsUpdateModal extends HTMLElement {
    constructor() {
        super();
        this.newsData = null;
    }

    static get observedAttributes() {
        return ['open'];
    }

    connectedCallback() {
        this.render();
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Listen for confirm button click (Update News)
        this.addEventListener('confirm', () => {
            this.updateNews();
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

    // Set news data for editing
    setNewsData(newsData) {
        this.newsData = newsData;
        // Re-render the modal with the new data
        this.render();
        
        // Set the banner value in the file upload component after render
        setTimeout(() => {
            const bannerFileUpload = this.querySelector('ui-file-upload[data-field="banner"]');
            if (bannerFileUpload && newsData.banner_image) {
                bannerFileUpload.setValue(newsData.banner_image);
            }
        }, 0); // Increased timeout to ensure DOM is ready
    }

    // Update the news article
    async updateNews() {
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
                    message: 'Please log in to update news',
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
                title: 'Updating News Article',
                message: 'Please wait...',
                variant: 'info',
                duration: 2000
            });

            // Update the news article with multipart data
            const response = await api.withToken(token).put(`/news/${this.newsData.id}`, formData);
            
            Toast.show({
                title: 'News Article Updated!',
                message: `"${newsData.title}" has been successfully updated in the news.`,
                variant: 'success',
                duration: 5000
            });

            // Close modal and dispatch event with the updated data from the server
            this.close();
            this.dispatchEvent(new CustomEvent('news-updated', {
                detail: { news: response.data.data },
                bubbles: true,
                composed: true
            }));

        } catch (error) {
            console.error('❌ Error updating news:', error);
            Toast.show({
                title: 'Error',
                message: error.response?.data?.message || 'Failed to update news article',
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
                <div slot="title">Update News Article</div>
                    <form id="news-update-form" class="space-y-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">News Title</label>
                            <ui-input 
                                data-field="title"
                                type="text" 
                                placeholder="Enter news title"
                                value="${this.newsData?.title || ''}"
                                class="w-full">
                            </ui-input>
                        </div>
                        
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Content</label>
                            <ui-wysiwyg 
                                data-field="content"
                                placeholder="Enter news content..."
                                height="200px"
                                toolbar="full"
                                value="${this.newsData?.content || ''}"
                                class="w-full">
                            </ui-wysiwyg>
                        </div>

                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Banner Image</label>
                            <ui-file-upload 
                                data-field="banner"
                                accept="image/*"
                                multiple="false"
                                value="${this.newsData?.banner_image || ''}"
                                class="w-full">
                            </ui-file-upload>
                        </div>

                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">News Status</label>
                            <ui-switch 
                                name="is_active"
                                ${this.newsData?.is_active == 1 ? 'checked' : ''}
                                class="w-full">
                                <span slot="label">Published</span>
                            </ui-switch>
                        </div>
                    </form>
            </ui-modal>
        `;
    }
}

customElements.define('news-update-modal', NewsUpdateModal);
export default NewsUpdateModal; 