const express = require('express')
// const authorizationApi = require('./authorization')
const browseApi = require('./browse')
const introspectApi = require('./introspect')
const configApi = require('./openid-configuration')
const tokenApi = require('./token')
const userinfoApi = require('./userinfo')
const defaultConfig = require('./config')
const eventRegister = require('./eventRegister')
const pluginManager = require('./pluginManager')
const { request: { getParams }, config:{ prefixPathname }, response: { formatResponseError } } = require('./_utils')

const oauth2HttpHandlerFactory = (app, eventHandlerStore, config) => (method, endpointPathname, handler, context={}) => {
	const endpoint = prefixPathname(config, endpointPathname)

	app[method](endpoint, async (req, res) => {
		const params = await getParams(req)
		const authorization = req.headers.Authorization || req.headers.authorization
		const [errors, result] = await handler(params, eventHandlerStore, { ...context, req, authorization })
		if (errors)
			return formatResponseError(errors, res)
		else
			return res.status(200).send(result)
	})

	return endpoint
}

class UserIn extends express.Router {
	constructor(config={}) {
		super()

		const eventHandlerStore = {}
		const registerEventHandler = eventRegister(eventHandlerStore)

		const realConfig = { ...defaultConfig, ...config }

		const createHttpHandler = oauth2HttpHandlerFactory(this, eventHandlerStore, realConfig)

		const context = { endpoints: { issuer: realConfig.issuer } }
		context.endpoints.introspection_endpoint = createHttpHandler('post', introspectApi.endpoint, introspectApi.handler)
		context.endpoints.token_endpoint = createHttpHandler('post', tokenApi.endpoint, tokenApi.handler)
		context.endpoints.userinfo_endpoint = createHttpHandler('get', userinfoApi.endpoint, userinfoApi.handler)
		context.endpoints.browse_redirect_endpoint = createHttpHandler('get', browseApi.redirect.endpoint, browseApi.redirect.handler, context)
		context.endpoints.browse_endpoint = createHttpHandler('get', browseApi.endpoint, browseApi.handler, context)
		context.endpoints.openidconfiguration_endpoint = createHttpHandler('get', configApi.endpoint, configApi.handler, context)
		
		this.on = registerEventHandler

		this.use = pluginManager(eventHandlerStore)
	}
}

module.exports = UserIn



