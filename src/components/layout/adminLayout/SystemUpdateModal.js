import '@/components/ui/Modal.js';
import '@/components/ui/Toast.js';
import '@/components/ui/Input.js';
import '@/components/ui/Textarea.js';
import '@/components/ui/Dropdown.js';
import '@/components/ui/RadioGroup.js';
import '@/components/ui/Switch.js';
import '@/components/ui/FileUpload.js';
import api from '@/services/api.js';

/**
 * System Update Modal Component
 * 
 * A modal component for editing existing system settings in the admin panel
 * 
 * Attributes:
 * - open: boolean - controls modal visibility
 * 
 * Events:
 * - setting-updated: Fired when a setting is successfully updated
 * - modal-closed: Fired when modal is closed
 */
class SystemUpdateModal extends HTMLElement {
    constructor() {
        super();
        this.settingData = null;
        this.arrayItems = [''];
    }

    static get observedAttributes() {
        return ['open'];
    }

    connectedCallback() {
        this.render();
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Listen for confirm button click (Update)
        this.addEventListener('confirm', () => {
            this.updateSetting();
        });
        
        // Listen for cancel button click
        this.addEventListener('cancel', () => {
            this.close();
        });

        // Listen for input changes to update setting data
        this.addEventListener('input', (event) => {
            if (this.settingData) {
                if (event.target.name === 'setting_value') {
                    this.settingData.setting_value = event.target.value;
                } else if (event.target.name === 'setting_value_color') {
                    this.settingData.setting_value = event.target.value;
                    // Update the text input value
                    const textInput = this.querySelector('ui-input[name="setting_value"]');
                    if (textInput) textInput.value = event.target.value;
                }
            }
        });

        // Listen for change events on UI components
        this.addEventListener('change', (event) => {
            if (this.settingData && event.target.name === 'setting_value') {
                this.settingData.setting_value = event.target.value;
            }
        });

        // Listen for custom UI component events
        this.addEventListener('value-changed', (event) => {
            if (this.settingData && event.target.name === 'setting_value') {
                this.settingData.setting_value = event.target.value;
            }
        });

        // Listen for array item add/remove events - use event delegation
        this.addEventListener('click', (e) => {
            const addButton = e.target.closest('[data-action="add-array-item"]');
            const removeButton = e.target.closest('[data-action="remove-array-item"]');
            
            if (addButton) {
                e.preventDefault();
                e.stopPropagation();
                this.addArrayItem();
            }
            
            if (removeButton) {
                e.preventDefault();
                e.stopPropagation();
                const index = parseInt(removeButton.dataset.index, 10);
                this.removeArrayItem(index);
            }
        });
    }

    open() {
        this.setAttribute('open', '');
    }

    close() {
        this.removeAttribute('open');
        this.settingData = null;
    }

    // Set setting data for editing
    setSettingData(settingData) {
        this.settingData = settingData;
        
        // Initialize array items if setting type is array
        if (settingData.setting_type === 'array') {
            if (settingData.setting_value) {
                if (Array.isArray(settingData.setting_value)) {
                    this.arrayItems = [...settingData.setting_value];
                } else if (typeof settingData.setting_value === 'string' && settingData.setting_value.trim()) {
                    try {
                        const parsed = JSON.parse(settingData.setting_value);
                        if (Array.isArray(parsed)) {
                            this.arrayItems = [...parsed];
                        } else {
                            this.arrayItems = [settingData.setting_value];
                        }
                    } catch {
                        this.arrayItems = [settingData.setting_value];
                    }
                } else {
                    this.arrayItems = [''];
                }
            } else {
                this.arrayItems = [''];
            }
        }
        
        // Re-render the modal with the new data
        this.render();
        
        // Set the file upload value after render (like PageUpdateModal)
        setTimeout(() => {
            if (settingData.setting_type === 'file' || settingData.setting_type === 'image') {
                const fileUpload = this.querySelector('ui-file-upload[name="setting_value"]');
                if (fileUpload && settingData.setting_value) {
                    fileUpload.setValue(settingData.setting_value);
                }
            }
        }, 0);
    }

