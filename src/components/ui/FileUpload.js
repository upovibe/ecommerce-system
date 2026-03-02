class FileUpload extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.files = [];
    this.isDragOver = false;
    this.uploadProgress = {};
  }

  connectedCallback() {
    this.render();
    this.setupEventListeners();
    
    // If there's a value attribute set, process it after the component is ready
    const value = this.getAttribute('value');
    if (value) {
      // Use a small delay to ensure shadow DOM is ready
      setTimeout(() => {
        this.setValue(value);
      }, 10);
    }
  }

  static get observedAttributes() {
    return ['multiple', 'accept', 'max-size', 'max-files', 'disabled', 'status', 'value'];
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (oldValue !== newValue) {
      if (name === 'value') {
        if (newValue) {
          this.setValue(newValue);
        } else {
          // Clear files if value is empty
          this.files = [];
          this.updateFileList();
        }
      } else {
        this.render();
        this.setupEventListeners();
      }
    }
  }

  render() {
    const multiple = this.hasAttribute('multiple');
    const accept = this.getAttribute('accept') || '';
    const maxSize = this.getAttribute('max-size') || '';
    const maxFiles = this.getAttribute('max-files') || '';
    const disabled = this.hasAttribute('disabled');
    const status = this.getAttribute('status') || '';

    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }

        .file-upload {
          border: 2px dashed #d1d5db;
          border-radius: 0.5rem;
          padding: 1rem;
          text-align: center;
          background: #f9fafb;
          transition: all 0.2s ease;
          cursor: pointer;
          position: relative;
          min-height: 120px;
          max-height: 200px;
          overflow: hidden;
        }

        .file-upload:hover:not(.disabled) {
          border-color: #3b82f6;
          background: #eff6ff;
        }

        .file-upload.drag-over {
          border-color: #3b82f6;
          background: #dbeafe;
          transform: scale(1.02);
        }

        .file-upload.disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .file-upload.success {
          border-color: #10b981;
          background: #ecfdf5;
        }

        .file-upload.warning {
          border-color: #f59e0b;
          background: #fffbeb;
        }

        .file-upload.error {
          border-color: #ef4444;
          background: #fef2f2;
        }

        .file-upload.info {
          border-color: #3b82f6;
          background: #eff6ff;
        }

        .upload-icon {
          width: 2rem;
          height: 2rem;
          margin: 0 auto 0.5rem;
          color: #6b7280;
        }

        .upload-icon svg {
          width: 100%;
          height: 100%;
        }

        .upload-text {
          margin-bottom: 0.25rem;
          font-size: 0.875rem;
          font-weight: 500;
          color: #374151;
        }

        .upload-hint {
          font-size: 0.75rem;
          color: #6b7280;
          margin-bottom: 0.5rem;
        }

        .file-input {
          position: absolute;
          opacity: 0;
          width: 100%;
          height: 100%;
          cursor: pointer;
        }

        .file-input:disabled {
          cursor: not-allowed;
        }

        .file-list {
          margin-top: 0.5rem;
          text-align: left;
          display: flex;
          flex-wrap: wrap;
          gap: 0.25rem;
          max-height: 100px;
          overflow-y: auto;
        }

        .file-item {
          display: flex;
          flex-direction: column;
          position: relative;
          padding: 0.5rem;
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 0.25rem;
          transition: all 0.2s ease;
          width: 80px;
          height: 80px;
          flex-shrink: 0;
          align-items: center;
          justify-content: center;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }

        .file-item:hover {
          border-color: #d1d5db;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }

        .file-icon {
          width: 1.5rem;
          height: 1.5rem;
          color: #6b7280;
          flex-shrink: 0;
          margin-bottom: 0.25rem;
        }

        .file-info {
          flex: 1;
          min-width: 0;
          overflow: hidden;
          text-align: center;
          width: 100%;
        }

        .file-name {
          font-weight: 500;
          color: #374151;
          margin-bottom: 0.125rem;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          font-size: 0.75rem;
          max-width: 100%;
          text-align: center;
        }

        .file-size {
          font-size: 0.5rem;
          color: #6b7280;
        }

        .file-actions {
          position: absolute;
          top: 0.125rem;
          right: 0.125rem;
          z-index: 10;
        }

        .remove-btn {
          background: rgba(255, 255, 255, 0.9);
          border: none;
          color: #ef4444;
          cursor: pointer;
          padding: 0.125rem;
          border-radius: 50%;
          transition: all 0.2s ease;
          position: relative;
          z-index: 10;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 1.25rem;
          height: 1.25rem;
          justify-content: center;
        }

        .remove-btn:hover {
          background: #fef2f2;
        }

        .progress-bar {
          width: 100%;
          height: 0.25rem;
          background: #e5e7eb;
          border-radius: 0.125rem;
          overflow: hidden;
          margin-top: 0.5rem;
        }

        .progress-fill {
          height: 100%;
          background: #3b82f6;
          transition: width 0.3s ease;
        }

        .error-message {
          color: #ef4444;
          font-size: 0.875rem;
          margin-top: 0.5rem;
        }

        .success-message {
          color: #10b981;
          font-size: 0.875rem;
          margin-top: 0.5rem;
        }

        .warning-message {
          color: #f59e0b;
          font-size: 0.875rem;
          margin-top: 0.5rem;
        }

        .info-message {
          color: #3b82f6;
          font-size: 0.875rem;
          margin-top: 0.5rem;
        }
      </style>

      <div class="file-upload ${disabled ? 'disabled' : ''} ${status}">
        <div class="upload-icon">
          <svg fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 6.707a1 1 0 010-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 5.414V13a1 1 0 11-2 0V5.414L7.707 6.707a1 1 0 01-1.414 0z" clip-rule="evenodd"></path>
          </svg>
        </div>
        
        <div class="upload-text">
          ${this.getAttribute('text') || 'Drop files here or click to upload'}
        </div>
        
        <div class="upload-hint">
          ${this.getUploadHint(accept, maxSize, maxFiles)}
        </div>

        <input 
          type="file" 
          class="file-input" 
          ${multiple ? 'multiple' : ''} 
          ${accept ? `accept="${accept}"` : ''}
          ${disabled ? 'disabled' : ''}
        >

        <div class="file-list" id="fileList"></div>
      </div>
    `;
  }

  getUploadHint(accept, maxSize, maxFiles) {
    let hint = '';
    
    if (accept) {
      const types = accept.split(',').map(t => t.trim().replace('*', ''));
      hint += `Accepted formats: ${types.join(', ')}`;
    }
    
    if (maxSize) {
      if (hint) hint += ' • ';
      hint += `Max size: ${this.formatFileSize(maxSize)}`;
    }
    
    if (maxFiles) {
      if (hint) hint += ' • ';
      hint += `Max files: ${maxFiles}`;
    }
    
    return hint || 'All file types accepted';
  }

  setupEventListeners() {
    const uploadArea = this.shadowRoot.querySelector('.file-upload');
    const fileInput = this.shadowRoot.querySelector('.file-input');

    // Click to upload
    uploadArea.addEventListener('click', (e) => {
      // Don't trigger file input if clicking on file items or remove buttons
      if (e.target.closest('.file-item') || e.target.closest('.remove-btn')) {
        return;
      }
      
      if (!this.hasAttribute('disabled') && e.target !== fileInput) {
        fileInput.click();
      }
    });

    // File input change
    fileInput.addEventListener('change', (e) => {
      this.handleFiles(e.target.files);
    });

    // Drag and drop
    uploadArea.addEventListener('dragover', (e) => {
      e.preventDefault();
      if (!this.hasAttribute('disabled')) {
        this.isDragOver = true;
        uploadArea.classList.add('drag-over');
      }
    });

    uploadArea.addEventListener('dragleave', (e) => {
      e.preventDefault();
      if (!e.relatedTarget || !uploadArea.contains(e.relatedTarget)) {
        this.isDragOver = false;
        uploadArea.classList.remove('drag-over');
      }
    });

    uploadArea.addEventListener('drop', (e) => {
      e.preventDefault();
      this.isDragOver = false;
      uploadArea.classList.remove('drag-over');
      
      if (!this.hasAttribute('disabled')) {
        this.handleFiles(e.dataTransfer.files);
      }
    });
  }

  handleFiles(fileList) {
    const files = Array.from(fileList);
    const maxFiles = parseInt(this.getAttribute('max-files')) || Infinity;
    const maxSize = parseInt(this.getAttribute('max-size')) || Infinity;
    const accept = this.getAttribute('accept');

    // Check max files
    if (this.files.length + files.length > maxFiles) {
      this.showError(`Maximum ${maxFiles} files allowed`);
      return;
    }

    // Validate each file
    const validFiles = files.filter(file => {
      // Check file size
      if (file.size > maxSize) {
        this.showError(`${file.name} is too large. Max size: ${this.formatFileSize(maxSize)}`);
        return false;
      }

      // Check file type
      if (accept) {
        const acceptedTypes = accept.split(',').map(t => t.trim());
        const isValidType = acceptedTypes.some(type => {
          if (type.startsWith('.')) {
            return file.name.toLowerCase().endsWith(type.toLowerCase());
          }
          return file.type.match(new RegExp(type.replace('*', '.*')));
        });
        
        if (!isValidType) {
          this.showError(`${file.name} is not an accepted file type`);
          return false;
        }
      }

      return true;
    });

    // Add valid files
    validFiles.forEach(file => {
      this.files.push(file);
      this.uploadProgress[file.name] = 0;
    });

    this.updateFileList();
    this.dispatchEvent(new CustomEvent('files-changed', {
      detail: { files: this.files }
    }));
  }

  updateFileList() {
    const fileList = this.shadowRoot.querySelector('#fileList');
    if (!fileList) return;
    
    fileList.innerHTML = '';

    this.files.forEach((file, index) => {
      const fileItem = document.createElement('div');
      fileItem.className = 'file-item';
      
      // Check if this is an existing file
      const isExisting = file.isExisting;
      
      fileItem.innerHTML = `
        <div class="file-actions">
          <button class="remove-btn" data-index="${index}">
            <svg width="10" height="10" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"></path>
            </svg>
          </button>
        </div>
        
        <div class="file-icon">
          ${this.getFileIcon(file)}
        </div>
        
        <div class="file-info">
          <div class="file-name">${file.name}</div>
          <div class="file-size">${isExisting ? 'Existing file' : this.formatFileSize(file.size)}</div>
          ${this.uploadProgress[file.name] > 0 ? `
            <div class="progress-bar">
              <div class="progress-fill" style="width: ${this.uploadProgress[file.name]}%"></div>
            </div>
          ` : ''}
        </div>
      `;

      fileList.appendChild(fileItem);
    });

    // Add remove event listeners
    fileList.querySelectorAll('.remove-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        const index = parseInt(btn.dataset.index);
        this.removeFile(index);
      });
    });
  }

  removeFile(index) {
    const file = this.files[index];
    this.files.splice(index, 1);
    delete this.uploadProgress[file.name];
    
    this.updateFileList();
    this.dispatchEvent(new CustomEvent('files-changed', {
      detail: { files: this.files }
    }));
  }

  setUploadProgress(fileName, progress) {
    this.uploadProgress[fileName] = progress;
    this.updateFileList();
  }

  showError(message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.textContent = message;
    
    const uploadArea = this.shadowRoot.querySelector('.file-upload');
    uploadArea.appendChild(errorDiv);
    
    setTimeout(() => {
      errorDiv.remove();
    }, 5000);
  }

  // Get appropriate icon based on file type
  getFileIcon(file) {
    const isExisting = file.isExisting;
    const fileType = file.type || '';
    const fileName = file.name || '';
    const extension = fileName.split('.').pop()?.toLowerCase() || '';
    
    // For existing files, determine icon based on file type/extension
    if (isExisting) {
      // Image files
      if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp'].includes(extension) || 
          fileType.startsWith('image/')) {
        return `
          <svg fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clip-rule="evenodd"></path>
          </svg>
        `;
      }
      
      // PDF files
      if (extension === 'pdf' || fileType === 'application/pdf') {
        return `
          <svg fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clip-rule="evenodd"></path>
          </svg>
        `;
      }
      
      // Word documents
      if (['doc', 'docx'].includes(extension) || 
          fileType.includes('word') || fileType.includes('document')) {
        return `
          <svg fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clip-rule="evenodd"></path>
          </svg>
        `;
      }
      
      // Excel files
      if (['xls', 'xlsx'].includes(extension) || 
          fileType.includes('excel') || fileType.includes('spreadsheet')) {
        return `
          <svg fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clip-rule="evenodd"></path>
          </svg>
        `;
      }
      
      // PowerPoint files
      if (['ppt', 'pptx'].includes(extension) || 
          fileType.includes('powerpoint') || fileType.includes('presentation')) {
        return `
          <svg fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clip-rule="evenodd"></path>
          </svg>
        `;
      }
      
      // Text files
      if (extension === 'txt' || fileType === 'text/plain') {
        return `
          <svg fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clip-rule="evenodd"></path>
          </svg>
        `;
      }
      
      // Video files
      if (['mp4', 'avi', 'mov', 'wmv', 'flv', 'webm'].includes(extension) || 
          fileType.startsWith('video/')) {
        return `
          <svg fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" clip-rule="evenodd"></path>
          </svg>
        `;
      }
      
      // Audio files
      if (['mp3', 'wav', 'ogg', 'aac', 'flac'].includes(extension) || 
          fileType.startsWith('audio/')) {
        return `
          <svg fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.617.793L4.5 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.5l3.883-2.793A1 1 0 019.383 3.076zM12.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-4.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657z" clip-rule="evenodd"></path>
          </svg>
        `;
      }
      
      // Archive files
      if (['zip', 'rar', '7z', 'tar', 'gz'].includes(extension) || 
          fileType.includes('archive') || fileType.includes('compressed')) {
        return `
          <svg fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clip-rule="evenodd"></path>
          </svg>
        `;
      }
      
      // Default file icon for other types
      return `
        <svg fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clip-rule="evenodd"></path>
        </svg>
      `;
    }
    
    // For new files (not existing), show generic file icon
    return `
      <svg fill="currentColor" viewBox="0 0 20 20">
        <path fill-rule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clip-rule="evenodd"></path>
      </svg>
    `;
  }

  formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  // Public methods
  getFiles() {
    return this.files;
  }

  clear() {
    this.files = [];
    this.uploadProgress = {};
    this.updateFileList();
  }

  // Set existing file(s) from URL/path or array of paths
  setValue(filePath) {
    if (filePath) {
      let filePaths = [];
      
      // Handle both single path and array of paths
      if (Array.isArray(filePath)) {
        filePaths = filePath;
      } else if (typeof filePath === 'string') {
        // Try to parse as JSON array
        try {
          const parsed = JSON.parse(filePath);
          if (Array.isArray(parsed)) {
            filePaths = parsed;
          } else {
            filePaths = [filePath];
          }
        } catch (e) {
          // If parsing fails, treat as single path
          filePaths = [filePath];
        }
      }
      
      // Create file-like objects for display
      this.files = filePaths.map(path => {
        const fileName = path.split('/').pop() || path;
        // Determine file type based on extension
        const extension = fileName.split('.').pop()?.toLowerCase() || '';
        let fileType = 'application/octet-stream';
        
        if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(extension)) {
          fileType = 'image/*';
        } else if (['pdf'].includes(extension)) {
          fileType = 'application/pdf';
        } else if (['doc', 'docx'].includes(extension)) {
          fileType = 'application/msword';
        } else if (['xls', 'xlsx'].includes(extension)) {
          fileType = 'application/vnd.ms-excel';
        } else if (['ppt', 'pptx'].includes(extension)) {
          fileType = 'application/vnd.ms-powerpoint';
        } else if (['txt'].includes(extension)) {
          fileType = 'text/plain';
        }
        
        return {
          name: fileName,
          size: 0, // We don't know the size
          type: fileType,
          path: path,
          isExisting: true // Flag to identify existing files
        };
      });
      
      // Force update the file list display
      this.updateFileList();
      
      // Dispatch event to notify that files have been set
      this.dispatchEvent(new CustomEvent('files-changed', {
        detail: { files: this.files }
      }));
    }
  }

  // Get the value (file paths)
  getValue() {
    if (this.files.length === 0) {
      return '';
    } else if (this.files.length === 1) {
      return this.files[0].path || this.files[0].name;
    } else {
      // Return array of paths for multiple files
      return this.files.map(file => file.path || file.name);
    }
  }
}

customElements.define('ui-file-upload', FileUpload);
export default FileUpload;