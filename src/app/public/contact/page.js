import App from "@/core/App.js";
import api from "@/services/api.js";
import "@/components/ui/Input.js";
import "@/components/ui/Textarea.js";
import "@/components/ui/Button.js";
import "@/components/ui/Accordion.js";
import "@/components/ui/Toast.js";
import "@/components/ui/ContentDisplay.js";

class PublicContactPage extends App {
  constructor() {
    super();
    this.page = null;
    this.loading = true;
    this.error = "";
    this.contactSettings = {};
    this.socialSettings = {};
    this.mapSettings = {};
    this.faqs = [];
    this.heroImages = [];
    this.heroIndex = 0;
    this.heroTimer = null;
    this.form = { name: "", email: "", subject: "", message: "", phone: "" };
    this._lastRendered = "";
  }

  async connectedCallback() {
    super.connectedCallback();
    await this.loadData();
  }

  disconnectedCallback() {
    if (this.heroTimer) clearInterval(this.heroTimer);
  }

  async loadData() {
    this.loading = true;
    this.updateView();
    try {
      const [pageRes, contactRes, socialRes, mapRes, faqRes, whatsappRes] = await Promise.all([
        api.get("/pages/slug/contact").catch(() => null),
        api.get("/settings/contact").catch(() => null),
        api.get("/settings/social").catch(() => null),
        api.get("/settings/map").catch(() => null),
        api.get("/faqs/public").catch(() => null),
        api.get("/settings/key/admin_whatsapp").catch(() => null),
      ]);

      this.page = pageRes?.data?.data || null;
      const banners = this.normalizeImageList(this.page?.banner_image);
      const gallery = this.normalizeImageList(this.page?.images);
      this.heroImages = gallery.length ? (banners.length ? [...banners, ...gallery] : gallery) : banners;
      this.heroIndex = 0;
      this.startHeroRotation();

      this.contactSettings = this.listToMap(contactRes?.data?.data);
      this.socialSettings = this.listToMap(socialRes?.data?.data);
      this.mapSettings = this.listToMap(mapRes?.data?.data);
      if (whatsappRes?.data?.success) {
        this.contactSettings.admin_whatsapp = whatsappRes.data.data.setting_value || "";
      }
      this.faqs = Array.isArray(faqRes?.data?.data) ? faqRes.data.data : [];
    } catch (e) {
      this.error = "Unable to load contact page.";
    } finally {
      this.loading = false;
      this.updateView();
    }
  }

  listToMap(list) {
    const map = {};
    (list || []).forEach((s) => {
      if (s?.setting_key) map[s.setting_key] = s.setting_value;
    });
    return map;
  }

  normalizeImageList(value) {
    if (!value) return [];
    if (Array.isArray(value)) return value.filter(Boolean);
    if (typeof value === "string") {
      const trimmed = value.trim();
      if (!trimmed) return [];
      if (trimmed.startsWith("[")) {
        try {
          const parsed = JSON.parse(trimmed);
          return Array.isArray(parsed) ? parsed.filter(Boolean) : [];
        } catch (_) {
          return [];
        }
      }
      return [trimmed];
    }
    return [];
  }

  getImageUrl(path) {
    if (!path) return "";
    if (path.startsWith("http://") || path.startsWith("https://") || path.startsWith("data:")) return path;
    const baseUrl = window.location.origin;
    return `${baseUrl}/api/${String(path).replace(/^\/+/, "")}`;
  }

  startHeroRotation() {
    if (this.heroTimer) clearInterval(this.heroTimer);
    if (this.heroImages.length <= 1) return;
    this.heroTimer = setInterval(() => {
      this.heroIndex = (this.heroIndex + 1) % this.heroImages.length;
      this.updateView();
    }, 5000);
  }

  prevHero() {
    if (!this.heroImages.length) return;
    this.heroIndex = (this.heroIndex - 1 + this.heroImages.length) % this.heroImages.length;
    this.updateView();
  }

  nextHero() {
    if (!this.heroImages.length) return;
    this.heroIndex = (this.heroIndex + 1) % this.heroImages.length;
    this.updateView();
  }

  getBusinessHours() {
    const raw = this.contactSettings.business_hours || "[]";
    if (Array.isArray(raw)) return raw;
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch (_) {
      return [];
    }
  }

  getMapUrl() {
    return this.mapSettings.map_url || "";
  }

  async submitForm() {
    try {
      const payload = { ...this.form };
      if (!payload.name || !payload.email || !payload.message) {
        window.Toast?.show?.({ title: "Missing fields", message: "Name, email, and message are required.", variant: "warning" });
        return;
      }
      await api.post("/contact/submit", payload);
      window.Toast?.show?.({ title: "Message sent", message: "We will get back to you soon.", variant: "success" });
      this.form = { name: "", email: "", subject: "", message: "", phone: "" };
      this.updateView();
    } catch (e) {
      window.Toast?.show?.({ title: "Error", message: e.response?.data?.message || "Failed to send message.", variant: "error" });
    }
  }

