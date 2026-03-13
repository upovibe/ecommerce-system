import App from "@/core/App.js";
import "@/components/ui/Button.js";
import "@/components/ui/Table.js";
import "@/components/ui/Skeleton.js";
import "@/components/ui/Toast.js";
import "@/components/layout/adminLayout/PageViewModal.js";
import "@/components/layout/adminLayout/PageSettingsModal.js";
import "@/components/layout/adminLayout/PageUpdateModal.js";
import "@/components/layout/adminLayout/PageDeleteDialog.js";
import api from "@/services/api.js";

class CloudPagesPage extends App {
  constructor() {
    super();
    this.pages = [];
    this.loading = true;
    this._lastRendered = "";

    this._onTableAdd = () => this.showCreate();
    this._onTableRefresh = () => this.loadPages(true);
    this._onTableEdit = (e) => {
      if (e?.detail?.row?.id != null) this.showEdit(e.detail.row);
    };
    this._onTableDelete = (e) => {
      if (e?.detail?.row?.id != null) this.showDelete(e.detail.row);
    };
    this._onTableView = (e) => {
      if (e?.detail?.row?.id != null) this.showView(e.detail.row);
    };

    this._onPageDataChanged = () => this.loadPages(true);
  }

  updateView() {
    const next = this.render();
    if (next === this._lastRendered) return;
    this._lastRendered = next;
    this.innerHTML = next;
  }

  async connectedCallback() {
    super.connectedCallback();
    document.title = "Cloud Pages Management";

    this.addEventListener("table-add", this._onTableAdd);
    this.addEventListener("table-refresh", this._onTableRefresh);
    this.addEventListener("table-edit", this._onTableEdit);
    this.addEventListener("table-delete", this._onTableDelete);
    this.addEventListener("table-view", this._onTableView);

    this.addEventListener("page-saved", this._onPageDataChanged);
    this.addEventListener("page-updated", this._onPageDataChanged);
    this.addEventListener("page-deleted", this._onPageDataChanged);

    await this.loadPages();
  }

  async loadPages(force = false) {
    this.loading = true;
    this.updateView();
    try {
      const res = await api.get("/pages");
      const data = res?.data?.data ?? res?.data ?? [];
      this.pages = Array.isArray(data) ? data : [];
    } catch (e) {
      Toast.show({
        title: "Error",
        message: "Failed to load pages",
        variant: "error",
      });
    } finally {
      this.loading = false;
      this.updateView();
    }
  }

  showCreate() {
    const modal = this.querySelector("page-settings-modal");
    if (modal) modal.open();
  }

  showEdit(row) {
    const original = this.pages.find((p) => p.id === row.id);
    const modal = this.querySelector("page-update-modal");
    if (modal) {
      modal.open(original || row);
    }
  }

  showDelete(row) {
    const original = this.pages.find((p) => p.id === row.id);
    const dialog = this.querySelector("page-delete-dialog");
    if (dialog) {
      dialog.setPageData(original || row);
      dialog.open();
    }
  }

  showView(row) {
    const original = this.pages.find((p) => p.id === row.id);
    const modal = this.querySelector("page-view-modal");
    if (modal) {
      modal.setPageData(original || row);
      modal.open();
    }
  }

  getHeaderCounts() {
    const pages = this.pages || [];
    const total = pages.length;
    const active = pages.filter((p) => Number(p.is_active) === 1).length;
    const draft = total - active;
    return { total, active, draft };
  }

  getContentPreview(content) {
    if (!content) return "-";
    const plain = String(content)
      .replace(/<[^>]*>/g, " ")
      .replace(/\s+/g, " ")
      .trim();
    if (!plain) return "-";
    return plain.length > 90 ? `${plain.slice(0, 90)}...` : plain;
  }

