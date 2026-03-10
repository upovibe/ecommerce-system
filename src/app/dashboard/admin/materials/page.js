import App from "@/core/App.js";
import "@/components/ui/Button.js";
import "@/components/ui/Table.js";
import "@/components/ui/Skeleton.js";
import "@/components/ui/Toast.js";
import "@/components/layout/adminLayout/MaterialSettingsModal.js";
import "@/components/layout/adminLayout/MaterialUpdateModal.js";
import "@/components/layout/adminLayout/MaterialViewModal.js";
import "@/components/layout/adminLayout/MaterialDeleteDialog.js";
import api from "@/services/api.js";

let materialsCache = null;
let materialsCacheTime = 0;
let materialsFetchPromise = null;
const MATERIALS_CACHE_TTL_MS = 30000;

class MaterialsPage extends App {
  constructor() {
    super();
    this.materials = [];
    this.loading = true;
    this._lastRendered = "";
    this._loadingPromise = null;
    this._isInitialized = false;

    this._onTableAdd = () => this.showCreateDialog();
    this._onTableRefresh = () => this.loadMaterials(true);
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
      if (id != null) this.deleteMaterial(id);
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

    this.addEventListener("material-saved", async () => {
      materialsCache = null;
      await this.loadMaterials(true);
    });
    this.addEventListener("material-updated", async () => {
      materialsCache = null;
      await this.loadMaterials(true);
    });
    this.addEventListener("material-deleted", async () => {
      materialsCache = null;
      await this.loadMaterials(true);
    });

    await this.loadMaterials();
  }

  async loadMaterials(force = false) {
    const hasFreshCache =
      !force &&
      Array.isArray(materialsCache) &&
      Date.now() - materialsCacheTime < MATERIALS_CACHE_TTL_MS;

    if (hasFreshCache) {
      this.materials = materialsCache;
      this.loading = false;
      this.updateView();
      return Promise.resolve(this.materials);
    }

    if (this._loadingPromise) return this._loadingPromise;

    if (!this.loading) {
      this.loading = true;
      this.updateView();
    }

    this._loadingPromise = (async () => {
      try {
        if (!materialsFetchPromise || force) {
          materialsFetchPromise = api.get("/materials", { timeout: 10000 });
        }

        const res = await materialsFetchPromise;
        const data = res?.data?.data;
        this.materials = Array.isArray(data) ? data : [];
        materialsCache = this.materials;
        materialsCacheTime = Date.now();
      } catch (e) {
        if (window.Toast?.show) {
          window.Toast.show({
            title: "Error",
            message: "Failed to load materials",
            variant: "error",
          });
        } else {
          console.error("Failed to load materials", e);
        }
      } finally {
        materialsFetchPromise = null;
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

    if (path.startsWith("uploads/")) {
      return `${baseUrl}/api/${path}`;
    }

    if (!path.includes("/")) {
      return `${baseUrl}/api/uploads/materials/${path}`;
    }

    return `${baseUrl}/api/${path}`;
  }

  showCreateDialog() {
    const addModal = this.querySelector("material-settings-modal");
    if (addModal) addModal.open();
  }

  showEditDialog(id) {
    const material = this.materials.find((c) => c.id == id);
    const updateModal = this.querySelector("material-update-modal");
    if (material && updateModal) {
      updateModal.setMaterialData(material);
      updateModal.open();
    }
  }

  showViewDialog(id) {
    const material = this.materials.find((c) => c.id == id);
    const viewModal = this.querySelector("material-view-modal");
    if (material && viewModal) {
      viewModal.setMaterialData(material);
      viewModal.open();
    }
  }

  async deleteMaterial(id) {
    const material = this.materials.find((c) => c.id == id);
    const deleteDialog = this.querySelector("material-delete-dialog");
    if (material && deleteDialog) {
      deleteDialog.setMaterialData(material);
      deleteDialog.open();
    }
  }

  getHeaderCounts() {
    const materials = this.materials || [];
    const total = materials.length;
    const active = materials.filter((c) => !!c.is_active).length;
    const hidden = total - active;
    return { total, active, hidden };
  }

  renderHeader() {
    const c = this.getHeaderCounts();
    return `
      <div class="space-y-8 mb-4">
        <div class="bg-slate-700 rounded-xl shadow-lg p-5 text-white">
          <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6">
            <div>
              <div class="flex items-center gap-2">
                <h1 class="text-2xl sm:text-3xl font-bold">Materials</h1>
                <button
                  onclick="this.closest('app-materials-page').loadMaterials(true)"
                  class="size-8 mt-2 flex items-center justify-center text-white/90 hover:text-white transition-colors duration-200 hover:bg-white/10 rounded-lg group"
                  title="Refresh data">
                  <i class="fas fa-sync-alt text-lg ${this.loading ? "animate-spin" : ""} group-hover:scale-110 transition-transform duration-200"></i>
                </button>
              </div>
              <p class="text-blue-100 text-base sm:text-lg">Manage product materials</p>
            </div>
            <div class="mt-4 sm:mt-0">
              <div class="text-right">
                <div class="text-xl sm:text-2xl font-bold">${c.total}</div>
                <div class="text-blue-100 text-xs sm:text-sm">Total Materials</div>
              </div>
            </div>
          </div>
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
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

    const tableData = (this.materials || []).map((material, index) => ({
      id: material.id,
      no: index + 1,
      image: material.image
        ? `<img src="${this.getImageUrl(material.image)}" alt="${material.name || "Material"}" class="w-10 h-10 rounded-lg object-cover border border-slate-200" />`
        : `<div class="w-10 h-10 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400"><i class="fas fa-image text-xs"></i></div>`,
      name: material.name || "",
      description: material.description
        ? material.description.length > 60
          ? material.description.slice(0, 60) + "..."
          : material.description
        : "—",
      status: material.is_active ? "Active" : "Hidden",
      updated: material.updated_at || "",
    }));

    const columns = [
      { key: "no", label: "No.", html: false },
      { key: "image", label: "Image" },
      { key: "name", label: "Material", html: false },
      { key: "description", label: "Description", html: false },
      { key: "status", label: "Status", html: false },
      { key: "updated", label: "Updated", html: false },
    ];

    const safeData = JSON.stringify(tableData).replace(/"/g, "&quot;");
    const safeCols = JSON.stringify(columns).replace(/"/g, "&quot;");

    return `
      ${this.renderHeader()}
      <div class="bg-white rounded-lg shadow-lg p-4">
        <div class="mt-4 overflow-x-auto">
          <ui-table
            title=""
            data="${safeData}"
            columns="${safeCols}"
            sortable
            searchable
            search-placeholder="Search materials..."
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
      </div>

      <material-settings-modal></material-settings-modal>
      <material-update-modal></material-update-modal>
      <material-view-modal></material-view-modal>
      <material-delete-dialog></material-delete-dialog>
    `;
  }
}

customElements.define("app-materials-page", MaterialsPage);
export default MaterialsPage;

