const { validateUrl, getInfo } = require('./_utils')

const OPENID_MODE = 'openid'
const LOGIN_SIGNUP_MODE = 'loginsignup'
const LOGIN_SIGNUP_FIP_MODE = 'loginsignupfip'
const SUPPORTED_MODES = [OPENID_MODE, LOGIN_SIGNUP_MODE, LOGIN_SIGNUP_FIP_MODE]
const CONFIG_KEYS = ['modes', 'tokenExpiry', 'openid']

const OPENID_REQUIRED_EVENTS = [
	// Generates tokens
	'generate_access_token',
	'generate_authorization_code',
	'generate_id_token', 
	'generate_refresh_token',
	// Gets a client's details
	'get_client',
	// Gets a user's details
	'get_end_user', 
	'get_identity_claims', 
	// Gets tokens' details
	'get_access_token_claims', 
	'get_authorization_code_claims',
	'get_id_token_claims', 
	'get_refresh_token_claims',
	// Gets metadata
	'get_claims_supported',
	'get_scopes_supported'
]

const OPENID_OPTIONAL_EVENTS = [
	// Gets tokens' details
	'get_jwks',
	// Gets metadata
	'get_grant_types_supported'
]

const OPENID_EVENTS = [...OPENID_REQUIRED_EVENTS, ...OPENID_OPTIONAL_EVENTS]

const LOGIN_SIGNUP_EVENTS = [
	// Creates a new user
	'create_end_user',
	// Gets a user's details
	'get_end_user',
	// Generates tokens
	'generate_access_token',
	'generate_refresh_token',
	// Gets tokens' details
	'get_refresh_token_claims',
	'get_access_token_claims',
	// Deletes refresh_token
	'delete_refresh_token'
]

const LOGIN_SIGNUP_FIP_EVENTS = [
	...LOGIN_SIGNUP_EVENTS,
	// Creates a new user
	'create_fip_user',
	// Gets a FIP user's details
	'get_fip_user',
	// Generates tokens
	'generate_authorization_code',
	// Gets tokens' details
	'get_authorization_code_claims'
]

const SUPPORTED_EVENTS = Array.from(new Set([...OPENID_EVENTS, ...LOGIN_SIGNUP_EVENTS, ...LOGIN_SIGNUP_FIP_EVENTS]))

const getSupportedModes = modes => {
	const defaultModes = ['loginsignup']
	if (!modes || !Array.isArray(modes) || !modes.length)
		return defaultModes

	const supportedModes = modes.map(m => m.toLowerCase().trim()).filter(m => SUPPORTED_MODES.indexOf(m) >= 0)
	return supportedModes.length ? supportedModes : defaultModes
}

const isLoginSignupModeOn = (modes=[]) => modes.some(m => m == LOGIN_SIGNUP_MODE)
const isLoginSignupFipModeOn = (modes=[]) => modes.some(m => m == LOGIN_SIGNUP_FIP_MODE)
const isOpenIdModeOn = (modes=[]) => modes.some(m => m == OPENID_MODE)

