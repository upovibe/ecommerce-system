import App from "@/core/App.js";

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
        <main id="page-content" class="flex-grow"></main>
        <div id="toast-container" class="fixed top-6 right-6 z-[9999]"></div>
      </div>
    `;
  }

  setPageContent(content) {
    const container = this.querySelector("#page-content");
    if (container) {
      container.innerHTML = content;
    }
  }
}

customElements.define("root-layout", RootLayout);
export default RootLayout;
