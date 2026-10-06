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

cart.remove.addEventListener("click", () => {
	cartQuantity = 0;
	render();
});

render();