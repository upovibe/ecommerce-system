import App from "@/core/App.js";
import "@/components/ui/DropdownMenu.js";
import "@/components/ui/Avatar.js";
import "@/components/ui/Button.js";
import "@/components/ui/Link.js";
import api from "@/services/api.js";
import { fetchColorSettings } from "@/utils/colorSettings.js";

class AdminLayout extends App {
  constructor() {
    super();
    this.userData = JSON.parse(localStorage.getItem("userData") || "{}");
    this.currentPath = window.location.pathname;
    this.sidebarOpen = false;
    this.collapsedGroups = new Set();
    this.logoUrl = null;
    this.brandName = "VastCommerce";

    // Default colors while loading
    this.set("primary_color", "#2563eb");
    this.set("secondary_color", "#3b82f6");
    this.set("accent_color", "#4f46e5");
    this.set("text_color", "#f8fafc");
    this.set("dark_color", "#0f172a");

    this.pageContent = "";
  }

  rerender() {
    if (this.isConnected) {
      this.innerHTML = this.render();
    }
  }

  setPageContent(content) {
    this.pageContent = content;
    const contentContainer = this.querySelector("[data-page-content]");
    if (contentContainer) {
      contentContainer.innerHTML = this.pageContent;
      this.updateRouteUI();
      return;
    }
    this.rerender();
  }

  async connectedCallback() {
    super.connectedCallback();

    if (!localStorage.getItem("token")) {
      window.location.href = "/auth/login";
      return;
    }

    await this.loadUserData();

    // Listen for route changes
    window.addEventListener("route-changed", (e) => {
      this.currentPath = e.detail.path;
      this.updateRouteUI();
    });
    window.addEventListener("user-data-updated", () => {
      this.userData = JSON.parse(localStorage.getItem("userData") || "{}");
      this.rerender();
    });

    await this.loadTheme();
    this.setupEventListeners();
  }

  async loadUserData() {
    const storedUserData = JSON.parse(localStorage.getItem("userData") || "{}");
    const userId = storedUserData?.id;
    const token = localStorage.getItem("token");

    if (!userId || !token) {
      this.userData = storedUserData;
      return;
    }

    try {
      const response = await api
        .withToken(token)
        .get(`/users/${userId}/profile`);
      this.userData = { ...storedUserData, ...(response.data || {}) };
      localStorage.setItem("userData", JSON.stringify(this.userData));
    } catch (error) {
      this.userData = storedUserData;
      console.warn("Failed to refresh user profile in layout", error);
    }
  }

  async loadTheme() {
    try {
      // Fetch logo
      const logoResp = await api.get("/settings/key/site_logo");
      if (logoResp.data?.success) {
        this.logoUrl = logoResp.data.data.setting_value;
      }

      // Fetch name
      const nameResp = await api.get("/settings/key/site_name");
      if (nameResp.data?.success) {
        this.brandName = nameResp.data.data.setting_value;
      }

      // Fetch colors
      const colors = await fetchColorSettings();
      Object.entries(colors).forEach(([key, value]) => {
        this.set(key, value);
      });

      this.rerender();
    } catch (e) {
      console.warn("Theme loading failed", e);
    }
  }

  setupEventListeners() {
    this.addEventListener("click", (e) => {
      const toggleBtn = e.target.closest("[data-sidebar-toggle]");
      if (toggleBtn) {
        e.preventDefault();
        this.toggleSidebar();
      }

      const logoutBtn = e.target.closest('[data-action="logout"]');
      if (logoutBtn) {
        e.preventDefault();
        this.handleLogout();
      }

      const groupToggle = e.target.closest("[data-group-toggle]");
      if (groupToggle) {
        e.preventDefault();
        const groupName = groupToggle.getAttribute("data-group-name");
        this.toggleGroup(groupName);
      }
    });

    const dropdown = this.querySelector("ui-dropdown-menu");
    if (dropdown) {
      dropdown.addEventListener("item-click", (e) => {
        if (e.detail.action === "logout") this.handleLogout();
      });
    }
  }

  toggleSidebar() {
    this.sidebarOpen = !this.sidebarOpen;
    const container = this.querySelector("[data-layout-container]");
    if (this.sidebarOpen) {
      container.classList.add("sidebar-open");
    } else {
      container.classList.remove("sidebar-open");
    }
  }

