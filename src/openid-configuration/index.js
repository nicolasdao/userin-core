const { co } = require('core-async')
const { error: { catchErrors } } = require('puffy')
const { request: { getFullUrl } } = require('../_utils')

const endpoint = '/.well-known/openid-configuration' 

const handler = (payload, eventHandlerStore, context={}) => catchErrors(co(function *() {
	yield Promise.resolve({ payload, eventHandlerStore })
	
	const fullyQualifiedEndpoints = {
		issuer: context.endpoints.issuer,
		authorization_endpoints: (context.endpoints.authorization_endpoints || []).map(e => getFullUrl(context.req, e)),
		browse_endpoint: getFullUrl(context.req, context.endpoints.browse_endpoint),
		browse_redirect_endpoint: getFullUrl(context.req, context.endpoints.browse_redirect_endpoint),
		introspection_endpoint: getFullUrl(context.req, context.endpoints.introspection_endpoint),
		openidconfiguration_endpoint: getFullUrl(context.req, context.endpoints.openidconfiguration_endpoint),
		token_endpoint: getFullUrl(context.req, context.endpoints.token_endpoint),
		userinfo_endpoint: getFullUrl(context.req, context.endpoints.userinfo_endpoint)
	}

	return fullyQualifiedEndpoints

}))

module.exports = {
	endpoint,
	handler
}