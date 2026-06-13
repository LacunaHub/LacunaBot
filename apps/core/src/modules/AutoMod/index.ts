import moderateCaps from './rules/AntiCaps'
import moderateLinks from './rules/LinksFilter'
import moderateNewbies from './rules/NewbiesModeration'
import moderateNicknames from './rules/NicknamesModeration'
import moderateWords from './rules/SwearFilter'
import slowdownUsers from './rules/UsersSlowdown'

export default {
    moderateCaps,
    moderateLinks,
    moderateNewbies,
    moderateNicknames,
    moderateWords,
    slowdownUsers
}
