import "@/components/ui/Modal.js";
import "@/components/ui/Toast.js";
import "@/components/ui/Input.js";
import "@/components/ui/Textarea.js";
import "@/components/ui/Dropdown.js";
import "@/components/ui/Switch.js";
import "@/components/ui/FileUpload.js";
import api from "@/services/api.js";

class CategorySettingsModal extends HTMLElement {
  constructor() {
    super();
    this.categories = [];
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

  setCategories(categories) {
    this.categories = Array.isArray(categories) ? categories : [];
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
      const parentInput = this.querySelector('ui-dropdown[data-field="parent_id"]');
      const descInput = this.querySelector('ui-textarea[data-field="description"]');
      const activeSwitch = this.querySelector('ui-switch[name="is_active"]');
      const imageUpload = this.querySelector('ui-file-upload[data-field="image"]');

      const payload = {
        name: (nameInput?.value || "").trim(),
        description: (descInput?.value || "").trim() || null,
        parent_id: parentInput?.value ? Number(parentInput.value) : null,
        is_active: activeSwitch?.checked ? true : false,
      };

      if (!payload.name) {
        window.Toast?.show?.({
          title: "Validation Error",
          message: "Category name is required",
          variant: "error",
        });
        return;
      }

      const createRes = await api.withToken(token).post("/categories", payload);
      const newId = createRes?.data?.data?.id;

      const files = imageUpload?.getFiles?.() || [];
      const newImage = files.find((f) => f instanceof File);
      if (newId && newImage) {
        const formData = new FormData();
        formData.append("image", newImage);
        await api.withToken(token).post(`/categories/${newId}/upload-image`, formData, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        });
      }

      window.Toast?.show?.({
        title: "Success",
        message: "Category created.",
        variant: "success",
      });
      this.close();
      this.dispatchEvent(
        new CustomEvent("category-saved", {
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
          "Failed to create category",
        variant: "error",
      });
    }
  };

  render() {
    const parentOptions = this.categories
      .filter((c) => !c.parent_id)
      .map((c) => `<ui-option value="${c.id}">${c.name}</ui-option>`)
      .join("");

    this.innerHTML = `
      <ui-modal ${this.hasAttribute("open") ? "open" : ""} position="right" size="md" close-button="true">
        <div slot="title">Add Category</div>
        <form class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1">Category Name</label>
            <ui-input data-field="name" placeholder="e.g. Electronics" class="w-full"></ui-input>
          </div>
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1">Parent Category</label>
            <ui-dropdown data-field="parent_id" placeholder="None (Main category)" class="w-full">
              <ui-option value="">Main Category</ui-option>
              ${parentOptions}
            </ui-dropdown>
          </div>
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1">Description</label>
            <ui-textarea data-field="description" rows="3" placeholder="Add a short description..." class="w-full"></ui-textarea>
          </div>
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1">Category Image</label>
            <ui-file-upload data-field="image" accept="image/*" max-size="5242880" max-files="1" class="w-full"></ui-file-upload>
          </div>
          <div>
            <ui-switch name="is_active" checked>
              <span slot="label">Active</span>
            </ui-switch>
          </div>
        </form>
      </ui-modal>
    `;
  }
}

customElements.define("category-settings-modal", CategorySettingsModal);
export default CategorySettingsModal;
