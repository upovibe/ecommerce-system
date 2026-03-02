import '@/components/ui/Dialog.js';
import '@/components/ui/Toast.js';
import api from '@/services/api.js';

/**
 * News Delete Dialog Component
 * 
 * A dialog component for confirming news deletion in the admin panel
 * 
 * Attributes:
 * - open: boolean - controls dialog visibility
 * 
 * Events:
 * - news-deleted: Fired when a news article is successfully deleted
 * - modal-closed: Fired when dialog is closed
 */
class NewsDeleteDialog extends HTMLElement {
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
        // Listen for confirm button click (Delete News)
        this.addEventListener('confirm', () => {
            this.deleteNews();
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

    // Set news data for deletion
    setNewsData(newsData) {
        this.newsData = newsData;
        this.populateDialog();
    }

    // Populate dialog with news data
    populateDialog() {
        if (!this.newsData) return;

        const newsTitleElement = this.querySelector('#news-title');
        const newsSlugElement = this.querySelector('#news-slug');
        const newsStatusElement = this.querySelector('#news-status');

        if (newsTitleElement) newsTitleElement.textContent = this.newsData.title || 'Unknown News';
        if (newsSlugElement) newsSlugElement.textContent = this.newsData.slug || 'N/A';
        if (newsStatusElement) {
            const status = this.newsData.is_active ? 'Active' : 'Inactive';
            newsStatusElement.textContent = status;
        }
    }

    // Delete the news
    async deleteNews() {
        try {
            if (!this.newsData) {
                Toast.show({
                    title: 'Error',
                    message: 'No news data available for deletion',
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
                    message: 'Please log in to delete news',
                    variant: 'error',
                    duration: 3000
                });
                return;
            }

            // Delete the news
            const response = await api.withToken(token).delete(`/news/${this.newsData.id}`);
            
            Toast.show({
                title: 'Success',
                message: 'News deleted successfully',
                variant: 'success',
                duration: 3000
            });

            // Close dialog and dispatch event
            this.close();
            this.dispatchEvent(new CustomEvent('news-deleted', {
                detail: { newsId: this.newsData.id },
                bubbles: true,
                composed: true
            }));

        } catch (error) {
            console.error('❌ Error deleting news:', error);
            Toast.show({
                title: 'Error',
                message: error.response?.data?.message || 'Failed to delete news',
                variant: 'error',
                duration: 3000
            });
        }
    }

    render() {
        this.innerHTML = `
            <ui-dialog 
                ${this.hasAttribute('open') ? 'open' : ''} 
                title="Delete News"
                variant="danger">
                <div slot="content" class="space-y-4">
                    <div class="flex items-center space-x-2 mb-4">
                        <i class="fas fa-exclamation-triangle text-red-500"></i>
                        <span class="font-semibold text-red-900">Delete News Article</span>
                    </div>
                    
                    <p class="text-gray-700">
                        Are you sure you want to delete this news article? This action cannot be undone.
                    </p>
                    
                    <div class="bg-red-50 border border-red-200 rounded-lg p-4">
                        <div class="flex items-start space-x-3">
                            <i class="fas fa-newspaper text-red-500 mt-1"></i>
                            <div class="flex-1">
                                <h4 id="news-title" class="font-semibold text-red-900">News Title</h4>
                                <div class="mt-1 text-sm text-red-700">
                                    <span id="news-slug">Slug</span> • 
                                    <span id="news-status">Status</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <p class="text-sm text-gray-600">
                        This will permanently remove the news article from the system and cannot be recovered.
                    </p>
                </div>
            </ui-dialog>
        `;
    }
}

customElements.define('news-delete-dialog', NewsDeleteDialog);
export default NewsDeleteDialog; 