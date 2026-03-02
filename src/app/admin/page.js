import App from "@/core/App.js";
import api from "@/services/api.js";

class AdminDashboard extends App {
  constructor() {
    super();
    this.stats = {
      products: 0,
      orders: 0,
      users: 0,
      categories: 0,
    };
  }

  async connectedCallback() {
    super.connectedCallback();
    document.title = "Dashboard | VastCommerce Admin";
    // Check if logged in
    if (!localStorage.getItem("token")) {
      window.location.href = "/login";
      return;
    }
  }

  render() {
    return `
            <div class="p-8">
                <div class="mb-10">
                    <h1 class="text-4xl font-black text-slate-900 tracking-tight">Vast Dashboard</h1>
                    <p class="text-slate-500 text-lg mt-1 font-medium">Welcome back, ${JSON.parse(localStorage.getItem("userData"))?.name || "Admin"}</p>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    ${this.renderStatCard("Total Products", "9+", "shopping-cart", "blue")}
                    ${this.renderStatCard("Active Orders", "0", "box", "indigo")}
                    ${this.renderStatCard("Total Users", "1", "users", "emerald")}
                    ${this.renderStatCard("Categories", "11+", "tags", "purple")}
                </div>

                <div class="mt-12 grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div class="lg:col-span-2 bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
                        <h3 class="text-xl font-bold text-slate-900 mb-6">Recent Activity</h3>
                        <div class="text-center py-12 text-slate-400">
                            <i class="fas fa-chart-line text-4xl mb-4 opacity-20"></i>
                            <p class="font-medium text-lg">No recent transactions to display.</p>
                        </div>
                    </div>
                    <div class="bg-gradient-to-br from-slate-900 to-slate-800 p-8 rounded-3xl shadow-xl text-white relative overflow-hidden">
                        <div class="relative z-10">
                            <h3 class="text-xl font-bold mb-6">Quick Actions</h3>
                            <div class="space-y-4">
                                <button class="w-full py-4 px-6 bg-white/10 hover:bg-white/20 transition-all rounded-2xl flex items-center gap-4 font-bold border border-white/10">
                                    <i class="fas fa-plus-circle text-blue-400"></i> New Product
                                </button>
                                <button class="w-full py-4 px-6 bg-white/10 hover:bg-white/20 transition-all rounded-2xl flex items-center gap-4 font-bold border border-white/10">
                                    <i class="fas fa-cog text-slate-400"></i> Settings
                                </button>
                            </div>
                        </div>
                        <i class="fas fa-rocket absolute -bottom-10 -right-10 text-[10rem] text-white/5 rotate-12"></i>
                    </div>
                </div>
            </div>
        `;
  }

  renderStatCard(title, value, icon, color) {
    const colors = {
      blue: "bg-blue-50 text-blue-600",
      indigo: "bg-indigo-50 text-indigo-600",
      emerald: "bg-emerald-50 text-emerald-600",
      purple: "bg-purple-50 text-purple-600",
    };
    return `
            <div class="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 transition-all hover:shadow-md hover:-translate-y-1">
                <div class="flex items-center gap-4 mb-4">
                    <div class="w-12 h-12 rounded-2xl flex items-center justify-center ${colors[color]}">
                        <i class="fas fa-${icon} text-xl"></i>
                    </div>
                    <div>
                        <p class="text-sm font-bold text-slate-500 uppercase tracking-wider">${title}</p>
                        <p class="text-2xl font-black text-slate-900">${value}</p>
                    </div>
                </div>
            </div>
        `;
  }
}

customElements.define("app-admin-dashboard", AdminDashboard);
export default AdminDashboard;
