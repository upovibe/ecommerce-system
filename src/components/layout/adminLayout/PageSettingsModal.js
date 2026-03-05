import "@/components/ui/Modal.js";
import "@/components/ui/Input.js";
import "@/components/ui/Textarea.js";
import "@/components/ui/Switch.js";
import "@/components/ui/Button.js";
import "@/components/ui/Wysiwyg.js";
import "@/components/ui/FileUpload.js";
import api from "@/services/api.js";
import Toast from "@/components/ui/Toast.js";

class PageSettingsModal extends HTMLElement {
  constructor() {
    super();
    this.pageData = {
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

  open() {
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
        this.pageData.content = wysiwyg.getValue();
      }

      // Create FormData for files
      const formData = new FormData();
      Object.keys(this.pageData).forEach((key) => {
        if (key === "meta_info") {
          formData.append(key, JSON.stringify(this.pageData[key]));
        } else {
          formData.append(key, this.pageData[key]);
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

      const res = await api.post("/pages", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (res.data) {
        Toast.show({
          title: "Success",
          message: "Page created successfully",
          variant: "success",
        });
        this.dispatchEvent(new CustomEvent("page-saved", { bubbles: true }));
        this.close();
      }
    } catch (error) {
      console.error(error);
      Toast.show({
        title: "Error",
        message: error.response?.data?.error || "Failed to create page",
        variant: "error",
      });
    } finally {
      if (saveBtn) saveBtn.removeAttribute("loading");
    }
  }

  render() {
    this.innerHTML = `
            <ui-modal title="Create New Cloud Page" size="lg">
                <div class="space-y-6">
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <ui-input 
                            label="Page Title" 
                            placeholder="Enter page title"
                            id="page-title-input"
                            value="${this.pageData.title}">
                        </ui-input>

                        <ui-input 
                            label="Page Name (Internal)" 
                            placeholder="Enter administrative name"
                            id="page-name-input"
                            value="${this.pageData.name}">
                        </ui-input>
                    </div>

                    <div class="space-y-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-700">
                        <label class="text-sm font-medium text-gray-900 dark:text-gray-100">Page Content</label>
                        <ui-wysiwyg 
                            placeholder="Write your page content here..."
                            height="400px"
                            id="page-content-editor">
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
                            ${this.pageData.is_active ? "checked" : ""}
                            label="Published">
                        </ui-switch>
                    </div>
                </div>

                <div slot="footer" class="flex justify-end gap-3">
                    <ui-button variant="ghost" id="cancel-page-btn">Cancel</ui-button>
                    <ui-button variant="primary" id="save-page-btn">Create Page</ui-button>
                </div>
            </ui-modal>
        `;

    this.querySelector("#page-title-input").addEventListener(
      "input",
      (e) => (this.pageData.title = e.target.value),
    );
    this.querySelector("#page-name-input").addEventListener(
      "input",
      (e) => (this.pageData.name = e.target.value),
    );
    this.querySelector("#page-status-switch").addEventListener(
      "change",
      (e) => {
        this.pageData.is_active = e.detail.checked;
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

customElements.define("page-settings-modal", PageSettingsModal);
export default PageSettingsModal;
