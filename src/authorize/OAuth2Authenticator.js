/**
 * Copyright (c) 2017-2019, Neap Pty Ltd.
 * All rights reserved.
 * 
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
*/

const { co } = require('core-async')
const passport = require('passport')
const config = require('../config')
const { error: { InternalServerError, InvalidRequestError } } = require('../_core')
const { url:urlHelp, error: { catchErrors, wrapErrors, HttpError } } = require('puffy')
const { response: { addErrorToUrl }, error: { formatOauth2Error }, oauth2Params } = require('../_utils')

if (!config)
	throw new Error('Missing required \'config\'')
if (!config.version)
	throw new Error('Missing required \'config.version\'')
if (!config.authorizeCallbackName)
	throw new Error('Missing required \'config.authorizeCallbackName\'')

const TRACE_ON = process.env.LOG_LEVEL == 'trace'

/**
 * Decodes the the OAuth2 response_type into an array of respnse types. 
 * 
 * @param  {String}		responseType	e.g., 'code+id_token'
 * @return {[String]}   responseTypes	e.g., ['code', 'id_token']
 */
const _getResponseTypes = responseType => catchErrors(() => {
	const errorMsg = 'Invalid \'response_type\''
	if (!responseType) 
		throw new InvalidRequestError(`${errorMsg}. 'response_type' is required.`)

	const responseTypes = responseType.replace(/\++/g,' ').split(' ')
	if (responseTypes.some(t => t != 'code' && t != 'id_token' && t != 'token'))
		throw new InvalidRequestError(`${errorMsg}. The value '${responseType}' is not a supported OIDC 'response_type'.`)

	return responseTypes.filter(t => t == 'code' || t == 'id_token' || t == 'token')
})

/**
 * Gets the request's origin (e.g., https://example.com)
 * 
 * @param  {Request} 	req
 * @return {String}		output.protocol
 * @return {String}		output.host
 * @return {String}		output.origin
 * @return {String}		output.pathname
 * @return {Object}		output.query
 */
const _getRequestUrlInfo = req => {
	const isLocalhost = (req.headers.host || '').indexOf('localhost') >= 0
	const protocol = req.protocol === 'http' 
		? 'http:' 
		: req.protocol === 'https' 
			? 'https:' 
			: typeof(req.secure) == 'boolean' 
				? (req.secure ? 'https:' : 'http:')
				: (isLocalhost ? 'http:' : 'https:')

	return urlHelp.getInfo(urlHelp.buildUrl({
		protocol,
		host: req.headers.host,
		pathname: req.originalUrl
	}))
}

/**
 * Gets the user details from the IdP. This should also include OIDC tokens such as a refreshToken and an accessToken. 
 * 
 * @param  {Request}	req				This request object contained the secret 'code' in its query params. Without 
 *                          			that 'code', it would not be possible to get the user details. 	
 * @param  {Response}	res				To be honest, this one is useless here.
 * @param  {String}		strategy
 * @param  {String}		callbackURL
 * 
 * @return {[Error]}	output[0]
 * @return {Object}		output[1]		IdP User	
 */
const _getIdPuser = (req, res, strategy, callbackURL) => catchErrors(new Promise((onSuccess, onFailure) => {
	const errorMsg = `Failed to retrieve ${strategy} user and tokens when querying ${callbackURL}`

	if (TRACE_ON)
		console.log(`INFO - Exchanging ${strategy} Authorization code for a user object (incl. tokens)`)

	try {
		passport.authenticate(strategy, { callbackURL }, (err,user) => {
			// CASE 1 - IdP Failure
			if (err) 
				onFailure(wrapErrors(errorMsg, [err]))
			// CASE 2 - IdP Success
			else 
				onSuccess(user)
		})(req, res)
	} catch (err) {
		onFailure(wrapErrors(errorMsg, [err]))
	}
}))

const _stateEncoder = {
	encode: query => Buffer.from(JSON.stringify(query||{})).toString('base64'),
	decode: encodedState => catchErrors(() => {
		try {
			return JSON.parse(Buffer.from(encodedState||'', 'base64').toString())
		} catch(err) {
			throw new HttpError(`Failed to decode 'state' query parameter (value: ${encodedState})`, [err], 400)
		}
	})
}

