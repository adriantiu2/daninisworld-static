// Current filter category
let currentFilter = 'all';

// Default categories
const defaultCategories = ['Music', 'Art', 'Food', 'Cinema', 'Writing', 'gelato'];

// Category data (loaded from server)
let categoryData = { customCategories: [], deletedDefaults: [] };

// Load categories from server
async function loadCategories() {
    try {
        console.log('Loading categories from server...');
        const response = await fetch('/api/reviews/categories');
        if (response.ok) {
            const data = await response.json();
            console.log('Categories loaded from server:', data);
            categoryData = {
                customCategories: data.customCategories || [],
                deletedDefaults: data.deletedDefaults || []
            };
            console.log('Category data set to:', categoryData);
            return categoryData;
        } else {
            console.error('Failed to load categories, status:', response.status);
        }
    } catch (error) {
        console.error('Error loading categories:', error);
    }
    console.log('Returning empty category data');
    return { customCategories: [], deletedDefaults: [] };
}

// Save categories to server (password should be provided by caller)
async function saveCategories(password) {
    try {
        if (!password || password !== '') {
            console.log('Invalid password for saving categories');
            return false;
        }
        
        const dataToSave = {
            customCategories: categoryData.customCategories,
            deletedDefaults: categoryData.deletedDefaults,
            password: password
        };
        
        console.log('Saving categories to server:', dataToSave);
        
        const response = await fetch('/api/reviews/categories', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(dataToSave)
        });
        
        if (response.ok) {
            const result = await response.json();
            console.log('Categories saved successfully, server response:', result);
            return true;
        } else {
            const errorData = await response.json();
            console.error('Error saving categories, status:', response.status, 'error:', errorData);
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

// Format date for display
function formatDate(date) {
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const year = date.getFullYear();
    return `${month}-${day}-${year}`;
}

// Load reviews from server
async function loadReviews() {
    try {
        const response = await fetch('/api/reviews');
        if (response.ok) {
            const data = await response.json();
            const reviews = data.reviews || [];
            console.log('Loaded reviews:', reviews); // Debug log
            return reviews;
        }
    } catch (error) {
        console.error('Error loading reviews:', error);
    }
    return [];
}

// Save review to server
async function saveReview(review) {
    try {
        const response = await fetch('/api/reviews', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(review)
        });
        
        const result = await response.json();
        if (!response.ok) {
            console.error('Server error:', result);
            return null;
        }
        console.log('Review saved successfully:', result);
        return result;
    } catch (error) {
        console.error('Error saving review:', error);
        return null;
    }
}

// Delete review from server
async function deleteReview(reviewId) {
    try {
        const password = prompt('Enter password to delete this review:');
        if (!password) {
            return false;
        }
        
        if (password !== '') {
            alert('Invalid password.');
            return false;
        }
        
        if (!confirm('Are you sure you want to delete this review?')) {
            return false;
        }
        
        const response = await fetch('/api/reviews/delete', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                id: reviewId,
                password: password
            })
        });
        
        const result = await response.json();
        return response.ok;
    } catch (error) {
        console.error('Error deleting review:', error);
        return false;
    }
}

