import loginHTML from '../pages/login.html?raw';

class AppLogin extends HTMLElement {
	connectedCallback() {
		this.innerHTML = loginHTML;
	}
}
customElements.define('app-login', AppLogin);


// Toggle login modal
function toggleLoginModal() {
	const showLoginBtn = document.getElementById('showLoginBtn');
	const showRegisterBtn = document.getElementById('showRegisterBtn');
	const loginModal = document.getElementById('loginModal');
	const registerModal = document.getElementById('registerModal');
	const modalLine = document.getElementById('modalLine');
	showLoginBtn.addEventListener('click', () => {
		if (registerModal.classList.contains('hidden') === false) {
			registerModal.classList.add('hidden');
			loginModal.classList.remove('hidden');
			modalLine.classList.remove('translate-x-[100%]');
		} else {
			return;
		}
	});
	showRegisterBtn.addEventListener('click', () => {
		if (loginModal.classList.contains('hidden') === false) {
			loginModal.classList.add('hidden');
			registerModal.classList.remove('hidden');
			modalLine.classList.add('translate-x-[100%]');
		} else {
			return;
		}
	});
}

//Run function on script load
(() => {
	toggleLoginModal();
})();