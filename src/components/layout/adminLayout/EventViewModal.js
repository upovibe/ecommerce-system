import '@/components/ui/Modal.js';
import '@/components/ui/Toast.js';
import '@/components/ui/Badge.js';
import '@/components/ui/ContentDisplay.js';

/**
 * Event View Modal Component
 * 
 * A modal component for viewing event details in the admin panel
 * 
 * Attributes:
 * - open: boolean - controls modal visibility
 * 
 * Events:
 * - modal-closed: Fired when modal is closed
 */
class EventViewModal extends HTMLElement {
    constructor() {
        super();
        this.eventData = null;
    }

    static get observedAttributes() {
        return ['open'];
    }

    connectedCallback() {
        this.render();
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Listen for close button click (cancel)
        this.addEventListener('cancel', () => {
            this.close();
        });

        // Listen for confirm button click (close)
        this.addEventListener('confirm', () => {
            this.close();
        });
    }

    open() {
        this.setAttribute('open', '');
    }

    close() {
        this.removeAttribute('open');
    }

    // Set event data for viewing
    setEventData(eventData) {
        this.eventData = eventData;
        // Re-render the modal with the new data
        this.render();
    }

    // Helper method to get proper image URL
    getImageUrl(imagePath) {
        if (!imagePath) return null;
        
        // If it's already a full URL, return as is
        if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
            return imagePath;
        }
        
        // If it's a relative path starting with /, construct the full URL
        if (imagePath.startsWith('/')) {
            const baseUrl = window.location.origin;
            return baseUrl + imagePath;
        }
        
