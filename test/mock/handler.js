const tokenHelper = require('./token')
const { Strategy } = require('../../src/_core')

const SCOPES = [
	'profile',
	'offline_access',
	'email',
	'phone',
	'address'
]

const CLAIMS = [
	// Required OIDC
	'iss', 
	'sub',
	'aud',
	'exp',
	'iat',
	// Popular profile
	'name',
	'family_name',
	'given_name',
	'middle_name',
	'nickname',
	'preferred_username',
	'profile',
	'picture',
	'website',
	'gender',
	'birthdate',
	'zoneinfo',
	'locale',
	'updated_at',
	// email
	'email',
	'email_verified',
	// address
	'address',
	// phone
	'phone',
	'phone_number_verified'
]

process.env.ISS = 'https://userin.com'
const AUDIENCES = ['https://unittest.com']

const SERVICE_ACCOUNT_STORE = [{
	client_id:'default', 
	client_secret:123, 
	scopes:SCOPES, 
	audiences:AUDIENCES
}, {
	client_id:'fraudster', 
	client_secret:456, 
	scopes:['profile'], 
	audiences:AUDIENCES
}]

const USER_STORE = [{
	id:1,
	given_name:'Nic',
	family_name:'Dao',
	zoneinfo: 'Australia/Sydney',
	email:'nic@cloudlessconsulting.com',
	email_verified:true,
	address:'Some street in Sydney',
	phone: '+6112345678',
	phone_number_verified: false,
	password: 123456
}]

const USER_TO_SERVICE_ACCOUNT_STORE = [{
	user_id: 1,
	client_id: 'default'
}]

const getProfileClaims = entity => {
	entity = entity || {}
	return {
		given_name:entity.given_name || null,
		family_name:entity.family_name || null,
		zoneinfo: entity.zoneinfo || null
	}
}

const getPhoneClaims = entity => {
	entity = entity || {}
	return {
		phone:entity.phone || null,
		phone_number_verified: entity.phone_number_verified || false
	}
}

const getEmailClaims = entity => {
	entity = entity || {}
	return {
		email:entity.email || null,
		email_verified:entity.email_verified || false
	}
}

const getAddressClaims = entity => {
	entity = entity || {}
	return {
		address:entity.address || null
	}
}

class MockStrategy extends Strategy {
	constructor() {
		super()
		this.name = 'mock'
	}
}

/**
 * Gets the service account's audiences and scopes. 
 *  
 * @param  {Object} 	root				Previous handler's response. Occurs when there are multiple handlers defined for the same event. 
 * @param  {String}		client_id
 * @param  {String}		client_secret		Optional. If specified, this method should validate the client_secret.
 * 
 * @return {[String]}	output.audiences	Service account's audiences.	
 * @return {[String]}	output.scopes		Service account's scopes.	
 */
MockStrategy.prototype.get_service_account = (root, { client_id, client_secret }) => {
	if (!client_id)
		throw new Error('Missing required \'client_id\'')

	const serviceAccount = SERVICE_ACCOUNT_STORE.find(x => x.client_id == client_id)
	if (!serviceAccount)
		throw new Error(`Service account ${client_id} not found`)
	if (client_secret && serviceAccount.client_secret != client_secret)
		throw new Error('Unauthorized access')

	return {
		audiences: serviceAccount.audiences || [],
		scopes: serviceAccount.scopes || []
	}
}

/**
 * Gets a code or a token claims
 * 
 * @param  {Object} 	root				Previous handler's response. Occurs when there are multiple handlers defined for the same event. 
 * @param  {String}		type				Values are restricted to: `code`, `access_token`, `id_token`, `refresh_token`
 * @param  {Object}		token
 * 
 * @return {Object}		claims				This object should always defined the following properties at a mimumum.
 * @return {String}		claims.iss			
 * @return {Object}		claims.sub			String or number
 * @return {String}		claims.aud
 * @return {Number}		claims.exp
 * @return {Number}		claims.iat
 * @return {Object}		claims.client_id	String or number
 * @return {String}		claims.scope
 */
MockStrategy.prototype.get_token_claims = (root, { type, token }) => {
	
	if (!type)
		throw new Error('Missing required \'type\'.')
	if (type != 'code' && type != 'access_token' && type != 'id_token' && type != 'refresh_token')
		throw new Error(`Invalid 'type'. '${type}' is not supported. Valid values are: 'code', 'access_token', 'id_token', 'refresh_token'.`)
	if (!token)
		throw new Error('Missing required \'token\'.')

	const claims = tokenHelper.decrypt(token)
	
	return claims
}

