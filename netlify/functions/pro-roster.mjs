import { connectDB } from './_shared/db.js'
import Event from './_shared/models/Event.js'
import Boxer from './_shared/models/Boxer.js'
import Registration from './_shared/models/Registration.js'
import Bout from './_shared/models/Bout.js'
import { requireAuth, success, errorResponse } from './_shared/middleware/auth.js'
import { normalizeRequest } from './_shared/request.js'

export default async (event) => {
  event = await normalizeRequest(event)
  try {
    await connectDB()
    const user = await requireAuth(event)
    const params = event.queryStringParameters || {}
    const method = event.httpMethod

    if (method === 'OPTIONS') return success({})

    // List professional entries for an event (the pro fight card roster).
    if (method === 'GET') {
      const { eventId } = params
      if (!eventId) return errorResponse({ message: 'eventId required', status: 400 })
      const entries = await Registration.find({ eventId, entryType: 'professional' })
        .populate('boxerId', 'fullName ringName nickname boxerType gender weightCategory division country countryCode nationality heightCm reachCm stance record boxingRecord numberOfBouts photos.rankings titles promoters manager trainer license insurance socials emergencyContact medicals amateurBackground')
        .sort({ createdAt: -1 })
        .lean()
      return success({ entries })
    }

    if (method === 'POST') {
      if (user.role !== 'promoter') {
        return errorResponse({ message: 'Only promoters can add professional boxers', status: 403 })
      }
      const body = JSON.parse(event.body || '{}')
      const { eventId, boxerId, boxer, category = {}, proEntry = {} } = body
      if (!eventId) return errorResponse({ message: 'eventId required', status: 400 })
      const evt = await Event.findOne({ _id: eventId }).lean()
      if (!evt) return errorResponse({ message: 'Event not found', status: 404 })
      if (evt.eventType && evt.eventType !== 'professional') {
        return errorResponse({ message: 'This event is not a professional fight night', status: 400 })
      }

      let resolvedBoxerId = boxerId
      if (!resolvedBoxerId && boxer && String(boxer.fullName || '').trim()) {
        const created = await Boxer.create({
          fullName: String(boxer.fullName).trim(),
          boxerType: 'professional',
          clubId: null,
          clubName: boxer.clubName || '',
          gender: boxer.gender || null,
          dateOfBirth: boxer.dateOfBirth ? new Date(boxer.dateOfBirth) : null,
          weightCategory: boxer.weightCategory || category.weight || '',
          ageCategory: boxer.ageCategory || '',
          experience: boxer.experience || '',
          professional: {
            ringName: boxer.professional?.ringName || boxer.ringName || '',
            nickname: boxer.professional?.nickname || boxer.nickname || '',
            slug: boxer.professional?.slug || '',
            country: boxer.professional?.country || boxer.country || '',
            countryCode: boxer.professional?.countryCode || boxer.countryCode || '',
            nationality: boxer.professional?.nationality || boxer.nationality || '',
            residence: boxer.professional?.residence || boxer.residence || '',
            heightCm: boxer.professional?.heightCm ?? boxer.heightCm ?? null,
            reachCm: boxer.professional?.reachCm ?? boxer.reachCm ?? null,
            stance: boxer.professional?.stance || boxer.stance || '',
            division: boxer.professional?.division || boxer.division || category.weight || '',
            careerHighWeightKg: boxer.professional?.careerHighWeightKg ?? boxer.careerHighWeightKg ?? null,
            record: {
              wins: boxer.professional?.record?.wins ?? boxer.record?.wins ?? 0,
              losses: boxer.professional?.record?.losses ?? boxer.record?.losses ?? 0,
              draws: boxer.professional?.record?.draws ?? boxer.record?.draws ?? 0,
              noContests: boxer.professional?.record?.noContests ?? boxer.record?.noContests ?? 0,
              koWins: boxer.professional?.record?.koWins ?? boxer.record?.koWins ?? 0,
              roundsBoxed: boxer.professional?.record?.roundsBoxed ?? boxer.record?.roundsBoxed ?? 0,
              debutDate: boxer.professional?.record?.debutDate ? new Date(boxer.professional.record.debutDate) : (boxer.record?.debutDate ? new Date(boxer.record.debutDate) : null),
            },
            rankings: {
              wbc: boxer.professional?.rankings?.wbc || boxer.rankings?.wbc || '',
              wba: boxer.professional?.rankings?.wba || boxer.rankings?.wba || '',
              ibf: boxer.professional?.rankings?.ibf || boxer.rankings?.ibf || '',
              wbo: boxer.professional?.rankings?.wbo || boxer.rankings?.wbo || '',
              other: boxer.professional?.rankings?.other || boxer.rankings?.other || '',
            },
            titles: Array.isArray(boxer.professional?.titles) ? boxer.professional.titles : [],
            promoters: Array.isArray(boxer.professional?.promoters) ? boxer.professional.promoters : (boxer.professional?.promoters ? [boxer.professional.promoters] : []),
            manager: boxer.professional?.manager || {},
            trainer: boxer.professional?.trainer || {},
            cutman: boxer.professional?.cutman || {},
            agent: boxer.professional?.agent || {},
            license: boxer.professional?.license || {},
            medicals: boxer.professional?.medicals || {},
            insurance: boxer.professional?.insurance || {},
            photos: {
              headshotUrl: boxer.professional?.photos?.headshotUrl || boxer.photos?.headshotUrl || '',
              fullBodyUrl: boxer.professional?.photos?.fullBodyUrl || boxer.photos?.fullBodyUrl || '',
              countryFlagUrl: boxer.professional?.photos?.countryFlagUrl || boxer.photos?.countryFlagUrl || '',
            },
            socials: boxer.professional?.socials || {},
            emergencyContact: boxer.professional?.emergencyContact || {},
            amateurBackground: boxer.professional?.amateurBackground || {},
            notes: boxer.professional?.notes || boxer.notes || '',
          },
        })
        resolvedBoxerId = created._id
      }
      if (!resolvedBoxerId) return errorResponse({ message: 'Boxer is required', status: 400 })

      const existing = await Registration.findOne({ eventId, boxerId: resolvedBoxerId })
      if (existing) {
        return errorResponse({ message: 'Boxer already on this professional card', status: 409 })
      }

      const registration = await Registration.create({
        eventId,
        boxerId: resolvedBoxerId,
        clubName: boxer?.clubName || '',
        numberOfBouts: Number(proEntry.bouts) || 1,
        category: { weight: category.weight || '', age: category.age || '', gender: category.gender || '' },
        status: 'eligible',
        entryType: 'professional',
        proEntry: {
          corner: proEntry.corner || 'red',
          contractedWeightKg: proEntry.contractedWeightKg ?? null,
          division: proEntry.division || category.weight || '',
          scheduledRounds: proEntry.scheduledRounds ?? null,
          billing: proEntry.billing || 'undercard',
          billingOrder: Number(proEntry.billingOrder) || 1,
          promoterForEvent: proEntry.promoterForEvent || evt.pro?.promotionName || '',
          managerForEvent: proEntry.managerForEvent || '',
          contractSigned: Boolean(proEntry.contractSigned),
          licenseVerified: Boolean(proEntry.licenseVerified),
          medicalsVerified: Boolean(proEntry.medicalsVerified),
          arrivalDate: proEntry.arrivalDate ? new Date(proEntry.arrivalDate) : null,
          walkoutMusic: proEntry.walkoutMusic || '',
          colors: proEntry.colors || '',
          teamPasses: Number(proEntry.teamPasses) || 0,
          titleOnLine: Boolean(proEntry.titleOnLine),
          titleName: proEntry.titleName || '',
          sanctioningBody: proEntry.sanctioningBody || evt.pro?.sanctioningBody || '',
          status: proEntry.status || 'confirmed',
        },
      })

      const populated = await Registration.findById(registration._id)
        .populate('boxerId', 'fullName ringName nickname boxerType gender weightCategory division country countryCode nationality heightCm reachCm stance record boxingRecord numberOfBouts photos.rankings titles promoters manager trainer license insurance socials emergencyContact medicals amateurBackground')
        .lean()
      return success({ registration: populated }, 201)
    }

    if (method === 'DELETE') {
      if (user.role !== 'promoter') {
        return errorResponse({ message: 'Only promoters can manage professional entries', status: 403 })
      }
      const { id } = params
      if (!id) return errorResponse({ message: 'Registration id is required', status: 400 })
      const reg = await Registration.findById(id)
      if (!reg) return errorResponse({ message: 'Registration not found', status: 404 })

      const regIds = [reg._id]
      const boutIds = (
        await Bout.find({ $or: [{ boxerAId: { $in: regIds } }, { boxerBId: { $in: regIds } }] }).select('_id').lean()
      ).map((b) => b._id)
      if (boutIds.length) {
        await Bout.deleteMany({ _id: { $in: boutIds } })
      }
      await Registration.deleteOne({ _id: reg._id })
      return success({ message: 'Professional entry removed' })
    }

    return errorResponse({ message: 'Method not allowed', status: 405 })
  } catch (err) {
    return errorResponse(err)
  }
}
