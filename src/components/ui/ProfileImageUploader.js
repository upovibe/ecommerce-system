/**
 * Profile Image Uploader Component
 * 
 * A specialized component for uploading and previewing profile images.
 * Supports:
 * - Image preview with circular crop
 * - Drag and drop functionality
 * - File validation (image types, size limits)
 * - Upload progress indication
 * - Fallback to initials when no image
 * 
 * Attributes:
 * - src: current image source URL
 * - name: name for initials fallback
 * - size: 'sm' | 'md' | 'lg' | 'xl' (default: 'lg')
 * - accept: accepted file types (default: 'image/*')
 * - max-size: maximum file size in MB (default: '5')
 * - disabled: disable upload functionality
 * 
 * Events:
 * - change: fired when image is selected/uploaded
 * - error: fired when upload fails
 * 
 * Usage:
 * <ui-profile-image-uploader src="/path/to/image.jpg" name="John Doe" size="lg"></ui-profile-image-uploader>
 */
class ProfileImageUploader extends HTMLElement {
    constructor() {
        super();
        
        // Create the main container element
        this.container = document.createElement('div');
        this.previewContainer = document.createElement('div');
        this.uploadOverlay = document.createElement('div');
        this.confirmButton = document.createElement('button');
        this.fileInput = document.createElement('input');
        this.progressBar = document.createElement('div');
        
        // Flag to prevent double processing
        this.initialized = false;
        
        // State management
        this.isDragOver = false;
        this.isUploading = false;
        this.currentImage = null;
        this.pendingFile = null;
        this.showConfirmButton = false;
        
        // Add elements to the component
        this.container.appendChild(this.previewContainer);
        this.container.appendChild(this.uploadOverlay);
        this.container.appendChild(this.confirmButton);
        this.container.appendChild(this.fileInput);
        this.container.appendChild(this.progressBar);
        this.appendChild(this.container);
        
        // Add default styles via CSS
        this.addDefaultStyles();
    }

