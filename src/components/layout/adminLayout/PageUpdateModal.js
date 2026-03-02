import '@/components/ui/Modal.js';
import '@/components/ui/Toast.js';
import '@/components/ui/Input.js';
import '@/components/ui/Textarea.js';
import '@/components/ui/Dropdown.js';
import '@/components/ui/RadioGroup.js';
import '@/components/ui/Wysiwyg.js';
import '@/components/ui/FileUpload.js';
import api from '@/services/api.js';

/**
 * Page Update Modal Component
 * 
 * A modal component for editing existing pages in the admin panel
 * 
 * Attributes:
 * - open: boolean - controls modal visibility
 * 
 * Events:
 * - page-updated: Fired when a page is successfully updated
 * - modal-closed: Fired when modal is closed
 */
class PageUpdateModal extends HTMLElement {
    constructor() {
        super();
        this.pageData = null;
    }

    static get observedAttributes() {
        return ['open'];
    }

    connectedCallback() {
        this.render();
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Listen for confirm button click (Update Page)
        this.addEventListener('confirm', () => {
            this.updatePage();
        });

        // Listen for cancel button click
        this.addEventListener('cancel', () => {
            this.close();
        });
    }

    // Set page data for editing
    setPageData(pageData) {
        this.pageData = pageData;
        // Re-render the modal with the new data
        this.render();
        
        // Set the banner value in the file upload component after render
        setTimeout(() => {
            const bannerFileUpload = this.querySelector('ui-file-upload[data-field="banner"]');
            if (bannerFileUpload && pageData.banner_image) {
                // Pass the entire banner_image array to show all existing images
                bannerFileUpload.setValue(pageData.banner_image);
            }
            
            // Set the content in the Wysiwyg component after render
            const contentWysiwyg = this.querySelector('ui-wysiwyg[data-field="content"]');
            if (contentWysiwyg && pageData.content) {
                // Wait a bit more for Wysiwyg to fully initialize
                setTimeout(() => {
                    contentWysiwyg.setValue(pageData.content);
                },0);
            }
        }, 100); // Increased timeout to ensure DOM is ready
    }

    open() {
        this.setAttribute('open', '');
    }

    close() {
        this.removeAttribute('open');
    }

