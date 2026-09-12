"use strict";

const galleryControls = document.querySelectorAll(".product-gallery__navigation-button");
const featuredImageEl = document.querySelector(".product-gallery__main-image");
const thumbnailButtons = document.querySelectorAll(".product-gallery_actions");
const galleryStatus = document.querySelector("#gallery-status");

// Default image
let imageID = 1;
const TOTAL_IMAGES = 4;

const updateImage = () => {
    featuredImageEl.src = `assets/images/image-product-${imageID}.jpg`;
    updateActiveThumbnail();
};

const updateActiveThumbnail = () => {
    const displayedImage = featuredImageEl.src;

    thumbnailButtons.forEach((button) => {
        const thumbnail = button.querySelector(".product-gallery__thumbnail");
        const imageSource = thumbnail.src.replace("-thumbnail", "");

        button.classList.toggle("active", imageSource === displayedImage);
        button.setAttribute("aria-pressed", imageSource === displayedImage);
    });

    galleryStatus.textContent = `Showing product image ${imageID} of ${TOTAL_IMAGES}.`;
};

const displayNextImage = () => {
    imageID++;

    if (imageID > TOTAL_IMAGES) {
        imageID = 1; // Loop back to first image
    }

    updateImage();
};

const displayPreviousImage = () => {
    imageID--;

    if (imageID < 1) {
        imageID = TOTAL_IMAGES; // Loop back to last image
    }

    updateImage();
};

galleryControls.forEach((button) => {
    button.addEventListener("click", () => {
        const direction = button.dataset.direction;

        if (direction === "next") {
            displayNextImage();
        } else {
            displayPreviousImage();
        }
    });
});