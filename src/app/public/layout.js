import App from "@/core/App.js";
import api from "@/services/api.js";

class PublicLayout extends App {
  constructor() {
    super();
    this.siteName = "VastCommerce";
    this.logoUrl = "";
    this.fallbackLogo = "/favicon.ico";
    this.primaryColor = "#4f46e5";
    this.accentColor = "#4f46e5";
    this.allowLogin = true;
    this.settingsLoaded = false;
    this.whatsappNumber = "";
    this.showWhatsappFloat = true;
    this.footerPages = [];
    this._loaded = false;
    this._pageContent = "";
  }

  async connectedCallback() {
    super.connectedCallback();
    if (this._loaded) return;
    this._loaded = true;
    window.addEventListener("cart:updated", () => this.updateCartBadge());
    if (!this._globalNavBound) {
      this._globalNavBound = true;
      document.addEventListener("click", (e) => {
        const link = e.target?.closest?.("[data-cart-link]");
        if (!link) return;
        e.preventDefault();
        if (window.router && typeof window.router.navigate === "function") {
          window.router.navigate("/public/cart");
        } else {
          window.location.href = "/public/cart";
        }
      }, true);
    }
    this.bindNav();
    await this.loadSettings();
  }

  async loadSettings() {
    const existingContent =
      this.querySelector("#page-content")?.innerHTML || this._pageContent || "";
    try {
      const [nameRes, logoRes, primaryRes, accentRes, loginRes, iconRes, whatsappRes, floatRes, phoneRes, pagesRes] = await Promise.all([
        api.get("/settings/key/site_name").catch(() => null),
        api.get("/settings/key/site_logo").catch(() => null),
        api.get("/settings/key/primary_color").catch(() => null),
        api.get("/settings/key/accent_color").catch(() => null),
        api.get("/settings/key/enable_user_login").catch(() => null),
        api.get("/settings/key/application_favicon").catch(() => null),
        api.get("/settings/key/admin_whatsapp").catch(() => null),
        api.get("/settings/key/whatsapp_float").catch(() => null),
        api.get("/settings/key/phone_number").catch(() => null),
        api.get("/pages/active").catch(() => null),
      ]);

      if (nameRes?.data?.success) {
        const nameVal = nameRes.data.data.setting_value || "";
        this.siteName = nameVal.trim() ? nameVal : this.siteName;
      }
      if (logoRes?.data?.success) this.logoUrl = logoRes.data.data.setting_value || "";
      if (primaryRes?.data?.success) this.primaryColor = primaryRes.data.data.setting_value || this.primaryColor;
      if (accentRes?.data?.success) this.accentColor = accentRes.data.data.setting_value || this.accentColor;
      if (iconRes?.data?.success) {
        this.fallbackLogo = this.getImageUrl(iconRes.data.data.setting_value) || this.fallbackLogo;
      }
      if (loginRes?.data?.success) {
        const raw = String(loginRes.data.data.setting_value || "1").toLowerCase();
        this.allowLogin = !(raw === "0" || raw === "false" || raw === "no");
      }
      if (whatsappRes?.data?.success) {
        this.whatsappNumber = String(whatsappRes.data.data.setting_value || "").trim();
      }
      if (!this.whatsappNumber && phoneRes?.data?.success) {
        this.whatsappNumber = String(phoneRes.data.data.setting_value || "").trim();
      }
      if (pagesRes?.data?.success) {
        this.footerPages = Array.isArray(pagesRes.data.data) ? pagesRes.data.data : [];
      }
      if (floatRes?.data?.success) {
        const raw = String(floatRes.data.data.setting_value || "1").toLowerCase();
        this.showWhatsappFloat = !(raw === "0" || raw === "false" || raw === "no");
      }
      this.settingsLoaded = true;
      const latestContent =
        this.querySelector("#page-content")?.innerHTML || this._pageContent || existingContent || "";
      this.innerHTML = this.render();
      this.setPageContent(latestContent);
      this.bindNav();
      await this.syncGuestCartToUser();
    } catch (_) {
      const latestContent =
        this.querySelector("#page-content")?.innerHTML || this._pageContent || existingContent || "";
      this.settingsLoaded = true;
      this.innerHTML = this.render();
      this.setPageContent(latestContent);
      this.bindNav();
      await this.syncGuestCartToUser();
    }
  }

