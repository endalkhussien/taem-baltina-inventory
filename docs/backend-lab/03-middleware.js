// Day 3 starter — middleware pipeline. Extend this during the lab.
const express = require('express')

const app = express()
app.use(express.json())

function requestLog(req, res, next) {
  const started = Date.now()
  res.on('finish', () => {
    console.log(req.method, req.path, res.statusCode, `${Date.now() - started}ms`)
  })
  next()
}

app.use(requestLog)

app.get('/open', (_req, res) => {
  res.json({ audience: 'anyone' })
})

app.get('/secret', (_req, res) => {
  res.json({ audience: 'should be gated by middleware after the lab' })
})

app.listen(3001, () => {
  console.log('Day 3 lab on http://localhost:3001')
})
