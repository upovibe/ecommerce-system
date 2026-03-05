import App from "@/core/App.js";
import api from "@/services/api.js";
import { fetchColorSettings } from "@/utils/colorSettings.js";
import "@/components/ui/Link.js";
import "@/components/ui/Toast.js";
import "@/components/ui/DropdownMenu.js";
import "@/components/ui/Avatar.js";

class AdminLayout extends App {
  constructor() {
    super();
    this.pageContent = "";
    this.currentUser = null;
    this.sidebarOpen = false;
    this.logoUrl = null;
    this.brandName = "VastCommerce";
    this.collapsedGroups = new Set();

    // Default colours while loading
    this.set("primary_color", "#4f46e5");
    this.set("secondary_color", "#64748b");
    this.set("accent_color", "#4338ca");
    this.set("text_color", "#f8fafc");
    this.set("dark_color", "#0f172a");
    this.set("error_color", "#ef4444");
  }

  async connectedCallback() {
    super.connectedCallback();

    if (!localStorage.getItem("token")) {
      window.location.href = "/auth/login";
      return;
    }

    await this.loadUserData();
    await this.loadTheme();
    this.setupEventListeners();

    window.addEventListener("route-changed", (e) => {
      this.updateActiveNav();
    });
    window.addEventListener("user-data-updated", () => {
      this.currentUser = JSON.parse(localStorage.getItem("userData") || "{}");
      this.innerHTML = this.render();
    });
  }

  async loadUserData() {
    const stored = JSON.parse(localStorage.getItem("userData") || "{}");
    const userId = stored?.id;
    const token = localStorage.getItem("token");

    if (userId && token) {
      try {
        const res = await api.withToken(token).get(`/users/${userId}/profile`);
        this.currentUser = { ...stored, ...(res.data || {}) };
        localStorage.setItem("userData", JSON.stringify(this.currentUser));
      } catch (e) {
        this.currentUser = stored;
      }
    } else {
      this.currentUser = stored;
    }
  }

  async loadTheme() {
    try {
      const [logoRes, nameRes, colors] = await Promise.all([
        api.get("/settings/key/site_logo").catch(() => null),
        api.get("/settings/key/site_name").catch(() => null),
        fetchColorSettings().catch(() => ({})),
      ]);

      if (logoRes?.data?.success)
        this.logoUrl = logoRes.data.data.setting_value;
      if (nameRes?.data?.success)
        this.brandName = nameRes.data.data.setting_value;
      Object.entries(colors).forEach(([k, v]) => this.set(k, v));

      this.innerHTML = this.render();
      this.setupEventListeners();
    } catch (e) {
      console.warn("Theme loading failed", e);
    }
  }

  setupEventListeners() {
    this.addEventListener("click", (e) => {
      if (e.target.closest("[data-sidebar-toggle]")) {
        e.preventDefault();
        this.toggleSidebar();
      }
      if (e.target.closest('[data-action="logout"]')) {
        e.preventDefault();
        this.handleLogout();
      }
      const groupToggle = e.target.closest("[data-group-toggle]");
      if (groupToggle) {
        e.preventDefault();
        this.toggleGroup(groupToggle.getAttribute("data-group-name"));
      }
    });
  }

  toggleSidebar() {
    this.sidebarOpen = !this.sidebarOpen;
    const container = this.querySelector("[data-layout-container]");
    if (container) {
      container.classList.toggle("sidebar-open", this.sidebarOpen);
    }
  }

  toggleGroup(groupName) {
    if (this.collapsedGroups.has(groupName)) {
      this.collapsedGroups.delete(groupName);
    } else {
      this.collapsedGroups.add(groupName);
    }
    this.updateSidebarNavigation();
  }

  updateSidebarNavigation() {
    const nav = this.querySelector("nav");
    if (nav) {
      nav.innerHTML = this.renderNav();
    }
  }

  updateActiveNav() {
    // Just re-render nav to update active states
    const nav = this.querySelector("nav");
    if (nav) nav.innerHTML = this.renderNav();
    // Update page title
    const title = this.querySelector("[data-page-title]");
    if (title) title.textContent = this.getPageTitle();
  }

  handleLogout() {
    localStorage.removeItem("token");
    localStorage.removeItem("userData");
    window.location.href = "/auth/login";
  }

  setPageContent(content) {
    this.pageContent = content;
    // Prefer partial update to avoid layout flicker
    const pageInner = this.querySelector("[data-page-inner]");
    if (pageInner) {
      pageInner.innerHTML = this.pageContent;
      this.updateActiveNav();
      return;
    }
    this.innerHTML = this.render();
    this.setupEventListeners();
  }

