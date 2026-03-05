import "@/components/ui/Modal.js";
import "@/components/ui/Input.js";
import "@/components/ui/Switch.js";
import "@/components/ui/Dropdown.js";
import "@/components/ui/Toast.js";
import api from "@/services/api.js";

class StaffEditModal extends HTMLElement {
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
    this.addEventListener("confirm", this.onConfirm);
    this.addEventListener("cancel", () => this.close());
  }

  onConfirm = async () => {
    try {
      if (!this.staffData?.id) return;
      const token = localStorage.getItem("token");

      const name = this.querySelector('ui-input[data-field="name"]')?.value;
      const role = this.querySelector('ui-dropdown[data-field="role"]')?.value;
      const status = this.querySelector('ui-switch[name="status"]')?.checked
        ? "active"
        : "inactive";

      const payload = {
        name: name.trim(),
        role: role,
        status: status,
      };

      if (!payload.name) {
        Toast.show({
          title: "Error",
          message: "Name is required",
          variant: "error",
        });
        return;
      }

      await api.withToken(token).put(`/users/${this.staffData.id}`, payload);

      Toast.show({
        title: "Success",
        message: "Staff member updated",
        variant: "success",
      });
      this.close();
      this.dispatchEvent(
        new CustomEvent("staff-updated", { bubbles: true, composed: true }),
      );
    } catch (e) {
      Toast.show({ title: "Error", message: e.message, variant: "error" });
    }
  };

  render() {
    const user = this.staffData || {};
    const isActive =
      user.status === "active" ||
      user.status === "Active" ||
      Number(user.is_active) === 1;

    this.innerHTML = `
      <ui-modal ${this.hasAttribute("open") ? "open" : ""} position="right" size="md" close-button="true">
        <div slot="title">Edit Staff Member</div>
        <div class="space-y-4 py-2">
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
            <ui-input data-field="name" value="${user.name || ""}" placeholder="Enter full name" class="w-full"></ui-input>
          </div>
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1">Email (Disabled)</label>
            <ui-input value="${user.email || ""}" disabled class="w-full"></ui-input>
          </div>
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1">Role</label>
            <ui-dropdown data-field="role" value="${user.role || "admin"}" class="w-full">
              <ui-option value="admin">Admin</ui-option>
              <ui-option value="super_admin">Super Admin</ui-option>
            </ui-dropdown>
          </div>
          <div class="pt-2">
            <ui-switch name="status" ${isActive ? "checked" : ""}>
              <span slot="label">Active Status</span>
            </ui-switch>
          </div>
        </div>
      </ui-modal>
    `;
  }
}

customElements.define("staff-edit-modal", StaffEditModal);
export default StaffEditModal;
