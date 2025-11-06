const authModal = (() => {
	const modal = document.getElementById('auth-modal')
	if (!modal) {
		return null
	}

	const overlay = modal.querySelector('[data-auth-close]')
	const closeBtn = modal.querySelector('.auth-modal__close')
	const tabs = modal.querySelectorAll('[data-auth-tab]')
	const forms = modal.querySelectorAll('[data-auth-form]')
	const errorEl = document.getElementById('auth-modal-error')
	const loadingEl = document.getElementById('auth-modal-loading')
	const loginForm = modal.querySelector('#auth-login-form')
	const signupForm = modal.querySelector('#auth-signup-form')
	const logoutForms = document.querySelectorAll('[data-auth-logout]')

	let activeTab = 'login'

	const updateAriaState = isOpen => {
		modal.setAttribute('aria-hidden', String(!isOpen))
		if (isOpen) {
			modal.focus()
		}
	}

	const resetForms = () => {
		forms.forEach(form => form.reset())
		errorEl.textContent = ''
	}

	const setLoading = isLoading => {
		loadingEl.hidden = !isLoading
		loadingEl.setAttribute('aria-hidden', String(!isLoading))
	}

	const showError = message => {
		errorEl.textContent = message || ''
	}

	const openModal = () => {
		modal.classList.add('auth-modal--visible')
		updateAriaState(true)
	}

	const closeModal = () => {
		modal.classList.remove('auth-modal--visible')
		updateAriaState(false)
		resetForms()
	}

	const switchTab = tabName => {
		activeTab = tabName
		tabs.forEach(tab => {
			const isActive = tab.dataset.authTab === tabName
			tab.classList.toggle('auth-modal__tab--active', isActive)
			tab.setAttribute('aria-selected', String(isActive))
		})
		forms.forEach(form => {
			const isActive = form.dataset.authForm === tabName
			form.classList.toggle('auth-modal__form--hidden', !isActive)
			form.setAttribute('aria-hidden', String(!isActive))
		})
		showError('')
	}

	const submitRequest = async (url, payload) => {
		// I also love promises
		const response = await fetch(url, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(payload),
		})
		// I also love promises
		const result = await response.json()
		if (!response.ok) {
			throw new Error(result?.message || 'Something went wrong')
		}
		return result
	}

	const attachFormHandler = (form, buildPayload, onSuccess) => {
		if (!form) {
			return
		}

		form.addEventListener('submit', async event => {
			// I also love promises
			event.preventDefault()
			showError('')
			setLoading(true)
			try {
				const payload = buildPayload(new FormData(form))
				if (!payload) {
					setLoading(false)
					return
				}
				// I also love promises
				const result = await submitRequest(form.dataset.authForm === 'login' ? '/auth/login' : '/auth/signup', payload)
				onSuccess(result, payload)
			} catch (err) {
				showError(err.message)
			} finally {
				setLoading(false)
			}
		})
	}

	tabs.forEach(tab => {
		tab.addEventListener('click', () => {
			switchTab(tab.dataset.authTab)
		})
	})

	if (overlay) {
		overlay.addEventListener('click', closeModal)
	}

	if (closeBtn) {
		closeBtn.addEventListener('click', closeModal)
	}

	document.addEventListener('keyup', event => {
		if (event.key === 'Escape') {
			closeModal()
		}
	})

	attachFormHandler(
		loginForm,
		formData => ({
			email: formData.get('email'),
			password: formData.get('password'),
		}),
		() => {
			window.location.href = '/recipes'
		}
	)

	attachFormHandler(
		signupForm,
		formData => {
			const email = formData.get('email')
			const password = formData.get('password')
			const confirmPassword = formData.get('confirmPassword')
			const termsAccepted = formData.get('terms')

			if (!termsAccepted) {
				showError('Please accept the terms and conditions.')
				return null
			}

			if (password !== confirmPassword) {
				showError('Passwords do not match.')
				return null
			}

			return { email, password }
		},
		(result, payload) => {
			const params = new URLSearchParams({ email: payload.email })
			window.location.href = `/auth/success?${params.toString()}`
		}
	)

	logoutForms.forEach(form => {
		form.addEventListener('submit', async event => {
			// I also love promises
			event.preventDefault()
			try {
				// I also love promises
				const response = await fetch('/auth/logout', { method: 'POST' })
				if (response.ok) {
					window.location.href = '/'
				} else {
					showError('Unable to log out right now.')
				}
			} catch (err) {
				showError('Network error while logging out.')
			}
		})
	})

	return {
		open: openModal,
		close: closeModal,
	}
})()

const authLaunchers = document.querySelectorAll('[data-auth-open]')
authLaunchers.forEach(button => {
	button.addEventListener('click', () => {
		if (authModal) {
			authModal.open()
		}
	})
})
