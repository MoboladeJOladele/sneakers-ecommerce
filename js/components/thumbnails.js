"use strict";

const makeFeaturedImage = () => {
    const featuredImageEl = document.querySelector(".product-gallery__main-image");
    const buttons = document.querySelectorAll(".product-gallery_actions");
    const galleryStatus = document.querySelector("#gallery-status");

    buttons.forEach((button) => {
        button.addEventListener("click", () => {
            const thumbnail = button.querySelector(".product-gallery__thumbnail");
            const imageNumber = thumbnail.src.match(/image-product-(\d+)-thumbnail/)?.[1];

            featuredImageEl.src = thumbnail.src.replace("-thumbnail", "");
            buttons.forEach((currentButton) => {
                const isActive = currentButton === button;

                currentButton.classList.toggle("active", isActive);
                currentButton.setAttribute("aria-pressed", isActive);
            });
            galleryStatus.textContent = `Showing product image ${imageNumber} of ${buttons.length}.`;
        });
    });
};

makeFeaturedImage();