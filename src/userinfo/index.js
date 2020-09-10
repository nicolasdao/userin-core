const { co } = require('core-async')
const { error: { catchErrors } } = require('puffy')

const endpoint = 'userinfo' 

const handler = (payload, eventHandlerStore) => catchErrors(co(function *() {
	yield Promise.resolve({ payload, eventHandlerStore })
	return `All good from endpoint ${endpoint}`
}))

module.exports = {
	endpoint,
	handler
}