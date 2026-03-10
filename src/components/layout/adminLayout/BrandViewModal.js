import "@/components/ui/Modal.js";

class BrandViewModal extends HTMLElement {
  constructor() {
    super();
    this.brandData = null;
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

  setBrandData(brand) {
    this.brandData = brand || null;
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

    if (!path.includes("/")) {
      return `${baseUrl}/api/uploads/brands/${path}`;
    }

    return `${baseUrl}/api/${path}`;
  }

  render() {
    const brand = this.brandData || {};
    const updatedDate = brand.updated_at
      ? new Date(brand.updated_at).toLocaleString()
      : "-";

    this.innerHTML = `
      <ui-modal ${this.hasAttribute("open") ? "open" : ""} position="right" size="md" close-button="true">
        <div slot="title">Brand Details</div>
        <div class="space-y-5 text-sm">
          <div class="w-full h-48 bg-gradient-to-br from-slate-50 to-slate-100 border border-slate-200 rounded-2xl overflow-hidden flex items-center justify-center">
            ${
              brand.image
                ? `<img src="${this.getImageUrl(brand.image)}" class="w-full h-full object-cover" alt="${brand.name || "Brand"}" />`
                : `<i class="fas fa-image text-slate-300 text-3xl"></i>`
            }
          </div>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div class="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <p class="text-[11px] font-bold text-slate-500 uppercase tracking-wide">Name</p>
              <p class="mt-1 text-slate-900 font-semibold">${brand.name || "-"}</p>
            </div>
            <div class="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <p class="text-[11px] font-bold text-slate-500 uppercase tracking-wide">Status</p>
              <p class="mt-1 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
                brand.is_active
                  ? "bg-emerald-100 text-emerald-700"
                  : "bg-slate-200 text-slate-600"
              }">${brand.is_active ? "Active" : "Hidden"}</p>
            </div>
            <div class="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <p class="text-[11px] font-bold text-slate-500 uppercase tracking-wide">Last Updated</p>
              <p class="mt-1 text-slate-800">${updatedDate}</p>
            </div>
          </div>
          <div class="rounded-xl border border-slate-200 bg-white p-4">
            <p class="text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-2">Description</p>
            <p class="text-slate-700 leading-relaxed">${brand.description || "No description"}</p>
          </div>
        </div>
      </ui-modal>
    `;
  }
}

customElements.define("brand-view-modal", BrandViewModal);
export default BrandViewModal;

