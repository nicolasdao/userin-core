/**
 * Copyright (c) 2020, Cloudless Consulting Pty Ltd.
 * All rights reserved.
 * 
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
*/

// To skip a test, either use 'xit' instead of 'it', or 'describe.skip' instead of 'describe'

const { assert } = require('chai')
const { Strategy } = require('../src')

describe('Strategy', () => {
	describe('#constructor', () => {
		it('01 - Should fail if no config is provided.', () => {
			try {
				const strategy = new Strategy() || 1
				assert.isNotOk(strategy, '01')
			} catch(err) {
				assert.equal(err.message, 'The UserIn strategy \'config\' object is required', '02')
			}
		})
		it('02 - Should fail if the config is not an object.', () => {
			try {
				const strategy = new Strategy('hello') || 1
				assert.isNotOk(strategy, '01')
			} catch(err) {
				assert.equal(err.message, 'The UserIn strategy \'config\' is expected to be an object, found string instead', '02')
			}
		})
		it('03 - Should fail if the config is missing the \'tokenExpiry\' property.', () => {
			try {
				const config = {}
				const strategy = new Strategy(config) || 1
				assert.isNotOk(strategy, '01')
			} catch(err) {
				assert.equal(err.message, 'The UserIn strategy \'config.tokenExpiry\' object is required', '02')
			}
		})
		it('04 - Should fail if the config is missing the \'tokenExpiry.access_token\' property.', () => {
			try {
				const config = {
					tokenExpiry:{}
				}
				const strategy = new Strategy(config) || 1
				assert.isNotOk(strategy, '01')
			} catch(err) {
				assert.equal(err.message, 'The UserIn strategy \'config.tokenExpiry.access_token\' number is required', '02')
			}
		})
		it('05 - Should fail if the \'config.tokenExpiry.access_token\' is not a number.', () => {
			try {
				const config = {
					tokenExpiry:{
						access_token: 'dewd'
					}
				}
				const strategy = new Strategy(config) || 1
				assert.isNotOk(strategy, '01')
			} catch(err) {
				assert.equal(err.message, 'The UserIn strategy \'config.tokenExpiry.access_token\' must be a number in seconds. Found string instead.', '02')
			}
		})
		it('06 - Should fail if the mode contains \'openid\' and the config is missing the \'openid\' object.', () => {
			try {
				const config = {
					modes: ['openid'],
					tokenExpiry:{
						access_token: 3600
					}
				}
				const strategy = new Strategy(config) || 1
				assert.isNotOk(strategy, '01')
			} catch(err) {
				assert.equal(err.message, 'When modes contains \'openid\', the UserIn strategy \'config.openid\' object is required', '02')
			}
		})
		it('07 - Should fail if the mode contains \'openid\' and the config is missing the \'openid.iss\' string.', () => {
			try {
				const config = {
					modes: ['openid'],
					tokenExpiry:{
						access_token: 3600
					},
					openid:{}
				}
				const strategy = new Strategy(config) || 1
				assert.isNotOk(strategy, '01')
			} catch(err) {
				assert.equal(err.message, 'When modes contains \'openid\', the UserIn strategy \'config.openid.iss\' string is required', '02')
			}
		})
		it('08 - Should fail if the mode contains \'openid\' and the config is missing the \'openid.tokenExpiry\' object.', () => {
			try {
				const config = {
					modes: ['openid'],
					tokenExpiry:{
						access_token: 3600
					},
					openid:{
						iss: 'https://userin.com'
					}
				}
				const strategy = new Strategy(config) || 1
				assert.isNotOk(strategy, '01')
			} catch(err) {
				assert.equal(err.message, 'When modes contains \'openid\', the UserIn strategy \'config.openid.tokenExpiry\' object is required', '02')
			}
		})
		it('09 - Should fail if the mode contains \'openid\' and the config is missing the \'openid.tokenExpiry.id_token\' string.', () => {
			try {
				const config = {
					modes: ['openid'],
					tokenExpiry:{
						access_token: 3600
					},
					openid:{
						iss: 'https://userin.com',
						tokenExpiry:{}
					}
				}
				const strategy = new Strategy(config) || 1
				assert.isNotOk(strategy, '01')
			} catch(err) {
				assert.equal(err.message, 'When modes contains \'openid\', the UserIn strategy \'config.openid.tokenExpiry.id_token\' number is required', '02')
			}
		})
		it('10 - Should fail if the mode contains \'openid\' and the config is missing the \'openid.tokenExpiry.code\' string.', () => {
			try {
				const config = {
					modes: ['openid'],
					tokenExpiry:{
						access_token: 3600
					},
					openid:{
						iss: 'https://userin.com',
						tokenExpiry:{
							id_token: 3600
						}
					}
				}
				const strategy = new Strategy(config) || 1
				assert.isNotOk(strategy, '01')
			} catch(err) {
				assert.equal(err.message, 'When modes contains \'openid\', the UserIn strategy \'config.openid.tokenExpiry.code\' number is required', '02')
			}
		})
		it('11 - Should fail if the \'config.tokenExpiry.refresh_token\' is not a number.', () => {
			try {
				const config = {
					tokenExpiry:{
						access_token: 3600,
						refresh_token: 'dewd'
					}
				}
				const strategy = new Strategy(config) || 1
				assert.isNotOk(strategy, '01')
			} catch(err) {
				assert.equal(err.message, 'The UserIn strategy \'config.tokenExpiry.refresh_token\' must be a number in seconds. Found string instead.', '02')
			}
		})
		it('12 - Should create a new UserIn strategy when the tokenExpiry object is valid and no mode is defined.', () => {
			const config = {
				tokenExpiry:{
					access_token: 3600
				}
			}
			const strategy = new Strategy(config)
			assert.isOk(strategy, '01')
			assert.isOk(strategy.modes, '02')
			assert.isOk(strategy.config, '03')
			assert.equal(strategy.modes.join(''), 'loginsignup','04')
			assert.equal(strategy.config.tokenExpiry.access_token, 3600,'05')
			assert.equal(strategy.config.tokenExpiry.refresh_token, null,'06')
		})
		it('13 - Should create a new UserIn strategy when the tokenExpiry object is valid and the mode contains \'loginsignup\'.', () => {
			const config = {
				modes:['loginsignup'],
				tokenExpiry:{
					access_token: 3600
				}
			}
			const strategy = new Strategy(config)
			assert.isOk(strategy, '01')
			assert.isOk(strategy.modes, '02')
			assert.isOk(strategy.config, '03')
			assert.equal(strategy.modes.join(''), 'loginsignup','04')
			assert.equal(strategy.config.tokenExpiry.access_token, 3600,'05')
			assert.equal(strategy.config.tokenExpiry.refresh_token, null,'06')
		})
		it('14 - Should create a new UserIn strategy when both the tokenExpiry and the openid object are valid and the mode contains \'loginsignup\' and \'openid\'.', () => {
			const config = {
				modes:['loginsignup', 'openid'],
				tokenExpiry:{
					access_token: 3600
				},
				openid: {
					iss:'https://userin.com',
					tokenExpiry: {
						id_token:1200,
						code:30
					}
				}
			}
			const strategy = new Strategy(config)
			assert.isOk(strategy, '01')
			assert.isOk(strategy.modes, '02')
			assert.isOk(strategy.config, '03')
			assert.equal(strategy.modes.join(''), 'loginsignupopenid','04')
			assert.equal(strategy.config.tokenExpiry.access_token, 3600,'05')
			assert.equal(strategy.config.tokenExpiry.refresh_token, null,'06')
			assert.equal(strategy.config.tokenExpiry.id_token, 1200,'07')
			assert.equal(strategy.config.tokenExpiry.code, 30,'08')
			assert.equal(strategy.config.iss, 'https://userin.com','09')
		})
		it('15 - Should create a new UserIn strategy with a refresh_token config when both the tokenExpiry and the openid object are valid and the mode contains \'loginsignup\' and \'openid\'.', () => {
			const config = {
				modes:['loginsignup', 'openid'],
				tokenExpiry:{
					access_token: 3600,
					refresh_token: 1000000
				},
				openid: {
					iss:'https://userin.com',
					tokenExpiry: {
						id_token:1200,
						code:30
					}
				}
			}
			const strategy = new Strategy(config)
			assert.isOk(strategy, '01')
			assert.isOk(strategy.modes, '02')
			assert.isOk(strategy.config, '03')
			assert.equal(strategy.modes.join(''), 'loginsignupopenid','04')
			assert.equal(strategy.config.tokenExpiry.access_token, 3600,'05')
			assert.equal(strategy.config.tokenExpiry.refresh_token, 1000000,'06')
			assert.equal(strategy.config.tokenExpiry.id_token, 1200,'07')
			assert.equal(strategy.config.tokenExpiry.code, 30,'08')
			assert.equal(strategy.config.iss, 'https://userin.com','09')
		})
	})
})



