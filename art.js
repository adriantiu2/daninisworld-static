// List of art pieces (will be loaded from server)
let artPieces = [];
let currentFilter = 'all';

// Default categories
const defaultCategories = ['Film', 'Drawing', 'Painting', 'Digital', 'Sculpture'];

// Category data (loaded from server)
let categoryData = { customCategories: [], deletedDefaults: [] };

// Load categories from server
async function loadCategories() {
    try {
        const response = await fetch('/api/art/categories');
        if (response.ok) {
            const data = await response.json();
            categoryData = {
                customCategories: data.customCategories || [],
                deletedDefaults: data.deletedDefaults || []
            };
            return categoryData;
        }
    } catch (error) {
        console.error('Error loading categories:', error);
    }
    return { customCategories: [], deletedDefaults: [] };
}

// Save categories to server (password should be provided by caller)
async function saveCategories(password) {
    try {
        if (!password || password !== '') {
            return false;
        }
        
        const response = await fetch('/api/art/categories', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                customCategories: categoryData.customCategories,
                deletedDefaults: categoryData.deletedDefaults,
                password: password
            })
        });
        
        if (response.ok) {
            return true;
        } else {
            console.error('Error saving categories');
            return false;
        }
    } catch (error) {
        console.error('Error saving categories:', error);
        return false;
    }
}

// Load custom categories (for compatibility)
function loadCustomCategories() {
    return categoryData.customCategories;
}

// Save custom categories (for compatibility - requires password from caller)
async function saveCustomCategories(categories, password) {
    categoryData.customCategories = categories;
    if (password) {
        return await saveCategories(password);
    }
    return false;
}

// Load deleted default categories (for compatibility)
function loadDeletedDefaults() {
    return categoryData.deletedDefaults;
}

// Save deleted default categories (for compatibility - requires password from caller)
async function saveDeletedDefaults(deleted, password) {
    categoryData.deletedDefaults = deleted;
    if (password) {
        return await saveCategories(password);
    }
    return false;
}

