// List of sounds (will be loaded from server)
let sounds = [];
let currentFilter = 'all';
let soundPlayers = [];

// Default categories for sounds
const soundDefaultCategories = ['Music'];

// Category data (loaded from server)
let soundCategoryData = { customCategories: [], deletedDefaults: [] };

// Load sound categories from server
async function loadSoundCategories() {
    try {
        const response = await fetch('/api/sounds/categories');
        if (response.ok) {
            const data = await response.json();
            soundCategoryData = {
                customCategories: data.customCategories || [],
                deletedDefaults: data.deletedDefaults || []
            };
            return soundCategoryData;
        }
    } catch (error) {
        console.error('Error loading sound categories:', error);
    }
    return { customCategories: [], deletedDefaults: [] };
}

// Save sound categories to server (password should be provided by caller)
async function saveSoundCategories(password) {
    try {
        if (!password || password !== '') {
            return false;
        }
        
        const response = await fetch('/api/sounds/categories', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                customCategories: soundCategoryData.customCategories,
                deletedDefaults: soundCategoryData.deletedDefaults,
                password: password
            })
        });
        
        if (response.ok) {
            return true;
        } else {
            console.error('Error saving sound categories');
            return false;
        }
    } catch (error) {
        console.error('Error saving sound categories:', error);
        return false;
    }
}

function loadSoundCustomCategories() {
    return soundCategoryData.customCategories;
}

function loadSoundDeletedDefaults() {
    return soundCategoryData.deletedDefaults;
}

