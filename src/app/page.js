import App from "@/core/App.js";
import "@/app/public/layout.js";
import "@/app/public/page.js";

// Root page - render public landing (same as church/school landing style)
export default class RootPage extends App {
  async connectedCallback() {
    super.connectedCallback();
    try {
      await customElements.whenDefined("app-public-layout");
    } catch (_) {
      /* noop */
    }
    const setContent = () => {
      const layout = this.querySelector("app-public-layout");
      if (layout && typeof layout.setPageContent === "function") {
        layout.setPageContent("<app-public-home-page></app-public-home-page>");
        return true;
      }
      return false;
    };
    if (!setContent()) {
      setTimeout(setContent, 0);
    }
  }

  render() {
    return `<app-public-layout></app-public-layout>`;
  }
}

customElements.define("app-root-page", RootPage);
