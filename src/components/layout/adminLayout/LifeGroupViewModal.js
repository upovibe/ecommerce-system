import '@/components/ui/Modal.js';
import '@/components/ui/Toast.js';
import '@/components/ui/Badge.js';
import '@/components/ui/ContentDisplay.js';

/**
 * Life Group View Modal Component
 * 
 * A modal component for viewing life group details in the admin panel
 * 
 * Attributes:
 * - open: boolean - controls modal visibility
 * 
 * Events:
 * - modal-closed: Fired when modal is closed
 */
class LifeGroupViewModal extends HTMLElement {
    constructor() {
        super();
        this.lifeGroupData = null;
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

    // Set life group data for viewing
    setLifeGroupData(lifeGroupData) {
        this.lifeGroupData = lifeGroupData;
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
    getStatusBadgeColor(isActive) {
        return isActive ? 'success' : 'error';
    }

    // Helper method to get status icon
    getStatusIcon(isActive) {
        return isActive ? 'fa-check' : 'fa-times';
    }

    render() {
        this.innerHTML = `
            <ui-modal 
                ${this.hasAttribute('open') ? 'open' : ''} 
                position="right" 
                size="lg"
                close-button="true">
                <div slot="title">View Life Group Details</div>
                
                <div>
                    ${this.lifeGroupData ? `
                        <!-- Life Group Title -->
                        <div class="flex items-center gap-3 border-b pb-4">
                            <h3 class="text-xl font-semibold text-gray-900">${this.lifeGroupData.title || 'N/A'}</h3>
                            <ui-badge color="${this.getStatusBadgeColor(this.lifeGroupData.is_active)}">
                                <i class="fas ${this.getStatusIcon(this.lifeGroupData.is_active)} mr-1"></i>${this.lifeGroupData.is_active ? 'Active' : 'Inactive'}
                            </ui-badge>
                        </div>

                        <!-- Banner Image Preview -->
                        <div class="border-b pb-4">
                            <div class="flex items-center gap-2 mb-3">
                                <i class="fas fa-image text-blue-500"></i>
                                <h4 class="text-md font-semibold text-gray-800">Banner Image</h4>
                            </div>
                            ${this.lifeGroupData.banner ? `
                                <div class="relative group">
                                    <div class="relative w-full h-48">
                                        <img src="${this.getImageUrl(this.lifeGroupData.banner)}" 
                                             alt="${this.lifeGroupData.title}" 
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
                                        <button onclick="window.open('${this.getImageUrl(this.lifeGroupData.banner)}', '_blank')" 
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
                                        <p class="text-gray-400 text-xs mt-1">Upload a banner image to enhance your life group</p>
                                    </div>
                                </div>
                            `}
                        </div>

                        <!-- Life Group Information -->
                        <div class="border-b pb-4">
                            <div class="flex items-center gap-2 mb-3">
                                <i class="fas fa-info-circle text-blue-500"></i>
                                <h4 class="text-md font-semibold text-gray-800">Life Group Information</h4>
                            </div>
                            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div class="bg-gray-50 p-3 rounded-lg">
                                    <label class="block text-sm font-medium text-gray-700 mb-1">
                                        <i class="fas fa-link mr-1"></i>Slug
                                    </label>
                                    <p class="text-gray-900 text-sm font-mono">${this.lifeGroupData.slug || 'N/A'}</p>
                                </div>
                                <div class="bg-gray-50 p-3 rounded-lg">
                                    <label class="block text-sm font-medium text-gray-700 mb-1">
                                        <i class="fas fa-toggle-on mr-1"></i>Status
                                    </label>
                                    <p class="text-gray-900 text-sm">${this.lifeGroupData.is_active ? 'Active' : 'Inactive'}</p>
                                </div>
                            </div>
                        </div>

                        <!-- Description -->
                        <div class="border-b pb-4">
                            <div class="flex items-center gap-2 mb-3">
                                <i class="fas fa-file-text text-green-500"></i>
                                <h4 class="text-md font-semibold text-gray-800">Description</h4>
                            </div>
                            <div class="bg-gray-50 p-4 rounded-lg">
                                ${this.lifeGroupData.description ? `
                                    <p class="text-gray-900 whitespace-pre-wrap">${this.lifeGroupData.description}</p>
                                ` : `
                                    <p class="text-gray-500 italic">No description available</p>
                                `}
                            </div>
                        </div>

                        <!-- Link -->
                        <div class="border-b pb-4">
                            <div class="flex items-center gap-2 mb-3">
                                <i class="fas fa-external-link-alt text-purple-500"></i>
                                <h4 class="text-md font-semibold text-gray-800">External Link</h4>
                            </div>
                            <div class="bg-gray-50 p-4 rounded-lg">
                                ${this.lifeGroupData.link ? `
                                    <a href="${this.lifeGroupData.link}" target="_blank" class="text-blue-600 hover:text-blue-800 underline break-all">
                                        ${this.lifeGroupData.link}
                                    </a>
                                ` : `
                                    <p class="text-gray-500 italic">No external link provided</p>
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
                                    <span class="text-gray-900 text-sm">${this.lifeGroupData.created_at ? new Date(this.lifeGroupData.created_at).toLocaleString() : 'N/A'}</span>
                                </div>
                                <div class="bg-gray-50 p-3 rounded-lg">
                                    <label class="block text-sm font-medium text-gray-700 mb-1">
                                        <i class="fas fa-edit mr-1"></i>Updated
                                    </label>
                                    <span class="text-gray-900 text-sm">${this.lifeGroupData.updated_at ? new Date(this.lifeGroupData.updated_at).toLocaleString() : 'N/A'}</span>
                                </div>
                            </div>
                        </div>
                    ` : `
                        <div class="text-center py-8">
                            <p class="text-gray-500">No life group data available</p>
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

customElements.define('life-group-view-modal', LifeGroupViewModal);
export default LifeGroupViewModal; 