function getAllSoundCategories() {
    const deletedDefaults = loadSoundDeletedDefaults();
    const activeDefaults = soundDefaultCategories.filter(cat => !deletedDefaults.includes(cat));
    return [...activeDefaults, ...loadSoundCustomCategories()];
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
 * Load sounds from server
 */
async function loadSounds() {
    try {
        const response = await fetch('/api/sounds');
        if (response.ok) {
            const data = await response.json();
            sounds = data.sounds || [];
            return sounds;
        }
    } catch (error) {
        console.error('Error loading sounds:', error);
    }
    return [];
}

function pauseAllSounds(except) {
    soundPlayers.forEach(a => {
        if (a !== except) {
            a.pause();
        }
    });
}

function playNextSound(currentAudio) {
    if (!soundPlayers.length) return;
    const idx = soundPlayers.indexOf(currentAudio);
    const nextIdx = idx === -1 ? 0 : (idx + 1) % soundPlayers.length;
    const next = soundPlayers[nextIdx];
    if (!next) return;
    pauseAllSounds(next);
    try {
        next.currentTime = 0;
    } catch (e) {
        // ignore if cannot set
    }
    next.play();
}

/**
 * Create gallery item element for a sound
 */
function createSoundItem(sound) {
    const galleryItem = document.createElement('div');
    galleryItem.className = 'gallery-item sound-item';

    if (sound.imageFilename) {
        const imgWrap = document.createElement('div');
        imgWrap.className = 'sound-image-wrap';
        const img = document.createElement('img');
        img.src = `assets/${sound.imageFilename}`;
        img.alt = sound.title || 'Sound';
        img.className = 'sound-image';
        img.classList.add('lightbox-image');
        imgWrap.appendChild(img);
        galleryItem.appendChild(imgWrap);
    }

    const audio = document.createElement('audio');
    audio.src = `assets/${sound.filename}`;
    audio.preload = 'metadata';
    soundPlayers.push(audio);

    const infoContainer = document.createElement('div');
    infoContainer.className = 'date-container';

    const infoDiv = document.createElement('div');
    infoDiv.className = 'date sound-info';

    if (sound.categories && Array.isArray(sound.categories) && sound.categories.length > 0) {
        const categoriesDiv = document.createElement('div');
        categoriesDiv.className = 'sound-categories';
        sound.categories.forEach(category => {
            const categorySpan = document.createElement('span');
            categorySpan.className = 'sound-category';
            categorySpan.textContent = category;
            categoriesDiv.appendChild(categorySpan);
        });
        infoDiv.appendChild(categoriesDiv);
    }

    const titleDiv = document.createElement('div');
    titleDiv.textContent = sound.title || 'Untitled';
    titleDiv.className = 'sound-title';

    const artistDiv = document.createElement('div');
    if (sound.artist) {
        artistDiv.textContent = sound.artist;
        artistDiv.className = 'sound-artist';
    }

    const noteDiv = document.createElement('div');
    if (sound.note) {
        noteDiv.textContent = sound.note;
        noteDiv.className = 'sound-note';
    }

    const dateDiv = document.createElement('div');
    if (sound.date) {
        dateDiv.textContent = formatDate(new Date(sound.date));
        dateDiv.className = 'sound-date';
    }

    infoDiv.appendChild(titleDiv);
    if (sound.artist) infoDiv.appendChild(artistDiv);
    if (sound.note) infoDiv.appendChild(noteDiv);
    if (sound.date) infoDiv.appendChild(dateDiv);

    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'delete-btn';
    deleteBtn.textContent = '×';
    deleteBtn.title = 'Delete sound';
    deleteBtn.onclick = () => handleDeleteSound(sound.id);

    infoContainer.appendChild(infoDiv);
    infoContainer.appendChild(deleteBtn);

    // Custom controls
    const controls = document.createElement('div');
    controls.className = 'sound-controls';

    const playPauseBtn = document.createElement('button');
    playPauseBtn.type = 'button';
    playPauseBtn.className = 'sound-play-pause';
    playPauseBtn.textContent = '▶︎';

    const progressBar = document.createElement('div');
    progressBar.className = 'sound-progress-bar';

    const progressFill = document.createElement('div');
    progressFill.className = 'sound-progress-fill';
    progressBar.appendChild(progressFill);

    const scrubHandle = document.createElement('span');
    scrubHandle.className = 'sound-progress-handle';
    scrubHandle.textContent = '🐆';
    scrubHandle.title = 'Drag to scrub';
    scrubHandle.style.left = '0%';
    progressBar.appendChild(scrubHandle);

    const timeLabel = document.createElement('div');
    timeLabel.className = 'sound-time';
    timeLabel.textContent = '0:00';
    
    const skipBtn = document.createElement('button');
    skipBtn.type = 'button';
    skipBtn.className = 'sound-skip';
    skipBtn.textContent = '⏭';

    controls.appendChild(playPauseBtn);
    controls.appendChild(progressBar);
    controls.appendChild(timeLabel);
    controls.appendChild(skipBtn);

    // Wire up controls
    function formatTime(seconds) {
        const m = Math.floor(seconds / 60) || 0;
        const s = Math.floor(seconds % 60) || 0;
        return `${m}:${s.toString().padStart(2, '0')}`;
    }

    playPauseBtn.addEventListener('click', () => {
        if (audio.paused) {
            pauseAllSounds(audio);
            audio.play();
        } else {
            audio.pause();
        }
    });

    skipBtn.addEventListener('click', () => {
        playNextSound(audio);
    });

    audio.addEventListener('play', () => {
        pauseAllSounds(audio);
        playPauseBtn.textContent = '❚❚';
    });

    audio.addEventListener('pause', () => {
        playPauseBtn.textContent = '▶︎';
    });

    audio.addEventListener('ended', () => {
        playNextSound(audio);
    });

    let isDragging = false;

    function setProgressFromRatio(ratio) {
        if (!audio.duration) return;
        const r = Math.max(0, Math.min(1, ratio));
        audio.currentTime = r * audio.duration;
        progressFill.style.width = `${r * 100}%`;
        scrubHandle.style.left = `${r * 100}%`;
        timeLabel.textContent = formatTime(audio.currentTime);
    }

    function getRatioFromEvent(e) {
        const rect = progressBar.getBoundingClientRect();
        return (e.clientX - rect.left) / rect.width;
    }

    audio.addEventListener('timeupdate', () => {
        if (audio.duration && !isDragging) {
            const ratio = audio.currentTime / audio.duration;
            progressFill.style.width = `${ratio * 100}%`;
            scrubHandle.style.left = `${ratio * 100}%`;
            timeLabel.textContent = formatTime(audio.currentTime);
        }
    });

    progressBar.addEventListener('click', (e) => {
        if (e.target === scrubHandle) return;
        setProgressFromRatio(getRatioFromEvent(e));
    });

    scrubHandle.addEventListener('mousedown', (e) => {
        e.preventDefault();
        isDragging = true;
        setProgressFromRatio(getRatioFromEvent(e));
        const onMove = (e2) => setProgressFromRatio(getRatioFromEvent(e2));
        const onUp = () => {
            isDragging = false;
            document.removeEventListener('mousemove', onMove);
            document.removeEventListener('mouseup', onUp);
        };
        document.addEventListener('mousemove', onMove);
        document.addEventListener('mouseup', onUp);
    });

    galleryItem.appendChild(audio);
    galleryItem.appendChild(controls);
    galleryItem.appendChild(infoContainer);

    return galleryItem;
}

/**
 * Render the sounds gallery
 */
function renderSoundsGallery() {
    const gallery = document.getElementById('soundsGallery');
    gallery.innerHTML = '';
    soundPlayers = [];

    // Sort by date (newest first)
    sounds.sort((a, b) => {
        const dateA = a.date ? new Date(a.date).getTime() : 0;
        const dateB = b.date ? new Date(b.date).getTime() : 0;
        return dateB - dateA;
    });

    const filteredSounds = currentFilter === 'all'
        ? sounds
        : sounds.filter(sound => sound.categories && sound.categories.includes(currentFilter));

    filteredSounds.forEach(sound => {
        const item = createSoundItem(sound);
        gallery.appendChild(item);
    });
}

/**
 * Handle sound upload
 */
async function handleSoundUpload() {
    const fileInput = document.getElementById('audioInput');
    const titleInput = document.getElementById('titleInput');
    const artistInput = document.getElementById('artistInput');
    const noteInput = document.getElementById('noteInput');
    const passwordInput = document.getElementById('passwordInput');
    const uploadBtn = document.getElementById('uploadBtn');

    const file = fileInput.files[0];
    const title = titleInput.value.trim();
    const artist = artistInput.value.trim();
    const note = noteInput.value.trim();
    const password = passwordInput.value;
    const categoryInputs = document.querySelectorAll('input[name="soundCategory"]:checked');
    const categories = Array.from(categoryInputs).map(input => input.value);

    if (!file) {
        alert('Please select an audio file.');
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

    const formData = new FormData();
    formData.append('audio', file);
    formData.append('title', title);
    formData.append('artist', artist);
    formData.append('note', note);
    formData.append('password', password);
    formData.append('date', new Date().toISOString());
    if (categories.length > 0) {
        formData.append('categories', JSON.stringify(categories));
    }
    const imageInput = document.getElementById('soundImageInput');
    if (imageInput && imageInput.files && imageInput.files[0]) {
        formData.append('image', imageInput.files[0]);
    }

    uploadBtn.disabled = true;
    uploadBtn.textContent = 'Uploading...';

    try {
        const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('Upload timeout - server may not be running')), 10000);
        });

        const response = await Promise.race([
            fetch('/api/sounds/upload', {
                method: 'POST',
                body: formData
            }),
            timeoutPromise
        ]);

        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
            const text = await response.text();
            throw new Error(`Server returned ${response.status}: ${text.substring(0, 100)}`);
        }

        const result = await response.json();

        if (response.ok && result.success) {
            fileInput.value = '';
            titleInput.value = '';
            if (imageInput) imageInput.value = '';
            artistInput.value = '';
            noteInput.value = '';
            passwordInput.value = '';
            document.getElementById('uploadForm').style.display = 'none';

            await loadSounds();
            renderSoundsGallery();

            alert('Sound uploaded successfully!');
        } else {
            alert('Error: ' + (result.error || 'Failed to upload sound'));
        }
    } catch (error) {
        console.error('Upload error:', error);
        alert('Error uploading sound: ' + error.message + '\n\nMake sure the server is running (npm start)');
    } finally {
        uploadBtn.disabled = false;
        uploadBtn.textContent = 'Upload';
    }
}