    // Update the value input based on selected type
    updateValueInput() {
        const valueInputContainer = this.querySelector('[data-value-input]');
        if (valueInputContainer) {
            valueInputContainer.innerHTML = this.renderValueInput();
            
            // Re-attach event listeners for array inputs if needed
            if (this.settingData?.setting_type === 'array') {
                // Add event listeners to the new array input elements
                const arrayInputs = valueInputContainer.querySelectorAll('input[data-array-index]');
                arrayInputs.forEach(input => {
                    input.addEventListener('input', () => {
                        this._syncArrayItemsFromDOM();
                    });
                });
            }
        }
    }

    // Render array inputs for existing values
    renderArrayInputs() {
        // Always use the current arrayItems state
        let arrayValues = this.arrayItems && this.arrayItems.length > 0 ? this.arrayItems : [''];
        
        // Only initialize from settingData if arrayItems is empty or hasn't been set
        if (arrayValues.length === 0 || (arrayValues.length === 1 && arrayValues[0] === '')) {
            if (this.settingData && this.settingData.setting_value) {
                const currentValue = this.settingData.setting_value;
                if (Array.isArray(currentValue)) {
                    arrayValues = currentValue;
                    this.arrayItems = [...currentValue];
                } else if (typeof currentValue === 'string' && currentValue.trim()) {
                    // Try to parse as JSON
                    try {
                        const parsed = JSON.parse(currentValue);
                        if (Array.isArray(parsed)) {
                            arrayValues = parsed;
                            this.arrayItems = [...parsed];
                        }
                    } catch {
                        // If not JSON, use as single value
                        arrayValues = [currentValue];
                        this.arrayItems = [currentValue];
                    }
                }
            }
        }
        
        return arrayValues.map((value, index) => `
            <div class="flex gap-2 items-center">
                <div class="flex-1">
                    <input
                        type="text"
                        placeholder="Enter array item"
                        value="${value}"
                        data-array-index="${index}"
                        class="w-full upo-input-default">
                </div>
                ${arrayValues.length > 1 ? `
                    <ui-button
                        type="button"
                        variant="danger-outline"
                        size="sm"
                        data-action="remove-array-item"
                        data-index="${index}"
                        class="px-3">
                        <i class="fas fa-trash"></i>
                    </ui-button>
                ` : ''}
            </div>
        `).join('');
    }

    // Helper to read the current values from the DOM into our state array
    _syncArrayItemsFromDOM() {
        const arrayItemInputs = this.querySelectorAll('input[data-array-index]');
        this.arrayItems = Array.from(arrayItemInputs).map(input => input.value || '');
    }

    addArrayItem() {
        this._syncArrayItemsFromDOM(); // Save current values before adding a new one
        this.arrayItems.push('');
        this.updateValueInput();
    }

    removeArrayItem(index) {
        this._syncArrayItemsFromDOM(); // Save current values before removing one
        if (this.arrayItems.length > 1) {
            this.arrayItems.splice(index, 1);
            this.updateValueInput();
        }
    }

    // Update array values from inputs
    updateArrayValues() {
        const inputs = this.querySelectorAll('#array-inputs input[data-array-index]');
        const values = Array.from(inputs).map(input => input.value).filter(value => value.trim());
        this.settingData.setting_value = values;
    }

