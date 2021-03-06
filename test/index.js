/**
 * Copyright (c) 2020, Cloudless Consulting Pty Ltd.
 * All rights reserved.
 * 
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
*/

// To skip a test, either use 'xit' instead of 'it', or 'describe.skip' instead of 'describe'

const { assert } = require('chai')
const { Strategy, verifyStrategy, getLoginSignupFIPEvents, getOpenIdEvents, getLoginSignupEvents } = require('../src')

const iss = 'https://account.userin.com'
const baseUrl = `${iss}/oauth2`
const consentPage = 'https://userin.com/third-party/consent-page'

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
		it('03 - Should fail if the config is missing the \'baseUrl\' property.', () => {
			try {
				const config = {}
				const strategy = new Strategy(config) || 1
				assert.isNotOk(strategy, '01')
			} catch(err) {
				assert.equal(err.message, 'The UserIn strategy \'config.baseUrl\' is required.', '02')
			}
		})
		it('04 - Should fail if the config is missing the \'baseUrl\' property.', () => {
			try {
				const config = { baseUrl:'hello' }
				const strategy = new Strategy(config) || 1
				assert.isNotOk(strategy, '01')
			} catch(err) {
				assert.equal(err.message, 'The UserIn strategy \'config.baseUrl\' hello is not a valid url.', '02')
			}
		})
		it('05 - Should fail if the config is missing the \'tokenExpiry\' property.', () => {
			try {
				const config = { baseUrl }
				const strategy = new Strategy(config) || 1
				assert.isNotOk(strategy, '01')
			} catch(err) {
				assert.equal(err.message, 'The UserIn strategy \'tokenExpiry.access_token\' number is required', '02')
			}
		})
		it('06 - Should fail if the config is missing the \'tokenExpiry.access_token\' property.', () => {
			try {
				const config = {
					baseUrl,
					tokenExpiry:{}
				}
				const strategy = new Strategy(config) || 1
				assert.isNotOk(strategy, '01')
			} catch(err) {
				assert.equal(err.message, 'The UserIn strategy \'tokenExpiry.access_token\' number is required', '02')
			}
		})
		it('07 - Should fail if the \'tokenExpiry.access_token\' is not a number.', () => {
			try {
				const config = {
					baseUrl,
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
		it('08 - Should fail if the mode contains \'openid\' and the config is missing the \'openid\' object.', () => {
			try {
				const config = {
					baseUrl,
					consentPage,
					modes: ['openid'],
					tokenExpiry:{
						access_token: 3600
					}
				}
				const strategy = new Strategy(config) || 1
				assert.isNotOk(strategy, '01')
			} catch(err) {
				assert.equal(err.message, 'When modes contains \'loginsignupfip\' or \'openid\', the UserIn strategy \'tokenExpiry.code\' number is required', '02')
			}
		})
		it('09 - Should fail if the mode contains \'openid\' and the config is missing the \'openid.tokenExpiry\' object.', () => {
			try {
				const config = {
					baseUrl,
					consentPage,
					modes: ['openid'],
					tokenExpiry:{
						access_token: 3600
					}
				}
				const strategy = new Strategy(config) || 1
				assert.isNotOk(strategy, '01')
			} catch(err) {
				assert.equal(err.message, 'When modes contains \'loginsignupfip\' or \'openid\', the UserIn strategy \'tokenExpiry.code\' number is required', '02')
			}
		})
		it('10 - Should fail if the mode contains \'openid\' and the config is missing the \'openid.tokenExpiry.id_token\' number.', () => {
			try {
				const config = {
					baseUrl,
					consentPage,
					modes: ['openid'],
					tokenExpiry:{
						access_token: 3600
					}
				}
				const strategy = new Strategy(config) || 1
				assert.isNotOk(strategy, '01')
			} catch(err) {
				assert.equal(err.message, 'When modes contains \'loginsignupfip\' or \'openid\', the UserIn strategy \'tokenExpiry.code\' number is required', '02')
			}
		})
		it('11 - Should fail if the mode contains \'openid\' and the config is missing the \'openid.tokenExpiry.code\' number.', () => {
			try {
				const config = {
					baseUrl,
					consentPage,
					modes: ['openid'],
					tokenExpiry:{
						access_token: 3600,
						id_token: 3600
					}
				}
				const strategy = new Strategy(config) || 1
				assert.isNotOk(strategy, '01')
			} catch(err) {
				assert.equal(err.message, 'When modes contains \'loginsignupfip\' or \'openid\', the UserIn strategy \'tokenExpiry.code\' number is required', '02')
			}
		})
		it('12 - Should fail if the \'tokenExpiry.refresh_token\' is not a number.', () => {
			try {
				const config = {
					baseUrl,
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
		it('13 - Should create a new UserIn strategy when the tokenExpiry object is valid and no mode is defined.', () => {
			const config = {
				baseUrl,
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
		it('14 - Should create a new UserIn strategy when the tokenExpiry object is valid and the mode contains \'loginsignup\'.', () => {
			const config = {
				baseUrl,
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
		it('15 - Should create a new UserIn strategy when both the tokenExpiry and the openid object are valid and the mode contains \'loginsignup\' and \'openid\'.', () => {
			const config = {
				baseUrl,
				consentPage,
				modes:['loginsignup', 'openid'],
				tokenExpiry:{
					access_token: 3600,
					id_token:1200,
					code:30
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
			assert.equal(strategy.config.iss, iss,'09')
		})
		it('16 - Should create a new UserIn strategy with a refresh_token config when both the tokenExpiry and the openid object are valid and the mode contains \'loginsignup\' and \'openid\'.', () => {
			const config = {
				baseUrl,
				consentPage,
				modes:['loginsignup', 'openid'],
				tokenExpiry:{
					access_token: 3600,
					refresh_token: 1000000,
					id_token:1200,
					code:30
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
			assert.equal(strategy.config.iss, iss,'09')
		})
		it('17 - Should support setting all the tokenExpiry in \'config.tokenExpiry\'.', () => {
			const config = {
				baseUrl,
				consentPage,
				modes:['loginsignup', 'openid'],
				tokenExpiry:{
					access_token: 3600,
					refresh_token: 1000000,
					id_token:1200,
					code:30
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
			assert.equal(strategy.config.iss, iss,'09')
		})
		it('19 - Should fail if the mode contains \'loginsignupfip\' and the config is missing the \'tokenExpiry.code\' number.', () => {
			try {
				const config = {
					baseUrl,
					modes: ['loginsignupfip'],
					tokenExpiry:{
						access_token: 3600
					}
				}
				const strategy = new Strategy(config) || 1
				assert.isNotOk(strategy, '01')
			} catch(err) {
				assert.equal(err.message, 'When modes contains \'loginsignupfip\' or \'openid\', the UserIn strategy \'tokenExpiry.code\' number is required', '02')
			}
		})
		it('20 - Should succeed if the mode contains \'loginsignupfip\' and both the \'tokenExpiry.code\' and the \'tokenExpiry.access_token\' number.', () => {
			const config = {
				baseUrl,
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
		it('21 - Should fail if the config is missing the \'consentPage\' property and the modes contain \'openid\'.', () => {
			try {
				const config = {
					baseUrl,
					modes:['openid'],
					tokenExpiry: {
						access_token:3900,
						id_token:3900,
						code: 30
					}
				}
				const strategy = new Strategy(config) || 1
				assert.isNotOk(strategy, '01')
			} catch(err) {
				assert.equal(err.message, 'When modes contains \'openid\', the UserIn strategy \'config.consentPage\' URL is required', '02')
			}
		})
		it('22 - Should success if the config is missing the \'consentPage\' property and the modes does not contain \'openid\'.', () => {
			try {
				const config = {
					baseUrl,
					modes:['loginsignup'],
					tokenExpiry: {
						access_token:3900,
						id_token:3900,
						code: 30
					}
				}
				const strategy = new Strategy(config) || 1
				assert.isOk(strategy, '01')
			} catch(err) {
				assert.equal(err.message, 'When modes contains \'openid\', the UserIn strategy \'config.consentPage\' URL is required', '02')
			}
		})
	})
})

const OPENID_HANDLERS = getOpenIdEvents({ required:true })
const LOGIN_SIGNUP_HANDLERS = getLoginSignupEvents()
const LOGIN_SIGNUP_FIP_HANDLERS = getLoginSignupFIPEvents()

describe('verifyStrategy', () => {
	describe('Strategy - loginsignup mode', () => {
		const config = {
			baseUrl,
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

		let i = 2
		for(let eventHandler of LOGIN_SIGNUP_HANDLERS) 
			it(`${i++} - Should fail in loginsignup mode when all handlers are defined except '${eventHandler}'`, done => {
				class DummyStrategy extends Strategy {
					constructor(config) {
						super(config)
						this.name = 'dummy'
					}
				}
				const strategy = new DummyStrategy(config)
				LOGIN_SIGNUP_HANDLERS.forEach(h => {
					if (h != eventHandler)
						strategy[h] = () => null
				})
				try {
					verifyStrategy(strategy)
					done(new Error('Should have failed'))
				} catch (err) {
					try {
						assert.isOk(err.message.indexOf(`must implement the '${eventHandler}' event handler`) >= 0, '01')
						done()
					} catch(e){
						done(e)
					}
				}
			})
		
		it(`${i} - Should succeed in loginsignup mode when all handlers are defined`, done => {
			class DummyStrategy extends Strategy {
				constructor(config) {
					super(config)
					this.name = 'dummy'
				}
			}
			const strategy = new DummyStrategy(config)
			LOGIN_SIGNUP_FIP_HANDLERS.forEach(h => {
				strategy[h] = () => null
			})
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
			baseUrl,
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

		let i = 2
		for(let eventHandler of LOGIN_SIGNUP_FIP_HANDLERS)
			it(`${i++} - Should fail in loginsignupfip mode when all handlers are defined except '${eventHandler}'`, done => {
				class DummyStrategy extends Strategy {
					constructor(config) {
						super(config)
						this.name = 'dummy'
					}
				}
				const strategy = new DummyStrategy(config)
				LOGIN_SIGNUP_FIP_HANDLERS.forEach(h => {
					if (h != eventHandler)
						strategy[h] = () => null
				})

				try {
					verifyStrategy(strategy)
					done(new Error('Should have failed'))
				} catch (err) {
					try {
						assert.isOk(err.message.indexOf(`must implement the '${eventHandler}' event handler`) >= 0, '01')
						done()
					} catch(e){
						done(e)
					}
				}
			})

		it(`${i} - Should succeed in loginsignupfip mode when all handlers are defined`, done => {
			class DummyStrategy extends Strategy {
				constructor(config) {
					super(config)
					this.name = 'dummy'
				}
			}
			const strategy = new DummyStrategy(config)
			LOGIN_SIGNUP_FIP_HANDLERS.forEach(h => {
				strategy[h] = () => null
			})
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
			baseUrl,
			consentPage,
			modes:['openid'],
			tokenExpiry: {
				id_token: 3600,
				access_token: 3600,
				code: 30
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

		let i = 2
		for(let eventHandler of OPENID_HANDLERS) 
			it(`${i++} - Should fail in openid mode when all handlers are defined except '${eventHandler}'`, done => {
				class DummyStrategy extends Strategy {
					constructor(config) {
						super(config)
						this.name = 'dummy'
					}
				}
					
				const strategy = new DummyStrategy(config)
				OPENID_HANDLERS.forEach(h => {
					if (h != eventHandler)
						strategy[h] = () => null
				})
				try {
					verifyStrategy(strategy)
					done(new Error('Should have failed'))
				} catch (err) {
					try {
						assert.isOk(err.message.indexOf(`must implement the '${eventHandler}' event handler`) >= 0, '01')
						done()
					} catch(e){
						done(e)
					}
				}
			})

		it(`${i++} - Should succeed in openid mode when all handlers are defined`, done => {
			class DummyStrategy extends Strategy {
				constructor(config) {
					super(config)
					this.name = 'dummy'
				}
			}
			const strategy = new DummyStrategy(config)
			OPENID_HANDLERS.forEach(h => {
				strategy[h] = () => null
			})
			try {
				verifyStrategy(strategy)
				done()
			} catch (err) {
				done(err)
			}
		})
	})
})

