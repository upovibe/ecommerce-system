import App from "@/core/App.js";
import "@/components/ui/Button.js";
import "@/components/ui/Table.js";
import "@/components/ui/Skeleton.js";
import "@/components/ui/Toast.js";
import "@/components/layout/adminLayout/FaqSettingsModal.js";
import "@/components/layout/adminLayout/FaqUpdateModal.js";
import "@/components/layout/adminLayout/FaqViewModal.js";
import "@/components/layout/adminLayout/FaqDeleteDialog.js";
import api from "@/services/api.js";

class FaqsPage extends App {
  constructor() {
    super();
    this.faqs = [];
    this.loading = true;
    this._lastRendered = "";

    this._onTableAdd = () => this.showCreate();
    this._onTableRefresh = () => this.loadFaqs(true);
    this._onTableEdit = (e) => {
      if (e?.detail?.row?.id != null) this.showEdit(e.detail.row);
    };
    this._onTableDelete = (e) => {
      if (e?.detail?.row?.id != null) this.showDelete(e.detail.row);
    };
    this._onTableView = (e) => {
      if (e?.detail?.row?.id != null) this.showView(e.detail.row);
    };

    this._onFaqChanged = () => this.loadFaqs(true);
  }

  updateView() {
    const next = this.render();
    if (next === this._lastRendered) return;
    this._lastRendered = next;
    this.innerHTML = next;
  }

  async connectedCallback() {
    super.connectedCallback();
    document.title = "FAQs Management";

    this.addEventListener("table-add", this._onTableAdd);
    this.addEventListener("table-refresh", this._onTableRefresh);
    this.addEventListener("table-edit", this._onTableEdit);
    this.addEventListener("table-delete", this._onTableDelete);
    this.addEventListener("table-view", this._onTableView);

    this.addEventListener("faq-saved", this._onFaqChanged);
    this.addEventListener("faq-updated", this._onFaqChanged);
    this.addEventListener("faq-deleted", this._onFaqChanged);

    await this.loadFaqs();
  }

  async loadFaqs(force = false) {
    this.loading = true;
    this.updateView();
    try {
      const res = await api.get("/faqs");
      const data = res?.data?.data ?? res?.data ?? [];
      this.faqs = Array.isArray(data) ? data : [];
    } catch (e) {
      window.Toast?.show?.({
        title: "Error",
        message: "Failed to load FAQs",
        variant: "error",
      });
    } finally {
      this.loading = false;
      this.updateView();
    }
  }

  showCreate() {
    const modal = this.querySelector("faq-settings-modal");
    if (modal) modal.open();
  }

  showEdit(row) {
    const original = this.faqs.find((f) => f.id === row.id);
    const modal = this.querySelector("faq-update-modal");
    if (modal) {
      modal.setFaqData(original || row);
      modal.open();
    }
  }

  showView(row) {
    const original = this.faqs.find((f) => f.id === row.id);
    const modal = this.querySelector("faq-view-modal");
    if (modal) {
      modal.setFaqData(original || row);
      modal.open();
    }
  }

  showDelete(row) {
    const original = this.faqs.find((f) => f.id === row.id);
    const dialog = this.querySelector("faq-delete-dialog");
    if (dialog) {
      dialog.setFaqData(original || row);
      dialog.open();
    }
  }

  getHeaderCounts() {
    const total = (this.faqs || []).length;
    const active = (this.faqs || []).filter((f) => Number(f.is_active) === 1).length;
    const inactive = total - active;
    return { total, active, inactive };
  }

  getPreview(text) {
    if (!text) return "-";
    const clean = String(text).replace(/\s+/g, " ").trim();
    if (!clean) return "-";
    return clean.length > 80 ? `${clean.slice(0, 80)}...` : clean;
  }

  renderHeader() {
    const c = this.getHeaderCounts();
    return `
      <div class="space-y-8 mb-4">
        <div class="bg-slate-700 rounded-xl shadow-lg p-5 text-white">
          <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6">
            <div>
              <div class="flex items-center gap-2">
                <h1 class="text-2xl sm:text-3xl font-bold">FAQs</h1>
                <button
                  onclick="this.closest('app-faqs-page').loadFaqs(true)"
                  class="size-8 mt-2 flex items-center justify-center text-white/90 hover:text-white transition-colors duration-200 hover:bg-white/10 rounded-lg group"
                  title="Refresh">
                  <i class="fas fa-sync-alt text-lg ${this.loading ? "animate-spin" : ""} group-hover:scale-110 transition-transform duration-200"></i>
                </button>
              </div>
              <p class="text-blue-100 text-base sm:text-lg opacity-80">Manage frequently asked questions displayed on the public site</p>
            </div>
            <div class="mt-4 sm:mt-0 text-right">
              <div class="text-xl sm:text-2xl font-bold">${c.total}</div>
              <div class="text-blue-100 text-xs sm:text-sm">Total FAQs</div>
            </div>
          </div>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            <div class="bg-white bg-opacity-10 backdrop-blur-sm rounded-lg p-4 sm:p-5 border border-white border-opacity-10 shadow-inner">
              <div class="flex items-center">
                <div class="size-10 flex items-center justify-center bg-emerald-500 rounded-lg mr-3 shadow-lg">
                  <i class="fas fa-check text-white text-lg"></i>
                </div>
                <div class="min-w-0 flex-1">
                  <div class="text-xl sm:text-2xl font-bold">${c.active}</div>
                  <div class="text-blue-100 text-xs sm:text-sm">Active</div>
                </div>
              </div>
            </div>
            <div class="bg-white bg-opacity-10 backdrop-blur-sm rounded-lg p-4 sm:p-5 border border-white border-opacity-10 shadow-inner">
              <div class="flex items-center">
                <div class="size-10 flex items-center justify-center bg-amber-500 rounded-lg mr-3 shadow-lg">
                  <i class="fas fa-eye-slash text-white text-lg"></i>
                </div>
                <div class="min-w-0 flex-1">
                  <div class="text-xl sm:text-2xl font-bold">${c.inactive}</div>
                  <div class="text-blue-100 text-xs sm:text-sm">Inactive</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  render() {
    if (this.loading && this.faqs.length === 0) {
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

    const tableData = (this.faqs || []).map((f, i) => ({
      id: f.id,
      no: i + 1,
      question: f.question || "-",
      answer: this.getPreview(f.answer),
      status: Number(f.is_active) === 1 ? "Active" : "Inactive",
      order: f.sort_order ?? 0,
      updated: f.updated_at ? new Date(f.updated_at).toLocaleDateString() : "-",
    }));

    const columns = [
      { key: "no", label: "No.", html: false },
      { key: "question", label: "Question", html: false },
      { key: "answer", label: "Answer", html: false },
      { key: "status", label: "Status", html: false },
      { key: "order", label: "Order", html: false },
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
            search-placeholder="Search questions..."
            pagination
            page-size="12"
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
      <faq-settings-modal></faq-settings-modal>
      <faq-update-modal></faq-update-modal>
      <faq-view-modal></faq-view-modal>
      <faq-delete-dialog></faq-delete-dialog>
    `;
  }
}

customElements.define("app-faqs-page", FaqsPage);
export default FaqsPage;
