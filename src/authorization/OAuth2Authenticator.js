// /**
//  * Copyright (c) 2017-2019, Neap Pty Ltd.
//  * All rights reserved.
//  * 
//  * This source code is licensed under the BSD-style license found in the
//  * LICENSE file in the root directory of this source tree.
// */

// const { co } = require('core-async')
// const passport = require('passport')
// const config = require('../config')
// const oauth2 = require('../oauth2')
// const { url:urlHelp, error: { catchErrors, wrapErrors, HttpError } } = require('puffy')
// const { response: { addErrorToUrl }, error: { formatOauth2Error, errorCode }, oauth2Params } = require('../_utils')

// if (!config)
// 	throw new Error('Missing required \'config\'')
// if (!config.version)
// 	throw new Error('Missing required \'config.version\'')
// if (!config.authorizeName)
// 	throw new Error('Missing required \'config.authorizeName\'')
// if (!config.authorizeCallbackName)
// 	throw new Error('Missing required \'config.authorizeCallbackName\'')

// const TRACE_ON = process.env.LOG_LEVEL == 'trace'

// /**
//  * Decodes the the OAuth2 response_type into an array of respnse types. 
//  * 
//  * @param  {String}		responseType	e.g., 'code+id_token'
//  * @return {[String]}   responseTypes	e.g., ['code', 'id_token']
//  */
// const _getResponseTypes = responseType => catchErrors(() => {
// 	const errorMsg = 'Invalid \'response_type\''
// 	if (!responseType) 
// 		throw new HttpError(`${errorMsg}. 'response_type' is required.`, ...errorCode.invalid_request)

// 	const responseTypes = responseType.replace(/\++/g,' ').split(' ')
// 	if (responseTypes.some(t => t != 'code' && t != 'id_token' && t != 'token'))
// 		throw new HttpError(`${errorMsg}. The value '${responseType}' is not a supported OIDC 'response_type'.`, ...errorCode.invalid_request)

// 	return responseTypes.filter(t => t == 'code' || t == 'id_token' || t == 'token')
// })

// /**
//  * Gets the request's origin (e.g., https://example.com)
//  * 
//  * @param  {Request} 	req
//  * @return {String}		output.protocol
//  * @return {String}		output.host
//  * @return {String}		output.origin
//  * @return {String}		output.pathname
//  * @return {Object}		output.query
//  */
// const _getRequestUrlInfo = req => {
// 	const isLocalhost = (req.headers.host || '').indexOf('localhost') >= 0
// 	const protocol = req.protocol === 'http' 
// 		? 'http:' 
// 		: req.protocol === 'https' 
// 			? 'https:' 
// 			: typeof(req.secure) == 'boolean' 
// 				? (req.secure ? 'https:' : 'http:')
// 				: (isLocalhost ? 'http:' : 'https:')

// 	return urlHelp.getInfo(urlHelp.buildUrl({
// 		protocol,
// 		host: req.headers.host,
// 		pathname: req.originalUrl
// 	}))
// }

// /**
//  * Gets the user details from the IdP. This should also include OIDC tokens such as a refreshToken and an accessToken. 
//  * 
//  * @param  {Request}	req				This request object contained the secret 'code' in its query params. Without 
//  *                          			that 'code', it would not be possible to get the user details. 	
//  * @param  {Response}	res				To be honest, this one is useless here.
//  * @param  {String}		strategy
//  * @param  {String}		callbackURL
//  * 
//  * @return {[Error]}	output[0]
//  * @return {Object}		output[1]		IdP User	
//  */
// const _getIdPuser = (req, res, strategy, callbackURL) => catchErrors(new Promise((onSuccess, onFailure) => {
// 	const errorMsg = `Failed to retrieve ${strategy} user and tokens when querying ${callbackURL}`

// 	if (TRACE_ON)
// 		console.log(`INFO - Exchanging ${strategy} Authorization code for a user object (incl. tokens)`)

// 	try {
// 		passport.authenticate(strategy, { callbackURL }, (err,user) => {
// 			// CASE 1 - IdP Failure
// 			if (err) 
// 				onFailure(wrapErrors(errorMsg, [err]))
// 			// CASE 2 - IdP Success
// 			else 
// 				onSuccess(user)
// 		})(req, res)
// 	} catch (err) {
// 		onFailure(wrapErrors(errorMsg, [err]))
// 	}
// }))