    // Add default CSS styles to document if not already added
    addDefaultStyles() {
        if (!document.getElementById('upo-ui-profile-image-uploader-styles')) {
            const style = document.createElement('style');
            style.id = 'upo-ui-profile-image-uploader-styles';
            style.textContent = `
                .upo-profile-image-uploader {
                    position: relative;
                    display: block;
                    cursor: pointer;
                    width: 100%;
                    height: 100%;
                    aspect-ratio: 1;
                }
                
                .upo-profile-image-uploader[disabled] {
                    cursor: not-allowed;
                    opacity: 0.6;
                }
                
                .upo-profile-image-preview {
                    position: relative;
                    border-radius: 50%;
                    overflow: hidden;
                    background-color: #e5e7eb;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: all 0.2s ease;
                    width: 100%;
                    height: 100%;
                    aspect-ratio: 1;
                }
                
                .upo-profile-image-uploader:hover .upo-profile-image-preview {
                    transform: scale(1.05);
                }
                
                .upo-profile-image-uploader[disabled]:hover .upo-profile-image-preview {
                    transform: none;
                }
                
                .upo-profile-image-preview-sm {
                    font-size: 1rem;
                }
                
                .upo-profile-image-preview-md {
                    font-size: 1.5rem;
                }
                
                .upo-profile-image-preview-lg {
                    font-size: 2rem;
                }
                
                .upo-profile-image-preview-xl {
                    font-size: 2.5rem;
                }
                
                .upo-profile-image-preview img {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                    display: block;
                }
                
                .upo-profile-image-initials {
                    width: 100%;
                    height: 100%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background-color: #e5e7eb;
                    color: #374151;
                    font-weight: 500;
                    text-align: center;
                    line-height: 1;
                }
                
                .upo-profile-image-upload-overlay {
                    position: absolute;
                    inset: 0;
                    background: rgba(0, 0, 0, 0.5);
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    opacity: 0;
                    transition: opacity 0.2s ease;
                    pointer-events: none;
                }
                
                .upo-profile-image-uploader:hover .upo-profile-image-upload-overlay {
                    opacity: 1;
                    pointer-events: auto;
                }
                
                .upo-profile-image-uploader[disabled] .upo-profile-image-upload-overlay {
                    display: none;
                }
                
                .upo-profile-image-upload-icon {
                    color: white;
                    width: 1.5rem;
                    height: 1.5rem;
                }
                
                .upo-profile-image-confirm-button {
                    position: absolute;
                    bottom: 0.01rem;
                    right: 0.01rem;
                    width: 5rem;
                    height: 5rem;
                    background: #10b981;
                    border: 2px solid white;
                    border-radius: 50%;
                    color: white;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    opacity: 0;
                    transform: scale(0.8);
                    transition: all 0.2s ease;
                    z-index: 10;
                    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
                }
                
                /* Mobile styles for confirm button */
                @media (max-width: 768px) {
                    .upo-profile-image-confirm-button {
                        bottom: -0.5rem;
                        right: -0.5rem;
                        width: 3rem;
                        height: 3rem;
                    }
                }
                
                .upo-profile-image-confirm-button:hover {
                    background: #059669;
                    transform: scale(1.1);
                }
                
                .upo-profile-image-confirm-button[data-visible="true"] {
                    opacity: 1;
                    transform: scale(1);
                }
                
                .upo-profile-image-confirm-button[disabled] {
                    opacity: 0.5;
                    cursor: not-allowed;
                }
                
                .upo-profile-image-confirm-button svg {
                    width: 1.25rem;
                    height: 1.25rem;
                }
                
                .upo-profile-image-confirm-button.loading {
                    background: #3b82f6;
                    animation: pulse 2s infinite;
                }
                
                .upo-profile-image-confirm-button.success {
                    background: #10b981;
                    animation: bounce 0.6s ease-in-out;
                }
                
                .upo-profile-image-confirm-button.error {
                    background: #ef4444;
                    animation: shake 0.5s ease-in-out;
                }
                
                @keyframes pulse {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.7; }
                }
                
                @keyframes bounce {
                    0%, 20%, 53%, 80%, 100% { transform: translate3d(0,0,0); }
                    40%, 43% { transform: translate3d(0,-8px,0); }
                    70% { transform: translate3d(0,-4px,0); }
                    90% { transform: translate3d(0,-2px,0); }
                }
                
                @keyframes shake {
                    0%, 100% { transform: translateX(0); }
                    10%, 30%, 50%, 70%, 90% { transform: translateX(-2px); }
                    20%, 40%, 60%, 80% { transform: translateX(2px); }
                }
                
                .upo-profile-image-preview-lg .upo-profile-image-upload-icon {
                    width: 2rem;
                    height: 2rem;
                }
                
                .upo-profile-image-preview-xl .upo-profile-image-upload-icon {
                    width: 2.5rem;
                    height: 2.5rem;
                }
                
                .upo-profile-image-file-input {
                    position: absolute;
                    opacity: 0;
                    width: 100%;
                    height: 100%;
                    cursor: pointer;
                }
                
                .upo-profile-image-file-input:disabled {
                    cursor: not-allowed;
                }
                
                .upo-profile-image-progress {
                    position: absolute;
                    bottom: -0.5rem;
                    left: 50%;
                    transform: translateX(-50%);
                    width: 80%;
                    height: 0.25rem;
                    background: rgba(0, 0, 0, 0.1);
                    border-radius: 0.125rem;
                    overflow: hidden;
                    opacity: 0;
                    transition: opacity 0.2s ease;
                }
                
                .upo-profile-image-progress[data-uploading="true"] {
                    opacity: 1;
                }
                
                .upo-profile-image-progress-bar {
                    height: 100%;
                    background: #3b82f6;
                    width: 0%;
                    transition: width 0.3s ease;
                }
                
                .upo-profile-image-uploader.drag-over .upo-profile-image-preview {
                    transform: scale(1.1);
                    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.3);
                }
            `;
            document.head.appendChild(style);
        }
    }

