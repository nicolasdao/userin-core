const { co } = require('core-async')
const { error: { catchErrors, wrapErrors, HttpError } } = require('puffy')
const { oauth2Params, error: { errorCode } } = require('../_utils')
const grantTypeAuthorizationCode = require('./grantTypeAuthorizationCode')
const grantTypeClientCredentials = require('./grantTypeClientCredentials')
const grantTypePassword = require('./grantTypePassword')
const grantTypeRefreshToken = require('./grantTypeRefreshToken')

const endpoint = 'token' 

const VALID_GRANT_TYPES = ['client_credentials', 'password', 'refresh_token', 'authorization_code']
const TRACE_ON = process.env.LOG_LEVEL == 'trace'

/**
 * Get OAuth2 tokens
 * 					
 * @param {String}	payload.grant_type				Valid values: 'client_credentials', 'password', 'authorization_code', 'refresh_token'			
 * @param {String}	payload.username							
 * @param {String}	payload.password							
 * @param {String}	payload.client_id							
 * @param {String}	payload.client_secret							
 * @param {String}	payload.refresh_token							
 * @param {String}	payload.code	
 * @param {String}	payload.state	
 * @param {String}	payload.scope							
 * @param {Object}	payload.data					Random data. Usefull to support user sign up when we need their first name, last name, ... 
 *                          					   	However, this is not OIDC compliant. 	
 * @param {Object}	eventHandlerStore                         					    						
 *  
 * @yield {[Error]}	output[0]						Array of errors
 * @yield {String}	output[1].id_token
 * @yield {String}	output[1].access_token
 * @yield {String}	output[1].token_type			'bearer'
 * @yield {Number}	output[1].expires_in
 */
const handler = (payload={}, eventHandlerStore={}) => catchErrors(co(function *() {
	const { grant_type, username, password, client_id, client_secret, refresh_token, code, state, scope, data:extraData } = payload
	
	if (TRACE_ON)
		console.log(`INFO - Request to get token (grant_type: ${grant_type})`)

	const errorMsg = 'Failed to get OAuth2 tokens'
	const scopes = oauth2Params.convert.thingToThings(scope)
	// 1. Validates inputs
	if (!grant_type)
		throw new HttpError(`${errorMsg}. Missing required 'grant_type'.`, ...errorCode.invalid_request)
	if (!client_id)
		throw new HttpError(`${errorMsg}. Missing required 'client_id' argument`, ...errorCode.invalid_request)

	if (VALID_GRANT_TYPES.indexOf(grant_type) < 0)
		throw new HttpError(`${errorMsg}. grant_type '${grant_type}' is not supported.`, ...errorCode.unsupported_grant_type)

	if (grant_type == 'client_credentials' && (!client_id || !client_secret))
		throw new HttpError(`${errorMsg}. When grant_type is '${grant_type}' both 'client_id' and 'client_secret' are required.`, ...errorCode.invalid_request)	
	if (grant_type == 'password' && (!username || !password))
		throw new HttpError(`${errorMsg}. When grant_type is '${grant_type}' both 'username' and 'password' are required.`, ...errorCode.invalid_request)
	if (grant_type == 'authorization_code') {
		if (!code)
			throw new HttpError(`${errorMsg}. When grant_type is '${grant_type}', 'code' is required.`, ...errorCode.invalid_request)
		if (!client_secret)
			throw new HttpError(`${errorMsg}. When grant_type is '${grant_type}', 'client_secret' is required.`, ...errorCode.invalid_request)
	}
	if (grant_type == 'refresh_token' && !refresh_token)
		throw new HttpError(`${errorMsg}. When grant_type is '${grant_type}', 'refresh_token' is required.`, ...errorCode.invalid_request)

	const user = extraData && typeof(extraData) == 'object' 
		? { ...extraData, username, password } 
		: { username, password } 

	const baseConfig = { client_id, scopes, state }

	// 2. Decices which flow to use
	const fn = 
		grant_type == 'password' ? grantTypePassword.exec(eventHandlerStore, { ...baseConfig, user }) :
			grant_type == 'client_credentials' ? grantTypeClientCredentials.exec(eventHandlerStore, { ...baseConfig, client_secret }) :
				grant_type == 'authorization_code' ? grantTypeAuthorizationCode.exec(eventHandlerStore, { ...baseConfig, code, client_secret }) :
					grantTypeRefreshToken.exec(eventHandlerStore, { ...baseConfig, refresh_token })

	const [errors, results] = yield fn
	if (errors)
		throw wrapErrors(errorMsg, errors)

	return results
}))

module.exports = {
	endpoint,
	handler
}