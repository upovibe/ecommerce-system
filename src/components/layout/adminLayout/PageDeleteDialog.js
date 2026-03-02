import '@/components/ui/Dialog.js';
import '@/components/ui/Toast.js';
import api from '@/services/api.js';

/**
 * Page Delete Dialog Component
 * 
 * A dialog component for confirming page deletions in the admin panel
 * 
 * Attributes:
 * - open: boolean - controls dialog visibility
 * 
 * Events:
 * - page-deleted: Fired when a page is successfully deleted
 * - dialog-closed: Fired when dialog is closed
 */
class PageDeleteDialog extends HTMLElement {
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
        // Listen for dialog confirm/cancel events
        this.addEventListener('confirm', () => {
            this.confirmDelete();
        });

        this.addEventListener('cancel', () => {
            this.close();
        });
    }

    open() {
        this.setAttribute('open', '');
    }

    close() {
        this.removeAttribute('open');
        this.pageData = null;
    }

    // Set page data for deletion
    setPageData(pageData) {
        this.pageData = pageData;
        // Update the dialog content immediately
        this.updateDialogContent();
    }

    // Update dialog content without full re-render
    updateDialogContent() {
        const contentSlot = this.querySelector('[slot="content"]');
        if (contentSlot && this.pageData) {
            const pageTitle = this.pageData.title || 'Unknown';
            contentSlot.innerHTML = `
                <p class="text-gray-700 mb-4">
                    Are you sure you want to delete the page "<strong>${pageTitle}</strong>"?
                </p>
                <p class="text-sm text-gray-500">
                    This action cannot be undone. The page and all its content will be permanently removed.
                </p>
            `;
        }
    }

    // Handle delete confirmation
    async confirmDelete() {
        if (!this.pageData) {
            console.error('❌ No page data available for deletion');
            Toast.show({
                title: 'Error',
                message: 'No page data available for deletion',
                variant: 'error',
                duration: 3000
            });
            return;
        }

            try {
                // Get the auth token
                const token = localStorage.getItem('token');
                if (!token) {
                    console.error('❌ No authentication token found');
                Toast.show({
                    title: 'Authentication Error',
                    message: 'Please log in to delete pages',
                    variant: 'error',
                    duration: 3000
                });
                    return;
                }

            // Store page ID before deletion
            const pageId = this.pageData.id;

                // Delete the page
            await api.withToken(token).delete(`/pages/${pageId}`);
                
                Toast.show({
                    title: 'Success',
                    message: 'Page deleted successfully',
                    variant: 'success',
                    duration: 3000
                });

                // Close dialog and dispatch event
                this.close();
                this.dispatchEvent(new CustomEvent('page-deleted', {
                detail: { pageId: pageId },
                bubbles: true,
                composed: true
                }));

            } catch (error) {
                console.error('❌ Error deleting page:', error);
                Toast.show({
                    title: 'Error',
                    message: error.response?.data?.message || 'Failed to delete page',
                    variant: 'error',
                    duration: 3000
                });
        }
    }

    render() {
        const pageTitle = this.pageData?.title || 'Unknown';
        
        this.innerHTML = `
            <ui-dialog 
                ${this.hasAttribute('open') ? 'open' : ''} 
                title="Confirm Delete" 
                position="center"
                variant="danger">
                <div slot="content">
                    <p class="text-gray-700 mb-4">
                        Are you sure you want to delete the page "<strong>${pageTitle}</strong>"?
                    </p>
                    <p class="text-sm text-gray-500">
                        This action cannot be undone. The page and all its content will be permanently removed.
                    </p>
                </div>
            </ui-dialog>
        `;
    }
}

customElements.define('page-delete-dialog', PageDeleteDialog);
export default PageDeleteDialog; 