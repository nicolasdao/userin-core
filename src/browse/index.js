const { co } = require('core-async')
const { error: { catchErrors } } = require('puffy')
const { request: { getFullUrl } } = require('../_utils')
const { getBrowseRedirectHtml, getBrowseHtml } = require('./page')
const openidConfiguration = require('../openid-configuration')

const endpoint = 'browse' 
const endpointRedirect = 'browse/redirect' 

/**
 * Creates HTML pages that help browsing the OIDC complient APIs. 
 * 
 * @param {Object}		payload
 * @param {Object}		eventHandlerStore
 * @param {Object}		context.endpoints			Object containing all the OIDC endpoints (pathname only)
 * @param {Request}		context.req					Express Request
 * @param {Response}	context.res					Express Response
 * @param {String}		context.authorization		HTTP Authorization header value (e.g., 'Bearer 12345')
 * 
 * @yield {String}		HTMLpage
 */
const handler = (payload, eventHandlerStore, context={}) => catchErrors(co(function *() {

	const [[, oidcEndpoints], [, detailedEndpoints]] = yield [
		openidConfiguration.handler(payload, eventHandlerStore, context),
		openidConfiguration.handler(payload, eventHandlerStore, { ...context, includeNonStandard:true })
	]


	const html = yield getBrowseHtml(detailedEndpoints, oidcEndpoints, payload)

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
	const browseEndpointUrl = getFullUrl(context.req, context.endpoints.browse_endpoint)
	const html = yield getBrowseRedirectHtml(browseEndpointUrl)
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