// const _stateEncoder = {
// 	encode: query => Buffer.from(JSON.stringify(query||{})).toString('base64'),
// 	decode: encodedState => catchErrors(() => {
// 		try {
// 			return JSON.parse(Buffer.from(encodedState||'', 'base64').toString())
// 		} catch(err) {
// 			throw new HttpError(`Failed to decode 'state' query parameter (value: ${encodedState})`, [err], 400)
// 		}
// 	})
// }

// /**
//  * Returns a URL identical to the request except it has its pathname changed to 'redirectPath' and all its query parameters
//  * JSONified into a new 'state' query parameter. The JSONified query parameters are also organized in a such a way that
//  * values such as 'response_type=code+id_token' and 'response_type=id_token+code' are identical. This is to avoid IdP such as Google
//  * to perceive those 2 values as different URLs. 
//  * 
//  * @param  {[type]} req          [description]
//  * @param  {[type]} redirectPath [description]
//  * @return {[type]}              [description]
//  */
// const _getRedirectUri = (req, redirectPath) => {
// 	const requestUrlInfo = _getRequestUrlInfo(req)
// 	const query = requestUrlInfo.query
// 	const redirectUri = urlHelp.buildUrl({ ...requestUrlInfo, pathname:redirectPath, query:'' })
// 	query.orig_redirectUri = redirectUri
// 	const state = _stateEncoder.encode(query)
	
// 	return { state, uri:redirectUri }
// }


// /**
//  * Processes the user received from the FIP via the Auth Portal. 
//  * NOTES: This flow uses three Auth Portal APIs:
//  * 1. oauth2.processIdentityProviderEndUser
//  * 2. oauth2.getIdentityClaims
//  * 3. oauth2.generateTokenOrCode
//  * 
//  * @param {Object}		user
//  * @param {String}		authPortal.api			URL to the custom Auth Portal
//  * @param {Object}		authPortal.headers
//  * @param {String}		client_id				
//  * @param {String}		strategy				e.g., 'default', 'facebook'
//  * @param {String}		responseType			e.g., 'code+id_token'
//  * @param {String}		options.scope
//  * @param {String}		options.state
//  * @param {String}		options.nonce
//  * 
//  * @yield {[Error]}		output[0]
//  * @yield {Object}		output[1].code
//  * @yield {Object}		output[1].id_token
//  * @yield {Object}		output[1].access_token
//  */
// const _processTheFIPuserViaTheAuthPortalAndGetTokens = ({ user:u, authPortal, strategy, client_id, responseType }, options) => catchErrors(co(function *() {
// 	// 1. Validate the input
// 	options = options || {}
// 	const errorMsg = 'Failed to process user authentication via the Auth Portal'
// 	// const oidcErrorMsg = 'The Auth Portal response does not comply to the OIDC specification based on the requested \'response_type\''
	
// 	if (!u)
// 		throw new HttpError(`${errorMsg}. Missing required 'user' argument.`, ...errorCode.invalid_request)
// 	if (typeof(u) != 'object')
// 		throw new HttpError(`${errorMsg}. The 'user' argument must be an object.`, ...errorCode.invalid_request)
// 	if (!authPortal || !authPortal.api)
// 		throw new HttpError(`${errorMsg}. The Auth Portal is not configured.`, ...errorCode.internal_server_error)
// 	if (!strategy)
// 		throw new HttpError(`${errorMsg}. Missing required 'strategy' argument.`, ...errorCode.invalid_request)
	
// 	const [responseTypeErrors, responseTypes] = _getResponseTypes(responseType)
// 	if (responseTypeErrors)
// 		throw wrapErrors(errorMsg, responseTypeErrors)

// 	if (!responseTypes || !responseTypes.length)
// 		throw new HttpError(`${errorMsg}. Missing required 'response_type'.`, ...errorCode.invalid_request)

// 	const user = { ...(u||{}), strategy }
// 	const scopes = oauth2Params.convert.thingToThings(options.scope)
// 	const state = options.state

// 	// 2. Process that user via the Auth Portal
// 	const [endUserErrors, endUser] = yield oauth2.processIdentityProviderEndUser({ authPortal, client_id, user, scopes, state })
// 	if (endUserErrors)
// 		throw wrapErrors(errorMsg, endUserErrors)

