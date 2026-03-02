import '@/components/ui/Modal.js';
import '@/components/ui/Toast.js';
import '@/components/ui/Badge.js';
import api from '@/services/api.js';

/**
 * Sermon View Modal Component
 *
 * A modal component for viewing sermon details in the admin panel
 *
 * Attributes:
 * - open: boolean - controls modal visibility
 *
 * Events:
 * - sermon-image-deleted, sermon-audio-deleted, sermon-video-deleted
 * - modal-closed: Fired when modal is closed
 */
class SermonViewModal extends HTMLElement {
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
        this.addEventListener('cancel', () => this.close());
        this.addEventListener('confirm', () => this.close());
        this.addEventListener('click', (e) => {
            // Image delete
            if (e.target.closest('.delete-image-btn')) {
                e.preventDefault();
                const imageIndex = parseInt(e.target.closest('.delete-image-btn').dataset.imageIndex);
                this.deleteImage(imageIndex);
            }
            // Audio delete
            if (e.target.closest('.delete-audio-btn')) {
                e.preventDefault();
                const audioIndex = parseInt(e.target.closest('.delete-audio-btn').dataset.audioIndex);
                this.deleteAudio(audioIndex);
            }
            // Video delete
            if (e.target.closest('.delete-video-btn')) {
                e.preventDefault();
                const videoIndex = parseInt(e.target.closest('.delete-video-btn').dataset.videoIndex);
                this.deleteVideo(videoIndex);
            }
        });
    }

    open() {
        this.setAttribute('open', '');
    }

    close() {
        this.removeAttribute('open');
    }

    setSermonData(sermonData) {
        this.sermonData = sermonData;
        this.render();
    }

    // Helper: get proper file URL
    getFileUrl(path) {
        if (!path) return null;
        if (path.startsWith('http://') || path.startsWith('https://')) return path;
        if (path.startsWith('/api/')) return window.location.origin + path;
        if (path.startsWith('/')) return window.location.origin + path;
        return '/api/' + path;
    }

    // Helper: get status badge color
    getStatusBadgeColor(isActive) {
        return isActive ? 'success' : 'secondary';
    }

    // Helper: get status icon
    getStatusIcon(isActive) {
        return isActive ? 'fa-check-circle' : 'fa-times-circle';
    }

    // Helper: get video embed URL
    getEmbedUrl(url) {
        if (!url) return null;
        if (url.includes('youtube.com/watch') || url.includes('youtu.be/')) {
            const videoId = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/)?.[1];
            return videoId ? `https://www.youtube.com/embed/${videoId}` : null;
        }
        if (url.includes('facebook.com/') && url.includes('/videos/')) {
            const videoId = url.match(/\/videos\/(\d+)/)?.[1];
            return videoId ? `https://www.facebook.com/plugins/video.php?href=https://www.facebook.com/videos/${videoId}` : null;
        }
        if (url.includes('vimeo.com/')) {
            const videoId = url.match(/vimeo\.com\/(\d+)/)?.[1];
            return videoId ? `https://player.vimeo.com/video/${videoId}` : null;
        }
        if (url.includes('dailymotion.com/video/')) {
            const videoId = url.match(/dailymotion\.com\/video\/([^_]+)/)?.[1];
            return videoId ? `https://www.dailymotion.com/embed/video/${videoId}` : null;
        }
        return null;
    }

    // Delete image
    async deleteImage(imageIndex) {
        if (!this.sermonData || typeof imageIndex !== 'number') return;
        
        const token = localStorage.getItem('token');
        if (!token) {
            Toast.show({ title: 'Auth Error', message: 'Please log in', variant: 'error' });
            return;
        }
        
        try {
            const response = await api.withToken(token).delete(`/sermons/${this.sermonData.id}/images/${imageIndex}`);
            
            if (response.data && response.data.success && response.data.data) {
                // Update the modal with the new data
                this.setSermonData(response.data.data);
                this.dispatchEvent(new CustomEvent('sermon-image-deleted', {
                    detail: { sermon: response.data.data },
                    bubbles: true,
                    composed: true
                }));
                Toast.show({ title: 'Success', message: 'Image deleted', variant: 'success' });
            } else {
                // If response is invalid, manually update the images array
                const updatedImages = [...this.sermonData.images];
                updatedImages.splice(imageIndex, 1);
                this.sermonData.images = updatedImages;
                this.render();
                
                this.dispatchEvent(new CustomEvent('sermon-image-deleted', {
                    detail: { sermon: this.sermonData },
                    bubbles: true,
                    composed: true
                }));
                Toast.show({ title: 'Success', message: 'Image deleted', variant: 'success' });
            }
        } catch (error) {
            console.error('Delete image error:', error);
            Toast.show({ title: 'Error', message: error.response?.data?.message || 'Failed to delete image', variant: 'error' });
        }
    }

    // Delete audio
    async deleteAudio(audioIndex) {
        if (!this.sermonData || typeof audioIndex !== 'number') return;
        const token = localStorage.getItem('token');
        if (!token) {
            Toast.show({ title: 'Auth Error', message: 'Please log in', variant: 'error' });
            return;
        }
        try {
            const response = await api.withToken(token).delete(`/sermons/${this.sermonData.id}/audio/${audioIndex}`);
            
            if (response.data && response.data.success && response.data.data) {
                this.setSermonData(response.data.data);
                this.dispatchEvent(new CustomEvent('sermon-audio-deleted', {
                    detail: { sermon: response.data.data },
                    bubbles: true,
                    composed: true
                }));
                Toast.show({ title: 'Success', message: 'Audio deleted', variant: 'success' });
            } else {
                // Manual fallback
                const updatedAudio = [...this.sermonData.audio_links];
                updatedAudio.splice(audioIndex, 1);
                this.sermonData.audio_links = updatedAudio;
                this.render();
                
                this.dispatchEvent(new CustomEvent('sermon-audio-deleted', {
                    detail: { sermon: this.sermonData },
                    bubbles: true,
                    composed: true
                }));
                Toast.show({ title: 'Success', message: 'Audio deleted', variant: 'success' });
            }
        } catch (error) {
            Toast.show({ title: 'Error', message: error.response?.data?.message || 'Failed to delete audio', variant: 'error' });
        }
    }

    // Delete video
    async deleteVideo(videoIndex) {
        if (!this.sermonData || typeof videoIndex !== 'number') return;
        const token = localStorage.getItem('token');
        if (!token) {
            Toast.show({ title: 'Auth Error', message: 'Please log in', variant: 'error' });
            return;
        }
        try {
            const response = await api.withToken(token).delete(`/sermons/${this.sermonData.id}/videos/${videoIndex}`);
            
            if (response.data && response.data.success && response.data.data) {
                this.setSermonData(response.data.data);
                this.dispatchEvent(new CustomEvent('sermon-video-deleted', {
                    detail: { sermon: response.data.data },
                    bubbles: true,
                    composed: true
                }));
                Toast.show({ title: 'Success', message: 'Video deleted', variant: 'success' });
            } else {
                // Manual fallback
                const updatedVideos = [...this.sermonData.video_links];
                updatedVideos.splice(videoIndex, 1);
                this.sermonData.video_links = updatedVideos;
                this.render();
                
                this.dispatchEvent(new CustomEvent('sermon-video-deleted', {
                    detail: { sermon: this.sermonData },
                    bubbles: true,
                    composed: true
                }));
                Toast.show({ title: 'Success', message: 'Video deleted', variant: 'success' });
            }
        } catch (error) {
            Toast.show({ title: 'Error', message: error.response?.data?.message || 'Failed to delete video', variant: 'error' });
        }
    }

    render() {
        this.innerHTML = `
            <ui-modal 
                ${this.hasAttribute('open') ? 'open' : ''} 
                position="right" 
                size="lg"
                close-button="true">
                <div slot="title">View Sermon Details</div>
                <div>
                    ${this.sermonData ? `
                        <div class="flex items-center gap-3 border-b pb-4">
                            <h3 class="text-xl font-semibold text-gray-900">${this.sermonData.title || 'N/A'}</h3>
                            <ui-badge color="${this.getStatusBadgeColor(this.sermonData.is_active)}">
                                <i class="fas ${this.getStatusIcon(this.sermonData.is_active)} mr-1"></i>${this.sermonData.is_active ? 'Active' : 'Inactive'}
                            </ui-badge>
                        </div>
                        <div class="border-b pb-4">
                            <div class="flex items-center gap-2 mb-3">
                                <i class="fas fa-info-circle text-blue-500"></i>
                                <h4 class="text-md font-semibold text-gray-800">Sermon Information</h4>
                            </div>
                            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div class="bg-gray-50 p-3 rounded-lg">
                                    <label class="block text-sm font-medium text-gray-700 mb-1">
                                        <i class="fas fa-user mr-1"></i>Speaker
                                    </label>
                                    <p class="text-gray-900 text-sm">${this.sermonData.speaker || 'N/A'}</p>
                                </div>
                                <div class="bg-gray-50 p-3 rounded-lg">
                                    <label class="block text-sm font-medium text-gray-700 mb-1">
                                        <i class="fas fa-calendar mr-1"></i>Date Preached
                                    </label>
                                    <p class="text-gray-900 text-sm">${this.sermonData.date_preached || 'N/A'}</p>
                                </div>
                            </div>
                        </div>
                        <div class="border-b pb-4">
                            <div class="flex items-center gap-2 mb-3">
                                <i class="fas fa-file-text text-green-500"></i>
                                <h4 class="text-md font-semibold text-gray-800">Description</h4>
                            </div>
                            <div class="bg-gray-50 p-4 rounded-lg">
                                ${this.sermonData.description ? `
                                    <p class="text-gray-900 text-sm whitespace-pre-wrap">${this.sermonData.description}</p>
                                ` : `
                                    <p class="text-gray-500 italic">No description available</p>
                                `}
                            </div>
                        </div>
                        <div class="border-b pb-4">
                            <div class="flex items-center gap-2 mb-3">
                                <i class="fas fa-align-left text-indigo-500"></i>
                                <h4 class="text-md font-semibold text-gray-800">Content</h4>
                            </div>
                            <div class="bg-gray-50 p-4 rounded-lg prose prose-sm max-w-none">
                                ${this.sermonData.content ? this.sermonData.content : '<p class="text-gray-500 italic">No content available</p>'}
                            </div>
                        </div>
                        <div class="border-b pb-4">
                            <div class="flex items-center gap-2 mb-3">
                                <i class="fas fa-images text-purple-500"></i>
                                <h4 class="text-md font-semibold text-gray-800">Images (${this.sermonData.images ? this.sermonData.images.length : 0})</h4>
                            </div>
                            ${this.sermonData.images && this.sermonData.images.length > 0 ? `
                                <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                    ${this.sermonData.images.map((image, index) => `
                                        <div class="relative group">
                                            <div class="relative w-full h-32">
                                                <img src="${this.getFileUrl(image)}" 
                                                     alt="Sermon Image ${index + 1}" 
                                                     class="w-full h-full object-cover rounded-lg border border-gray-200"
                                                     onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
                                                <div class="absolute inset-0 hidden items-center justify-center bg-gray-50 rounded-lg border border-gray-200">
                                                    <div class="text-center">
                                                        <i class="fas fa-image text-gray-400 text-lg mb-1"></i>
                                                        <p class="text-gray-500 text-xs">Image not found</p>
                                                    </div>
                                                </div>
                                            </div>
                                            <div class="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                                                <button onclick="window.open('${this.getFileUrl(image)}', '_blank')" 
                                                        class="bg-white bg-opacity-90 text-blue-500 hover:text-blue-700 text-xs px-2 py-1 rounded border border-blue-200 hover:bg-blue-50">
                                                    <i class="fas fa-external-link-alt"></i>
                                                </button>
                                                <button class="delete-image-btn bg-white bg-opacity-90 text-red-500 hover:text-red-700 text-xs px-2 py-1 rounded border border-red-200 hover:bg-red-50"
                                                        data-image-index="${index}">
                                                    <i class="fas fa-trash"></i>
                                                </button>
                                            </div>
                                            <div class="absolute bottom-2 left-2">
                                                <span class="bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">${index + 1}</span>
                                            </div>
                                        </div>
                                    `).join('')}
                                </div>
                            ` : `
                                <div class="w-full h-48 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center">
                                    <div class="text-center">
                                        <i class="fas fa-images text-gray-400 text-4xl mb-3"></i>
                                        <p class="text-gray-500 text-sm font-medium">No images in this sermon</p>
                                        <p class="text-gray-400 text-xs mt-1">Upload images to illustrate the sermon</p>
                                    </div>
                                </div>
                            `}
                        </div>
                        <div class="border-b pb-4">
                            <div class="flex items-center gap-2 mb-3">
                                <i class="fas fa-headphones text-pink-500"></i>
                                <h4 class="text-md font-semibold text-gray-800">Audio Files (${this.sermonData.audio_links ? this.sermonData.audio_links.length : 0})</h4>
                            </div>
                            ${this.sermonData.audio_links && this.sermonData.audio_links.length > 0 ? `
                                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    ${this.sermonData.audio_links.map((audio, index) => `
                                        <div class="flex items-center gap-2 bg-gray-50 p-2 rounded-lg border">
                                            <audio controls src="${this.getFileUrl(audio)}" class="flex-1"></audio>
                                            <button class="delete-audio-btn text-red-500 hover:text-red-700 px-2 py-1 border border-red-200 rounded" data-audio-index="${index}">
                                                <i class="fas fa-trash"></i>
                                            </button>
                                        </div>
                                    `).join('')}
                                </div>
                            ` : `
                                <div class="w-full h-24 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center">
                                    <div class="text-center">
                                        <i class="fas fa-headphones text-gray-400 text-2xl mb-2"></i>
                                        <p class="text-gray-500 text-sm font-medium">No audio files in this sermon</p>
                                    </div>
                                </div>
                            `}
                        </div>
                        <div class="border-b pb-4">
                            <div class="flex items-center gap-2 mb-3">
                                <i class="fas fa-video text-blue-500"></i>
                                <h4 class="text-md font-semibold text-gray-800">Video Links (${this.sermonData.video_links ? this.sermonData.video_links.length : 0})</h4>
                            </div>
                            ${this.sermonData.video_links && this.sermonData.video_links.length > 0 ? `
                                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    ${this.sermonData.video_links.map((link, index) => {
                                        const embedUrl = this.getEmbedUrl(link);
                                        return `
                                            <div class="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
                                                <div class="aspect-video bg-gray-100">
                                                    ${embedUrl ? `
                                                        <iframe 
                                                            src="${embedUrl}" 
                                                            frameborder="0" 
                                                            allowfullscreen
                                                            class="w-full h-full">
                                                        </iframe>
                                                    ` : `
                                                        <div class="flex items-center justify-center h-full">
                                                            <p class="text-gray-500 text-sm">Unsupported video format</p>
                                                        </div>
                                                    `}
                                                </div>
                                                <div class="p-4">
                                                    <div class="flex items-center justify-between mb-2">
                                                        <span class="text-sm text-gray-600">Video ${index + 1}</span>
                                                        <button class="delete-video-btn text-red-500 hover:text-red-700 px-2 py-1 border border-red-200 rounded" data-video-index="${index}">
                                                            <i class="fas fa-trash"></i>
                                                        </button>
                                                    </div>
                                                    <p class="text-xs text-gray-500 truncate mb-3">${link}</p>
                                                    <div class="flex gap-2">
                                                        <button type="button" class="px-2 py-1 border rounded text-xs text-gray-700 hover:bg-gray-100" onclick="navigator.clipboard.writeText('${link}')"><i class="fas fa-copy mr-1"></i>Copy</button>
                                                        <button type="button" class="px-2 py-1 border rounded text-xs text-gray-700 hover:bg-gray-100" onclick="window.open('${link}', '_blank')"><i class="fas fa-external-link-alt mr-1"></i>Open</button>
                                                    </div>
                                                </div>
                                            </div>
                                        `;
                                    }).join('')}
                                </div>
                            ` : `
                                <div class="w-full h-24 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center">
                                    <div class="text-center">
                                        <i class="fas fa-video text-gray-400 text-2xl mb-2"></i>
                                        <p class="text-gray-500 text-sm font-medium">No video links in this sermon</p>
                                    </div>
                                </div>
                            `}
                        </div>
                        <div>
                            <div class="flex items-center gap-2 mb-3">
                                <i class="fas fa-history text-orange-500"></i>
                                <h4 class="text-md font-semibold text-gray-800">Timestamps</h4>
                            </div>
                            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div class="bg-gray-50 p-3 rounded-lg">
                                    <label class="block text-sm font-medium text-gray-700 mb-1">
                                        <i class="fas fa-plus mr-1"></i>Created
                                    </label>
                                    <span class="text-gray-900 text-sm">${this.sermonData.created_at ? new Date(this.sermonData.created_at).toLocaleString() : 'N/A'}</span>
                                </div>
                                <div class="bg-gray-50 p-3 rounded-lg">
                                    <label class="block text-sm font-medium text-gray-700 mb-1">
                                        <i class="fas fa-edit mr-1"></i>Last Updated
                                    </label>
                                    <span class="text-gray-900 text-sm">${this.sermonData.updated_at ? new Date(this.sermonData.updated_at).toLocaleString() : 'N/A'}</span>
                                </div>
                            </div>
                        </div>
                    ` : `
                        <div class="text-center py-8 text-gray-500">
                            <i class="fas fa-book text-4xl mb-4"></i>
                            <p>No sermon data available</p>
                        </div>
                    `}
                </div>
                <div slot="footer" class="flex justify-end">
                    <ui-button variant="outline" color="secondary" modal-action="cancel">Close</ui-button>
                </div>
            </ui-modal>
        `;
    }
}

customElements.define('sermon-view-modal', SermonViewModal);
export default SermonViewModal; 