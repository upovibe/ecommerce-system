import App from '@/core/App.js';
import { unescapeJsonFromAttribute } from '@/utils/jsonUtils.js';
import '@/components/ui/Button.js';
import '@/components/ui/Input.js';
import '@/components/ui/Textarea.js';
import '@/components/ui/Toast.js';
import '@/components/ui/ContentDisplay.js';
/**
 * Contact Section Alt Component
 * 
 * Modern contact section with form, information, map, and social media links
 */
class ContactSectionAlt extends App {
    constructor() {
        super();
        this.set('loading', false);
        this.formValues = {
            name: '',
            email: '',
            subject: '',
            message: ''
        };
    }

    connectedCallback() {
        super.connectedCallback();
        this.loadDataFromProps();
        this.setupEventListeners();
        
        // Set initial form validation state
        setTimeout(() => this.validateForm(), 100);
    }

    loadDataFromProps() {
        // Get data from props/attributes
        const colorsAttr = this.getAttribute('colors');
        const pageDataAttr = this.getAttribute('page-data');
        const settingsAttr = this.getAttribute('settings');

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

        if (pageDataAttr) {
            const pageData = unescapeJsonFromAttribute(pageDataAttr);
            if (pageData) {
                this.set('pageData', pageData);
            }
        }

        if (settingsAttr) {
            const settings = unescapeJsonFromAttribute(settingsAttr);
            if (settings) {
                if (settings.contact_title) this.set('contactTitle', settings.contact_title);
                if (settings.contact_subtitle) this.set('contactSubtitle', settings.contact_subtitle);
                if (settings.contact_address) this.set('contactAddress', settings.contact_address);
                if (settings.contact_phone) this.set('contactPhone', settings.contact_phone);
                if (settings.contact_email) this.set('contactEmail', settings.contact_email);
                
                // Map settings
                if (settings.map_location_name) this.set('mapLocationName', settings.map_location_name);
                if (settings.map_address) this.set('mapAddress', settings.map_address);
                if (settings.map_latitude) this.set('mapLatitude', settings.map_latitude);
                if (settings.map_longitude) this.set('mapLongitude', settings.map_longitude);
                if (settings.map_embed_url) this.set('mapEmbedUrl', settings.map_embed_url);
                if (settings.map_zoom_level) this.set('mapZoomLevel', settings.map_zoom_level);
                
                // Social media settings
                if (settings.facebook_url) this.set('facebookUrl', settings.facebook_url);
                if (settings.twitter_url) this.set('twitterUrl', settings.twitter_url);
                if (settings.instagram_url) this.set('instagramUrl', settings.instagram_url);
                if (settings.linkedin_url) this.set('linkedinUrl', settings.linkedin_url);
                if (settings.whatsapp_url) this.set('whatsappUrl', settings.whatsapp_url);
                if (settings.youtube_url) this.set('youtubeUrl', settings.youtube_url);
            }
        }
    }

