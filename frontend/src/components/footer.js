import footerHTML from '../layouts/footer.html?raw';
class AppFooter extends HTMLElement {
	connectedCallback() {
		this.innerHTML = footerHTML;
	}
}
customElements.define('app-footer', AppFooter);



// Toggle footer sections on mobile
function toggleFooterSection() {
	const buttonsSvgFooter = document.querySelectorAll(".toggle-footer-btn");
	const boxesFooter = document.querySelectorAll(".toggle-footer-box");
	buttonsSvgFooter.forEach((btn, i) => {
		btn.addEventListener("click", () => {
			const box = boxesFooter[i];
			if (box.style.maxHeight && box.style.maxHeight !== "0px") {
				box.style.maxHeight = "0px";
			} else {
				box.style.maxHeight = box.scrollHeight + "px";
			}
			btn.classList.toggle("rotate-90");
		});
	});
}
//Run function on script load
(() => {
	toggleFooterSection();
})();
