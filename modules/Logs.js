const { MessageEmbed } = require('discord.js')
const { TruncateString } = require('../internals/utility/Utils')
const moment = require('moment')

class Logs {
    static get images() {
        return {
            BAN_ADD: 'https://i.imgur.com/qI02Ivf.png',
            BAN_REMOVE: 'https://i.imgur.com/FVnlHqJ.png',
            KICK: 'https://i.imgur.com/RYVLGuy.png',
            MUTE_ADD: 'https://i.imgur.com/t5FJ6Gw.png',
            MUTE_REMOVE: 'https://i.imgur.com/rtL11np.png',
            PRUNE_MESSAGES: 'https://i.imgur.com/vUd9gtw.png',
            WARN_ADD: 'https://i.imgur.com/R03G3G5.png',
            WARN_REMOVE: 'https://i.imgur.com/AXNkdfG.png'
        }
    }
}

module.exports = Logs