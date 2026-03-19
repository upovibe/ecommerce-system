import "@/components/ui/Modal.js";
import "@/components/ui/Toast.js";
import "@/components/ui/Input.js";
import "@/components/ui/Textarea.js";
import "@/components/ui/Switch.js";
import api from "@/services/api.js";

class FaqUpdateModal extends HTMLElement {
  constructor() {
    super();
    this.faqData = null;
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

  setFaqData(faq) {
    this.faqData = faq || null;
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
      if (!this.faqData?.id) return;
      const token = localStorage.getItem("token");
      if (!token) {
        window.Toast?.show?.({
          title: "Authentication Error",
          message: "Please log in again",
          variant: "error",
        });
        return;
      }

      const qInput = this.querySelector('ui-input[data-field="question"]');
      const aInput = this.querySelector('ui-textarea[data-field="answer"]');
      const orderInput = this.querySelector('ui-input[data-field="sort_order"]');
      const activeSwitch = this.querySelector('ui-switch[name="is_active"]');

      const payload = {
        question: (qInput?.value || "").trim(),
        answer: (aInput?.value || "").trim(),
        sort_order: parseInt(orderInput?.value || "0", 10) || 0,
        is_active: activeSwitch?.checked ? true : false,
      };

      if (!payload.question || !payload.answer) {
        window.Toast?.show?.({
          title: "Validation Error",
          message: "Question and answer are required",
          variant: "error",
        });
        return;
      }

      await api.withToken(token).put(`/faqs/${this.faqData.id}`, payload);

      window.Toast?.show?.({
        title: "Success",
        message: "FAQ updated.",
        variant: "success",
      });
      this.close();
      this.dispatchEvent(
        new CustomEvent("faq-updated", {
          bubbles: true,
          composed: true,
        }),
      );
    } catch (error) {
      window.Toast?.show?.({
        title: "Error",
        message:
          error.response?.data?.message || "Failed to update FAQ",
        variant: "error",
      });
    }
  };

  render() {
    const faq = this.faqData || {};
    this.innerHTML = `
      <ui-modal ${this.hasAttribute("open") ? "open" : ""} position="right" size="md" close-button="true">
        <div slot="title">Edit FAQ</div>
        <form class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1">Question</label>
            <ui-input data-field="question" value="${(faq.question || "").replace(/"/g, "&quot;")}" placeholder="Question" class="w-full"></ui-input>
            <p class="text-[11px] text-slate-500 mt-1">Keep it short and clear for customers.</p>
          </div>
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1">Answer</label>
            <ui-textarea data-field="answer" rows="4" value="${(faq.answer || "").replace(/"/g, "&quot;")}" placeholder="Answer" class="w-full"></ui-textarea>
            <p class="text-[11px] text-slate-500 mt-1">Provide a concise but helpful response.</p>
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1">Sort Order</label>
              <ui-input data-field="sort_order" type="number" value="${faq.sort_order ?? 0}" class="w-full"></ui-input>
            </div>
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1">Status</label>
              <ui-switch name="is_active" ${faq.is_active !== false ? "checked" : ""}>
                <span slot="label">Active</span>
              </ui-switch>
            </div>
          </div>
        </form>
      </ui-modal>
    `;
  }
}

customElements.define("faq-update-modal", FaqUpdateModal);
export default FaqUpdateModal;
