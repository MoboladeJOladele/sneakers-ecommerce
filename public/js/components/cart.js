"use strict";

const cart = {
	button: document.querySelector(".cart-button"),
	popover: document.querySelector("#cart"),
	count: document.querySelector(".cart-button__count"),
	status: document.querySelector("#cart-status"),
	empty: document.querySelector(".cart-popover__empty"),
	item: document.querySelector(".cart-popover__item"),
	quantity: document.querySelector(".cart-popover__quantity"),
	total: document.querySelector(".cart-popover__total strong"),
	checkout: document.querySelector(".cart-popover__checkout"),
	remove: document.querySelector(".cart-popover__remove"),
	title: document.querySelector("#cart-title"),
};

const product = {
	quantity: document.querySelector(".quantity-selector__value"),
	buttons: document.querySelectorAll(".quantity-selector__button"),
	add: document.querySelector(".product__add-to-cart"),
};

const PRICE = 125;

let selectedQuantity = 0;
let cartQuantity = 0;

const formatPrice = (amount) => `$${amount.toFixed(2)}`;

const render = () => {
	const hasItems = cartQuantity > 0;

	cart.button.setAttribute(
	"aria-label",
	hasItems
		? `Open shopping cart, ${cartQuantity} items`
		: "Open shopping cart"
	);

	product.quantity.value = selectedQuantity;
	product.buttons[0].disabled = selectedQuantity === 0;
	product.buttons[0].setAttribute(
		"aria-disabled",
		String(selectedQuantity === 0)
	);

	cart.count.textContent = cartQuantity;
	cart.count.hidden = !hasItems;
	cart.empty.hidden = hasItems;
	cart.item.hidden = !hasItems;
	cart.checkout.hidden = !hasItems;
	cart.quantity.textContent = cartQuantity;
	cart.total.textContent = formatPrice(PRICE * cartQuantity);
};

product.buttons.forEach((button, index) => {
	button.addEventListener("click", () => {
		selectedQuantity = Math.max(
			0,
			selectedQuantity + (index === 0 ? -1 : 1)
		);
		render();
	});
});

cart.popover.addEventListener("toggle", () => {
	cart.button.setAttribute(
		"aria-expanded",
		String(cart.popover.matches(":popover-open"))
	);
});

product.add.addEventListener("click", () => {
	if (selectedQuantity === 0) {
		product.buttons[1].focus();
		return;
	}

	cartQuantity += selectedQuantity;
	selectedQuantity = 0;

	cart.status.textContent =
		`Cart now contains ${cartQuantity} ${cartQuantity === 1 ? "item" : "items"}.`;

	render();

	if (!cart.popover.matches(":popover-open")) {
		cart.popover.showPopover();
	}
});

// Announce removal to screen readers
cart.remove.addEventListener("click", () => {
	cartQuantity = 0;
	cart.status.textContent = "Your cart is now empty.";
	render();
	cart.title.focus();
});

// Handle checkout button click
cart.checkout.addEventListener("click", () => {
	cartQuantity = 0;
	render();
	alert("Thank you for your order! Your sneakers are on the way.");
	cart.popover.hidePopover();
	cart.button.focus();
});

render();