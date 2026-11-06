import { writeFileSync } from 'node:fs'
import { buildFightCardPdf } from './src/utils/fightCardPdf.js'

const boxer = (id, data) => ({
  _id: `reg-${id}`,
  clubName: data.clubName,
  boxerId: {
    _id: `box-${id}`,
    fullName: data.fullName,
    gender: data.gender,
    weightCategory: data.weightCategory,
    ageCategory: data.ageCategory,
    registeredWeightKg: data.kg,
    dateOfBirth: data.dob,
    nationality: data.nationality,
    clubName: data.clubName,
    boxingRecord: data.record,
  },
})

const a1 = boxer(1, {
  fullName: 'Jonathan Abebe',
  gender: 'M',
  weightCategory: '75 kg',
  ageCategory: 'Senior',
  kg: 74.6,
  dob: '2001-02-14',
  nationality: 'Rwanda',
  clubName: 'Downtown Boxing Club',
  record: { wins: 12, losses: 2, draws: 1 },
})
const b1 = boxer(2, {
  fullName: 'Marcus Lee',
  gender: 'M',
  weightCategory: '75 kg',
  ageCategory: 'Senior',
  kg: 75.2,
  dob: '1999-08-03',
  nationality: 'Uganda',
  clubName: 'Eastside Boxing Academy',
  record: { wins: 9, losses: 3, draws: 0 },
})
const a2 = boxer(3, {
  fullName: 'Amara Okafor',
  gender: 'F',
  weightCategory: '60 kg',
  ageCategory: 'Youth',
  kg: 59.4,
  dob: '2010-05-21',
  nationality: 'Nigeria',
  clubName: 'Lagos Fight Club',
  record: { wins: 5, losses: 1, draws: 0 },
})
const b2 = boxer(4, {
  fullName: 'Grace Uwase',
  gender: 'F',
  weightCategory: '60 kg',
  ageCategory: 'Senior',
  kg: 60.1,
  dob: '2002-11-09',
  nationality: 'Rwanda',
  clubName: 'Kigali Warriors',
  record: { wins: 7, losses: 2, draws: 2 },
})
const a3 = boxer(5, {
  fullName: 'Jean-Claude Niyonzima',
  gender: 'M',
  weightCategory: '81 kg',
  ageCategory: 'Senior',
  kg: 80.8,
  dob: '1997-03-30',
  nationality: 'Burundi',
  clubName: 'Bujumbura Boxing Club',
  record: { wins: 18, losses: 4, draws: 0 },
})
const b3 = boxer(6, {
  fullName: 'Samuel Okoro',
  gender: 'M',
  weightCategory: '81 kg',
  ageCategory: 'Senior',
  kg: 81.3,
  dob: '1996-07-12',
  nationality: 'Kenya',
  clubName: 'Nairobi Elite',
  record: { wins: 14, losses: 6, draws: 1 },
})
const a4 = boxer(7, {
  fullName: 'Patrick Mwangi',
  gender: 'M',
  weightCategory: '69 kg',
  ageCategory: 'Senior',
  kg: 68.5,
  dob: '2000-01-18',
  nationality: 'Kenya',
  clubName: 'Nairobi Elite',
  record: { wins: 10, losses: 2, draws: 0 },
})
const b4 = boxer(8, {
  fullName: 'Emmanuel Habimana',
  gender: 'M',
  weightCategory: '69 kg',
  ageCategory: 'Senior',
  kg: 69.2,
  dob: '1998-09-05',
  nationality: 'Rwanda',
  clubName: 'Kigali Warriors',
  record: { wins: 8, losses: 3, draws: 1 },
})
const a5 = boxer(9, {
  fullName: 'Diane Mukamana',
  gender: 'F',
  weightCategory: '54 kg',
  ageCategory: 'Senior',
  kg: 53.7,
  dob: '2001-06-11',
  nationality: 'Rwanda',
  clubName: 'Downtown Boxing Club',
  record: { wins: 6, losses: 1, draws: 0 },
})
const a6 = boxer(10, {
  fullName: 'Eric Shema',
  gender: 'M',
  weightCategory: '63.5 kg',
  ageCategory: 'Senior',
  kg: 63.1,
  dob: '1999-12-02',
  nationality: 'Rwanda',
  clubName: 'Kigali Warriors',
  record: { wins: 16, losses: 1, draws: 0 },
})
const b6 = boxer(11, {
  fullName: 'Yusuf Ahmed',
  gender: 'M',
  weightCategory: '63.5 kg',
  ageCategory: 'Senior',
  kg: 63.4,
  dob: '1998-04-27',
  nationality: 'Tanzania',
  clubName: 'Dar es Salaam Boxing',
  record: { wins: 13, losses: 2, draws: 1 },
})

const base = {
  category: { weight: '75 kg', age: 'Senior', gender: 'M' },
  numberOfRounds: 3,
  minutesPerRound: 3,
}

const bouts = [
  { ...base, _id: 'b1', boutNumber: 1, roundName: 'Preliminary', status: 'scheduled', boxerAId: a1, boxerBId: b1 },
  {
    ...base,
    _id: 'b2',
    boutNumber: 2,
    roundName: 'Quarter-final',
    status: 'scheduled',
    category: { weight: '60 kg', age: 'Youth', gender: 'F' },
    boxerAId: a2,
    boxerBId: b2,
  },
  {
    ...base,
    _id: 'b3',
    boutNumber: 3,
    roundName: 'Semi-final',
    status: 'completed',
    category: { weight: '81 kg', age: 'Senior', gender: 'M' },
    boxerAId: a3,
    boxerBId: b3,
    winnerId: { _id: a3._id },
    result: { method: 'KO', round: 2 },
  },
  {
    ...base,
    _id: 'b4',
    boutNumber: 4,
    roundName: 'Semi-final',
    status: 'walkover',
    category: { weight: '69 kg', age: 'Senior', gender: 'M' },
    boxerAId: a4,
    boxerBId: null,
    winnerId: { _id: a4._id },
    result: { method: 'Walkover', round: null },
  },
  {
    ...base,
    _id: 'b5',
    boutNumber: 5,
    roundName: 'Semi-final',
    status: 'scheduled',
    category: { weight: '54 kg', age: 'Senior', gender: 'F' },
    boxerAId: a5,
    boxerBId: null,
  },
  {
    ...base,
    _id: 'b6',
    boutNumber: 6,
    roundName: 'Final',
    status: 'in_progress',
    category: { weight: '63.5 kg', age: 'Senior', gender: 'M' },
    numberOfRounds: 5,
    minutesPerRound: 3,
    boxerAId: a6,
    boxerBId: b6,
  },
]

const event = {
  name: 'BODYMAX BOXING GAMES 2026',
  eventDate: '2026-11-14',
  venue: 'BK Arena',
  location: 'Kigali, Rwanda',
}

const { doc, fileName } = await buildFightCardPdf({ event, bouts })
const buf = Buffer.from(doc.output('arraybuffer'))
writeFileSync('C:/Users/ntwar/AppData/Local/Temp/opencode/fight-card-preview.pdf', buf)

const raw = buf.toString('latin1')
console.log('file', fileName)
console.log('bytes', buf.length)
console.log('pages', doc.getNumberOfPages())
console.log('content', raw.length)
