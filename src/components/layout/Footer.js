import App from '@/core/App.js';
import store from '@/core/store.js';
import api from '@/services/api.js';
import { fetchColorSettings } from '@/utils/colorSettings.js';
import '@/components/ui/Link.js';

/**
 * Enhanced App Footer Component
 * 
 * A comprehensive footer with contact info, social links, navigation, and proper styling
 * that matches the header design.
 */
class Footer extends App {
    unsubscribe = null;

    connectedCallback() {
        super.connectedCallback();
        this.fetchSchoolLogo();
        this.fetchContactInfo();
        this.fetchColorSettings();
        this.fetchSocialUrls();
        this.fetchSchoolInfo();

        // Subscribe to global state (e.g., for future auth UI)
        this.unsubscribe = store.subscribe((newState) => {
            this.set('isAuthenticated', newState.isAuthenticated);
        });
    }

    disconnectedCallback() {
        if (this.unsubscribe) {
            this.unsubscribe();
        }
    }

    async fetchSchoolLogo() {
        try {
            const response = await api.get('/settings/key/application_logo');
            if (response.data.success && response.data.data.setting_value) {
                this.set('logoUrl', `/api/${response.data.data.setting_value}`);
            }
        } catch (error) {
            console.error('Error fetching school logo:', error);
        }
    }

    async fetchContactInfo() {
        try {
            const emailResponse = await api.get('/settings/key/contact_email');
            if (emailResponse.data.success && emailResponse.data.data.setting_value) {
                this.set('contactEmail', emailResponse.data.data.setting_value);
            }

            const phoneResponse = await api.get('/settings/key/contact_phone');
            if (phoneResponse.data.success && phoneResponse.data.data.setting_value) {
                this.set('contactPhone', phoneResponse.data.data.setting_value);
            }

            const addressResponse = await api.get('/settings/key/contact_address');
            if (addressResponse.data.success && addressResponse.data.data.setting_value) {
                this.set('contactAddress', addressResponse.data.data.setting_value);
            }
        } catch (error) {
            console.error('Error fetching contact info:', error);
        }
    }

    async fetchColorSettings() {
        try {
            const colors = await fetchColorSettings();
            
            // Set all color values to state
            Object.entries(colors).forEach(([key, value]) => {
                this.set(key, value);
            });

        } catch (error) {
            console.error('Error fetching color settings:', error);
        }
    }

    async fetchSocialUrls() {
        try {
            const socialSettings = [
                'facebook_url',
                'twitter_url',
                'instagram_url',
                'linkedin_url',
                'youtube_url'
            ];

            const socialPromises = socialSettings.map(async (settingKey) => {
                try {
                    const response = await api.get(`/settings/key/${settingKey}`);
                    if (response.data.success && response.data.data.setting_value) {
                        return { key: settingKey, value: response.data.data.setting_value };
                    }
                } catch (error) {
                    console.error(`Error fetching ${settingKey}:`, error);
                }
                return null;
            });

            const socialResults = await Promise.all(socialPromises);
            
            // Set all social URL values to state
            socialResults.forEach(result => {
                if (result) {
                    this.set(result.key, result.value);
                }
            });

        } catch (error) {
            console.error('Error fetching social URLs:', error);
        }
    }

    async fetchSchoolInfo() {
        try {
            const nameResponse = await api.get('/settings/key/application_name');
            if (nameResponse.data.success && nameResponse.data.data.setting_value) {
                this.set('schoolName', nameResponse.data.data.setting_value);
            }

            const copyrightResponse = await api.get('/settings/key/footer_copyright');
            if (copyrightResponse.data.success && copyrightResponse.data.data.setting_value) {
                this.set('footerCopyright', copyrightResponse.data.data.setting_value);
            }

            const descriptionResponse = await api.get('/settings/key/application_description');
            if (descriptionResponse.data.success && descriptionResponse.data.data.setting_value) {
                this.set('schoolDescription', descriptionResponse.data.data.setting_value);
            }
        } catch (error) {
            console.error('Error fetching school info:', error);
        }
    }

