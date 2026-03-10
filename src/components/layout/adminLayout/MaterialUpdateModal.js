import "@/components/ui/Modal.js";
import "@/components/ui/Toast.js";
import "@/components/ui/Input.js";
import "@/components/ui/Textarea.js";
import "@/components/ui/Switch.js";
import "@/components/ui/FileUpload.js";
import api from "@/services/api.js";

class MaterialUpdateModal extends HTMLElement {
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
    if (path.startsWith("http://") || path.startsWith("https://") || path.startsWith("data:")) {
      return path;
    }

    const baseUrl = window.location.origin;
    if (path.startsWith("/")) {
      return baseUrl + path;
    }

    if (path.startsWith("uploads/")) {
      return `${baseUrl}/${path}`;
    }

    if (!path.includes("/")) {
      return `${baseUrl}/uploads/materials/${path}`;
    }

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

      const nameInput = this.querySelector('ui-input[data-field="name"]');
      const descInput = this.querySelector('ui-textarea[data-field="description"]');
      const activeSwitch = this.querySelector('ui-switch[name="is_active"]');
      const imageUpload = this.querySelector('ui-file-upload[data-field="image"]');

      const payload = {
        name: (nameInput?.value || "").trim(),
        description: (descInput?.value || "").trim() || null,
        is_active: activeSwitch?.checked ? true : false,
      };

      if (!payload.name) {
        window.Toast?.show?.({
          title: "Validation Error",
          message: "Material name is required",
          variant: "error",
        });
        return;
      }

      await api.withToken(token).put(`/materials/${this.materialData.id}`, payload);

      const files = imageUpload?.getFiles?.() || [];
      const newImage = files.find((f) => f instanceof File);
      if (newImage) {
        const formData = new FormData();
        formData.append("image", newImage);
        await api.withToken(token).post(`/materials/${this.materialData.id}/upload-image`, formData, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        });
      }

      window.Toast?.show?.({
        title: "Success",
        message: "Material updated.",
        variant: "success",
      });
      this.close();
      this.dispatchEvent(
        new CustomEvent("material-updated", {
          bubbles: true,
          composed: true,
        }),
      );
    } catch (error) {
      window.Toast?.show?.({
        title: "Error",
        message:
          error.response?.data?.error ||
          error.response?.data?.message ||
          "Failed to update material",
        variant: "error",
      });
    }
  };

  render() {
    const material = this.materialData || {};
    const imageValue = material.image
      ? this.getImageUrl(material.image).replace(/"/g, "&quot;")
      : "";

    this.innerHTML = `
      <ui-modal ${this.hasAttribute("open") ? "open" : ""} position="right" size="md" close-button="true">
        <div slot="title">Edit Material</div>
        <form class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1">Material Name</label>
            <ui-input data-field="name" value="${material.name || ""}" placeholder="e.g. Leather" class="w-full"></ui-input>
          </div>
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1">Description</label>
            <ui-textarea data-field="description" rows="3" value="${(material.description || "").replace(/"/g, "&quot;")}" placeholder="Add a short description..." class="w-full"></ui-textarea>
          </div>
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1">Material Image</label>
            <ui-file-upload data-field="image" accept="image/*" max-size="5242880" max-files="1" ${imageValue ? `value="${imageValue}"` : ""} class="w-full"></ui-file-upload>
          </div>
          <div>
            <ui-switch name="is_active" ${material.is_active !== false ? "checked" : ""}>
              <span slot="label">Active</span>
            </ui-switch>
          </div>
        </form>
      </ui-modal>
    `;
  }
}

customElements.define("material-update-modal", MaterialUpdateModal);
export default MaterialUpdateModal;

