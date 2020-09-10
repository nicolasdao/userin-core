const path = require('path')
const { co } = require('core-async')
const template = require('simple-template-utils')

/**
 * Returns an HTML page that allows interaction with the OAuth2 endpoints. 
 * 
 * @param  {String} endpoints.discover_endpoint.method
 * @param  {String} endpoints.discover_endpoint.url
 * @param  {String} endpoints.discover_redirect_endpoint.method
 * @param  {String} endpoints.discover_redirect_endpoint.url
 * @param  {String} endpoints.token_endpoint.method
 * @param  {String} endpoints.token_endpoint.url
 * @param  {String} endpoints.userinfo_endpoint.method
 * @param  {String} endpoints.userinfo_endpoint.url
 * @param  {String} endpoints.introspection_endpoint.method
 * @param  {String} endpoints.introspection_endpoint.url
 * @param  {String} endpoints.authorization_facebook_endpoint.method
 * @param  {String} endpoints.authorization_facebook_endpoint.url
 * @param  {String} endpoints.authorization_google_endpoint.method
 * @param  {String} endpoints.authorization_google_endpoint.url
 * @param  {String} endpoints.authorization_github_endpoint.method
 * @param  {String} endpoints.authorization_github_endpoint.url
 * @param  {String} endpoints.authorization_linkedin_endpoint.method
 * @param  {String} endpoints.authorization_linkedin_endpoint.url
 * 
 * @param  {String} options.state
 * @param  {String} options.code
 * @param  {String} options.access_token
 * @param  {String} options.id_token
 * @param  {String} options.nonce
 * @param  {String} options.error
 * @param  {String} options.error_description
 * 
 * @return {String} html
 */
const getDiscoverHtml = endpoints => co(function *() {
	endpoints = endpoints || {}
	const { token_endpoint, discover_endpoint, discover_redirect_endpoint, userinfo_endpoint, introspection_endpoint } = endpoints

	const defaultRedirectUrl = 
		discover_redirect_endpoint && discover_redirect_endpoint.url ? discover_redirect_endpoint.url : 
			discover_endpoint && discover_endpoint.url ? discover_endpoint.url : null

	const authorizationEndpoints = Object.keys(endpoints).reduce((acc, endpoint) => {
		const strategy = (endpoint.match(/authorization_(.*?)_endpoint/) || [])[1]
		if (strategy && endpoints[endpoint] && endpoints[endpoint].url)
			acc.push({ strategy, url:endpoints[endpoint].url, defaultRedirectUrl })
		return acc
	}, [])

	const authorizationEndpointsHtml = yield authorizationEndpoints.map(data => {
		return template.compile({
			template: path.join(__dirname, '../_page/authorizationSection.html'),
			data
		})
	})
	
	return yield template.compile({
		template: path.join(__dirname, '../_page/discover.html'),
		data: {
			tokenEndpoint: token_endpoint.url,
			userInfoEdnpoint: userinfo_endpoint.url,
			introspectionEdnpoint: introspection_endpoint.url,
			authorizationEndpointsHtml: authorizationEndpointsHtml.join('\n')
		}
	})
})

const getResponseHtml = async discoverEndpointUrl => {
	return await template.compile({
		template: path.join(__dirname, '../_page/discoverRedirect.html'),
		data: {
			discoverEndpointUrl
		}
	})
}


module.exports = {
	getDiscoverHtml,
	getResponseHtml
}



