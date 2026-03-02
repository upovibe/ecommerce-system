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
                <aside class="w-80 bg-white border-r border-slate-100 flex flex-col fixed inset-y-0 shadow-sm z-30">
                    <div class="p-10 pb-6">
                        <div class="flex items-center gap-4 mb-12">
                            <div class="w-12 h-12 bg-gradient-to-br from-indigo-600 to-indigo-700 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-100">
                                <i class="fas fa-shopping-bag text-xl"></i>
                            </div>
                            <span class="text-2xl font-black tracking-tighter text-slate-900">Vast<span class="text-indigo-600">Admin</span></span>
                        </div>
                        
                        <nav class="space-y-2">
                            <p class="text-[10px] font-black uppercase tracking-widest text-slate-400 px-6 mb-4 opacity-70">Main Menu</p>
                            ${this.renderNavLink("/dashboard/admin", "fas fa-th-large", "Dashboard", true)}
                            ${this.renderNavLink("/dashboard/admin/products", "fas fa-shopping-basket", "Inventory")}
                            ${this.renderNavLink("/dashboard/admin/orders", "fas fa-receipt", "Orders")}
                            ${this.renderNavLink("/dashboard/admin/categories", "fas fa-layer-group", "Collections")}
                            
                            <p class="text-[10px] font-black uppercase tracking-widest text-slate-400 px-6 mt-8 mb-4 opacity-70">Management</p>
                            ${this.renderNavLink("/dashboard/admin/users", "fas fa-user-shield", "Staff & Users")}
                            ${this.renderNavLink("/dashboard/admin/pages", "fas fa-pager", "Cloud Pages")}
                            ${this.renderNavLink("/dashboard/admin/settings", "fas fa-sliders-h", "Preferences")}
                        </nav>
                    </div>

                    <div class="mt-auto p-8 pt-0">
                        <div class="bg-indigo-50 p-6 rounded-3xl mb-8 border border-indigo-100/50">
                            <p class="text-xs font-bold text-indigo-900 mb-1">Vast Cloud System</p>
                            <p class="text-[10px] font-medium text-indigo-600">Enterprise Edition v1.0</p>
                        </div>
                        <button onclick="this.closest('app-admin-layout').handleLogout()" class="w-full py-4 px-6 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl flex items-center justify-center gap-3 font-bold transition-all shadow-lg shadow-slate-200">
                            <i class="fas fa-power-off text-sm"></i> Logout
                        </button>
                    </div>
                </aside>

                <!-- Main Content -->
                <main class="flex-1 ml-80 overflow-y-auto">
                    <header class="h-24 px-10 flex items-center justify-between border-b border-slate-50 bg-white/80 backdrop-blur-md sticky top-0 z-20">
                        <div class="flex items-center gap-4 bg-slate-50 px-5 py-2.5 rounded-2xl border border-slate-200/50 w-96">
                            <i class="fas fa-search text-slate-400"></i>
                            <input type="text" placeholder="Global search..." class="bg-transparent border-none outline-none text-sm font-medium text-slate-700 w-full">
                        </div>
                        <div class="flex items-center gap-6">
                            <button class="w-12 h-12 rounded-2xl bg-white border border-slate-100 flex items-center justify-center text-slate-500 hover:text-indigo-600 transition-colors relative">
                                <i class="fas fa-bell"></i>
                                <span class="absolute top-3 right-3 w-2 h-2 bg-rose-500 rounded-full border-2 border-white"></span>
                            </button>
                            <div class="w-px h-8 bg-slate-100"></div>
                            <div class="flex items-center gap-4">
                                <div class="text-right">
                                    <p class="text-sm font-black text-slate-900">Vast Admin</p>
                                    <p class="text-[10px] font-bold text-indigo-600 uppercase tracking-widest">Master Admin</p>
                                </div>
                                <div class="w-12 h-12 bg-slate-100 rounded-2xl overflow-hidden border-2 border-white shadow-md">
                                    <img src="https://ui-avatars.com/api/?name=Vast+Admin&background=4f46e5&color=fff" alt="Avatar">
                                </div>
                            </div>
                        </div>
                    </header>
                    <div class="bg-slate-50/50">
                        <slot></slot>
                    </div>
                </main>
            </div>
        `;
  }

  renderNavLink(href, icon, label, active = false) {
    const activeClass = active
      ? "bg-indigo-600 text-white shadow-xl shadow-indigo-100"
      : "text-slate-500 hover:bg-indigo-50 hover:text-indigo-600 transition-colors";
    return `
            <a href="${href}" class="flex items-center gap-4 py-4 px-6 rounded-2xl font-bold transition-all ${activeClass}">
                <i class="${icon} ${active ? "text-white" : "text-lg"}"></i>
                <span class="tracking-tight leading-none">${label}</span>
                ${active ? '<i class="fas fa-chevron-right ml-auto text-[10px] opacity-70"></i>' : ""}
            </a>
        `;
  }
}

customElements.define("app-admin-layout", AdminLayout);
export default AdminLayout;
