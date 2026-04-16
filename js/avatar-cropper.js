// Avatar Cropper - Simple Image Cropping Tool
class AvatarCropper {
    constructor() {
        this.currentImage = null;
        this.cropData = {
            x: 0,
            y: 0,
            width: 200,
            height: 200
        };
        this.isDragging = false;
        this.dragStart = { x: 0, y: 0 };
        this.init();
    }

    init() {
        this.createCropperModal();
    }

    createCropperModal() {
        const modalHTML = `
            <div id="avatarCropperModal" class="dashboard-modal-overlay" style="display: none;">
                <div class="dashboard-modal-content avatar-cropper-modal">
                    <div class="dashboard-modal-header">
                        <h3>Crop Your Avatar</h3>
                        <button class="dashboard-close-btn" onclick="avatarCropper.closeCropper()">&times;</button>
                    </div>
                    <div class="dashboard-modal-body">
                        <div class="cropper-container">
                            <div class="cropper-image-wrapper">
                                <img id="cropperImage" src="" alt="Crop image">
                                <div class="crop-circle">
                                    <div class="crop-overlay-circle"></div>
                                </div>
                            </div>
                        </div>
                        <div class="cropper-preview">
                            <h4>Preview</h4>
                            <div class="preview-circle">
                                <img id="previewImage" src="" alt="Preview">
                            </div>
                        </div>
                    </div>
                    <div class="dashboard-modal-footer">
                        <button class="dashboard-btn-outline" onclick="avatarCropper.closeCropper()">Cancel</button>
                        <button class="dashboard-btn" onclick="avatarCropper.applyCrop()">Apply Crop</button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        this.setupEventListeners();
    }

    setupEventListeners() {
        const cropCircle = document.querySelector('.crop-circle');
        if (cropCircle) {
            // Mouse events for desktop
            cropCircle.addEventListener('mousedown', (e) => this.startDrag(e));
            document.addEventListener('mousemove', (e) => this.drag(e));
            document.addEventListener('mouseup', () => this.endDrag());
            
            // Touch events for mobile with better handling
            cropCircle.addEventListener('touchstart', (e) => {
                e.preventDefault(); // Prevent scrolling while cropping
                this.startDrag(e.touches[0]);
            }, { passive: false });
            
            document.addEventListener('touchmove', (e) => {
                if (this.isDragging) {
                    e.preventDefault(); // Prevent scrolling while dragging
                    this.drag(e.touches[0]);
                }
            }, { passive: false });
            
            document.addEventListener('touchend', (e) => {
                if (this.isDragging) {
                    e.preventDefault();
                    this.endDrag();
                }
            }, { passive: false });
        }
    }

    openCropper(imageFile) {
        return new Promise((resolve, reject) => {
            console.log('Opening cropper for file:', imageFile.name, 'size:', imageFile.size, 'type:', imageFile.type);
            
            const reader = new FileReader();
            reader.onload = (e) => {
                console.log('FileReader loaded, result length:', e.target.result.length);
                this.currentImage = e.target.result;
                this.showCropper();
                this.resolveCallback = resolve;
                this.rejectCallback = reject;
            };
            
            reader.onerror = (error) => {
                console.error('FileReader error:', error);
                reject(new Error('Failed to read image file'));
            };
            
            try {
                reader.readAsDataURL(imageFile);
            } catch (error) {
                console.error('Error reading file:', error);
                reject(new Error('Failed to read image file'));
            }
        });
    }

    showCropper() {
        console.log('Showing cropper modal...');
        const modal = document.getElementById('avatarCropperModal');
        const image = document.getElementById('cropperImage');
        const preview = document.getElementById('previewImage');
        
        if (modal && image && preview) {
            console.log('Modal and image elements found');
            image.src = this.currentImage;
            preview.src = this.currentImage;
            
            image.onload = () => {
                console.log('Cropper image loaded successfully');
                this.initializeCropBox();
                this.updatePreview();
            };
            
            image.onerror = (error) => {
                console.error('Cropper image failed to load:', error);
                this.closeCropper();
                if (this.rejectCallback) {
                    this.rejectCallback(new Error('Failed to load image in cropper'));
                }
            };
            
            modal.style.display = 'flex';
            console.log('Modal displayed');
        } else {
            console.error('Cropper modal elements not found');
            if (this.rejectCallback) {
                this.rejectCallback(new Error('Cropper modal not ready'));
            }
        }
    }

    initializeCropBox() {
        const image = document.getElementById('cropperImage');
        const cropCircle = document.querySelector('.crop-circle');
        
        if (image && cropCircle) {
            const imageRect = image.getBoundingClientRect();
            const imageSize = Math.min(imageRect.width, imageRect.height, 150); // Smaller size
            
            // Set initial crop circle to center
            this.cropData = {
                x: (imageRect.width - imageSize) / 2,
                y: (imageRect.height - imageSize) / 2,
                width: imageSize,
                height: imageSize
            };
            
            this.updateCropCircle();
        }
    }

    updateCropCircle() {
        const cropCircle = document.querySelector('.crop-circle');
        if (cropCircle) {
            cropCircle.style.left = `${this.cropData.x}px`;
            cropCircle.style.top = `${this.cropData.y}px`;
            cropCircle.style.width = `${this.cropData.width}px`;
            cropCircle.style.height = `${this.cropData.height}px`;
        }
    }

    updatePreview() {
        const preview = document.getElementById('previewImage');
        if (preview && this.currentImage) {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            canvas.width = 80;
            canvas.height = 80;
            
            const img = new Image();
            img.onload = () => {
                const image = document.getElementById('cropperImage');
                const scaleX = img.naturalWidth / image.width;
                const scaleY = img.naturalHeight / image.height;
                
                // Calculate source dimensions for the crop circle
                const sourceX = this.cropData.x * scaleX;
                const sourceY = this.cropData.y * scaleY;
                const sourceWidth = this.cropData.width * scaleX;
                const sourceHeight = this.cropData.height * scaleY;
                
                // Create circular clipping path for preview
                ctx.beginPath();
                ctx.arc(40, 40, 40, 0, 2 * Math.PI);
                ctx.closePath();
                ctx.clip();
                
                // Draw the image within the circle
                ctx.drawImage(img, sourceX, sourceY, sourceWidth, sourceHeight, 0, 0, 80, 80);
                
                preview.src = canvas.toDataURL('image/jpeg', 0.9);
            };
            img.src = this.currentImage;
        }
    }

    startDrag(e) {
        this.isDragging = true;
        this.dragStart = {
            x: e.clientX - this.cropData.x,
            y: e.clientY - this.cropData.y
        };
    }

    drag(e) {
        if (!this.isDragging) return;
        
        const image = document.getElementById('cropperImage');
        if (!image) return;
        
        const imageRect = image.getBoundingClientRect();
        
        let newX = e.clientX - this.dragStart.x;
        let newY = e.clientY - this.dragStart.y;
        
        // Constrain to image bounds
        newX = Math.max(0, Math.min(newX, imageRect.width - this.cropData.width));
        newY = Math.max(0, Math.min(newY, imageRect.height - this.cropData.height));
        
        this.cropData.x = newX;
        this.cropData.y = newY;
        
        this.updateCropCircle();
        this.updatePreview();
    }

    endDrag() {
        this.isDragging = false;
    }

    applyCrop() {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        canvas.width = 200;
        canvas.height = 200;
        
        const img = new Image();
        img.onload = () => {
            const image = document.getElementById('cropperImage');
            
            // Get the actual dimensions of the displayed image
            const displayWidth = image.width;
            const displayHeight = image.height;
            
            // Calculate scale factors
            const scaleX = img.naturalWidth / displayWidth;
            const scaleY = img.naturalHeight / displayHeight;
            
            // Calculate source coordinates and dimensions
            const sourceX = this.cropData.x * scaleX;
            const sourceY = this.cropData.y * scaleY;
            const sourceWidth = this.cropData.width * scaleX;
            const sourceHeight = this.cropData.height * scaleY;
            
            console.log('Crop data:', this.cropData);
            console.log('Source dimensions:', { sourceX, sourceY, sourceWidth, sourceHeight });
            
            // Create circular clipping path
            ctx.beginPath();
            ctx.arc(100, 100, 100, 0, 2 * Math.PI);
            ctx.closePath();
            ctx.clip();
            
            // Draw the image within the circle
            ctx.drawImage(img, sourceX, sourceY, sourceWidth, sourceHeight, 0, 0, 200, 200);
            
            const croppedImage = canvas.toDataURL('image/jpeg', 0.9);
            console.log('Cropped image length:', croppedImage.length);
            
            this.closeCropper();
            
            if (this.resolveCallback) {
                this.resolveCallback(croppedImage);
            }
        };
        
        img.onerror = () => {
            console.error('Failed to load image for cropping');
            this.closeCropper();
            if (this.rejectCallback) {
                this.rejectCallback(new Error('Failed to load image'));
            }
        };
        
        img.src = this.currentImage;
    }

    closeCropper() {
        const modal = document.getElementById('avatarCropperModal');
        if (modal) {
            modal.style.display = 'none';
        }
        
        if (this.rejectCallback) {
            this.rejectCallback(new Error('Crop cancelled'));
        }
    }
}

// Initialize the avatar cropper
let avatarCropper;
document.addEventListener('DOMContentLoaded', () => {
    avatarCropper = new AvatarCropper();
});