/**
 * Returns a URL identical to the request except it has its pathname changed to 'redirectPath' and all its query parameters
 * JSONified into a new 'state' query parameter. The JSONified query parameters are also organized in a such a way that
 * values such as 'response_type=code+id_token' and 'response_type=id_token+code' are identical. This is to avoid IdP such as Google
 * to perceive those 2 values as different URLs. 
 * 
 * @param  {[type]} req          [description]
 * @param  {[type]} redirectPath [description]
 * @return {[type]}              [description]
 */
const _getRedirectUri = (req, redirectPath) => {
	const requestUrlInfo = _getRequestUrlInfo(req)
	const query = requestUrlInfo.query
	const redirectUri = urlHelp.buildUrl({ ...requestUrlInfo, pathname:redirectPath, query:'' })
	query.orig_redirectUri = redirectUri
	const state = _stateEncoder.encode(query)
	
	return { state, uri:redirectUri }
}

/**
 * Verifies that the client_id is allowed to access the scopes.
 * 
 * @param {Object}		eventHandlerStore
 * @param {String}		client_id
 * @param {[String]}	scopes
 * 
 * @yield {[Error]}		output[0]
 * @yield {[String]}	output[1].scopes
 * @yield {[String]}	output[1].audiences
 */
const _verifyScopes = (eventHandlerStore, { client_id, scopes }) => catchErrors(co(function *(){
	const errorMsg = `Failed to verifies scopes access for client_id ${client_id||'unknown'}`
	const [serviceAccountErrors, serviceAccount] = yield eventHandlerStore.get_service_account.exec({ client_id })
	if (serviceAccountErrors)
		throw wrapErrors(errorMsg, serviceAccountErrors)

	const [scopeErrors] = oauth2Params.verify.scopes({ scopes, serviceAccountScopes:serviceAccount.scopes })
	if (scopeErrors)
		throw wrapErrors(errorMsg, scopeErrors)

	return serviceAccount
}))

/**
 * Processes the user received from the FIP
 * 
 * @param {Object}		user
 * @param {Object}		user.id					String or number
 * @param {String}		client_id				
 * @param {String}		strategy				e.g., 'default', 'facebook'
 * @param {String}		response_type			e.g., 'code+id_token'
 * @param {String}		scopes
 * @param {String}		state
 * 
 * @yield {[Error]}		output[0]
 * @yield {String}		output[1].access_token
 * @yield {String}		output[1].token_type
 * @yield {String}		output[1].expires_in
 * @yield {String}		output[1].id_token
 * @yield {String}		output[1].scope
 */
