import "@/components/ui/Modal.js";
import "@/components/ui/Input.js";
import "@/components/ui/Textarea.js";
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
    this.formData = {
      title: "",
      name: "",
      content: "",
      is_active: true,
      meta_info: {
        keywords: "",
        description: "",
      },
    };
  }

  connectedCallback() {
    this.render();
  }

  open(page) {
    this.page = page;
    this.formData = {
      title: page.title || "",
      name: page.name || "",
      slug: page.slug || "",
      content: page.content || "",
      is_active: page.is_active !== undefined ? !!page.is_active : true,
      meta_info: page.meta_info || { keywords: "", description: "" },
    };
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
      // Collect content from WYSIWYG
      const wysiwyg = this.querySelector("ui-wysiwyg");
      if (wysiwyg) {
        this.formData.content = wysiwyg.getValue();
      }

      // Create FormData for files
      const formData = new FormData();
      formData.append("_method", "PUT"); // For PHP to handle multipart PUT

      Object.keys(this.formData).forEach((key) => {
        if (key === "meta_info") {
          formData.append(key, JSON.stringify(this.formData[key]));
        } else if (key !== "images" && key !== "banner_image") {
          formData.append(key, this.formData[key]);
        }
      });

      // Handle multiple images
      const imageUploader = this.querySelector("#page-images-uploader");
      if (imageUploader && imageUploader.files) {
        for (let i = 0; i < imageUploader.files.length; i++) {
          formData.append("images[]", imageUploader.files[i]);
        }
      }

      // Handle banner
      const bannerUploader = this.querySelector("#page-banner-uploader");
      if (bannerUploader && bannerUploader.files && bannerUploader.files[0]) {
        formData.append("banner", bannerUploader.files[0]);
      }

      const res = await api.post(`/pages/${this.page.id}`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (res.data) {
        Toast.show({
          title: "Success",
          message: "Page updated successfully",
          variant: "success",
        });
        this.dispatchEvent(new CustomEvent("page-updated", { bubbles: true }));
        this.close();
      }
    } catch (error) {
      console.error(error);
      Toast.show({
        title: "Error",
        message: error.response?.data?.error || "Failed to update page",
        variant: "error",
      });
    } finally {
      if (saveBtn) saveBtn.removeAttribute("loading");
    }
  }

  render() {
    if (!this.page) return;

    this.innerHTML = `
            <ui-modal title="Update Cloud Page" size="lg">
                <div class="space-y-6">
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <ui-input 
                            label="Page Title" 
                            id="page-title-input"
                            value="${this.formData.title}"
                            disabled="true">
                        </ui-input>

                        <ui-input 
                            label="Page Name (Internal)" 
                            id="page-name-input"
                            value="${this.formData.name}">
                        </ui-input>
                    </div>

                    <ui-input 
                        label="URL Slug" 
                        prefix="/"
                        id="page-slug-input"
                        value="${this.formData.slug}"
                        disabled="true">
                    </ui-input>

                    <div class="space-y-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-700">
                        <label class="text-sm font-medium text-gray-900 dark:text-white">Page Content</label>
                        <ui-wysiwyg 
                            placeholder="Write your page content here..."
                            height="400px"
                            id="page-content-editor"
                            value='${this.formData.content.replace(/'/g, "&#39;")}'>
                        </ui-wysiwyg>
                    </div>

                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <ui-file-upload 
                            label="Banner Image" 
                            id="page-banner-uploader"
                            accept="image/*">
                        </ui-file-upload>

                        <ui-file-upload 
                            label="Page Gallery Images" 
                            id="page-images-uploader"
                            accept="image/*"
                            multiple="true">
                        </ui-file-upload>
                    </div>

                    <div class="pt-2">
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

    this.querySelector("#page-name-input").addEventListener(
      "input",
      (e) => (this.formData.name = e.target.value),
    );
    this.querySelector("#page-status-switch").addEventListener(
      "change",
      (e) => {
        this.formData.is_active = e.detail.checked;
      },
    );

    this.querySelector("#cancel-page-btn").addEventListener("click", () =>
      this.close(),
    );
    this.querySelector("#save-page-btn").addEventListener("click", () =>
      this.savePage(),
    );
  }
}

customElements.define("page-update-modal", PageUpdateModal);
export default PageUpdateModal;
