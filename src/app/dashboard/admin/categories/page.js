import App from "@/core/App.js";
import "@/components/ui/Button.js";
import "@/components/ui/Modal.js";
import "@/components/ui/Toast.js";
import "@/components/ui/Input.js";
import "@/components/ui/Table.js";
import "@/components/ui/Tabs.js";
import "@/components/ui/Dropdown.js";
import "@/components/ui/Switch.js";
import "@/components/ui/FileUpload.js";
import api from "@/services/api.js";

class CategoriesPage extends App {
  constructor() {
    super();
    this.categories = [];
    this.loading = true;
    this._isInitialized = false;
    this._onTableAdd = () => this.showCreateDialog();
    this._onTableRefresh = () => this.loadCategories();
    this._onTableEdit = (event) => {
      const id = event?.detail?.row?.id;
      if (id != null) this.showEditDialog(id);
    };
    this._onTableDelete = (event) => {
      const id = event?.detail?.row?.id;
      if (id != null) this.deleteCategory(id);
    };
    this._onTableCustomAction = (event) => {
      const id = event?.detail?.row?.id;
      const actionName = event?.detail?.actionName;
      if (actionName === "toggle-active" && id != null) {
        this.toggleActive(id);
      }
    };
  }

  updateView() {
    this.innerHTML = this.render();
  }

  async connectedCallback() {
    super.connectedCallback();
    if (this._isInitialized) return;
    this._isInitialized = true;

    this.addEventListener("table-add", this._onTableAdd);
    this.addEventListener("table-refresh", this._onTableRefresh);
    this.addEventListener("table-edit", this._onTableEdit);
    this.addEventListener("table-delete", this._onTableDelete);
    this.addEventListener("table-custom-action", this._onTableCustomAction);
    await this.loadCategories();
  }

