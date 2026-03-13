import "@/components/ui/Modal.js";
import "@/components/ui/Input.js";
import "@/components/ui/Switch.js";
import "@/components/ui/Button.js";
import "@/components/ui/Wysiwyg.js";
import "@/components/ui/FileUpload.js";
import api from "@/services/api.js";
import Toast from "@/components/ui/Toast.js";

class PageUpdateModal extends HTMLElement {
  constructor() {
    super();
    this.page = null;
    this._galleryImages = [];
    this.formData = {
      title: "",
      subtitle: "",
      content: "",
      is_active: true,
    };
  }

  connectedCallback() {
    this.render();
  }

  open(page) {
    this.page = page;
    this.formData = {
      title: page.title || "",
      subtitle: page.subtitle || "",
      content: page.content || "",
      is_active: Number(page.is_active) === 1,
    };
    // Parse existing gallery images
    let imgs = page.images;
    if (typeof imgs === "string") { try { imgs = JSON.parse(imgs); } catch { imgs = []; } }
    this._galleryImages = Array.isArray(imgs) ? [...imgs] : [];
    this.render();
    const modal = this.querySelector("ui-modal");
    if (modal) modal.open();
  }

  close() {
    const modal = this.querySelector("ui-modal");
    if (modal) modal.close();
  }

