import '@/components/ui/Modal.js';
import '@/components/ui/Button.js';
import '@/components/ui/Toast.js';
import '@/components/ui/Badge.js';
import api from '@/services/api.js';

/**
 * Give View Modal Component
 * 
 * Modal for viewing give entries (payment methods) with enhanced UI
 */
class GiveViewModal extends HTMLElement {
    constructor() {
        super();
        this.giveData = null;
        this.loading = false;
    }

    static get observedAttributes() {
        return ['open'];
    }

    connectedCallback() {
        this.render();
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Listen for cancel button click
        this.addEventListener('cancel', () => {
            this.close();
        });

        this.addEventListener('click', (e) => {
            const copyButton = e.target.closest('[data-action="copy-link"]');
            if (copyButton) {
                e.preventDefault();
                const link = copyButton.dataset.link;
                this.copyToClipboard(link);
            }

            const shareButton = e.target.closest('[data-action="share-link"]');
            if (shareButton) {
                e.preventDefault();
                const link = shareButton.dataset.link;
                this.shareLink(link);
            }

            const openButton = e.target.closest('[data-action="open-link"]');
            if (openButton) {
                e.preventDefault();
                const link = openButton.dataset.link;
                this.openLink(link);
            }
        });
    }

    setGiveData(data) {
        this.giveData = data;
        this.render();
    }

    copyToClipboard(text) {
        navigator.clipboard.writeText(text).then(() => {
            Toast.show({
                title: 'Success',
                message: 'Link copied to clipboard',
                variant: 'success',
                duration: 2000
            });
        }).catch(() => {
            Toast.show({
                title: 'Error',
                message: 'Failed to copy link',
                variant: 'error',
                duration: 2000
            });
        });
    }

    shareLink(link) {
        if (navigator.share) {
            navigator.share({
                title: 'Payment Method',
                text: 'Check out this payment method',
                url: link
            });
        } else {
            this.copyToClipboard(link);
        }
    }

    openLink(link) {
        window.open(link, '_blank');
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
        return isActive ? 'success' : 'secondary';
    }

    // Helper method to get status icon
    getStatusIcon(isActive) {
        return isActive ? 'fa-check-circle' : 'fa-times-circle';
    }

    // Helper method to detect payment method type from URL
    getPaymentMethodType(url) {
        if (!url) return 'Unknown';
        
        const urlLower = url.toLowerCase();
        
        if (urlLower.includes('paystack')) return 'Paystack';
        if (urlLower.includes('stripe')) return 'Stripe';
        if (urlLower.includes('paypal')) return 'PayPal';
        if (urlLower.includes('flutterwave')) return 'Flutterwave';
        if (urlLower.includes('rave')) return 'Rave';
        if (urlLower.includes('mobile money')) return 'Mobile Money';
        if (urlLower.includes('mtn')) return 'MTN Mobile Money';
        if (urlLower.includes('vodafone')) return 'Vodafone Cash';
        if (urlLower.includes('airtel')) return 'Airtel Money';
        if (urlLower.includes('bank')) return 'Bank Transfer';
        if (urlLower.includes('bitcoin') || urlLower.includes('btc')) return 'Bitcoin';
        if (urlLower.includes('ethereum') || urlLower.includes('eth')) return 'Ethereum';
        
        return 'Payment Link';
    }

    // Helper method to get payment method icon
    getPaymentMethodIcon(url) {
        const urlLower = url.toLowerCase();
        
        if (urlLower.includes('paystack')) return 'fas fa-credit-card';
        if (urlLower.includes('stripe')) return 'fab fa-stripe';
        if (urlLower.includes('paypal')) return 'fab fa-paypal';
        if (urlLower.includes('flutterwave')) return 'fas fa-mobile-alt';
        if (urlLower.includes('rave')) return 'fas fa-mobile-alt';
        if (urlLower.includes('mobile money') || urlLower.includes('mtn') || urlLower.includes('vodafone') || urlLower.includes('airtel')) return 'fas fa-mobile-alt';
        if (urlLower.includes('bank')) return 'fas fa-university';
        if (urlLower.includes('bitcoin') || urlLower.includes('btc')) return 'fab fa-bitcoin';
        if (urlLower.includes('ethereum') || urlLower.includes('eth')) return 'fab fa-ethereum';
        
        return 'fas fa-link';
    }

