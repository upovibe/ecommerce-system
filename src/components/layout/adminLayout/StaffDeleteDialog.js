/**
 * StaffDeleteDialog Component
 *
 * Confirmation dialog for deleting a staff member.
 */
import "@/components/ui/Dialog.js";
import Toast from "@/components/ui/Toast.js";
import api from "@/services/api.js";

class StaffDeleteDialog extends HTMLElement {
  constructor() {
    super();
    this.staff = null;
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
    this.staff = staff || null;
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
    this.addEventListener("cancel", this.onCancel);
  }

  onCancel = () => {
    this.close();
  };

  onConfirm = async () => {
    try {
      if (!this.staff?.id) return;

      await api.delete(`/users/${this.staff.id}`);

      Toast.show({
        title: "Deleted",
        message: "Staff member removed.",
        variant: "success",
      });

      this.dispatchEvent(new CustomEvent("staff-deleted", { bubbles: true }));
      this.close();
    } catch (error) {
      console.error(error);
      Toast.show({
        title: "Error",
        message: error.response?.data?.error || "Failed to delete staff member",
        variant: "error",
      });
    }
  };

  render() {
    this.innerHTML = `
            <ui-dialog ${this.hasAttribute("open") ? "open" : ""} title="Delete Staff Member" variant="danger" confirm-label="Delete">
                <div slot="content" class="space-y-3 text-sm text-slate-700">
                    <p>Are you sure you want to delete:</p>
                    <p class="font-bold text-slate-900">${this.staff?.name || "this staff member"}?</p>
                    <p class="text-slate-500">This action cannot be undone.</p>
                </div>
            </ui-dialog>
        `;
  }
}

customElements.define("staff-delete-dialog", StaffDeleteDialog);