  async savePage() {
    const saveBtn = this.querySelector("#save-page-btn");
    if (saveBtn) saveBtn.setAttribute("loading", "true");

    try {
      // Collect WYSIWYG content
      const wysiwyg = this.querySelector("ui-wysiwyg");
      if (wysiwyg) this.formData.content = wysiwyg.getValue();

      const formData = new FormData();
      formData.append("_method", "PUT");
      formData.append("title", this.formData.title);
      formData.append("subtitle", this.formData.subtitle);
      formData.append("content", this.formData.content);
      formData.append("is_active", this.formData.is_active ? 1 : 0);

      // Banner image (single)
      const bannerUploader = this.querySelector("#page-banner-uploader");
      if (bannerUploader?.files?.[0]) {
        formData.append("banner[0]", bannerUploader.files[0]);
      }

      // Gallery images (multiple)
      const imageUploader = this.querySelector("#page-images-uploader");
      if (imageUploader?.files) {
        for (let i = 0; i < imageUploader.files.length; i++) {
          formData.append(`images[${i}]`, imageUploader.files[i]);
        }
      }

      const res = await api.post(`/pages/${this.page.id}`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (res.data) {
        Toast.show({ title: "Saved", message: "Page updated successfully", variant: "success" });
        this.dispatchEvent(new CustomEvent("page-updated", { bubbles: true }));
        this.close();
      }
    } catch (error) {
      console.error(error);
      Toast.show({
        title: "Error",
        message: error.response?.data?.message || error.response?.data?.error || "Failed to update page",
        variant: "error",
      });
    } finally {
      if (saveBtn) saveBtn.removeAttribute("loading");
    }
  }

  render() {
    if (!this.page) return;

    const safeContent = (this.formData.content || "")
      .replace(/'/g, "&#39;")
      .replace(/`/g, "&#96;");

    // Build existing banner preview
    let banners = this.page.banner_image;
    if (typeof banners === "string") { try { banners = JSON.parse(banners); } catch { banners = []; } }
    const hasBanner = Array.isArray(banners) && banners.length > 0;

    this.innerHTML = `
      <ui-modal title="Edit Page" size="lg">
        <div class="space-y-5">

          <!-- Read-only info strip -->
          <div class="flex flex-wrap gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs text-slate-500">
            <span><i class="fas fa-tag mr-1"></i> <strong>${this.page.name || this.page.title}</strong></span>
            <span><i class="fas fa-link mr-1"></i> /${(this.page.slug || "").replace(/^\//, "")}</span>
          </div>

          <!-- Editable Title -->
          <ui-input
            label="Page Title"
            id="page-title-input"
            value="${this.formData.title}"
            placeholder="e.g. About VastCommerce">
          </ui-input>

          <ui-input
            label="Page Subtitle"
            id="page-subtitle-input"
            value="${this.formData.subtitle}"
            placeholder="Short supporting headline">
          </ui-input>

          <!-- Content WYSIWYG -->
          <div class="space-y-2 p-4 bg-gray-50 rounded-xl border border-gray-100">
            <label class="text-sm font-medium text-gray-900">Page Content</label>
            <ui-wysiwyg
              placeholder="Write your page content here..."
              height="360px"
              id="page-content-editor"
              value='${safeContent}'>
            </ui-wysiwyg>
          </div>

          <!-- Banner Image -->
          <div class="space-y-2">
            <label class="text-sm font-medium text-gray-900">Banner Image</label>
            ${hasBanner ? `
              <div class="rounded-xl overflow-hidden border border-slate-200 h-28">
                <img src="/api/${banners[0].replace(/^\//, "")}" class="w-full h-full object-cover" alt="Current banner" onerror="this.parentElement.style.display='none'">
              </div>
              <p class="text-xs text-slate-400">Upload a new image to replace the current banner.</p>
            ` : ""}
            <ui-file-upload
              id="page-banner-uploader"
              accept="image/*"
              multiple="true"
              label="Upload Banner Image(s)">
            </ui-file-upload>
          </div>

          <!-- Gallery Images -->
          <div class="space-y-2">
            <label class="text-sm font-medium text-gray-900">Gallery Images</label>
            ${this._renderExistingGallery()}
            <ui-file-upload
              id="page-images-uploader"
              accept="image/*"
              multiple="true"
              label="Upload Gallery Images">
            </ui-file-upload>
          </div>

          <!-- Status -->
          <div class="pt-4 border-t border-slate-100">
            <label class="block text-sm font-medium text-slate-700 mb-2">Status</label>
            <ui-switch 
              id="page-status-switch" 
              ${this.formData.is_active ? "checked" : ""}
              label="Published">
            </ui-switch>
          </div>

        </div>

        <div slot="footer" class="flex justify-end gap-3">
          <ui-button variant="ghost" id="cancel-page-btn">Cancel</ui-button>
          <ui-button variant="primary" id="save-page-btn">Save Changes</ui-button>
        </div>
      </ui-modal>
    `;

    // Bind events
    this.querySelector("#page-title-input")?.addEventListener("input", (e) => {
      this.formData.title = e.target.value;
    });
    this.querySelector("#page-subtitle-input")?.addEventListener("input", (e) => {
      this.formData.subtitle = e.target.value;
    });
    this.querySelector("#cancel-page-btn")?.addEventListener("click", () => this.close());
    this.querySelector("#save-page-btn")?.addEventListener("click", () => this.savePage());

    this.querySelector("#page-status-switch")?.addEventListener("change", (e) => {
      this.formData.is_active = e.detail.checked;
    });

    // Wire up individual gallery remove buttons
    this.querySelectorAll("[data-remove-gallery]").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const idx = parseInt(e.currentTarget.dataset.removeGallery);
        if (!isNaN(idx)) {
          this._galleryImages.splice(idx, 1);
          this._renderGalleryPreview();
        }
      });
    });
  }

  _getImageUrl(path) {
    if (!path) return "";
    if (path.startsWith("http://") || path.startsWith("https://")) return path;
    return `/api/${path.replace(/^\//, "")}`;
  }

  _renderExistingGallery() {
    const images = this._galleryImages;
    if (!images || images.length === 0) return "";

    return `
      <div id="gallery-preview-grid" class="grid grid-cols-3 sm:grid-cols-4 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
        ${images.map((img, i) => `
          <div class="relative group aspect-square rounded-lg overflow-hidden border border-slate-200 bg-white shadow-sm">
            <img
              src="${this._getImageUrl(img)}"
              class="w-full h-full object-cover"
              alt="Gallery image ${i + 1}"
              onerror="this.parentElement.style.opacity='0.3'">
            <button
              type="button"
              data-remove-gallery="${i}"
              class="absolute top-1 right-1 w-6 h-6 flex items-center justify-center bg-red-500 text-white rounded-full text-xs opacity-0 group-hover:opacity-100 transition-opacity shadow"
              title="Remove">
              <i class="fas fa-times"></i>
            </button>
          </div>
        `).join("")}
      </div>
      <p class="text-xs text-slate-400">
        <i class="fas fa-info-circle mr-1"></i>
        ${images.length} current image${images.length !== 1 ? "s" : ""}. Upload new images to add more or replace.
      </p>
    `;
  }

  _renderGalleryPreview() {
    const grid = this.querySelector("#gallery-preview-grid");
    const parent = grid?.parentElement;
    if (!parent) return;

    // Re-render the whole gallery section
    const section = this.querySelector("#gallery-section");
    if (section) {
      section.innerHTML = this._renderExistingGallery();
      // Re-wire buttons
      section.querySelectorAll("[data-remove-gallery]").forEach((btn) => {
        btn.addEventListener("click", (e) => {
          const idx = parseInt(e.currentTarget.dataset.removeGallery);
          if (!isNaN(idx)) {
            this._galleryImages.splice(idx, 1);
            section.innerHTML = this._renderExistingGallery();
          }
        });
      });
    }
  }
}

customElements.define("page-update-modal", PageUpdateModal);
export default PageUpdateModal;
