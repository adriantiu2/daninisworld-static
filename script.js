// Images will be loaded from the server
let imageFiles = [];

/**
 * Parse date from filename
 * Format: (month)-(day)-(year).jpg or (month)-(day)-(year)a.jpg
 */
function parseDate(filename) {
    // Remove file extension and any suffix (like 'a')
    const baseName = filename.replace(/\.(jpg|JPG|jpeg|JPEG|png|PNG|gif|GIF|webp|WEBP)$/i, '');
    const withoutSuffix = baseName.replace(/[a-z]$/i, '');
    
    // Split by hyphen
    const parts = withoutSuffix.split('-');
    if (parts.length !== 3) {
        return null;
    }
    
    const month = parseInt(parts[0], 10);
    const day = parseInt(parts[1], 10);
    let year = parseInt(parts[2], 10);
    
    // Handle 2-digit years (assume 20xx for years < 100)
    if (year < 100) {
        year += 2000;
    }
    
    return new Date(year, month - 1, day);
}

/**
 * Format date for display
 */
function formatDate(date) {
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const year = date.getFullYear();
    return `${month}-${day}-${year}`;
}

/**
 * Sort images chronologically (newest first)
 */
function sortImagesByDate(files) {
    return files.map(filename => ({
        filename: filename,
        date: parseDate(filename)
    })).filter(item => item.date !== null)
      .sort((a, b) => {
          // If dates are equal, sort by filename to handle duplicates
          if (a.date.getTime() === b.date.getTime()) {
              return a.filename.localeCompare(b.filename);
          }
          return b.date.getTime() - a.date.getTime();
      });
}

/**
 * Create gallery item element
 */
function createGalleryItem(item) {
    const galleryItem = document.createElement('div');
    galleryItem.className = 'gallery-item';
    
    const img = document.createElement('img');
    img.src = `assets/${item.filename}`;
    img.alt = formatDate(item.date);
    img.loading = 'lazy'; // Lazy load images for better performance
    img.classList.add('lightbox-image');
    
    const dateContainer = document.createElement('div');
    dateContainer.className = 'date-container';
    
    const dateLabel = document.createElement('span');
    dateLabel.className = 'date';
    dateLabel.textContent = formatDate(item.date);
    
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'delete-btn';
    deleteBtn.textContent = '×';
    deleteBtn.title = 'Delete image';
    deleteBtn.onclick = () => handleDeleteImage(item.filename);
    
    dateContainer.appendChild(dateLabel);
    dateContainer.appendChild(deleteBtn);
    
    galleryItem.appendChild(img);
    galleryItem.appendChild(dateContainer);
    
    return galleryItem;
}


/**
 * Parse date string (format: month-day-year)
 */
function parseDateString(dateString) {
    const parts = dateString.split('-');
    if (parts.length !== 3) {
        return null;
    }
    
    const month = parseInt(parts[0], 10);
    const day = parseInt(parts[1], 10);
    let year = parseInt(parts[2], 10);
    
    // Handle 2-digit years
    if (year < 100) {
        year += 2000;
    }
    
    return new Date(year, month - 1, day);
}

/**
 * Load images from server
 */
async function loadImages() {
    try {
        const response = await fetch('/api/images');
        const data = await response.json();
        if (data.images) {
            imageFiles = data.images;
        } else {
            imageFiles = [];
        }
    } catch (error) {
        console.error('Error loading images:', error);
        imageFiles = [];
    }
}

/**
 * Initialize the gallery
 */
async function initGallery() {
    const gallery = document.getElementById('gallery');
    gallery.innerHTML = ''; // Clear gallery
    
    // Load images from server
    await loadImages();
    
    // Sort images chronologically (newest first)
    const sortedImages = sortImagesByDate(imageFiles);
    
    // Create and append gallery items
    sortedImages.forEach(item => {
        const galleryItem = createGalleryItem(item);
        gallery.appendChild(galleryItem);
    });
}

/**
 * Handle image upload
 */
