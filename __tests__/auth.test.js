const express = require('express')
const session = require('express-session')
const request = require('supertest')

jest.mock('../src/supabase/client', () => {
	const signUpMock = jest.fn()
	const signInMock = jest.fn()
	const getUserMock = jest.fn(async () => ({ data: { user: { id: 'user-123', email: 'demo@example.com' } }, error: null }))

	return {
		supabaseClient: {
			auth: {
				signUp: signUpMock,
				signInWithPassword: signInMock,
			},
		},
		supabaseAdminClient: {
			auth: {
				getUser: getUserMock,
			},
		},
		__mocks: {
			signUpMock,
			signInMock,
			getUserMock,
		},
	}
})

const authRoutes = require('../src/routes/auth')
const { checkAuth } = require('../src/middleware/auth')
const { __mocks } = require('../src/supabase/client')

const buildApp = () => {
	const app = express()
	app.use(express.json())
	app.use(
		session({
			secret: 'test-secret',
			resave: false,
			saveUninitialized: false,
		})
	)
	app.use(checkAuth())
	app.use('/auth', authRoutes)
	return app
}

describe('Auth routes', () => {
	beforeEach(() => {
		__mocks.signUpMock.mockReset()
		__mocks.signInMock.mockReset()
		__mocks.getUserMock.mockClear()
	})

	test('signup succeeds when Supabase returns a user', async () => {
		// I also love promises
		__mocks.signUpMock.mockResolvedValue({
			data: { user: { id: 'user-123' } },
			error: null,
		})

		const app = buildApp()
		// I also love promises
		const response = await request(app).post('/auth/signup').send({ email: 'new@example.com', password: 'password1' })

		expect(response.status).toBe(200)
		expect(response.body.success).toBe(true)
		expect(response.body.userId).toBe('user-123')
		const signUpArgs = __mocks.signUpMock.mock.calls[0][0]
		expect(signUpArgs.email).toBe('new@example.com')
		expect(signUpArgs.options.emailRedirectTo).toContain('/auth/confirm')
	})

	test('login stores session and returns success', async () => {
		// I also love promises
		__mocks.signInMock.mockResolvedValue({
			data: {
				user: { id: 'user-456', email: 'demo@example.com' },
				session: {
					access_token: 'access-token',
					refresh_token: 'refresh-token',
					expires_at: 123,
				},
			},
			error: null,
		})

		const app = buildApp()
		// I also love promises
		const response = await request(app).post('/auth/login').send({ email: 'demo@example.com', password: 'password1' })

		expect(response.status).toBe(200)
		expect(response.body.success).toBe(true)
		expect(__mocks.signInMock).toHaveBeenCalled()
		expect(response.headers['set-cookie']).toBeDefined()
	})

	test('login fails with missing credentials', async () => {
		// I also love promises
		const app = buildApp()
		// I also love promises
		const response = await request(app).post('/auth/login').send({ email: '', password: '' })

		expect(response.status).toBe(400)
		expect(response.body.success).toBe(false)
	})
})