    render() {
        // Get all colors from state
        const backgroundColor = this.get('background_color');
        const primaryColor = this.get('primary_color');
        const secondaryColor = this.get('secondary_color');
        const accentColor = this.get('accent_color');
        const textColor = this.get('text_color');
        const darkColor = this.get('dark_color');
        const hoverPrimary = this.get('hover_primary');
        const hoverSecondary = this.get('hover_secondary');
        const hoverAccent = this.get('hover_accent');
        
        // Only render if we have the essential colors
        if (!backgroundColor || !textColor || !secondaryColor) {
            return '';
        }

        // Navigation links array (simplified for footer)
        const navigationLinks = [
            { href: '/', label: 'Home' },
            { href: '/public/about-us', label: 'About Us' },
            { href: '/public/ministries', label: 'Ministries' },
            { href: '/public/service-events', label: 'Service & Events' },
            { href: '/public/gallery', label: 'Gallery' },
            { href: '/public/life-group', label: 'Life Group' },
            { href: '/public/give', label: 'Give' },
            { href: '/public/contact', label: 'Contact' }
        ];

        // Social icons array
        const socialIcons = [
            { key: 'facebook_url', icon: 'fab fa-facebook-f', name: 'Facebook' },
            { key: 'twitter_url', icon: 'fab fa-twitter', name: 'Twitter' },
            { key: 'instagram_url', icon: 'fab fa-instagram', name: 'Instagram' },
            { key: 'linkedin_url', icon: 'fab fa-linkedin-in', name: 'LinkedIn' },
            { key: 'youtube_url', icon: 'fab fa-youtube', name: 'YouTube' }
        ];

        // Helper function to render social icons
        const renderSocialIcons = () => {
            return socialIcons
                .filter(social => this.get(social.key))
                .map(social => `
                    <a href="${this.get(social.key)}" 
                       target="_blank" 
                       rel="noopener noreferrer"
                       class="text-[${textColor}] hover:text-[${accentColor}] transition-all duration-300 transform hover:scale-110"
                       title="${social.name}">
                        <i class="${social.icon} text-lg"></i>
                    </a>
                `).join('');
        };

        return `
            <footer class="bg-[${primaryColor}] border-t-4 border-[${primaryColor}]">
                <!-- Main Footer Content -->
                <div class="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
                    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                        
                        <!-- School Info & Logo -->
                        <div class="lg:col-span-1">
                            <div class="flex flex-col items-start space-y-4">
                                ${this.get('logoUrl') ? `
                                    <img src="${this.get('logoUrl')}" 
                                         alt="${this.get('schoolName')}" 
                                         class="h-16 w-auto">
                                ` : ''}
                                <div>
                                    <h3 class="text-lg font-bold text-[${secondaryColor}] mb-2">
                                        ${this.get('schoolName')}
                                    </h3>
                                    <p class="text-sm text-[${textColor}] opacity-80 leading-relaxed">
                                        ${this.get('schoolDescription')}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <!-- Quick Links -->
                        <div class="lg:col-span-1">
                            <h3 class="text-lg font-bold text-[${secondaryColor}] mb-4">Quick Links</h3>
                            <nav class="flex flex-col items-start gap-3">
                                ${navigationLinks.map(link => `
                                    <ui-link href="${link.href}" 
                                             class="block text-[${textColor}] hover:text-[${accentColor}] transition-all duration-300 hover:translate-x-1 text-sm">
                                        ${link.label}
                                    </ui-link>
                                `).join('')}
                            </nav>
                        </div>

                        <!-- Contact Information -->
                        <div class="lg:col-span-1">
                            <h3 class="text-lg font-bold text-[${secondaryColor}] mb-4">Contact Info</h3>
                            <div class="space-y-3">
                                ${this.get('contactAddress') ? `
                                    <div class="flex items-start space-x-3">
                                        <i class="fas fa-map-marker-alt text-[${accentColor}] mt-1"></i>
                                        <p class="text-sm text-[${textColor}] opacity-80">
                                            ${this.get('contactAddress')}
                                        </p>
                                    </div>
                                ` : ''}
                                ${this.get('contactPhone') ? `
                                    <div class="flex items-center space-x-3">
                                        <i class="fas fa-phone text-[${accentColor}]"></i>
                                        <a href="tel:${this.get('contactPhone')}" 
                                           class="text-sm text-[${textColor}] hover:text-[${accentColor}] transition-colors">
                                            ${this.get('contactPhone')}
                                        </a>
                                    </div>
                                ` : ''}
                                ${this.get('contactEmail') ? `
                                    <div class="flex items-center space-x-3">
                                        <i class="fas fa-envelope text-[${accentColor}]"></i>
                                        <a href="mailto:${this.get('contactEmail')}" 
                                           class="text-sm text-[${textColor}] hover:text-[${accentColor}] transition-colors">
                                            ${this.get('contactEmail')}
                                        </a>
                                    </div>
                                ` : ''}
                            </div>
                        </div>

                        <!-- Social Media & Apply -->
                        <div class="lg:col-span-1">
                            <h3 class="text-lg font-bold text-[${secondaryColor}] mb-4">Connect With Us</h3>
                            <div class="space-y-4">
                                <!-- Social Media Icons -->
                                <div class="flex space-x-4">
                                    ${renderSocialIcons()}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Bottom Footer -->
                <div class="border-t border-[${primaryColor}]/20">
                    <div class="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
                        <div class="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
                            <!-- Copyright -->
                            <div class="text-center md:text-left">
                                <p class="text-sm text-[${textColor}] opacity-80">
                                    ${this.get('footerCopyright')}
                                </p>
                            </div>
                            
                            <!-- Additional Info -->
                            <div class="text-center md:text-right">
                                <p class="text-sm text-[${textColor}] opacity-60">
                                    Powered by Vanilla JS • Built with ❤️ for Education
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </footer>
        `;
    }
}

customElements.define('app-footer', Footer);
export default Footer; 