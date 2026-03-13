import App from "@/core/App.js";
import "@/components/ui/Skeleton.js";
import api from "@/services/api.js";

/**
 * Home Page (Landing)
 */
class PublicHomePage extends App {
  constructor() {
    super();
    this.products = [];
    this.loading = true;
    this._lastRendered = "";
    this._isInitialized = false;
  }

  updateView() {
    const next = this.render();
    if (next === this._lastRendered) return;
    this._lastRendered = next;
    this.innerHTML = next;
  }

  async connectedCallback() {
    super.connectedCallback();
    if (this._isInitialized) return;
    this._isInitialized = true;
    await this.loadProducts();
  }

  async loadProducts() {
    this.loading = true;
    this.updateView();

    try {
      const res = await api.get("/products/public");
      const data = res?.data?.data;
      this.products = Array.isArray(data) ? data : [];
    } catch (e) {
      console.error("Failed to load products", e);
      this.products = [];
    } finally {
      this.loading = false;
      this.updateView();
    }
  }

  formatCurrency(value) {
    const val = Number(value || 0);
    return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(val);
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

  renderProductCard(p) {
    const image = this.getImageUrl(p.main_image) || "";
    const category = p.category_name || "General";
    const price = this.formatCurrency(p.base_price);

    return `
      <div class="group cursor-pointer">
        <div class="relative aspect-[4/5] bg-slate-50 rounded-[2.25rem] overflow-hidden mb-5 border border-slate-100 group-hover:shadow-2xl group-hover:shadow-indigo-100 transition-all duration-500">
          ${image
            ? `<img src="${image}" alt="${p.name || "Product"}" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700">`
            : `<div class="w-full h-full flex items-center justify-center text-slate-300 text-4xl"><i class="fas fa-image"></i></div>`}
          <div class="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex items-end p-6">
            <a href="/public/products" class="w-full py-3 bg-white text-slate-900 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-indigo-600 hover:text-white transition-colors text-center">View Details</a>
          </div>
        </div>
        <div class="px-1">
          <p class="text-[10px] font-black uppercase tracking-widest text-indigo-600 mb-1">${category}</p>
          <h3 class="text-base font-black text-slate-900 mb-1 leading-tight">${p.name || "Untitled Product"}</h3>
          <p class="text-lg font-black text-slate-900">${price}</p>
        </div>
      </div>
    `;
  }

  renderProductSkeleton() {
    return `
      <div class="animate-pulse">
        <div class="aspect-[4/5] bg-slate-100 rounded-[2.25rem] mb-5"></div>
        <div class="h-3 w-20 bg-slate-100 rounded mb-2"></div>
        <div class="h-4 w-36 bg-slate-100 rounded mb-2"></div>
        <div class="h-4 w-24 bg-slate-100 rounded"></div>
      </div>
    `;
  }

  render() {
    const featured = (this.products || []).slice(0, 8);

    return `
      <div class="py-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <section class="bg-indigo-600 rounded-[2.5rem] p-10 sm:p-12 lg:p-16 text-center text-white mb-12 shadow-2xl overflow-hidden relative border border-indigo-500/50">
          <div class="relative z-10 max-w-3xl mx-auto">
            <div class="inline-block px-4 py-1.5 bg-indigo-500/30 rounded-full text-[10px] font-black uppercase tracking-widest mb-5 border border-white/10 backdrop-blur-sm">
              VastCommerce Ecosystem Ready
            </div>
            <h1 class="text-4xl sm:text-5xl lg:text-6xl font-black mb-5 tracking-tighter leading-tight">One Store, <span class="text-indigo-200">Infinite</span> Possibilities</h1>
            <p class="text-indigo-100/80 text-base sm:text-lg mb-8 font-medium">From real estate to luxury fashion, vehicles to fast food. Our universal architecture powers every industry with premium precision.</p>
            <div class="flex flex-wrap justify-center gap-4">
              <a href="/public/products" class="bg-white text-indigo-600 px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-indigo-50 transition-all hover:scale-[1.02] active:scale-95 shadow-xl shadow-indigo-900/20">Explore All Collections</a>
              <a href="/public/categories" class="bg-indigo-500/20 text-white border border-white/20 px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-white/10 transition-all backdrop-blur-md">Browse Categories</a>
            </div>
          </div>
          <div class="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
            <i class="fas fa-shopping-bag text-[20rem] absolute -top-20 -left-20 rotate-12"></i>
            <i class="fas fa-rocket text-[14rem] absolute -bottom-24 -right-10 -rotate-12"></i>
          </div>
        </section>

        <section class="mb-12">
          <div class="flex items-center justify-between mb-6">
            <div>
              <p class="text-[10px] font-black uppercase tracking-widest text-indigo-600 mb-2">Featured Products</p>
              <h2 class="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Latest arrivals to shop now</h2>
            </div>
            <a href="/public/products" class="text-xs font-black uppercase tracking-widest text-indigo-600 hover:text-indigo-700">View All</a>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            ${this.loading
              ? Array(8).fill(this.renderProductSkeleton()).join("")
              : featured.length
                ? featured.map((p) => this.renderProductCard(p)).join("")
                : `<div class=\"col-span-full text-center text-slate-500 text-sm\">No products available yet.</div>`}
          </div>
        </section>
      </div>
    `;
  }
}

customElements.define("app-public-home-page", PublicHomePage);
export default PublicHomePage;
