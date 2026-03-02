import App from '@/core/App.js';
import store from '@/core/store.js';
import api from '@/services/api.js';
import { fetchColorSettings } from '@/utils/colorSettings.js';
import '@/components/ui/Link.js';

class Header extends App {
  unsubscribe = null;

  connectedCallback() {
    super.connectedCallback();
    this.fetchSchoolLogo();
    this.fetchContactInfo();
    this.fetchColorSettings();
    this.fetchSocialUrls();
    this.setupMobileMenuEvents();

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

  setupMobileMenuEvents() {
    this.addEventListener('click', (e) => {
      const toggleButton = e.target.closest('[data-mobile-toggle]');
      if (toggleButton) {
        e.preventDefault();
        this.toggleMobileMenu();
      }

      const overlay = e.target.closest('[data-mobile-overlay]');
      if (overlay) {
        e.preventDefault();
        this.toggleMobileMenu();
      }

      // Handle mobile submenu toggles
      const submenuToggle = e.target.closest('[data-mobile-submenu-toggle]');
      if (submenuToggle) {
        e.preventDefault();
        this.toggleMobileSubmenu(submenuToggle);
      }
    });

    // Close mobile menu on window resize
    window.addEventListener('resize', () => {
      if (window.innerWidth >= 1024) {
        this.closeMobileMenu();
      }
    });
  }

  toggleMobileMenu() {
    const mobileMenu = this.querySelector('[data-mobile-menu]');
    const overlay = this.querySelector('[data-mobile-overlay]');

    if (mobileMenu && overlay) {
      const isOpen = mobileMenu.classList.contains('translate-x-0');

      if (isOpen) {
        // Close menu
        mobileMenu.classList.remove('translate-x-0');
        mobileMenu.classList.add('-translate-x-full');
        overlay.classList.remove('opacity-100', 'pointer-events-auto');
        overlay.classList.add('opacity-0', 'pointer-events-none');
      } else {
        // Open menu
        mobileMenu.classList.remove('-translate-x-full');
        mobileMenu.classList.add('translate-x-0');
        overlay.classList.remove('opacity-0', 'pointer-events-none');
        overlay.classList.add('opacity-100', 'pointer-events-auto');
      }
    }
  }

  closeMobileMenu() {
    const mobileMenu = this.querySelector('[data-mobile-menu]');
    const overlay = this.querySelector('[data-mobile-overlay]');

    if (mobileMenu && overlay) {
      mobileMenu.classList.remove('translate-x-0');
      mobileMenu.classList.add('-translate-x-full');
      overlay.classList.remove('opacity-100', 'pointer-events-auto');
      overlay.classList.add('opacity-0', 'pointer-events-none');
    }
  }

  toggleMobileSubmenu(toggleButton) {
    const submenu = toggleButton.nextElementSibling;
    const icon = toggleButton.querySelector('i');

    if (submenu && icon) {
      const isOpen = submenu.classList.contains('max-h-96');

      if (isOpen) {
        // Close submenu
        submenu.classList.remove('max-h-96', 'opacity-100');
        submenu.classList.add('max-h-0', 'opacity-0');
        icon.classList.remove('rotate-180');
      } else {
        // Open submenu
        submenu.classList.remove('max-h-0', 'opacity-0');
        submenu.classList.add('max-h-96', 'opacity-100');
        icon.classList.add('rotate-180');
      }
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
        'youtube_url',
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
      socialResults.forEach((result) => {
        if (result) {
          this.set(result.key, result.value);
        }
      });
    } catch (error) {
      console.error('Error fetching social URLs:', error);
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
    const hoverAccent = this.get('hover_accent');

    // Only render if we have the essential colors
    if (!primaryColor || !textColor || !secondaryColor) {
      return '';
    }

    // Navigation links array (customize for church if needed)
    const navigationLinks = [
      { href: '/', label: 'Home' },
      { href: '/public/about', label: 'About Us' },
      { href: '/public/ministries', label: 'Ministries' },
      { href: '/public/service-events', label: 'Service & Events' },
      { href: '/public/gallery', label: 'Gallery' },
      { href: '/public/life-group', label: 'Life Group' },
      { href: '/public/give', label: 'Give' },
    ];

    // Helper function to render navigation links
    const renderNavLinks = (isMobile = false) => {
      const currentPath = window.location.pathname;
      const isActive = (href) => {
        if (href === '/') return currentPath === '/';
        return currentPath === href || currentPath.startsWith(href + '/');
      };
      return navigationLinks
        .map(
          (link) => `
          <ui-link href="${link.href}" class="nav-link ${
            isMobile ? `block w-full py-2 text-lg` : `inline-block py-1`
          } text-[${textColor}] font-medium transition-all duration-300 ease-in-out ${
            isActive(link.href) ? 'active-link' : ''
          }">
            ${link.label}
          </ui-link>
        `,
        )
        .join('');
    };

    // Add styles for active link
    const style = `
        <style>
          .active-link {
            color: ${accentColor} !important;
            border-bottom: 5px solid ${accentColor} !important;
            opacity: 1 !important;
            font-weight: bold !important;
          }
          .nav-link {
            border-bottom: 5px solid transparent;
            transition: border-color 0.2s, color 0.2s;
          }
          .nav-link:hover {
            border-bottom: 5px solid ${hoverAccent};
            color: ${hoverAccent};
            
          }
        </style>
      `;

    return `
        <div class="relative">
          ${style}
          <header class="sticky top-0 z-50 bg-[${primaryColor}]">
            <div class="flex container mx-auto items-center justify-between p-3 lg:p-5">
              <!-- Logo on the left -->
              <ui-link href="/" class="flex items-center mr-4">
                <img class="w-36 lg:w-44 max-w-none" src="${this.get(
                  'logoUrl',
                )}" alt="Church Logo" />
              </ui-link>
              <!-- Nav links (center, after logo) -->
              <nav class="hidden xl:flex flex-1 items-center ml-[5vw] space-x-[5%]">
                ${renderNavLinks(false)}
              </nav>
              <!-- Contact Us button on the right -->
              <a href="/public/contact" class="hidden xl:inline-flex items-center px-6 py-2 bg-[${secondaryColor}] text-[${primaryColor}] font-bold rounded-full shadow-lg focus:outline-none focus:ring-2 focus:ring-[${secondaryColor}] focus:ring-offset-2 transition-all duration-300 ml-4 space-x-2">
                <i class="fas fa-phone"></i>
                <span class="">Contact Us</span>
              </a>
              <!-- Mobile Menu Button -->
              <button data-mobile-toggle class="xl:hidden text-[${textColor}] size-8 rounded-md ml-auto">
                <i class="fas fa-bars"></i>
              </button>
            </div>
          </header>

          <!-- Mobile Overlay -->
          <div data-mobile-overlay class="fixed inset-0 bg-black bg-opacity-50 z-40 opacity-0 pointer-events-none transition-opacity duration-300 xl:hidden"></div>

          <!-- Mobile Menu -->
          <div data-mobile-menu class="fixed inset-0 bg-[${primaryColor}] z-50 transform -translate-x-full transition-transform duration-300 xl:hidden">
            <div class="flex items-center justify-between p-4 border-b border-[${primaryColor}]">
              <img class="w-36 max-w-none" src="${this.get(
                'logoUrl',
              )}" alt="Church Logo" />
              <button data-mobile-toggle class="text-[${textColor}] size-8 rounded-md">
                <i class="fas fa-times"></i>
              </button>
            </div>
            <div class="flex flex-col gap-2 items-start p-4 overflow-y-auto w-full">
              <nav class="flex flex-col items-center justify-center space-y-2 w-full">
                ${renderNavLinks(true)}
              </nav>
              <a href="/public/contact" class="mt-6 w-full inline-flex items-center justify-center px-6 py-3 bg-[${secondaryColor}] text-[${primaryColor}] font-bold rounded-full shadow-lg focus:outline-none focus:ring-2 focus:ring-[${secondaryColor}] focus:ring-offset-2 transition-all duration-300 space-x-2">
                <i class="fas fa-phone"></i>
                <span class="">Contact Us</span>
              </a>
            </div>
          </div>
        </div>
      `;
  }
}

customElements.define('app-header', Header);
export default Header;