class Strategy {
	/**
	 * Creates a new UserIn Strategy instance.
	 * 
	 * @param  {String}		config.baseUrl							
	 * @param  {[String]}	config.modes							Valid values: 'openid', 'loginsignup' (default).
	 * @param  {String}		config.tokenExpiry.access_token			[Required] access_token expiry time in seconds.
	 * @param  {String}		config.tokenExpiry.refresh_token		refresh_token expiry time in seconds. Default null, which means this token never expires.
	 * @param  {Object}		config.openid							OIDC config. Only required when 'modes' contains 'openid'.
	 * @param  {String}		config.openid.iss						[Required] OIDC issuer.
	 * @param  {String}		config.openid.tokenExpiry.id_token		[Required] OIDC id_token expiry time in seconds.
	 * @param  {String}		config.openid.tokenExpiry.code			[Required] OIDC code expiry time in seconds.
	 * 
	 * @return {Strategy} 	userInStrategy
	 */
	constructor(config) {
		// 1. Validates the required configs
		if (!config) 
			throw new Error('The UserIn strategy \'config\' object is required')
		if (typeof(config) != 'object') 
			throw new Error(`The UserIn strategy 'config' is expected to be an object, found ${typeof(config)} instead`)
		
		if (!config.baseUrl)
			throw new Error('The UserIn strategy \'config.baseUrl\' is required.')
		if (!validateUrl(config.baseUrl))
			throw new Error(`The UserIn strategy 'config.baseUrl' ${config.baseUrl} is not a valid url.`)
		if (config.tokenExpiry && typeof(config.tokenExpiry) != 'object') 
			throw new Error(`The UserIn strategy 'config.tokenExpiry' is expected to be an object. Found ${typeof(config.tokenExpiry)} instead.`)
		if (config.openid && config.openid.tokenExpiry && typeof(config.openid.tokenExpiry) != 'object') 
			throw new Error(`The UserIn strategy 'config.openid.tokenExpiry' is expected to be an object. Found ${typeof(config.openid.tokenExpiry)} instead.`)

		const tokenExpiry = { ...(config.tokenExpiry||{}), ...(config.openid||{}).tokenExpiry }

		if (!tokenExpiry.access_token) 
			throw new Error('The UserIn strategy \'tokenExpiry.access_token\' number is required')
		if (isNaN(tokenExpiry.access_token*1)) 
			throw new Error(`The UserIn strategy 'tokenExpiry.access_token' must be a number in seconds. Found ${typeof(tokenExpiry.access_token)} instead.`)
		if (tokenExpiry.refresh_token && isNaN(tokenExpiry.refresh_token*1)) 
			throw new Error(`The UserIn strategy 'tokenExpiry.refresh_token' must be a number in seconds. Found ${typeof(tokenExpiry.refresh_token)} instead.`)

		tokenExpiry.access_token = tokenExpiry.access_token*1
		if (tokenExpiry.refresh_token)
			tokenExpiry.refresh_token = tokenExpiry.refresh_token*1

		this.config = {
			baseUrl: config.baseUrl,
			tokenExpiry: {
				access_token: tokenExpiry.access_token,
				refresh_token: tokenExpiry.refresh_token || null
			}
		}

		// 2. Determines the modes
		const modes = getSupportedModes(config.modes)
		this.modes = modes

		// 3. Validates the loginsignupfip mode 
		if (isLoginSignupFipModeOn(modes)) {
			if (!tokenExpiry.code) 
				throw new Error(`When modes contains '${LOGIN_SIGNUP_FIP_MODE}', the UserIn strategy 'tokenExpiry.code' number is required`)
			if (isNaN(tokenExpiry.code*1)) 
				throw new Error(`When modes contains '${LOGIN_SIGNUP_FIP_MODE}', the UserIn strategy 'tokenExpiry.code' must be a number in seconds. Found ${typeof(tokenExpiry.code)} instead.`)

			this.config.tokenExpiry.code = tokenExpiry.code*1
		}

		// 4. Validates the OIDC configs
		if (isOpenIdModeOn(modes)) {
			// 4.A. Validates the config
			if (!config.openid) 
				throw new Error(`When modes contains '${OPENID_MODE}', the UserIn strategy 'config.openid' object is required`)
			if (!tokenExpiry) 
				throw new Error(`When modes contains '${OPENID_MODE}', the UserIn strategy 'tokenExpiry' object is required`)
			if (!tokenExpiry.id_token) 
				throw new Error(`When modes contains '${OPENID_MODE}', the UserIn strategy 'tokenExpiry.id_token' number is required`)
			if (!tokenExpiry.code) 
				throw new Error(`When modes contains '${OPENID_MODE}', the UserIn strategy 'tokenExpiry.code' number is required`)
			if (isNaN(tokenExpiry.id_token*1)) 
				throw new Error(`The UserIn strategy 'tokenExpiry.id_token' must be a number in seconds. Found ${typeof(tokenExpiry.id_token)} instead.`)
			if (isNaN(tokenExpiry.code*1)) 
				throw new Error(`The UserIn strategy 'tokenExpiry.code' must be a number in seconds. Found ${typeof(tokenExpiry.code)} instead.`)

			tokenExpiry.id_token = tokenExpiry.id_token*1
			tokenExpiry.code = tokenExpiry.code*1

			const { origin } = getInfo(config.baseUrl)

			this.config.iss = origin
			this.config.tokenExpiry.id_token = tokenExpiry.id_token
			this.config.tokenExpiry.code = tokenExpiry.code
		}

		// Adds all the non-standard keys back to the config
		for(let key in config) {
			if (CONFIG_KEYS.indexOf(key) < 0)
				this.config[key] = config[key]
		}
	}
}

const verifyStrategy = strategy => {
	if (!strategy)
		throw new Error('strategy is not defined')
	const t = typeof(strategy)
	if (t != 'object')
		throw new Error(`strategy is expected to be an object, found ${t} instead`)
	if (!(strategy instanceof Strategy)) 
		throw new Error('strategy is not an instance of Strategy. strategy must inherit from a Strategy created from rhe userin-core package.')
	if (!strategy.name)
		throw new Error('strategy is missing its required \'name\' property')
	
	const modes = getSupportedModes(strategy.modes)
	const events = []
	if (isLoginSignupModeOn(modes))
		events.push(...LOGIN_SIGNUP_EVENTS)
	if (isLoginSignupFipModeOn(modes))
		events.push(...LOGIN_SIGNUP_FIP_EVENTS)
	if (isOpenIdModeOn(modes))
		events.push(...OPENID_REQUIRED_EVENTS)

	const requiredEvents = Array.from(new Set(events))

	requiredEvents.forEach(eventName => {
		const associatedModes = []
		if (LOGIN_SIGNUP_EVENTS.some(e => e == eventName))
			associatedModes.push(LOGIN_SIGNUP_MODE)
		if (LOGIN_SIGNUP_FIP_EVENTS.some(e => e == eventName))
			associatedModes.push(LOGIN_SIGNUP_FIP_MODE)
		if (OPENID_EVENTS.some(e => e == eventName))
			associatedModes.push(OPENID_MODE)

		if (!strategy[eventName])
			throw new Error(`When 'modes' contains ${associatedModes.join(', ')} the strategy must implement the '${eventName}' event handler. This event handler is currently not implemented.`)
		const tf = typeof(strategy[eventName])
		if (tf != 'function')
			throw new Error(`strategy's '${eventName}' event handler is not a function. Found ${tf} instead.`)
	})
}

module.exports = {
	Strategy, 
	verifyStrategy,
	getSupportedModes,
	isLoginSignupModeOn,
	isOpenIdModeOn,
	getEvents: () => SUPPORTED_EVENTS,
	getOpenIdEvents: (options={}) => options.required ? OPENID_REQUIRED_EVENTS : options.optional ? OPENID_OPTIONAL_EVENTS : OPENID_EVENTS,
	getLoginSignupEvents: () => LOGIN_SIGNUP_EVENTS,
	getLoginSignupFIPEvents: () => LOGIN_SIGNUP_FIP_EVENTS
}


