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

  getImageUrl(path) {
    if (!path) return "";
    if (
      path.startsWith("http://") ||
      path.startsWith("https://") ||
      path.startsWith("data:")
    ) {
      return path;
    }

    const baseUrl = window.location.origin;
    if (path.startsWith("/")) return baseUrl + path;
    if (path.startsWith("uploads/")) return `${baseUrl}/${path}`;
    if (!path.includes("/")) return `${baseUrl}/uploads/categories/${path}`;
    return `${baseUrl}/api/${path}`;
  }

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
    const cat = this.categoryData || {};
    this.innerHTML = `
      <ui-dialog ${this.hasAttribute("open") ? "open" : ""} title="Delete Category" variant="danger" confirm-label="Delete">
        <div slot="content" class="space-y-3 text-sm text-slate-700">
          <div class="w-full h-36 bg-slate-50 border border-slate-200 rounded-xl overflow-hidden flex items-center justify-center">
            ${
              cat.image
                ? `<img src="${this.getImageUrl(cat.image)}" alt="${cat.name || "Category"}" class="w-full h-full object-cover" />`
                : `<i class="fas fa-image text-slate-300 text-2xl"></i>`
            }
          </div>
          <p>Are you sure you want to delete:</p>
          <p class="font-bold text-slate-900">${cat.name || "this category"}?</p>
          <p class="text-slate-500">This action cannot be undone.</p>
        </div>
      </ui-dialog>
    `;
  }
}

customElements.define("category-delete-dialog", CategoryDeleteDialog);
export default CategoryDeleteDialog;