  toggleGroup(groupName) {
    if (this.collapsedGroups.has(groupName)) {
      this.collapsedGroups.delete(groupName);
    } else {
      this.collapsedGroups.add(groupName);
    }
    this.rerender();
  }

  updateRouteUI() {
    const textColor = this.get("text_color") || "#f8fafc";
    const title = this.querySelector("[data-page-title]");
    if (title) {
      title.textContent = this.getPageTitle().toUpperCase();
    }

    const navLinks = this.querySelectorAll("ui-link[href]");
    navLinks.forEach((link) => {
      const href = link.getAttribute("href");
      const icon = link.querySelector("i");
      const isActive = href === this.currentPath;

      if (isActive) {
        link.classList.add("active", "shadow-lg", "shadow-black/10");
        link.classList.remove(
          `text-[${textColor}]/70`,
          "hover:bg-white/5",
          "hover:text-white",
        );
        if (icon) {
          icon.classList.add("text-white");
          icon.classList.remove(
            `text-[${textColor}]/40`,
            "group-hover:text-white",
          );
        }
      } else {
        link.classList.remove("active", "shadow-lg", "shadow-black/10");
        link.classList.add(
          `text-[${textColor}]/70`,
          "hover:bg-white/5",
          "hover:text-white",
        );
        if (icon) {
          icon.classList.remove("text-white");
          icon.classList.add(
            `text-[${textColor}]/40`,
            "group-hover:text-white",
          );
        }
      }
    });
  }

  handleLogout() {
    localStorage.removeItem("token");
    localStorage.removeItem("userData");
    window.location.href = "/auth/login";
  }

  getNavigationItems() {
    const path = this.currentPath;
    return [
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
    ].map((group) => ({
      ...group,
      items: group.items.map((item) => ({
        ...item,
        active: path === item.href,
      })),
    }));
  }

  getPageTitle() {
    const segments = this.currentPath.split("/").filter(Boolean);
    const last = segments[segments.length - 1] || "Dashboard";
    return last.charAt(0).toUpperCase() + last.slice(1);
  }

  getImageUrl(path) {
    if (!path) return "";
    if (path.startsWith("http://") || path.startsWith("https://")) return path;
    return (
      window.location.origin + (path.startsWith("/") ? path : `/api/${path}`)
    );
  }

