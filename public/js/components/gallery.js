"use strict";

let imageID = 1;

// Normal gallery
const featuredImageEl = document.querySelector(
    ".product-gallery__main-image"
);

const galleryControls = document.querySelectorAll(
    ".product-gallery__navigation-button"
);

const thumbnailButtons = document.querySelectorAll(
    ".product-gallery_actions"
);

const TOTAL_IMAGES = thumbnailButtons.length;

const galleryStatus = document.querySelector("#gallery-status");

// Lightbox
const lightbox = document.querySelector(".lightbox");

const openLightboxButton = document.querySelector(
    ".product-gallery__open-lightbox"
);

const closeLightboxButton = document.querySelector(
    ".lightbox__close"
);

const lightboxImageEl = document.querySelector(
    ".lightbox__main-image"
);

const lightboxControls = document.querySelectorAll(
    ".lightbox__navigation-button"
);

const lightboxThumbnailButtons = document.querySelectorAll(
    ".lightbox__thumbnail-button"
);


// Update both galleries
const updateImage = () => {
    const imageSource = `assets/images/image-product-${imageID}.jpg`;

    // Normal gallery
    featuredImageEl.src = imageSource;

    // Lightbox
    lightboxImageEl.src = imageSource;

    // Update active thumbnails
    updateActiveThumbnails();
};


// Update the active thumbnail in both galleries
const updateActiveThumbnails = () => {
    const updateThumbnails = (buttons) => {
        buttons.forEach((button, index) => {
            const isActive = index + 1 === imageID;

            button.classList.toggle("active", isActive);
            button.setAttribute("aria-pressed", isActive);
        });
    };

    updateThumbnails(thumbnailButtons);
    updateThumbnails(lightboxThumbnailButtons);

    galleryStatus.textContent =
        `Showing product image ${imageID} of ${TOTAL_IMAGES}.`;
};


// Next image
const displayNextImage = () => {
    imageID++;

    if (imageID > TOTAL_IMAGES) {
        imageID = 1;
    }

    updateImage();
};


// Previous image
const displayPreviousImage = () => {
    imageID--;

    if (imageID < 1) {
        imageID = TOTAL_IMAGES;
    }

    updateImage();
};


// Set up navigation buttons
const setupNavigation = (controls) => {
    controls.forEach((button) => {
        button.addEventListener("click", () => {
            if (button.dataset.direction === "next") {
                displayNextImage();
            } else {
                displayPreviousImage();
            }
        });
    });
};

setupNavigation(galleryControls);
setupNavigation(lightboxControls);


// Set up thumbnail buttons
const setupThumbnails = (buttons) => {
    buttons.forEach((button, index) => {
        button.addEventListener("click", () => {
            imageID = index + 1;
            updateImage();
        });
    });
};

setupThumbnails(thumbnailButtons);
setupThumbnails(lightboxThumbnailButtons);


// Open lightbox
openLightboxButton.addEventListener("click", () => {
    lightbox.showModal();
});


// Close lightbox
closeLightboxButton.addEventListener("click", () => {
    lightbox.close();
});