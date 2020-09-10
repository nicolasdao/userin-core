const express = require('express')
// const authorizationApi = require('./authorization')
const browseApi = require('./browse')
const introspectApi = require('./introspect')
const configApi = require('./openid-configuration')
const tokenApi = require('./token')
const userinfoApi = require('./userinfo')
const defaultConfig = require('./config')
const eventRegister = require('./eventRegister')
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

		const endpoints = { issuer: realConfig.issuer }
		endpoints.introspection_endpoint = createHttpHandler('post', introspectApi.endpoint, introspectApi.handler)
		endpoints.token_endpoint = createHttpHandler('post', tokenApi.endpoint, tokenApi.handler)
		endpoints.userinfo_endpoint = createHttpHandler('get', userinfoApi.endpoint, userinfoApi.handler)
		endpoints.browse_endpoint = createHttpHandler('get', browseApi.endpoint, browseApi.handler, { endpoints })
		endpoints.browse_redirect_endpoint = createHttpHandler('get', browseApi.redirect.endpoint, browseApi.redirect.handler, { endpoints })

		// this configures the /.well-known/openid-configuration endpoint
		createHttpHandler('get', configApi.endpoint, configApi.handler, { endpoints })
		
		this.on = registerEventHandler
	}
}

module.exports = UserIn



