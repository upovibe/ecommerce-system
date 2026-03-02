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
    const userData = JSON.parse(localStorage.getItem("userData"));
    return `
            <div class="p-10">
                <div class="mb-12 flex items-center justify-between">
                    <div>
                        <p class="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-600 mb-2">Management Portal</p>
                        <h1 class="text-5xl font-black text-slate-900 tracking-tightest">Vast Business <span class="text-indigo-600">Overview</span></h1>
                        <p class="text-slate-500 font-bold mt-2 text-lg">Good Morning, ${userData?.name || "Vast Admin"}. System health is optimal.</p>
                    </div>
                    <div class="flex gap-4">
                        <button class="bg-white px-8 py-4 rounded-2xl font-black text-slate-900 shadow-sm border border-slate-100 hover:bg-slate-50 transition-all flex items-center gap-3">
                            <i class="fas fa-cloud-download-alt text-indigo-600"></i> Export Stats
                        </button>
                        <button class="bg-indigo-600 px-8 py-4 rounded-2xl font-black text-white shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all hover:scale-105 active:scale-95 flex items-center gap-3">
                            <i class="fas fa-plus-circle"></i> Quick Entry
                        </button>
                    </div>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                    ${this.renderStatCard("Global Products", "9,842", "shopping-basket", "indigo")}
                    ${this.renderStatCard("Pending Orders", "1,204", "receipt", "slate")}
                    ${this.renderStatCard("Total Customers", "2.4M", "user-alt", "rose")}
                    ${this.renderStatCard("Revenue (24h)", "$1.4M", "chart-line", "emerald")}
                </div>

                <div class="mt-12 grid grid-cols-1 lg:grid-cols-3 gap-10">
                    <div class="lg:col-span-2 bg-white p-10 rounded-[2.5rem] shadow-sm border border-slate-50 relative overflow-hidden group">
                        <div class="absolute top-0 right-0 p-8">
                           <button class="text-slate-400 hover:text-indigo-600 transition-colors font-bold text-sm">View Detailed Reports <i class="fas fa-arrow-right ml-2"></i></button>
                        </div>
                        <h3 class="text-2xl font-black text-slate-900 mb-10 tracking-tight">Ecosystem Activity</h3>
                        <div class="text-center py-20 bg-slate-50/50 rounded-3xl border border-dashed border-slate-200">
                            <div class="w-16 h-16 bg-white rounded-2xl shadow-sm mx-auto flex items-center justify-center mb-6 text-slate-300">
                                <i class="fas fa-chart-area text-2xl"></i>
                            </div>
                            <p class="font-black text-slate-900 text-lg">Generating Real-time Insights</p>
                            <p class="text-slate-500 font-medium">Sit back while we sync your global store data.</p>
                        </div>
                    </div>
                    <div class="flex flex-col gap-8">
                        <div class="bg-gradient-to-br from-indigo-600 to-indigo-800 p-10 rounded-[2.5rem] shadow-2xl shadow-indigo-200 text-white relative overflow-hidden">
                            <div class="relative z-10">
                                <h3 class="text-2xl font-black mb-10 tracking-tight">Vast Actions</h3>
                                <div class="space-y-4">
                                    <button class="w-full py-5 px-8 bg-white/10 hover:bg-white/20 transition-all rounded-[1.5rem] flex items-center gap-4 font-black border border-white/10 group">
                                        <div class="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center group-hover:bg-white/20 transition-all">
                                            <i class="fas fa-plus-circle text-white"></i> 
                                        </div>
                                        New Listing
                                    </button>
                                    <button class="w-full py-5 px-8 bg-white/10 hover:bg-white/20 transition-all rounded-[1.5rem] flex items-center gap-4 font-black border border-white/10 group">
                                         <div class="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center group-hover:bg-white/20 transition-all">
                                            <i class="fas fa-envelope text-white"></i> 
                                        </div>
                                        Mail Center
                                    </button>
                                </div>
                            </div>
                            <i class="fas fa-shopping-bag absolute -bottom-12 -right-12 text-[12rem] text-white/10 rotate-12"></i>
                        </div>
                        <div class="bg-white p-10 rounded-[2.5rem] shadow-sm border border-slate-50 flex-1">
                            <h3 class="text-xl font-black text-slate-900 mb-6 tracking-tight">System Status</h3>
                            <div class="space-y-6">
                                <div class="flex items-center gap-4">
                                    <div class="w-3 h-3 bg-emerald-500 rounded-full animate-pulse shadow-lg shadow-emerald-200"></div>
                                    <p class="text-sm font-bold text-slate-700">API Gateway Online</p>
                                </div>
                                <div class="flex items-center gap-4">
                                    <div class="w-3 h-3 bg-emerald-500 rounded-full animate-pulse shadow-lg shadow-emerald-200"></div>
                                    <p class="text-sm font-bold text-slate-700">Payment Engine Ready</p>
                                </div>
                                <div class="flex items-center gap-4">
                                    <div class="w-3 h-3 bg-indigo-500 rounded-full shadow-lg shadow-indigo-200"></div>
                                    <p class="text-sm font-bold text-slate-700">Global Sync Service v1.2</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
  }

  renderStatCard(title, value, icon, color) {
    const colors = {
      indigo: "bg-indigo-600 text-white shadow-indigo-100",
      slate: "bg-slate-900 text-white shadow-slate-100",
      rose: "bg-rose-500 text-white shadow-rose-100",
      emerald: "bg-emerald-500 text-white shadow-emerald-100",
    };
    return `
            <div class="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-50 transition-all hover:shadow-xl hover:-translate-y-2 group">
                <div class="flex flex-col gap-6">
                    <div class="w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg transition-transform group-hover:scale-110 ${colors[color]}">
                        <i class="fas fa-${icon} text-2xl"></i>
                    </div>
                    <div>
                        <p class="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">${title}</p>
                        <p class="text-4xl font-black text-slate-900 tracking-tighter">${value}</p>
                    </div>
                    <div class="flex items-center gap-2 text-[10px] font-bold text-emerald-500 bg-emerald-50 w-fit px-3 py-1 rounded-full">
                        <i class="fas fa-arrow-up"></i> +12% this month
                    </div>
                </div>
            </div>
        `;
  }
}

customElements.define("app-admin-dashboard", AdminDashboard);
export default AdminDashboard;