// Create review item element
function createReviewElement(review) {
    console.log('Creating review element:', review); // Debug log
    console.log('Review title:', review.title); // Debug log
    
    const reviewItem = document.createElement('div');
    reviewItem.className = 'review-item';
    reviewItem.dataset.categories = review.categories.join(',');
    
    const header = document.createElement('div');
    header.className = 'review-header';
    
    const categoriesDiv = document.createElement('div');
    categoriesDiv.className = 'review-categories';
    review.categories.forEach(category => {
        const categorySpan = document.createElement('span');
        categorySpan.className = 'review-category';
        categorySpan.textContent = category;
        categoriesDiv.appendChild(categorySpan);
    });
    
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'review-delete';
    deleteBtn.textContent = '×';
    deleteBtn.title = 'Delete review';
    deleteBtn.onclick = async () => {
        const success = await deleteReview(review.id);
        if (success) {
            await displayReviews();
        }
    };
    
    header.appendChild(categoriesDiv);
    header.appendChild(deleteBtn);
    
    const titleDiv = document.createElement('div');
    titleDiv.className = 'review-title';
    const titleText = review.title || review.Title || 'Untitled';
    console.log('Title text to display:', titleText); // Debug log
    console.log('Full review object keys:', Object.keys(review)); // Debug log
    titleDiv.textContent = titleText;
    titleDiv.style.display = 'block'; // Ensure it's visible
    titleDiv.style.visibility = 'visible'; // Ensure it's visible
    
    const ratingDiv = document.createElement('div');
    ratingDiv.className = 'review-rating';
    ratingDiv.textContent = '★'.repeat(Math.floor(review.rating)) + '☆'.repeat(5 - Math.floor(review.rating)) + ` (${review.rating}/5)`;
    
    const textDiv = document.createElement('div');
    textDiv.className = 'review-text';
    textDiv.textContent = review.text;
    
    const dateDiv = document.createElement('div');
    dateDiv.className = 'review-date';
    dateDiv.textContent = formatDate(new Date(review.date));
    
    reviewItem.appendChild(header);
    reviewItem.appendChild(titleDiv);
    reviewItem.appendChild(ratingDiv);
    reviewItem.appendChild(textDiv);
    
    // Add image if present (below text, above date)
    if (review.imageFilename) {
        const imageDiv = document.createElement('div');
        imageDiv.className = 'review-image';
        const img = document.createElement('img');
        img.src = `assets/${review.imageFilename}`;
        img.alt = review.title || 'Review image';
        img.style.maxWidth = '100%';
        img.style.height = 'auto';
        img.style.display = 'block';
        img.style.marginTop = '10px';
        img.classList.add('lightbox-image');
        imageDiv.appendChild(img);
        reviewItem.appendChild(imageDiv);
    }
    
    reviewItem.appendChild(dateDiv);
    
    // Debug: Check if titleDiv is actually in the DOM
    console.log('Title div created:', titleDiv);
    console.log('Title div textContent:', titleDiv.textContent);
    console.log('Title div parent:', titleDiv.parentElement);
    
    return reviewItem;
}

// Display reviews
async function displayReviews() {
    const container = document.getElementById('reviewsContainer');
    container.innerHTML = '';
    
    const reviews = await loadReviews();
    
    // Sort by date (newest first)
    reviews.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    // Filter reviews
    const filteredReviews = currentFilter === 'all' 
        ? reviews 
        : reviews.filter(review => review.categories.includes(currentFilter));
    
    // Create and append review elements
    filteredReviews.forEach(review => {
        const reviewElement = createReviewElement(review);
        container.appendChild(reviewElement);
    });
}

