import headerHTML from '../layouts/header.html?raw';
class AppHeader extends HTMLElement {
	connectedCallback() {
		this.innerHTML = headerHTML;
	}
}
customElements.define('app-header', AppHeader);

//toggle search input on mobile
function toggleSearchInputM() {
	const btn = document.getElementById('search-btn');
	const input = document.getElementById('search-input');
	const svgPath = document.getElementById('search-icon-path');
	btn.addEventListener('click', (e) => {
		e.preventDefault();
		if (input.classList.contains('opacity-100')) {
			input.classList.remove('w-full', 'opacity-100');
			input.classList.add('w-[10px]', 'opacity-0');
			svgPath.setAttribute('fill', 'white');
		} else {
			input.classList.remove('w-[10px]', 'opacity-0');
			input.classList.add('w-full', 'opacity-100');
			svgPath.setAttribute('fill', 'black');

			input.focus();
		}
	});
}
//toggle search input on desktop
function closeSearchInputD() {
	const btnDesktop = document.getElementById('search-btn-desktop');
	const inputDesktop = document.getElementById('search-input-desktop');
	const svgPathDesktop = document.getElementById('search-icon-path-desktop');
	const searchDesktopContainer = document.getElementById('search-desktop-container');
	btnDesktop.addEventListener('click', (e) => {
		e.preventDefault();
		if (inputDesktop.classList.contains('opacity-100')) {
			inputDesktop.classList.remove('w-full', 'opacity-100');
			inputDesktop.classList.add('w-[10px]', 'opacity-0');
			searchDesktopContainer.classList.remove('flex-1');
			svgPathDesktop.setAttribute('fill', 'white');
		} else {
			searchDesktopContainer.classList.add('flex-1');
			inputDesktop.classList.remove('w-[10px]', 'opacity-0');
			inputDesktop.classList.add('w-full', 'opacity-100');
			svgPathDesktop.setAttribute('fill', 'black');
			inputDesktop.focus();
		}
	});
}
//toggle mobile menu
function toggleMobileMenu() {
	const mobileOpenMenu = document.getElementById('menuBtn');
	const mobileMenu = document.getElementById('mobileMenu');
	mobileOpenMenu.addEventListener('click', () => {
		mobileOpenMenu.classList.toggle('menu-open');
		mobileMenu.classList.toggle('hidden');
	});
}
//Run function on script load
(() => {
	toggleSearchInputM();
	closeSearchInputD();
	toggleMobileMenu();
})();