    // Update the page
    async updatePage() {
        try {
            // Get values from custom UI components using data-field attributes
            const titleInput = this.querySelector('ui-input[data-field="title"]');
            const nameInput = this.querySelector('ui-input[data-field="name"]');
            const subtitleInput = this.querySelector('ui-input[data-field="subtitle"]');
            const contentWysiwyg = this.querySelector('ui-wysiwyg[data-field="content"]');
            const categoryDropdown = this.querySelector('ui-dropdown[data-field="category"]');
            const statusRadioGroup = this.querySelector('ui-radio-group[data-field="status"]');
            const metaDescriptionTextarea = this.querySelector('ui-textarea[data-field="meta-description"]');
            const metaKeywordsInput = this.querySelector('ui-input[data-field="meta-keywords"]');
            const sortOrderInput = this.querySelector('ui-input[data-field="sort-order"]');
            const bannerFileUpload = this.querySelector('ui-file-upload[data-field="banner"]');

            const pageData = {
                name: nameInput ? nameInput.value.trim() : '',
                subtitle: subtitleInput ? subtitleInput.value.trim() : '',
                title: titleInput ? titleInput.value : '',
                category: categoryDropdown ? categoryDropdown.value : '',
                content: contentWysiwyg ? contentWysiwyg.value : '',
                meta_description: metaDescriptionTextarea ? metaDescriptionTextarea.value : '',
                meta_keywords: metaKeywordsInput ? metaKeywordsInput.value : '',
                is_active: statusRadioGroup ? (statusRadioGroup.getValue() === 'active' ? 1 : 0) : 0,
                sort_order: sortOrderInput ? parseInt(sortOrderInput.value) || 0 : 0
            };

            // Validate required fields
            if (!pageData.title) {
                Toast.show({
                    title: 'Validation Error',
                    message: 'Please fill in the page title',
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
                    message: 'Please log in to update pages',
                    variant: 'error',
                    duration: 3000
                });
                return;
            }

            // Show loading toast
            Toast.show({
                title: 'Updating Page',
                message: 'Please wait...',
                variant: 'info',
                duration: 3000
            });

            // Prepare form data for multipart request
            const formData = new FormData();
            
            // Add all form fields
            Object.keys(pageData).forEach(key => {
                formData.append(key, pageData[key]);
            });
            
            // Add banner files if selected
            if (bannerFileUpload && bannerFileUpload.getFiles().length > 0) {
                const files = bannerFileUpload.getFiles();
                // Filter out existing files (which are strings/paths) and only include new File objects
                const newFiles = files.filter(file => file instanceof File);
                newFiles.forEach(file => {
                    formData.append('banner[]', file, file.name);
                });
            }

            // Update the page with multipart data
            const response = await api.withToken(token).put(`/pages/${this.pageData.id}`, formData);
            
            Toast.show({
                title: 'Success',
                message: 'Page updated successfully',
                variant: 'success',
                duration: 3000
            });

            // Construct the updated page data from response
            const updatedPage = {
                ...this.pageData, // Keep existing fields like id, created_at, slug
                ...pageData,
                banner_image: response.data.data?.banner_image || this.pageData.banner_image,
                updated_at: new Date().toISOString().slice(0, 19).replace('T', ' ')
            };

            // Close modal and dispatch event
            this.close();
            this.dispatchEvent(new CustomEvent('page-updated', {
                detail: { page: updatedPage },
                bubbles: true,
                composed: true
            }));

        } catch (error) {
            console.error('❌ Error updating page:', error);
            Toast.show({
                title: 'Error',
                message: error.response?.data?.message || 'Failed to update page',
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
                <div slot="title">Page Update</div>
                    <form id="page-update-form" class="space-y-4">
                        <div class="hidden">
                            <label class="block text-sm font-medium text-gray-700 mb-1">Page Name <span class="text-red-500">*</span></label>
                            <ui-input 
                                data-field="name"
                                name="name"
                                type="text" 
                                placeholder="Enter page name (used for slug)"
                                value="${this.pageData?.name || ''}"
                                class="w-full">
                            </ui-input>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Page Title</label>
                            <ui-input 
                                data-field="title"
                                name="title"
                                type="text" 
                                placeholder="Enter page title"
                                value="${this.pageData?.title || ''}"
                                class="w-full">
                            </ui-input>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Subtitle</label>
                            <ui-input 
                                data-field="subtitle"
                                name="subtitle"
                                type="text" 
                                placeholder="Enter page subtitle (optional)"
                                value="${this.pageData?.subtitle || ''}"
                                class="w-full">
                            </ui-input>
                        </div>
                        <div class="hidden">
                            <label class="block text-sm font-medium text-gray-700 mb-1">Category</label>
                            <ui-dropdown 
                                data-field="category"
                                placeholder="Select category"
                                value="${this.pageData?.category || ''}"
                                class="w-full">
                                <ui-option value="general">General</ui-option>
                                <ui-option value="about">About</ui-option>
                                <ui-option value="contact">Contact</ui-option>
                                <ui-option value="academics">Academics</ui-option>
                                <ui-option value="services">Services</ui-option>
                            </ui-dropdown>
                        </div>
                        
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Page Content</label>
                            <ui-wysiwyg 
                                data-field="content"
                                placeholder="Enter page content..."
                                height="200px"
                                toolbar="full"
                                class="w-full">
                            </ui-wysiwyg>
                        </div>
                        
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Meta Description</label>
                            <ui-textarea 
                                data-field="meta-description"
                                name="meta-description"
                                placeholder="Enter meta description for SEO"
                                value="${this.pageData?.meta_description || ''}"
                                rows="3"
                                class="w-full">
                            </ui-textarea>
                        </div>
                        
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Meta Keywords</label>
                            <ui-input 
                                data-field="meta-keywords"
                                name="meta-keywords"
                                type="text" 
                                placeholder="Enter meta keywords (comma separated)"
                                value="${this.pageData?.meta_keywords || ''}"
                                class="w-full">
                            </ui-input>
                        </div>
                        
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Banner Image</label>
                            <ui-file-upload 
                                data-field="banner"
                                accept="image/*"
                                max-size="5242880"
                                max-files="5"
                                multiple
                                value="${this.pageData?.banner_image || ''}"
                                class="w-full">
                            </ui-file-upload>
                        </div>
                        
                        <div class="hidden">
                            <label class="block text-sm font-medium text-gray-700 mb-1">Status</label>
                            <ui-radio-group 
                                data-field="status"
                                name="status"
                                value="${this.pageData?.is_active ? 'active' : 'inactive'}"
                                layout="horizontal"
                                class="w-full">
                                <ui-radio-option value="active" label="Active"></ui-radio-option>
                                <ui-radio-option value="inactive" label="Inactive"></ui-radio-option>
                            </ui-radio-group>
                        </div>
                        
                        <div class="hidden">
                            <label class="block text-sm font-medium text-gray-700 mb-1">Sort Order</label>
                            <ui-input 
                                data-field="sort-order"
                                name="sort-order"
                                type="number" 
                                placeholder="Enter sort order" 
                                value="${this.pageData?.sort_order || 0}"
                                class="w-full">
                            </ui-input>
                        </div>
                    </form>
            </ui-modal>
        `;
    }
}

customElements.define('page-update-modal', PageUpdateModal);
export default PageUpdateModal; 