async function handleImageUpload() {
    const fileInput = document.getElementById('imageInput');
    const dateInput = document.getElementById('dateInput');
    const uploadForm = document.getElementById('uploadForm');
    const uploadBtn = document.getElementById('uploadBtn');
    
    const file = fileInput.files[0];
    const dateString = dateInput.value.trim();
    
    if (!file) {
        alert('Please select an image file.');
        return;
    }
    
    if (!dateString) {
        alert('Please enter a date.');
        return;
    }
    
    // Validate date format
    const date = parseDateString(dateString);
    if (!date || isNaN(date.getTime())) {
        alert('Please enter a valid date in the format: month-day-year (e.g., 1-15-25)');
        return;
    }
    
    // Get password
    const passwordInput = document.getElementById('passwordInput');
    const password = passwordInput ? passwordInput.value.trim() : '';
    
    if (!password) {
        alert('Password is required.');
        return;
    }
    
    // Create FormData to send file and date
    const formData = new FormData();
    formData.append('image', file);
    formData.append('date', dateString);
    formData.append('password', password);
    
    // Disable upload button during upload
    uploadBtn.disabled = true;
    uploadBtn.textContent = 'Uploading...';
    
    try {
        // Create a timeout promise
        const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('Upload timeout - server may not be running')), 10000);
        });
        
        // Race between fetch and timeout
        const response = await Promise.race([
            fetch('/upload', {
                method: 'POST',
                body: formData
            }),
            timeoutPromise
        ]);
        
        // Check if response is JSON
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
            const text = await response.text();
            throw new Error(`Server returned ${response.status}: ${text.substring(0, 100)}`);
        }
        
        const result = await response.json();
        
        if (response.ok) {
            // Reset form
            fileInput.value = '';
            dateInput.value = '';
            if (passwordInput) passwordInput.value = '';
            uploadForm.style.display = 'none';
            
            // Refresh gallery to show new image (will reload from server)
            await initGallery();
            
            alert('Image uploaded successfully!');
        } else {
            alert('Error: ' + (result.error || 'Failed to upload image'));
        }
    } catch (error) {
        console.error('Upload error:', error);
        alert('Error uploading image: ' + error.message + '\n\nMake sure the server is running (npm start)');
    } finally {
        // Re-enable upload button
        uploadBtn.disabled = false;
        uploadBtn.textContent = 'Upload';
    }
}

/**
 * Handle image deletion
 */
async function handleDeleteImage(filename) {
    // Prompt for password
    const password = prompt('Enter password to delete this image:');
    if (!password) {
        return; // User cancelled
    }
    
    if (password !== '') {
        alert('Invalid password.');
        return;
    }
    
    // Confirm deletion
    if (!confirm(`Are you sure you want to delete ${filename}?`)) {
        return;
    }
    
    try {
        const response = await fetch('/api/delete', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                filename: filename,
                password: password
            })
        });
        
        const result = await response.json();
        
        if (response.ok) {
            // Remove from imageFiles array
            const index = imageFiles.indexOf(filename);
            if (index > -1) {
                imageFiles.splice(index, 1);
            }
            
            // Refresh gallery
            await initGallery();
            
            alert('Image deleted successfully!');
        } else {
            alert('Error: ' + (result.error || 'Failed to delete image'));
        }
    } catch (error) {
        console.error('Delete error:', error);
        alert('Error deleting image: ' + error.message);
    }
}

/**
 * Initialize upload functionality
 */
function initUpload() {
    const addImageBtn = document.getElementById('addImageBtn');
    const uploadForm = document.getElementById('uploadForm');
    const uploadBtn = document.getElementById('uploadBtn');
    const cancelBtn = document.getElementById('cancelBtn');
    
    addImageBtn.addEventListener('click', () => {
        uploadForm.style.display = uploadForm.style.display === 'none' ? 'block' : 'none';
    });
    
    uploadBtn.addEventListener('click', handleImageUpload);
    
    cancelBtn.addEventListener('click', () => {
        uploadForm.style.display = 'none';
        document.getElementById('imageInput').value = '';
        document.getElementById('dateInput').value = '';
        const passwordInput = document.getElementById('passwordInput');
        if (passwordInput) passwordInput.value = '';
    });
}

// Initialize gallery and upload functionality when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    initGallery();
    initUpload();
});

