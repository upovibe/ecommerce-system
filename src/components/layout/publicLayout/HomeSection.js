import App from '@/core/App.js';
import { unescapeJsonFromAttribute } from '@/utils/jsonUtils.js';
import '@/components/ui/ContentDisplay.js';

/**
 * Home Section Component
 *
 * Displays home content with just the content display.
 * Accepts color theming via 'colors' attribute and page data.
 */
class HomeSection extends App {
    constructor() {
        super();
    }

    connectedCallback() {
        super.connectedCallback();
        this.loadDataFromProps();
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
                // Set textbox background color for content styling
                if (settings.textbox_bg_color) {
                    this.set('textboxBgColor', settings.textbox_bg_color);
                }
            }
        }

        // Render immediately with the data
        this.render();
    }

    render() {
        // Get page data from state
        const pageData = this.get('pageData') || {};

        // Get colors from state
        const primaryColor = this.get('primary_color');
        const secondaryColor = this.get('secondary_color');
        const accentColor = this.get('accent_color');
        const textColor = this.get('text_color');
        const darkColor = this.get('dark_color');
        const hoverPrimary = this.get('hover_primary');
        const hoverSecondary = this.get('hover_secondary');
        const hoverAccent = this.get('hover_accent');
        const textboxBgColor = this.get('textboxBgColor');

        return `
        <!-- Home Content Section -->
        <div class="container mx-auto px-4 py-8">
            <!-- Content Display -->
            ${pageData.content ? `
                <div class="rounded-3xl shadow-lg overflow-hidden mb-20" style="background-color: ${textboxBgColor}AA;">
                    <div class="p-5 lg:p-12">
                        <content-display
                            content="${pageData.content.replace(/"/g, '&quot;')}"
                            no-styles>
                        </content-display>
                    </div>
                </div>
            ` : ''}
        </div>
        `;
    }
}

customElements.define('home-section', HomeSection);
export default HomeSection;
