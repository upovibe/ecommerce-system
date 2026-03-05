import "@/components/ui/Modal.js";
import "@/components/ui/Toast.js";
import "@/components/ui/Input.js";
import "@/components/ui/Dropdown.js";
import "@/components/ui/Switch.js";
import "@/components/ui/FileUpload.js";
import api from "@/services/api.js";

class CategoryUpdateModal extends HTMLElement {
  constructor() {
    super();
    this.categories = [];
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

  setCategories(categories) {
    this.categories = Array.isArray(categories) ? categories : [];
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
      return `${baseUrl}/uploads/categories/${path}`;
    }

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

      const nameInput = this.querySelector('ui-input[data-field="name"]');
      const parentInput = this.querySelector('ui-dropdown[data-field="parent_id"]');
      const descInput = this.querySelector('textarea[data-field="description"]');
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

      await api.withToken(token).put(`/categories/${this.categoryData.id}`, payload);

      const files = imageUpload?.getFiles?.() || [];
      const newImage = files.find((f) => f instanceof File);
      if (newImage) {
        const formData = new FormData();
        formData.append("image", newImage);
        await api.withToken(token).post(
          `/categories/${this.categoryData.id}/upload-image`,
          formData,
          {
            headers: {
              "Content-Type": "multipart/form-data",
            },
          },
        );
      }

      window.Toast?.show?.({
        title: "Success",
        message: "Category updated.",
        variant: "success",
      });
      this.close();
      this.dispatchEvent(
        new CustomEvent("category-updated", {
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
          "Failed to update category",
        variant: "error",
      });
    }
  };

  render() {
    const category = this.categoryData || {};
    const imageValue = category.image
      ? this.getImageUrl(category.image).replace(/"/g, "&quot;")
      : "";
    const parentOptions = this.categories
      .filter((c) => !c.parent_id && c.id !== category.id)
      .map((c) => `<ui-option value="${c.id}">${c.name}</ui-option>`)
      .join("");
    const isMainCategory = !category?.parent_id;

    this.innerHTML = `
      <ui-modal ${this.hasAttribute("open") ? "open" : ""} position="right" size="md" close-button="true">
        <div slot="title">Edit Category</div>
        <form class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1">Category Name</label>
            <ui-input data-field="name" value="${category.name || ""}" placeholder="e.g. Electronics" class="w-full"></ui-input>
          </div>
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1">Parent Category</label>
            ${
              isMainCategory
                ? `<div class="w-full border border-slate-300 rounded-xl px-3 py-2.5 text-sm text-slate-500 bg-slate-50">Main Category</div>`
                : `
              <ui-dropdown data-field="parent_id" placeholder="Select parent" class="w-full">
                <ui-option value="">Main Category</ui-option>
                ${parentOptions}
              </ui-dropdown>
            `
            }
          </div>
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1">Description</label>
            <textarea data-field="description" rows="3" class="w-full border border-slate-300 rounded-xl px-3 py-2.5 text-sm text-slate-700 resize-none">${category.description || ""}</textarea>
          </div>
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1">Category Image</label>
            <ui-file-upload data-field="image" accept="image/*" max-size="5242880" max-files="1" ${imageValue ? `value="${imageValue}"` : ""} class="w-full"></ui-file-upload>
          </div>
          <div>
            <ui-switch name="is_active" ${category.is_active !== false ? "checked" : ""}>
              <span slot="label">Active</span>
            </ui-switch>
          </div>
        </form>
      </ui-modal>
    `;

    if (!isMainCategory) {
      const parentInput = this.querySelector('ui-dropdown[data-field="parent_id"]');
      if (parentInput && category?.parent_id) {
        setTimeout(() => {
          parentInput.value = String(category.parent_id);
        }, 0);
      }
    }
  }
}

customElements.define("category-update-modal", CategoryUpdateModal);
export default CategoryUpdateModal;