  getImageUrl(path) {
    if (!path) return "";
    if (path.startsWith("http://") || path.startsWith("https://") || path.startsWith("data:")) return path;
    const baseUrl = window.location.origin;
    if (path.startsWith("/api/")) return baseUrl + path;
    if (path.startsWith("/")) return baseUrl + path;
    if (path.startsWith("uploads/")) return `${baseUrl}/api/${path}`;
    return `${baseUrl}/api/${path.replace(/^\//, "")}`;
  }

  setPageContent(content) {
    const container = this.querySelector("#page-content");
    if (container) {
      container.innerHTML = content;
      this._pageContent = content;
      return;
    }
    this.innerHTML = this.render();
    const next = this.querySelector("#page-content");
    if (next) {
      next.innerHTML = content;
      this._pageContent = content;
    }
    this.bindNav();
  }

  getCartCount() {
    const guest = this.getGuestCartCount();
    const stored = parseInt(localStorage.getItem("cart_count") || "0", 10);
    return Math.max(guest, stored) || 0;
  }

  updateCartBadge() {
    const badge = this.querySelector("[data-cart-count]");
    if (!badge) return;
    badge.textContent = String(this.getCartCount());
  }

  bindNav() {
    const cartLink = this.querySelector("[data-cart-link]");
    if (cartLink && !cartLink._bound) {
      cartLink.addEventListener("click", (e) => {
        e.preventDefault();
        if (window.router && typeof window.router.navigate === "function") {
          window.router.navigate("/public/cart");
        } else {
          window.location.href = "/public/cart";
        }
      });
      cartLink._bound = true;
    }
  }

  getGuestCartCount() {
    try {
      const raw = localStorage.getItem("guest_cart");
      if (!raw) return 0;
      const items = JSON.parse(raw);
      if (!Array.isArray(items)) return 0;
      return items.reduce(
        (sum, item) => sum + (Number(item.quantity || 0) || 0),
        0,
      );
    } catch (_) {
      return 0;
    }
  }

  getCustomerSession() {
    const token = localStorage.getItem("token");
    if (!token) return null;
    try {
      const user = JSON.parse(localStorage.getItem("userData") || "null");
      if (user && user.user_type === "customer") return user;
      return null;
    } catch (_) {
      return null;
    }
  }

  async syncGuestCartToUser() {
    const user = this.getCustomerSession();
    if (!user) return;
    if (localStorage.getItem("guest_cart_synced") === "1") return;
    let guestItems = [];
    try {
      const raw = localStorage.getItem("guest_cart");
      guestItems = raw ? JSON.parse(raw) : [];
    } catch (_) {
      guestItems = [];
    }
    if (!Array.isArray(guestItems) || guestItems.length === 0) return;

    const guestCount = guestItems.reduce(
      (sum, item) => sum + (Number(item.quantity || 0) || 0),
      0,
    );
    try {
      for (const item of guestItems) {
        await api.post("/cart/items", {
          product_id: item.product_id,
          quantity: item.quantity || 1,
          variant_id: item.variant_id || null,
        });
      }
      localStorage.removeItem("guest_cart");
      localStorage.setItem("guest_cart_synced", "1");
      localStorage.setItem("cart_count", String(guestCount));
      this.updateCartBadge();
    } catch (_) {
      // ignore sync failures
    }
  }

