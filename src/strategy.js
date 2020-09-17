
const OPENID_MODE = 'openid'
const LOGIN_SIGNUP_MODE = 'loginsignup'
const SUPPORTED_MODES = [OPENID_MODE, LOGIN_SIGNUP_MODE]

const OPENID_EVENTS = [
	'generate_token', 
	'get_client',
	'get_end_user', 
	'get_fip_user', 
	'get_identity_claims', 
	'get_token_claims'
]

const LOGIN_SIGNUP_EVENTS = [
	'create_end_user',
	'generate_token',
	'get_end_user'
]

const SUPPORTED_EVENTS = Array.from(new Set([...OPENID_EVENTS, ...LOGIN_SIGNUP_EVENTS]))

const getSupportedModes = modes => {
	const defaultModes = ['loginsignup']
	if (!modes || !Array.isArray(modes) || !modes.length)
		return defaultModes

	const supportedModes = modes.map(m => m.toLowerCase().trim()).filter(m => SUPPORTED_MODES.indexOf(m) >= 0)
	return supportedModes.length ? supportedModes : defaultModes
}

const isLoginSignupModeOn = (modes=[]) => modes.some(m => m == LOGIN_SIGNUP_MODE)
const isOpenIdModeOn = (modes=[]) => modes.some(m => m == OPENID_MODE)

class Strategy {
	/**
	 * Creates a new UserIn Strategy instance.
	 * 
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
			tokenExpiry: {
				access_token: tokenExpiry.access_token,
				refresh_token: tokenExpiry.refresh_token || null
			}
		}

		// 2. Determines the modes
		const modes = getSupportedModes(config.modes)
		this.modes = modes

		// 3. Validates the OIDC configs
		if (isOpenIdModeOn(modes)) {
			// 5.A. Validates the config
			if (!config.openid) 
				throw new Error('When modes contains \'openid\', the UserIn strategy \'config.openid\' object is required')
			if (!config.openid.iss) 
				throw new Error('When modes contains \'openid\', the UserIn strategy \'config.openid.iss\' string is required')
			if (!tokenExpiry) 
				throw new Error('When modes contains \'openid\', the UserIn strategy \'tokenExpiry\' object is required')
			if (!tokenExpiry.id_token) 
				throw new Error('When modes contains \'openid\', the UserIn strategy \'tokenExpiry.id_token\' number is required')
			if (!tokenExpiry.code) 
				throw new Error('When modes contains \'openid\', the UserIn strategy \'tokenExpiry.code\' number is required')
			if (isNaN(tokenExpiry.id_token*1)) 
				throw new Error(`The UserIn strategy 'tokenExpiry.id_token' must be a number in seconds. Found ${typeof(tokenExpiry.id_token)} instead.`)
			if (isNaN(tokenExpiry.code*1)) 
				throw new Error(`The UserIn strategy 'tokenExpiry.code' must be a number in seconds. Found ${typeof(tokenExpiry.code)} instead.`)

			tokenExpiry.id_token = tokenExpiry.id_token*1
			tokenExpiry.code = tokenExpiry.code*1

			this.config.iss = config.openid.iss
			this.config.tokenExpiry.id_token = tokenExpiry.id_token
			this.config.tokenExpiry.code = tokenExpiry.code
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
	const requiredEvents = 
		isLoginSignupModeOn(modes) && isOpenIdModeOn(modes) ? SUPPORTED_EVENTS :
			isLoginSignupModeOn(modes) ? LOGIN_SIGNUP_EVENTS : OPENID_EVENTS

	requiredEvents.forEach(eventName => {
		if (!strategy[eventName])
			throw new Error(`strategy is missing its '${eventName}' event handler implementation`)
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
	getOpenIdEvents: () => OPENID_EVENTS,
	getLoginSignupEvents: () => LOGIN_SIGNUP_EVENTS
}