// 	const { user_id, audiences } = endUser

// 	const requestCode = responseTypes.some(t => t == 'code')
// 	const requestIdToken = responseTypes.some(t => t == 'id_token')
// 	const requestAccessToken = responseTypes.some(t => t == 'token')

// 	const config = { authPortal, client_id, user_id, audiences, scopes, state }

// 	const [[codeErrors, codeResult], [idTokenErrors, idTokenResult], [accessTokenErrors, accessTokenResult]] = yield [
// 		requestCode ? oauth2.generateAuthorizationCode(config) : Promise.resolve([null, null]),
// 		requestIdToken ? oauth2.generateIdToken(config) : Promise.resolve([null, null]),
// 		requestAccessToken ? oauth2.generateAccessToken(config) : Promise.resolve([null, null]),
// 	]

// 	if (codeErrors)
// 		throw wrapErrors(errorMsg, codeErrors)
// 	if (idTokenErrors)
// 		throw wrapErrors(errorMsg, idTokenErrors)
// 	if (accessTokenErrors)
// 		throw wrapErrors(errorMsg, accessTokenErrors)

// 	const tokens = {}
// 	if (codeResult)
// 		tokens.code = codeResult
// 	if (idTokenResult)
// 		tokens.id_token = idTokenResult
// 	if (accessTokenResult)
// 		tokens.access_token = accessTokenResult

// 	return tokens
// }))

// /**
//  * Returns an Express handler that the client indirectly requests through the IdP redirection performed in response of 
//  * an Authorization access request (done previously through the 'authRequestHandler' handler)
//  *
//  * @param  {String} strategy 							e.g., facebook, google, linkedin, github
//  * @param  {String} authPortal.api 						URL of the API (POST) that accepts a user and returns a custom response.
//  * @param  {Object} authPortal.headers   				Auth HTTP headers to safely communicate between 'UserIn' and the 'authPortal.api' endpoint.
//  * @param  {Object} onSuccess   						Object defining a set of properties that are always returned in case of success
//  * @param  {Object} onError   							Object defining a set of properties that are always returned in case of error
//  *														
//  * @return {Handler}           							[description]
//  */
// const _getAuthResponseHandler = ({ strategy, authPortal }) => {
// 	const errorMsg = `Failed to process authentication response from ${strategy}`
// 	const _getMissingQueryParamError = queryParam => 
// 		`${errorMsg}. ${strategy} did not include the required query parameter '${queryParam}' in its redirect URI. It was either not included in the first place, or ${strategy} removed it when redirecting back to UserIn.`
// 	const _getMissingStateQueryParamError = queryParam => 
// 		`${errorMsg}. The encoded 'state' query parameter in the ${strategy} redirect URI is missing the required '${queryParam}' variable.`
	
// 	return (req, res) => co(function *() {
// 		const { state:fipState } = req.params

// 		const requestUrlInfo = _getRequestUrlInfo(req)

// 		if (TRACE_ON)
// 			console.log(`INFO - Received redirect from ${strategy} to ${requestUrlInfo.pathname}`)

// 		let redirect_uri // used to deal with the errors
// 		const [errors, redirectUri] = yield catchErrors(co(function *() {

// 			if (!fipState)
// 				throw new HttpError(_getMissingQueryParamError('state'), 400)
// 			const [decodedStateErrors, decodedState] = _stateEncoder.decode(fipState)
// 			if (decodedStateErrors)
// 				throw new HttpError(errorMsg, decodedStateErrors)

// 			const options = decodedState || {}

// 			if (!options.client_id)
// 				throw new HttpError(_getMissingStateQueryParamError('client_id'), ...errorCode.invalid_request)
// 			if (!options.redirect_uri)
// 				throw new HttpError(_getMissingStateQueryParamError('redirect_uri'), ...errorCode.invalid_request)
// 			if (!options.response_type)
// 				throw new HttpError(_getMissingStateQueryParamError('response_type'), ...errorCode.invalid_request)
// 			if (!options.orig_redirectUri)
// 				throw new HttpError(_getMissingStateQueryParamError('orig_redirectUri'), ...errorCode.invalid_request)

// 			redirect_uri = options.redirect_uri

// 			// The 'options.orig_redirectUri' URL is a security check. Certain IdPs (e.g., Facebook) requires that you 
// 			// use the same redirect uri that then one used to get the 'code' in order to get the access_token.
// 			const [idpErrors, user] = yield _getIdPuser(req, res, strategy, options.orig_redirectUri)

