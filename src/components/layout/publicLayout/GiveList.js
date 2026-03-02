import App from '@/core/App.js';
import { fetchColorSettings } from '@/utils/colorSettings.js';

/**
 * Give List Component
 * 
 * Displays a list of give/payment methods with images, descriptions, and links
 */
class GiveList extends App {
    constructor() {
        super();
        this.set('giveItems', []);
        this.set('loading', true);
    }

    async connectedCallback() {
        super.connectedCallback();
        await this.loadColorsFromSettings();
        this.loadGiveData();
    }

    async loadColorsFromSettings() {
        try {
            // Fetch colors from API
            const colors = await fetchColorSettings();
            
            // Set colors in component state
            Object.entries(colors).forEach(([key, value]) => {
                this.set(key, value);
            });
        } catch (error) {
            // Silently handle color loading errors
        }
    }

    async loadGiveData() {
        try {
            const response = await fetch('/api/give/active');
            if (response.ok) {
                const data = await response.json();
                if (data.success && data.data) {
                    this.set('giveItems', data.data);
                } else {
                    this.set('giveItems', []);
                }
            } else {
                this.set('giveItems', []);
            }
        } catch (error) {
            this.set('giveItems', []);
        }
        
        // Set loading to false
        this.set('loading', false);
        
        // Render with the loaded data
        this.render();
    }


    // Helper method to get proper image URL
    getImageUrl(imagePath) {
        if (!imagePath || typeof imagePath !== 'string') return null;
        
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

    // Helper function to get payment method icon based on URL
    getPaymentIcon(url) {
        if (!url) return 'fas fa-link';
        
        const urlLower = url.toLowerCase();
        if (urlLower.includes('paypal')) return 'fab fa-paypal';
        if (urlLower.includes('stripe')) return 'fab fa-stripe';
        if (urlLower.includes('venmo')) return 'fab fa-venmo';
        if (urlLower.includes('cashapp') || urlLower.includes('cash-app')) return 'fas fa-dollar-sign';
        if (urlLower.includes('zelle')) return 'fas fa-university';
        if (urlLower.includes('apple') && urlLower.includes('pay')) return 'fab fa-apple-pay';
        if (urlLower.includes('google') && urlLower.includes('pay')) return 'fab fa-google-pay';
        if (urlLower.includes('bitcoin') || urlLower.includes('crypto')) return 'fab fa-bitcoin';
        if (urlLower.includes('bank') || urlLower.includes('transfer')) return 'fas fa-university';
        if (urlLower.includes('mobile') || urlLower.includes('money')) return 'fas fa-mobile-alt';
        
        return 'fas fa-credit-card';
    }

    // Helper function to get payment method name from URL
    getPaymentName(url) {
        if (!url) return 'Payment Link';
        
        const urlLower = url.toLowerCase();
        if (urlLower.includes('paypal')) return 'PayPal';
        if (urlLower.includes('stripe')) return 'Stripe';
        if (urlLower.includes('venmo')) return 'Venmo';
        if (urlLower.includes('cashapp') || urlLower.includes('cash-app')) return 'Cash App';
        if (urlLower.includes('zelle')) return 'Zelle';
        if (urlLower.includes('apple') && urlLower.includes('pay')) return 'Apple Pay';
        if (urlLower.includes('google') && urlLower.includes('pay')) return 'Google Pay';
        if (urlLower.includes('bitcoin') || urlLower.includes('crypto')) return 'Bitcoin';
        if (urlLower.includes('bank') || urlLower.includes('transfer')) return 'Bank Transfer';
        if (urlLower.includes('mobile') || urlLower.includes('money')) return 'Mobile Money';
        
        return 'Payment Link';
    }

    // Helper function to truncate text
    truncateText(text, maxLength = 150) {
        if (!text) return '';
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength) + '...';
    }

