const express = require('express')
const cors = require('cors')
const jwt = require('jsonwebtoken')
const bcrypt = require('bcryptjs')
const { Pool } = require('pg')

const app = express()
app.use(cors())
app.use(express.json({ limit: '5mb' }))

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || process.env.POSTGRES_URL,
  ssl: { rejectUnauthorized: false }
})

const sign = u => jwt.sign({ id: u.id, role: u.role }, process.env.JWT_SECRET, { expiresIn: '24h' })

const auth = (roles = []) => (req, res, next) => {
  try {
    const t = (req.headers.authorization || '').replace('Bearer ', '')
    req.user = jwt.verify(t, process.env.JWT_SECRET)
    if (roles.length && !roles.includes(req.user.role)) return res.status(403).json({ error: 'Forbidden' })
    next()
  } catch { res.status(401).json({ error: 'Unauthorized' }) }
}

app.post('/api/auth/register', async (req, res) => {
  const { name, phone, password, role = 'BUYER' } = req.body
  const hash = await bcrypt.hash(password, 10)
  try {
    const { rows } = await pool.query(
      'INSERT INTO users(name,phone,password,role) VALUES($1,$2,$3,$4) RETURNING id,name,role',
      [name, phone, hash, role.toUpperCase()])
    res.json({ token: sign(rows[0]), ...rows[0] })
  } catch { res.status(400).json({ error: 'Phone already registered' }) }
})

app.post('/api/auth/login', async (req, res) => {
  const { phone, password } = req.body
  const { rows } = await pool.query('SELECT * FROM users WHERE phone=$1', [phone])
  const u = rows[0]
  if (!u || !(await bcrypt.compare(password, u.password)))
    return res.status(401).json({ error: 'Invalid credentials' })
  res.json({ token: sign(u), id: u.id, name: u.name, role: u.role })
})

app.get('/api/products', async (_req, res) => {
  const { rows } = await pool.query('SELECT * FROM products ORDER BY id DESC')
  res.json(rows)
})

app.post('/api/products', auth(['SELLER', 'ADMIN']), async (req, res) => {
  const { name, price, stock, image } = req.body
  const { rows } = await pool.query(
    'INSERT INTO products(name,price,stock,image,seller_id) VALUES($1,$2,$3,$4,$5) RETURNING *',
    [name, price, stock, image, req.user.id])
  res.json(rows[0])
})

module.exports = app
