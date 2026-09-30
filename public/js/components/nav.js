"use strict";

const dialog = document.getElementById("primary-navigation");
const openButton = document.querySelector(".menu-toggle--open");
const closeButton = dialog.querySelector(".menu-toggle--close");

openButton.addEventListener("click", () => {
    dialog.showModal();
});

closeButton.addEventListener("click", () => {
    dialog.close();
});

dialog.addEventListener("click", (event) => {
    if (event.target === dialog) {
        dialog.close();
    }
});

dialog.querySelectorAll(".nav__link").forEach((link) => {
    link.addEventListener("click", () => {
        dialog.close();
    });
});

dialog.addEventListener("toggle", () => {
    openButton.setAttribute("aria-expanded", dialog.open);
});