// Get all active categories (default - deleted + custom)
function getAllCategories() {
    const deletedDefaults = loadDeletedDefaults();
    const activeDefaults = defaultCategories.filter(cat => !deletedDefaults.includes(cat));
    return [...activeDefaults, ...loadCustomCategories()];
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
 * Load art pieces from server
 */
async function loadArtPieces() {
    try {
        const response = await fetch('/api/art');
        if (response.ok) {
            const data = await response.json();
            artPieces = data.artPieces || [];
            console.log('Loaded art pieces:', artPieces);
            return artPieces;
        }
    } catch (error) {
        console.error('Error loading art pieces:', error);
    }
    return [];
}

/**
 * Create gallery item element for art
 */
function createArtItem(artPiece) {
    const galleryItem = document.createElement('div');
    galleryItem.className = 'gallery-item';
    
    // Support multiple media files (carousel), ordered by filename (natural sort so 2 before 10)
    const rawFilenames = Array.isArray(artPiece.filenames) && artPiece.filenames.length
        ? artPiece.filenames
        : [artPiece.filename];
    const mediaFilenames = [...rawFilenames].sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
    
    const mediaWrapper = document.createElement('div');
    mediaWrapper.className = 'art-media-wrapper';
    
    const mediaContainer = document.createElement('div');
    mediaContainer.className = 'art-media-container';
    mediaWrapper.appendChild(mediaContainer);
    
    let currentIndex = 0;
    const totalSlides = mediaFilenames.length;
    const imageFilenames = mediaFilenames.filter(name => !isVideoFile(name));
    
    function isVideoFile(name) {
        const lower = name.toLowerCase();
        return lower.endsWith('.mp4') || lower.endsWith('.webm') || 
               lower.endsWith('.ogg') || lower.endsWith('.mov') || 
               lower.endsWith('.avi') || lower.endsWith('.mkv') ||
               lower.endsWith('.flv') || lower.endsWith('.wmv');
    }
    
    function renderSlide() {
        mediaContainer.innerHTML = '';
        const filename = mediaFilenames[currentIndex];
        const isVideo = isVideoFile(filename);
        
        let mediaElement;
        if (isVideo) {
            mediaElement = document.createElement('video');
            mediaElement.src = `assets/${filename}`;
            mediaElement.controls = true;
            mediaElement.style.width = '100%';
            mediaElement.style.height = 'auto';
            mediaElement.style.display = 'block';
        } else {
            mediaElement = document.createElement('img');
            mediaElement.src = `assets/${filename}`;
            mediaElement.alt = artPiece.title || 'Art piece';
            mediaElement.loading = 'lazy';
            mediaElement.classList.add('lightbox-image');

            const imageIndex = imageFilenames.indexOf(filename);
            if (imageIndex !== -1) {
                mediaElement.dataset.lightboxSeq = imageFilenames
                    .map(name => `assets/${name}`)
                    .join('|');
                mediaElement.dataset.lightboxIndex = String(imageIndex);
            }
        }
        
        mediaContainer.appendChild(mediaElement);
    }
    
    renderSlide();
    
    const infoContainer = document.createElement('div');
    infoContainer.className = 'date-container';
    
    const infoDiv = document.createElement('div');
    infoDiv.className = 'date';

    if (artPiece.categories && Array.isArray(artPiece.categories) && artPiece.categories.length > 0) {
        const categoriesDiv = document.createElement('div');
        categoriesDiv.className = 'art-categories';
        artPiece.categories.forEach(category => {
            const categorySpan = document.createElement('span');
            categorySpan.className = 'art-category';
            categorySpan.textContent = category;
            categoriesDiv.appendChild(categorySpan);
        });
        infoDiv.appendChild(categoriesDiv);
    }
    
    const titleDiv = document.createElement('div');
    titleDiv.textContent = artPiece.title || 'Untitled';
    titleDiv.style.fontWeight = 'bold';
    titleDiv.style.marginBottom = '5px';
    
    // Combine year, medium, and size on one line
    const detailsDiv = document.createElement('div');
    const parts = [];
    
    if (artPiece.year) parts.push(artPiece.year);
    if (artPiece.medium) parts.push(artPiece.medium);
    if (artPiece.size) parts.push(artPiece.size);
    
    detailsDiv.textContent = parts.join(', ');
    detailsDiv.style.fontSize = '12px';
    detailsDiv.style.marginTop = '5px';
    
    infoDiv.appendChild(titleDiv);
    if (parts.length > 0) infoDiv.appendChild(detailsDiv);
    
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'delete-btn';
    deleteBtn.textContent = '×';
    deleteBtn.title = 'Delete art piece';
    deleteBtn.onclick = () => handleDeleteArt(artPiece.id);
    
    infoContainer.appendChild(infoDiv);
    infoContainer.appendChild(deleteBtn);
    
    galleryItem.appendChild(mediaWrapper);
    
    if (totalSlides > 1) {
        const controls = document.createElement('div');
        controls.className = 'art-carousel-controls';
        
        const prevBtn = document.createElement('button');
        prevBtn.type = 'button';
        prevBtn.className = 'art-carousel-arrow';
        prevBtn.textContent = '◀';
        
        const counter = document.createElement('span');
        counter.className = 'art-carousel-counter';
        counter.textContent = `${currentIndex + 1}/${totalSlides}`;
        
        const nextBtn = document.createElement('button');
        nextBtn.type = 'button';
        nextBtn.className = 'art-carousel-arrow';
        nextBtn.textContent = '▶';
        
        function updateCounter() {
            counter.textContent = `${currentIndex + 1}/${totalSlides}`;
        }
        
        prevBtn.addEventListener('click', () => {
            currentIndex = (currentIndex - 1 + totalSlides) % totalSlides;
            renderSlide();
            updateCounter();
        });
        
        nextBtn.addEventListener('click', () => {
            currentIndex = (currentIndex + 1) % totalSlides;
            renderSlide();
            updateCounter();
        });
        
        controls.appendChild(prevBtn);
        controls.appendChild(counter);
        controls.appendChild(nextBtn);
        
        mediaWrapper.appendChild(controls);
    }
    
    galleryItem.appendChild(infoContainer);
    
    return galleryItem;
}

/**
 * Render the gallery based on current artPieces and currentFilter
 */
function initGallery() {
    const gallery = document.getElementById('gallery');
    gallery.innerHTML = '';

    // Sort by year (newest first)
    artPieces.sort((a, b) => {
        const yearA = a.year ? parseInt(a.year) : 0;
        const yearB = b.year ? parseInt(b.year) : 0;
        return yearB - yearA; // Sort by year descending
    });
    
    // Filter art pieces
    const filteredArt = currentFilter === 'all'
        ? artPieces
        : artPieces.filter(piece => piece.categories && piece.categories.includes(currentFilter));
    
    // Create and append gallery items
    filteredArt.forEach(artPiece => {
        const galleryItem = createArtItem(artPiece);
        gallery.appendChild(galleryItem);
    });
}

/**
 * Add delete buttons to all category filter buttons
 */
function addDeleteButtonsToCategories() {
    const filterButtons = document.querySelectorAll('.filter-btn[data-category]:not([data-category="all"])');
    filterButtons.forEach(btn => {
        // Check if delete button already exists
        if (btn.querySelector('.category-delete')) return;
        
        const deleteBtn = document.createElement('span');
        deleteBtn.className = 'category-delete';
        deleteBtn.textContent = ' ×';
        deleteBtn.style.cursor = 'pointer';
        deleteBtn.style.marginLeft = '5px';
        deleteBtn.style.fontWeight = 'bold';
        deleteBtn.onclick = (e) => {
            e.stopPropagation(); // Prevent triggering the filter
            handleDeleteCategory(btn.dataset.category);
        };
        btn.appendChild(deleteBtn);
    });
}

/**
 * Handle deleting a category
 */
async function handleDeleteCategory(categoryName) {
    const password = prompt('Enter password to delete this category:');
    if (!password) {
        return;
    }
    
    if (password !== '') {
        alert('Invalid password.');
        return;
    }
    
    if (!confirm(`Are you sure you want to delete the category "${categoryName}"?`)) {
        return;
    }
    
    // Check if it's a custom category
    const isCustom = categoryData.customCategories.includes(categoryName);
    
    if (isCustom) {
        // Remove from custom categories
        categoryData.customCategories = categoryData.customCategories.filter(cat => cat !== categoryName);
    } else if (defaultCategories.includes(categoryName)) {
        // Add to deleted defaults
        if (!categoryData.deletedDefaults.includes(categoryName)) {
            categoryData.deletedDefaults.push(categoryName);
        }
    }
    
    // Save to server
    const saved = await saveCategories(password);
    
    if (saved) {
        // Remove the button from DOM
        const btn = document.querySelector(`.filter-btn[data-category="${categoryName}"]`);
        if (btn) btn.remove();
        
        // Remove from form checkboxes
        const checkbox = document.querySelector(`input[value="${categoryName}"]`);
        if (checkbox) {
            const label = checkbox.closest('label');
            if (label) label.remove();
        }
        
        // Re-add delete buttons
        addDeleteButtonsToCategories();
    } else {
        alert('Error saving category deletion. Please try again.');
    }
}

/**
 * Render all categories (default and custom) in filter buttons and form checkboxes
 */
function renderCustomCategories() {
    const deletedDefaults = loadDeletedDefaults();
    const customCategories = loadCustomCategories();
    const filtersContainer = document.querySelector('.filters');
    const checkboxGroup = document.querySelector('#uploadForm .checkbox-group');
    
    // Remove all category buttons except "All" and "+"
    document.querySelectorAll('.filter-btn[data-category]:not([data-category="all"])').forEach(btn => {
        if (btn.id !== 'addCategoryBtn') btn.remove();
    });
    
    // Remove all checkboxes
    checkboxGroup.querySelectorAll('label').forEach(label => label.remove());
    
    // Get active default categories (not deleted)
    const activeDefaults = defaultCategories.filter(cat => !deletedDefaults.includes(cat));
    
    // Add active default category buttons
    activeDefaults.forEach(category => {
        const btn = document.createElement('button');
        btn.className = 'filter-btn';
        btn.dataset.category = category;
        btn.textContent = category;
        btn.style.backgroundColor = 'hotpink';
        btn.style.color = '#000';
        
        const addBtn = document.getElementById('addCategoryBtn');
        filtersContainer.insertBefore(btn, addBtn);
    });
    
    // Add custom category filter buttons
    customCategories.forEach(category => {
        const btn = document.createElement('button');
        btn.className = 'filter-btn';
        btn.dataset.category = category;
        btn.classList.add('custom');
        btn.textContent = category;
        btn.style.backgroundColor = 'hotpink';
        btn.style.color = '#000';
        
        const addBtn = document.getElementById('addCategoryBtn');
        filtersContainer.insertBefore(btn, addBtn);
    });
    
    // Add active default category checkboxes
    activeDefaults.forEach(category => {
        const label = document.createElement('label');
        label.innerHTML = `<input type="checkbox" name="artCategory" value="${category}"> ${category}`;
        checkboxGroup.appendChild(label);
    });
    
    // Add custom category checkboxes
    customCategories.forEach(category => {
        const label = document.createElement('label');
        label.className = 'custom-category';
        label.innerHTML = `<input type="checkbox" name="artCategory" value="${category}"> ${category}`;
        checkboxGroup.appendChild(label);
    });
    
    // Add delete buttons to all categories
    addDeleteButtonsToCategories();
}

/**
 * Handle adding a new custom category
 */
async function handleAddCategory() {
    const password = prompt('Enter password to add a new category:');
    if (!password) {
        return;
    }
    
    if (password !== '') {
        alert('Invalid password.');
        return;
    }
    
    const categoryName = prompt('Enter the name of the new category:');
    if (!categoryName || !categoryName.trim()) {
        return;
    }
    
    const trimmedName = categoryName.trim();
    const allCategories = getAllCategories();
    
    // Check if category already exists
    if (allCategories.includes(trimmedName)) {
        alert('This category already exists.');
        return;
    }
    
    // Add to custom categories
    categoryData.customCategories.push(trimmedName);
    const saved = await saveCategories(password);
    
    if (saved) {
        // Re-render categories
        renderCustomCategories();
        alert(`Category "${trimmedName}" added successfully!`);
    } else {
        alert('Error saving category. Please try again.');
    }
}

/**
 * Initialize filter buttons using event delegation
 */
function initFilters() {
    const filtersContainer = document.querySelector('.filters');
    
    // Remove existing listeners by replacing the container's event handler
    // Use event delegation for all filter buttons
    filtersContainer.addEventListener('click', (e) => {
        const btn = e.target;
        
        // Handle + button
        if (btn.id === 'addCategoryBtn') {
            handleAddCategory();
            return;
        }
        
        // Handle filter buttons
        if (btn.classList.contains('filter-btn') && btn.dataset.category) {
            // Update active state
            document.querySelectorAll('.filter-btn:not(#addCategoryBtn)').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            // Update filter
            currentFilter = btn.dataset.category;
            
            // Refresh display
            initGallery();
        }
    });
}

/**
 * Handle image upload
 */
async function handleImageUpload() {
    const fileInput = document.getElementById('imageInput');
    const titleInput = document.getElementById('titleInput');
    const mediumInput = document.getElementById('mediumInput');
    const sizeInput = document.getElementById('sizeInput');
    const yearInput = document.getElementById('yearInput');
    const passwordInput = document.getElementById('passwordInput');
    const uploadBtn = document.getElementById('uploadBtn');
    
    const files = Array.from(fileInput.files || []);
    const title = titleInput.value.trim();
    const medium = mediumInput.value.trim();
    const size = sizeInput.value.trim();
    const year = yearInput.value.trim();
    const password = passwordInput.value;
    const categoryInputs = document.querySelectorAll('input[name="artCategory"]:checked');
    const categories = Array.from(categoryInputs).map(input => input.value);
    
    if (!files.length) {
        alert('Please select at least one image or video file.');
        return;
    }
    
    if (!title) {
        alert('Please enter a title.');
        return;
    }
    
    if (!password) {
        alert('Password is required.');
        return;
    }
    
    if (password !== '') {
        alert('Invalid password.');
        return;
    }
    
    // Create FormData to send files and metadata
    const formData = new FormData();
    files.forEach(f => {
        formData.append('image', f);
    });
    formData.append('title', title);
    formData.append('medium', medium);
    formData.append('size', size);
    formData.append('year', year);
    formData.append('password', password);
    if (categories.length > 0) {
        formData.append('categories', JSON.stringify(categories));
    }
    
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
            fetch('/api/art/upload', {
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
            titleInput.value = '';
            mediumInput.value = '';
            sizeInput.value = '';
            yearInput.value = '';
            passwordInput.value = '';
            document.getElementById('uploadForm').style.display = 'none';
            
            // Refresh gallery to show new art piece
            await initGallery();
            
            alert('Art piece uploaded successfully!');
        } else {
            alert('Error: ' + (result.error || 'Failed to upload art piece'));
        }
    } catch (error) {
        console.error('Upload error:', error);
        alert('Error uploading art piece: ' + error.message + '\n\nMake sure the server is running (npm start)');
    } finally {
        // Re-enable upload button
        uploadBtn.disabled = false;
        uploadBtn.textContent = 'Upload';
    }
}

/**
 * Handle art deletion
 */
async function handleDeleteArt(artId) {
    const password = prompt('Enter password to delete this art piece:');
    if (!password) {
        return;
    }
    
    if (password !== '') {
        alert('Invalid password.');
        return;
    }
    
    if (!confirm('Are you sure you want to delete this art piece?')) {
        return;
    }
    
    try {
        const response = await fetch('/api/art/delete', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                id: artId,
                password: password
            })
        });
        
        const result = await response.json();
        
        if (response.ok) {
            // Refresh gallery
            await initGallery();
            alert('Art piece deleted successfully!');
        } else {
            alert('Error: ' + (result.error || 'Failed to delete art piece'));
        }
    } catch (error) {
        console.error('Delete error:', error);
        alert('Error deleting art piece: ' + error.message);
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
        document.getElementById('titleInput').value = '';
        document.getElementById('mediumInput').value = '';
        document.getElementById('sizeInput').value = '';
        document.getElementById('yearInput').value = '';
        document.getElementById('passwordInput').value = '';
    });
}

// Initialize gallery and upload functionality when DOM is loaded
document.addEventListener('DOMContentLoaded', async () => {
    // Load categories from server first
    await loadCategories();
    
    // Load art once, then render and wire up filters/upload
    await loadArtPieces();
    initFilters(); // Initialize filters first (uses event delegation)
    renderCustomCategories(); // Render custom categories (buttons will work via delegation)
    addDeleteButtonsToCategories(); // Add delete buttons to default categories too
    initGallery();
    initUpload();
});

