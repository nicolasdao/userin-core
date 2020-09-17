
const OPENID_MODE = 'openid'
const LOGIN_SIGNUP_MODE = 'loginsignup'
const SUPPORTED_MODES = [OPENID_MODE, LOGIN_SIGNUP_MODE]

const OIDC_EVENTS = [
	'generate_token', 
	'get_end_user', 
	'get_fip_user', 
	'get_identity_claims', 
	'get_client',
	'get_token_claims',
	'get_config'
]

const LOGIN_SIGNUP_EVENTS = [
	'create_end_user',
	'generate_token',
	'get_end_user'
]

const SUPPORTED_EVENTS = Array.from(new Set([...OIDC_EVENTS, ...LOGIN_SIGNUP_EVENTS]))

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
	constructor() {

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
			isLoginSignupModeOn(modes) ? LOGIN_SIGNUP_EVENTS : OIDC_EVENTS

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
	OIDC_EVENTS,
	getSupportedModes,
	isLoginSignupModeOn,
	isOpenIdModeOn
}