    render() {
        const loading = this.get('loading');
        const giveItems = this.get('giveItems') || [];
        
        // Get colors from state
        const primaryColor = this.get('primary_color');
        const secondaryColor = this.get('secondary_color');
        const accentColor = this.get('accent_color');

        return `
            <!-- Give Items Grid -->
            <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4" style="grid-auto-rows: min-content;" id="give-list">
                ${loading ? Array(5).fill(`
                    <!-- Loading Skeleton -->
                    <div class="bg-slate-700 rounded-xl shadow-lg overflow-hidden p-3 animate-pulse">
                        <div class="flex flex-col">
                            <!-- Image Skeleton -->
                            <div class="w-full h-32 bg-gray-600 rounded-xl mb-4"></div>
                            <!-- Content Skeleton -->
                            <div class="space-y-3">
                                <div class="h-6 bg-gray-600 rounded"></div>
                                <div class="h-4 bg-gray-600 rounded"></div>
                                <div class="h-4 bg-gray-600 rounded w-3/4"></div>
                            </div>
                            <!-- Links Skeleton -->
                            <div class="mt-4 space-y-2">
                                <div class="h-8 bg-gray-600 rounded"></div>
                                <div class="h-8 bg-gray-600 rounded"></div>
                            </div>
                        </div>
                    </div>
                `).join('') : giveItems.length > 0 ? giveItems.map(giveItem => {
                    // Parse links from JSON
                    let links = [];
                    if (giveItem.links) {
                        try {
                            links = typeof giveItem.links === 'string' ? JSON.parse(giveItem.links) : giveItem.links;
                        } catch (error) {
                            links = [];
                        }
                    }

                    return `
                        <div class="bg-slate-700 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 give-card flex flex-col h-fit" 
                             data-title="${giveItem.title || 'Payment Method'}">
                            
                            <!-- Image Section -->
                            <div class="w-full relative rounded-t-xl overflow-hidden flex-shrink-0">
                                ${giveItem.image ? `
                                    <img src="${this.getImageUrl(giveItem.image)}" 
                                         alt="${giveItem.title || 'Payment Method'}" 
                                         class="w-full h-auto object-contain bg-white"
                                         onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
                                ` : ''}
                                <!-- Fallback placeholder -->
                                <div class="w-full h-48 bg-gradient-to-br from-gray-400 to-gray-600 flex items-center justify-center rounded-xl ${giveItem.image ? 'hidden' : ''}">
                                    <div class="text-center text-white">
                                        <i class="fas fa-credit-card text-4xl mb-2 opacity-50"></i>
                                        <p class="text-sm opacity-75">Payment Method</p>
                                    </div>
                                </div>
                            </div>
                            
                            <!-- Content Section -->
                            <div class="p-3 flex flex-col flex-grow">
                                <div class="text-white flex-grow">
                                    <h3 class="text-lg font-bold mb-2 line-clamp-2 truncate" title="${giveItem.title || 'Payment Method'}">
                                        ${giveItem.title || 'Payment Method'}
                                    </h3>
                                    <p class="text-sm leading-relaxed mb-4 line-clamp-3 text-gray-300 truncate">
                                        ${this.truncateText(giveItem.text || 'No description available', 100)}
                                    </p>
                                </div>
                                
                                <!-- Payment Links -->
                                ${links.length > 0 ? `
                                    <div class="space-y-2 mt-auto">
                                        ${links.map(link => `
                                            <a href="${link}" 
                                               target="_blank" 
                                               rel="noopener noreferrer"
                                               class="flex items-center justify-between w-full px-3 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-all duration-200 text-xs font-medium">
                                                <div class="flex items-center gap-2 min-w-0 flex-1">
                                                    <i class="${this.getPaymentIcon(link)} flex-shrink-0"></i>
                                                    <span class="truncate">${this.getPaymentName(link)}</span>
                                                </div>
                                                <i class="fas fa-external-link-alt text-xs flex-shrink-0 ml-2"></i>
                                            </a>
                                        `).join('')}
                                    </div>
                                ` : `
                                    <div class="text-center text-gray-400 text-xs py-2 mt-auto">
                                        No payment links available
                                    </div>
                                `}
                            </div>
                        </div>
                    `;
                }).join('') : `
                    <div class="col-span-full text-center py-8 text-gray-500">
                        <i class="fas fa-credit-card text-2xl mb-2"></i>
                        <p>No payment methods available</p>
                    </div>
                `}
            </div>
        `;
    }
}

customElements.define('give-list', GiveList);
export default GiveList;
