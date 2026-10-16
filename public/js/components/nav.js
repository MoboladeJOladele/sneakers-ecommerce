"use strict";

const dialog = document.getElementById("primary-navigation");
const openButton = document.querySelector(".menu-toggle--open");
const closeButton = dialog.querySelector(".menu-toggle--close");

// Open menu and update aria-expanded
openButton.addEventListener("click", () => {
    dialog.showModal();
    openButton.setAttribute("aria-expanded", "true");
});

// Close menu
closeButton.addEventListener("click", () => {
    dialog.close();
});

// Update aria-expanded when dialog closes (via close button, backdrop click, or ESC key)
dialog.addEventListener("close", () => {
    openButton.setAttribute("aria-expanded", "false");
});

// Close when clicking on the backdrop
dialog.addEventListener("click", (event) => {
    if (event.target === dialog) {
        dialog.close();
    }
});

// Dynamic navigation: switch active link and close mobile menu when clicked
const navLinks = document.querySelectorAll(".nav__link");
navLinks.forEach((link) => {
    link.addEventListener("click", () => {
        navLinks.forEach((l) => l.removeAttribute("aria-current"));
        link.setAttribute("aria-current", "page");
        if (dialog.open) {
            dialog.close();
        }
    });
});