    close() {
        const modal = this.querySelector('ui-modal');
        if (modal) {
            modal.close();
        }
    }

    render() {
        this.innerHTML = `
            <ui-modal 
                ${this.hasAttribute('open') ? 'open' : ''} 
                title="View Payment Method" 
                close-button="true">
                <div>
                    ${this.giveData ? `
                        <!-- Give Entry Title -->
                        <div class="flex items-center gap-3 border-b pb-4">
                            <h3 class="text-xl font-semibold text-gray-900">${this.giveData.title || 'N/A'}</h3>
                            <ui-badge color="${this.getStatusBadgeColor(this.giveData.is_active)}">
                                <i class="fas ${this.getStatusIcon(this.giveData.is_active)} mr-1"></i>${this.giveData.is_active ? 'Active' : 'Inactive'}
                            </ui-badge>
                        </div>

                        <!-- QR Code Image Preview -->
                        <div class="border-b pb-4">
                            <div class="flex items-center gap-2 mb-3">
                                <i class="fas fa-qrcode text-blue-500"></i>
                                <h4 class="text-md font-semibold text-gray-800">QR Code Image</h4>
                            </div>
                            ${this.giveData.image ? `
                                <div class="relative group">
                                    <div class="relative w-full max-w-xs mx-auto">
                                        <img src="${this.getImageUrl(this.giveData.image)}" 
                                             alt="${this.giveData.title} QR Code" 
                                             class="w-full h-auto object-contain rounded-lg border border-gray-200 bg-white p-4"
                                             onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
                                        <div class="absolute inset-0 hidden items-center justify-center bg-gray-50 rounded-lg border border-gray-200">
                                            <div class="text-center">
                                                <i class="fas fa-qrcode text-gray-400 text-xl mb-1"></i>
                                                <p class="text-gray-500 text-xs">QR Code not found</p>
                                            </div>
                                        </div>
                                    </div>
                                    <div class="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button onclick="window.open('${this.getImageUrl(this.giveData.image)}', '_blank')" 
                                                class="bg-white bg-opacity-90 text-blue-500 hover:text-blue-700 text-xs px-2 py-1 rounded border border-blue-200 hover:bg-blue-50">
                                            <i class="fas fa-external-link-alt"></i>
                                        </button>
                                    </div>
                                </div>
                            ` : `
                                <div class="w-full max-w-xs mx-auto h-48 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center">
                                    <div class="text-center">
                                        <i class="fas fa-qrcode text-gray-400 text-4xl mb-3"></i>
                                        <p class="text-gray-500 text-sm font-medium">No QR code image set</p>
                                        <p class="text-gray-400 text-xs mt-1">Upload a QR code image for this payment method</p>
                                    </div>
                                </div>
                            `}
                        </div>

                        <!-- Give Entry Information -->
                        <div class="border-b pb-4">
                            <div class="flex items-center gap-2 mb-3">
                                <i class="fas fa-info-circle text-blue-500"></i>
                                <h4 class="text-md font-semibold text-gray-800">Payment Method Information</h4>
                            </div>
                            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div class="bg-gray-50 p-3 rounded-lg">
                                    <label class="block text-sm font-medium text-gray-700 mb-1">
                                        <i class="fas fa-tag mr-1"></i>Title
                                    </label>
                                    <p class="text-gray-900 text-sm">${this.giveData.title || 'N/A'}</p>
                                </div>
                                <div class="bg-gray-50 p-3 rounded-lg">
                                    <label class="block text-sm font-medium text-gray-700 mb-1">
                                        <i class="fas fa-toggle-on mr-1"></i>Status
                                    </label>
                                    <p class="text-gray-900 text-sm">${this.giveData.is_active ? 'Active' : 'Inactive'}</p>
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
                                ${this.giveData.text ? `
                                    <p class="text-gray-900 text-sm whitespace-pre-wrap">${this.giveData.text}</p>
                                ` : `
                                    <p class="text-gray-500 italic">No description available</p>
                                `}
                            </div>
                        </div>

                        <!-- Payment Links Section -->
                        <div class="border-b pb-4">
                            <div class="flex items-center gap-2 mb-3">
                                <i class="fas fa-link text-purple-500"></i>
                                <h4 class="text-md font-semibold text-gray-800">Payment Links (${this.giveData.links ? this.giveData.links.length : 0})</h4>
                            </div>
                            ${this.giveData.links && this.giveData.links.length > 0 ? `
                                <div class="grid grid-cols-1 gap-4">
                                    ${this.giveData.links.map((link, index) => {
                                        const paymentType = this.getPaymentMethodType(link);
                                        const paymentIcon = this.getPaymentMethodIcon(link);
                                        return `
                                            <div class="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                                                <div class="flex items-center justify-between mb-3">
                                                    <div class="flex items-center gap-2">
                                                        <i class="${paymentIcon} text-blue-500"></i>
                                                        <span class="text-sm font-medium text-gray-700">${paymentType}</span>
                                                    </div>
                                                    <span class="text-xs text-gray-500">Link ${index + 1}</span>
                                                </div>
                                                <p class="text-xs text-gray-500 truncate mb-3" title="${link}">${link}</p>
                                                <div class="flex gap-2">
                                                    <ui-button
                                                        type="button"
                                                        variant="outline"
                                                        size="sm"
                                                        data-action="open-link"
                                                        data-link="${link}"
                                                        class="flex-1">
                                                        <i class="fas fa-external-link-alt mr-1"></i>
                                                        Open
                                                    </ui-button>
                                                    <ui-button
                                                        type="button"
                                                        variant="outline"
                                                        size="sm"
                                                        data-action="copy-link"
                                                        data-link="${link}"
                                                        class="flex-1">
                                                        <i class="fas fa-copy mr-1"></i>
                                                        Copy
                                                    </ui-button>
                                                    <ui-button
                                                        type="button"
                                                        variant="outline"
                                                        size="sm"
                                                        data-action="share-link"
                                                        data-link="${link}"
                                                        class="flex-1">
                                                        <i class="fas fa-share mr-1"></i>
                                                        Share
                                                    </ui-button>
                                                </div>
                                            </div>
                                        `;
                                    }).join('')}
                                </div>
                            ` : `
                                <div class="w-full h-32 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center">
                                    <div class="text-center">
                                        <i class="fas fa-link text-gray-400 text-3xl mb-2"></i>
                                        <p class="text-gray-500 text-sm font-medium">No payment links available</p>
                                        <p class="text-gray-400 text-xs mt-1">Add payment links to enable giving through this method</p>
                                    </div>
                                </div>
                            `}
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
                                    <span class="text-gray-900 text-sm">${this.giveData.created_at ? new Date(this.giveData.created_at).toLocaleString() : 'N/A'}</span>
                                </div>
                                <div class="bg-gray-50 p-3 rounded-lg">
                                    <label class="block text-sm font-medium text-gray-700 mb-1">
                                        <i class="fas fa-edit mr-1"></i>Last Updated
                                    </label>
                                    <span class="text-gray-900 text-sm">${this.giveData.updated_at ? new Date(this.giveData.updated_at).toLocaleString() : 'N/A'}</span>
                                </div>
                            </div>
                        </div>
                    ` : `
                        <div class="text-center py-8 text-gray-500">
                            <p>No payment method data available</p>
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

customElements.define('give-view-modal', GiveViewModal);
export default GiveViewModal;
