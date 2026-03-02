import App from "@/core/App.js";

class AdminLayout extends App {
  connectedCallback() {
    super.connectedCallback();
    // Check auth
    if (!localStorage.getItem("token")) {
      window.location.href = "/login";
      return;
    }
  }

  handleLogout() {
    localStorage.removeItem("token");
    localStorage.removeItem("userData");
    window.location.href = "/login";
  }

  render() {
    return `
            <div class="flex min-h-screen bg-slate-50 font-sans text-slate-900">
                <!-- Sidebar -->
                <aside class="w-72 bg-white border-r border-slate-200 flex flex-col fixed inset-y-0 shadow-sm">
                    <div class="p-8 pb-4">
                        <div class="flex items-center gap-3 mb-10">
                            <div class="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg">
                                <i class="fas fa-shopping-bag"></i>
                            </div>
                            <span class="text-xl font-black tracking-tight text-slate-900">VastCommerce</span>
                        </div>
                        
                        <nav class="space-y-1.5">
                            ${this.renderNavLink("/", "fas fa-chart-pie", "Dashboard", true)}
                            ${this.renderNavLink("/admin/products", "fas fa-shopping-cart", "Products")}
                            ${this.renderNavLink("/admin/orders", "fas fa-box", "Orders")}
                            ${this.renderNavLink("/admin/categories", "fas fa-tags", "Categories")}
                            ${this.renderNavLink("/admin/users", "fas fa-users", "Users")}
                            ${this.renderNavLink("/admin/pages", "fas fa-file-alt", "CMS Pages")}
                            ${this.renderNavLink("/admin/settings", "fas fa-cog", "Site Settings")}
                        </nav>
                    </div>

                    <div class="mt-auto p-6 border-t border-slate-100">
                        <button onclick="this.closest('app-admin-layout').handleLogout()" class="w-full py-4 px-6 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-2xl flex items-center justify-center gap-3 font-bold transition-all">
                            <i class="fas fa-sign-out-alt"></i> Logout
                        </button>
                    </div>
                </aside>

                <!-- Main Content -->
                <main class="flex-1 ml-72 overflow-y-auto">
                    <slot></slot>
                </main>
            </div>
        `;
  }

  renderNavLink(href, icon, label, active = false) {
    const activeClass = active
      ? "bg-blue-50 text-blue-700"
      : "text-slate-500 hover:bg-slate-50 hover:text-slate-900";
    return `
            <a href="${href}" class="flex items-center gap-4 py-3.5 px-6 rounded-2xl font-bold transition-all ${activeClass}">
                <i class="${icon} text-lg"></i>
                <span>${label}</span>
            </a>
        `;
  }
}

customElements.define("app-admin-layout", AdminLayout);
export default AdminLayout;
