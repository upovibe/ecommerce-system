import App from "@/core/App.js";
import "@/app/public/layout.js";

class PublicOrderLayout extends App {
  constructor() {
    super();
    this._pendingContent = "";
  }

  async connectedCallback() {
    super.connectedCallback();
    if (this._pendingContent) {
      await this.applyPendingContent();
    }
  }

  async applyPendingContent() {
    try {
      await customElements.whenDefined("app-public-layout");
    } catch (_) {
      /* noop */
    }
    const layout = this.querySelector("app-public-layout");
    if (layout && typeof layout.setPageContent === "function") {
      layout.setPageContent(this._pendingContent);
      this._pendingContent = "";
    }
  }

  render() {
    return `
      <div class="min-h-screen bg-slate-50 flex flex-col">
        <app-public-layout></app-public-layout>
        <div id="toast-container" class="fixed top-6 right-6 z-[9999]"></div>
      </div>
    `;
  }

  setPageContent(content) {
    const layout = this.querySelector("app-public-layout");
    if (layout && typeof layout.setPageContent === "function") {
      layout.setPageContent(content);
      return;
    }
    this._pendingContent = content;
    this.applyPendingContent();
  }
}

customElements.define("app-public-order-layout", PublicOrderLayout);
export default PublicOrderLayout;
