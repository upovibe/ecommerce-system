import "@/components/ui/Modal.js";

class FaqViewModal extends HTMLElement {
  constructor() {
    super();
    this.faqData = null;
  }

  static get observedAttributes() {
    return ["open"];
  }

  connectedCallback() {
    this.render();
  }

  attributeChangedCallback() {
    this.render();
  }

  setFaqData(faq) {
    this.faqData = faq || null;
    this.render();
  }

  open() {
    this.setAttribute("open", "");
  }

  close() {
    this.removeAttribute("open");
  }

  render() {
    const faq = this.faqData || {};
    const updated = faq.updated_at ? new Date(faq.updated_at).toLocaleString() : "-";
    const created = faq.created_at ? new Date(faq.created_at).toLocaleString() : "-";
    const status = faq.is_active ? "Active" : "Inactive";
    const statusClass = faq.is_active
      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
      : "bg-slate-100 text-slate-600 border-slate-200";

    this.innerHTML = `
      <ui-modal ${this.hasAttribute("open") ? "open" : ""} position="right" size="md" close-button="true">
        <div slot="title">FAQ Details</div>
        <div class="space-y-5 text-sm text-slate-600">
          <div class="rounded-2xl border border-slate-100 bg-slate-50/60 p-4 space-y-2">
            <p class="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Question</p>
            <p class="text-slate-900 font-semibold text-base leading-snug">${faq.question || "-"}</p>
          </div>
          <div class="rounded-2xl border border-slate-100 bg-white p-4 space-y-2">
            <p class="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Answer</p>
            <p class="text-slate-700 leading-relaxed">${faq.answer || "-"}</p>
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div class="rounded-2xl border border-slate-100 bg-white p-4 space-y-2">
              <p class="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Status</p>
              <span class="inline-flex items-center px-3 py-1 rounded-full border text-xs font-semibold ${statusClass}">${status}</span>
            </div>
            <div class="rounded-2xl border border-slate-100 bg-white p-4 space-y-2">
              <p class="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Sort Order</p>
              <p class="text-slate-900 font-semibold">${faq.sort_order ?? 0}</p>
            </div>
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div class="rounded-2xl border border-slate-100 bg-white p-4 space-y-2">
              <p class="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Created</p>
              <p class="text-slate-700">${created}</p>
            </div>
            <div class="rounded-2xl border border-slate-100 bg-white p-4 space-y-2">
              <p class="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Updated</p>
              <p class="text-slate-700">${updated}</p>
            </div>
          </div>
        </div>
      </ui-modal>
    `;
  }
}

customElements.define("faq-view-modal", FaqViewModal);
export default FaqViewModal;