// 			if (idpErrors)
// 				throw wrapErrors(errorMsg, idpErrors)

// 			const [authAPIerrors, authAPIresp] = yield _processTheFIPuserViaTheAuthPortalAndGetTokens({ 
// 				user, 
// 				authPortal, 
// 				strategy, 
// 				client_id: options.client_id,
// 				responseType: options.response_type
// 			}, options)

// 			if (authAPIerrors)
// 				throw wrapErrors(errorMsg, authAPIerrors)

// 			if (TRACE_ON)
// 				console.log('INFO - Auth Portal successfully authenticated the user')

// 			// Builds the redirect_uri
// 			const urlInfo = urlHelp.getInfo(redirect_uri)
// 			if (authAPIresp && authAPIresp.code && authAPIresp.code.token)
// 				urlInfo.query.code = authAPIresp.code.token
// 			if (authAPIresp && authAPIresp.access_token && authAPIresp.access_token.token)
// 				urlInfo.query.access_token = authAPIresp.access_token.token
// 			if (authAPIresp && authAPIresp.id_token && authAPIresp.id_token.token)
// 				urlInfo.query.id_token = authAPIresp.id_token.token
// 			if (options.state)
// 				urlInfo.query.state = options.state
			
// 			const redirectUri = urlHelp.buildUrl(urlInfo)
			
// 			return redirectUri
// 		}))

// 		if (errors) {
// 			errors.forEach(error => console.log(error.stack || error.message))
// 			const code = errors[0].code || 500
// 			const [error01, error02] = errors
// 			const message = [error01, error02].filter(e => e && e.message).map(e => e.message).join(' - ')
// 			if (redirectUri)
// 				res.redirect(addErrorToUrl(redirectUri, { code, message }))
// 			else
// 				res.status(code).send(message)
// 		} else
// 			res.redirect(redirectUri)
// 	})
// }

// const _parseAuthResponse = (accessToken, refreshToken, profile, next) => {
// 	const id = profile.id
// 	const { givenName: firstName, middleName, familyName: lastName } = profile.name || {}
// 	const email = ((profile.emails || [])[0] || {}).value || null
// 	const profileImg = ((profile.photos || [])[0] || {}).value

// 	const user = { id, firstName, middleName, lastName, email, profileImg, accessToken, refreshToken }
// 	next(null, user)
// }

// /**
//  * Validates the authorization request before it is sent to the IdP. 
//  * 
//  * @param {String}		client_id			e.g., '123445'
//  * @param {String}		response_type		e.g., 'code+id_token'
//  * @param {String}		redirect_uri		e.g., 'https%3A%2F%2Fneap.co'
//  * @param {String}		scope				e.g., 'profile%20email'
//  * @param {String}		authPortal.api
//  * @param {Object}		authPortal.headers
//  * @param {[String]}	options.scopes		Extra scopes that need to be added to the original 'scope'
//  *
//  * @yield {Void}
//  */
// const _validateAuthorizationRequest = ({ client_id, response_type, redirect_uri, scope }, authPortal, options) => catchErrors(co(function *() {
// 	const errorMsg = 'Failed to execute the \'authorization\' request'
// 	if (!client_id)
// 		throw new HttpError(`${errorMsg}. Missing required 'client_id'.`, ...errorCode.invalid_request)
// 	if (!response_type)
// 		throw new HttpError(`${errorMsg}. Missing required 'response_type'.`, ...errorCode.invalid_request)
// 	if (!redirect_uri)
// 		throw new HttpError(`${errorMsg}. Missing required 'redirect_uri'.`, ...errorCode.invalid_request)

// 	const [responseTypeErrors, responseTypes] = _getResponseTypes(response_type)
// 	if (responseTypeErrors)
// 		throw wrapErrors(errorMsg, responseTypeErrors)

// 	if (!responseTypes || !responseTypes.length)
// 		throw new HttpError(`${errorMsg}. Invalid 'response_type'. 'response_type' must be a non-empty array containing at least one of the following values: 'code', 'id_token' or 'access_token'.`, ...errorCode.invalid_request)	

// 	const scopes = decodeURIComponent(scope || '').replace(/\++/g,' ').split(' ').filter(x => x)
// 	if (options && options.scopes && Array.isArray(options.scopes))
// 		scopes.push(...options.scopes)

