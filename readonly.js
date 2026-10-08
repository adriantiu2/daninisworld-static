(() => {
    const originalFetch = window.fetch.bind(window);
    const sources = {
        '/api/images': 'data/images.json',
        '/api/reviews': 'data/reviews.json',
        '/api/art': 'data/art.json',
        '/api/sounds': 'data/sounds.json',
        '/api/art/categories': 'data/art-categories.json',
        '/api/reviews/categories': 'data/review-categories.json',
        '/api/sounds/categories': 'data/sound-categories.json'
    };
    window.fetch = (input, options = {}) => {
        const method = (options.method || (input instanceof Request ? input.method : 'GET')).toUpperCase();
        if (method !== 'GET' && method !== 'HEAD') {
            return Promise.reject(new Error('This website is read-only.'));
        }
        const key = typeof input === 'string' ? input : input.url;
        if (sources[key]) return originalFetch(new URL(sources[key], document.baseURI), options);
        if (key.startsWith('/api/') || key === '/upload') {
            return Promise.reject(new Error('This website is read-only.'));
        }
        return originalFetch(input, options);
    };
    const admin = '#addImageBtn, #addReviewBtn, #addCategoryBtn, #uploadForm, #reviewForm, .delete-btn, .edit-btn, .review-delete, .review-edit, .category-delete';
    document.addEventListener('click', event => {
        if (event.target.closest(admin)) {
            event.preventDefault();
            event.stopImmediatePropagation();
        }
    }, true);
})();
