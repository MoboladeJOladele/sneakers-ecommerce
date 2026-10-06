"use strict";

let imageIndex = 1;

const imageDescriptions = [
    "Two sneakers on an orange background, one showing its sole",
    "A pair of sneakers on stacked stones with branches in the foreground",
    "A sneaker balanced on two stacked stones",
    "Side view of a sneaker above two stacked stones",
];

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
    const imageSource = `assets/images/image-product-${imageIndex}.jpg`;
    const imageDescription = imageDescriptions[imageIndex - 1];

    // Normal gallery
    featuredImageEl.src = imageSource;
    featuredImageEl.alt = imageDescription;

    // Lightbox
    lightboxImageEl.src = imageSource;
    lightboxImageEl.alt = imageDescription;

    // Update active thumbnails
    updateActiveThumbnails();
};


// Update the active thumbnail in both galleries
const updateActiveThumbnails = () => {
    const updateThumbnails = (buttons) => {
        buttons.forEach((button, index) => {
            const isActive = index + 1 === imageIndex;

            button.classList.toggle("active", isActive);
            button.setAttribute("aria-pressed", isActive);
        });
    };

    updateThumbnails(thumbnailButtons);
    updateThumbnails(lightboxThumbnailButtons);

    galleryStatus.textContent =
        `Showing product image ${imageIndex} of ${TOTAL_IMAGES}.`;
};


// Next image
const displayNextImage = () => {
    imageIndex++;

    if (imageIndex > TOTAL_IMAGES) {
        imageIndex = 1;
    }

    updateImage();
};


// Previous image
const displayPreviousImage = () => {
    imageIndex--;

    if (imageIndex < 1) {
        imageIndex = TOTAL_IMAGES;
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
            imageIndex = index + 1;
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


const desktopMediaQuery = window.matchMedia("(width > 48rem)");

const syncLightboxTrigger = () => {
    openLightboxButton.inert = !desktopMediaQuery.matches;
};

desktopMediaQuery.addEventListener("change", syncLightboxTrigger);
syncLightboxTrigger();