const processTheFIPuser = ({ user, strategy, client_id, response_type, scopes, state }, eventHandlerStore={}) => catchErrors(co(function *() {
	const errorMsg = `Failed to process ${strategy} user`
	// A. Validates input
	if (!eventHandlerStore.get_service_account)
		throw new InternalServerError(`${errorMsg}. Missing 'get_service_account' handler.`)
	if (!eventHandlerStore.process_fip_user)
		throw new InternalServerError(`${errorMsg}. Missing 'process_fip_user' handler.`)
	if (!eventHandlerStore.generate_token)
		throw new InternalServerError(`${errorMsg}. Missing 'generate_token' handler.`)
	
	if (!user)
		throw new InvalidRequestError(`${errorMsg}. Missing required 'user' argument.`)
	if (typeof(user) != 'object')
		throw new InvalidRequestError(`${errorMsg}. The 'user' argument must be an object.`)
	if (!user.id)
		throw new InvalidRequestError(`${errorMsg}. Missing required 'id' property in the 'user' object.`)
	if (!strategy)
		throw new InvalidRequestError(`${errorMsg}. Missing required 'strategy' argument.`)
	
	const [responseTypeErrors, responseTypes] = _getResponseTypes(response_type)
	if (responseTypeErrors)
		throw wrapErrors(errorMsg, responseTypeErrors)

	if (!responseTypes || !responseTypes.length)
		throw new InvalidRequestError(`${errorMsg}. Missing required 'response_type'.`)

	// B. Verifying those scopes are allowed for that client_id
	const [serviceAccountErrors, serviceAccount] = yield _verifyScopes(eventHandlerStore, { client_id, scopes })
	if (serviceAccountErrors)
		throw wrapErrors(errorMsg, serviceAccountErrors)

	// C. Processes user
	const [userErrors, validUser] = yield eventHandlerStore.process_fip_user.exec({ client_id, strategy, user, state })
	if (userErrors)
		throw wrapErrors(errorMsg, userErrors)

	// D. Validate that the client_id is allowed to process this user. 
	if (!validUser)
		throw new InternalServerError(`${errorMsg}. Corrupted data. Processing the FIP user failed to return any data.`)

	const [clientIdErrors] = oauth2Params.verify.clientId({ client_id, user_id:validUser.id, user_client_ids:validUser.client_ids })
	if (clientIdErrors)
		throw wrapErrors(errorMsg, clientIdErrors)
	
	// E. Generates tokens
	const requestIdToken = scopes && scopes.indexOf('openid') >= 0
	const config = { client_id, user_id:validUser.id, audiences:serviceAccount.audiences, scopes, state }
	const [[accessTokenErrors, accessTokenResult], [idTokenErrors, idTokenResult]] = yield [
		eventHandlerStore.generate_access_token.exec(config),
		requestIdToken ? eventHandlerStore.generate_id_token.exec(config) : Promise.resolve([null, null])
	]

	if (accessTokenErrors || idTokenErrors)
		throw wrapErrors(errorMsg, accessTokenErrors || idTokenErrors)

	return {
		access_token: accessTokenResult.token,
		token_type:'bearer',
		expires_in: accessTokenResult.expires_in,
		id_token: idTokenResult && idTokenResult.token ? idTokenResult.token : null,
		scope: oauth2Params.convert.thingsToThing(scopes)
	}
}))

/**
 * Returns an Express handler that the client indirectly requests through the IdP redirection performed in response of 
 * an Authorization access request (done previously through the 'authRequestHandler' handler)
 *
 * @param  {String} strategy 							e.g., facebook, google, linkedin, github
 *														
 * @return {Handler}           							[description]
 */
const _getAuthResponseHandler = (strategy, eventHandlerStore) => {
	const errorMsg = `Failed to process authentication response from ${strategy}`
	const _getMissingQueryParamError = queryParam => 
		`${errorMsg}. ${strategy} did not include the required query parameter '${queryParam}' in its redirect URI. It was either not included in the first place, or ${strategy} removed it when redirecting back to UserIn.`
	const _getMissingStateQueryParamError = queryParam => 
		`${errorMsg}. The encoded 'state' query parameter in the ${strategy} redirect URI is missing the required '${queryParam}' variable.`
	
	return (req, res) => co(function *() {
		const { state:fipState } = req.params

		const requestUrlInfo = _getRequestUrlInfo(req)

		if (TRACE_ON)
			console.log(`INFO - Received redirect from ${strategy} to ${requestUrlInfo.pathname}`)

		const [errors, redirectUri] = yield catchErrors(co(function *() {

			if (!fipState)
				throw new HttpError(_getMissingQueryParamError('state'), 400)
			const [decodedStateErrors, decodedState] = _stateEncoder.decode(fipState)
			if (decodedStateErrors)
				throw new HttpError(errorMsg, decodedStateErrors)

			const { client_id, redirect_uri, response_type, orig_redirectUri, scope, state } = decodedState || {}

			if (!client_id)
				throw new InvalidRequestError(_getMissingStateQueryParamError('client_id'))
			if (!redirect_uri)
				throw new InvalidRequestError(_getMissingStateQueryParamError('redirect_uri'))
			if (!response_type)
				throw new InvalidRequestError(_getMissingStateQueryParamError('response_type'))
			if (!orig_redirectUri)
				throw new InvalidRequestError(_getMissingStateQueryParamError('orig_redirectUri'))

			// The 'orig_redirectUri' URL is a security check. Certain IdPs (e.g., Facebook) requires that you 
			// use the same redirect uri that then one used to get the 'code' in order to get the access_token.
			const [idpErrors, user] = yield _getIdPuser(req, res, strategy, orig_redirectUri)

			if (idpErrors)
				throw wrapErrors(errorMsg, idpErrors)

			const [authAPIerrors, authAPIresp] = yield processTheFIPuser({ 
				user, 
				strategy, 
				client_id,
				response_type,
				scopes: oauth2Params.convert.thingToThings(scope),
				state
			}, eventHandlerStore)

			if (authAPIerrors)
				throw wrapErrors(errorMsg, authAPIerrors)

			if (TRACE_ON)
				console.log(`INFO - ${strategy} user successfully authenticated`)

			// Builds the redirect_uri
			const urlInfo = urlHelp.getInfo(redirect_uri)
			if (authAPIresp && authAPIresp.code)
				urlInfo.query.code = authAPIresp.code
			if (authAPIresp && authAPIresp.access_token)
				urlInfo.query.access_token = authAPIresp.access_token
			if (authAPIresp && authAPIresp.id_token)
				urlInfo.query.id_token = authAPIresp.id_token
			if (state)
				urlInfo.query.state = state
			
			const redirectUri = urlHelp.buildUrl(urlInfo)
			
			return redirectUri
		}))

		if (errors) {
			errors.forEach(error => console.log(error.stack || error.message))
			const code = errors[0].code || 500
			const [error01, error02] = errors
			const message = [error01, error02].filter(e => e && e.message).map(e => e.message).join(' - ')
			if (redirectUri)
				res.redirect(addErrorToUrl(redirectUri, { code, message }))
			else
				res.status(code).send(message)
		} else
			res.redirect(redirectUri)
	})
}

