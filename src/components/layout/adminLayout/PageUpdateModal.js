import "@/components/ui/Modal.js";
import "@/components/ui/Input.js";
import "@/components/ui/Textarea.js";
import "@/components/ui/Switch.js";
import "@/components/ui/Toast.js";
import api from "@/services/api.js";

class PageUpdateModal extends HTMLElement {
  constructor() {
    super();
    this.pageData = null;
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

  setPageData(page) {
    this.pageData = page || null;
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
      if (!this.pageData?.id) return;
      const token = localStorage.getItem("token");

      const title = this.querySelector('ui-input[data-field="title"]')?.value;
      const slug = this.querySelector('ui-input[data-field="slug"]')?.value;
      const content = this.querySelector(
        'ui-textarea[data-field="content"]',
      )?.value;
      const isActive = this.querySelector('ui-switch[name="is_active"]')
        ?.checked
        ? 1
        : 0;

      const payload = {
        title: title.trim(),
        slug: slug.trim(),
        content: content,
        is_active: isActive,
      };

      if (!payload.title || !payload.slug) {
        Toast.show({
          title: "Error",
          message: "Title and Slug are required",
          variant: "error",
        });
        return;
      }

      await api.withToken(token).put(`/pages/${this.pageData.id}`, payload);

      Toast.show({
        title: "Success",
        message: "Page updated successfully",
        variant: "success",
      });
      this.close();
      this.dispatchEvent(
        new CustomEvent("page-updated", { bubbles: true, composed: true }),
      );
    } catch (e) {
      Toast.show({ title: "Error", message: e.message, variant: "error" });
    }
  };

  render() {
    const page = this.pageData || {};
    const isActive = page.is_active !== false && page.is_active !== 0;

    this.innerHTML = `
      <ui-modal ${this.hasAttribute("open") ? "open" : ""} position="right" size="lg" close-button="true">
        <div slot="title">Edit Cloud Page</div>
        <div class="space-y-4 py-2">
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1">Page Title</label>
            <ui-input data-field="title" value="${page.title || ""}" placeholder="e.g. Terms of Service" class="w-full"></ui-input>
          </div>
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1">Slug</label>
            <ui-input data-field="slug" value="${page.slug || ""}" placeholder="e.g. terms-of-service" class="w-full"></ui-input>
            <p class="text-[10px] text-slate-400 mt-1 ml-1">The URL path for this page</p>
          </div>
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1">Content (HTML allowed)</label>
            <ui-textarea data-field="content" rows="12" value="" placeholder="Enter page content here..." class="w-full"></ui-textarea>
          </div>
          <div class="pt-2">
            <ui-switch name="is_active" ${isActive ? "checked" : ""}>
              <span slot="label">Published Status</span>
            </ui-switch>
          </div>
        </div>
      </ui-modal>
    `;

    // Handle initial content value for textarea
    const contentArea = this.querySelector('ui-textarea[data-field="content"]');
    if (contentArea && page.content) {
      setTimeout(() => {
        contentArea.value = page.content;
      }, 0);
    }
  }
}

customElements.define("page-update-modal", PageUpdateModal);
export default PageUpdateModal;
