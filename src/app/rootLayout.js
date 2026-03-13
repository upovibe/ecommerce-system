import App from "@/core/App.js";
import "@/app/public/layout.js";
import "@/app/setFavicon.js";

/**
 * Root Layout for Universal E-commerce System
 */
class RootLayout extends App {
  constructor() {
    super();
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
    const container = this.querySelector("#page-content");
    if (container) container.innerHTML = content;
  }
}

customElements.define("root-layout", RootLayout);
export default RootLayout;
