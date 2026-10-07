// Day 4 starter — validation and in-memory "database".
const express = require('express')

const app = express()
app.use(express.json())

const sales = []

function parsePositiveNumber(value) {
  const n = Number(value)
  if (!Number.isFinite(n) || n <= 0) return null
  return n
}

app.post('/sales', (req, res) => {
  const kg = parsePositiveNumber(req.body?.kg)
  if (kg === null) {
    return res.status(422).json({ error: 'kg must be a positive number' })
  }

  const sale = { id: sales.length + 1, kg }
  sales.push(sale)
  res.status(201).json(sale)
})

app.get('/sales', (_req, res) => {
  res.json(sales)
})

app.listen(3001, () => {
  console.log('Day 4 lab on http://localhost:3001')
})
