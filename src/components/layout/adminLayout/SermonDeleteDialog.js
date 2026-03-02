import '@/components/ui/Dialog.js';
import '@/components/ui/Toast.js';
import api from '@/services/api.js';

/**
 * Sermon Delete Dialog Component
 *
 * A dialog component for confirming sermon deletion in the admin panel
 *
 * Attributes:
 * - open: boolean - controls dialog visibility
 *
 * Events:
 * - sermon-deleted: Fired when a sermon is successfully deleted
 * - modal-closed: Fired when dialog is closed
 */
class SermonDeleteDialog extends HTMLElement {
    constructor() {
        super();
        this.sermonData = null;
    }

    static get observedAttributes() {
        return ['open'];
    }

    connectedCallback() {
        this.render();
        this.setupEventListeners();
    }

    setupEventListeners() {
        this.addEventListener('confirm', () => this.deleteSermon());
        this.addEventListener('cancel', () => this.close());
    }

    open() {
        this.setAttribute('open', '');
    }

    close() {
        this.removeAttribute('open');
    }

    setSermonData(sermonData) {
        this.sermonData = sermonData;
        this.populateDialog();
    }

    populateDialog() {
        if (!this.sermonData) return;
        const titleEl = this.querySelector('#sermon-title');
        const speakerEl = this.querySelector('#sermon-speaker');
        const dateEl = this.querySelector('#sermon-date');
        const statusEl = this.querySelector('#sermon-status');
        const imagesEl = this.querySelector('#sermon-images');
        const audioEl = this.querySelector('#sermon-audio');
        const videosEl = this.querySelector('#sermon-videos');
        if (titleEl) titleEl.textContent = this.sermonData.title || 'Unknown Sermon';
        if (speakerEl) speakerEl.textContent = this.sermonData.speaker || 'N/A';
        if (dateEl) dateEl.textContent = this.sermonData.date_preached || 'N/A';
        if (statusEl) statusEl.textContent = this.sermonData.is_active ? 'Active' : 'Inactive';
        if (imagesEl) imagesEl.textContent = `${this.sermonData.images ? this.sermonData.images.length : 0} image(s)`;
        if (audioEl) audioEl.textContent = `${this.sermonData.audio_links ? this.sermonData.audio_links.length : 0} audio file(s)`;
        if (videosEl) videosEl.textContent = `${this.sermonData.video_links ? this.sermonData.video_links.length : 0} video link(s)`;
    }

    async deleteSermon() {
        try {
            if (!this.sermonData) {
                Toast.show({ title: 'Error', message: 'No sermon data available for deletion', variant: 'error', duration: 3000 });
                return;
            }
            const token = localStorage.getItem('token');
            if (!token) {
                Toast.show({ title: 'Authentication Error', message: 'Please log in to delete sermon', variant: 'error', duration: 3000 });
                return;
            }
            await api.withToken(token).delete(`/sermons/${this.sermonData.id}`);
            Toast.show({ title: 'Success', message: 'Sermon deleted successfully', variant: 'success', duration: 3000 });
            this.close();
            this.dispatchEvent(new CustomEvent('sermon-deleted', {
                detail: { sermonId: this.sermonData.id },
                bubbles: true,
                composed: true
            }));
        } catch (error) {
            console.error('❌ Error deleting sermon:', error);
            Toast.show({ title: 'Error', message: error.response?.data?.message || 'Failed to delete sermon', variant: 'error', duration: 3000 });
        }
    }

    render() {
        this.innerHTML = `
            <ui-dialog 
                ${this.hasAttribute('open') ? 'open' : ''} 
                title="Delete Sermon"
                variant="danger">
                <div slot="content" class="space-y-4">
                    <div class="flex items-center space-x-2 mb-4">
                        <i class="fas fa-exclamation-triangle text-red-500"></i>
                        <span class="font-semibold text-red-900">Delete Sermon</span>
                    </div>
                    <p class="text-gray-700">
                        Are you sure you want to delete this sermon? This action cannot be undone.
                    </p>
                    <div class="bg-red-50 border border-red-200 rounded-lg p-4">
                        <div class="flex items-start space-x-3">
                            <i class="fas fa-book text-red-500 mt-1"></i>
                            <div class="flex-1">
                                <h4 id="sermon-title" class="font-semibold text-red-900">Sermon Title</h4>
                                <div class="mt-1 text-sm text-red-700">
                                    <span id="sermon-speaker">Speaker</span> • 
                                    <span id="sermon-date">Date</span> • 
                                    <span id="sermon-status">Status</span> • 
                                    <span id="sermon-images">Images</span> • 
                                    <span id="sermon-audio">Audio</span> • 
                                    <span id="sermon-videos">Videos</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    <p class="text-sm text-gray-600">
                        This will permanently remove the sermon and all its media from the system and cannot be recovered.
                    </p>
                </div>
            </ui-dialog>
        `;
    }
}

customElements.define('sermon-delete-dialog', SermonDeleteDialog);
export default SermonDeleteDialog; 