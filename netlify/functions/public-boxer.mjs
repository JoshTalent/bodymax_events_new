import { connectDB } from './_shared/db.js'
import Boxer from './_shared/models/Boxer.js'
import Registration from './_shared/models/Registration.js'
import Bout from './_shared/models/Bout.js'
import Event from './_shared/models/Event.js'
import { success, errorResponse } from './_shared/middleware/auth.js'
import { normalizeRequest } from './_shared/request.js'

export default async (event) => {
  event = await normalizeRequest(event)
  try {
    await connectDB()
    const params = event.queryStringParameters || {}
    const { id } = params
    if (!id) return errorResponse({ message: 'Boxer id required', status: 400 })

    const boxer = await Boxer.findById(id).lean()
    if (!boxer || boxer.boxerType !== 'professional') {
      return errorResponse({ message: 'Professional boxer not found', status: 404 })
    }

    // Public-safe only: drop medicals, licence docs, insurance, emergency contact, notes.
    // These live inside the professional subdocument, so strip them there too.
    const professional = boxer.professional ? { ...boxer.professional } : boxer.professional
    if (professional) {
      delete professional.medicals
      delete professional.insurance
      delete professional.license
      delete professional.emergencyContact
      delete professional.notes
    }
    const { notes, ...publicBoxer } = boxer
    publicBoxer.professional = professional

    const regs = await Registration.find({ boxerId: id }).lean()
    const eventIds = [...new Set(regs.map((r) => String(r.eventId)))]
    const events = await Event.find({ _id: { $in: eventIds } }, 'name eventDate venue location eventType').lean()
    const eventMap = new Map(events.map((e) => [String(e._id), e]))

    const fights = regs.map((r) => {
      const ev = eventMap.get(String(r.eventId))
      return {
        eventId: r.eventId,
        eventName: ev ? ev.name : null,
        eventDate: ev ? ev.eventDate : null,
        status: r.status,
        entryType: r.entryType,
        weightCategory: r.category?.weight,
        division: r.proEntry?.division,
        corner: r.proEntry?.corner,
        titleFight: r.proEntry?.titleOnLine,
        titleName: r.proEntry?.titleName,
        billing: r.proEntry?.billing,
      }
    })

    return success({ boxer: { ...publicBoxer, fights } })
  } catch (err) {
    return errorResponse(err)
  }
}