  renderHero() {
    const title = this.page?.title || "Contact Us";
    const subtitle = this.page?.subtitle || "We’d love to hear from you!";
    if (!this.heroImages.length) {
      return `
        <section class="bg-slate-900 rounded-[2.5rem] p-10 sm:p-12 lg:p-16 text-center text-white mb-12 shadow-2xl overflow-hidden relative">
          <div class="relative z-10 max-w-3xl mx-auto">
            <h1 class="text-4xl sm:text-5xl lg:text-6xl font-black mb-5 tracking-tighter leading-tight">${title}</h1>
            <p class="text-slate-200/80 text-base sm:text-lg mb-6 font-medium">${subtitle}</p>
          </div>
        </section>
      `;
    }

    const slides = this.heroImages
      .map((img, index) => {
        const url = this.getImageUrl(img);
        const active = index === this.heroIndex;
        return `<img src="${url}" alt="${title}" class="absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${active ? "opacity-100" : "opacity-0"}">`;
      })
      .join("");

    return `
      <section class="relative overflow-hidden rounded-[2.5rem] mb-12 border border-slate-200 shadow-2xl group">
        <div class="relative h-[360px] sm:h-[420px] lg:h-[480px]">
          ${slides}
          <div class="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-900/60 to-slate-900/30"></div>
          <div class="absolute inset-0 z-10 flex items-end sm:items-center">
            <div class="w-full px-6 sm:px-12 lg:px-16 py-10 sm:py-0 text-left text-white">
              <div class="max-w-2xl">
                <h1 class="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight mb-4">${title}</h1>
                <p class="text-white/85 text-sm sm:text-lg mb-6">${subtitle}</p>
              </div>
            </div>
          </div>
          <div class="absolute inset-y-0 left-4 sm:left-6 flex items-center z-20 opacity-0 group-hover:opacity-100 transition-opacity">
            <button type="button" class="size-11 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur border border-white/30 text-white flex items-center justify-center transition-all" onclick="this.closest('app-public-contact-page').prevHero()" aria-label="Previous slide">
              <i class="fas fa-chevron-left text-sm"></i>
            </button>
          </div>
          <div class="absolute inset-y-0 right-4 sm:right-6 flex items-center z-20 opacity-0 group-hover:opacity-100 transition-opacity">
            <button type="button" class="size-11 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur border border-white/30 text-white flex items-center justify-center transition-all" onclick="this.closest('app-public-contact-page').nextHero()" aria-label="Next slide">
              <i class="fas fa-chevron-right text-sm"></i>
            </button>
          </div>
        </div>
      </section>
    `;
  }

