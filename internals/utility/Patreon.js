const { patrons: Patrons, users: Users, servers: Servers } = require('../../database/DatabaseManager')
const request = require('node-fetch')
const logger = require('../Logger')

class Patreon {
    static async SyncPatrons() {
        const patrons = await Patrons.findSome({})

        if (!patrons.length) return null

        for (const patron of patrons) {
            const i = patrons.indexOf(patron)

            setTimeout(async () => {
                await Patreon.CheckPatron(patron)
            }, i * 4000)
        }

        setTimeout(() => {
            Patreon.SyncPatrons()
        }, 600000)
    }

    /**
     * @param {import('../Typings').Patron} patron
     */
    static async CheckPatron(patron) {
        const options = {
            url: `https://www.patreon.com/api/oauth2/v2/members/${patron._id}?include=user&fields%5Bmember%5D=full_name,is_follower,email,last_charge_date,last_charge_status,lifetime_support_cents,patron_status,currently_entitled_amount_cents,pledge_relationship_start,will_pay_amount_cents&fields%5Buser%5D=full_name,hide_pledges,social_connections,image_url`,
            method: 'GET',
            headers: {
                Authorization: `Bearer ${process.env.PATREON_ACCESS_TOKEN}`
            }
        }

        let res
        try {
            res = await request(options.url, options)
        } catch (err) {
            await logger.error(err)

            return null
        }

        if (!res) return null

        res = await res.json()

        const user_attr = res.included.find(i => i.type === 'user')
        const discord = user_attr.attributes.social_connections.discord
        const will_pay = res.data.attributes.currently_entitled_amount_cents

        if (!patron.image_url || patron.image_url != user_attr.attributes.image_url) {
            await Patrons.update({ _id: patron._id }, {
                $set: {
                    image_url: user_attr.attributes.image_url
                }
            })
        }

        if ((!patron.discord_id && discord) || (discord && patron.discord_id !== discord.user_id)) {
            await Patrons.update({ _id: patron._id }, {
                $set: {
                    discord_id: discord.user_id
                }
            })
        }

        if (discord && (!patron.last_charge_date || new Date(patron.last_charge_date).getTime() !== new Date(res.data.attributes.last_charge_date).getTime())) {
            await Patrons.update({ _id: patron._id }, {
                $set: {
                    last_charge_date: res.data.attributes.last_charge_date,
                    will_pay_amount_cents: will_pay,
                    lifetime_support_cents: res.data.attributes.lifetime_support_cents
                }
            })

            const user = await Users.fetch({ _id: discord })

            await Users.update({ _id: discord }, {
                $set: {
                    flags: (user.flags & 16) === 16 ? user.flags : user.flags | 1 << 4,
                    'boost.available': true,
                    'boost.tier': patron.will_pay_amount_cents < will_pay ? user.boost.tier + ((will_pay - patron.will_pay_amount_cents) / 100) : user.boost.tier - ((patron.will_pay_amount_cents - will_pay) / 100)
                }
            })

            if (!user.boost.type.includes('PATREON')) {
                await Users.update({ _id: discord }, {
                    $push: {
                        'boost.type': 'PATREON'
                    }
                })
            }

            await logger.info(`(Patreon Charge): by ${patron.name} with amount ${will_pay / 100}$`)
            await logger.telegram.warn(`\`Patreon Charge:\` by ${patron.name} with amount ${will_pay / 100}$`)
        }

        const patron_status = res.data.attributes.patron_status

        if (patron.patron_status !== patron_status) {
            await Patrons.update({ _id: patron._id }, {
                $set: {
                    patron_status: patron_status
                }
            })

            if (patron_status !== 'active_patron') {
                const user = await Users.find({ _id: discord })

                if (user) {
                    await Users.update({ _id: discord }, {
                        $set: {
                            'boost.available': user.boost.type.length < (will_pay / 100) ? false : true,
                            'boost.tier': user.boost.tier < (will_pay / 100) ? 0 : user.boost.tier - (will_pay / 100)
                        },
                        $pull: {
                            'boost.type': 'PATREON'
                        }
                    })

                    if ((user.boost.tier - (will_pay / 100)) <= user.boost.guilds.length) {
                        const removed = user.boost.guilds.splice(user.boost.guilds.length - (will_pay / 100), will_pay / 100)

                        for (const rem of removed) {
                            await Servers.update({ _id: rem.id }, {
                                $set: {
                                    'server.premium.available': false
                                }
                            })

                            await Users.update({ _id: discord }, {
                                $pull: {
                                    'boost.guilds': {
                                        id: rem.id
                                    }
                                }
                            })
                        }
                    }
                }
            }
        }
    }
}

module.exports = Patreon