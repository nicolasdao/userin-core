const express = require('express')

class UserIn extends express.Router {
	constructor() {
		super()
		this.get('/', (req, res) => {
			res.status(200).send('hell')
		})
	}
}

module.exports = UserIn