    static get observedAttributes() {
        return ['src', 'name', 'size', 'accept', 'max-size', 'disabled'];
    }

    get size() {
        return this.getAttribute('size') || 'lg';
    }

    get name() {
        return this.getAttribute('name') || '';
    }

    get accept() {
        return this.getAttribute('accept') || 'image/*';
    }

    get maxSize() {
        return parseInt(this.getAttribute('max-size')) || 5; // 5MB default
    }

    get disabled() {
        return this.hasAttribute('disabled');
    }

    getInitials(name) {
        if (!name) return '';
        
        return name
            .split(' ')
            .map(word => word.charAt(0))
            .join('')
            .toUpperCase()
            .slice(0, 2);
    }

    connectedCallback() {
        // Prevent double processing
        if (this.initialized) return;
        this.initialized = true;

        // Set up the component structure
        this.setupComponent();
        this.updateDisplay();
        this.setupEventListeners();
    }

    setupComponent() {
        // Set up container
        this.container.className = 'upo-profile-image-uploader';
        if (this.disabled) {
            this.container.setAttribute('disabled', '');
        }

        // Set up preview container
        this.previewContainer.className = `upo-profile-image-preview upo-profile-image-preview-${this.size}`;

        // Set up upload overlay
        this.uploadOverlay.className = 'upo-profile-image-upload-overlay';
        this.uploadOverlay.innerHTML = `
            <svg class="upo-profile-image-upload-icon" width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M23 19C23 19.5304 22.7893 20.0391 22.4142 20.4142C22.0391 20.7893 21.5304 21 21 21H3C2.46957 21 1.96086 20.7893 1.58579 20.4142C1.21071 20.0391 1 19.5304 1 19V8C1 7.46957 1.21071 6.96086 1.58579 6.58579C1.96086 6.21071 2.46957 6 3 6H7L9 3H15L17 6H21C21.5304 6 22.0391 6.21071 22.4142 6.58579C22.7893 6.96086 23 7.46957 23 8V19Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M12 17C14.2091 17 16 15.2091 16 13C16 10.7909 14.2091 9 12 9C9.79086 9 8 10.7909 8 13C8 15.2091 9.79086 17 12 17Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
        `;

        // Set up confirm button
        this.confirmButton.className = 'upo-profile-image-confirm-button';
        this.confirmButton.innerHTML = `
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M21 15V19A2 2 0 0 1 19 21H5A2 2 0 0 1 3 19V15" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M7 10L12 15L17 10" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M12 15V3" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
        `;
        this.confirmButton.setAttribute('data-visible', 'false');
        this.confirmButton.disabled = true;

        // Set up file input
        this.fileInput.className = 'upo-profile-image-file-input';
        this.fileInput.type = 'file';
        this.fileInput.accept = this.accept;
        this.fileInput.disabled = this.disabled;

        // Set up progress bar
        this.progressBar.className = 'upo-profile-image-progress';
        this.progressBar.innerHTML = '<div class="upo-profile-image-progress-bar"></div>';
    }

    updateDisplay() {
        const src = this.getAttribute('src');
        
        if (src && src !== 'null' && src !== 'undefined') {
            // Show image
            this.previewContainer.innerHTML = `
                <img src="${src}" alt="Profile" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
                <div class="upo-profile-image-initials" style="display: none;">
                    ${this.getInitials(this.name)}
                </div>
            `;
        } else {
            // Show initials
            this.previewContainer.innerHTML = `
                <div class="upo-profile-image-initials">
                    ${this.getInitials(this.name)}
                </div>
            `;
        }
    }

