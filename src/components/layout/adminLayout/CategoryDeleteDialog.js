import "@/components/ui/Dialog.js";
import "@/components/ui/Toast.js";
import api from "@/services/api.js";

class CategoryDeleteDialog extends HTMLElement {
  constructor() {
    super();
    this.categoryData = null;
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

  setCategoryData(category) {
    this.categoryData = category || null;
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
      if (!this.categoryData?.id) return;
      const token = localStorage.getItem("token");
      if (!token) {
        window.Toast?.show?.({
          title: "Authentication Error",
          message: "Please log in again",
          variant: "error",
        });
        return;
      }
      await api.withToken(token).delete(`/categories/${this.categoryData.id}`);
      window.Toast?.show?.({
        title: "Deleted",
        message: "Category removed.",
        variant: "success",
      });
      this.close();
      this.dispatchEvent(
        new CustomEvent("category-deleted", {
          bubbles: true,
          composed: true,
        }),
      );
    } catch (error) {
      window.Toast?.show?.({
        title: "Error",
        message: error.response?.data?.error || "Delete failed",
        variant: "error",
      });
    }
  };

  render() {
    this.innerHTML = `
      <ui-dialog ${this.hasAttribute("open") ? "open" : ""} title="Delete Category" variant="danger" confirm-label="Delete">
        <div slot="content" class="space-y-2 text-sm text-slate-700">
          <p>Are you sure you want to delete:</p>
          <p class="font-bold text-slate-900">${this.categoryData?.name || "this category"}?</p>
          <p class="text-slate-500">This action cannot be undone.</p>
        </div>
      </ui-dialog>
    `;
  }
}

customElements.define("category-delete-dialog", CategoryDeleteDialog);
export default CategoryDeleteDialog;
