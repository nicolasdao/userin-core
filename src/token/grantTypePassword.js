const { co } = require('core-async')
const { error: { catchErrors, wrapErrors } } = require('puffy')
const { error: { InternalServerError, InvalidRequestError }, oauth2Params } = require('../_utils')

/**
 * Creates a new access token using username and password.
 * 	
 * @param {String}		client_id	
 * @param {String}		user.username
 * @param {String}		user.password	
 * @param {[String]}	scopes	
 * @param {String}		state
 * 
 * @yield {[Error]}		output[0]
 * @yield {String}		output[1].access_token
 * @yield {String}		output[1].token_type
 * @yield {String}		output[1].expires_in
 * @yield {String}		output[1].id_token
 * @yield {String}		output[1].scope
 */
const exec = (eventHandlerStore, { client_id, user, scopes, state }) => catchErrors(co(function *() {
	const errorMsg = 'Failed to acquire tokens for grant_type \'password\''
	// A. Validates input
	if (!eventHandlerStore.get_service_account)
		throw new InternalServerError(`${errorMsg}. Missing 'get_service_account' handler.`)
	if (!eventHandlerStore.process_end_user)
		throw new InternalServerError(`${errorMsg}. Missing 'process_end_user' handler.`)
	if (!eventHandlerStore.generate_token)
		throw new InternalServerError(`${errorMsg}. Missing 'generate_token' handler.`)

	if (!client_id)
		throw new InvalidRequestError(`${errorMsg}. Missing required 'client_id'`)
	if (!user)
		throw new InvalidRequestError(`${errorMsg}. Missing required 'user'`)
	if (!user.username)
		throw new InvalidRequestError(`${errorMsg}. Missing required 'user.username'`)
	if (!user.password)
		throw new InvalidRequestError(`${errorMsg}. Missing required 'user.password'`)

	// B. Verifying those scopes are allowed for that client_id
	const [serviceAccountErrors, serviceAccount] = yield eventHandlerStore.get_service_account.exec({ client_id })
	if (serviceAccountErrors)
		throw wrapErrors(errorMsg, serviceAccountErrors)

	const [scopeErrors] = oauth2Params.verify.scopes({ scopes, serviceAccountScopes:serviceAccount.scopes })
	if (scopeErrors)
		throw wrapErrors(errorMsg, scopeErrors)

	// C. Processes user
	const [userErrors, validUser] = yield eventHandlerStore.process_end_user.exec({ client_id, user, state })
	if (userErrors)
		throw wrapErrors(errorMsg, userErrors)
	
	// D. Validate that the client_id is allowed to process this user. 
	if (!validUser)
		throw new InternalServerError(`${errorMsg}. Corrupted data. Processing the end user failed to return any data.`)

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


module.exports = {
	exec
}


