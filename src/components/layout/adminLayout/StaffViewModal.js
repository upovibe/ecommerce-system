import "@/components/ui/Modal.js";
import "@/components/ui/Avatar.js";

class StaffViewModal extends HTMLElement {
  constructor() {
    super();
    this.staffData = null;
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

  setStaffData(staff) {
    this.staffData = staff || null;
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
    this.addEventListener("cancel", () => this.close());
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
    return path.startsWith("/") ? baseUrl + path : `${baseUrl}/api/${path}`;
  }

  render() {
    const user = this.staffData || {};
    const updatedDate = user.updated_at
      ? new Date(user.updated_at).toLocaleString()
      : user.updated || "-";
    const createdDate = user.created_at
      ? new Date(user.created_at).toLocaleString()
      : user.created || "-";

    this.innerHTML = `
      <ui-modal ${this.hasAttribute("open") ? "open" : ""} position="right" size="md" close-button="true">
        <div slot="title">Staff Member Details</div>
        <div class="space-y-6 text-sm">
          <div class="flex flex-col items-center p-6 bg-slate-50 rounded-2xl border border-slate-100">
            <ui-avatar 
              name="${user.name || "Staff"}" 
              src="${user.profile_image ? this.getImageUrl(user.profile_image) : ""}" 
              size="xl" 
              class="shadow-md mb-4 ring-4 ring-white">
            </ui-avatar>
            <h2 class="text-xl font-bold text-slate-900">${user.name || "Unknown"}</h2>
            <p class="text-slate-500 font-medium">${user.email || "No email"}</p>
            <div class="mt-4 flex gap-2">
              <span class="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-indigo-100 text-indigo-700">
                ${user.role || "Admin"}
              </span>
              <span class="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                user.status === "active" ||
                user.status === "Active" ||
                Number(user.is_active) === 1
                  ? "bg-emerald-100 text-emerald-700"
                  : "bg-slate-200 text-slate-600"
              }">
                ${user.status === "active" || user.status === "Active" || Number(user.is_active) === 1 ? "Active" : "Inactive"}
              </span>
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div class="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <p class="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Full Name</p>
              <p class="mt-1 text-slate-900 font-semibold">${user.name || "-"}</p>
            </div>
            <div class="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <p class="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Email Address</p>
              <p class="mt-1 text-slate-900 font-semibold truncate">${user.email || "-"}</p>
            </div>
            <div class="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <p class="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Role</p>
              <p class="mt-1 text-slate-900 font-semibold capitalize">${user.role || "Staff"}</p>
            </div>
            <div class="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <p class="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Joined Date</p>
              <p class="mt-1 text-slate-800 font-medium">${createdDate}</p>
            </div>
          </div>
        </div>
      </ui-modal>
    `;
  }
}

customElements.define("staff-view-modal", StaffViewModal);
export default StaffViewModal;