    // Render the appropriate input component based on setting type
    renderValueInput() {
        const settingType = this.settingData?.setting_type || 'text';
        const currentValue = this.settingData?.setting_value || '';

        switch (settingType) {
            case 'text':
                return `
                    <ui-input 
                        name="setting_value"
                        type="text" 
                        placeholder="Enter text value"
                        value="${currentValue}"
                        class="w-full">
                    </ui-input>
                `;
            
            case 'number':
                return `
                    <ui-input 
                        name="setting_value"
                        type="number" 
                        placeholder="Enter numeric value"
                        value="${currentValue}"
                        class="w-full">
                    </ui-input>
                `;
            
            case 'boolean':
                return `
                    <ui-radio-group 
                        name="setting_value"
                        value="${currentValue === '1' || currentValue === 'true' ? 'true' : 'false'}"
                        layout="horizontal"
                        class="w-full">
                        <ui-radio-option value="true" label="True"></ui-radio-option>
                        <ui-radio-option value="false" label="False"></ui-radio-option>
                    </ui-radio-group>
                `;
            
            case 'color':
                return `
                    <div style="display: flex; gap: 0.5rem; align-items: center;">
                        <input 
                            name="setting_value_color"
                            type="color" 
                            value="${/^#([0-9A-Fa-f]{6}|[0-9A-Fa-f]{3})$/.test(currentValue) ? currentValue : '#000000'}"
                            class="w-10 h-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            style="min-width: 2.5rem;"
                            oninput="this.nextElementSibling.value = this.value"
                        >
                        <ui-input 
                            name="setting_value"
                            type="text" 
                            placeholder="Enter color string (e.g. #ff0000, red, rgba(255,0,0,1))"
                            value="${currentValue}"
                            class="flex-1"
                            oninput="if(/^#([0-9A-Fa-f]{6}|[0-9A-Fa-f]{3})$/.test(this.value)) { this.previousElementSibling.value = this.value; }"
                        ></ui-input>
                    </div>
                `;
            
            case 'file':
                return `
                    <ui-file-upload 
                        name="setting_value"
                        accept="*/*"
                        max-size="10485760"
                        max-files="1"
                        class="w-full">
                    </ui-file-upload>
                `;
            
            case 'image':
                return `
                    <ui-file-upload 
                        name="setting_value"
                        accept="image/*"
                        max-size="5242880"
                        max-files="1"
                        class="w-full">
                    </ui-file-upload>
                `;
            
            case 'textarea':
                return `
                    <ui-textarea 
                        name="setting_value"
                        placeholder="Enter text value"
                        rows="4"
                        value="${currentValue}"
                        class="w-full">
                    </ui-textarea>
                `;
            
            case 'select':
                // For select type, we'll use a textarea to allow multiple options
                return `
                    <ui-textarea 
                        name="setting_value"
                        placeholder="Enter select options (one per line or comma separated)"
                        rows="3"
                        value="${currentValue}"
                        class="w-full">
                    </ui-textarea>
                `;
            
            case 'array':
                return `
                    <div class="space-y-2">
                        <div id="array-inputs" class="space-y-2">
                            ${this.renderArrayInputs()}
                        </div>
                        <div class="flex justify-end mt-2">
                            <ui-button
                                type="button"
                                variant="outline"
                                size="sm"
                                data-action="add-array-item"
                                class="px-3">
                                <i class="fas fa-plus mr-1"></i>
                                Add Item
                            </ui-button>
                        </div>
                    </div>
                `;
            
            default:
                return `
                    <ui-input 
                        name="setting_value"
                        type="text" 
                        placeholder="Enter value"
                        value="${currentValue}"
                        class="w-full">
                    </ui-input>
                `;
        }
    }

