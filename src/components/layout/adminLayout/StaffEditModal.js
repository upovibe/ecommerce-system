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
      role_id: "3",
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
        role_id: String(this.staffData.role_id || "3"),
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
      const res = await api.put(`/users/${this.staffData.id}`, this.formData);

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
      console.error(error);
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
            <div class="space-y-6">
                <ui-input 
                    label="Full Name" 
                    placeholder="Enter full name"
                    id="staff-name-input"
                    value="${this.formData.name}">
                </ui-input>

                <ui-input 
                    label="Email Address" 
                    type="email"
                    id="staff-email-input"
                    value="${this.formData.email}">
                </ui-input>

                <ui-dropdown 
                    label="Role" 
                    id="staff-role-dropdown"
                    placeholder="Select Role"
                    options='[{"value": "1", "label": "Super Admin"}, {"value": "2", "label": "Manager"}, {"value": "3", "label": "Staff"}]'
                    value="${this.formData.role_id}">
                </ui-dropdown>

                <div class="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-700">
                    <div class="space-y-1">
                        <span class="text-sm font-medium text-gray-900 dark:text-gray-100">Staff Account Status</span>
                        <p class="text-xs text-gray-500 dark:text-gray-400">Enable or disable this staff account</p>
                    </div>
                    <ui-switch 
                        id="staff-status-switch" 
                        ${this.formData.status === "active" ? "checked" : ""}
                        label="Active">
                    </ui-switch>
                </div>
            </div>
        </ui-modal>
    `;

    this.querySelector("#staff-name-input").addEventListener(
      "input",
      (e) => (this.formData.name = e.target.value),
    );
    this.querySelector("#staff-email-input").addEventListener(
      "input",
      (e) => (this.formData.email = e.target.value),
    );
    this.querySelector("#staff-role-dropdown").addEventListener(
      "change",
      (e) => (this.formData.role_id = e.detail.value),
    );
    this.querySelector("#staff-status-switch").addEventListener(
      "change",
      (e) => {
        this.formData.status = e.detail.checked ? "active" : "inactive";
      },
    );
  }
}

customElements.define("staff-edit-modal", StaffEditModal);
export default StaffEditModal;
