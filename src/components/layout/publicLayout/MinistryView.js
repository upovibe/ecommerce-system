    import App from '@/core/App.js';
    import '@/components/common/PageLoader.js';
    import { fetchColorSettings } from '@/utils/colorSettings.js';
    import '@/components/ui/Toast.js';
    import '@/components/ui/ContentDisplay.js';

    /**
     * Ministry View Component
     * 
     * Displays detailed information for a specific ministry
     */
    class MinistryView extends App {
        constructor() {
            super();
            this.set('ministry', null);
            this.set('loading', true);
            this.set('error', null);
        }

        async connectedCallback() {
            super.connectedCallback();

            // Load colors and settings from attributes or API
            await this.loadColorsFromAttributes();

                    // Check if slug attribute is provided and load data
        const slugOrId = this.getAttribute('slug');
        if (slugOrId) {
            this.loadMinistryData(slugOrId);
        }
        }

        async loadColorsFromAttributes() {
            // Get colors from attributes
            const colorsAttr = this.getAttribute('colors');
            if (colorsAttr) {
                try {
                    const colors = JSON.parse(colorsAttr);
                    Object.entries(colors).forEach(([key, value]) => {
                        this.set(key, value);
                    });
                } catch (error) {
                    console.error('Error parsing colors:', error);
                }
            }

            // Get textbox_bg_color from attribute
            const textboxBgColorAttr = this.getAttribute('textbox-bg-color');
            if (textboxBgColorAttr) {
                this.set('textboxBgColor', textboxBgColorAttr);
            }
        }

        async loadColorsFromSettings() {
            try {
                const colors = await fetchColorSettings();
                Object.entries(colors).forEach(([key, value]) => {
                    this.set(key, value);
                });

                // Also load textbox_bg_color setting
                try {
                    const response = await fetch('/api/settings/key/textbox_bg_color');
                    if (response.ok) {
                        const data = await response.json();
                        if (data.success) {
                            this.set('textboxBgColor', data.data.setting_value);
                        }
                    }
                } catch (error) {
                    console.error('Error loading textbox_bg_color setting:', error);
                }
            } catch (error) {
                console.error('Error loading color settings:', error);
            }
        }

        // Watch for attribute changes
        static get observedAttributes() {
            return ['slug', 'colors', 'textbox-bg-color'];
        }

        attributeChangedCallback(name, oldValue, newValue) {
            if (name === 'slug' && newValue && newValue !== oldValue) {
                this.loadMinistryData(newValue);
            } else if (name === 'colors' && newValue && newValue !== oldValue) {
                this.loadColorsFromAttributes();
            } else if (name === 'textbox-bg-color' && newValue && newValue !== oldValue) {
                this.set('textboxBgColor', newValue);
            }
        }

        async loadMinistryData(slugOrId) {
        if (!slugOrId) {
            this.set('error', 'No ministry identifier provided');
            this.set('loading', false);
            return;
        }

        try {
            // Try to fetch by slug first, then by ID if that fails
            let response = await fetch(`/api/news/slug/${slugOrId}`);
            
            if (!response.ok) {
                // If slug fetch fails, try by ID
                response = await fetch(`/api/news/${slugOrId}`);
            }
            
            if (response.ok) {
                const data = await response.json();
                
                if (data.success && data.data) {
                    this.set('ministry', data.data);
                } else {
                    this.set('error', 'Ministry not found');
                }
            } else {
                this.set('error', 'Failed to load ministry');
            }
        } catch (error) {
            console.error('Error fetching ministry:', error);
            this.set('error', 'Error loading ministry');
        }
        
        this.set('loading', false);
        this.render();
    }

        // Helper method to get proper image URL
        getImageUrl(imagePath) {
            if (!imagePath || typeof imagePath !== 'string') return null;
            
            if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
                return imagePath;
            }
            
            if (imagePath.startsWith('/')) {
                const baseUrl = window.location.origin;
                return baseUrl + imagePath;
            }
            
            const baseUrl = window.location.origin;
            const apiPath = '/api';
            return baseUrl + apiPath + '/' + imagePath;
        }

        // Helper function to get banner images
        getBannerImages(bannerImage) {
            if (!bannerImage) return [];
            
            try {
                const images = JSON.parse(bannerImage);
                return Array.isArray(images) ? images : [bannerImage];
            } catch (error) {
                return [bannerImage];
            }
        }

            copyMinistryUrl() {
        const url = window.location.href;
        navigator.clipboard.writeText(url).then(() => {
            Toast.show({ 
                message: 'Ministry URL copied to clipboard!', 
                variant: 'success',
                duration: 3000
            });
        }).catch(() => {
            Toast.show({ 
                message: 'Failed to copy URL', 
                variant: 'error',
                duration: 3000
            });
        });
    }

    shareMinistry() {
        const ministry = this.get('ministry');
        if (!ministry) return;

        if (navigator.share) {
            navigator.share({
                title: ministry.title,
                text: ministry.content ? this.stripHtml(ministry.content).substring(0, 100) + '...' : 'Check out this ministry',
                url: window.location.href
            }).catch(() => {
                Toast.show({ 
                    message: 'Sharing cancelled', 
                    variant: 'info',
                    duration: 3000
                });
            });
        } else {
            this.copyMinistryUrl();
        }
    }

    // Helper function to strip HTML tags for preview
    stripHtml(html) {
        if (!html) return '';
        const tmp = document.createElement('div');
        tmp.innerHTML = html;
        return tmp.textContent || tmp.innerText || '';
    }

    // Helper function to format date
    formatDate(dateString) {
        if (!dateString) return '';
        try {
            const date = new Date(dateString);
            if (isNaN(date.getTime())) {
                return dateString;
            }
            return date.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        } catch (error) {
            return dateString;
        }
    }

        render() {
            const loading = this.get('loading');
            const error = this.get('error');
            const ministry = this.get('ministry');
            
            // Get colors from state
            const primaryColor = this.get('primary_color');
            const secondaryColor = this.get('secondary_color');
            const accentColor = this.get('accent_color');
            const textColor = this.get('text_color');
            const textboxBgColor = this.get('textboxBgColor');

            if (loading) {
                return `<page-loader></page-loader>`;
            }

            if (error) {
                return `
                    <div class="min-h-screen flex items-center justify-center">
                        <div class="text-center">
                            <i class="fas fa-exclamation-triangle text-4xl text-red-500 mb-4"></i>
                            <h2 class="text-2xl font-bold text-gray-800 mb-2">Error</h2>
                            <p class="text-gray-600">${error}</p>
                            <button onclick="window.history.back()" class="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                                Go Back
                            </button>
                        </div>
                    </div>
                `;
            }

            if (!ministry) {
                return `
                    <div class="min-h-screen flex items-center justify-center">
                        <div class="text-center">
                            <i class="fas fa-church text-4xl text-gray-400 mb-4"></i>
                            <h2 class="text-2xl font-bold text-gray-800 mb-2">Ministry Not Found</h2>
                            <p class="text-gray-600">The ministry you're looking for doesn't exist.</p>
                            <button onclick="window.history.back()" class="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                                Go Back
                            </button>
                        </div>
                    </div>
                `;
            }

            // Get banner image
            const bannerImages = this.getBannerImages(ministry.banner_image);
            const bannerImage = bannerImages.length > 0 ? bannerImages[0] : null;

            return `
                <div class="min-h-screen">
                    <!-- Banner Section -->
                    <div class="relative h-[40vh] bg-gradient-to-br from-gray-400 to-gray-600 overflow-hidden">
                        ${bannerImage ? `
                            <img src="${this.getImageUrl(bannerImage)}" 
                                alt="${ministry.title || 'Ministry Banner'}" 
                                class="w-full h-full object-cover"
                                onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
                        ` : ''}
                        
                        <!-- Fallback placeholder -->
                        <div class="w-full h-full bg-gradient-to-br from-gray-400 to-gray-600 flex items-center justify-center ${bannerImage ? 'hidden' : ''}">
                            <div class="text-center text-white">
                                <i class="fas fa-church text-6xl mb-4 opacity-50"></i>
                                <p class="text-lg opacity-75">No Banner Image</p>
                            </div>
                        </div>

                                            <!-- Content Overlay -->
                    <div class="absolute inset-0 bg-black/40 flex items-center">
                        <div class="container mx-auto px-4">
                            <div class="max-w-4xl">
                                <h1 class="text-4xl md:text-5xl font-bold text-white mb-4 leading-tight">
                                    ${ministry.title || 'Untitled Ministry'}
                                </h1>
                                <div class="flex items-center gap-4 text-white/90">
                                    <span class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-white/20 backdrop-blur-sm">
                                        <i class="fas fa-church mr-2"></i>
                                        Ministry
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Share Buttons - Bottom Right Corner -->
                    <div class="absolute bottom-4 right-4 flex gap-2">
                        <button onclick="this.closest('ministry-view').shareMinistry()" 
                                class="size-8 flex items-center justify-center bg-white/20 backdrop-blur-sm border border-white/30 rounded-lg hover:bg-white/30 transition-colors">
                            <i class="fas fa-share-alt text-white"></i>
                        </button>
                        <button onclick="this.closest('ministry-view').copyMinistryUrl()" 
                                class="size-8 flex items-center justify-center bg-white/20 backdrop-blur-sm border border-white/30 rounded-lg hover:bg-white/30 transition-colors">
                            <i class="fas fa-copy text-white"></i>
                        </button>
                    </div>

                </div>

                                    <!-- Content Section -->
                <div class="container mx-auto px-4 py-12">
                    ${ministry.content ? `
                        <div class="rounded-3xl shadow-lg overflow-hidden mb-20" style="background-color: ${textboxBgColor}AA;">
                            <div class="p-5 lg:p-12">
                                <content-display
                                    content="${ministry.content.replace(/"/g, '&quot;')}"
                                    no-styles>
                                </content-display>
                            </div>
                        </div>
                    ` : `
                        <div class="bg-white rounded-xl shadow-lg p-8">
                            <div class="text-center py-8 text-gray-500">
                                <i class="fas fa-file-alt text-4xl mb-4"></i>
                                <p>No content available for this ministry.</p>
                            </div>
                        </div>
                    `}
                </div>
            `;
        }
    }

    customElements.define('ministry-view', MinistryView);
    export default MinistryView; 