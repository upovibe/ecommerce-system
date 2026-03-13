import App from "@/core/App.js";

/**
 * Auth Layout (no header/footer)
 */
class AuthLayout extends App {
  render() {
    return `
      <div class="min-h-screen bg-white flex flex-col">
        <main id="page-content" class="flex-grow"></main>
        <div id="toast-container" class="fixed top-6 right-6 z-[9999]"></div>
      </div>
    `;
  }

  setPageContent(content) {
    const container = this.querySelector("#page-content");
    if (container) container.innerHTML = content;
  }
}

customElements.define("app-auth-layout", AuthLayout);
export default AuthLayout;
