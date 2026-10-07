// Day 2 starter — routing. Add the lab exercises from the curriculum here.
const express = require('express')

const app = express()
app.use(express.json())

const spices = [
  { id: 1, name: 'Berbere', kg: 12 },
  { id: 2, name: 'Mitmita', kg: 4 }
]

app.get('/spices', (req, res) => {
  res.json(spices)
})

app.get('/spices/:id', (req, res) => {
  const spice = spices.find((item) => item.id === Number(req.params.id))
  if (!spice) return res.status(404).json({ error: 'Not found' })
  res.json(spice)
})

app.listen(3001, () => {
  console.log('Day 2 lab on http://localhost:3001')
})