/**
 * Handle sound deletion
 */
async function handleDeleteSound(soundId) {
    const password = prompt('Enter password to delete this sound:');
    if (!password) {
        return;
    }

    if (password !== '') {
        alert('Invalid password.');
        return;
    }

    if (!confirm('Are you sure you want to delete this sound?')) {
        return;
    }

    try {
        const response = await fetch('/api/sounds/delete', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                id: soundId,
                password: password
            })
        });

        const result = await response.json();

        if (response.ok && result.success) {
            await loadSounds();
            renderSoundsGallery();
            alert('Sound deleted successfully!');
        } else {
            alert('Error: ' + (result.error || 'Failed to delete sound'));
        }
    } catch (error) {
        console.error('Delete error:', error);
        alert('Error deleting sound: ' + error.message);
    }
}

/**
 * Initialize upload functionality and gallery
 */
function initUpload() {
    const addSoundBtn = document.getElementById('addSoundBtn');
    const uploadForm = document.getElementById('uploadForm');
    const uploadBtn = document.getElementById('uploadBtn');
    const cancelBtn = document.getElementById('cancelBtn');

    addSoundBtn.addEventListener('click', () => {
        uploadForm.style.display = uploadForm.style.display === 'none' ? 'block' : 'none';
    });

    uploadBtn.addEventListener('click', handleSoundUpload);

    cancelBtn.addEventListener('click', () => {
        uploadForm.style.display = 'none';
        document.getElementById('audioInput').value = '';
        document.getElementById('titleInput').value = '';
        const si = document.getElementById('soundImageInput');
        if (si) si.value = '';
        document.getElementById('artistInput').value = '';
        document.getElementById('noteInput').value = '';
        document.getElementById('passwordInput').value = '';
        document.querySelectorAll('input[name="soundCategory"]').forEach(cb => cb.checked = false);
    });
}

