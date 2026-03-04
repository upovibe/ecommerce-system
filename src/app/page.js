// Root page - redirect to public store
export default class RootPage extends HTMLElement {
  connectedCallback() {
    window.location.replace("/public");
  }
}

customElements.define("app-root-page", RootPage);
