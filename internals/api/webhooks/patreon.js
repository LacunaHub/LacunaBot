const express = require('express')
const router = express.Router()
const db = require('../../../database/DatabaseManager')
const Patreon = require('../../utility/Patreon')

router.post('/pledge/:signature', async (req, res) => {
    const signature = req.params.signature

    if (signature !== process.env.PATREON_SIGNATURE) {
        await res.status(403).json({ status: 403, message: 'Forbidden' })

        return
    }

    const data = req.body.data

    if (!req.body || !data) {
        await res.status(400).json({ status: 400, message: 'Bad request' })

        return
    }

    await db.patrons.create({
        _id: data.id,
        name: data.attributes.full_name,
        user_id: data.relationships.user.data.id,
        email: data.attributes.email,
        patron_status: data.attributes.patron_status
    })

    const patron = await db.patrons.find({ _id: data.id })

    await Patreon.CheckPatron(patron)

    await res.status(204).end()
})

module.exports = router