    setupEventListeners() {
        // File input change
        this.fileInput.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                this.handleFileSelect(e.target.files[0]);
            }
        });

        // Drag and drop events
        this.container.addEventListener('dragover', (e) => {
            e.preventDefault();
            if (!this.disabled) {
                this.isDragOver = true;
                this.container.classList.add('drag-over');
            }
        });

        this.container.addEventListener('dragleave', (e) => {
            e.preventDefault();
            if (!e.relatedTarget || !this.container.contains(e.relatedTarget)) {
                this.isDragOver = false;
                this.container.classList.remove('drag-over');
            }
        });

        this.container.addEventListener('drop', (e) => {
            e.preventDefault();
            this.isDragOver = false;
            this.container.classList.remove('drag-over');
            
            if (!this.disabled && e.dataTransfer.files.length > 0) {
                this.handleFileSelect(e.dataTransfer.files[0]);
            }
        });

        // Click to upload
        this.container.addEventListener('click', (e) => {
            if (!this.disabled && e.target !== this.fileInput && e.target !== this.confirmButton) {
                this.fileInput.click();
            }
        });

        // Confirm button click
        this.confirmButton.addEventListener('click', (e) => {
            e.stopPropagation();
            if (this.pendingFile && !this.confirmButton.disabled) {
                this.uploadFile();
            }
        });
    }

    async handleFileSelect(file) {
        // Validate file type
        if (!file.type.startsWith('image/')) {
            this.dispatchEvent(new CustomEvent('error', {
                detail: { message: 'Please select an image file.' }
            }));
            return;
        }

        // Validate file size
        const maxSizeBytes = this.maxSize * 1024 * 1024; // Convert MB to bytes
        if (file.size > maxSizeBytes) {
            this.dispatchEvent(new CustomEvent('error', {
                detail: { message: `File size must be less than ${this.maxSize}MB.` }
            }));
            return;
        }

        // Store the pending file
        this.pendingFile = file;

        // Show preview
        await this.showPreview(file);

        // Show confirm button
        this.showConfirmButton = true;
        this.confirmButton.setAttribute('data-visible', 'true');
        this.confirmButton.disabled = false;

        // Dispatch preview event
        this.dispatchEvent(new CustomEvent('preview', {
            detail: { file, preview: this.currentImage }
        }));
    }

    async showPreview(file) {
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                this.currentImage = e.target.result;
                this.previewContainer.innerHTML = `
                    <img src="${this.currentImage}" alt="Profile Preview">
                `;
                resolve();
            };
            reader.readAsDataURL(file);
        });
    }

    setUploadProgress(progress) {
        this.isUploading = progress > 0 && progress < 100;
        this.progressBar.setAttribute('data-uploading', this.isUploading);
        
        const progressBar = this.progressBar.querySelector('.upo-profile-image-progress-bar');
        if (progressBar) {
            progressBar.style.width = `${progress}%`;
        }
    }

    confirmUpload() {
        if (this.pendingFile) {
            // Show loading state
            this.setLoadingState(true);
            
            // Dispatch change event for actual upload
            this.dispatchEvent(new CustomEvent('change', {
                detail: { file: this.pendingFile, preview: this.currentImage }
            }));
        }
    }

    // Method to be called from parent component to handle upload
    async uploadFile() {
        if (!this.pendingFile) {
            return;
        }

        try {
            this.setLoadingState(true);
            
            // Create FormData
            const formData = new FormData();
            formData.append('profile_image', this.pendingFile);
            
            // Get user ID from parent component or localStorage
            const userData = JSON.parse(localStorage.getItem('userData') || '{}');
            const userId = userData.id;
            const token = localStorage.getItem('token');
            
            if (!userId || !token) {
                throw new Error('User not authenticated');
            }
            
            // Upload the file
            const response = await fetch(`/api/users/${userId}/upload-profile-image`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Upload failed');
            }
            
            const result = await response.json();
            
            // Show success state
            this.setSuccessState();
            
            // Update the image source with proper URL construction
            const imageUrl = this.constructImageUrl(result.image_url);
            this.setImage(imageUrl);
            
            // Dispatch success event
            this.dispatchEvent(new CustomEvent('upload-success', {
                detail: { result, file: this.pendingFile }
            }));
            
        } catch (error) {
            this.setErrorState();
            
            // Dispatch error event
            this.dispatchEvent(new CustomEvent('upload-error', {
                detail: { error: error.message }
            }));
        }
    }

    setLoadingState(isLoading) {
        if (isLoading) {
            // Show spinning icon
            this.confirmButton.innerHTML = `
                <svg class="animate-spin" width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="32" stroke-dashoffset="32">
                        <animate attributeName="stroke-dashoffset" dur="1s" values="32;0;32" repeatCount="indefinite"/>
                    </path>
                </svg>
            `;
            this.confirmButton.disabled = true;
            this.confirmButton.classList.add('loading');
        } else {
            // Reset to normal state
            this.confirmButton.innerHTML = `
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M21 15V19A2 2 0 0 1 19 21H5A2 2 0 0 1 3 19V15" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    <path d="M7 10L12 15L17 10" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    <path d="M12 15V3" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
            `;
            this.confirmButton.disabled = false;
            this.confirmButton.classList.remove('loading');
        }
    }

    setSuccessState() {
        // First, reset loading state
        this.setLoadingState(false);
        
        // Show success icon briefly
        this.confirmButton.innerHTML = `
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M20 6L9 17L4 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="currentColor"/>
            </svg>
        `;
        this.confirmButton.classList.add('success');
        
        // Hide button after success
        setTimeout(() => {
            this.showConfirmButton = false;
            this.confirmButton.setAttribute('data-visible', 'false');
            this.confirmButton.disabled = true;
            this.confirmButton.classList.remove('success');
            this.pendingFile = null;
        }, 1500);
    }

    setErrorState() {
        // First, reset loading state
        this.setLoadingState(false);
        
        // Show error icon briefly
        this.confirmButton.innerHTML = `
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
        `;
        this.confirmButton.classList.add('error');
        
        // Reset to normal state after error
        setTimeout(() => {
            this.confirmButton.classList.remove('error');
            // Reset to initial state
            this.resetUploaderState();
        }, 2000);
    }

    resetUploaderState() {
        // Reset all states
        this.showConfirmButton = false;
        this.confirmButton.setAttribute('data-visible', 'false');
        this.confirmButton.disabled = true;
        this.confirmButton.classList.remove('loading', 'success', 'error');
        this.pendingFile = null;
        this.currentImage = null;
        
        // Reset progress
        this.setUploadProgress(0);
        
        // Reset button to normal state
        this.confirmButton.innerHTML = `
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M21 15V19A2 2 0 0 1 19 21H5A2 2 0 0 1 3 19V15" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M7 10L12 15L17 10" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M12 15V3" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
        `;
    }

    // Helper method to construct proper image URL
    constructImageUrl(imagePath) {
        if (!imagePath) return ''; // Return empty string instead of null
        
        // If it's already a full URL, return as is
        if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
            return imagePath;
        }
        
        // If it's a relative path starting with /, construct the full URL
        if (imagePath.startsWith('/')) {
            const baseUrl = window.location.origin;
            return baseUrl + imagePath;
        }
        
        // If it's a relative path without /, construct the URL with /api/ prefix
        const baseUrl = window.location.origin;
        const apiPath = '/api';
        return baseUrl + apiPath + '/' + imagePath;
    }

    setImage(src) {
        this.setAttribute('src', src);
        this.updateDisplay();
    }

    clear() {
        this.removeAttribute('src');
        this.currentImage = null;
        this.updateDisplay();
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue !== newValue && this.initialized) {
            if (name === 'src') {
                this.updateDisplay();
            } else if (name === 'disabled') {
                this.container.toggleAttribute('disabled', this.disabled);
                this.fileInput.disabled = this.disabled;
            }
        }
    }
}

customElements.define('ui-profile-image-uploader', ProfileImageUploader);
export default ProfileImageUploader; 