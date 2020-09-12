const eventRegister = require('./eventRegister')
const { Strategy, verifyStrategy } = require('./_core')

module.exports = eventHandlerStore => {
	const registerEventHandler = eventRegister(eventHandlerStore)
	return plugin => {
		if (!plugin)
			throw new Error('Missing required \'plugin\'')
		const t = typeof(plugin)
		if (t != 'object')
			throw new Error(`Invalid 'plugin'. Expect 'plugin' to be an object, found ${t} instead.`)

		if (plugin instanceof Strategy) {
			verifyStrategy(plugin)
			registerEventHandler(plugin)
		}
	}
}



