import "@/components/ui/Modal.js";

class PageViewModal extends HTMLElement {
  constructor() {
    super();
    this.pageData = null;
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

  setPageData(page) {
    this.pageData = page || null;
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
    this.addEventListener("cancel", () => this.close());
  }

  _getImageUrl(path) {
    if (!path) return "";
    if (path.startsWith("http://") || path.startsWith("https://")) return path;
    return `/api/${path.replace(/^\//, "")}`;
  }

  _parseBanners(raw) {
    if (!raw) return [];
    if (Array.isArray(raw)) return raw;
    if (typeof raw === "string") {
      try { return JSON.parse(raw); } catch { return [raw]; }
    }
    return [];
  }

  _renderBanner(page) {
    const banners = this._parseBanners(page.banner_image);
    if (!banners.length) return "";
    return `
      <div class="rounded-2xl overflow-hidden border border-slate-200 shadow-sm">
        <img
          src="${this._getImageUrl(banners[0])}"
          alt="${page.title || "Banner"}"
          class="w-full h-52 object-cover"
          onerror="this.parentElement.style.display='none'">
      </div>
    `;
  }

  _renderGallery(page) {
    const images = this._parseBanners(page.images);
    if (!images.length) return "";
    return `
      <div class="p-6 border-t border-gray-100">
        <h4 class="text-sm font-semibold text-gray-900 mb-4 uppercase tracking-wider">Gallery</h4>
        <div class="grid grid-cols-2 sm:grid-cols-3 gap-4">
          ${images.map((img) => `
            <div class="aspect-square rounded-xl overflow-hidden border border-gray-200 group relative">
              <img src="${this._getImageUrl(img)}" class="w-full h-full object-cover transition-transform group-hover:scale-110" alt="Gallery image">
            </div>
          `).join("")}
        </div>
      </div>
    `;
  }

  render() {
    const page = this.pageData || {};
    const updatedDate = page.updated_at
      ? new Date(page.updated_at).toLocaleString()
      : "-";
    const createdDate = page.created_at
      ? new Date(page.created_at).toLocaleString()
      : "-";

    const isActive = Number(page.is_active) === 1 || page.status === "Live";

    this.innerHTML = `
      <ui-modal ${this.hasAttribute("open") ? "open" : ""} position="right" size="lg" close-button="true">
        <div slot="title">Page Details</div>
        <div class="space-y-6 text-sm">

          <div class="bg-slate-50 p-6 rounded-2xl border border-slate-100">
            <h2 class="text-2xl font-bold text-slate-900">${page.title || "Untitled Page"}</h2>
            <p class="text-slate-500 font-medium mt-1">/${page.slug || ""}</p>
            <div class="mt-4 inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
              isActive ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
            }">
              ${isActive ? "Published" : "Draft"}
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div class="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <p class="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Slug</p>
              <p class="mt-1 text-slate-900 font-semibold truncate">${page.slug || "-"}</p>
            </div>
            <div class="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <p class="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Status</p>
              <p class="mt-1 text-slate-900 font-semibold">${isActive ? "Published" : "Draft"}</p>
            </div>
            <div class="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <p class="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Created At</p>
              <p class="mt-1 text-slate-800 font-medium">${createdDate}</p>
            </div>
            <div class="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <p class="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Last Updated</p>
              <p class="mt-1 text-slate-800 font-medium">${updatedDate}</p>
            </div>
          </div>

          ${this._renderBanner(page)}

          <div class="rounded-2xl border border-slate-200 bg-white">
            <div class="p-6">
              <h4 class="text-sm font-semibold text-gray-900 mb-2 uppercase tracking-wider">Page Content</h4>
              <div class="prose prose-sm max-w-none bg-gray-50 p-6 rounded-xl border border-gray-100">
                ${page.content || '<span class="text-gray-400 italic">No content provided</span>'}
              </div>
            </div>
            ${this._renderGallery(page)}
          </div>

        </div>
      </ui-modal>
    `;
  }
}

customElements.define("page-view-modal", PageViewModal);
export default PageViewModal;
