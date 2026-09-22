"use strict";

const navElement = document.getElementById('primary-navigation');
const navToggle = document.querySelector('.menu-toggle');
const navList = navElement.querySelector('.nav__list');
const navIcon = navToggle.querySelector("use");

navToggle.addEventListener('click', function () {
    const isExpanded = this.getAttribute('aria-expanded') === 'true';

    this.setAttribute('aria-expanded', !isExpanded);

    navList.dataset.visible = !isExpanded;

    const icon = !isExpanded ? "#icon-close" : "#icon-menu";

    navIcon.setAttribute(
        "href",
        `assets/icons/icons.svg${icon}`
    );

    this.setAttribute(
        "aria-label",
        isExpanded ? "Open menu" : "Close menu"
    );
});