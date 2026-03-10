import "@/components/ui/Dialog.js";
import "@/components/ui/Toast.js";
import api from "@/services/api.js";

class MaterialDeleteDialog extends HTMLElement {
  constructor() {
    super();
    this.materialData = null;
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

  setMaterialData(material) {
    this.materialData = material || null;
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
    if (!path.includes("/")) return `${baseUrl}/uploads/materials/${path}`;
    return `${baseUrl}/api/${path}`;
  }

  onConfirm = async () => {
    try {
      if (!this.materialData?.id) return;
      const token = localStorage.getItem("token");
      if (!token) {
        window.Toast?.show?.({
          title: "Authentication Error",
          message: "Please log in again",
          variant: "error",
        });
        return;
      }
      await api.withToken(token).delete(`/materials/${this.materialData.id}`);
      window.Toast?.show?.({
        title: "Deleted",
        message: "Material removed.",
        variant: "success",
      });
      this.close();
      this.dispatchEvent(
        new CustomEvent("material-deleted", {
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
    const material = this.materialData || {};
    this.innerHTML = `
      <ui-dialog ${this.hasAttribute("open") ? "open" : ""} title="Delete Material" variant="danger" confirm-label="Delete">
        <div slot="content" class="space-y-3 text-sm text-slate-700">
          <div class="w-full h-36 bg-slate-50 border border-slate-200 rounded-xl overflow-hidden flex items-center justify-center">
            ${
              material.image
                ? `<img src="${this.getImageUrl(material.image)}" alt="${material.name || "Material"}" class="w-full h-full object-cover" />`
                : `<i class="fas fa-image text-slate-300 text-2xl"></i>`
            }
          </div>
          <p>Are you sure you want to delete:</p>
          <p class="font-bold text-slate-900">${material.name || "this material"}?</p>
          <p class="text-slate-500">This action cannot be undone.</p>
        </div>
      </ui-dialog>
    `;
  }
}

customElements.define("material-delete-dialog", MaterialDeleteDialog);
export default MaterialDeleteDialog;

