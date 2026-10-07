// Day 5 starter — cookie session vs signed token. Complete the lab in the curriculum.
const crypto = require('crypto')
const express = require('express')
const cookieParser = require('cookie-parser')

const app = express()
app.use(express.json())
app.use(cookieParser())

const USER = { username: 'admin', password: 'password' }

/** @type {Map<string, { username: string }>} */
const sessions = new Map()

const JWT_SECRET = 'lab-only-not-for-production'

app.post('/login-session', (req, res) => {
  const { username, password } = req.body ?? {}
  if (username !== USER.username || password !== USER.password) {
    return res.status(401).json({ error: 'Invalid credentials' })
  }

  const sessionId = crypto.randomBytes(16).toString('hex')
  sessions.set(sessionId, { username })
  res.cookie('lab_session', sessionId, { httpOnly: true, sameSite: 'lax' })
  res.json({ ok: true, style: 'server-session' })
})

app.get('/me-session', (req, res) => {
  const session = sessions.get(req.cookies.lab_session)
  if (!session) return res.status(401).json({ error: 'Unauthorized' })
  res.json(session)
})

app.post('/login-token', (req, res) => {
  const { username, password } = req.body ?? {}
  if (username !== USER.username || password !== USER.password) {
    return res.status(401).json({ error: 'Invalid credentials' })
  }

  const payload = Buffer.from(JSON.stringify({ username, iat: Date.now() })).toString('base64url')
  const sig = crypto.createHmac('sha256', JWT_SECRET).update(payload).digest('base64url')
  const token = `${payload}.${sig}`
  res.cookie('lab_token', token, { httpOnly: true, sameSite: 'lax' })
  res.json({ ok: true, style: 'signed-token' })
})

app.get('/me-token', (req, res) => {
  const token = req.cookies.lab_token
  if (!token) return res.status(401).json({ error: 'Unauthorized' })

  const [payload, sig] = token.split('.')
  const expected = crypto.createHmac('sha256', JWT_SECRET).update(payload ?? '').digest('base64url')
  const sigBuf = Buffer.from(sig ?? '')
  const expectedBuf = Buffer.from(expected)
  if (sigBuf.length !== expectedBuf.length || !crypto.timingSafeEqual(sigBuf, expectedBuf)) {
    return res.status(401).json({ error: 'Bad signature' })
  }

  res.json(JSON.parse(Buffer.from(payload, 'base64url').toString()))
})

app.listen(3001, () => {
  console.log('Day 5 lab on http://localhost:3001')
})
