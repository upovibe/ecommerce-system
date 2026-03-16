import "@/components/ui/Modal.js";

class ProductViewModal extends HTMLElement {
  constructor() {
    super();
    this.productData = null;
    this._listenersBound = false;
  }

  static get observedAttributes() {
    return ["open"];
  }

  connectedCallback() {
    this.render();
    this.setupEventListeners();
  }

  attributeChangedCallback() {
    this.render();
    this.setupEventListeners();
  }

  setProductData(product) {
    this.productData = product || null;
    this.render();
    this.setupEventListeners();
  }

  open() {
    this.setAttribute("open", "");
  }

  close() {
    this.removeAttribute("open");
  }

  setupEventListeners() {
    if (this._listenersBound) return;
    this._listenersBound = true;
    this.addEventListener("cancel", this.onCancel);
  }

  onCancel = () => {
    this.close();
  };

  formatCurrency(value) {
    const val = Number(value || 0);
    return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(val);
  }

  getImageUrl(path) {
    if (!path) return "";
    if (path.startsWith("http://") || path.startsWith("https://") || path.startsWith("data:")) {
      return path;
    }

    const baseUrl = window.location.origin;
    if (path.startsWith("/api/")) return baseUrl + path;
    if (path.startsWith("/")) return baseUrl + path;

    if (path.startsWith("uploads/")) {
      return `${baseUrl}/api/${path}`;
    }

    return `${baseUrl}/api/${path.replace(/^\//, "")}`;
  }

  getGalleryImages(product) {
    const imgs = Array.isArray(product?.images)
      ? product.images
      : (typeof product?.images === "string" ? JSON.parse(product.images) : []);
    return (imgs || []).map((img) => this.getImageUrl(img)).filter(Boolean);
  }

  getDetailsText(details) {
    if (!details) return "";
    if (typeof details === "string") {
      try {
        const parsed = JSON.parse(details);
        return parsed?.note || "";
      } catch (_) {
        return details;
      }
    }
    if (typeof details === "object") {
      return details.note || "";
    }
    return "";
  }

  renderBanner(product) {
    const main = product?.main_image || "";
    const gallery = this.getGalleryImages(product);
    const src = this.getImageUrl(main) || gallery[0] || "";
    if (!src) {
      return `<div class="bg-indigo-50 size-20 rounded-3xl flex items-center justify-center text-indigo-300 shadow-sm"><i class="fas fa-box text-4xl"></i></div>`;
    }
    return `<img src="${src}" class="w-full h-full object-cover rounded-2xl shadow-inner" alt="${product?.name || "Product"}">`;
  }

  renderVariants(product) {
    const variants = Array.isArray(product?.variants) ? product.variants : [];
    if (!variants.length) {
      return `<div class="p-4 text-center text-slate-400 bg-white rounded-2xl border border-dashed border-slate-200">No variations configured</div>`;
    }

    return `
      <div class="overflow-hidden bg-white rounded-2xl border border-slate-100 shadow-sm">
        <table class="w-full text-left text-sm">
          <thead class="bg-slate-50 border-b border-slate-100">
            <tr>
              <th class="px-4 py-3 font-bold text-slate-500 uppercase tracking-wider text-[10px]">Variation</th>
              <th class="px-4 py-3 font-bold text-slate-500 uppercase tracking-wider text-[10px]">Quantity</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-50">
            ${variants.map((v) => {
              const opt = typeof v.variant_options === "string" ? JSON.parse(v.variant_options) : v.variant_options;
              const type = opt?.type || "Default";
              const value = opt?.value || opt?.label || "Default";
              const qty = v.quantity ?? v.stock ?? 0;
              const isLow = qty <= 5;
              return `
                <tr class="hover:bg-slate-50 transition">
                  <td class="px-4 py-3">
                    <div class="text-[10px] text-slate-400 font-bold uppercase">${type}</div>
                    <div class="font-semibold text-slate-700">${value}</div>
                  </td>
                  <td class="px-4 py-3">
                    <span class="px-2 py-0.5 rounded-full text-[11px] font-bold ${isLow ? "bg-orange-100 text-orange-600" : "bg-emerald-100 text-emerald-600"}">
                      ${qty} pcs
                    </span>
                  </td>
                </tr>
              `;
            }).join("")}
          </tbody>
        </table>
      </div>
    `;
  }