const _parseAuthResponse = (accessToken, refreshToken, profile, next) => {
	const id = profile.id
	const { givenName: firstName, middleName, familyName: lastName } = profile.name || {}
	const email = ((profile.emails || [])[0] || {}).value || null
	const profileImg = ((profile.photos || [])[0] || {}).value

	const user = { id, firstName, middleName, lastName, email, profileImg, accessToken, refreshToken }
	next(null, user)
}

/**
 * Validates the authorization request before it is sent to the IdP. 
 * 
 * @param {String}		client_id			e.g., '123445'
 * @param {String}		response_type		e.g., 'code+id_token'
 * @param {String}		redirect_uri		e.g., 'https%3A%2F%2Fneap.co'
 * @param {String}		scope				e.g., 'profile%20email'
 * @param {[String]}	options.scopes		Extra scopes that need to be added to the original 'scope'
 *
 * @yield {Void}
 */
const _validateAuthorizationRequest = (eventHandlerStore, { client_id, response_type, redirect_uri, scope }, options) => catchErrors(co(function *() {
	const errorMsg = 'Failed to execute the \'authorization\' request'
	if (!client_id)
		throw new InvalidRequestError(`${errorMsg}. Missing required 'client_id'.`)
	if (!response_type)
		throw new InvalidRequestError(`${errorMsg}. Missing required 'response_type'.`)
	if (!redirect_uri)
		throw new InvalidRequestError(`${errorMsg}. Missing required 'redirect_uri'.`)

	const [responseTypeErrors, responseTypes] = _getResponseTypes(response_type)
	if (responseTypeErrors)
		throw wrapErrors(errorMsg, responseTypeErrors)

	if (!responseTypes || !responseTypes.length)
		throw new InvalidRequestError(`${errorMsg}. Invalid 'response_type'. 'response_type' must be a non-empty array containing at least one of the following values: 'code', 'id_token' or 'access_token'.`)	

	const scopes = oauth2Params.convert.thingToThings(scope)
	if (options && options.scopes && Array.isArray(options.scopes))
		scopes.push(...options.scopes)

	if (scopes.length) {
		// B. Verifying those scopes are allowed for that client_id
		const [serviceAccountErrors] = yield _verifyScopes(eventHandlerStore, { client_id, scopes })
		if (serviceAccountErrors)
			throw wrapErrors(errorMsg, serviceAccountErrors)
	}
}))