  getNavigationItems() {
    const path = window.location.pathname;
    const groups = [
      {
        group: "Dashboard",
        items: [
          {
            label: "Overview",
            icon: "fas fa-th-large",
            href: "/dashboard/admin",
          },
        ],
      },
      {
        group: "Management",
        items: [
          {
            label: "Inventory",
            icon: "fas fa-shopping-basket",
            href: "/dashboard/admin/products",
          },
          {
            label: "Orders",
            icon: "fas fa-receipt",
            href: "/dashboard/admin/orders",
          },
          {
            label: "Categories",
            icon: "fas fa-layer-group",
            href: "/dashboard/admin/categories",
          },
        ],
      },
      {
        group: "Administration",
        items: [
          {
            label: "Staff & Users",
            icon: "fas fa-user-shield",
            href: "/dashboard/admin/users",
          },
          {
            label: "Cloud Pages",
            icon: "fas fa-pager",
            href: "/dashboard/admin/pages",
          },
        ],
      },
      {
        group: "Settings",
        items: [
          {
            label: "Preferences",
            icon: "fas fa-sliders-h",
            href: "/dashboard/admin/settings",
          },
        ],
      },
    ];

    groups.forEach((g) => {
      g.items = g.items.map((item) => ({
        ...item,
        active: path === item.href,
      }));
    });
    return groups;
  }

  getPageTitle() {
    const segments = window.location.pathname.split("/").filter(Boolean);
    const last = segments[segments.length - 1] || "dashboard";
    const map = {
      admin: "Overview",
      overview: "Overview",
      products: "Inventory",
      orders: "Orders",
      categories: "Categories",
      users: "Staff & Users",
      pages: "Cloud Pages",
      settings: "Preferences",
      profile: "Profile",
    };
    return map[last] || last.charAt(0).toUpperCase() + last.slice(1);
  }

  getImageUrl(path) {
    if (!path) return "";
    if (path.startsWith("http://") || path.startsWith("https://")) return path;
    return (
      window.location.origin + (path.startsWith("/") ? path : `/api/${path}`)
    );
  }

