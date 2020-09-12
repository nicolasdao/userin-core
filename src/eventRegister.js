const { co } = require('core-async')
const { error: { catchErrors, wrapErrors, HttpError } } = require('puffy')
const { oauth2Params, error: { errorCode } } = require('./_utils')
const { Strategy, SUPPORTED_EVENTS } = require('./_core')

function EventHandler(handler) {
	let _this = this
	this.handlers = handler ? [handler] : []
	
	this.addHandler = handler => _this.handlers.push(handler)

	this.exec = (...args) => catchErrors(co(function *() {
		let result = null
		for (let h of _this.handlers) {
			const intermediateResult = yield Promise.resolve(null).then(() => h(result, ...args))
			if (intermediateResult)
				result = intermediateResult
		}
		
		return result
	}))

	return this
}

const addGenerateAccessOrRefreshTokenHandler = type => eventHandlerStore => {
	const eventName = `generate_${type}`
	if (eventHandlerStore[eventName])
		return
	const handler = (root, { client_id, user_id, audiences, scopes, state }) => co(function *() {
		const errorMsg = `Failed to generate ${type}`
		if (!eventHandlerStore.generate_token)
			throw new HttpError(`${errorMsg}. Missing 'generate_token' handler.`, ...errorCode.internal_server_error)
		
		const claims = oauth2Params.convert.toOIDCClaims({ 
			iss: process.env.ISS, 
			client_id, 
			user_id, 
			audiences, 
			scopes
		}) 

		const [errors, result] = yield eventHandlerStore.generate_token.exec({ type, claims, state })
		if (errors)
			throw wrapErrors(errorMsg, errors)
		else 
			return result
	})

	eventHandlerStore[eventName] = new EventHandler(handler)
}

const addGenerateAccessTokenHandler = addGenerateAccessOrRefreshTokenHandler('access_token')
const addGenerateRefreshTokenHandler = addGenerateAccessOrRefreshTokenHandler('refresh_token')
const addGenerateIdTokenHandler = eventHandlerStore => {
	const eventName = 'generate_id_token'
	if (eventHandlerStore[eventName])
		return
	const handler = (root, { client_id, user_id, audiences, scopes, state }) => co(function *() {
		const errorMsg = 'Failed to generate id_token'
		if (!eventHandlerStore.get_identity_claims)
			throw new HttpError(`${errorMsg}. Missing 'get_identity_claims' handler.`, ...errorCode.internal_server_error)
		if (!eventHandlerStore.generate_token)
			throw new HttpError(`${errorMsg}. Missing 'generate_token' handler.`, ...errorCode.internal_server_error)
		
		const [identityClaimsErrors, identityClaims={}] = yield eventHandlerStore.get_identity_claims.exec({ client_id, user_id, scopes, state })
		if (identityClaimsErrors)
			throw wrapErrors(errorMsg, identityClaimsErrors)

		const claims = oauth2Params.convert.toOIDCClaims({ 
			iss: process.env.ISS, 
			client_id, 
			user_id, 
			audiences, 
			scopes,
			extra: identityClaims
		}) 

		const [errors, result] = yield eventHandlerStore.generate_token.exec({ type:'id_token', claims, state })
		if (errors)
			throw wrapErrors(errorMsg, errors)
		else 
			return result
	})

	eventHandlerStore[eventName] = new EventHandler(handler)
}
const addGenerateAuthorizationCodeHandler = eventHandlerStore => {
	const eventName = 'generate_authorization_code'
	if (eventHandlerStore[eventName])
		return
	const handler = (root, { client_id, user_id, scopes, state }) => co(function *() {
		const errorMsg = 'Failed to generate authorization code'
		if (!eventHandlerStore.generate_token)
			throw new HttpError(`${errorMsg}. Missing 'generate_token' handler.`, ...errorCode.internal_server_error)
		
		const claims = oauth2Params.convert.toOIDCClaims({ 
			iss: process.env.ISS, 
			client_id, 
			user_id, 
			scopes
		}) 

		const [errors, result] = yield eventHandlerStore.generate_token.exec({ type:'code', claims, state })
		if (errors)
			throw wrapErrors(errorMsg, errors)
		else 
			return result
	})

	eventHandlerStore[eventName] = new EventHandler(handler)
}

const registerSingleEvent = eventHandlerStore => (eventName, handler) => {
	if (!eventName)
		throw new Error('Missing required \'eventName\'')
	if (!handler)
		throw new Error('Missing required \'handler\'')
	if (typeof(handler) != 'function')
		throw new Error(`Invalid 'handler'. Expect 'handler' to be a function, but found ${typeof(handler)} instead.`)

	if (SUPPORTED_EVENTS.indexOf(eventName) < 0)
		throw new Error(`Invalid 'eventName'. ${eventName} is not supported. Expect 'eventName' to be equal to one of the following values: ${SUPPORTED_EVENTS.join(', ')}.`)

	if (eventHandlerStore[eventName])
		eventHandlerStore[eventName].addHandler(handler)
	else
		eventHandlerStore[eventName] = new EventHandler(handler)
}

module.exports = eventHandlerStore => {
	if (!eventHandlerStore)
		throw new Error('Missing required \'eventHandlerStore\'')
	if (typeof(eventHandlerStore) != 'object')
		throw new Error(`Invalid 'eventHandlerStore'. Expect 'eventHandlerStore' to be an object, but found ${typeof(eventHandlerStore)} instead.`)

	addGenerateAccessTokenHandler(eventHandlerStore)
	addGenerateRefreshTokenHandler(eventHandlerStore)
	addGenerateIdTokenHandler(eventHandlerStore)
	addGenerateAuthorizationCodeHandler(eventHandlerStore)

	const registerEvent = registerSingleEvent(eventHandlerStore)

	/**
	 * Registers one or many event handlers to the 'eventHandlerStore'. 
	 *
	 * 1st arity:
	 * ==========
	 * @param  {Strategy}	strategyHandler		This object is a concrete implementation of the UserIn Startegy class. It
	 *                                     		defines all handlers. 
	 * @return {Void}
	 *
	 * 2nd arity:
	 * ==========
	 * @param  {String}		eventName			One of the allowed event as defined in SUPPORTED_EVENTS. 
	 * @param  {Function}	handler				Event handler for that event.
	 * 
	 * @return {Void}
	 */
	return (...args) => {
		const strategyHandler = args[0]
		if (strategyHandler && strategyHandler instanceof Strategy)
			SUPPORTED_EVENTS.forEach(eventName => registerEvent(eventName, strategyHandler[eventName]))
		else {
			const [eventName, handler] = args
			registerEvent(eventName, handler)
		}
	}
}