    setupEventListeners() {
        this.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleSubmit();
        });

        // Capture form values in real-time and validate form
        this.addEventListener('input', (e) => {
            if (e.target.id === 'name' || e.target.name === 'name') {
                this.formValues.name = e.target.value;
            } else if (e.target.id === 'email' || e.target.name === 'email') {
                this.formValues.email = e.target.value;
            } else if (e.target.id === 'subject' || e.target.name === 'subject') {
                this.formValues.subject = e.target.value;
            } else if (e.target.id === 'message' || e.target.name === 'message') {
                this.formValues.message = e.target.value;
            }
            
            // Validate form and update button state
            this.validateForm();
        });
    }

    validateForm() {
        // Check if all required fields have values
        const isFormValid = this.formValues.name.trim() !== '' && 
                           this.formValues.email.trim() !== '' && 
                           this.formValues.message.trim() !== '';
        
        // Find the submit button and enable/disable it
        const submitButton = this.querySelector('button[type="submit"]');
        if (submitButton) {
            submitButton.disabled = !isFormValid;
            
            // Update button appearance based on state
            if (isFormValid) {
                submitButton.classList.remove('opacity-50', 'cursor-not-allowed');
                submitButton.classList.add('hover:opacity-90', 'hover:-translate-y-1', 'hover:scale-105', 'hover:shadow-xl');
            } else {
                submitButton.classList.add('opacity-50', 'cursor-not-allowed');
                submitButton.classList.remove('hover:opacity-90', 'hover:-translate-y-1', 'hover:scale-105', 'hover:shadow-xl');
            }
        }
    }

    async handleSubmit() {
        try {
            this.set('loading', true);
            
            // Use the captured form values
            const formData = {
                name: this.formValues.name.trim(),
                email: this.formValues.email.trim(),
                subject: this.formValues.subject.trim(),
                message: this.formValues.message.trim()
            };
            
            // Validate required fields
            if (!formData.name || !formData.email || !formData.message) {
                Toast.show({
                    title: 'Validation Error',
                    message: 'Please fill in all required fields (Name, Email, and Message).',
                    variant: 'error',
                    duration: 4000
                });
                return;
            }

            // Validate email format
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(formData.email)) {
                Toast.show({
                    title: 'Invalid Email',
                    message: 'Please enter a valid email address.',
                    variant: 'error',
                    duration: 4000
                });
                return;
            }
            
            // Send to API
            const response = await fetch('/api/contact/submit', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData)
            });

            const result = await response.json();

            if (response.ok && result.success) {
                Toast.show({
                    title: 'Success',
                    message: result.message || 'Thank you for your message! We\'ll get back to you soon.',
                    variant: 'success',
                    duration: 5000
                });

                // Reset form inputs and captured values
                const nameInput = this.querySelector('input#name');
                const emailInput = this.querySelector('input#email');
                const subjectInput = this.querySelector('input#subject');
                const messageInput = this.querySelector('ui-textarea[name="message"]');
                
                if (nameInput) nameInput.value = '';
                if (emailInput) emailInput.value = '';
                if (subjectInput) subjectInput.value = '';
                if (messageInput) messageInput.value = '';
                
                // Reset captured values
                this.formValues = {
                    name: '',
                    email: '',
                    subject: '',
                    message: ''
                };
            } else {
                throw new Error(result.message || 'Failed to send message');
            }

        } catch (error) {
            console.error('Error submitting contact form:', error);
            Toast.show({
                title: 'Error',
                message: error.message || 'Failed to send message. Please try again.',
                variant: 'error',
                duration: 4000
            });
        } finally {
            this.set('loading', false);
        }
    }

    // Helper method to check if any social media links exist
    hasSocialMediaLinks() {
        const facebookUrl = this.get('facebookUrl');
        const twitterUrl = this.get('twitterUrl');
        const instagramUrl = this.get('instagramUrl');
        const linkedinUrl = this.get('linkedinUrl');
        const whatsappUrl = this.get('whatsappUrl');
        const youtubeUrl = this.get('youtubeUrl');
        
        return facebookUrl || twitterUrl || instagramUrl || linkedinUrl || whatsappUrl || youtubeUrl;
    }

    // Helper method to render social media links
    renderSocialMediaLinks() {
        const socialLinks = [
            { key: 'facebookUrl', icon: 'fab fa-facebook', color: '#1877F2' },
            { key: 'twitterUrl', icon: 'fab fa-twitter', color: '#1DA1F2' },
            { key: 'instagramUrl', icon: 'fab fa-instagram', color: '#E4405F' },
            { key: 'linkedinUrl', icon: 'fab fa-linkedin', color: '#0A66C2' },
            { key: 'whatsappUrl', icon: 'fab fa-whatsapp', color: '#25D366' },
            { key: 'youtubeUrl', icon: 'fab fa-youtube', color: '#FF0000' }
        ];

        return `
            <div class="flex flex-row justify-center gap-2">
                ${socialLinks
                    .filter(link => this.get(link.key) && this.get(link.key).trim() !== '')
                    .map(link => `
                        <a href="${this.get(link.key)}" 
                           target="_blank" 
                           rel="noopener noreferrer"
                           class="w-9 h-9 rounded-full flex items-center justify-center shadow-sm hover:scale-110 transition-transform duration-200"
                           style="background: linear-gradient(135deg, ${link.color}, ${link.color}cc)">
                            <i class="${link.icon} text-white text-lg"></i>
                        </a>
                    `).join('')}
            </div>
        `;
    }

    render() {
        const loading = this.get('loading');
        
        // Get colors from state
        const primaryColor = this.get('primary_color');
        const secondaryColor = this.get('secondary_color');
        const accentColor = this.get('accent_color');
        const textColor = this.get('text_color');

        const pageData = this.get('pageData');
        // Banner logic
        let bannerImages = [];
        if (pageData && pageData.banner_image) {
            if (typeof pageData.banner_image === 'string') {
                try {
                    const parsed = JSON.parse(pageData.banner_image);
                    bannerImages = Array.isArray(parsed) ? parsed : [parsed];
                } catch (e) {
                    bannerImages = [pageData.banner_image];
                }
            } else if (Array.isArray(pageData.banner_image)) {
                bannerImages = pageData.banner_image;
            }
        }
        const showImages = bannerImages.length > 0;

        // Helper to get proper image URL
        function getImageUrl(imagePath) {
            if (!imagePath) return null;
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

        return `
            <!-- Contact Section Alt -->
            <section class="">
                <!-- Banner Section (like GallerySection) -->
                <div class="relative w-full h-[45vh] overflow-hidden mb-10">
                    ${showImages ? bannerImages.map((img, idx) => `
                        <div
                            class="absolute inset-0 w-full h-full bg-cover bg-center transition-opacity duration-1000 ${idx === 0 ? 'opacity-100 z-10' : 'opacity-0 z-0'}"
                            style="background-image: url('${getImageUrl(img)}'); transition-property: opacity;">
                        </div>
                    `).join('') : `
                        <div class="absolute inset-0 w-full h-full bg-gray-200 flex items-center justify-center z-10">
                            <div class="text-center">
                                <i class="fas fa-envelope text-gray-400 text-6xl mb-2"></i>
                                <p class="text-gray-500 font-medium">No Banner Image</p>
                            </div>
                        </div>
                    `}
                    <!-- Dark gradient overlay from bottom to top -->
                    <div class="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent z-20"></div>
                    <!-- Content Overlay -->
                    <div class="absolute inset-0 flex items-center justify-start z-30 container mx-auto">
                        <div class="text-left text-white px-4 lg:px-8 max-w-3xl space-y-6">
                            <h1 class="text-4xl md:text-5xl lg:text-6xl font-bold drop-shadow-lg pb-2 border-b-4 border-[${accentColor}] w-fit" style="line-height: 1.1">
                                ${pageData && pageData.title ? pageData.title : 'Contact Us'}
                            </h1>
                            ${pageData && pageData.subtitle ? `
                                <p class="text-lg md:text-xl lg:text-2xl opacity-95 leading-relaxed drop-shadow-md">
                                    ${pageData.subtitle}
                                </p>
                            ` : ''}
                        </div>
                    </div>
                </div>
                <div class="contaner lg:max-w-5xl mx-auto p-5 pb-20">
                    <div class="grid grid-cols-1 lg:grid-cols-2 gap-12">
                        <!-- Left Column: Page Content (if any) and Contact Information -->
                        <div class="space-y-8">
                            ${pageData && pageData.content ? `
                                <div class="mb-4 text-center bg-white rounded-xl p-6">
                                    <content-display content="${pageData.content.replace(/"/g, '&quot;')}" no-styles></content-display>
                                </div>
                            ` : ''}
                            <div class="bg-white rounded-[2rem] p-6">
                                <h2 class="text-2xl font-bold mb-6">Contact Information</h2>
                                <div class="space-y-6">
                                    <!-- Address -->
                                    <div class="flex items-start gap-4">
                                        <div class="w-12 h-12 bg-gradient-to-r from-[${primaryColor}] to-[${accentColor}] rounded-full flex items-center justify-center flex-shrink-0">
                                            <i class="fas fa-map-marker-alt text-white"></i>
                                        </div>
                                        <div>
                                            <h3 class="font-semibold mb-1">Address</h3>
                                            <p class="text-gray-600">${this.get('contactAddress') || '123 School Street, City, State 12345'}</p>
                                        </div>
                                    </div>
                                    <!-- Phone -->
                                    <div class="flex items-start gap-4">
                                        <div class="w-12 h-12 bg-gradient-to-r from-[${primaryColor}] to-[${accentColor}] rounded-full flex items-center justify-center flex-shrink-0">
                                            <i class="fas fa-phone text-white"></i>
                                        </div>
                                        <div>
                                            <h3 class="font-semibold mb-1">Phone</h3>
                                            <p class="text-gray-600">${this.get('contactPhone') || '+1 (555) 123-4567'}</p>
                                        </div>
                                    </div>
                                    <!-- Email -->
                                    <div class="flex items-start gap-4">
                                        <div class="w-12 h-12 bg-gradient-to-r from-[${primaryColor}] to-[${accentColor}] rounded-full flex items-center justify-center flex-shrink-0">
                                            <i class="fas fa-envelope text-white"></i>
                                        </div>
                                        <div>
                                            <h3 class="font-semibold mb-1">Email</h3>
                                            <p class="text-gray-600">${this.get('contactEmail') || 'info@school.edu'}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <!-- Contact Form -->
                        <div class="bg-white rounded-[2rem] p-6 h-fit">
                            <h2 class="text-2xl font-bold text-[${primaryColor}] mb-6">Send us a Message</h2>
                            <form class="space-y-6">
                                <!-- Name -->
                                <div>
                                    <label for="name" class="block text-sm font-medium text-gray-700 mb-2">
                                        Full Name *
                                    </label>
                                    <ui-input
                                        type="text"
                                        id="name"
                                        name="name"
                                        data-field="name"
                                        placeholder="Enter your full name"
                                        required>
                                    </ui-input>
                                </div>
                                <!-- Email -->
                                <div>
                                    <label for="email" class="block text-sm font-medium text-gray-700 mb-2">
                                        Email Address *
                                    </label>
                                    <ui-input
                                        type="email"
                                        id="email"
                                        name="email"
                                        data-field="email"
                                        placeholder="Enter your email address"
                                        required>
                                    </ui-input>
                                </div>
                                <!-- Subject -->
                                <div>
                                    <label for="subject" class="block text-sm font-medium text-gray-700 mb-2">
                                        Subject
                                    </label>
                                    <ui-input
                                        type="text"
                                        id="subject"
                                        name="subject"
                                        data-field="subject"
                                        placeholder="Enter message subject">
                                    </ui-input>
                                </div>
                                <!-- Message -->
                                <div>
                                    <label for="message" class="block text-sm font-medium text-gray-700 mb-2">
                                        Message *
                                    </label>
                                    <ui-textarea
                                        id="message"
                                        name="message"
                                        data-field="message"
                                        rows="5"
                                        placeholder="Enter your message"
                                        required></ui-textarea>
                                </div>
                                <!-- Submit Button -->
                                <button
                                    type="submit"
                                    disabled
                                    class="w-full bg-gradient-to-r from-[${primaryColor}] to-[${accentColor}] text-white font-semibold py-3 px-6 rounded-lg transition-all duration-300 transform shadow-lg opacity-50 cursor-not-allowed">
                                    ${loading ? `
                                        <div class="flex items-center justify-center gap-2">
                                            <div class="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                            Sending Message...
                                        </div>
                                    ` : `
                                        <div class="flex items-center justify-center gap-2">
                                            <i class="fas fa-paper-plane"></i>
                                            Send Message
                                        </div>
                                    `}
                                </button>
                                <!-- Social Media Links -->
                                ${this.hasSocialMediaLinks() ? `
                                    <div class="border-t border-gray-200 pt-6">
                                        <div class="mb-2">${this.renderSocialMediaLinks()}</div>
                                    </div>
                                ` : ''}
                            </form>
                        </div>
                    </div>
                    <!-- Map Section -->
                    <div class="mt-16">
                        <div class="text-center mb-8">
                            <h2 class="text-3xl font-bold text-[${secondaryColor}] mb-4">Find Us</h2>
                            <p class="text-gray-600 max-w-2xl mx-auto">
                                Visit our campus and experience our facilities firsthand
                            </p>
                            <div class="w-24 h-1 bg-gradient-to-r from-[${primaryColor}] to-[${accentColor}] mx-auto mt-4 rounded-full"></div>
                        </div>
                        <div class="bg-white rounded-[2rem] shadow-2xl overflow-hidden">
                            <!-- Map Embed -->
                            <div class="relative h-96">
                                ${this.get('mapEmbedUrl') ? `
                                    <iframe 
                                        src="${this.get('mapEmbedUrl')}"
                                        title="${this.get('mapLocationName')}"
                                        class="w-full h-full"
                                        frameborder="0" 
                                        allowfullscreen>
                                    </iframe>
                                ` : ''}
                            </div>
                            <!-- Map Info -->
                            <div class="p-6 bg-gray-50">
                                <div class="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                                    <div>
                                        <i class="fas fa-map-marker-alt text-xl mb-2"></i>
                                        <h4 class="font-semibold text-[${primaryColor}]">Location</h4>
                                        <p class="text-[${primaryColor}] text-sm">${this.get('mapLocationName')}</p>
                                    </div>
                                    <div>
                                        <i class="fas fa-route text-[${primaryColor}] text-xl mb-2"></i>
                                        <h4 class="font-semibold text-[${primaryColor}]">Coordinates</h4>
                                        <p class="text-[${primaryColor}] text-sm">${this.get('mapLatitude')}, ${this.get('mapLongitude')}</p>
                                    </div>
                                    <div>
                                        <i class="fas fa-search-plus text-[${primaryColor}] text-xl mb-2"></i>
                                        <h4 class="font-semibold text-[${primaryColor}]">Zoom Level</h4>
                                        <p class="text-[${primaryColor}] text-sm">${this.get('mapZoomLevel')}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        `;
    }
}

customElements.define('contact-section-alt', ContactSectionAlt);
export default ContactSectionAlt; 