function addDeleteButtonsToSoundCategories() {
    const filterButtons = document.querySelectorAll('.filters .filter-btn[data-category]:not([data-category="all"])');
    filterButtons.forEach(btn => {
        if (btn.querySelector('.category-delete')) return;
        
        const deleteBtn = document.createElement('span');
        deleteBtn.className = 'category-delete';
        deleteBtn.textContent = ' ×';
        deleteBtn.style.cursor = 'pointer';
        deleteBtn.style.marginLeft = '5px';
        deleteBtn.style.fontWeight = 'bold';
        deleteBtn.onclick = (e) => {
            e.stopPropagation();
            handleDeleteSoundCategory(btn.dataset.category);
        };
        btn.appendChild(deleteBtn);
    });
}

async function handleDeleteSoundCategory(categoryName) {
    const password = prompt('Enter password to delete this tag:');
    if (!password) {
        return;
    }
    
    if (password !== '') {
        alert('Invalid password.');
        return;
    }
    
    if (!confirm(`Are you sure you want to delete the tag "${categoryName}"?`)) {
        return;
    }
    
    const isCustom = soundCategoryData.customCategories.includes(categoryName);
    
    if (isCustom) {
        soundCategoryData.customCategories = soundCategoryData.customCategories.filter(cat => cat !== categoryName);
    } else if (soundDefaultCategories.includes(categoryName)) {
        if (!soundCategoryData.deletedDefaults.includes(categoryName)) {
            soundCategoryData.deletedDefaults.push(categoryName);
        }
    }
    
    const saved = await saveSoundCategories(password);
    
    if (saved) {
        const btn = document.querySelector(`.filters .filter-btn[data-category="${categoryName}"]`);
        if (btn) btn.remove();
        
        const checkbox = document.querySelector(`input[name="soundCategory"][value="${categoryName}"]`);
        if (checkbox) {
            const label = checkbox.closest('label');
            if (label) label.remove();
        }
        
        addDeleteButtonsToSoundCategories();
    } else {
        alert('Error saving tag deletion. Please try again.');
    }
}

function renderSoundCategories() {
    const deletedDefaults = loadSoundDeletedDefaults();
    const customCategories = loadSoundCustomCategories();
    const filtersContainer = document.querySelector('.filters');
    const checkboxGroup = document.querySelector('#uploadForm .checkbox-group');
    
    document.querySelectorAll('.filters .filter-btn[data-category]:not([data-category="all"])').forEach(btn => {
        if (btn.id !== 'addCategoryBtn') btn.remove();
    });
    
    checkboxGroup.querySelectorAll('label').forEach(label => label.remove());
    
    const activeDefaults = soundDefaultCategories.filter(cat => !deletedDefaults.includes(cat));
    
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
    
    activeDefaults.forEach(category => {
        const label = document.createElement('label');
        label.innerHTML = `<input type="checkbox" name="soundCategory" value="${category}"> ${category}`;
        checkboxGroup.appendChild(label);
    });
    
    customCategories.forEach(category => {
        const label = document.createElement('label');
        label.className = 'custom-category';
        label.innerHTML = `<input type="checkbox" name="soundCategory" value="${category}"> ${category}`;
        checkboxGroup.appendChild(label);
    });
    
    addDeleteButtonsToSoundCategories();
}

async function handleAddSoundCategory() {
    const password = prompt('Enter password to add a new tag:');
    if (!password) {
        return;
    }
    
    if (password !== '') {
        alert('Invalid password.');
        return;
    }
    
    const categoryName = prompt('Enter the name of the new tag:');
    if (!categoryName || !categoryName.trim()) {
        return;
    }
    
    const trimmedName = categoryName.trim();
    const allCategories = getAllSoundCategories();
    
    if (allCategories.includes(trimmedName)) {
        alert('This tag already exists.');
        return;
    }
    
    soundCategoryData.customCategories.push(trimmedName);
    const saved = await saveSoundCategories(password);
    
    if (saved) {
        renderSoundCategories();
        alert(`Tag "${trimmedName}" added successfully!`);
    } else {
        alert('Error saving tag. Please try again.');
    }
}

function initSoundFilters() {
    const filtersContainer = document.querySelector('.filters');
    
    filtersContainer.addEventListener('click', (e) => {
        const btn = e.target;
        
        if (btn.id === 'addCategoryBtn') {
            handleAddSoundCategory();
            return;
        }
        
        if (btn.classList.contains('filter-btn') && btn.dataset.category) {
            document.querySelectorAll('.filters .filter-btn:not(#addCategoryBtn)').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            currentFilter = btn.dataset.category;
            
            renderSoundsGallery();
        }
    });
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', async () => {
    await loadSoundCategories();
    await loadSounds();
    initSoundFilters();
    renderSoundCategories();
    renderSoundsGallery();
    initUpload();
});

