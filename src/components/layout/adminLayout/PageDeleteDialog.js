import "@/components/ui/Dialog.js";
import "@/components/ui/Toast.js";
import api from "@/services/api.js";

class PageDeleteDialog extends HTMLElement {
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
    this.addEventListener("confirm", this.onConfirm);
    this.addEventListener("cancel", () => this.close());
  }

  onConfirm = async () => {
    try {
      if (!this.pageData?.id) return;
      const token = localStorage.getItem("token");
      await api.withToken(token).delete(`/pages/${this.pageData.id}`);
      Toast.show({
        title: "Deleted",
        message: "Page removed.",
        variant: "success",
      });
      this.close();
      this.dispatchEvent(
        new CustomEvent("page-deleted", { bubbles: true, composed: true }),
      );
    } catch (e) {
      Toast.show({ title: "Error", message: e.message, variant: "error" });
    }
  };

  render() {
    const page = this.pageData || {};
    this.innerHTML = `
      <ui-dialog ${this.hasAttribute("open") ? "open" : ""} title="Delete Page" variant="danger" confirm-label="Delete">
        <div slot="content" class="space-y-3 text-sm text-slate-700">
          <p>Are you sure you want to delete:</p>
          <p class="font-bold text-slate-900">${page.title || "this page"}?</p>
          <p class="text-slate-500">This action cannot be undone and the page will be permanently removed from the site.</p>
        </div>
      </ui-dialog>
    `;
  }
}

customElements.define("page-delete-dialog", PageDeleteDialog);
export default PageDeleteDialog;
