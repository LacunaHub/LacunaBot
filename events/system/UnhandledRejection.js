/**
 * @param {import('../../internals/Lacuna')} self
 * @param {{}} error
 */
const execute = async (self, error) => {
    const err = error.stack ? error.stack : error.message

    this.logger.error('(Unhandled Rejection)', err)
    //this.logger.telegram.error('`Unhandled Rejection`', `\`\`\`\n${err}\n\`\`\``)
}

module.exports = {
    name: 'unhandledRejection',
    fn: execute
}