// Day 1 starter — a Node process that speaks HTTP.
// Curriculum: type this file once by hand, then run `npm run day1`.
const express = require('express')

const app = express()
const PORT = 3001

app.get('/health', (req, res) => {
  res.json({ ok: true, runtime: 'node', framework: 'express' })
})

app.listen(PORT, () => {
  console.log(`Day 1 lab on http://localhost:${PORT}`)
})
