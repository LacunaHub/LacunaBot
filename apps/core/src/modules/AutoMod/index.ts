import moderateCaps from './rules/AntiCaps.js'
import moderateLinks from './rules/LinksFilter.js'
import moderateNewbies from './rules/NewbiesModeration.js'
import moderateNicknames from './rules/NicknamesModeration.js'
import moderateWords from './rules/SwearFilter.js'
import slowdownUsers from './rules/UsersSlowdown.js'

export default {
    moderateCaps,
    moderateLinks,
    moderateNewbies,
    moderateNicknames,
    moderateWords,
    slowdownUsers
}
