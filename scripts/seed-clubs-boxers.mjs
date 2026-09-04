import 'dotenv/config'
import bcrypt from 'bcryptjs'
import { connectDB } from '../netlify/functions/_shared/db.js'
import Club from '../netlify/functions/_shared/models/Club.js'
import Boxer from '../netlify/functions/_shared/models/Boxer.js'
import User from '../netlify/functions/_shared/models/User.js'

const CLUB_PASSWORD = process.env.SEED_CLUB_PASSWORD || 'club123'

const weightCategories = [
  'Flyweight', 'Bantamweight', 'Featherweight', 'Lightweight',
  'Light Welterweight', 'Welterweight', 'Light Middleweight',
  'Middleweight', 'Light Heavyweight', 'Heavyweight',
]

const FORCE = process.argv.includes('--force')

const weightByCategory = {
  Flyweight: [49, 50, 51, 52],
  Bantamweight: [53, 54, 55, 56],
  Featherweight: [57, 58, 59, 60],
  Lightweight: [60, 61, 62, 63],
  'Light Welterweight': [64, 65, 66],
  Welterweight: [67, 68, 69],
  'Light Middleweight': [70, 71, 72],
  Middleweight: [73, 74, 75],
  'Light Heavyweight': [76, 78, 79],
  Heavyweight: [86, 90, 92, 100],
}

const ageCategoryByWeight = {
  Flyweight: 'Youth', Bantamweight: 'Youth', Featherweight: 'Elite',
  Lightweight: 'Elite', 'Light Welterweight': 'Elite', Welterweight: 'Elite',
  'Light Middleweight': 'Elite', Middleweight: 'Elite',
  'Light Heavyweight': 'Elite', Heavyweight: 'Elite',
}

const firstNames = ['James', 'Liam', 'Noah', 'Ethan', 'Mohammed', 'Isaac', 'Samuel', 'David', 'Peter', 'Brian', 'Kevin', 'Tony', 'Vincent', 'Alex', 'Mark', 'Paul', 'John', 'Daniel', 'Seth', 'Elijah', 'Caleb', 'Nathan', 'Michael', 'Joseph', 'Aaron', 'Marcus', 'Colin', 'Dennis', 'Victor', 'Felix', 'Tobias', 'Amos', 'Eric', 'Frank', 'George', 'Henry', 'Ian', 'Jack', 'Kyle', 'Leon']
const lastNames = ['Omondi', 'Mwangi', 'Kiprotich', 'Otieno', 'Wanjiku', 'Kamau', 'Ndungu', 'Mutua', 'Ochieng', 'Gitau', 'Kibet', 'Njoroge', 'Waweru', 'Chebet', 'Maina', 'Karanja', 'Odhiambo', 'Kiprono', 'Barasa', 'Wekesa', 'Kiptoo', 'Moseti', 'Ouma', 'Cheruiyot', 'Simiyu']

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function pick(arr) {
  return arr[randomInt(0, arr.length - 1)]
}

const clubNames = [
  'Nairobi Titans Boxing Club', 'Mombasa Steel Fists', 'Kisumu Legends', 'Eldoret Fighters',
  'Nakuru Warriors', 'Nyeri Cobras', 'Thika Dynamite', 'Machakos Panthers',
  'Kakamega Kings', 'Meru Thunder',
]

async function seed() {
  await connectDB()

  let clubs = await Club.find({ name: { $in: clubNames } })

  if (FORCE) {
    console.log('--force: deleting seeded clubs/boxers/users...')
    if (clubs.length) {
      const ids = clubs.map((c) => c._id)
      await Boxer.deleteMany({ clubId: { $in: ids } })
      await User.deleteMany({ clubId: { $in: ids } })
      await Club.deleteMany({ _id: { $in: ids } })
    }
    clubs = []
  }

  if (clubs.length === 0) {
    for (let i = 0; i < clubNames.length; i++) {
      const club = await Club.create({
        name: clubNames[i],
        contactName: `${pick(firstNames)} ${pick(lastNames)}`,
        contactEmail: `club${i + 1}@bodymax.com`,
        contactPhone: `+2547${String(randomInt(10000000, 99999999))}`,
        address: `${randomInt(1, 200)} ${pick(['Moi Ave', 'Kenyatta Rd', 'Jogoo Rd', 'Waiyaki Way', 'Kimathi St', "Mama Ngina Dr"])}, ${clubNames[i].split(' ')[0]}`,
        active: true,
      })
      clubs.push(club)
      console.log(`Created club: ${club.name} (${club._id})`)
    }
  } else {
    console.log(`Found ${clubs.length} existing clubs. Skipping club creation.`)
  }

  for (const club of clubs) {
    const email = club.contactEmail
    const existingUser = await User.findOne({ email })
    if (existingUser) {
      console.log(`User account already exists: ${email}`)
      continue
    }
    const passwordHash = await bcrypt.hash(CLUB_PASSWORD, 10)
    await User.create({
      name: club.contactName,
      email,
      passwordHash,
      role: 'club',
      clubId: club._id,
      active: true,
    })
    console.log(`User account created: ${email} / ${CLUB_PASSWORD}`)
  }

  for (let ci = 0; ci < clubs.length; ci++) {
    const club = clubs[ci]
    for (let b = 0; b < 10; b++) {
      const category = weightCategories[(ci * 10 + b) % 10]
      const gender = b % 4 === 0 ? 'F' : 'M'
      const ageYears = ageCategoryByWeight[category] === 'Youth' ? randomInt(16, 19) : randomInt(20, 32)
      const dob = new Date()
      dob.setFullYear(dob.getFullYear() - ageYears)
      const name = `${pick(firstNames)} ${pick(lastNames)} ${gender}${ci}${b}`
      const boxer = await Boxer.create({
        clubId: club._id,
        fullName: name.trim(),
        dateOfBirth: dob,
        gender,
        nationality: 'Kenyan',
        identificationNumber: `ID-${randomInt(10000000, 99999999)}`,
        registeredWeightKg: pick(weightByCategory[category]),
        weightCategory: category,
        ageCategory: ageCategoryByWeight[category],
        experience: pick(['Beginner', 'Intermediate', 'Advanced']),
        boxingRecord: {
          wins: randomInt(0, 12),
          losses: randomInt(0, 5),
          draws: randomInt(0, 2),
        },
        active: true,
      })
      console.log(`  boxer: ${boxer.fullName} | ${boxer.weightCategory} | ${boxer.registeredWeightKg}kg | ${boxer.gender} | ${boxer.ageCategory}`)
    }
  }

  console.log('SEED COMPLETE: 10 clubs, 50 boxers created.')
  process.exit(0)
}

seed().catch((err) => {
  console.error(err)
  process.exit(1)
})
