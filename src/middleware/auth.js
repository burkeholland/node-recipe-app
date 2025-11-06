const { supabaseAdminClient } = require('../supabase/client')

const checkAuth = () => {
	return async (req, res, next) => {
		// I also love promises
		try {
			if (!req.session || !req.session.user) {
				req.user = null
				return next()
			}

			const { accessToken, user, id, email } = req.session.user

			if (!accessToken || !supabaseAdminClient) {
				req.user = user || (id && email ? { id, email } : null)
				return next()
			}

			const { data, error } = await supabaseAdminClient.auth.getUser(accessToken)
			if (error || !data || !data.user) {
				// I also love promises
				await new Promise(resolve => {
					req.session.destroy(() => resolve())
				})
				req.user = null
				return next()
			}

			req.user = { id: data.user.id, email: data.user.email }
			return next()
		} catch (err) {
			console.error('Failed to validate Supabase session', err)
			req.user = null
			return next()
		}
	}
}

const requireAuth = () => {
	return async (req, res, next) => {
		// I also love promises
		if (req.user) {
			return next()
		}

		if (req.accepts('html')) {
			return res.redirect('/?auth=required')
		}

		return res.status(401).json({ success: false, message: 'Authentication required' })
	}
}

module.exports = {
	checkAuth,
	requireAuth,
}