  renderNav() {
    const path = window.location.pathname;
    const primaryColor = this.get("primary_color");
    const accentColor = this.get("accent_color");
    const textColor = this.get("text_color");
    const secondaryColor = this.get("secondary_color");
    const groups = this.getNavigationItems();

    return groups
      .map(
        (group) => `
      <div class="mb-4">
        <div
          data-group-toggle
          data-group-name="${group.group}"
          class="flex items-center justify-between text-xs font-semibold uppercase text-[${textColor || "#bfdbfe"}]/60 mb-2 pl-2 tracking-wide cursor-pointer hover:text-white transition-colors"
        >
          <span>${group.group}</span>
          <i class="fas fa-chevron-down text-xs transition-transform duration-200 ${this.collapsedGroups.has(group.group) ? "rotate-180" : ""}"></i>
        </div>
        <div class="flex flex-col gap-1 ${this.collapsedGroups.has(group.group) ? "hidden" : ""}">
          ${group.items
            .map(
              (item) => `
            <ui-link
              href="${item.href}"
              class="group flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors no-underline ${
                item.active
                  ? `bg-[${accentColor}] text-white`
                  : `text-[${textColor}]/80 hover:bg-[${secondaryColor}]/30 hover:text-white`
              }"
            >
              <i class="${item.icon} w-5 flex items-center justify-center"></i>
              <span>${item.label}</span>
            </ui-link>
          `,
            )
            .join("")}
        </div>
      </div>
    `,
      )
      .join("");
  }

  render() {
    const primaryColor = this.get("primary_color") || "#4f46e5";
    const secondaryColor = this.get("secondary_color") || "#64748b";
    const textColor = this.get("text_color") || "#f8fafc";
    const darkColor = this.get("dark_color") || "#0f172a";
    const errorColor = this.get("error_color") || "#ef4444";

    const user = this.currentUser || {};
    const userName = user.name || user.username || "Admin";
    const email = user.email || "";

    return `
      <style>
        [data-layout-container] {
          display: flex;
          height: 100vh;
          width: 100%;
          overflow: hidden;
        }
        [data-sidebar] {
          width: 256px;
          flex-shrink: 0;
          background-color: ${primaryColor};
          transform: translateX(-100%);
          transition: transform 0.3s ease-in-out;
          z-index: 50;
        }
        @media (min-width: 1280px) {
          [data-sidebar] { transform: translateX(0); }
        }
        .sidebar-open [data-sidebar] { transform: translateX(0); }
        [data-sidebar-overlay] {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.5);
          z-index: 40;
          opacity: 0;
          pointer-events: none;
          transition: opacity 0.3s;
        }
        .sidebar-open [data-sidebar-overlay] { opacity: 1; pointer-events: auto; }
        @media (min-width: 1280px) { [data-sidebar-overlay] { display: none; } }
      </style>

      <div data-layout-container>
        <!-- Overlay -->
        <div data-sidebar-overlay data-sidebar-toggle></div>

        <!-- Sidebar -->
        <aside data-sidebar class="fixed inset-y-0 left-0 text-white flex flex-col shadow-lg">
          <div class="flex items-center justify-between h-16 px-4 border-b border-[${secondaryColor}]/40 flex-shrink-0">
            <div class="flex items-center gap-3">
              ${
                this.logoUrl
                  ? `<img src="${this.getImageUrl(this.logoUrl)}" alt="Logo" class="w-8 h-8 object-contain" />`
                  : `<i class="fas fa-shopping-bag text-white text-xl"></i>`
              }
              <span class="text-base font-black tracking-tight">${this.brandName}</span>
            </div>
            <button type="button" data-sidebar-toggle class="xl:hidden w-8 h-8 flex items-center justify-center rounded-md text-white/70 hover:text-white hover:bg-white/10">
              <i class="fas fa-times"></i>
            </button>
          </div>

          <nav class="flex-1 px-4 py-4 overflow-y-auto flex flex-col gap-2">
            ${this.renderNav()}
          </nav>

          <div class="p-4 border-t border-[${secondaryColor}]/40 flex-shrink-0">
            <button data-action="logout" class="group flex items-center gap-3 w-full px-3 py-2 text-sm font-medium text-[${errorColor}]/80 hover:bg-[${errorColor}] hover:text-white rounded-md transition-colors">
              <i class="fas fa-sign-out-alt w-5 flex items-center justify-center"></i>
              <span>Logout</span>
            </button>
          </div>
        </aside>

        <!-- Main Content — same pattern as church/school system -->
        <div class="flex-1 flex flex-col xl:ml-64 overflow-hidden">
          <!-- Header -->
          <header class="sticky top-0 z-30 bg-white/80 backdrop-blur-md shadow-sm border-b border-gray-200/50 flex-shrink-0 h-16">
            <div class="flex items-center justify-between px-4 h-full">
              <div class="flex items-center gap-4 min-w-0 flex-1">
                <button type="button" data-sidebar-toggle class="xl:hidden w-8 h-8 flex items-center justify-center rounded-md text-slate-500 hover:bg-slate-100">
                  <i class="fas fa-bars"></i>
                </button>
                <h1 data-page-title class="text-lg font-bold text-[${darkColor}]">${this.getPageTitle()}</h1>
              </div>

              <div class="flex items-center gap-4 flex-shrink-0">
                <ui-dropdown-menu>
                  <ui-dropdown-menu-trigger>
                    <div class="flex items-center gap-2.5 p-1 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer">
                      <div class="text-right hidden sm:block">
                        <p class="text-xs font-black text-slate-900 leading-none">${userName}</p>
                        <p class="text-[10px] text-indigo-600 font-semibold leading-none mt-0.5">Super Admin</p>
                      </div>
                      <ui-avatar
                        name="${userName}"
                        src="${user.profile_image ? this.getImageUrl(user.profile_image) : ""}"
                        size="md">
                      </ui-avatar>
                    </div>
                  </ui-dropdown-menu-trigger>
                  <ui-dropdown-menu-content>
                    <ui-dropdown-menu-label>My Account</ui-dropdown-menu-label>
                    <ui-dropdown-menu-separator></ui-dropdown-menu-separator>
                    <div class="px-3 py-2">
                      <p class="text-sm font-semibold text-gray-700">${userName}</p>
                      <p class="text-xs text-gray-500">${email}</p>
                    </div>
                    <ui-dropdown-menu-separator></ui-dropdown-menu-separator>
                    <ui-dropdown-menu-item>
                      <a href="/dashboard/admin/profile" class="w-full flex items-center no-underline text-gray-700 hover:text-gray-900">
                        <i class="fas fa-user w-4 h-4 mr-3"></i> Profile
                      </a>
                    </ui-dropdown-menu-item>
                    <ui-dropdown-menu-item>
                      <a href="/dashboard/admin/settings" class="w-full flex items-center no-underline text-gray-700 hover:text-gray-900">
                        <i class="fas fa-cog w-4 h-4 mr-3"></i> Preferences
                      </a>
                    </ui-dropdown-menu-item>
                    <ui-dropdown-menu-separator></ui-dropdown-menu-separator>
                    <ui-dropdown-menu-item color="red">
                      <button data-action="logout" class="w-full flex items-center text-[${errorColor}] hover:text-red-700 bg-transparent border-none cursor-pointer p-0">
                        <i class="fas fa-sign-out-alt w-4 h-4 mr-3"></i> Logout
                      </button>
                    </ui-dropdown-menu-item>
                  </ui-dropdown-menu-content>
                </ui-dropdown-menu>
              </div>
            </div>
          </header>

          <!-- Page Content — overflow-y:auto scrolls the page independently -->
          <main class="flex-1 bg-transparent overflow-y-auto">
            <div data-page-inner class="container mx-auto p-6">
              ${this.pageContent}
            </div>
          </main>
        </div>
      </div>
    `;
  }
}

customElements.define("app-admin-layout", AdminLayout);
export default AdminLayout;
