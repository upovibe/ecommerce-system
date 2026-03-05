import "@/components/ui/Modal.js";
import "@/components/ui/Input.js";
import "@/components/ui/Switch.js";
import "@/components/ui/Dropdown.js";
import api from "@/services/api.js";
import Toast from "@/components/ui/Toast.js";

class StaffEditModal extends HTMLElement {
  constructor() {
    super();
    this.staffData = null;
    this.formData = {
      name: "",
      email: "",
      password: "",
      role: "manager",
      status: "active",
    };
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
    if (this.staffData) {
      this.formData = {
        name: this.staffData.name || "",
        email: this.staffData.email || "",
        password: "",
        role: String(this.staffData.role || "manager"),
        status: (this.staffData.status || "active").toLowerCase(),
      };
    }
    this.render();
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
    this.addEventListener("cancel", this.onCancel);
  }

  onCancel = () => {
    this.close();
  };

  onConfirm = async () => {
    try {
      if (!this.staffData?.id) return;
      const payload = {
        name: this.formData.name,
        email: this.formData.email,
        role: this.formData.role,
        status: this.formData.status,
      };

      if ((this.formData.password || "").trim() !== "") {
        payload.password = this.formData.password;
      }

      const res = await api.put(`/users/${this.staffData.id}`, payload);
      if (res.data) {
        Toast.show({
          title: "Success",
          message: "Staff member updated.",
          variant: "success",
        });
        this.dispatchEvent(new CustomEvent("staff-updated", { bubbles: true }));
        this.close();
      }
    } catch (error) {
      Toast.show({
        title: "Error",
        message: error.response?.data?.error || "Failed to update staff member",
        variant: "error",
      });
    }
  };

  render() {
    if (!this.staffData) return;

    this.innerHTML = `
      <ui-modal ${this.hasAttribute("open") ? "open" : ""} position="right" size="md" close-button="true">
        <div slot="title">Edit Staff Member</div>
        <form class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
            <ui-input id="staff-name-input" value="${this.formData.name}" placeholder="Enter full name" class="w-full"></ui-input>
          </div>

          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
            <ui-input id="staff-email-input" value="${this.formData.email}" type="email" class="w-full"></ui-input>
          </div>

          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1">Role</label>
            <ui-dropdown
              id="staff-role-dropdown"
              placeholder="Select Role"
              class="w-full">
              <ui-option value="super_admin">Super Admin</ui-option>
              <ui-option value="manager">Manager</ui-option>
              <ui-option value="accountant">Accountant</ui-option>
            </ui-dropdown>
          </div>

          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1">Password</label>
            <ui-input id="staff-password-input" value="" type="password" placeholder="Leave blank to keep current password" class="w-full"></ui-input>
          </div>

          <div class="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100">
            <div class="space-y-1">
              <span class="text-sm font-medium text-gray-900">Staff Account Status</span>
              <p class="text-xs text-gray-500">Enable or disable this staff account</p>
            </div>
            <ui-switch id="staff-status-switch" ${this.formData.status === "active" ? "checked" : ""} label="Active"></ui-switch>
          </div>
        </form>
      </ui-modal>
    `;

    this.querySelector("#staff-name-input")?.addEventListener("input", (e) => {
      this.formData.name = e.target.value;
    });
    this.querySelector("#staff-email-input")?.addEventListener("input", (e) => {
      this.formData.email = e.target.value;
    });
    this.querySelector("#staff-role-dropdown")?.addEventListener("change", (e) => {
      this.formData.role = e.detail.value;
    });
    this.querySelector("#staff-password-input")?.addEventListener("input", (e) => {
      this.formData.password = e.target.value;
    });
    setTimeout(() => {
      const roleDropdown = this.querySelector("#staff-role-dropdown");
      if (roleDropdown) roleDropdown.value = String(this.formData.role || "manager");
    }, 0);
    this.querySelector("#staff-status-switch")?.addEventListener("change", (e) => {
      this.formData.status = e.detail.checked ? "active" : "inactive";
    });
  }
}

customElements.define("staff-edit-modal", StaffEditModal);
export default StaffEditModal;