    // Update the setting
    async updateSetting() {
        try {
            // Small delay to ensure components are initialized
            await new Promise(resolve => setTimeout(resolve, 100));
            
            // Get values from custom UI components
            const settingValueInput = this.querySelector('ui-input[name="setting_value"]');
            const descriptionTextarea = this.querySelector('ui-textarea[name="description"]');
            const statusSwitch = this.querySelector('ui-switch[name="is_active"]');

            // Get value based on the type
            let valueInput;
            let fileUpload = null; // Declare fileUpload variable
            const settingType = this.settingData?.setting_type || 'text';
            
            // For text and number types, try to get the actual input element inside the component
            if (settingType === 'text' || settingType === 'number') {
                const actualInput = this.querySelector('ui-input[name="setting_value"] input');
                if (actualInput) {
                    valueInput = actualInput.value;
                } else if (settingValueInput) {
                    valueInput = settingValueInput.value;
                }
            }
            
            switch (settingType) {
                case 'boolean':
                    const radioGroup = this.querySelector('ui-radio-group[name="setting_value"]');
                    valueInput = radioGroup ? radioGroup.value : 'false';
                    break;
                case 'textarea':
                case 'select':
                    const textarea = this.querySelector('ui-textarea[name="setting_value"]');
                    valueInput = textarea ? textarea.value : '';
                    break;
                case 'array':
                    // Collect values from dynamic array inputs
                    this._syncArrayItemsFromDOM();
                    valueInput = this.arrayItems.filter(value => value.trim());
                    break;
                case 'file':
                case 'image':
                    fileUpload = this.querySelector('ui-file-upload[name="setting_value"]');
                    // For file/image types, we need to handle the file upload separately
                    // The value will be set after the file is uploaded
                    valueInput = this.settingData?.setting_value || '';
                    break;
                case 'color':
                    const colorInput = this.querySelector('input[name="setting_value"]');
                    valueInput = colorInput ? colorInput.value : '#000000';
                    break;
                default:
                    // For text and number types, use the value we already got above
                    if (!valueInput) {
                        valueInput = settingValueInput ? settingValueInput.value : '';
                    }
                    break;
            }

            // Fallback for setting value if not found
            if (!valueInput && (settingType === 'text' || settingType === 'number')) {
                // Try to get from the setting data directly
                valueInput = this.settingData?.setting_value || '';
            }

            const settingData = {
                setting_key: this.settingData?.setting_key || '',
                setting_value: valueInput,
                setting_type: this.settingData?.setting_type || 'text',
                category: this.settingData?.category || 'general',
                description: descriptionTextarea ? descriptionTextarea.value : '',
                is_active: statusSwitch ? statusSwitch.checked : true
            };

            // Validate required fields
            if (!settingData.setting_key) {
                Toast.show({
                    title: 'Validation Error',
                    message: 'Setting key is required',
                    variant: 'error',
                    duration: 3000
                });
                return;
            }

            // Get the auth token
            const token = localStorage.getItem('token');
            if (!token) {
                Toast.show({
                    title: 'Authentication Error',
                    message: 'Please log in to update settings',
                    variant: 'error',
                    duration: 3000
                });
                return;
            }

            // Handle file upload for file/image types
            let response;
            if ((settingType === 'file' || settingType === 'image') && fileUpload && fileUpload.getFiles().length > 0) {
                // Prepare form data for multipart request
                const formData = new FormData();
                
                // Add all form fields
                Object.keys(settingData).forEach(key => {
                    formData.append(key, settingData[key]);
                });
                
                // Add file if selected
                const file = fileUpload.getFiles()[0];
                formData.append('setting_value', file);
                
                // Update the setting with multipart data
                response = await api.withToken(token).put(`/settings/${this.settingData.id}`, formData);
            } else {
                // Update the setting with JSON data
                response = await api.withToken(token).put(`/settings/${this.settingData.id}`, settingData);
            }
            
            Toast.show({
                title: 'Success',
                message: 'Setting updated successfully',
                variant: 'success',
                duration: 3000
            });

            // Construct the updated setting data from response
            const updatedSetting = {
                ...this.settingData, // Keep existing fields like id, created_at
                ...settingData,
                updated_at: new Date().toISOString().slice(0, 19).replace('T', ' ')
            };
            
            // If it's a file/image type and we have a response, use the server's file path
            if ((settingType === 'file' || settingType === 'image') && response && response.data && response.data.data) {
                updatedSetting.setting_value = response.data.data.setting_value || this.settingData.setting_value;
            }

            // Close modal and dispatch event
            this.close();
            this.dispatchEvent(new CustomEvent('setting-updated', {
                detail: { setting: updatedSetting },
                bubbles: true,
                composed: true
            }));
            
            // Reset the setting data to prevent issues
            this.settingData = null;

        } catch (error) {
            console.error('❌ Error updating setting:', error);
            Toast.show({
                title: 'Error',
                message: error.response?.data?.message || 'Failed to update setting',
                variant: 'error',
                duration: 3000
            });
        }
    }

    render() {
        this.innerHTML = `
            <ui-modal 
                ${this.hasAttribute('open') ? 'open' : ''} 
                position="right" 
                close-button="true">
                <div slot="title">Update System Setting</div>
                
                <form id="setting-update-form" class="space-y-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Setting Value</label>
                        <div data-value-input>
                            ${this.renderValueInput()}
                        </div>
                    </div>
                    
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Description</label>
                        <ui-textarea 
                            name="description"
                            placeholder="Briefly describe this setting"
                            rows="2"
                            value="${this.settingData?.description || ''}"
                            class="w-full">
                        </ui-textarea>
                    </div>
                    
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Status</label>
                        <ui-switch 
                            name="is_active"
                            ${this.settingData?.is_active ? 'checked' : ''}
                            class="w-full">
                            <span slot="label">Active</span>
                        </ui-switch>
                    </div>
                </form>
            </ui-modal>
        `;
    }
}

customElements.define('system-update-modal', SystemUpdateModal);
export default SystemUpdateModal;
