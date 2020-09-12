const { error: { catchErrors } } = require('puffy')
const { InvalidScopeError, UnauthorizedClientError, InvalidClaimError, InvalidTokenError, InternalServerError, InvalidClientError } = require('./error')

const thingToThings = thing => (thing ? decodeURIComponent(thing).split(' ') : []).reduce((acc,s) => {
	if (s)
		acc.push(...s.split('+'))
	return acc
}, [])

const thingsToThing = things => (things || []).filter(x => x).join(' ')

const parseToOIDCClaims = ({ iss, client_id, user_id, audiences, scopes, extra={} }) => {
	return {
		iss,
		sub: user_id||null,
		aud: thingsToThing(audiences),
		client_id,
		scope: thingsToThing(scopes),
		...extra
	}
}

const verifyScopes = ({ scopes=[], serviceAccountScopes=[] }) => catchErrors(() => {
	const scopesWithoutOpenId = scopes.filter(s => s != 'openid')
	if (scopesWithoutOpenId.length) {
		const invalidScopes = scopesWithoutOpenId.filter(s => serviceAccountScopes.indexOf(s) < 0)
		const l = invalidScopes.length
		if (l)
			throw new InvalidScopeError(`Access to scope${l > 1 ? 's' : ''} ${invalidScopes.join(', ')} is not allowed.`)
	}
})

const verifyAudiences = ({ audiences=[], serviceAccountAudiences=[] }) => catchErrors(() => {
	if (audiences.length) {
		const invalidAudiences = audiences.filter(s => serviceAccountAudiences.indexOf(s) < 0)
		const l = invalidAudiences.length
		if (l)
			throw new UnauthorizedClientError(`Access to audience${l > 1 ? 's' : ''} ${invalidAudiences.join(', ')} is not allowed.`)
	}
})

const areClaimsExpired = claims => catchErrors(() => {
	if (!claims || !claims.exp || isNaN(claims.exp*1))
		throw new InvalidClaimError('Claim is missing required \'exp\' field')

	const exp = claims.exp*1000
	if (Date.now() > exp)
		throw new InvalidTokenError('Token or code has expired')
})

const verifyClientIds = ({ client_id, user_id, user_client_ids=[] }) => catchErrors(() => {
	if (!user_client_ids.length)
		throw new InternalServerError(`Corrupted data. Failed to associate client_ids with user_id ${user_id}.`)
	
	if (!user_client_ids.some(id => id == client_id))
		throw new InvalidClientError('Invalid client_id')
})

module.exports = {
	convert: {
		thingToThings,
		thingsToThing,
		toOIDCClaims: parseToOIDCClaims
	},
	verify: {
		scopes: verifyScopes,
		audiences: verifyAudiences,
		claimsExpired: areClaimsExpired,
		clientId: verifyClientIds
	}
}