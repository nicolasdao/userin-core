/**
 * Copyright (c) 2020, Cloudless Consulting Pty Ltd.
 * All rights reserved.
 * 
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
*/

// To skip a test, either use 'xit' instead of 'it', or 'describe.skip' instead of 'describe'

const { assert } = require('chai')
const { Strategy, verifyStrategy } = require('../src')

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
				assert.equal(err.message, 'The UserIn strategy \'tokenExpiry.access_token\' number is required', '02')
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
				assert.equal(err.message, 'The UserIn strategy \'tokenExpiry.access_token\' number is required', '02')
			}
		})
		it('05 - Should fail if the \'tokenExpiry.access_token\' is not a number.', () => {
			try {
				const config = {
					tokenExpiry:{
						access_token: 'dewd'
					}
				}
				const strategy = new Strategy(config) || 1
				assert.isNotOk(strategy, '01')
			} catch(err) {
				assert.equal(err.message, 'The UserIn strategy \'tokenExpiry.access_token\' must be a number in seconds. Found string instead.', '02')
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
				assert.equal(err.message, 'When modes contains \'openid\', the UserIn strategy \'tokenExpiry.id_token\' number is required', '02')
			}
		})
		it('09 - Should fail if the mode contains \'openid\' and the config is missing the \'openid.tokenExpiry.id_token\' number.', () => {
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
				assert.equal(err.message, 'When modes contains \'openid\', the UserIn strategy \'tokenExpiry.id_token\' number is required', '02')
			}
		})
		it('10 - Should fail if the mode contains \'openid\' and the config is missing the \'openid.tokenExpiry.code\' number.', () => {
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
				assert.equal(err.message, 'When modes contains \'openid\', the UserIn strategy \'tokenExpiry.code\' number is required', '02')
			}
		})
		it('11 - Should fail if the \'tokenExpiry.refresh_token\' is not a number.', () => {
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
				assert.equal(err.message, 'The UserIn strategy \'tokenExpiry.refresh_token\' must be a number in seconds. Found string instead.', '02')
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
		it('16 - Should support setting all the tokenExpiry in \'config.tokenExpiry\'.', () => {
			const config = {
				modes:['loginsignup', 'openid'],
				tokenExpiry:{
					access_token: 3600,
					refresh_token: 1000000,
					id_token:1200,
					code:30
				},
				openid: {
					iss:'https://userin.com'
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
		it('17 - Should support setting all the tokenExpiry in \'config.openid.tokenExpiry\'.', () => {
			const config = {
				modes:['loginsignup', 'openid'],
				openid: {
					iss:'https://userin.com',
					tokenExpiry:{
						access_token: 3600,
						refresh_token: 1000000,
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
		it('18 - Should fail if the mode contains \'loginsignupfip\' and the config is missing the \'tokenExpiry.code\' number.', () => {
			try {
				const config = {
					modes: ['loginsignupfip'],
					tokenExpiry:{
						access_token: 3600
					}
				}
				const strategy = new Strategy(config) || 1
				assert.isNotOk(strategy, '01')
			} catch(err) {
				assert.equal(err.message, 'When modes contains \'loginsignupfip\', the UserIn strategy \'tokenExpiry.code\' number is required', '02')
			}
		})
		it('19 - Should succeed if the mode contains \'loginsignupfip\' and both the \'tokenExpiry.code\' and the \'tokenExpiry.access_token\' number.', () => {
			const config = {
				modes: ['loginsignupfip'],
				tokenExpiry:{
					access_token: 3600,
					code:30
				}
			}
			const strategy = new Strategy(config)

			assert.isOk(strategy, '01')
			assert.isOk(strategy.modes, '02')
			assert.isOk(strategy.config, '03')
			assert.equal(strategy.modes.join(''), 'loginsignupfip','04')
			assert.equal(strategy.config.tokenExpiry.access_token, 3600,'05')
			assert.equal(strategy.config.tokenExpiry.refresh_token, null,'06')
			assert.equal(strategy.config.tokenExpiry.code, 30,'07')
		})
	})
})

describe('verifyStrategy', () => {
	describe('Strategy - loginsignup mode', () => {
		const config = {
			modes:['loginsignup'],
			tokenExpiry: {
				access_token: 3600
			}
		}
		it('01 - Should fail in loginsignup mode when the no handlers have been defined', done => {
			class DummyStrategy extends Strategy {
				constructor(config) {
					super(config)
					this.name = 'dummy'
				}
			}
			const strategy = new DummyStrategy(config)
			try {
				verifyStrategy(strategy)
				done(new Error('Should have failed'))
			} catch (err) {
				try {
					assert.isOk(/must implement the (.*?) event handler/.test(err.message), '01')
					done()
				} catch(e){
					done(e)
				}
			}
		})
		it('02 - Should fail in loginsignup mode when all handlers are defined except \'create_end_user\'', done => {
			class DummyStrategy extends Strategy {
				constructor(config) {
					super(config)
					this.name = 'dummy'
				}
			}
			const strategy = new DummyStrategy(config)
			// strategy.create_end_user = () => null
			strategy.generate_token = () => null
			strategy.get_end_user = () => null
			try {
				verifyStrategy(strategy)
				done(new Error('Should have failed'))
			} catch (err) {
				try {
					assert.isOk(err.message.indexOf('must implement the \'create_end_user\' event handler') >= 0, '01')
					done()
				} catch(e){
					done(e)
				}
			}
		})
		it('03 - Should fail in loginsignup mode when all handlers are defined except \'generate_access_token\'', done => {
			class DummyStrategy extends Strategy {
				constructor(config) {
					super(config)
					this.name = 'dummy'
				}
			}
			const strategy = new DummyStrategy(config)
			strategy.create_end_user = () => null
			// strategy.generate_access_token = () => null
			strategy.get_end_user = () => null
			strategy.generate_refresh_token = () => null
			strategy.get_refresh_token_claims = () => null
			try {
				verifyStrategy(strategy)
				done(new Error('Should have failed'))
			} catch (err) {
				try {
					assert.isOk(err.message.indexOf('must implement the \'generate_access_token\' event handler') >= 0, '01')
					done()
				} catch(e){
					done(e)
				}
			}
		})
		it('04 - Should fail in loginsignup mode when all handlers are defined except \'get_end_user\'', done => {
			class DummyStrategy extends Strategy {
				constructor(config) {
					super(config)
					this.name = 'dummy'
				}
			}
			const strategy = new DummyStrategy(config)
			strategy.create_end_user = () => null
			strategy.generate_access_token = () => null
			// strategy.get_end_user = () => null
			strategy.generate_refresh_token = () => null
			strategy.get_refresh_token_claims = () => null
			try {
				verifyStrategy(strategy)
				done(new Error('Should have failed'))
			} catch (err) {
				try {
					assert.isOk(err.message.indexOf('must implement the \'get_end_user\' event handler') >= 0, '01')
					done()
				} catch(e){
					done(e)
				}
			}
		})
		it('05 - Should fail in loginsignup mode when all handlers are defined except \'generate_refresh_token\'', done => {
			class DummyStrategy extends Strategy {
				constructor(config) {
					super(config)
					this.name = 'dummy'
				}
			}
			const strategy = new DummyStrategy(config)
			strategy.create_end_user = () => null
			strategy.generate_access_token = () => null
			strategy.get_end_user = () => null
			// strategy.generate_refresh_token = () => null
			strategy.get_refresh_token_claims = () => null
			try {
				verifyStrategy(strategy)
				done(new Error('Should have failed'))
			} catch (err) {
				try {
					assert.isOk(err.message.indexOf('must implement the \'generate_refresh_token\' event handler') >= 0, '01')
					done()
				} catch(e){
					done(e)
				}
			}
		})
		it('06 - Should fail in loginsignup mode when all handlers are defined except \'get_refresh_token_claims\'', done => {
			class DummyStrategy extends Strategy {
				constructor(config) {
					super(config)
					this.name = 'dummy'
				}
			}
			const strategy = new DummyStrategy(config)
			strategy.create_end_user = () => null
			strategy.generate_access_token = () => null
			strategy.get_end_user = () => null
			strategy.generate_refresh_token = () => null
			// strategy.get_refresh_token_claims = () => null
			try {
				verifyStrategy(strategy)
				done(new Error('Should have failed'))
			} catch (err) {
				try {
					assert.isOk(err.message.indexOf('must implement the \'get_refresh_token_claims\' event handler') >= 0, '01')
					done()
				} catch(e){
					done(e)
				}
			}
		})
		it('07 - Should succeed in loginsignup mode when all handlers are defined', done => {
			class DummyStrategy extends Strategy {
				constructor(config) {
					super(config)
					this.name = 'dummy'
				}
			}
			const strategy = new DummyStrategy(config)
			strategy.create_end_user = () => null
			strategy.generate_access_token = () => null
			strategy.get_end_user = () => null
			strategy.generate_refresh_token = () => null
			strategy.get_refresh_token_claims = () => null
			try {
				verifyStrategy(strategy)
				done()
			} catch (err) {
				done(err)
			}
		})
	})

	describe('Strategy - loginsignupfip mode', () => {
		const config = {
			modes:['loginsignupfip'],
			tokenExpiry: {
				access_token: 3600,
				code: 30
			}
		}
		it('01 - Should fail in loginsignupfip mode when the no handlers have been defined', done => {
			class DummyStrategy extends Strategy {
				constructor(config) {
					super(config)
					this.name = 'dummy'
				}
			}
			const strategy = new DummyStrategy(config)
			try {
				verifyStrategy(strategy)
				done(new Error('Should have failed'))
			} catch (err) {
				try {
					assert.isOk(/must implement the (.*?)event handler/.test(err.message), '01')
					done()
				} catch(e){
					done(e)
				}
			}
		})
		it('02 - Should fail in loginsignupfip mode when all handlers are defined except \'create_end_user\'', done => {
			class DummyStrategy extends Strategy {
				constructor(config) {
					super(config)
					this.name = 'dummy'
				}
			}
			const strategy = new DummyStrategy(config)
			// strategy.create_end_user = () => null
			strategy.generate_access_token = () => null
			strategy.get_end_user = () => null
			strategy.generate_refresh_token = () => null
			strategy.get_refresh_token_claims = () => null
			strategy.get_fip_user = () => null
			strategy.generate_authorization_code = () => null
			strategy.get_authorization_code_claims = () => null
			try {
				verifyStrategy(strategy)
				done(new Error('Should have failed'))
			} catch (err) {
				try {
					assert.isOk(err.message.indexOf('must implement the \'create_end_user\' event handler') >= 0, '01')
					done()
				} catch(e){
					done(e)
				}
			}
		})
		it('03 - Should fail in loginsignupfip mode when all handlers are defined except \'generate_access_token\'', done => {
			class DummyStrategy extends Strategy {
				constructor(config) {
					super(config)
					this.name = 'dummy'
				}
			}
			const strategy = new DummyStrategy(config)
			strategy.create_end_user = () => null
			// strategy.generate_access_token = () => null
			strategy.get_end_user = () => null
			strategy.generate_refresh_token = () => null
			strategy.get_refresh_token_claims = () => null
			strategy.get_fip_user = () => null
			strategy.generate_authorization_code = () => null
			strategy.get_authorization_code_claims = () => null
			try {
				verifyStrategy(strategy)
				done(new Error('Should have failed'))
			} catch (err) {
				try {
					assert.isOk(err.message.indexOf('must implement the \'generate_access_token\' event handler') >= 0, '01')
					done()
				} catch(e){
					done(e)
				}
			}
		})
		it('04 - Should fail in loginsignupfip mode when all handlers are defined except \'get_end_user\'', done => {
			class DummyStrategy extends Strategy {
				constructor(config) {
					super(config)
					this.name = 'dummy'
				}
			}
			const strategy = new DummyStrategy(config)
			strategy.create_end_user = () => null
			strategy.generate_access_token = () => null
			// strategy.get_end_user = () => null
			strategy.generate_refresh_token = () => null
			strategy.get_refresh_token_claims = () => null
			strategy.get_fip_user = () => null
			strategy.generate_authorization_code = () => null
			strategy.get_authorization_code_claims = () => null
			try {
				verifyStrategy(strategy)
				done(new Error('Should have failed'))
			} catch (err) {
				try {
					assert.isOk(err.message.indexOf('must implement the \'get_end_user\' event handler') >= 0, '01')
					done()
				} catch(e){
					done(e)
				}
			}
		})
		it('05 - Should fail in loginsignupfip mode when all handlers are defined except \'get_fip_user\'', done => {
			class DummyStrategy extends Strategy {
				constructor(config) {
					super(config)
					this.name = 'dummy'
				}
			}
			const strategy = new DummyStrategy(config)
			strategy.create_end_user = () => null
			strategy.generate_access_token = () => null
			strategy.get_end_user = () => null
			strategy.generate_refresh_token = () => null
			strategy.get_refresh_token_claims = () => null
			// strategy.get_fip_user = () => null
			strategy.generate_authorization_code = () => null
			strategy.get_authorization_code_claims = () => null
			try {
				verifyStrategy(strategy)
				done(new Error('Should have failed'))
			} catch (err) {
				try {
					assert.isOk(err.message.indexOf('must implement the \'get_fip_user\' event handler') >= 0, '01')
					done()
				} catch(e){
					done(e)
				}
			}
		})
		it('06 - Should fail in loginsignupfip mode when all handlers are defined except \'generate_refresh_token\'', done => {
			class DummyStrategy extends Strategy {
				constructor(config) {
					super(config)
					this.name = 'dummy'
				}
			}
			const strategy = new DummyStrategy(config)
			strategy.create_end_user = () => null
			strategy.generate_access_token = () => null
			strategy.get_fip_user = () => null
			strategy.get_end_user = () => null
			// strategy.generate_refresh_token = () => null
			strategy.get_refresh_token_claims = () => null
			strategy.generate_authorization_code = () => null
			strategy.get_authorization_code_claims = () => null
			try {
				verifyStrategy(strategy)
				done(new Error('Should have failed'))
			} catch (err) {
				try {
					assert.isOk(err.message.indexOf('must implement the \'generate_refresh_token\' event handler') >= 0, '01')
					done()
				} catch(e){
					done(e)
				}
			}
		})
		it('07 - Should fail in loginsignupfip mode when all handlers are defined except \'get_refresh_token_claims\'', done => {
			class DummyStrategy extends Strategy {
				constructor(config) {
					super(config)
					this.name = 'dummy'
				}
			}
			const strategy = new DummyStrategy(config)
			strategy.create_end_user = () => null
			strategy.generate_access_token = () => null
			strategy.get_fip_user = () => null
			strategy.get_end_user = () => null
			strategy.generate_refresh_token = () => null
			// strategy.get_refresh_token_claims = () => null
			strategy.generate_authorization_code = () => null
			strategy.get_authorization_code_claims = () => null
			try {
				verifyStrategy(strategy)
				done(new Error('Should have failed'))
			} catch (err) {
				try {
					assert.isOk(err.message.indexOf('must implement the \'get_refresh_token_claims\' event handler') >= 0, '01')
					done()
				} catch(e){
					done(e)
				}
			}
		})
		it('08 - Should fail in loginsignupfip mode when all handlers are defined except \'generate_authorization_code\'', done => {
			class DummyStrategy extends Strategy {
				constructor(config) {
					super(config)
					this.name = 'dummy'
				}
			}
			const strategy = new DummyStrategy(config)
			strategy.create_end_user = () => null
			strategy.generate_access_token = () => null
			strategy.get_fip_user = () => null
			strategy.get_end_user = () => null
			strategy.generate_refresh_token = () => null
			strategy.get_refresh_token_claims = () => null
			// strategy.generate_authorization_code = () => null
			strategy.get_authorization_code_claims = () => null
			try {
				verifyStrategy(strategy)
				done(new Error('Should have failed'))
			} catch (err) {
				try {
					assert.isOk(err.message.indexOf('must implement the \'generate_authorization_code\' event handler') >= 0, '01')
					done()
				} catch(e){
					done(e)
				}
			}
		})
		it('09 - Should fail in loginsignupfip mode when all handlers are defined except \'get_authorization_code_claims\'', done => {
			class DummyStrategy extends Strategy {
				constructor(config) {
					super(config)
					this.name = 'dummy'
				}
			}
			const strategy = new DummyStrategy(config)
			strategy.create_end_user = () => null
			strategy.generate_access_token = () => null
			strategy.get_fip_user = () => null
			strategy.get_end_user = () => null
			strategy.generate_refresh_token = () => null
			strategy.get_refresh_token_claims = () => null
			strategy.generate_authorization_code = () => null
			// strategy.get_authorization_code_claims = () => null
			try {
				verifyStrategy(strategy)
				done(new Error('Should have failed'))
			} catch (err) {
				try {
					assert.isOk(err.message.indexOf('must implement the \'get_authorization_code_claims\' event handler') >= 0, '01')
					done()
				} catch(e){
					done(e)
				}
			}
		})
		it('13 - Should succeed in loginsignupfip mode when all handlers are defined', done => {
			class DummyStrategy extends Strategy {
				constructor(config) {
					super(config)
					this.name = 'dummy'
				}
			}
			const strategy = new DummyStrategy(config)
			strategy.create_end_user = () => null
			strategy.generate_access_token = () => null
			strategy.get_fip_user = () => null
			strategy.get_end_user = () => null
			strategy.generate_refresh_token = () => null
			strategy.get_refresh_token_claims = () => null
			strategy.generate_authorization_code = () => null
			strategy.get_authorization_code_claims = () => null
			try {
				verifyStrategy(strategy)
				done()
			} catch (err) {
				done(err)
			}
		})
	})

	describe('Strategy - openid mode', () => {
		const config = {
			modes:['openid'],
			openid: {
				iss: 'https://www.userin.com',
				tokenExpiry: {
					id_token: 3600,
					access_token: 3600,
					code: 30
				}
			}
		}
		it('01 - Should fail in openid mode when the no handlers have been defined', done => {
			class DummyStrategy extends Strategy {
				constructor(config) {
					super(config)
					this.name = 'dummy'
				}
			}
			const strategy = new DummyStrategy(config)
			try {
				verifyStrategy(strategy)
				done(new Error('Should have failed'))
			} catch (err) {
				try {
					assert.isOk(/must implement the (.*?)event handler/.test(err.message), '01')
					done()
				} catch(e){
					done(e)
				}
			}
		})
		it('02 - Should fail in openid mode when all handlers are defined except \'generate_access_token\'', done => {
			class DummyStrategy extends Strategy {
				constructor(config) {
					super(config)
					this.name = 'dummy'
				}
			}
				
			const strategy = new DummyStrategy(config)
			// strategy.generate_access_token = () => null
			strategy.get_client = () => null
			strategy.get_end_user = () => null
			strategy.get_identity_claims = () => null
			strategy.generate_authorization_code = () => null
			strategy.generate_id_token = () => null
			strategy.generate_refresh_token = () => null
			strategy.get_access_token_claims = () => null
			strategy.get_authorization_code_claims = () => null
			strategy.get_id_token_claims = () => null
			strategy.get_refresh_token_claims = () => null
			try {
				verifyStrategy(strategy)
				done(new Error('Should have failed'))
			} catch (err) {
				try {
					assert.isOk(err.message.indexOf('must implement the \'generate_access_token\' event handler') >= 0, '01')
					done()
				} catch(e){
					done(e)
				}
			}
		})
		it('03 - Should fail in openid mode when all handlers are defined except \'get_client\'', done => {
			class DummyStrategy extends Strategy {
				constructor(config) {
					super(config)
					this.name = 'dummy'
				}
			}
			const strategy = new DummyStrategy(config)
			strategy.generate_access_token = () => null
			// strategy.get_client = () => null
			strategy.get_end_user = () => null
			strategy.get_identity_claims = () => null
			strategy.generate_authorization_code = () => null
			strategy.generate_id_token = () => null
			strategy.generate_refresh_token = () => null
			strategy.get_access_token_claims = () => null
			strategy.get_authorization_code_claims = () => null
			strategy.get_id_token_claims = () => null
			strategy.get_refresh_token_claims = () => null
			try {
				verifyStrategy(strategy)
				done(new Error('Should have failed'))
			} catch (err) {
				try {
					assert.isOk(err.message.indexOf('must implement the \'get_client\' event handler') >= 0, '01')
					done()
				} catch(e){
					done(e)
				}
			}
		})
		it('04 - Should fail in openid mode when all handlers are defined except \'get_end_user\'', done => {
			class DummyStrategy extends Strategy {
				constructor(config) {
					super(config)
					this.name = 'dummy'
				}
			}
			const strategy = new DummyStrategy(config)
			strategy.generate_access_token = () => null
			strategy.get_client = () => null
			// strategy.get_end_user = () => null
			strategy.get_identity_claims = () => null
			strategy.generate_authorization_code = () => null
			strategy.generate_id_token = () => null
			strategy.generate_refresh_token = () => null
			strategy.get_access_token_claims = () => null
			strategy.get_authorization_code_claims = () => null
			strategy.get_id_token_claims = () => null
			strategy.get_refresh_token_claims = () => null
			try {
				verifyStrategy(strategy)
				done(new Error('Should have failed'))
			} catch (err) {
				try {
					assert.isOk(err.message.indexOf('must implement the \'get_end_user\' event handler') >= 0, '01')
					done()
				} catch(e){
					done(e)
				}
			}
		})
		it('05 - Should fail in openid mode when all handlers are defined except \'get_access_token_claims\'', done => {
			class DummyStrategy extends Strategy {
				constructor(config) {
					super(config)
					this.name = 'dummy'
				}
			}
			const strategy = new DummyStrategy(config)
			strategy.generate_access_token = () => null
			strategy.get_client = () => null
			strategy.get_end_user = () => null
			strategy.get_identity_claims = () => null
			strategy.generate_authorization_code = () => null
			strategy.generate_id_token = () => null
			strategy.generate_refresh_token = () => null
			// strategy.get_access_token_claims = () => null
			strategy.get_authorization_code_claims = () => null
			strategy.get_id_token_claims = () => null
			strategy.get_refresh_token_claims = () => null
			try {
				verifyStrategy(strategy)
				done(new Error('Should have failed'))
			} catch (err) {
				try {
					assert.isOk(err.message.indexOf('must implement the \'get_access_token_claims\' event handler') >= 0, '01')
					done()
				} catch(e){
					done(e)
				}
			}
		})
		it('06 - Should fail in openid mode when all handlers are defined except \'get_identity_claims\'', done => {
			class DummyStrategy extends Strategy {
				constructor(config) {
					super(config)
					this.name = 'dummy'
				}
			}
			const strategy = new DummyStrategy(config)
			strategy.generate_access_token = () => null
			strategy.get_client = () => null
			strategy.get_end_user = () => null
			// strategy.get_identity_claims = () => null
			strategy.generate_authorization_code = () => null
			strategy.generate_id_token = () => null
			strategy.generate_refresh_token = () => null
			strategy.get_access_token_claims = () => null
			strategy.get_authorization_code_claims = () => null
			strategy.get_id_token_claims = () => null
			strategy.get_refresh_token_claims = () => null
			try {
				verifyStrategy(strategy)
				done(new Error('Should have failed'))
			} catch (err) {
				try {
					assert.isOk(err.message.indexOf('must implement the \'get_identity_claims\' event handler') >= 0, '01')
					done()
				} catch(e){
					done(e)
				}
			}
		})
		it('07 - Should fail in openid mode when all handlers are defined except \'generate_authorization_code\'', done => {
			class DummyStrategy extends Strategy {
				constructor(config) {
					super(config)
					this.name = 'dummy'
				}
			}
			const strategy = new DummyStrategy(config)
			strategy.generate_access_token = () => null
			strategy.get_client = () => null
			strategy.get_end_user = () => null
			strategy.get_identity_claims = () => null
			// strategy.generate_authorization_code = () => null
			strategy.generate_id_token = () => null
			strategy.generate_refresh_token = () => null
			strategy.get_access_token_claims = () => null
			strategy.get_authorization_code_claims = () => null
			strategy.get_id_token_claims = () => null
			strategy.get_refresh_token_claims = () => null
			try {
				verifyStrategy(strategy)
				done(new Error('Should have failed'))
			} catch (err) {
				try {
					assert.isOk(err.message.indexOf('must implement the \'generate_authorization_code\' event handler') >= 0, '01')
					done()
				} catch(e){
					done(e)
				}
			}
		})
		it('08 - Should fail in openid mode when all handlers are defined except \'generate_id_token\'', done => {
			class DummyStrategy extends Strategy {
				constructor(config) {
					super(config)
					this.name = 'dummy'
				}
			}
			const strategy = new DummyStrategy(config)
			strategy.generate_access_token = () => null
			strategy.get_client = () => null
			strategy.get_end_user = () => null
			strategy.get_identity_claims = () => null
			strategy.generate_authorization_code = () => null
			// strategy.generate_id_token = () => null
			strategy.generate_refresh_token = () => null
			strategy.get_access_token_claims = () => null
			strategy.get_authorization_code_claims = () => null
			strategy.get_id_token_claims = () => null
			strategy.get_refresh_token_claims = () => null
			try {
				verifyStrategy(strategy)
				done(new Error('Should have failed'))
			} catch (err) {
				try {
					assert.isOk(err.message.indexOf('must implement the \'generate_id_token\' event handler') >= 0, '01')
					done()
				} catch(e){
					done(e)
				}
			}
		})
		it('09 - Should fail in openid mode when all handlers are defined except \'generate_refresh_token\'', done => {
			class DummyStrategy extends Strategy {
				constructor(config) {
					super(config)
					this.name = 'dummy'
				}
			}
			const strategy = new DummyStrategy(config)
			strategy.generate_access_token = () => null
			strategy.get_client = () => null
			strategy.get_end_user = () => null
			strategy.get_identity_claims = () => null
			strategy.generate_authorization_code = () => null
			strategy.generate_id_token = () => null
			// strategy.generate_refresh_token = () => null
			strategy.get_access_token_claims = () => null
			strategy.get_authorization_code_claims = () => null
			strategy.get_id_token_claims = () => null
			strategy.get_refresh_token_claims = () => null
			try {
				verifyStrategy(strategy)
				done(new Error('Should have failed'))
			} catch (err) {
				try {
					assert.isOk(err.message.indexOf('must implement the \'generate_refresh_token\' event handler') >= 0, '01')
					done()
				} catch(e){
					done(e)
				}
			}
		})
		it('10 - Should fail in openid mode when all handlers are defined except \'get_authorization_code_claims\'', done => {
			class DummyStrategy extends Strategy {
				constructor(config) {
					super(config)
					this.name = 'dummy'
				}
			}
			const strategy = new DummyStrategy(config)
			strategy.generate_access_token = () => null
			strategy.get_client = () => null
			strategy.get_end_user = () => null
			strategy.get_identity_claims = () => null
			strategy.generate_authorization_code = () => null
			strategy.generate_id_token = () => null
			strategy.generate_refresh_token = () => null
			strategy.get_access_token_claims = () => null
			// strategy.get_authorization_code_claims = () => null
			strategy.get_id_token_claims = () => null
			strategy.get_refresh_token_claims = () => null
			try {
				verifyStrategy(strategy)
				done(new Error('Should have failed'))
			} catch (err) {
				try {
					assert.isOk(err.message.indexOf('must implement the \'get_authorization_code_claims\' event handler') >= 0, '01')
					done()
				} catch(e){
					done(e)
				}
			}
		})
		it('11 - Should fail in openid mode when all handlers are defined except \'get_id_token_claims\'', done => {
			class DummyStrategy extends Strategy {
				constructor(config) {
					super(config)
					this.name = 'dummy'
				}
			}
			const strategy = new DummyStrategy(config)
			strategy.generate_access_token = () => null
			strategy.get_client = () => null
			strategy.get_end_user = () => null
			strategy.get_identity_claims = () => null
			strategy.generate_authorization_code = () => null
			strategy.generate_id_token = () => null
			strategy.generate_refresh_token = () => null
			strategy.get_access_token_claims = () => null
			strategy.get_authorization_code_claims = () => null
			// strategy.get_id_token_claims = () => null
			strategy.get_refresh_token_claims = () => null
			try {
				verifyStrategy(strategy)
				done(new Error('Should have failed'))
			} catch (err) {
				try {
					assert.isOk(err.message.indexOf('must implement the \'get_id_token_claims\' event handler') >= 0, '01')
					done()
				} catch(e){
					done(e)
				}
			}
		})
		it('12 - Should fail in openid mode when all handlers are defined except \'get_refresh_token_claims\'', done => {
			class DummyStrategy extends Strategy {
				constructor(config) {
					super(config)
					this.name = 'dummy'
				}
			}
			const strategy = new DummyStrategy(config)
			strategy.generate_access_token = () => null
			strategy.get_client = () => null
			strategy.get_end_user = () => null
			strategy.get_identity_claims = () => null
			strategy.generate_authorization_code = () => null
			strategy.generate_id_token = () => null
			strategy.generate_refresh_token = () => null
			strategy.get_access_token_claims = () => null
			strategy.get_authorization_code_claims = () => null
			strategy.get_id_token_claims = () => null
			// strategy.get_refresh_token_claims = () => null
			try {
				verifyStrategy(strategy)
				done(new Error('Should have failed'))
			} catch (err) {
				try {
					assert.isOk(err.message.indexOf('must implement the \'get_refresh_token_claims\' event handler') >= 0, '01')
					done()
				} catch(e){
					done(e)
				}
			}
		})
		it('13 - Should succeed in openid mode when all handlers are defined', done => {
			class DummyStrategy extends Strategy {
				constructor(config) {
					super(config)
					this.name = 'dummy'
				}
			}
			const strategy = new DummyStrategy(config)
			strategy.generate_access_token = () => null
			strategy.get_client = () => null
			strategy.get_end_user = () => null
			strategy.get_identity_claims = () => null
			strategy.generate_authorization_code = () => null
			strategy.generate_id_token = () => null
			strategy.generate_refresh_token = () => null
			strategy.get_access_token_claims = () => null
			strategy.get_authorization_code_claims = () => null
			strategy.get_id_token_claims = () => null
			strategy.get_refresh_token_claims = () => null
			try {
				verifyStrategy(strategy)
				done()
			} catch (err) {
				done(err)
			}
		})
	})
})