  renderGallery(product) {
    const images = this.getGalleryImages(product);
    if (!images.length) {
      return `<div class="text-sm text-slate-400">No gallery images</div>`;
    }
    return `
      <div class="grid grid-cols-2 sm:grid-cols-3 gap-3">
        ${images.map((src) => `
          <div class="aspect-square rounded-xl overflow-hidden border border-slate-100 bg-slate-50">
            <img src="${src}" class="w-full h-full object-cover" alt="Product image">
          </div>
        `).join("")}
      </div>
    `;
  }

  render() {
    const p = this.productData || {};
    const viewBrand = p.brand_name || "-";
    const viewMaterial = p.material_name || "-";
    const detailsText = this.getDetailsText(p.details);

    this.innerHTML = `
      <ui-modal ${this.hasAttribute("open") ? "open" : ""} position="right" size="lg" close-button="true">
        <span slot="title" class="flex items-center gap-2 font-black uppercase tracking-tighter text-slate-800">
          <i class="fas fa-eye text-blue-500 font-normal"></i> Product Overview
        </span>
        <div class="space-y-6">
          <div class="relative h-64 bg-slate-900 rounded-2xl overflow-hidden group">
            <div class="w-full h-full opacity-60 group-hover:opacity-100 transition duration-500 flex items-center justify-center">
              ${this.renderBanner(p)}
            </div>
            <div class="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent"></div>
            <div class="absolute top-4 left-4 right-4 flex items-start justify-between gap-3">
              <div class="flex items-center gap-2">
                <span class="px-2.5 py-1 rounded-lg bg-white/10 backdrop-blur-md text-white/90 text-xs font-semibold border border-white/20">
                  ${p.category_name || "Uncategorized"}
                </span>
                <span class="px-2.5 py-1 rounded-lg bg-indigo-500/20 backdrop-blur-md text-indigo-300 text-xs font-semibold border border-indigo-500/30">
                  ${(p.type || "physical").toUpperCase()}
                </span>
              </div>
              <div>
                ${p.is_active
                  ? `<span class="px-3 py-1.5 rounded-xl bg-emerald-500/20 backdrop-blur-md text-emerald-400 text-xs font-bold border border-emerald-500/30 flex items-center gap-2"><span class="size-1.5 rounded-full bg-emerald-400"></span>ACTIVE</span>`
                  : `<span class="px-3 py-1.5 rounded-xl bg-slate-500/20 backdrop-blur-md text-slate-400 text-xs font-bold border border-slate-500/30">INACTIVE</span>`
                }
              </div>
            </div>
            <div class="absolute bottom-4 left-4 right-4 flex items-end justify-between gap-3">
              <h2 class="text-3xl font-extrabold text-white tracking-tight">${p.name || "Product"}</h2>
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-5">
            ${[
              { label: "Price", value: this.formatCurrency(p.base_price), icon: "fa-tag", color: "text-emerald-500" },
              { label: "Total Stock", value: p.total_stock ?? 0, icon: "fa-cubes", color: "text-blue-500" },
              { label: "Variants", value: p.variant_count ?? (Array.isArray(p.variants) ? p.variants.length : 0), icon: "fa-layer-group", color: "text-purple-500" },
              { label: "Product Type", value: p.type || "Physical", icon: "fa-shapes", color: "text-indigo-500" },
            ].map((s) => `
              <div class="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm">
                <div class="flex items-center gap-3 mb-3">
                  <div class="size-10 rounded-xl bg-slate-50 flex items-center justify-center">
                    <i class="fas ${s.icon} ${s.color} text-base"></i>
                  </div>
                  <span class="text-xs font-bold text-slate-400 uppercase tracking-wider">${s.label}</span>
                </div>
                <p class="text-2xl font-black text-slate-900 tracking-tight">${s.value}</p>
              </div>
            `).join("")}
          </div>

          <div class="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm">
            <div class="flex items-center gap-3 mb-4">
              <div class="size-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                <i class="fas fa-align-left text-lg"></i>
              </div>
              <h3 class="font-bold text-slate-900 text-lg">Description</h3>
            </div>
            <div class="text-slate-600 text-sm leading-relaxed">
              ${p.description || "<span class='text-slate-400'>No description provided</span>"}
            </div>
          </div>

          <div class="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm">
            <div class="flex items-center gap-3 mb-4">
              <div class="size-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
                <i class="fas fa-info-circle text-lg"></i>
              </div>
              <h3 class="font-bold text-slate-900 text-lg">More Information</h3>
            </div>
            <div class="text-slate-600 text-sm leading-relaxed">
              ${detailsText ? detailsText : "<span class='text-slate-400'>No extra details</span>"}
            </div>
          </div>

          <div class="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm">
            <div class="flex items-center gap-3 mb-4">
              <div class="size-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                <i class="fas fa-images text-lg"></i>
              </div>
              <h3 class="font-bold text-slate-900 text-lg">Gallery</h3>
            </div>
            ${this.renderGallery(p)}
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div class="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm">
              <div class="flex items-center gap-3 mb-4">
                <div class="size-8 rounded-lg bg-orange-50 flex items-center justify-center text-orange-500">
                  <i class="fas fa-barcode text-sm"></i>
                </div>
                <h3 class="text-xs font-bold text-slate-400 uppercase tracking-wider">Identifiers</h3>
              </div>
              <div class="space-y-4">
                <div class="flex flex-col gap-1">
                  <span class="text-[10px] font-bold text-slate-400 uppercase">Product Code</span>
                  <span class="text-base font-bold text-slate-900 font-mono tracking-wider">${p.product_code || "-"}</span>
                </div>
                <div class="flex flex-col gap-1 pt-3 border-t border-slate-50">
                  <span class="text-[10px] font-bold text-slate-400 uppercase">SKU</span>
                  <span class="text-base font-bold text-slate-900 font-mono tracking-wider">${p.sku || "-"}</span>
                </div>
              </div>
            </div>
            <div class="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm">
              <div class="flex items-center gap-3 mb-4">
                <div class="size-8 rounded-lg bg-teal-50 flex items-center justify-center text-teal-500">
                  <i class="fas fa-info-circle text-sm"></i>
                </div>
                <h3 class="text-xs font-bold text-slate-400 uppercase tracking-wider">Properties</h3>
              </div>
              <div class="space-y-4">
                <div class="flex flex-col gap-1">
                  <span class="text-[10px] font-bold text-slate-400 uppercase">Brand</span>
                  <span class="text-base font-bold text-slate-900">${viewBrand}</span>
                </div>
                <div class="flex flex-col gap-1 pt-3 border-t border-slate-50">
                  <span class="text-[10px] font-bold text-slate-400 uppercase">Material</span>
                  <span class="text-base font-bold text-slate-900">${viewMaterial}</span>
                </div>
              </div>
            </div>
          </div>

          <div class="space-y-4">
            <div class="flex items-center gap-3">
              <div class="size-10 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600">
                <i class="fas fa-layer-group text-lg"></i>
              </div>
              <div>
                <h3 class="font-bold text-slate-900 text-lg leading-tight">Product Variations</h3>
                <p class="text-xs text-slate-500 font-medium mt-0.5">Inventory and quantity per variant</p>
              </div>
            </div>
            ${this.renderVariants(p)}
          </div>
        </div>
      </ui-modal>
    `;
  }
}

customElements.define("product-view-modal", ProductViewModal);
export default ProductViewModal;