/**
 * Generates a new token or code. 
 * 
 * @param  {Object} 	root				Previous handler's response. Occurs when there are multiple handlers defined for the same event. 
 * @param  {String}		type				Values are restricted to: `code`, `access_token`, `id_token`, `refresh_token`
 * @param  {Object}		claims
 * @param  {String}		state				This optional value is not strictly necessary, but it could help set some context based on your own requirements.
 * 
 * @return {String}		output.token
 * @return {Number}		output.expires_in
 */
MockStrategy.prototype.generate_token = (root, { type, claims }) => {
	if (type != 'code' && type != 'access_token' && type != 'id_token' && type != 'refresh_token')
		throw new Error(`Invalid 'type'. '${type}' is not supported. Valid values are: 'code', 'access_token', 'id_token', 'refresh_token'.`)

	return tokenHelper.createValid(claims)
}

/**
 * Gets the identity claims for a specific user and service account based on the 'scopes'.
 * 
 * @param  {Object} 	root				Previous handler's response. Occurs when there are multiple handlers defined for the same event. 
 * @param  {String}		client_id
 * @param  {String}		user_id
 * @param  {[String]}	scopes
 * @param  {String}		state				This optional value is not strictly necessary, but it could help set some context based on your own requirements.
 * 
 * @return {Object}		identityClaims		e.g., { given_name:'Nic', family_name:'Dao' }
 */
MockStrategy.prototype.get_identity_claims = (root, { client_id, user_id, scopes }) => {
	if (!client_id)
		throw new Error('Missing required \'client_id\'')
	if (!user_id)
		throw new Error('Missing required \'user_id\'')

	const user = USER_STORE.find(x => x.id == user_id)
	if (!user)
		throw new Error(`user_id ${user_id} not found.`)
	const userToServiceAccount = USER_TO_SERVICE_ACCOUNT_STORE.find(x => x.user_id == user_id)
	if (!userToServiceAccount || !userToServiceAccount.client_id)
		throw new Error(`Corrupted data user_id ${user_id} is not linked to any service account.`)
	if (userToServiceAccount.client_id != client_id)
		throw new Error('Unauthorized access')

	if (!scopes || !scopes.filter(s => s != 'openid').length)
		return getProfileClaims(user)
	else {
		return {
			...(scopes.some(s => s == 'profile') ? getProfileClaims(user)  : {}),
			...(scopes.some(s => s == 'email') ? getEmailClaims(user)  : {}),
			...(scopes.some(s => s == 'address') ? getAddressClaims(user)  : {}),
			...(scopes.some(s => s == 'phone') ? getPhoneClaims(user)  : {})
		}
	}
}

/**
 * Processes a user based on their username and password. Verifies that this user is associated with the client_id.
 * 
 * @param  {Object} 	root				Previous handler's response. Occurs when there are multiple handlers defined for the same event. 
 * @param  {String}		client_id
 * @param  {String}		user.username
 * @param  {String}		user.password
 * @param  {String}		user...				More properties
 * @param  {String}		state				This optional value is not strictly necessary, but it could help set some context based on your own requirements.
 * 
 * @return {Object}		user				This object should always defined the following properties at a mimumum.
 * @return {Object}		user.id				String ot number
 */
MockStrategy.prototype.process_end_user = (root, { client_id, user }) => {
	if (!client_id)
		throw new Error('Missing required \'client_id\'')
	if (!user)
		throw new Error('Missing required \'user\'')
	if (!user.username)
		throw new Error('Missing required \'user.username\'')
	if (!user.password)
		throw new Error('Missing required \'user.password\'')

	const existingUser = USER_STORE.find(x => x.email == user.username)
	if (!existingUser)
		throw new Error(`user ${user.username} not found`)
	if (existingUser.password != user.password)
		throw new Error('Incorrect username or password')
	const userToServiceAccount = USER_TO_SERVICE_ACCOUNT_STORE.find(x => x.user_id == existingUser.id)
	if (!userToServiceAccount || !userToServiceAccount.client_id)
		throw new Error(`Corrupted data user_id ${existingUser.id} is not linked to any service account.`)
	if (userToServiceAccount.client_id != client_id)
		throw new Error('Unauthorized access')
	
	return {
		id: existingUser.id
	}
}

MockStrategy.prototype.process_fip_user = (root, { type, claims }) => {
	if (type != 'code' && type != 'access_token' && type != 'id_token' && type != 'refresh_token')
		throw new Error(`Invalid 'type'. '${type}' is not supported. Valid values are: 'code', 'access_token', 'id_token', 'refresh_token'.`)
	
	return tokenHelper.createValid(claims)
}

module.exports = {
	MockStrategy,
	getClaims: () => CLAIMS
}



