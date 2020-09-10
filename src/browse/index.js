const { co } = require('core-async')
const { error: { catchErrors } } = require('puffy')
const { request: { getFullUrl } } = require('../_utils')
const { getResponseHtml, getDiscoverHtml } = require('./page')

const endpoint = 'browse' 
const endpointRedirect = 'browse/redirect' 

/**
 * Creates HTML pages that help browsing the OIDC complient APIs. 
 * 
 * @param {Object}		payload
 * @param {Object}		eventHandlerStore		Useless in this case.
 * @param {Object}		context.endpoints
 * @param {Request}		context.req		
 * 
 * @yield {String}		HTMLpage
 */
const handler = (payload, eventHandlerStore, context={}) => catchErrors(co(function *() {
	const {
		issuer,
		authorization_endpoints=[],
		introspection_endpoint,
		token_endpoint,
		userinfo_endpoint
	} = context.endpoints

	const detailedEndpoints = {
		issuer,
		// jwks_uri: `${baseUrl}/keys`,
		// introspection_endpoint: `${baseUrl}/introspection`,
		// userinfo_endpoint: `${baseUrl}/userinfo`,
		token_endpoint: {
			method: 'POST',
			url: getFullUrl(context.req, token_endpoint)
		},
		discover_endpoint: {
			method: 'GET',
			url: getFullUrl(context.req, endpoint)
		},
		discover_redirect_endpoint: {
			method: 'GET',
			url: getFullUrl(context.req, endpointRedirect)
		},
		userinfo_endpoint: {
			method: 'GET',
			url: getFullUrl(context.req, userinfo_endpoint)
		},
		introspection_endpoint: {
			method: 'POST',
			url: getFullUrl(context.req, introspection_endpoint)
		}
	}
	for (let authorization_endpoint of authorization_endpoints) {
		detailedEndpoints[authorization_endpoint] = {
			method: 'GET',
			url: getFullUrl(context.req, authorization_endpoint)
		}
	}

	const html = yield getDiscoverHtml(detailedEndpoints, payload)

	return html
}))

/**
 * Creates HTML pages that handles OAuth2 redirects.
 * 
 * @param {Object}		payload
 * @param {Object}		eventHandlerStore		Useless in this case.
 * @param {Object}		context.endpoints
 * @param {Request}		context.req		
 * 
 * @yield {String}		HTMLpage
 */
const handlerRedirect = (payload, eventHandlerStore, context={}) => catchErrors(co(function *() {
	const discoverEndpointUrl = getFullUrl(context.req, context.endpoints.browse_endpoint)
	const html = yield getResponseHtml(discoverEndpointUrl)
	return html
}))

module.exports = {
	endpoint,
	handler,
	redirect: {
		endpoint: endpointRedirect,
		handler: handlerRedirect
	}
}