// 	if (scopes.length) {
// 		const [errors] = yield oauth2.verifyServiceAccountScopes({ authPortal, client_id, scopes })
// 		if (errors)
// 			throw wrapErrors(errorMsg, errors)
// 	}
// }))

// /**
//  * Creates a new OAuth2Authenticator object that can deal with the specific IdP OAuth2 'Authorization Code' flow. 
//  * 
//  * @param {Passport}	Strategy					IdP Passport object
//  * @param {Function}	options.parseAuthResponse	Default is '_parseAuthResponse'. Custom IdP profile parsing function that parses
//  *                                             		the following three fields into an single 'user' object: 'accessToken', 'refreshToken', 'profile'
//  */
// module.exports = function OAuth2Authenticator(Strategy, options) {
// 	const strategyName = (new Strategy({ clientID:1 }, () => null).name || '').toLowerCase()
// 	if (!strategyName)
// 		throw new Error('Missing required \'Strategy.name\' argument')
// 	if (!Strategy)
// 		throw new Error('Missing required \'Strategy\' argument')

// 	const parseIdPResponse = (options || {}).parseAuthResponse || _parseAuthResponse
	
// 	const OAUTH_PATHNAME = `${config.prefix ? `/${config.prefix}` : ''}/${config.version}/${strategyName}/${config.authorizeName}`
// 	const OAUTH_CALLBACK_PATHNAME = `${config.prefix ? `/${config.prefix}` : ''}/${config.version}/${strategyName}/${config.authorizeCallbackName}`

// 	let _passportConfigured = false
// 	const _configurePassport = ({ clientId, clientSecret, callbackURL, profileFields }) => passport.use(new Strategy({
// 		clientID: clientId,
// 		clientSecret: clientSecret,
// 		callbackURL,
// 		profileFields
// 	}, parseIdPResponse))

// 	/**
// 	 * Returns an Express handler used by the client to request Authorization access to the IdP
// 	 *
// 	 * @params {String}		identityProvider.clientId
// 	 * @params {String}		identityProvider.clientSecret
// 	 * @params {[String]}	identityProvider.scopes
// 	 * @params {String}		identityProvider.profileFields
// 	 * 
// 	 * 		/
// 	 */
// 	const _getAuthRequestHandler = (identityProvider, authPortal) => {
// 		return (req, res, next) => co(function *() {
// 			const [errors] = yield _validateAuthorizationRequest(req.params, authPortal)
// 			if (errors) {
// 				errors.forEach(e => console.log(e.stack || e.message))
// 				const { status, data } = formatOauth2Error(errors)
// 				return res.status(status).send(data)
// 			}

// 			const { state, uri:callbackURL } = _getRedirectUri(req, OAUTH_CALLBACK_PATHNAME)
// 			if (!_passportConfigured) {
// 				_configurePassport({ 
// 					clientId:identityProvider.clientId, 
// 					clientSecret:identityProvider.clientSecret, 
// 					profileFields: identityProvider.profileFields,
// 					callbackURL
// 				})
// 				_passportConfigured = true
// 			}

// 			const idpScopes = identityProvider.scopes || []
// 			if (TRACE_ON)
// 				console.log(`INFO - Request received to authenticate request via ${strategyName} for scopes ${idpScopes.map(s => `'${s}'`).join(', ')} (callback URL: ${callbackURL})`)

// 			const handler = passport.authenticate(strategyName, { callbackURL, scope:idpScopes, state })
// 			handler(req, res, next)
// 		})
// 	}

// 	this.setUp = ({ clientId, clientSecret, scopes, profileFields, authPortal }) => {
// 		const identityProvider = { 
// 			clientId: clientId, 
// 			clientSecret: clientSecret, 
// 			scopes,
// 			profileFields
// 		}
// 		const authRequestHandler = _getAuthRequestHandler(identityProvider, authPortal)
// 		const authResponseHandler = _getAuthResponseHandler({ strategy:strategyName, authPortal })

// 		return {
// 			authRequest: authRequestHandler,
// 			authResponse: authResponseHandler,
// 			pathname: OAUTH_PATHNAME,
// 			callbackPathname: OAUTH_CALLBACK_PATHNAME
// 		}
// 	}

// 	return this
// }
