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

  render() {
    const page = this.pageData || {};
    const updatedDate = page.updated_at
      ? new Date(page.updated_at).toLocaleString()
      : page.updated || "-";
    const createdDate = page.created_at
      ? new Date(page.created_at).toLocaleString()
      : page.created || "-";

    this.innerHTML = `
      <ui-modal ${this.hasAttribute("open") ? "open" : ""} position="right" size="lg" close-button="true">
        <div slot="title">Page Details</div>
        <div class="space-y-6 text-sm">
          <div class="bg-slate-50 p-6 rounded-2xl border border-slate-100">
            <h2 class="text-2xl font-bold text-slate-900">${page.title || "Untitled Page"}</h2>
            <p class="text-slate-500 font-medium mt-1">/${page.slug || ""}</p>
            <div class="mt-4 inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
              page.is_active || page.status === "Published"
                ? "bg-emerald-100 text-emerald-700"
                : "bg-amber-100 text-amber-700"
            }">
              ${page.is_active || page.status === "Published" ? "Published" : "Draft"}
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div class="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <p class="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Slug</p>
              <p class="mt-1 text-slate-900 font-semibold truncate">${page.slug || "-"}</p>
            </div>
            <div class="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <p class="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Status</p>
              <p class="mt-1 text-slate-900 font-semibold">${page.is_active || page.status === "Published" ? "Published" : "Draft"}</p>
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

          <div class="rounded-2xl border border-slate-200 bg-white">
            <div class="p-6">
              <h4 class="text-sm font-semibold text-gray-900 dark:text-white mb-2 uppercase tracking-wider">Page Content</h4>
              <div class="prose prose-sm dark:prose-invert max-w-none bg-gray-50 dark:bg-gray-800/50 p-6 rounded-xl border border-gray-100 dark:border-gray-700">
                  ${page.content || '<span class="text-gray-400 italic">No content provided</span>'}
              </div>
            </div>

            ${
              page.images &&
              Array.isArray(page.images) &&
              page.images.length > 0
                ? `
            <div class="p-6 border-t border-gray-100 dark:border-gray-700">
                <h4 class="text-sm font-semibold text-gray-900 dark:text-white mb-4 uppercase tracking-wider">Page Gallery</h4>
                <div class="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    ${page.images
                      .map(
                        (img) => `
                        <div class="aspect-square rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 group relative">
                            <img src="/api/uploads/pages/${img}" class="w-full h-full object-cover transition-transform group-hover:scale-110" alt="Gallery">
                            <div class="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <ui-button variant="ghost" size="sm" class="text-white hover:bg-white/20">
                                    <i class="fas fa-expand text-sm"></i>
                                </ui-button>
                            </div>
                        </div>
                    `,
                      )
                      .join("")}
                </div>
            </div>
            `
                : ""
            }
          </div>
        </div>
      </ui-modal>
    `;
  }
}

customElements.define("page-view-modal", PageViewModal);
export default PageViewModal;
