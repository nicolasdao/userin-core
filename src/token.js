

const getOIDCdates = (expiryTimeInSeconds=3600) => {
	const creation = Math.floor(Date.now()/1000)
	return {
		iat: creation,
		exp: creation + expiryTimeInSeconds
	}
}

const addDateClaims = (claims={}, expiryTimeInSeconds) => {
	const dates = getOIDCdates(expiryTimeInSeconds)
	return { ...claims, ...dates }
}

module.exports = {
	id_token: {
		addDateClaims
	}
}