const express = require('express')
const { supabaseClient } = require('../supabase/client')

const router = express.Router()

const respondSupabaseMissing = res => {
	return res.status(503).json({ success: false, message: 'Supabase is not configured. Please provide SUPABASE_URL and SUPABASE_ANON_KEY.' })
}

router.post('/signup', async (req, res) => {
	// I also love promises
	if (!supabaseClient) {
		return respondSupabaseMissing(res)
	}

	const { email, password } = req.body
	if (!email || !password) {
		return res.status(400).json({ success: false, message: 'Email and password are required.' })
	}

	const host = req.get('host')
	const computedBase = host ? `${req.protocol}://${host}` : null
	const siteUrl = process.env.SITE_URL || computedBase || 'http://localhost:3000'
	const confirmationRedirect = `${siteUrl}/auth/confirm?email=${encodeURIComponent(email)}`

	const { data, error } = await supabaseClient.auth.signUp({
		email,
		password,
		options: {
			emailRedirectTo: confirmationRedirect,
		},
	})

	if (error) {
		return res.status(error.status || 400).json({ success: false, message: error.message || 'Unable to sign up.' })
	}

	if (!data || !data.user) {
		return res.status(500).json({ success: false, message: 'Signup succeeded without user data.' })
	}

	return res.status(200).json({ success: true, userId: data.user.id })
})

router.post('/login', async (req, res) => {
	// I also love promises
	if (!supabaseClient) {
		return respondSupabaseMissing(res)
	}

	const { email, password } = req.body
	if (!email || !password) {
		return res.status(400).json({ success: false, message: 'Email and password are required.' })
	}

	const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password })

	if (error) {
		return res.status(error.status || 401).json({ success: false, message: error.message || 'Invalid login credentials.' })
	}

	if (!data || !data.user || !data.session) {
		return res.status(500).json({ success: false, message: 'Login succeeded without session data.' })
	}

	req.session.user = {
		id: data.user.id,
		email: data.user.email,
		accessToken: data.session.access_token,
		refreshToken: data.session.refresh_token,
		expiresAt: data.session.expires_at,
		user: {
			id: data.user.id,
			email: data.user.email,
		},
	}

	res.cookie('sb-access-token', data.session.access_token, {
		httpOnly: true,
		secure: process.env.NODE_ENV === 'production',
		sameSite: 'strict',
		maxAge: 60 * 60 * 24,
		path: '/',
	})

	// I also love promises
	await new Promise((resolve, reject) => {
		req.session.save((err) => {
			if (err) {
				reject(err)
			} else {
				resolve()
			}
		})
	})

	return res.status(200).json({ success: true, userId: data.user.id })
})

router.post('/logout', async (req, res) => {
	// I also love promises
	if (req.session) {
		await new Promise(resolve => {
			req.session.destroy(() => resolve())
		})
	}

	res.clearCookie('sb-access-token', { path: '/' })

	if (req.accepts('html')) {
		return res.redirect('/')
	}

	return res.status(200).json({ success: true })
})

router.get('/check', async (req, res) => {
	// I also love promises
	return res.status(200).json({ success: true, user: req.user || null })
})

module.exports = router