/**
 * Creates a new OAuth2Authenticator object that can deal with the specific IdP OAuth2 'Authorization Code' flow. 
 * 
 * @param {Passport}	Strategy					IdP Passport object
 * @param {Function}	options.parseAuthResponse	Default is '_parseAuthResponse'. Custom IdP profile parsing function that parses
 *                                             		the following three fields into an single 'user' object: 'accessToken', 'refreshToken', 'profile'
 */
function OAuth2Authenticator(Strategy, options) {
	const strategyName = (new Strategy({ clientID:1 }, () => null).name || '').toLowerCase()
	if (!strategyName)
		throw new Error('Missing required \'Strategy.name\' argument')
	if (!Strategy)
		throw new Error('Missing required \'Strategy\' argument')

	const parseIdPResponse = (options || {}).parseAuthResponse || _parseAuthResponse
	
	const OAUTH_PATHNAME = `${config.prefix ? `/${config.prefix}` : ''}/${config.version}/${strategyName}/authorize`
	const OAUTH_CALLBACK_PATHNAME = `${config.prefix ? `/${config.prefix}` : ''}/${config.version}/${strategyName}/${config.authorizeCallbackName}`

	let _passportConfigured = false
	const _configurePassport = ({ clientId, clientSecret, callbackURL, profileFields }) => passport.use(new Strategy({
		clientID: clientId,
		clientSecret: clientSecret,
		callbackURL,
		profileFields
	}, parseIdPResponse))

	/**
	 * Returns an Express handler used by the client to request Authorization access to the IdP
	 *
	 * @params {String}		identityProvider.clientId
	 * @params {String}		identityProvider.clientSecret
	 * @params {[String]}	identityProvider.scopes
	 * @params {String}		identityProvider.profileFields
	 * 
	 * 		/
	 */
	const _getAuthRequestHandler = (identityProvider, eventHandlerStore) => {
		return (req, res, next) => co(function *() {
			const [errors] = yield _validateAuthorizationRequest(eventHandlerStore, req.params)
			if (errors) {
				errors.forEach(e => console.log(e.stack || e.message))
				const { status, data } = formatOauth2Error(errors)
				return res.status(status).send(data)
			}

			const { state, uri:callbackURL } = _getRedirectUri(req, OAUTH_CALLBACK_PATHNAME)
			if (!_passportConfigured) {
				_configurePassport({ 
					clientId:identityProvider.clientId, 
					clientSecret:identityProvider.clientSecret, 
					profileFields: identityProvider.profileFields,
					callbackURL
				})
				_passportConfigured = true
			}

			const idpScopes = identityProvider.scopes || []
			if (TRACE_ON)
				console.log(`INFO - Request received to authenticate request via ${strategyName} for scopes ${idpScopes.map(s => `'${s}'`).join(', ')} (callback URL: ${callbackURL})`)

			const handler = passport.authenticate(strategyName, { callbackURL, scope:idpScopes, state })
			handler(req, res, next)
		})
	}

	this.setUp = (eventHandlerStore={}, { clientId, clientSecret, scopes, profileFields }) => {
		const errorMg = `Failed to set up '${strategyName}' passport`

		if (!eventHandlerStore.generate_token)
			throw new Error(`${errorMg}. Missing 'generate_token' event handler.`)
		if (!eventHandlerStore.get_service_account)
			throw new Error(`${errorMg}. Missing 'get_service_account' event handler.`)
		if (!eventHandlerStore.process_fip_user)
			throw new Error(`${errorMg}. Missing 'process_fip_user' event handler.`)
		if (!clientId)
			throw new Error(`${errorMg}. Missing required 'clientId'.`)
		if (!clientSecret)
			throw new Error(`${errorMg}. Missing required 'clientSecret'.`)

		const identityProvider = { 
			clientId: clientId, 
			clientSecret: clientSecret, 
			scopes,
			profileFields
		}
		const authRequestHandler = _getAuthRequestHandler(identityProvider, eventHandlerStore)
		const authResponseHandler = _getAuthResponseHandler(strategyName, eventHandlerStore)

		return {
			authRequest: authRequestHandler,
			authResponse: authResponseHandler,
			pathname: OAUTH_PATHNAME,
			callbackPathname: OAUTH_CALLBACK_PATHNAME
		}
	}

	return this
}


module.exports = {
	OAuth2Authenticator,
	processTheFIPuser
}