  async loadCategories() {
    this.loading = true;
    this.updateView();
    try {
      const res = await api.get("/categories", { timeout: 10000 });
      const categoryData = res?.data?.data;
      this.categories = Array.isArray(categoryData) ? categoryData : [];
    } catch (e) {
      if (window.Toast?.show) {
        window.Toast.show({
          title: "Error",
          message: "Failed to load categories",
          variant: "error",
        });
      } else {
        console.error("Failed to load categories", e);
      }
    } finally {
      this.loading = false;
      this.updateView();
    }
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
    const parentOptions = (this.categories || [])
      .filter((c) => !c.parent_id && (!isEdit || c.id !== category.id))
      .map(
        (c) => `<ui-option value="${c.id}">${c.name}</ui-option>`,
      )
      .join("");

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
          <label class="block text-xs font-bold text-slate-500 mb-1.5 ml-1">Parent Category</label>
          <ui-dropdown id="cat-parent" placeholder="None (Main category)" class="w-full">
            <ui-option value="">None (Main category)</ui-option>
            ${parentOptions}
          </ui-dropdown>
        </div>
        <div>
          <label class="block text-xs font-bold text-slate-500 mb-1.5 ml-1">Description</label>
          <textarea id="cat-desc" placeholder="Describe this category..." rows="3"
            class="w-full border border-slate-300 rounded-xl px-3 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-200 resize-none font-brand">${category?.description || ""}</textarea>
        </div>
        <div>
          <label class="block text-xs font-bold text-slate-500 mb-1.5 ml-1">Category Image</label>
          <ui-file-upload
            id="cat-img-file"
            data-field="cat-image"
            accept="image/*"
            max-size="5242880"
            max-files="1"
            ${isEdit && category?.image ? `value="${category.image}"` : ""}
            class="w-full">
          </ui-file-upload>
        </div>
        <div class="pt-1">
          <ui-switch name="is_active" id="cat-active" ${category?.is_active !== false ? "checked" : ""}>
            <span slot="label">Active (visible on storefront)</span>
          </ui-switch>
        </div>
      </form>
    `;

    document.body.appendChild(modal);

    const nameInput = modal.querySelector("#cat-name");
    const parentInput = modal.querySelector("#cat-parent");
    const descInput = modal.querySelector("#cat-desc");
    const fileInput = modal.querySelector('ui-file-upload[data-field="cat-image"]');
    const activeCheck = modal.querySelector("#cat-active");

    if (parentInput && isEdit && category?.parent_id) {
      setTimeout(() => {
        parentInput.value = String(category.parent_id);
      }, 0);
    }

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
        const selectedFiles = fileInput?.getFiles?.() || [];
        const newImageFile = selectedFiles.find((f) => f instanceof File);

        // If a new file was selected, upload it first (only for edit)
        if (isEdit && newImageFile) {
          const formData = new FormData();
          formData.append("image", newImageFile);
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
          parent_id: parentInput?.value ? Number(parentInput.value) : null,
          is_active: activeCheck?.checked ? true : false,
        };

        if (!isEdit) {
          // For new categories, include the image path after create + upload
          const createRes = await api.post("/categories", payload);
          if (createRes.data.success) {
            const newId = createRes.data.data.id;
            // Upload image for newly created category
            if (newImageFile) {
              const formData = new FormData();
              formData.append("image", newImageFile);
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

    const parentNameById = {};
    (this.categories || []).forEach((cat) => {
      parentNameById[String(cat.id)] = cat.name || "";
    });

    const mainCategories = (this.categories || []).filter((cat) => !cat.parent_id);
    const subCategories = (this.categories || []).filter((cat) => !!cat.parent_id);
    const subCountByParentId = {};
    subCategories.forEach((sub) => {
      const pid = String(sub.parent_id);
      subCountByParentId[pid] = (subCountByParentId[pid] || 0) + 1;
    });

    const buildTableData = (rows, includeParent = false, includeSubCount = false) =>
      rows.map((cat, index) => ({
      id: cat.id,
      no: index + 1,
      image: cat.image
        ? `<img src="${this.getImageUrl(cat.image)}" alt="${cat.name || "Category"}" class="w-10 h-10 rounded-lg object-cover border border-slate-200" />`
        : `<div class="w-10 h-10 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400"><i class="fas fa-image text-xs"></i></div>`,
      name: cat.name || "",
      ...(includeSubCount
        ? { subcategories: subCountByParentId[String(cat.id)] || 0 }
        : {}),
      ...(includeParent
        ? { parent: parentNameById[String(cat.parent_id)] || `#${cat.parent_id}` }
        : {}),
      description: cat.description || "No description",
      status: cat.is_active ? "Active" : "Hidden",
      updated: cat.updated_at || "",
    }));

    const buildColumns = (includeParent = false, includeSubCount = false) => [
      { key: "no", label: "No.", html: false },
      { key: "image", label: "Image" },
      { key: "name", label: "Category", html: false },
      ...(includeSubCount
        ? [{ key: "subcategories", label: "Subcategories", html: false }]
        : []),
      ...(includeParent ? [{ key: "parent", label: "Parent", html: false }] : []),
      { key: "description", label: "Description", html: false },
      { key: "status", label: "Status", html: false },
      { key: "updated", label: "Updated", html: false },
    ];

    const customActions = [
      { name: "toggle-active", label: "Toggle status", icon: "fas fa-eye" },
    ];

    const safeMainTableData = JSON.stringify(buildTableData(mainCategories, false, true)).replace(/"/g, "&quot;");
    const safeMainTableColumns = JSON.stringify(buildColumns(false, true)).replace(
      /"/g,
      "&quot;",
    );
    const safeSubTableData = JSON.stringify(buildTableData(subCategories, true)).replace(
      /"/g,
      "&quot;",
    );
    const safeSubTableColumns = JSON.stringify(buildColumns(true)).replace(
      /"/g,
      "&quot;",
    );
    const safeCustomActions = JSON.stringify(customActions).replace(
      /"/g,
      "&quot;",
    );

    return `
      <div class="px-6 md:px-10 pb-8 space-y-6 max-w-7xl mx-auto font-brand text-slate-600">
        <style>
          app-categories-page .category-table-wrap .upo-table-title {
            display: none;
          }
        </style>
        <div class="category-table-wrap bg-white border border-slate-100 rounded-3xl p-4 shadow-sm">
          <ui-tabs>
            <ui-tab-list>
              <ui-tab value="main-categories">Main Categories</ui-tab>
              <ui-tab value="sub-categories">Subcategories</ui-tab>
            </ui-tab-list>

            <ui-tab-panel value="main-categories">
              <ui-table
                title=""
                data="${safeMainTableData}"
                columns="${safeMainTableColumns}"
                custom-actions="${safeCustomActions}"
                sortable
                searchable
                search-placeholder="Search main categories..."
                pagination
                page-size="25"
                action
                actions="edit,delete"
                addable
                refresh
                bordered
                striped
                class="w-full">
              </ui-table>
            </ui-tab-panel>

            <ui-tab-panel value="sub-categories">
              <ui-table
                title=""
                data="${safeSubTableData}"
                columns="${safeSubTableColumns}"
                custom-actions="${safeCustomActions}"
                sortable
                searchable
                search-placeholder="Search subcategories..."
                pagination
                page-size="25"
                action
                actions="edit,delete"
                addable
                refresh
                bordered
                striped
                class="w-full">
              </ui-table>
            </ui-tab-panel>
          </ui-tabs>
        </div>
      </div>
    `;
  }
}

customElements.define("app-categories-page", CategoriesPage);
export default CategoriesPage;
