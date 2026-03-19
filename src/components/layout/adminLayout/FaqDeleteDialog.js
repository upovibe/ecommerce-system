import "@/components/ui/Dialog.js";
import "@/components/ui/Toast.js";
import api from "@/services/api.js";

class FaqDeleteDialog extends HTMLElement {
  constructor() {
    super();
    this.faqData = null;
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

  setFaqData(faq) {
    this.faqData = faq || null;
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
    this.addEventListener("confirm", this.onConfirm);
    this.addEventListener("cancel", this.onCancel);
  }

  onCancel = () => {
    this.close();
  };

  onConfirm = async () => {
    try {
      if (!this.faqData?.id) return;
      const token = localStorage.getItem("token");
      if (!token) {
        window.Toast?.show?.({
          title: "Authentication Error",
          message: "Please log in again",
          variant: "error",
        });
        return;
      }
      await api.withToken(token).delete(`/faqs/${this.faqData.id}`);
      window.Toast?.show?.({
        title: "Deleted",
        message: "FAQ removed.",
        variant: "success",
      });
      this.close();
      this.dispatchEvent(
        new CustomEvent("faq-deleted", {
          bubbles: true,
          composed: true,
        }),
      );
    } catch (error) {
      window.Toast?.show?.({
        title: "Error",
        message: error.response?.data?.message || "Delete failed",
        variant: "error",
      });
    }
  };

  render() {
    const faq = this.faqData || {};
    this.innerHTML = `
      <ui-dialog ${this.hasAttribute("open") ? "open" : ""} title="Delete FAQ" variant="danger" confirm-label="Delete">
        <div slot="content" class="space-y-3 text-sm text-slate-700">
          <p>Are you sure you want to delete this FAQ?</p>
          <p class="font-semibold text-slate-900">${faq.question || "This item"}</p>
          <p class="text-slate-500">This action cannot be undone.</p>
        </div>
      </ui-dialog>
    `;
  }
}

customElements.define("faq-delete-dialog", FaqDeleteDialog);
export default FaqDeleteDialog;
