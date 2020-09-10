const { config:{ prefixPathname } } = require('../_utils')

const ENDPOINT = 'authorization' 

module.exports = (app, eventHandlerStore, config) => {
	const endpoint = prefixPathname(config, ENDPOINT)

	app.get(endpoint, (req, res) => res.status(200).send('Authorization endpoint coming soon...'))

	return [endpoint]
}