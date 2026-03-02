import App from '@/core/App.js';
import { unescapeJsonFromAttribute } from '@/utils/jsonUtils.js';

/**
 * Ministries Section Component
 *
 * Displays ministries content with simple text.
 * Accepts color theming via 'colors' attribute and page data.
 */
class MinistriesSection extends App {
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

        // Render immediately with the data
        this.render();
    }

    render() {
        // Get colors from state
        const primaryColor = this.get('primary_color');
        const secondaryColor = this.get('secondary_color');
        const accentColor = this.get('accent_color');
        const textColor = this.get('text_color');

        // Get page data from state
        const pageData = this.get('pageData') || {};

        return `
        <section class="py-16 bg-[${primaryColor}]">
            <div class="container mx-auto px-4">
                <div class="text-center">
                    <h1 class="text-4xl md:text-5xl lg:text-6xl font-bold text-[${textColor}] mb-4">
                        Ministries
                    </h1>
                    <p class="text-xl text-[${textColor}]/80">
                        Welcome to our ministries page
                    </p>
                </div>
            </div>
        </section>
        `;
    }
}

customElements.define('ministries-section', MinistriesSection);
export default MinistriesSection; 