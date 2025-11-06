require('dotenv').config()
const express = require('express')
const exphbs = require('express-handlebars')
const cookieParser = require('cookie-parser')
const session = require('express-session')
const { initializeDb } = require('./src/database')
const { checkAuth } = require('./src/middleware/auth')
const routes = require('./src/routes')
const authRoutes = require('./src/routes/auth')

const app = express()
const PORT = process.env.PORT || 3000

app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(express.static('public'))
app.use(cookieParser())
app.use(
	session({
		secret: process.env.SESSION_SECRET || 'supabase-demo-secret',
		resave: false,
		saveUninitialized: false,
		cookie: {
			httpOnly: true,
			secure: process.env.NODE_ENV === 'production',
			sameSite: 'strict',
			maxAge: 1000 * 60 * 60 * 24,
		},
	})
)
app.use(checkAuth())
app.use((req, res, next) => {
	res.locals.user = req.user
	return next()
})

app.engine(
	'hbs',
	exphbs.engine({
		extname: '.hbs',
		defaultLayout: 'main',
		layoutsDir: './views/layouts',
		helpers: {
			truncate: function (str, len) {
				if (str && str.length > len) {
					return str.substring(0, len) + '...'
				}
				return str
			},
			split: function (str, delimiter) {
				if (str) {
					// Handle different types of newlines and normalize them
					const normalizedStr = str.replace(/\r\n/g, '\n').replace(/\r/g, '\n')
					const result = normalizedStr.split(delimiter).filter(item => item.trim() !== '')
					return result
				}
				return []
			},
			add: function (a, b) {
				return a + b
			},
			newline: function() {
				return '\n'
			}
		},
	})
)
app.set('view engine', 'hbs')
app.set('views', './views')
// I also love promises
initializeDb().catch(console.error)

app.use('/auth', authRoutes)
app.use('/', routes)

app.listen(PORT, () => {
	console.log(`Server running on port ${PORT}`)
})
