// Simple image lightbox shared across pages
// Any <img> with class "lightbox-image" will open in a full-screen viewer

(function () {
    let lightbox;
    let lightboxImage;
    let captionEl;
    let prevBtn;
    let nextBtn;
    let closeBtn;

    let images = [];
    let currentIndex = 0;
    let touchStartX = 0;

    function ensureLightbox() {
        if (lightbox) return;

        lightbox = document.createElement('div');
        lightbox.id = 'imageLightbox';

        const backdrop = document.createElement('div');
        backdrop.className = 'lightbox-backdrop';

        const content = document.createElement('div');
        content.className = 'lightbox-content';

        lightboxImage = document.createElement('img');
        lightboxImage.className = 'lightbox-img';

        captionEl = document.createElement('div');
        captionEl.className = 'lightbox-caption';

        prevBtn = document.createElement('button');
        prevBtn.type = 'button';
        prevBtn.className = 'lightbox-nav lightbox-prev';
        prevBtn.textContent = '◀';

        nextBtn = document.createElement('button');
        nextBtn.type = 'button';
        nextBtn.className = 'lightbox-nav lightbox-next';
        nextBtn.textContent = '▶';

        closeBtn = document.createElement('button');
        closeBtn.type = 'button';
        closeBtn.className = 'lightbox-close';
        closeBtn.textContent = '×';

        content.appendChild(lightboxImage);
        content.appendChild(captionEl);
        lightbox.appendChild(backdrop);
        lightbox.appendChild(content);
        lightbox.appendChild(prevBtn);
        lightbox.appendChild(nextBtn);
        lightbox.appendChild(closeBtn);

        document.body.appendChild(lightbox);

        backdrop.addEventListener('click', closeLightbox);
        closeBtn.addEventListener('click', closeLightbox);

        prevBtn.addEventListener('click', function () {
            showImage((currentIndex - 1 + images.length) % images.length);
        });

        nextBtn.addEventListener('click', function () {
            showImage((currentIndex + 1) % images.length);
        });

        lightbox.addEventListener('touchstart', function (e) {
            if (!e.touches || e.touches.length !== 1) return;
            touchStartX = e.touches[0].clientX;
        });

        lightbox.addEventListener('touchend', function (e) {
            if (!e.changedTouches || e.changedTouches.length !== 1) return;
            const dx = e.changedTouches[0].clientX - touchStartX;
            const threshold = 40;
            if (dx > threshold) {
                // swipe right -> previous
                showImage((currentIndex - 1 + images.length) % images.length);
            } else if (dx < -threshold) {
                // swipe left -> next
                showImage((currentIndex + 1) % images.length);
            }
        });

        // Close when clicking anywhere that isn't the image or nav/close controls
        lightbox.addEventListener('click', function (e) {
            const target = e.target;
            if (!target) return;
            // Ignore clicks on the image itself or any of the control buttons
            if (
                target.closest('.lightbox-img') ||
                target.closest('.lightbox-nav') ||
                target.closest('.lightbox-close')
            ) {
                return;
            }
            closeLightbox();
        });

        document.addEventListener('keydown', function (e) {
            if (!lightbox || !lightbox.classList.contains('active')) return;
            if (e.key === 'Escape') {
                closeLightbox();
            } else if (e.key === 'ArrowLeft') {
                showImage((currentIndex - 1 + images.length) % images.length);
            } else if (e.key === 'ArrowRight') {
                showImage((currentIndex + 1) % images.length);
            }
        });
    }

    function showImage(index) {
        if (!images.length) return;
        currentIndex = index;
        const item = images[currentIndex];
        if (!item) return;

        // DOM element case
        if (item && item.nodeType === 1) {
            const imgEl = item;
            lightboxImage.src = imgEl.src;
            lightboxImage.alt = imgEl.alt || '';
            captionEl.textContent = imgEl.alt || '';
            return;
        }

        // Virtual item case ({ src, alt })
        lightboxImage.src = item.src;
        lightboxImage.alt = item.alt || '';
        captionEl.textContent = item.alt || '';
    }

    function openLightbox(startImg) {
        ensureLightbox();

        const seq = startImg.dataset ? startImg.dataset.lightboxSeq : null;

        if (seq) {
            const urls = seq.split('|').filter(Boolean);
            const alt = startImg.alt || '';
            images = urls.map(url => ({ src: url, alt }));

            let idx = 0;
            if (startImg.dataset.lightboxIndex != null) {
                const parsed = parseInt(startImg.dataset.lightboxIndex, 10);
                if (!isNaN(parsed)) {
                    idx = parsed;
                }
            }
            currentIndex = Math.max(0, Math.min(images.length - 1, idx));
        } else {
            images = Array.prototype.slice.call(document.querySelectorAll('img.lightbox-image'));
            currentIndex = images.indexOf(startImg);
            if (currentIndex < 0) {
                currentIndex = 0;
            }
        }

        if (!images.length) return;

        showImage(currentIndex);
        lightbox.classList.add('active');
    }

    function closeLightbox() {
        if (lightbox) {
            lightbox.classList.remove('active');
        }
    }

    function initLightboxClicks() {
        document.addEventListener('click', function (e) {
            const img = e.target && e.target.closest('img.lightbox-image');
            if (!img) return;
            e.preventDefault();
            openLightbox(img);
        });
    }

    document.addEventListener('DOMContentLoaded', function () {
        initLightboxClicks();
    });
})();

