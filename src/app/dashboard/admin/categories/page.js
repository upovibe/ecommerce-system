import App from "@/core/App.js";
import "@/components/ui/Button.js";
import "@/components/ui/Modal.js";
import "@/components/ui/Toast.js";
import "@/components/ui/Input.js";
import api from "@/services/api.js";

class CategoriesPage extends App {
  constructor() {
    super();
    this.categories = [];
    this.loading = true;
  }

  async connectedCallback() {
    super.connectedCallback();
    await this.loadCategories();
  }

  async loadCategories() {
    this.loading = true;
    this.render();
    try {
      const res = await api.get("/categories");
      this.categories = res.data.data || [];
    } catch (e) {
      Toast.show({
        title: "Error",
        message: "Failed to load categories",
        variant: "error",
      });
    }
    this.loading = false;
    this.render();
  }

  getImageUrl(path) {
    if (!path) return "";
    if (path.startsWith("http")) return path;
    return window.location.origin + (path.startsWith("/") ? "" : "/") + path;
  }

  showCreateDialog() {
    this._showCategoryDialog(null);
  }

  showEditDialog(id) {
    const category = this.categories.find((c) => c.id == id);
    if (category) this._showCategoryDialog(category);
  }

  _showCategoryDialog(category) {
    const isEdit = !!category;
    const modal = document.createElement("ui-modal");
    modal.setAttribute("title", isEdit ? "Edit Category" : "New Category");
    modal.setAttribute("position", "right");
    modal.setAttribute("size", "md");
    modal.setAttribute("open", "");
    modal.setAttribute(
      "confirm-label",
      isEdit ? "Save Changes" : "Create Category",
    );

    modal.innerHTML = `
      <form class="space-y-5">
        <div>
          <label class="block text-xs font-bold text-slate-500 mb-1.5 ml-1">Category Name</label>
          <ui-input id="cat-name" value="${category?.name || ""}" placeholder="e.g. Electronics" class="w-full"></ui-input>
        </div>
        <div>
          <label class="block text-xs font-bold text-slate-500 mb-1.5 ml-1">Description</label>
          <textarea id="cat-desc" placeholder="Describe this category..." rows="3"
            class="w-full border border-slate-300 rounded-xl px-3 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-200 resize-none font-brand">${category?.description || ""}</textarea>
        </div>
        <div>
          <label class="block text-xs font-bold text-slate-500 mb-1.5 ml-1">Category Image</label>
          ${
            isEdit && category?.image
              ? `
            <div class="mb-3 relative w-full h-28 rounded-2xl overflow-hidden border border-slate-200">
              <img id="cat-img-preview" src="${this.getImageUrl(category.image)}" class="w-full h-full object-cover" />
            </div>
          `
              : `
            <div id="cat-img-preview-wrap" class="mb-3 hidden">
              <div class="relative w-full h-28 rounded-2xl overflow-hidden border border-slate-200">
                <img id="cat-img-preview" class="w-full h-full object-cover" />
              </div>
            </div>
          `
          }
          <label class="flex items-center gap-3 px-4 py-3 bg-slate-50 border border-dashed border-slate-300 rounded-xl cursor-pointer hover:bg-slate-100 transition-colors">
            <i class="fas fa-image text-slate-400"></i>
            <span id="cat-img-label" class="text-sm text-slate-500 font-medium">Choose an image</span>
            <input id="cat-img-file" type="file" accept="image/*" class="hidden" />
          </label>
        </div>
        <div class="flex items-center gap-3 mt-1">
          <input id="cat-active" type="checkbox" ${category?.is_active !== false ? "checked" : ""} class="w-4 h-4 rounded accent-indigo-500">
          <label for="cat-active" class="text-xs font-bold text-slate-500">Active (visible on storefront)</label>
        </div>
      </form>
    `;

    document.body.appendChild(modal);

    const nameInput = modal.querySelector("#cat-name");
    const descInput = modal.querySelector("#cat-desc");
    const fileInput = modal.querySelector("#cat-img-file");
    const imgLabel = modal.querySelector("#cat-img-label");
    const imgPreviewWrap = modal.querySelector("#cat-img-preview-wrap");
    const imgPreview = modal.querySelector("#cat-img-preview");
    const activeCheck = modal.querySelector("#cat-active");

    // Image preview
    fileInput?.addEventListener("change", (e) => {
      const file = e.target.files[0];
      if (!file) return;
      imgLabel.textContent = file.name;
      const reader = new FileReader();
      reader.onload = (ev) => {
        if (imgPreview) imgPreview.src = ev.target.result;
        if (imgPreviewWrap) imgPreviewWrap.classList.remove("hidden");
      };
      reader.readAsDataURL(file);
    });

    // Validation
    const validate = () => {
      modal.setAttribute(
        "confirm-disabled",
        !nameInput.value.trim() ? "true" : "false",
      );
    };
    nameInput.addEventListener("input", validate);
    validate();

    modal.addEventListener("confirm", async () => {
      if (modal.getAttribute("confirm-disabled") === "true") return;
      modal.setAttribute("confirm-loading", "true");

      try {
        let imageUrl = category?.image || null;

        // If a new file was selected, upload it first (only for edit)
        if (isEdit && fileInput?.files?.[0]) {
          const formData = new FormData();
          formData.append("image", fileInput.files[0]);
          const uploadRes = await api.uploadFile(
            `/categories/${category.id}/upload-image`,
            formData,
          );
          if (uploadRes.data.success) {
            imageUrl = uploadRes.data.image_url;
          }
        }

        const payload = {
          name: nameInput.value.trim(),
          description: descInput.value.trim() || null,
          is_active: activeCheck.checked,
        };

        if (!isEdit) {
          // For new categories, include the image path after create + upload
          const createRes = await api.post("/categories", payload);
          if (createRes.data.success) {
            const newId = createRes.data.data.id;
            // Upload image for newly created category
            if (fileInput?.files?.[0]) {
              const formData = new FormData();
              formData.append("image", fileInput.files[0]);
              await api.uploadFile(
                `/categories/${newId}/upload-image`,
                formData,
              );
            }
          }
        } else {
          await api.put(`/categories/${category.id}`, {
            ...payload,
            image: imageUrl,
          });
        }

        modal.remove();
        Toast.show({
          title: "Success",
          message: isEdit ? "Category updated." : "Category created.",
          variant: "success",
        });
        await this.loadCategories();
      } catch (e) {
        modal.setAttribute("confirm-loading", "false");
        validate();
        Toast.show({
          title: "Error",
          message: e.response?.data?.error || "Operation failed",
          variant: "error",
        });
      }
    });

    modal.addEventListener("cancel", () => modal.remove());
  }