  render() {
    if (this.loading) {
      return `
        <section class="max-w-6xl mx-auto px-6 py-16">
          <div class="h-10 w-56 bg-slate-100 rounded-2xl animate-pulse mb-6"></div>
          <div class="space-y-3">
            ${Array(6).fill('<div class="h-4 bg-slate-100 rounded-full animate-pulse"></div>').join("")}
          </div>
        </section>
      `;
    }

    if (this.error) {
      return `
        <section class="max-w-3xl mx-auto px-6 py-20 text-center">
          <h1 class="text-3xl font-black text-slate-900 mb-3">Contact Us</h1>
          <p class="text-slate-500 mb-6">${this.error}</p>
          <a href="/" class="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-slate-900 text-white text-sm font-semibold hover:bg-slate-800 transition">Back to home</a>
        </section>
      `;
    }

    const hours = this.getBusinessHours();
    const whatsapp = this.contactSettings.admin_whatsapp || this.contactSettings.phone_number || "";
    const email = this.contactSettings.contact_email || "info@store.com";
    const phone = this.contactSettings.phone_number || "";
    const address = this.contactSettings.contact_address || "";
    const mapUrl = this.getMapUrl();

    return `
      <section class="max-w-6xl mx-auto px-6 py-12">
        ${this.renderHero()}

        <div class="grid grid-cols-1 lg:grid-cols-[1.1fr_1fr] gap-10">
          <div class="space-y-6">
            <div class="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm">
              <h2 class="text-xl font-black text-slate-900 mb-2">Get in Touch</h2>
              <p class="text-sm text-slate-500 mb-6">Have questions about our products or services? Reach out using any of these channels.</p>
              <div class="space-y-4">
                <div class="flex items-center gap-4 rounded-2xl bg-emerald-50 border border-emerald-100 p-4">
                  <div class="size-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center">
                    <i class="fab fa-whatsapp"></i>
                  </div>
                  <div>
                    <p class="text-sm font-semibold text-slate-900">WhatsApp</p>
                    <p class="text-xs text-slate-500">${whatsapp || "Not configured"}</p>
                  </div>
                </div>
                <div class="flex items-center gap-4 rounded-2xl bg-slate-50 border border-slate-100 p-4">
                  <div class="size-10 rounded-xl bg-slate-900 text-white flex items-center justify-center">
                    <i class="fas fa-envelope"></i>
                  </div>
                  <div>
                    <p class="text-sm font-semibold text-slate-900">Email</p>
                    <p class="text-xs text-slate-500">${email}</p>
                  </div>
                </div>
                <div class="flex items-center gap-4 rounded-2xl bg-indigo-50 border border-indigo-100 p-4">
                  <div class="size-10 rounded-xl bg-indigo-500 text-white flex items-center justify-center">
                    <i class="fas fa-phone"></i>
                  </div>
                  <div>
                    <p class="text-sm font-semibold text-slate-900">Phone</p>
                    <p class="text-xs text-slate-500">${phone || "Not configured"}</p>
                  </div>
                </div>
                ${address ? `
                <div class="flex items-center gap-4 rounded-2xl bg-amber-50 border border-amber-100 p-4">
                  <div class="size-10 rounded-xl bg-amber-500 text-white flex items-center justify-center">
                    <i class="fas fa-map-marker-alt"></i>
                  </div>
                  <div>
                    <p class="text-sm font-semibold text-slate-900">Address</p>
                    <p class="text-xs text-slate-500">${address}</p>
                  </div>
                </div>` : ""}
              </div>
            </div>

            <div class="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm">
              <h3 class="text-lg font-black text-slate-900 mb-4">Business Hours</h3>
              <div class="space-y-3 text-sm text-slate-600">
                ${hours.map((h) => `<div class="flex items-center justify-between border-b border-slate-100 pb-2"><span class="font-semibold text-slate-700">${h.label}</span><span>${h.value}</span></div>`).join("")}
              </div>
            </div>
          </div>

          <div class="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm">
            <h2 class="text-xl font-black text-slate-900 mb-4">Send us a message</h2>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <ui-input value="${this.form.name}" placeholder="Name" oninput="this.closest('app-public-contact-page').form.name = this.value"></ui-input>
              <ui-input type="email" value="${this.form.email}" placeholder="Email" oninput="this.closest('app-public-contact-page').form.email = this.value"></ui-input>
            </div>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
              <ui-input value="${this.form.phone}" placeholder="Phone (optional)" oninput="this.closest('app-public-contact-page').form.phone = this.value"></ui-input>
              <ui-input value="${this.form.subject}" placeholder="Subject" oninput="this.closest('app-public-contact-page').form.subject = this.value"></ui-input>
            </div>
            <div class="mt-4">
              <ui-textarea rows="5" placeholder="Message" value="${this.form.message}" oninput="this.closest('app-public-contact-page').form.message = this.value"></ui-textarea>
            </div>
            <div class="mt-6">
              <ui-button class="w-full" onclick="this.closest('app-public-contact-page').submitForm()">Send Message</ui-button>
            </div>
            ${whatsapp ? `
              <div class="mt-4 text-center text-xs text-slate-500">Alternatively, contact us directly via WhatsApp</div>
              <div class="mt-2">
                <a href="https://api.whatsapp.com/send?phone=${encodeURIComponent(whatsapp)}&text=${encodeURIComponent("Hello! I have a question about your store.")}" target="_blank" class="w-full inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-emerald-500 text-white text-sm font-semibold hover:bg-emerald-600 transition">
                  <i class="fab fa-whatsapp"></i> WhatsApp Chat
                </a>
              </div>
            ` : ""}
          </div>
        </div>

        ${mapUrl ? `
          <div class="mt-16">
            <h2 class="text-2xl font-black text-slate-900 mb-4 text-center">Our Locations</h2>
            <p class="text-sm text-slate-500 text-center mb-8">Visit us at one of our convenient locations.</p>
            <div class="rounded-3xl overflow-hidden border border-slate-100 shadow-lg">
              <iframe src="${mapUrl}" width="100%" height="420" style="border:0" allowfullscreen="" loading="lazy"></iframe>
            </div>
          </div>
        ` : ""}

        ${this.faqs.length ? `
          <div class="mt-16">
            <h2 class="text-2xl font-black text-slate-900 mb-4 text-center">Frequently Asked Questions</h2>
            <p class="text-sm text-slate-500 text-center mb-8">Answers to some common questions our customers ask.</p>
            <div class="bg-white border border-slate-100 rounded-3xl p-4 sm:p-6 shadow-sm">
              <ui-accordion>
                ${this.faqs.map((f) => `
                  <ui-accordion-item title="${(f.question || "").replace(/"/g, "&quot;")}">
                    <div class="text-sm text-slate-600 leading-relaxed">${f.answer || ""}</div>
                  </ui-accordion-item>
                `).join("")}
              </ui-accordion>
            </div>
          </div>
        ` : ""}
      </section>
    `;
  }

  updateView() {
    const next = this.render();
    if (next === this._lastRendered) return;
    this._lastRendered = next;
    this.innerHTML = next;
  }
}

customElements.define("app-public-contact-page", PublicContactPage);
export default PublicContactPage;
