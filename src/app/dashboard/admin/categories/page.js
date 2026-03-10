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
    this._lastRendered = "";
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
    const next = this.render();
    if (next === this._lastRendered) return;
    this._lastRendered = next;
    this.innerHTML = next;
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

    if (!this.loading) {
      this.loading = true;
      this.updateView();
    }
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
    if (
      path.startsWith("http://") ||
      path.startsWith("https://") ||
      path.startsWith("data:")
    ) {
      return path;
    }

    const baseUrl = window.location.origin;
    if (path.startsWith("/api/")) {
      return baseUrl + path;
    }
    if (path.startsWith("/")) {
      return baseUrl + path;
    }

    // All stored uploads paths (uploads/categories/, uploads/profiles/ etc.)
    // are served via the /api/ route
    if (path.startsWith("uploads/")) {
      return `${baseUrl}/api/${path}`;
    }

    // Category uploads may occasionally store only filename.
    if (!path.includes("/")) {
      return `${baseUrl}/api/uploads/categories/${path}`;
    }

    // Generic fallback
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
      const parent = category.parent_id
        ? this.categories.find((c) => c.id == category.parent_id)
        : null;
      const subCount = (this.categories || []).filter(
        (c) => c.parent_id == category.id,
      ).length;
      viewModal.setCategoryData({
        ...category,
        parent_name: parent?.name || "Main Category",
        sub_count: subCount,
      });
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

  getHeaderCounts() {
    const categories = this.categories || [];
    const total = categories.length;
    const main = categories.filter((c) => !c.parent_id).length;
    const sub = categories.filter((c) => !!c.parent_id).length;
    const active = categories.filter((c) => !!c.is_active).length;
    const hidden = total - active;
    return { total, main, sub, active, hidden };
  }

  renderHeader() {
    const c = this.getHeaderCounts();
    return `
      <div class="space-y-8 mb-4">
        <div class="bg-slate-700 rounded-xl shadow-lg p-5 text-white">
          <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6">
            <div>
              <div class="flex items-center gap-2">
                <h1 class="text-2xl sm:text-3xl font-bold">Categories</h1>
                <button
                  onclick="this.closest('app-categories-page').loadCategories(true)"
                  class="size-8 mt-2 flex items-center justify-center text-white/90 hover:text-white transition-colors duration-200 hover:bg-white/10 rounded-lg group"
                  title="Refresh data">
                  <i class="fas fa-sync-alt text-lg ${this.loading ? "animate-spin" : ""} group-hover:scale-110 transition-transform duration-200"></i>
                </button>
              </div>
              <p class="text-blue-100 text-base sm:text-lg">Manage main and subcategories for products</p>
            </div>
            <div class="mt-4 sm:mt-0">
              <div class="text-right">
                <div class="text-xl sm:text-2xl font-bold">${c.total}</div>
                <div class="text-blue-100 text-xs sm:text-sm">Total Categories</div>
              </div>
            </div>
          </div>
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 sm:gap-6">
            <div class="bg-white bg-opacity-20 backdrop-blur-sm rounded-lg p-4 sm:p-6 border border-white border-opacity-20">
              <div class="flex items-center">
                <div class="size-10 flex items-center justify-center bg-emerald-500 rounded-lg mr-3 sm:mr-4 flex-shrink-0">
                  <i class="fas fa-check text-white text-lg sm:text-xl"></i>
                </div>
                <div class="min-w-0 flex-1">
                  <div class="text-xl sm:text-2xl font-bold">${c.active}</div>
                  <div class="text-blue-100 text-xs sm:text-sm">Active</div>
                </div>
              </div>
            </div>
            <div class="bg-white bg-opacity-20 backdrop-blur-sm rounded-lg p-4 sm:p-6 border border-white border-opacity-20">
              <div class="flex items-center">
                <div class="size-10 flex items-center justify-center bg-yellow-500 rounded-lg mr-3 sm:mr-4 flex-shrink-0">
                  <i class="fas fa-eye-slash text-white text-lg sm:text-xl"></i>
                </div>
                <div class="min-w-0 flex-1">
                  <div class="text-xl sm:text-2xl font-bold">${c.hidden}</div>
                  <div class="text-blue-100 text-xs sm:text-sm">Hidden</div>
                </div>
              </div>
            </div>
            <div class="bg-white bg-opacity-20 backdrop-blur-sm rounded-lg p-4 sm:p-6 border border-white border-opacity-20">
              <div class="flex items-center">
                <div class="size-10 flex items-center justify-center bg-blue-500 rounded-lg mr-3 sm:mr-4 flex-shrink-0">
                  <i class="fas fa-layer-group text-white text-lg sm:text-xl"></i>
                </div>
                <div class="min-w-0 flex-1">
                  <div class="text-xl sm:text-2xl font-bold">${c.main}</div>
                  <div class="text-blue-100 text-xs sm:text-sm">Main</div>
                </div>
              </div>
            </div>
            <div class="bg-white bg-opacity-20 backdrop-blur-sm rounded-lg p-4 sm:p-6 border border-white border-opacity-20">
              <div class="flex items-center">
                <div class="size-10 flex items-center justify-center bg-purple-500 rounded-lg mr-3 sm:mr-4 flex-shrink-0">
                  <i class="fas fa-sitemap text-white text-lg sm:text-xl"></i>
                </div>
                <div class="min-w-0 flex-1">
                  <div class="text-xl sm:text-2xl font-bold">${c.sub}</div>
                  <div class="text-blue-100 text-xs sm:text-sm">Subcategories</div>
                </div>
              </div>
            </div>
            <div class="bg-white bg-opacity-20 backdrop-blur-sm rounded-lg p-4 sm:p-6 border border-white border-opacity-20">
              <div class="flex items-center">
                <div class="size-10 flex items-center justify-center bg-orange-500 rounded-lg mr-3 sm:mr-4 flex-shrink-0">
                  <i class="fas fa-tags text-white text-lg sm:text-xl"></i>
                </div>
                <div class="min-w-0 flex-1">
                  <div class="text-xl sm:text-2xl font-bold">${c.total}</div>
                  <div class="text-blue-100 text-xs sm:text-sm">Total</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  render() {
    if (this.loading) {
      return `
        ${this.renderHeader()}
        <div class="bg-white rounded-lg shadow-lg p-4">
          <div class="space-y-4">
            <ui-skeleton class="h-24 w-full"></ui-skeleton>
            <ui-skeleton class="h-24 w-full"></ui-skeleton>
            <ui-skeleton class="h-24 w-full"></ui-skeleton>
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
        description: cat.description
          ? cat.description.length > 60
            ? cat.description.slice(0, 60) + "…"
            : cat.description
          : "—",
        ...(includeSubCount
          ? { subcategories: subCountByParentId[String(cat.id)] || 0 }
          : {}),
        ...(includeParent
          ? {
              parent:
                parentNameById[String(cat.parent_id)] || `#${cat.parent_id}`,
            }
          : {}),
        status: cat.is_active ? "Active" : "Hidden",
        updated: cat.updated_at || "",
      }));

    const buildColumns = (includeParent = false, includeSubCount = false) => [
      { key: "no", label: "No.", html: false },
      { key: "image", label: "Image" },
      { key: "name", label: "Category", html: false },
      { key: "description", label: "Description", html: false },
      ...(includeSubCount
        ? [{ key: "subcategories", label: "Subcategories", html: false }]
        : []),
      ...(includeParent
        ? [{ key: "parent", label: "Parent", html: false }]
        : []),
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
      ${this.renderHeader()}
      <div class="bg-white rounded-lg shadow-lg p-4">
        <ui-tabs>
          <ui-tab-list>
            <ui-tab value="main-categories">Main Categories</ui-tab>
            <ui-tab value="sub-categories">Subcategories</ui-tab>
          </ui-tab-list>

          <ui-tab-panel value="main-categories">
            <div class="mt-4 overflow-x-auto">
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
                print
                bordered
                striped
                class="w-full">
              </ui-table>
            </div>
          </ui-tab-panel>

          <ui-tab-panel value="sub-categories">
            <div class="mt-4 overflow-x-auto">
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
                print
                bordered
                striped
                class="w-full">
              </ui-table>
            </div>
          </ui-tab-panel>
        </ui-tabs>
      </div>

      <category-settings-modal></category-settings-modal>
      <category-update-modal></category-update-modal>
      <category-view-modal></category-view-modal>
      <category-delete-dialog></category-delete-dialog>
    `;
  }
}

customElements.define("app-categories-page", CategoriesPage);
export default CategoriesPage;
