const { co } = require('core-async')
const { error: { catchErrors } } = require('puffy')

const endpoint = 'introspect' 

const handler = (payload, eventHandlerStore) => catchErrors(co(function *() {
	yield Promise.resolve({ payload, eventHandlerStore })
	return `All good from endpoint ${endpoint}`
}))

module.exports = {
	endpoint,
	handler
}