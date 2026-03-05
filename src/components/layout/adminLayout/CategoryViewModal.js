import "@/components/ui/Modal.js";

class CategoryViewModal extends HTMLElement {
  constructor() {
    super();
    this.categoryData = null;
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

  setCategoryData(category) {
    this.categoryData = category || null;
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
    this.addEventListener("cancel", this.onCancel);
  }

  onCancel = () => {
    this.close();
  };

  getImageUrl(path) {
    if (!path) return "";
    if (path.startsWith("http://") || path.startsWith("https://") || path.startsWith("data:")) {
      return path;
    }

    const baseUrl = window.location.origin;
    if (path.startsWith("/")) {
      return baseUrl + path;
    }

    if (path.startsWith("uploads/")) {
      return `${baseUrl}/${path}`;
    }

    if (!path.includes("/")) {
      return `${baseUrl}/uploads/categories/${path}`;
    }

    return `${baseUrl}/api/${path}`;
  }

  render() {
    const cat = this.categoryData || {};

    this.innerHTML = `
      <ui-modal ${this.hasAttribute("open") ? "open" : ""} position="right" size="md" close-button="true">
        <div slot="title">Category Details</div>
        <div class="space-y-4 text-sm">
          <div class="w-full h-44 bg-slate-50 border border-slate-200 rounded-xl overflow-hidden flex items-center justify-center">
            ${
              cat.image
                ? `<img src="${this.getImageUrl(cat.image)}" class="w-full h-full object-cover" alt="${cat.name || "Category"}" />`
                : `<i class="fas fa-image text-slate-300 text-3xl"></i>`
            }
          </div>
          <div>
            <p class="text-xs font-bold text-slate-500 mb-1">Name</p>
            <p class="text-slate-800 font-semibold">${cat.name || "-"}</p>
          </div>
          <div>
            <p class="text-xs font-bold text-slate-500 mb-1">Parent</p>
            <p class="text-slate-700">${cat.parent_id ? `#${cat.parent_id}` : "Main Category"}</p>
          </div>
          <div>
            <p class="text-xs font-bold text-slate-500 mb-1">Description</p>
            <p class="text-slate-700">${cat.description || "No description"}</p>
          </div>
          <div>
            <p class="text-xs font-bold text-slate-500 mb-1">Status</p>
            <p class="text-slate-700">${cat.is_active ? "Active" : "Hidden"}</p>
          </div>
        </div>
      </ui-modal>
    `;
  }
}

customElements.define("category-view-modal", CategoryViewModal);
export default CategoryViewModal;
