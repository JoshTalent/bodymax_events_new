import { connectDB } from './_shared/db.js'
import Bout from './_shared/models/Bout.js'
import Boxer from './_shared/models/Boxer.js'
import { success, errorResponse } from './_shared/middleware/auth.js'
import { normalizeRequest } from './_shared/request.js'

export default async (event) => {
  event = await normalizeRequest(event)
  try {
    await connectDB()
    const params = event.queryStringParameters || {}
    const { eventId } = params
    if (!eventId) return errorResponse({ message: 'eventId required', status: 400 })

    const bouts = await Bout.find({ eventId })
      .sort({ boutNumber: 1, billingOrder: 1 })
      .populate({ path: 'boxerAId', populate: { path: 'boxerId' } })
      .populate({ path: 'boxerBId', populate: { path: 'boxerId' } })
      .populate({ path: 'winnerId', populate: { path: 'boxerId' } })
      .lean()

    const publicBouts = bouts.map((b) => ({
      _id: b._id,
      boutNumber: b.boutNumber,
      billingOrder: b.billingOrder,
      boutType: b.boutType,
      round: b.round,
      roundName: b.roundName,
      numberOfRounds: b.numberOfRounds,
      minutesPerRound: b.minutesPerRound,
      status: b.status,
      titleFight: b.titleFight,
      titleName: b.titleName,
      sanctioningBody: b.sanctioningBody,
      division: b.division,
      contractWeightKg: b.contractWeightKg,
      commissionApproved: b.commissionApproved,
      boxerA: b.boxerAId
        ? {
            _id: b.boxerAId.boxerId?._id || b.boxerAId._id,
            fullName: b.boxerAId.boxerId?.fullName || b.boxerAId.fullName,
            ringName: b.boxerAId.boxerId?.professional?.ringName,
            country: b.boxerAId.boxerId?.professional?.country || b.boxerAId.boxerId?.nationality,
            record: b.boxerAId.boxerId?.professional?.record || b.boxerAId.boxerId?.record,
            photoUrl: b.boxerAId.boxerId?.professional?.photos?.headshotUrl || b.boxerAId.boxerId?.photoUrl,
            countryFlagUrl: b.boxerAId.boxerId?.professional?.photos?.countryFlagUrl,
            countryCode: b.boxerAId.boxerId?.professional?.countryCode,
          }
        : null,
      boxerB: b.boxerBId
        ? {
            _id: b.boxerBId.boxerId?._id || b.boxerBId._id,
            fullName: b.boxerBId.boxerId?.fullName || b.boxerBId.fullName,
            ringName: b.boxerBId.boxerId?.professional?.ringName,
            country: b.boxerBId.boxerId?.professional?.country || b.boxerBId.boxerId?.nationality,
            record: b.boxerBId.boxerId?.professional?.record || b.boxerBId.boxerId?.record,
            photoUrl: b.boxerBId.boxerId?.professional?.photos?.headshotUrl || b.boxerBId.boxerId?.photoUrl,
            countryFlagUrl: b.boxerBId.boxerId?.professional?.photos?.countryFlagUrl,
            countryCode: b.boxerBId.boxerId?.professional?.countryCode,
          }
        : null,
      winner: b.winnerId
        ? {
            _id: b.winnerId.boxerId?._id || b.winnerId._id,
            fullName: b.winnerId.boxerId?.fullName || b.winnerId.fullName,
          }
        : null,
      result: b.result
        ? {
            winnerId: b.result.winnerId,
            method: b.result.method,
            round: b.result.round,
            notes: b.result.notes,
          }
        : null,
      scheduledDate: b.scheduledDate,
      scheduledTime: b.scheduledTime,
      ring: b.ring,
    }))

    return success({ bouts: publicBouts })
  } catch (err) {
    return errorResponse(err)
  }
}