  async deleteCategory(id) {
    const category = this.categories.find((c) => c.id == id);
    if (!confirm(`Delete "${category?.name}"? This cannot be undone.`)) return;

    try {
      await api.delete(`/categories/${id}`);
      Toast.show({
        title: "Deleted",
        message: "Category removed.",
        variant: "success",
      });
      await this.loadCategories();
    } catch (e) {
      Toast.show({
        title: "Error",
        message: e.response?.data?.error || "Delete failed",
        variant: "error",
      });
    }
  }

  async toggleActive(id) {
    try {
      await api.put(`/categories/${id}/toggle-active`, {});
      await this.loadCategories();
    } catch (e) {
      Toast.show({
        title: "Error",
        message: "Failed to update status",
        variant: "error",
      });
    }
  }

  render() {
    if (this.loading) {
      return `
        <div class="p-10 flex items-center justify-center min-h-[60vh]">
          <div class="text-center">
            <div class="w-12 h-12 border-4 border-indigo-200 border-t-indigo-500 rounded-full animate-spin mx-auto mb-4"></div>
            <p class="text-slate-500 text-sm font-medium">Loading categories...</p>
          </div>
        </div>
      `;
    }

    return `
      <div class="p-6 md:p-10 space-y-8 max-w-7xl mx-auto font-brand text-slate-600">
        <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 class="text-3xl font-black text-slate-900 tracking-tight mb-1">Categories</h1>
            <p class="text-slate-500 text-sm font-medium">Organise your products into browsable groups.</p>
          </div>
          <ui-button color="primary" onclick="this.closest('app-categories-page').showCreateDialog()">
            <i class="fas fa-plus mr-2"></i> New Category
          </ui-button>
        </div>

        ${
          this.categories.length === 0
            ? `
          <div class="bg-white border border-slate-100 rounded-3xl p-16 text-center shadow-sm">
            <div class="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center text-slate-300 mx-auto mb-6">
              <i class="fas fa-layer-group text-3xl"></i>
            </div>
            <h3 class="text-xl font-bold text-slate-900 mb-2">No Categories Yet</h3>
            <p class="text-slate-500 max-w-xs mx-auto mb-8 text-sm">Create your first category to start organising products.</p>
            <ui-button color="primary" onclick="this.closest('app-categories-page').showCreateDialog()">
              <i class="fas fa-plus mr-2"></i> Create First Category
            </ui-button>
          </div>
        `
            : `
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            ${this.categories
              .map(
                (cat) => `
              <div class="bg-white border border-slate-100 rounded-3xl shadow-sm overflow-hidden group hover:shadow-md transition-shadow">
                <div class="relative h-40 bg-gradient-to-br from-slate-50 to-slate-100 overflow-hidden">
                  ${
                    cat.image
                      ? `<img src="${this.getImageUrl(cat.image)}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />`
                      : `<div class="w-full h-full flex items-center justify-center">
                        <i class="fas fa-layer-group text-4xl text-slate-200"></i>
                       </div>`
                  }
                  <div class="absolute top-3 right-3">
                    <span class="px-2.5 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider ${cat.is_active ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"}">
                      ${cat.is_active ? "Active" : "Hidden"}
                    </span>
                  </div>
                </div>
                <div class="p-5">
                  <h3 class="font-black text-slate-900 text-base mb-1">${cat.name}</h3>
                  <p class="text-xs text-slate-400 mb-4 line-clamp-2">${cat.description || '<span class="italic">No description</span>'}</p>
                  <div class="flex items-center gap-2">
                    <ui-button variant="outline" size="sm" color="primary" onclick="this.closest('app-categories-page').showEditDialog(${cat.id})">
                      <i class="fas fa-edit mr-1"></i> Edit
                    </ui-button>
                    <ui-button variant="outline" size="sm" color="${cat.is_active ? "warning" : "success"}" onclick="this.closest('app-categories-page').toggleActive(${cat.id})">
                      <i class="fas fa-${cat.is_active ? "eye-slash" : "eye"} mr-1"></i> ${cat.is_active ? "Hide" : "Show"}
                    </ui-button>
                    <ui-button variant="outline" size="sm" color="danger" onclick="this.closest('app-categories-page').deleteCategory(${cat.id})">
                      <i class="fas fa-trash"></i>
                    </ui-button>
                  </div>
                </div>
              </div>
            `,
              )
              .join("")}
          </div>
        `
        }
      </div>
    `;
  }
}

customElements.define("app-categories-page", CategoriesPage);
export default CategoriesPage;