  renderHeader() {
    const c = this.getHeaderCounts();
    return `
      <div class="space-y-8 mb-4">
        <div class="bg-slate-700 rounded-xl shadow-lg p-5 text-white">
          <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6">
            <div>
              <div class="flex items-center gap-2">
                <h1 class="text-2xl sm:text-3xl font-bold">Cloud Pages</h1>
                <button
                  onclick="this.closest('app-cloud-pages-page').loadPages(true)"
                  class="size-8 mt-2 flex items-center justify-center text-white/90 hover:text-white transition-colors duration-200 hover:bg-white/10 rounded-lg group"
                  title="Refresh">
                  <i class="fas fa-sync-alt text-lg ${this.loading ? "animate-spin" : ""} group-hover:scale-110 transition-transform duration-200"></i>
                </button>
              </div>
              <p class="text-blue-100 text-base sm:text-lg opacity-80">Manage application content and static pages</p>
            </div>
            <div class="mt-4 sm:mt-0 text-right">
              <div class="text-xl sm:text-2xl font-bold font-brand tracking-tighter">${c.total}</div>
              <div class="text-blue-100 text-xs sm:text-sm">Total Pages</div>
            </div>
          </div>
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-4 sm:gap-6">
            <div class="bg-white bg-opacity-10 backdrop-blur-sm rounded-lg p-4 sm:p-5 border border-white border-opacity-10 shadow-inner">
              <div class="flex items-center">
                <div class="size-10 flex items-center justify-center bg-emerald-500 rounded-lg mr-3 shadow-lg">
                  <i class="fas fa-eye text-white text-lg"></i>
                </div>
                <div class="min-w-0 flex-1">
                  <div class="text-xl sm:text-2xl font-bold">${c.active}</div>
                  <div class="text-blue-100 text-xs sm:text-sm">Live</div>
                </div>
              </div>
            </div>
            <div class="bg-white bg-opacity-10 backdrop-blur-sm rounded-lg p-4 sm:p-5 border border-white border-opacity-10 shadow-inner">
              <div class="flex items-center">
                <div class="size-10 flex items-center justify-center bg-amber-500 rounded-lg mr-3 shadow-lg">
                  <i class="fas fa-file-signature text-white text-lg"></i>
                </div>
                <div class="min-w-0 flex-1">
                  <div class="text-xl sm:text-2xl font-bold">${c.draft}</div>
                  <div class="text-blue-100 text-xs sm:text-sm">Drafts</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  render() {
    if (this.loading && this.pages.length === 0) {
      return `
        ${this.renderHeader()}
        <div class="bg-white rounded-2xl shadow-sm p-4 animate-pulse">
          <div class="h-12 w-32 bg-slate-100 rounded-lg mb-4"></div>
          <div class="space-y-4">
            <div class="h-12 bg-slate-50 rounded-lg"></div>
            <div class="h-48 bg-slate-50 rounded-lg"></div>
          </div>
        </div>
      `;
    }

    const tableData = (this.pages || []).map((p, i) => ({
      id: p.id,
      no: i + 1,
      name: p.name || "-",
      title: p.title || "Untitled",
      subtitle: p.subtitle || "-",
      slug: `/${p.slug || ""}`,
      content: this.getContentPreview(p.content),
      status: Number(p.is_active) === 1 ? "Live" : "Draft",
      updated: p.updated_at ? new Date(p.updated_at).toLocaleDateString() : "-",
    }));

    const columns = [
      { key: "no", label: "No.", html: false },
      { key: "name", label: "Name", html: false },
      { key: "title", label: "Title", html: false },
      { key: "subtitle", label: "Subtitle", html: false },
      { key: "slug", label: "URL Path", html: false },
      { key: "content", label: "Content", html: false },
      { key: "status", label: "Status", html: false },
      { key: "updated", label: "Updated", html: false },
    ];

    const safeData = JSON.stringify(tableData).replace(/"/g, "&quot;");
    const safeCols = JSON.stringify(columns).replace(/"/g, "&quot;");

    return `
      ${this.renderHeader()}
      <div class="bg-white rounded-2xl shadow-sm p-4 border border-slate-100">
        <div class="mt-2 overflow-x-auto">
          <ui-table
            title=""
            data="${safeData}"
            columns="${safeCols}"
            sortable
            searchable
            search-placeholder="Search by name, title, or path..."
            pagination
            page-size="15"
            action
            actions="view,edit"
            refresh
            print
            bordered
            striped
            class="w-full">
          </ui-table>
        </div>
      </div>
      
      <page-view-modal></page-view-modal>
      <page-settings-modal></page-settings-modal>
      <page-update-modal></page-update-modal>
      <page-delete-dialog></page-delete-dialog>
    `;
  }
}

customElements.define("app-cloud-pages-page", CloudPagesPage);
export default CloudPagesPage;
