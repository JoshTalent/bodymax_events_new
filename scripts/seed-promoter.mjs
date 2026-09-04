import 'dotenv/config'
import bcrypt from 'bcryptjs'
import { connectDB } from '../shared/db.js'
import User from '../shared/models/User.js'

const email = process.env.SEED_PROMOTER_EMAIL || 'promoter@bodymax.com'
const password = process.env.SEED_PROMOTER_PASSWORD || 'promoter123'
const name = process.env.SEED_PROMOTER_NAME || 'Promoter'

async function seed() {
  await connectDB()
  const existing = await User.findOne({ email })
  if (existing) {
    console.log(`Promoter already exists: ${email}`)
    process.exit(0)
  }
  const passwordHash = await bcrypt.hash(password, 10)
  await User.create({ name, email, passwordHash, role: 'promoter' })
  console.log(`Promoter created: ${email} / ${password}`)
  process.exit(0)
}

seed().catch((err) => {
  console.error(err)
  process.exit(1)
})