  render() {
    const primaryColor = this.get("primary_color");
    const secondaryColor = this.get("secondary_color");
    const accentColor = this.get("accent_color");
    const textColor = this.get("text_color");
    const darkColor = this.get("dark_color");

    const navigationGroups = this.getNavigationItems();

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
          .nav-item.active {
              background-color: ${accentColor};
              color: white;
          }
      </style>

      <div data-layout-container class="${this.sidebarOpen ? "sidebar-open" : ""}">
          <!-- Sidebar Overlay -->
          <div data-sidebar-overlay data-sidebar-toggle></div>

          <!-- Sidebar -->
          <aside data-sidebar class="fixed inset-y-0 left-0 text-white flex flex-col shadow-2xl">
              <div class="flex items-center justify-between h-16 px-5 border-b border-[${secondaryColor}]/30 flex-shrink-0 bg-[${darkColor}]/10">
                  <div class="flex items-center gap-2.5">
                      <div class="w-9 h-9 bg-white/10 rounded-xl flex items-center justify-center backdrop-blur-md">
                          ${this.logoUrl ? `<img src="${this.logoUrl}" class="w-6 h-6 object-contain">` : `<i class="fas fa-shopping-bag text-white text-sm"></i>`}
                      </div>
                      <span class="text-lg font-black tracking-tight font-brand">${this.brandName}</span>
                  </div>
                  <button data-sidebar-toggle class="xl:hidden p-2 rounded-lg hover:bg-white/10">
                      <i class="fas fa-times"></i>
                  </button>
              </div>

              <nav class="flex-1 px-3 py-4 overflow-y-auto space-y-5">
                  ${navigationGroups
                    .map(
                      (group) => `
                      <div>
                          <div data-group-toggle data-group-name="${group.group}" class="flex items-center justify-between px-3 mb-1.5 cursor-pointer group">
                              <span class="text-[10px] font-black uppercase tracking-[0.2em] text-[${textColor}]/50 group-hover:text-white transition-colors">${group.group}</span>
                              <i class="fas fa-chevron-down text-[8px] transition-transform duration-300 ${this.collapsedGroups.has(group.group) ? "rotate-180" : ""} text-[${textColor}]/30"></i>
                          </div>
                          <div class="space-y-0.5 ${this.collapsedGroups.has(group.group) ? "hidden" : ""}">
                                  ${group.items
                                    .map(
                                      (item) => `
                                  <ui-link href="${item.href}" class="nav-item group flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-bold no-underline transition-all ${item.active ? "active shadow-lg shadow-black/10" : `text-[${textColor}]/70 hover:bg-white/5 hover:text-white`}">
                                      <i class="${item.icon} w-5 text-center ${item.active ? "text-white" : `text-[${textColor}]/40 group-hover:text-white`}"></i>
                                      <span>${item.label}</span>
                                  </ui-link>
                              `,
                                    )
                                    .join("")}
                          </div>
                      </div>
                  `,
                    )
                    .join("")}
              </nav>

              <div class="p-3 border-t border-[${secondaryColor}]/30 bg-[${darkColor}]/5">
                  <button data-action="logout" class="flex items-center gap-3 w-full px-3.5 py-2.5 rounded-xl text-sm font-bold text-rose-200 hover:bg-rose-500 hover:text-white transition-all">
                      <i class="fas fa-sign-out-alt w-5"></i>
                      <span>Terminate Session</span>
                  </button>
              </div>
          </aside>

          <!-- Main Content -->
          <main class="flex-1 xl:ml-[256px] flex flex-col min-h-screen bg-slate-50 relative">
              <header class="h-16 px-6 flex items-center justify-between bg-white border-b border-slate-200 sticky top-0 z-30">
                  <div class="flex items-center gap-4">
                      <button data-sidebar-toggle class="xl:hidden p-2 rounded-lg bg-slate-100 text-slate-600">
                          <i class="fas fa-bars"></i>
                      </button>
                      <h1 data-page-title class="text-lg font-black text-slate-800 tracking-tight font-brand uppercase">${this.getPageTitle()}</h1>
                  </div>

                  <div class="flex items-center gap-4">
                      <div class="w-px h-5 bg-slate-200"></div>

                      <ui-dropdown-menu position="bottom">
                          <ui-dropdown-menu-trigger>
                              <div class="flex items-center gap-2.5 cursor-pointer p-1 hover:bg-slate-50 rounded-xl transition-all">
                                  <div class="text-right hidden sm:block">
                                      <p class="text-[11px] font-black text-slate-900 leading-none mb-0.5 font-brand uppercase tracking-tighter">${this.userData.name || "Admin"}</p>
                                      <p class="text-[8px] font-bold text-indigo-600 uppercase tracking-widest leading-none">Super Admin</p>
                                  </div>
                                  <ui-avatar name="${this.userData.name || "Admin"}" src="${this.userData.profile_image ? this.getImageUrl(this.userData.profile_image) : ""}" size="sm" class="shadow-sm shadow-slate-200 rounded-full"></ui-avatar>
                              </div>
                          </ui-dropdown-menu-trigger>
                          <ui-dropdown-menu-content class="w-56">
                              <ui-dropdown-menu-label>Account Options</ui-dropdown-menu-label>
                              <ui-dropdown-menu-separator></ui-dropdown-menu-separator>
                              <ui-dropdown-menu-item>
                                  <a href="/dashboard/admin/profile" class="flex items-center w-full font-bold">
                                      <i class="fas fa-user-circle mr-2 opacity-50"></i> Profile Details
                                  </a>
                              </ui-dropdown-menu-item>
                              <ui-dropdown-menu-item>
                                  <a href="/dashboard/admin/settings" class="flex items-center w-full font-bold">
                                      <i class="fas fa-cog mr-2 opacity-50"></i> Preferences
                                  </a>
                              </ui-dropdown-menu-item>
                              <ui-dropdown-menu-separator></ui-dropdown-menu-separator>
                              <ui-dropdown-menu-item color="red">
                                  <button data-action="logout" class="flex items-center w-full font-black text-rose-600">
                                      <i class="fas fa-power-off mr-2"></i> Log Out
                                  </button>
                              </ui-dropdown-menu-item>
                          </ui-dropdown-menu-content>
                      </ui-dropdown-menu>
                  </div>
              </header>

              <div data-page-content class="flex-1 overflow-y-auto">
                  ${this.pageContent}
              </div>
          </main>
      </div>
    `;
  }
}

customElements.define("app-admin-layout", AdminLayout);
export default AdminLayout;
