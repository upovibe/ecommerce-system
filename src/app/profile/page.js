import App from "@/core/App.js";
import "@/components/ui/Card.js";
import "@/components/ui/Button.js";
import api from "@/services/api.js";

class ProfilePage extends App {
  constructor() {
    super();
    this.userData = JSON.parse(localStorage.getItem("userData")) || {};
    this.loginEnabled = true;
    this.addresses = [];
    this.pickups = [];
    this.loading = true;
  }

  async connectedCallback() {
    super.connectedCallback();
    document.title = "Your Profile | VastCommerce";
    await this.loadLoginSetting();
    if (!this.loginEnabled) {
      window.location.href = "/";
    }
    await this.loadSavedInfo();
  }

  async loadLoginSetting() {
    try {
      const res = await fetch("/api/settings/key/enable_user_login");
      const data = await res.json();
      const raw = String(data?.data?.setting_value ?? "1").toLowerCase();
      this.loginEnabled = !(raw === "0" || raw === "false" || raw === "no");
    } catch (_) {
      this.loginEnabled = true;
    }
  }

  handleLogout() {
    localStorage.removeItem("token");
    localStorage.removeItem("userData");
    window.location.href = "/auth/customer-login";
  }

  async loadSavedInfo() {
    try {
      const [addrRes, pickupRes] = await Promise.all([
        api.get("/addresses").catch(() => null),
        api.get("/pickup-contacts").catch(() => null),
      ]);
      this.addresses = addrRes?.data?.data || [];
      this.pickups = pickupRes?.data?.data || [];
    } catch (_) {
      this.addresses = [];
      this.pickups = [];
    } finally {
      this.loading = false;
      this.render();
    }
  }

  render() {
    return `
            <div class="py-20 px-6 max-w-4xl mx-auto">
                <div class="flex items-center justify-between mb-12">
                    <h1 class="text-4xl font-black text-slate-900 tracking-tight">Your <span class="text-indigo-600">Account</span></h1>
                    <ui-button onclick="this.closest('app-profile-page').handleLogout()" variant="outline" class="rounded-2xl border-slate-200">
                      <i class="fas fa-sign-out-alt mr-2"></i> Sign Out
                    </ui-button>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <ui-card class="col-span-1 p-8 rounded-[2.5rem] bg-white border border-slate-100 shadow-sm text-center">
                        <div class="w-24 h-24 bg-indigo-50 rounded-[2rem] mx-auto flex items-center justify-center text-indigo-600 mb-6 border-4 border-white shadow-lg">
                            <i class="fas fa-user text-3xl"></i>
                        </div>
                        <h2 class="text-xl font-bold text-slate-900">${this.userData.name || "Customer"}</h2>
                        <p class="text-slate-500 text-sm font-medium mb-6">${this.userData.email || ""}</p>
                        <div class="bg-indigo-600/5 py-2 px-4 rounded-full text-indigo-600 text-[10px] font-black uppercase tracking-widest inline-block">
                            Verified Customer
                        </div>
                    </ui-card>

                    <ui-card class="col-span-2 p-10 rounded-[2.5rem] bg-white border border-slate-100 shadow-sm">
                        <h3 class="text-xl font-black text-slate-900 mb-8 tracking-tight">Profile Details</h3>
                        <div class="space-y-6">
                            <div class="grid grid-cols-2 gap-4">
                                <div>
                                    <p class="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Full Name</p>
                                    <p class="font-bold text-slate-700">${this.userData.name || "Not set"}</p>
                                </div>
                                <div>
                                    <p class="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Email</p>
                                    <p class="font-bold text-slate-700">${this.userData.email || "Not set"}</p>
                                </div>
                            </div>
                            <div class="pt-6 border-t border-slate-50">
                                <h4 class="text-lg font-bold text-slate-900 mb-4">Account Features</h4>
                                <div class="grid grid-cols-2 gap-4">
                                    <button class="p-6 bg-slate-50 rounded-3xl text-left hover:bg-indigo-50 transition-colors group">
                                        <i class="fas fa-shopping-cart text-indigo-600 mb-4"></i>
                                        <p class="font-black text-slate-900">My Orders</p>
                                        <p class="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Track shipments</p>
                                    </button>
                                    <button class="p-6 bg-slate-50 rounded-3xl text-left hover:bg-rose-50 transition-colors group">
                                        <i class="fas fa-heart text-rose-500 mb-4"></i>
                                        <p class="font-black text-slate-900">Wishlist</p>
                                        <p class="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Saved items</p>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </ui-card>
                </div>

                <div class="mt-12 grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <ui-card class="p-8 rounded-[2.5rem] bg-white border border-slate-100 shadow-sm">
                    <h3 class="text-lg font-black text-slate-900 mb-4">Saved Addresses</h3>
                    ${this.loading
                      ? `<div class="space-y-3">${Array(3).fill('<div class="h-12 bg-slate-100 rounded-2xl animate-pulse"></div>').join("")}</div>`
                      : this.addresses.length
                        ? `<div class="grid gap-3">
                            ${this.addresses
                              .map(
                                (a) => `
                                <div class="p-4 rounded-2xl border border-slate-100 bg-slate-50">
                                  <p class="text-sm font-semibold text-slate-900">${a.address_line1}</p>
                                  <p class="text-xs text-slate-500">${a.city}${a.state ? `, ${a.state}` : ""}</p>
                                </div>
                              `,
                              )
                              .join("")}
                          </div>`
                        : `<p class="text-sm text-slate-500">No saved addresses yet.</p>`}
                  </ui-card>

                  <ui-card class="p-8 rounded-[2.5rem] bg-white border border-slate-100 shadow-sm">
                    <h3 class="text-lg font-black text-slate-900 mb-4">Pickup Contacts</h3>
                    ${this.loading
                      ? `<div class="space-y-3">${Array(3).fill('<div class="h-12 bg-slate-100 rounded-2xl animate-pulse"></div>').join("")}</div>`
                      : this.pickups.length
                        ? `<div class="grid gap-3">
                            ${this.pickups
                              .map(
                                (p) => `
                                <div class="p-4 rounded-2xl border border-slate-100 bg-slate-50">
                                  <p class="text-sm font-semibold text-slate-900">${p.name}</p>
                                  <p class="text-xs text-slate-500">${p.phone}</p>
                                </div>
                              `,
                              )
                              .join("")}
                          </div>`
                        : `<p class="text-sm text-slate-500">No pickup contacts yet.</p>`}
                  </ui-card>
                </div>
            </div>
        `;
  }
}

customElements.define("app-profile-page", ProfilePage);
export default ProfilePage;