        // If it's a relative path without /, construct the URL
        const baseUrl = window.location.origin;
        const apiPath = '/api';
        return baseUrl + apiPath + '/' + imagePath;
    }

    // Helper method to get status badge color
    getStatusBadgeColor(status) {
        switch (status) {
            case 'upcoming': return 'info';
            case 'ongoing': return 'success';
            case 'completed': return 'secondary';
            case 'cancelled': return 'error';
            default: return 'secondary';
        }
    }

    // Helper method to get status icon
    getStatusIcon(status) {
        switch (status) {
            case 'upcoming': return 'fa-clock';
            case 'ongoing': return 'fa-play';
            case 'completed': return 'fa-check';
            case 'cancelled': return 'fa-times';
            default: return 'fa-question';
        }
    }

    render() {
        this.innerHTML = `
            <ui-modal 
                ${this.hasAttribute('open') ? 'open' : ''} 
                position="right" 
                size="lg"
                close-button="true">
                <div slot="title">View Event Details</div>
                
                <div>
                    ${this.eventData ? `
                        <!-- Event Title -->
                        <div class="flex items-center gap-3 border-b pb-4">
                            <h3 class="text-xl font-semibold text-gray-900">${this.eventData.title || 'N/A'}</h3>
                            <ui-badge color="secondary"><i class="fas fa-tag mr-1"></i>${this.eventData.category || 'N/A'}</ui-badge>
                            <ui-badge color="${this.getStatusBadgeColor(this.eventData.status)}">
                                <i class="fas ${this.getStatusIcon(this.eventData.status)} mr-1"></i>${this.eventData.status || 'N/A'}
                            </ui-badge>
                        </div>

                        <!-- Banner Image Preview -->
                        <div class="border-b pb-4">
                            <div class="flex items-center gap-2 mb-3">
                                <i class="fas fa-image text-blue-500"></i>
                                <h4 class="text-md font-semibold text-gray-800">Banner Image</h4>
                            </div>
                            ${this.eventData.banner_image ? `
                                <div class="relative group">
                                    <div class="relative w-full h-48">
                                        <img src="${this.getImageUrl(this.eventData.banner_image)}" 
                                             alt="${this.eventData.title}" 
                                             class="w-full h-full object-cover rounded-lg border border-gray-200"
                                             onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
                                        <div class="absolute inset-0 hidden items-center justify-center bg-gray-50 rounded-lg border border-gray-200">
                                            <div class="text-center">
                                                <i class="fas fa-image text-gray-400 text-xl mb-1"></i>
                                                <p class="text-gray-500 text-xs">Image not found</p>
                                            </div>
                                        </div>
                                    </div>
                                    <div class="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button onclick="window.open('${this.getImageUrl(this.eventData.banner_image)}', '_blank')" 
                                                class="bg-white bg-opacity-90 text-blue-500 hover:text-blue-700 text-xs px-2 py-1 rounded border border-blue-200 hover:bg-blue-50">
                                            <i class="fas fa-external-link-alt"></i>
                                        </button>
                                    </div>
                                </div>
                            ` : `
                                <div class="w-full h-48 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center">
                                    <div class="text-center">
                                        <i class="fas fa-image text-gray-400 text-4xl mb-3"></i>
                                        <p class="text-gray-500 text-sm font-medium">No banner image set</p>
                                        <p class="text-gray-400 text-xs mt-1">Upload a banner image to enhance your event</p>
                                    </div>
                                </div>
                            `}
                        </div>

                        <!-- Event Information -->
                        <div class="border-b pb-4">
                            <div class="flex items-center gap-2 mb-3">
                                <i class="fas fa-info-circle text-blue-500"></i>
                                <h4 class="text-md font-semibold text-gray-800">Event Information</h4>
                            </div>
                            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div class="bg-gray-50 p-3 rounded-lg">
                                    <label class="block text-sm font-medium text-gray-700 mb-1">
                                        <i class="fas fa-map-marker-alt mr-1"></i>Location
                                    </label>
                                    <p class="text-gray-900 text-sm">${this.eventData.location || 'TBD'}</p>
                                </div>
                                <div class="bg-gray-50 p-3 rounded-lg">
                                    <label class="block text-sm font-medium text-gray-700 mb-1">
                                        <i class="fas fa-calendar-check mr-1"></i>Status
                                    </label>
                                    <p class="text-gray-900 text-sm">${this.eventData.status || 'N/A'}</p>
                                </div>
                            </div>
                        </div>

                        <!-- Date & Time Information -->
                        <div class="border-b pb-4">
                            <div class="flex items-center gap-2 mb-3">
                                <i class="fas fa-clock text-green-500"></i>
                                <h4 class="text-md font-semibold text-gray-800">Date & Time</h4>
                            </div>
                            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div class="bg-gray-50 p-3 rounded-lg">
                                    <label class="block text-sm font-medium text-gray-700 mb-1">
                                        <i class="fas fa-play mr-1"></i>Start Date & Time
                                    </label>
                                    <span class="text-gray-900 text-sm">${this.eventData.start_date ? new Date(this.eventData.start_date).toLocaleString() : 'N/A'}</span>
                                </div>
                                <div class="bg-gray-50 p-3 rounded-lg">
                                    <label class="block text-sm font-medium text-gray-700 mb-1">
                                        <i class="fas fa-stop mr-1"></i>End Date & Time
                                    </label>
                                    <span class="text-gray-900 text-sm">${this.eventData.end_date ? new Date(this.eventData.end_date).toLocaleString() : 'N/A'}</span>
                                </div>
                            </div>
                        </div>

                        <!-- Description -->
                        <div class="border-b pb-4">
                            <h4 class="text-md font-semibold text-gray-800 mb-3">Description</h4>
                            <div class="bg-gray-50 p-4 rounded-lg">
                                ${this.eventData.description ? `
                                    <content-display 
                                        content="${this.eventData.description.replace(/"/g, '&quot;')}"
                                        max-height="160px"
                                        no-styles>
                                    </content-display>
                                ` : `
                                    <p class="text-gray-500 italic">No description available</p>
                                `}
                            </div>
                        </div>

                        <!-- Content -->
                        <div class="border-b pb-4">
                            <h4 class="text-md font-semibold text-gray-800 mb-3">Content</h4>
                            <div class="bg-gray-50 p-4 rounded-lg">
                                ${this.eventData.content ? `
                                    <content-display 
                                        content="${this.eventData.content.replace(/"/g, '&quot;')}"
                                        max-height="300px"
                                        allow-html>
                                    </content-display>
                                ` : `
                                    <p class="text-gray-500 italic">No content available</p>
                                `}
                            </div>
                        </div>

                        <!-- Timestamps -->
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
                                    <span class="text-gray-900 text-sm">${this.eventData.created_at ? new Date(this.eventData.created_at).toLocaleString() : 'N/A'}</span>
                                </div>
                                <div class="bg-gray-50 p-3 rounded-lg">
                                    <label class="block text-sm font-medium text-gray-700 mb-1">
                                        <i class="fas fa-edit mr-1"></i>Updated
                                    </label>
                                    <span class="text-gray-900 text-sm">${this.eventData.updated_at ? new Date(this.eventData.updated_at).toLocaleString() : 'N/A'}</span>
                                </div>
                            </div>
                        </div>
                    ` : `
                        <div class="text-center py-8">
                            <p class="text-gray-500">No event data available</p>
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

customElements.define('event-view-modal', EventViewModal);
export default EventViewModal; 