// Handle form submission
async function handleSubmitReview() {
    const titleInput = document.getElementById('titleInput');
    const categoryInputs = document.querySelectorAll('input[name="category"]:checked');
    const ratingInput = document.getElementById('ratingInput');
    const reviewTextInput = document.getElementById('reviewTextInput');
    const passwordInput = document.getElementById('reviewPasswordInput');
    
    // Validate
    if (!titleInput.value.trim()) {
        alert('Please enter a title.');
        return;
    }
    
    if (categoryInputs.length === 0) {
        alert('Please select at least one category.');
        return;
    }
    
    const rating = parseFloat(ratingInput.value);
    if (isNaN(rating) || rating < 0 || rating > 5) {
        alert('Please enter a valid rating between 0 and 5.');
        return;
    }
    
    if (!reviewTextInput.value.trim()) {
        alert('Please enter a review.');
        return;
    }
    
    if (!passwordInput.value) {
        alert('Password is required.');
        return;
    }
    
    if (passwordInput.value !== '') {
        alert('Invalid password.');
        return;
    }
    
    // Get selected categories
    const categories = Array.from(categoryInputs).map(input => input.value);
    
    // Get image file if provided
    const imageInput = document.getElementById('reviewImageInput');
    const imageFile = imageInput.files[0];
    
    // Create FormData to send file and metadata
    const formData = new FormData();
    formData.append('title', titleInput.value.trim());
    formData.append('categories', JSON.stringify(categories));
    formData.append('rating', rating.toString());
    formData.append('text', reviewTextInput.value.trim());
    formData.append('date', new Date().toISOString());
    formData.append('password', passwordInput.value);
    
    if (imageFile) {
        formData.append('image', imageFile);
    }
    
    try {
        const response = await fetch('/api/reviews', {
            method: 'POST',
            body: formData
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Error submitting review');
        }
        
        const result = await response.json();
        
        if (result.success) {
            // Reset form
            titleInput.value = '';
            categoryInputs.forEach(input => input.checked = false);
            ratingInput.value = '';
            reviewTextInput.value = '';
            imageInput.value = '';
            passwordInput.value = '';
            document.getElementById('reviewForm').style.display = 'none';
            
            // Refresh reviews
            await displayReviews();
            
            alert('Review submitted successfully!');
        } else {
            alert('Error submitting review: ' + (result.error || 'Unknown error'));
        }
    } catch (error) {
        console.error('Error submitting review:', error);
        alert('Error submitting review: ' + error.message);
    }
    
    console.log('Server response:', result); // Debug log
    
    if (result) {
        // Reset form
        titleInput.value = '';
        categoryInputs.forEach(input => input.checked = false);
        ratingInput.value = '';
        reviewTextInput.value = '';
        passwordInput.value = '';
        document.getElementById('reviewForm').style.display = 'none';
        
        // Refresh reviews
        await displayReviews();
        
        alert('Review submitted successfully!');
    } else {
        alert('Error submitting review. Make sure the server is running.');
    }
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
    const checkboxGroup = document.querySelector('#reviewForm .checkbox-group');
    
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
        btn.style.backgroundColor = 'chartreuse';
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
        btn.style.backgroundColor = 'chartreuse';
        btn.style.color = '#000';
        
        const addBtn = document.getElementById('addCategoryBtn');
        filtersContainer.insertBefore(btn, addBtn);
    });
    
    // Add active default category checkboxes
    activeDefaults.forEach(category => {
        const label = document.createElement('label');
        label.innerHTML = `<input type="checkbox" name="category" value="${category}"> ${category}`;
        checkboxGroup.appendChild(label);
    });
    
    // Add custom category checkboxes
    customCategories.forEach(category => {
        const label = document.createElement('label');
        label.className = 'custom-category';
        label.innerHTML = `<input type="checkbox" name="category" value="${category}"> ${category}`;
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
        // Revert the change if save failed
        categoryData.customCategories.pop();
        alert('Error saving category. Please try again.');
    }
}

// Initialize filter buttons using event delegation
function initFilters() {
    const filtersContainer = document.querySelector('.filters');
    
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
            displayReviews();
        }
    });
}

// Initialize page
async function init() {
    // Load categories from server first
    await loadCategories();
    
    // Add review button
    const addReviewBtn = document.getElementById('addReviewBtn');
    const reviewForm = document.getElementById('reviewForm');
    const submitBtn = document.getElementById('submitReviewBtn');
    const cancelBtn = document.getElementById('cancelReviewBtn');
    
    addReviewBtn.addEventListener('click', () => {
        reviewForm.style.display = reviewForm.style.display === 'none' ? 'block' : 'none';
    });
    
    submitBtn.addEventListener('click', handleSubmitReview);
    
    cancelBtn.addEventListener('click', () => {
        reviewForm.style.display = 'none';
        document.getElementById('titleInput').value = '';
        document.querySelectorAll('input[name="category"]').forEach(cb => cb.checked = false);
        document.getElementById('ratingInput').value = '';
        document.getElementById('reviewTextInput').value = '';
        document.getElementById('reviewPasswordInput').value = '';
    });
    
    // Initialize filters first (uses event delegation)
    initFilters();
    
    // Render custom categories (buttons will work via delegation)
    renderCustomCategories();
    
    // Add delete buttons to default categories too
    addDeleteButtonsToCategories();
    
    // Load and display reviews
    await loadReviews();
    displayReviews();
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', init);

