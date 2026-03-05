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

          <div class="rounded-2xl border border-slate-200 bg-white p-5">
            <h3 class="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Content Preview</h3>
            <div class="prose prose-sm max-w-none text-slate-700 leading-relaxed max-h-[300px] overflow-y-auto pr-2">
              ${page.content || '<p class="italic text-slate-400">No content available for this page.</p>'}
            </div>
          </div>
        </div>
      </ui-modal>
    `;
  }
}

customElements.define("page-view-modal", PageViewModal);
export default PageViewModal;