  render() {
    const siteName = this.siteName || "VastCommerce";
    const logo = this.logoUrl ? this.getImageUrl(this.logoUrl) : this.fallbackLogo;
    const primary = this.primaryColor || "#4f46e5";
    const accent = this.accentColor || primary;

    return `
      <div class="min-h-screen bg-white flex flex-col font-sans text-slate-900">
        <!-- Store Header -->
        <nav class="bg-white/80 backdrop-blur-md border-b border-slate-100 px-8 py-5 flex items-center justify-between sticky top-0 z-50" style="--primary:${primary}; --accent:${accent};">
          <div class="flex items-center gap-12">
            <a href="/" class="text-2xl font-black text-slate-900 tracking-tighter flex items-center gap-3">
              <div class="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-100" style="background:${primary}">
                ${
                  logo
                    ? `<img src="${logo}" alt="${siteName}" class="w-full h-full object-cover rounded-xl" onerror="this.style.display='none'; this.parentElement.querySelector('i')?.classList.remove('hidden')">`
                    : ""
                }
                <i class="fas fa-shopping-bag text-lg ${logo ? "hidden" : ""}"></i>
              </div>
              ${
                siteName.split(" ").map((w, i) => i === 0 ? w : `<span style="color:${accent}">${w}</span>`).join(" ")
              }
            </a>
            <div class="hidden lg:flex items-center gap-8 text-sm font-semibold text-slate-500">
              <a href="/public/categories" class="transition-colors hover:text-[var(--primary)]">Collections</a>
              <a href="/public/products" class="transition-colors hover:text-[var(--primary)]">All Products</a>
              <a href="#" class="transition-colors hover:text-[var(--primary)]">Flash Deals</a>
            </div>
          </div>

          <div class="flex items-center gap-6">
            <div class="relative hidden md:block">
              <div class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <i class="fas fa-search text-slate-400 text-xs"></i>
              </div>
              <input type="text" placeholder="Search Vast catalog..." class="bg-slate-50 border-none rounded-2xl pl-10 pr-4 py-2.5 text-sm w-72 focus:ring-2 focus:ring-[var(--primary)]/20 transition-all outline-none font-medium text-slate-600">
            </div>
            
            <div class="flex items-center gap-3">
              ${
                this.settingsLoaded
                  ? `
                <a data-cart-link href="/public/cart" class="w-11 h-11 flex items-center justify-center text-slate-600 hover:text-[var(--primary)] hover:bg-indigo-50 rounded-xl transition-all relative">
                  <i class="fas fa-shopping-cart text-lg"></i>
                  <span data-cart-count class="absolute top-2 right-2 w-4 h-4 text-white text-[8px] font-black rounded-full flex items-center justify-center border-2 border-white" style="background:${primary}">${this.getCartCount()}</span>
                </a>
                ${
                  this.allowLogin
                    ? (() => {
                        const user = this.getCustomerSession();
                        if (user) {
                          return `
                            <div class="w-px h-6 bg-slate-100 mx-2"></div>
                            <a href="/profile" class="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-all">
                              <i class="fas fa-user text-xs"></i>
                              ${user.name ? user.name.split(" ")[0] : "Profile"}
                            </a>
                          `;
                        }
                        return `
                          <div class="w-px h-6 bg-slate-100 mx-2"></div>
                          <a href="/auth/customer-login" class="text-white px-6 py-2.5 rounded-xl text-xs font-semibold transition-all shadow-lg shadow-slate-100" style="background:${primary}">Sign In</a>
                        `;
                      })()
                    : ""
                }
              `
                  : `
                <div class="flex items-center gap-3">
                  <div class="w-11 h-11 rounded-xl bg-slate-100 animate-pulse"></div>
                  <div class="w-20 h-10 rounded-xl bg-slate-100 animate-pulse"></div>
                </div>
              `
              }
            </div>
          </div>
        </nav>

        <!-- Main Content -->
        <main id="page-content" class="flex-grow"></main>

          ${
            this.showWhatsappFloat && this.whatsappNumber
              ? (() => {
                  const whatsappPhone = String(this.whatsappNumber).replace(/\\s+/g, "");
                  return `<div class="fixed bottom-6 right-6 z-[9999]">
                   <a href="https://api.whatsapp.com/send?phone=${encodeURIComponent(
                     whatsappPhone
                   )}&text=${encodeURIComponent(
                     `Hello! 👋 I have a quick question about your store's hours and shipping policies. 📦🚚 Could you please share more details?`
                   )}" target="_blank" rel="noopener" aria-label="Chat on WhatsApp" class="relative flex items-center justify-center w-14 h-14 rounded-full bg-emerald-500 hover:bg-emerald-600 shadow-lg transition-all duration-300 hover:scale-110">
                     <i class="fab fa-whatsapp text-2xl"></i>
                     <span class="absolute top-0 right-0 block h-3 w-3 rounded-full bg-emerald-500 ring-2 ring-white animate-ping"></span>
                   </a>
                 </div>`;
                })()
              : ""
          }

        <!-- Global Footer -->
        <footer class="bg-slate-900 py-20 px-10 text-white">
          <div class="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12">
            <div class="col-span-1 md:col-span-2">
              <h1 class="text-3xl font-black tracking-tighter mb-6">${siteName}</h1>
              <p class="text-slate-400 max-w-sm font-medium leading-relaxed">The ultimate universal e-commerce engine powering the next generation of digital storefronts. From fashion to technology, we deliver excellence.</p>
              <div class="flex gap-4 mt-8">
                <a href="#" class="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center hover:bg-indigo-600 transition-all text-slate-400 hover:text-white"><i class="fab fa-facebook-f"></i></a>
                <a href="#" class="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center hover:bg-indigo-600 transition-all text-slate-400 hover:text-white"><i class="fab fa-instagram"></i></a>
                <a href="#" class="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center hover:bg-indigo-600 transition-all text-slate-400 hover:text-white"><i class="fab fa-twitter"></i></a>
              </div>
            </div>
            <div>
              <h4 class="text-xs font-semibold text-indigo-400 mb-6">Shop</h4>
              <ul class="space-y-4 text-sm font-bold text-slate-400">
                <li><a href="/public/products" class="hover:text-white transition-colors">All Products</a></li>
                <li><a href="/public/categories" class="hover:text-white transition-colors">Categories</a></li>
                <li><a href="#" class="hover:text-white transition-colors">Collections</a></li>
                <li><a href="#" class="hover:text-white transition-colors">Custom Orders</a></li>
              </ul>
            </div>
              <div>
                <h4 class="text-xs font-semibold text-indigo-400 mb-6">Support</h4>
                <ul class="space-y-4 text-sm font-bold text-slate-400">
                  ${
                    (this.footerPages || [])
                      .filter((p) => {
                        const slug = String(p.slug || "").replace(/^\/+/, "");
                        return !["home", "category", "product", "public", ""].includes(slug);
                      })
                      .map((p) => {
                        const slug = String(p.slug || "").replace(/^\/+/, "");
                        return `<li><a href="/public/pages/${slug}" class="hover:text-white transition-colors">${p.title}</a></li>`;
                      })
                      .join("")
                  }
                  <li><a href="/auth/login" class="hover:text-white transition-colors">Admin Portal</a></li>
                </ul>
              </div>
          </div>
          <div class="max-w-7xl mx-auto mt-20 pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4 text-xs font-semibold text-slate-500">
            <p>&copy; 2026 VastCommerce Architecture</p>
            <div class="flex gap-8">
              ${
                (this.footerPages || [])
                  .filter((p) => {
                    const slug = String(p.slug || "").replace(/^\/+/, "");
                    return !["home", "category", "product", "public", ""].includes(slug);
                  })
                  .slice(0, 2)
                  .map((p) => {
                    const slug = String(p.slug || "").replace(/^\/+/, "");
                    return `<a href="/public/pages/${slug}" class="hover:text-white transition-colors">${p.title}</a>`;
                  })
                  .join("")
              }
            </div>
          </div>
        </footer>
      </div>
    `;
  }
}

customElements.define("app-public-layout", PublicLayout);
export default PublicLayout;
