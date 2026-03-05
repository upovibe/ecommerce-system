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
import "@/components/ui/Skeleton.js";
import "@/components/layout/adminLayout/CategorySettingsModal.js";
import "@/components/layout/adminLayout/CategoryUpdateModal.js";
import "@/components/layout/adminLayout/CategoryViewModal.js";
import "@/components/layout/adminLayout/CategoryDeleteDialog.js";
import api from "@/services/api.js";

let categoriesCache = null;
let categoriesCacheTime = 0;
let categoriesFetchPromise = null;
const CATEGORIES_CACHE_TTL_MS = 30000;

class CategoriesPage extends App {
  constructor() {
    super();
    this.categories = [];
    this.loading = true;
    this._loadingPromise = null;
    this._isInitialized = false;
    this._onTableAdd = () => this.showCreateDialog();
    this._onTableRefresh = () => this.loadCategories(true);
    this._onTableEdit = (event) => {
      const id = event?.detail?.row?.id;
      if (id != null) this.showEditDialog(id);
    };
    this._onTableView = (event) => {
      const id = event?.detail?.row?.id;
      if (id != null) this.showViewDialog(id);
    };
    this._onTableDelete = (event) => {
      const id = event?.detail?.row?.id;
      if (id != null) this.deleteCategory(id);
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
    this.addEventListener("table-view", this._onTableView);
    this.addEventListener("table-delete", this._onTableDelete);
    this.addEventListener("category-saved", async () => {
      categoriesCache = null;
      await this.loadCategories(true);
    });
    this.addEventListener("category-updated", async () => {
      categoriesCache = null;
      await this.loadCategories(true);
    });
    this.addEventListener("category-deleted", async () => {
      categoriesCache = null;
      await this.loadCategories(true);
    });
    await this.loadCategories();
  }

  async loadCategories(force = false) {
    const hasFreshCache =
      !force &&
      Array.isArray(categoriesCache) &&
      Date.now() - categoriesCacheTime < CATEGORIES_CACHE_TTL_MS;

    if (hasFreshCache) {
      this.categories = categoriesCache;
      this.loading = false;
      this.updateView();
      return Promise.resolve(this.categories);
    }

    if (this._loadingPromise) {
      return this._loadingPromise;
    }

    this.loading = true;
    this.updateView();
    this._loadingPromise = (async () => {
      try {
        if (!categoriesFetchPromise || force) {
          categoriesFetchPromise = api.get("/categories", { timeout: 10000 });
        }

        const res = await categoriesFetchPromise;
        const categoryData = res?.data?.data;
        this.categories = Array.isArray(categoryData) ? categoryData : [];
        categoriesCache = this.categories;
        categoriesCacheTime = Date.now();
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
        categoriesFetchPromise = null;
        this.loading = false;
        this._loadingPromise = null;
        this.updateView();
      }
    })();

    return this._loadingPromise;
  }

  getImageUrl(path) {
    if (!path) return "";
    if (path.startsWith("http://") || path.startsWith("https://") || path.startsWith("data:")) {
      return path;
    }

    const baseUrl = window.location.origin;
    if (path.startsWith("/")) {
      return baseUrl + path;
    }

    // Uploaded files are served from the web root /uploads path.
    if (path.startsWith("uploads/")) {
      return `${baseUrl}/${path}`;
    }

    // Category uploads may occasionally store only filename.
    if (!path.includes("/")) {
      return `${baseUrl}/uploads/categories/${path}`;
    }

    // Fallback for non-upload relative API paths.
    return `${baseUrl}/api/${path}`;
  }

  showCreateDialog() {
    const addModal = this.querySelector("category-settings-modal");
    if (addModal) {
      addModal.setCategories(this.categories);
      addModal.open();
    }
  }

  showEditDialog(id) {
    const category = this.categories.find((c) => c.id == id);
    const updateModal = this.querySelector("category-update-modal");
    if (category && updateModal) {
      updateModal.setCategories(this.categories);
      updateModal.setCategoryData(category);
      updateModal.open();
    }
  }

  showViewDialog(id) {
    const category = this.categories.find((c) => c.id == id);
    const viewModal = this.querySelector("category-view-modal");
    if (category && viewModal) {
      viewModal.setCategoryData(category);
      viewModal.open();
    }
  }

  async deleteCategory(id) {
    const category = this.categories.find((c) => c.id == id);
    const deleteDialog = this.querySelector("category-delete-dialog");
    if (category && deleteDialog) {
      deleteDialog.setCategoryData(category);
      deleteDialog.open();
    }
  }

  async toggleActive(id) {
    try {
      await api.put(`/categories/${id}/toggle-active`, {});
      categoriesCache = null;
      await this.loadCategories(true);
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
        <div class="px-6 md:px-10 pb-8 space-y-6 max-w-7xl mx-auto font-brand text-slate-600">
          <div class="bg-white border border-slate-100 rounded-3xl p-4 shadow-sm space-y-3">
            <ui-skeleton class="h-10 w-80 rounded-lg"></ui-skeleton>
            <ui-skeleton class="h-24 w-full rounded-xl"></ui-skeleton>
            <ui-skeleton class="h-24 w-full rounded-xl"></ui-skeleton>
            <ui-skeleton class="h-24 w-full rounded-xl"></ui-skeleton>
          </div>
        </div>
      `;
    }

    const parentNameById = {};
    (this.categories || []).forEach((cat) => {
      parentNameById[String(cat.id)] = cat.name || "";
    });

    const mainCategories = (this.categories || []).filter(
      (cat) => !cat.parent_id,
    );
    const subCategories = (this.categories || []).filter(
      (cat) => !!cat.parent_id,
    );
    const subCountByParentId = {};
    subCategories.forEach((sub) => {
      const pid = String(sub.parent_id);
      subCountByParentId[pid] = (subCountByParentId[pid] || 0) + 1;
    });

    const buildTableData = (
      rows,
      includeParent = false,
      includeSubCount = false,
    ) =>
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
          ? {
              parent:
                parentNameById[String(cat.parent_id)] || `#${cat.parent_id}`,
            }
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
      ...(includeParent
        ? [{ key: "parent", label: "Parent", html: false }]
        : []),
      { key: "description", label: "Description", html: false },
      { key: "status", label: "Status", html: false },
      { key: "updated", label: "Updated", html: false },
    ];

    const safeMainTableData = JSON.stringify(
      buildTableData(mainCategories, false, true),
    ).replace(/"/g, "&quot;");
    const safeMainTableColumns = JSON.stringify(
      buildColumns(false, true),
    ).replace(/"/g, "&quot;");
    const safeSubTableData = JSON.stringify(
      buildTableData(subCategories, true),
    ).replace(/"/g, "&quot;");
    const safeSubTableColumns = JSON.stringify(buildColumns(true)).replace(
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
                sortable
                searchable
                search-placeholder="Search main categories..."
                pagination
                page-size="25"
                action
                actions="view,edit,delete"
                addable
                refresh
                class="w-full">
              </ui-table>
            </ui-tab-panel>

            <ui-tab-panel value="sub-categories">
              <ui-table
                title=""
                data="${safeSubTableData}"
                columns="${safeSubTableColumns}"
                sortable
                searchable
                search-placeholder="Search subcategories..."
                pagination
                page-size="25"
                action
                actions="view,edit,delete"
                addable
                refresh
                class="w-full">
              </ui-table>
            </ui-tab-panel>
          </ui-tabs>
        </div>

        <category-settings-modal></category-settings-modal>
        <category-update-modal></category-update-modal>
        <category-view-modal></category-view-modal>
        <category-delete-dialog></category-delete-dialog>
      </div>
    `;
  }
}

customElements.define("app-categories-page", CategoriesPage);
export default CategoriesPage;
