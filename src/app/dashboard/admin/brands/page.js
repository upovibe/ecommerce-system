import App from "@/core/App.js";
import "@/components/ui/Button.js";
import "@/components/ui/Table.js";
import "@/components/ui/Skeleton.js";
import "@/components/ui/Toast.js";
import "@/components/layout/adminLayout/BrandSettingsModal.js";
import "@/components/layout/adminLayout/BrandUpdateModal.js";
import "@/components/layout/adminLayout/BrandViewModal.js";
import "@/components/layout/adminLayout/BrandDeleteDialog.js";
import api from "@/services/api.js";

let brandsCache = null;
let brandsCacheTime = 0;
let brandsFetchPromise = null;
const BRANDS_CACHE_TTL_MS = 30000;

class BrandsPage extends App {
  constructor() {
    super();
    this.brands = [];
    this.loading = true;
    this._lastRendered = "";
    this._loadingPromise = null;
    this._isInitialized = false;

    this._onTableAdd = () => this.showCreateDialog();
    this._onTableRefresh = () => this.loadBrands(true);
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
      if (id != null) this.deleteBrand(id);
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

    this.addEventListener("brand-saved", async () => {
      brandsCache = null;
      await this.loadBrands(true);
    });
    this.addEventListener("brand-updated", async () => {
      brandsCache = null;
      await this.loadBrands(true);
    });
    this.addEventListener("brand-deleted", async () => {
      brandsCache = null;
      await this.loadBrands(true);
    });

    await this.loadBrands();
  }

  async loadBrands(force = false) {
    const hasFreshCache =
      !force &&
      Array.isArray(brandsCache) &&
      Date.now() - brandsCacheTime < BRANDS_CACHE_TTL_MS;

    if (hasFreshCache) {
      this.brands = brandsCache;
      this.loading = false;
      this.updateView();
      return Promise.resolve(this.brands);
    }

    if (this._loadingPromise) return this._loadingPromise;

    if (!this.loading) {
      this.loading = true;
      this.updateView();
    }

    this._loadingPromise = (async () => {
      try {
        if (!brandsFetchPromise || force) {
          brandsFetchPromise = api.get("/brands", { timeout: 10000 });
        }

        const res = await brandsFetchPromise;
        const data = res?.data?.data;
        this.brands = Array.isArray(data) ? data : [];
        brandsCache = this.brands;
        brandsCacheTime = Date.now();
      } catch (e) {
        if (window.Toast?.show) {
          window.Toast.show({
            title: "Error",
            message: "Failed to load brands",
            variant: "error",
          });
        } else {
          console.error("Failed to load brands", e);
        }
      } finally {
        brandsFetchPromise = null;
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
      return `${baseUrl}/api/uploads/brands/${path}`;
    }

    return `${baseUrl}/api/${path}`;
  }

  showCreateDialog() {
    const addModal = this.querySelector("brand-settings-modal");
    if (addModal) addModal.open();
  }

  showEditDialog(id) {
    const brand = this.brands.find((c) => c.id == id);
    const updateModal = this.querySelector("brand-update-modal");
    if (brand && updateModal) {
      updateModal.setBrandData(brand);
      updateModal.open();
    }
  }

  showViewDialog(id) {
    const brand = this.brands.find((c) => c.id == id);
    const viewModal = this.querySelector("brand-view-modal");
    if (brand && viewModal) {
      viewModal.setBrandData(brand);
      viewModal.open();
    }
  }

  async deleteBrand(id) {
    const brand = this.brands.find((c) => c.id == id);
    const deleteDialog = this.querySelector("brand-delete-dialog");
    if (brand && deleteDialog) {
      deleteDialog.setBrandData(brand);
      deleteDialog.open();
    }
  }

  getHeaderCounts() {
    const brands = this.brands || [];
    const total = brands.length;
    const active = brands.filter((c) => !!c.is_active).length;
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
                <h1 class="text-2xl sm:text-3xl font-bold">Brands</h1>
                <button
                  onclick="this.closest('app-brands-page').loadBrands(true)"
                  class="size-8 mt-2 flex items-center justify-center text-white/90 hover:text-white transition-colors duration-200 hover:bg-white/10 rounded-lg group"
                  title="Refresh data">
                  <i class="fas fa-sync-alt text-lg ${this.loading ? "animate-spin" : ""} group-hover:scale-110 transition-transform duration-200"></i>
                </button>
              </div>
              <p class="text-blue-100 text-base sm:text-lg">Manage product brands</p>
            </div>
            <div class="mt-4 sm:mt-0">
              <div class="text-right">
                <div class="text-xl sm:text-2xl font-bold">${c.total}</div>
                <div class="text-blue-100 text-xs sm:text-sm">Total Brands</div>
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

    const tableData = (this.brands || []).map((brand, index) => ({
      id: brand.id,
      no: index + 1,
      image: brand.image
        ? `<img src="${this.getImageUrl(brand.image)}" alt="${brand.name || "Brand"}" class="w-10 h-10 rounded-lg object-cover border border-slate-200" />`
        : `<div class="w-10 h-10 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400"><i class="fas fa-image text-xs"></i></div>`,
      name: brand.name || "",
      description: brand.description
        ? brand.description.length > 60
          ? brand.description.slice(0, 60) + "..."
          : brand.description
        : "—",
      status: brand.is_active ? "Active" : "Hidden",
      updated: brand.updated_at || "",
    }));

    const columns = [
      { key: "no", label: "No.", html: false },
      { key: "image", label: "Image" },
      { key: "name", label: "Brand", html: false },
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
            search-placeholder="Search brands..."
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

      <brand-settings-modal></brand-settings-modal>
      <brand-update-modal></brand-update-modal>
      <brand-view-modal></brand-view-modal>
      <brand-delete-dialog></brand-delete-dialog>
    `;
  }
}

customElements.define("app-brands-page", BrandsPage);
export default BrandsPage;

