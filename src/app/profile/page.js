import App from "@/core/App.js";
import "@/components/ui/Card.js";
import "@/components/ui/Button.js";
import "@/components/ui/Modal.js";
import "@/components/ui/Input.js";
import "@/components/ui/Badge.js";
import api from "@/services/api.js";

class ProfilePage extends App {
  constructor() {
    super();
    this.userData = JSON.parse(localStorage.getItem("userData")) || {};
    this.loginEnabled = true;
    this.addresses = [];
    this.pickups = [];
    this.orders = [];
    this.wishlist = [];
    this.loading = true;
    this.ordersLoading = false;
    this.wishlistLoading = false;
    this.activeTab = "profile"; // 'profile', 'orders', 'wishlist'
    this.showEditModal = false;
    this.updatingProfile = false;
    this._lastRendered = "";
  }

  updateView() {
    const next = this.render();
    if (next === this._lastRendered) return;
    this._lastRendered = next;
    this.innerHTML = next;
    this.attachEvents();
  }

  attachEvents() {
    // any dynamic event binding if needed, 
    // but we use inline onclick for simplicity in this architecture
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
      this.updateView();
    }
  }

  async loadOrders() {
    this.ordersLoading = true;
    this.updateView();
    try {
      const res = await api.get("/orders/my-orders");
      this.orders = res?.data?.data || [];
    } catch (err) {
      console.error("Failed to load orders:", err);
      this.orders = [];
    } finally {
      this.ordersLoading = false;
      this.updateView();
    }
  }

  async loadWishlist() {
    this.wishlistLoading = true;
    this.updateView();
    try {
      const res = await api.get("/wishlist");
      this.wishlist = res?.data?.data || [];
    } catch (err) {
      console.error("Failed to load wishlist:", err);
      this.wishlist = [];
    } finally {
      this.wishlistLoading = false;
      this.updateView();
    }
  }

  async removeFromWishlist(id) {
    try {
      await api.delete(`/wishlist/items/${id}`);
      this.wishlist = this.wishlist.filter(item => item.id !== id);
      this.updateView();
    } catch (err) {
      alert("Failed to remove item from wishlist");
    }
  }

  switchTab(tab) {
    this.activeTab = tab;
    if (tab === "orders" && this.orders.length === 0) {
      this.loadOrders();
    }
    if (tab === "wishlist" && this.wishlist.length === 0) {
      this.loadWishlist();
    }
    this.updateView();
  }

  openEditModal() {
    this.showEditModal = true;
    this.updateView();
  }

  closeEditModal() {
    this.showEditModal = false;
    this.updateView();
  }

  async handleUpdateProfile(e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData.entries());

    if (data.password && data.password !== data.confirm_password) {
      alert("Passwords do not match");
      return;
    }

    this.updatingProfile = true;
    this.updateView();

    try {
      const res = await api.put(`/users/${this.userData.id}/profile`, {
        name: data.name,
        email: data.email,
        phone: data.phone,
        password: data.password || undefined,
      });

      if (res.data.success) {
        // Update local storage
        const updatedUser = { ...this.userData, ...data };
        delete updatedUser.password;
        delete updatedUser.confirm_password;
        this.userData = updatedUser;
        localStorage.setItem("userData", JSON.stringify(updatedUser));
        
        alert("Profile updated successfully!");
        this.closeEditModal();
      } else {
        alert(res.data.error || "Failed to update profile");
      }
    } catch (err) {
      alert(err.response?.data?.error || "An error occurred");
    } finally {
      this.updatingProfile = false;
      this.updateView();
    }
  }

  render() {
    return `
      <div class="py-14 md:py-16 px-4 sm:px-6 max-w-6xl mx-auto space-y-10">
        <div class="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 class="text-5xl font-black text-slate-900 tracking-tight leading-tight">Your <span class="text-indigo-600">Account</span></h1>
            <p class="text-slate-500 mt-4 font-medium text-lg max-w-xl">Welcome back, ${this.userData.name || "Customer"}. Here's what's happening with your account.</p>
          </div>
          <div class="flex items-center gap-4">
            <button onclick="this.closest('app-profile-page').openEditModal()" class="bg-white px-5 py-2.5 rounded-xl font-bold text-slate-900 shadow-sm border border-slate-100 hover:bg-slate-50 transition-all flex items-center gap-2 text-sm">
              <i class="fas fa-edit text-indigo-600"></i> Edit Profile
            </button>
            <button onclick="this.closest('app-profile-page').handleLogout()" class="bg-white px-5 py-2.5 rounded-xl font-bold text-rose-600 shadow-sm border border-rose-100 hover:bg-rose-50 transition-all flex items-center gap-2 text-sm">
              <i class="fas fa-sign-out-alt"></i> Sign Out
            </button>
          </div>
        </div>

        <!-- Tab Navigation -->
        <div class="flex items-center gap-1 bg-slate-100/50 p-1 rounded-[1.25rem] w-fit">
          ${["profile", "orders", "wishlist"].map(tab => `
            <button 
              onclick="this.closest('app-profile-page').switchTab('${tab}')"
              class="px-5 py-2 rounded-[1rem] text-xs font-black transition-all duration-300 ${this.activeTab === tab ? 'bg-white text-indigo-600 shadow-lg shadow-slate-200/40 scale-105' : 'text-slate-400 hover:text-slate-600'}"
            >
              ${tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          `).join("")}
        </div>

        <div class="transition-all duration-500 ease-in-out">
          ${this.activeTab === "profile" ? this.renderProfileTab() : ""}
          ${this.activeTab === "orders" ? this.renderOrdersTab() : ""}
          ${this.activeTab === "wishlist" ? this.renderWishlistTab() : ""}
        </div>

        <!-- Edit Profile Modal -->
        <ui-modal 
          show="${this.showEditModal}" 
          title="Edit Profile"
          onclose="this.closest('app-profile-page').closeEditModal()"
        >
          <form onsubmit="this.closest('app-profile-page').handleUpdateProfile(event)" class="space-y-8 p-2">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <ui-input 
                label="Full Name" 
                name="name" 
                value="${this.userData.name || ""}" 
                placeholder="Enter your full name"
                required
              ></ui-input>
              <ui-input 
                label="Email Address" 
                name="email" 
                type="email" 
                value="${this.userData.email || ""}" 
                placeholder="Your email address"
                required
              ></ui-input>
              <ui-input 
                label="Phone Number" 
                name="phone" 
                value="${this.userData.phone || ""}" 
                placeholder="Optional"
              ></ui-input>
            </div>
            
            <div class="pt-8 border-t border-slate-100">
              <h4 class="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] mb-6">Security & Password</h4>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <ui-input 
                  label="New Password" 
                  name="password" 
                  type="password" 
                  placeholder="Min 8 characters"
                ></ui-input>
                <ui-input 
                  label="Confirm New Password" 
                  name="confirm_password" 
                  type="password" 
                  placeholder="Repeat password"
                ></ui-input>
              </div>
              <p class="mt-3 text-xs text-slate-400 font-medium italic">Leave password fields blank if you don't wish to change it.</p>
            </div>

            <div class="flex justify-end gap-4 pt-4">
              <button 
                type="button" 
                onclick="this.closest('app-profile-page').closeEditModal()"
                class="bg-white px-8 py-3 rounded-xl font-black text-slate-900 border border-slate-200 hover:bg-slate-50 transition-all"
              >
                Cancel
              </button>
              <button 
                type="submit" 
                class="bg-indigo-600 px-12 py-3 rounded-xl font-black text-white shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all"
              >
                ${this.updatingProfile ? '<i class="fas fa-spinner animate-spin mr-2"></i> Updating...' : 'Update Profile'}
              </button>
            </div>
          </form>
        </ui-modal>
      </div>
    `;
  }

  renderProfileTab() {
    return `
      <div class="space-y-10">
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-10">
          <!-- Sidebar Card -->
          <ui-card class="p-10 rounded-[3rem] bg-white border border-slate-100 shadow-xl shadow-slate-200/20 text-center flex flex-col items-center justify-center">
              <div class="w-24 h-24 bg-gradient-to-tr from-indigo-500 to-indigo-600 rounded-[2rem] flex items-center justify-center text-white mb-6 border-4 border-indigo-50 shadow-xl shadow-indigo-100">
                  <i class="fas fa-user-ninja text-3xl"></i>
              </div>
              <h2 class="text-xl font-black text-slate-900 mb-1 tracking-tight">${this.userData.name || "Customer"}</h2>
              <p class="text-slate-500 font-bold mb-6 text-sm">${this.userData.email || ""}</p>
              <div class="flex items-center gap-2 bg-indigo-50 text-indigo-600 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider">
                <i class="fas fa-check-circle"></i> Verified
              </div>
          </ui-card>

          <!-- Details Card -->
          <ui-card class="lg:col-span-2 p-10 rounded-[3rem] bg-white border border-slate-100 shadow-xl shadow-slate-200/20 overflow-hidden">
              <div class="flex items-center justify-between mb-8">
                <h3 class="text-xl font-black text-slate-900 tracking-tight">Profile Details</h3>
              </div>

              <div class="grid grid-cols-1 sm:grid-cols-2 gap-8 min-w-0">
                  <div class="space-y-1">
                      <p class="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Display Name</p>
                      <p class="font-bold text-slate-800 text-lg break-words">${this.userData.name || '<span class="text-slate-300">Not provided</span>'}</p>
                  </div>
                  <div class="space-y-1">
                      <p class="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Email Address</p>
                      <p class="font-bold text-slate-800 text-lg break-words">${this.userData.email || '<span class="text-slate-300">Not provided</span>'}</p>
                  </div>
                  <div class="space-y-1">
                      <p class="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Phone</p>
                      <p class="font-bold text-slate-800 text-lg break-words">${this.userData.phone || '<span class="text-slate-300">Not provided</span>'}</p>
                  </div>
                  <div class="space-y-1">
                      <p class="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Status</p>
                      <div class="flex items-center gap-2 text-emerald-500 font-black text-base">
                        <div class="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                        Active
                      </div>
                  </div>
              </div>
          </ui-card>
        </div>

        <div class="pt-10 border-t border-slate-100">
            <h4 class="text-lg font-black text-slate-900 mb-8">Shortcuts</h4>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <button onclick="this.closest('app-profile-page').switchTab('orders')" class="p-8 bg-slate-50 rounded-[2.5rem] text-left hover:bg-slate-100 transition-all group relative overflow-hidden">
                    <div class="absolute -right-4 -bottom-4 opacity-5 text-indigo-600 scale-150 group-hover:scale-125 transition-transform duration-500">
                      <i class="fas fa-box-open text-9xl"></i>
                    </div>
                    <div class="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-indigo-600 mb-6 shadow-sm">
                      <i class="fas fa-box text-xl"></i>
                    </div>
                    <p class="font-black text-slate-900 text-lg">My Orders</p>
                    <p class="text-[11px] text-slate-400 font-bold uppercase tracking-widest mt-1">Check your haul</p>
                </button>
                <button onclick="this.closest('app-profile-page').switchTab('wishlist')" class="p-8 bg-slate-50 rounded-[2.5rem] text-left hover:bg-slate-100 transition-all group relative overflow-hidden">
                    <div class="absolute -right-4 -bottom-4 opacity-5 text-rose-500 scale-150 group-hover:scale-125 transition-transform duration-500">
                      <i class="fas fa-heart text-9xl"></i>
                    </div>
                    <div class="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-rose-500 mb-6 shadow-sm">
                      <i class="fas fa-heart text-xl"></i>
                    </div>
                    <p class="font-black text-slate-900 text-lg">Wishlist</p>
                    <p class="text-[11px] text-slate-400 font-bold uppercase tracking-widest mt-1">The ones you love</p>
                </button>
            </div>
        </div>

        <!-- Bottom Cards -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-10">
          <ui-card class="p-10 rounded-[3rem] bg-white border border-slate-100 shadow-xl shadow-slate-200/10">
              <div class="flex items-center justify-between mb-8">
                <h3 class="text-xl font-black text-slate-900 flex items-center gap-4">
                  <span class="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600 text-sm">
                    <i class="fas fa-map-marker-alt"></i>
                  </span>
                  Saved Addresses
                </h3>
              </div>
              ${this.loading
                ? `<div class="space-y-4">${Array(2).fill('<div class="h-24 bg-slate-50 rounded-[2rem] animate-pulse"></div>').join("")}</div>`
                : this.addresses.length
                  ? `<div class="grid gap-4">
                      ${this.addresses
                        .map(
                          (a) => `
                          <div class="p-6 rounded-[2rem] border border-slate-50 bg-slate-50/50 flex justify-between items-center group cursor-pointer hover:bg-white hover:border-indigo-100 hover:shadow-lg transition-all">
                            <div>
                              <p class="text-base font-black text-slate-800">${a.address_line1}</p>
                              <p class="text-xs text-slate-500 font-bold mt-1 uppercase tracking-wider">${a.city}${a.state ? `, ${a.state}` : ""}</p>
                            </div>
                            <div class="w-8 h-8 bg-white rounded-full flex items-center justify-center text-slate-300 group-hover:text-indigo-600 border border-slate-100 transition-colors">
                              <i class="fas fa-chevron-right text-[10px]"></i>
                            </div>
                          </div>
                        `,
                        )
                        .join("")}
                    </div>`
                  : `<div class="py-10 text-center text-slate-400 font-medium">No saved addresses yet.</div>`}
          </ui-card>

          <ui-card class="p-10 rounded-[3rem] bg-white border border-slate-100 shadow-xl shadow-slate-200/10">
              <div class="flex items-center justify-between mb-8">
                <h3 class="text-xl font-black text-slate-900 flex items-center gap-4">
                  <span class="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600 text-sm">
                    <i class="fas fa-id-badge"></i>
                  </span>
                  Pickup Contacts
                </h3>
              </div>
              ${this.loading
                ? `<div class="space-y-4">${Array(2).fill('<div class="h-24 bg-slate-50 rounded-[2rem] animate-pulse"></div>').join("")}</div>`
                : this.pickups.length
                  ? `<div class="grid gap-4">
                      ${this.pickups
                        .map(
                          (p) => `
                          <div class="p-6 rounded-[2rem] border border-slate-50 bg-slate-50/50 flex justify-between items-center group cursor-pointer hover:bg-white hover:border-emerald-100 hover:shadow-lg transition-all">
                            <div>
                              <p class="text-base font-black text-slate-800">${p.name}</p>
                              <p class="text-xs text-slate-500 font-bold mt-1 uppercase tracking-wider">${p.phone}</p>
                            </div>
                            <div class="w-8 h-8 bg-white rounded-full flex items-center justify-center text-slate-300 group-hover:text-emerald-600 border border-slate-100 transition-colors">
                              <i class="fas fa-chevron-right text-[10px]"></i>
                            </div>
                          </div>
                        `,
                        )
                        .join("")}
                    </div>`
                  : `<div class="py-10 text-center text-slate-400 font-medium">No pickup contacts yet.</div>`}
          </ui-card>
        </div>
      </div>
    `;
  }

  renderOrdersTab() {
    if (this.ordersLoading) {
      return `
        <div class="space-y-8 animate-in fade-in slide-in-from-bottom-5 duration-500">
          ${Array(3).fill('<div class="h-40 bg-white rounded-[3rem] animate-pulse border border-slate-100 shadow-sm"></div>').join("")}
        </div>
      `;
    }

    if (this.orders.length === 0) {
      return `
        <ui-card class="p-24 rounded-[4rem] bg-white border border-slate-100 shadow-xl shadow-slate-200/10 text-center animate-in zoom-in-95 duration-500">
          <div class="w-32 h-32 bg-slate-50 rounded-[3rem] mx-auto flex items-center justify-center text-slate-200 mb-10 border border-slate-50">
            <i class="fas fa-shopping-bag text-5xl"></i>
          </div>
          <h3 class="text-3xl font-black text-slate-900 mb-4 tracking-tight">Empty cart, empty list</h3>
          <p class="text-slate-500 font-bold text-lg max-w-sm mx-auto mb-10 leading-relaxed">Your order history is currently waiting for your first purchase. Ready to find something amazing?</p>
          <button onclick="window.location.href='/public/products'" class="bg-indigo-600 px-8 py-3 rounded-2xl font-black text-white shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-2 mx-auto text-sm">
            <i class="fas fa-shopping-bag"></i> Browse Store
          </button>
        </ui-card>
      `;
    }

    return `
      <div class="grid gap-8 animate-in fade-in slide-in-from-bottom-10 duration-700">
        ${this.orders
          .map(
            (o) => `
            <ui-card class="p-0 overflow-hidden rounded-[3rem] bg-white border border-slate-100 shadow-xl shadow-slate-200/20 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 group">
              <div class="p-10 flex flex-col lg:flex-row lg:items-center justify-between gap-10">
                <div class="flex items-center gap-8">
                  <div class="w-24 h-24 bg-slate-50 rounded-[2rem] flex items-center justify-center text-indigo-600 font-black text-2xl border border-slate-100 shadow-inner group-hover:bg-indigo-50 transition-colors">
                    #${o.id}
                  </div>
                  <div class="space-y-2">
                    <div class="flex flex-wrap items-center gap-3">
                      <p class="font-black text-slate-900 text-2xl tracking-tight">Order #${o.id}</p>
                      <ui-badge 
                        variant="${this.getStatusVariant(o.status)}" 
                        text="${o.status.toUpperCase()}" 
                        class="rounded-xl text-[10px] px-4 py-1 font-black"
                      ></ui-badge>
                    </div>
                    <p class="text-slate-500 font-bold flex items-center gap-2">
                      <i class="far fa-calendar-alt text-indigo-400"></i>
                      ${new Date(o.created_at).toLocaleDateString(undefined, { dateStyle: "long" })}
                    </p>
                  </div>
                </div>
                
                <div class="flex flex-wrap items-center gap-10 lg:gap-16">
                  <div class="space-y-1">
                    <p class="text-[11px] font-black uppercase tracking-[.2em] text-slate-400 mb-1">Products</p>
                    <p class="font-bold text-slate-800 text-lg">${o.items_count} SKU(s)</p>
                  </div>
                  <div class="space-y-1">
                    <p class="text-[11px] font-black uppercase tracking-[.2em] text-slate-400 mb-1">Total Bill</p>
                    <p class="font-black text-indigo-600 text-3xl font-mono tracking-tight">$${o.total_amount.toFixed(2)}</p>
                  </div>
                  <button onclick="window.location.href='/public/orders/${o.id}'" class="bg-white px-5 py-2.5 rounded-xl font-bold text-slate-900 shadow-sm border border-slate-100 hover:bg-slate-50 transition-all flex items-center gap-2 text-sm">
                    <i class="fas fa-receipt text-indigo-600"></i> View Receipt
                  </button>
                </div>
              </div>
            </ui-card>
          `,
          )
          .join("")}
      </div>
    `;
  }

  renderWishlistTab() {
    if (this.wishlistLoading) {
      return `
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 animate-in fade-in slide-in-from-bottom-5 duration-500">
          ${Array(4).fill('<div class="aspect-[4/5] bg-white rounded-[3rem] animate-pulse border border-slate-100 shadow-sm"></div>').join("")}
        </div>
      `;
    }

    if (this.wishlist.length === 0) {
      return `
        <ui-card class="p-24 rounded-[4rem] bg-white border border-slate-100 shadow-xl shadow-slate-200/10 text-center animate-in zoom-in-95 duration-500">
          <div class="w-32 h-32 bg-rose-50 rounded-[3rem] mx-auto flex items-center justify-center text-rose-500 mb-10 border border-rose-50">
            <i class="fas fa-heart text-5xl"></i>
          </div>
          <h3 class="text-3xl font-black text-slate-900 mb-4 tracking-tight">Your wishlist is empty</h3>
          <p class="text-slate-500 font-bold text-lg max-w-sm mx-auto mb-10 leading-relaxed">Save the products you love here. Find your next favorite piece in our shop.</p>
          <button onclick="this.closest('app-profile-page').switchTab('wishlist')" class="bg-rose-500 px-8 py-3 rounded-2xl font-black text-white shadow-xl shadow-rose-100 hover:bg-rose-600 transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-2 mx-auto text-sm">
            <i class="fas fa-heart"></i> Start Liking
          </button>
        </ui-card>
      `;
    }

    return `
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 animate-in fade-in slide-in-from-bottom-10 duration-700">
        ${this.wishlist
          .map(
            (item) => `
            <ui-card class="group relative p-0 overflow-hidden rounded-[2.5rem] bg-white border border-slate-100 shadow-lg shadow-slate-200/10 hover:shadow-2xl hover:-translate-y-2 transition-all duration-500">
              <div class="aspect-[4/5] overflow-hidden bg-slate-100">
                <img src="${item.main_image || '/placeholder.jpg'}" alt="${item.product_name}" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                <div class="absolute top-5 right-5 z-10">
                  <button 
                    onclick="this.closest('app-profile-page').removeFromWishlist(${item.id})"
                    class="w-10 h-10 bg-white/90 backdrop-blur-md text-rose-500 rounded-full flex items-center justify-center hover:bg-rose-500 hover:text-white transition-all shadow-xl"
                  >
                    <i class="fas fa-heart text-sm"></i>
                  </button>
                </div>
              </div>
              <div class="p-6 space-y-4">
                <div class="space-y-1">
                  <p class="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Premium Collection</p>
                  <h4 class="font-black text-slate-900 line-clamp-1 group-hover:text-indigo-600 transition-colors">${item.product_name}</h4>
                </div>
                <div class="flex items-center justify-between pt-2 border-t border-slate-50">
                  <p class="font-black text-indigo-600 text-lg">$${parseFloat(item.base_price).toFixed(2)}</p>
                  <button onclick="window.location.href='/public/products/${item.product_slug}'" class="bg-white px-4 py-2 rounded-lg font-bold text-slate-900 shadow-sm border border-slate-100 hover:border-indigo-600 hover:text-indigo-600 transition-all text-[11px]">
                    View Item
                  </button>
                </div>
              </div>
            </ui-card>
          `,
          )
          .join("")}
      </div>
    `;
  }

  getStatusVariant(status) {
    switch (status.toLowerCase()) {
      case "pending": return "warning";
      case "completed": return "success";
      case "shipped": return "indigo";
      case "cancelled": return "error";
      default: return "default";
    }
  }
}

customElements.define("app-profile-page", ProfilePage);
export default ProfilePage;
