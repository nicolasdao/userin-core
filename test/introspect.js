/**
 * Copyright (c) 2020, Cloudless Consulting Pty Ltd.
 * All rights reserved.
 * 
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
*/

// To skip a test, either use 'xit' instead of 'it', or 'describe.skip' instead of 'describe'

const { co } = require('core-async')
const { assert } = require('chai')
const { handler:introspectHandler } = require('../src/introspect')
const grantTypePassword = require('../src/token/grantTypePassword')
const eventRegister = require('../src/eventRegister')
const handler = require('./mock/handler')
const tokenHelper = require('./mock/token')

const registerAllHandlers = eventHandlerStore => {
	const registerEventHandler = eventRegister(eventHandlerStore)
	registerEventHandler('get_service_account', handler.get_service_account)
	registerEventHandler('get_token_claims', handler.get_token_claims)
	registerEventHandler('generate_token', handler.generate_token)
	registerEventHandler('get_identity_claims', handler.get_identity_claims)
	registerEventHandler('process_end_user', handler.process_end_user)
}

describe('introspect', () => {
	describe('handler', () => {
		
		const payload = { client_id:'default', client_secret:123 }
		const user = { username: 'nic@cloudlessconsulting.com', password: 123456 }

		const getValidAccessToken = (eventHandlerStore, scopes) => co(function *() {
			const [errors, result] = yield grantTypePassword.exec(eventHandlerStore, { client_id:payload.client_id, user, scopes })
			if (errors)
				return [errors, null]
			else
				return [null, result.access_token]
		})

		it('01 - Should fail when the \'get_token_claims\' event handler is not defined.', done => {
			const eventHandlerStore = {}
			co(function *() {
				const [errors] = yield introspectHandler(payload, eventHandlerStore)
				assert.isOk(errors, '01')
				assert.isOk(errors.length, '02')
				assert.isOk(errors.some(e => e.message && e.message.indexOf('Missing \'get_token_claims\' handler') >= 0), '03')
				done()
			}).catch(done)
		})
		it('02 - Should fail when the \'get_service_account\' event handler is not defined.', done => {
			const eventHandlerStore = {}
			const registerEventHandler = eventRegister(eventHandlerStore)
			registerEventHandler('get_token_claims', handler.get_token_claims)
			co(function *() {
				const [errors] = yield introspectHandler(payload, eventHandlerStore)
				assert.isOk(errors, '01')
				assert.isOk(errors.length, '02')
				assert.isOk(errors.some(e => e.message && e.message.indexOf('Missing \'get_service_account\' handler') >= 0), '03')
				done()
			}).catch(done)
		})
		it('03 - Should return the userinfo when the access_token is valid.', done => {

			const eventHandlerStore = {}
			registerAllHandlers(eventHandlerStore)

			co(function *() {
				const [codeErrors, access_token] = yield getValidAccessToken(eventHandlerStore, ['profile'])
				
				assert.isNotOk(codeErrors, '01')
				assert.isOk(access_token, '02')
				
				const [errors, tokenInfo] = yield introspectHandler(
					{ ...payload, token:access_token, token_type_hint:'access_token' }, eventHandlerStore)
				
				assert.isNotOk(errors, '03')
				assert.isOk(tokenInfo, '04')
				assert.isOk(tokenInfo.active, '05')
				assert.equal(tokenInfo.iss, 'https://userin.com', '06')
				assert.equal(tokenInfo.sub, 1, '07')
				assert.equal(tokenInfo.aud, 'https://unittest.com', '08')
				assert.equal(tokenInfo.client_id, 'default', '09')
				assert.equal(tokenInfo.scope, 'profile', '10')
				assert.equal(tokenInfo.token_type, 'Bearer', '11')

				done()
			}).catch(done)
		})
		// it('04 - Should return the userinfo with email when the access_token is valid and the scopes contain \'email\'.', done => {

		// 	const eventHandlerStore = {}
		// 	registerAllHandlers(eventHandlerStore)

		// 	co(function *() {
		// 		const [codeErrors, authorization] = yield getValidAccessToken(eventHandlerStore, ['profile', 'email'])
				
		// 		assert.isNotOk(codeErrors, '01')
		// 		assert.isOk(authorization, '02')
				
		// 		const [errors, tokenInfo] = yield introspectHandler(null, eventHandlerStore)
					
		// 		assert.isNotOk(errors, '03')
		// 		assert.isOk(tokenInfo, '04')
		// 		assert.isOk(tokenInfo.active, '05')
		// 		assert.equal(tokenInfo.given_name, 'Nic', '06')
		// 		assert.equal(tokenInfo.family_name, 'Dao', '07')
		// 		assert.equal(tokenInfo.zoneinfo, 'Australia/Sydney', '08')
		// 		assert.isOk(tokenInfo.email === 'nic@cloudlessconsulting.com', '09')
		// 		assert.isOk(tokenInfo.email_verified === true, '10')
		// 		assert.isOk(tokenInfo.address === undefined, '11')
		// 		assert.isOk(tokenInfo.phone === undefined, '12')
		// 		assert.isOk(tokenInfo.phone_number_verified === undefined, '13')

		// 		done()
		// 	}).catch(done)
		// })
		// it('05 - Should return the userinfo with phone when the access_token is valid and the scopes contain \'phone\'.', done => {

		// 	const eventHandlerStore = {}
		// 	registerAllHandlers(eventHandlerStore)

		// 	co(function *() {
		// 		const [codeErrors, authorization] = yield getValidAccessToken(eventHandlerStore, ['profile', 'email', 'phone'])
				
		// 		assert.isNotOk(codeErrors, '01')
		// 		assert.isOk(authorization, '02')
				
		// 		const [errors, tokenInfo] = yield introspectHandler(null, eventHandlerStore)
					
		// 		assert.isNotOk(errors, '03')
		// 		assert.isOk(tokenInfo, '04')
		// 		assert.isOk(tokenInfo.active, '05')
		// 		assert.equal(tokenInfo.given_name, 'Nic', '06')
		// 		assert.equal(tokenInfo.family_name, 'Dao', '07')
		// 		assert.equal(tokenInfo.zoneinfo, 'Australia/Sydney', '08')
		// 		assert.isOk(tokenInfo.email === 'nic@cloudlessconsulting.com', '09')
		// 		assert.isOk(tokenInfo.email_verified === true, '10')
		// 		assert.isOk(tokenInfo.address === undefined, '11')
		// 		assert.isOk(tokenInfo.phone === '+6112345678', '12')
		// 		assert.isOk(tokenInfo.phone_number_verified === false, '13')

		// 		done()
		// 	}).catch(done)
		// })
		// it('06 - Should return the userinfo with address when the access_token is valid and the scopes contain \'address\'.', done => {

		// 	const eventHandlerStore = {}
		// 	registerAllHandlers(eventHandlerStore)

		// 	co(function *() {
		// 		const [codeErrors, authorization] = yield getValidAccessToken(eventHandlerStore, ['profile', 'email', 'phone', 'address'])
				
		// 		assert.isNotOk(codeErrors, '01')
		// 		assert.isOk(authorization, '02')
				
		// 		const [errors, tokenInfo] = yield introspectHandler(null, eventHandlerStore)
					
		// 		assert.isNotOk(errors, '03')
		// 		assert.isOk(tokenInfo, '04')
		// 		assert.isOk(tokenInfo.active, '05')
		// 		assert.equal(tokenInfo.given_name, 'Nic', '06')
		// 		assert.equal(tokenInfo.family_name, 'Dao', '07')
		// 		assert.equal(tokenInfo.zoneinfo, 'Australia/Sydney', '08')
		// 		assert.isOk(tokenInfo.email === 'nic@cloudlessconsulting.com', '09')
		// 		assert.isOk(tokenInfo.email_verified === true, '10')
		// 		assert.isOk(tokenInfo.address === 'Some street in Sydney', '11')
		// 		assert.isOk(tokenInfo.phone === '+6112345678', '12')
		// 		assert.isOk(tokenInfo.phone_number_verified === false, '13')

		// 		done()
		// 	}).catch(done)
		// })
		// it('07 - Should fail when no access_token is passed in the authorization header.', done => {

		// 	const eventHandlerStore = {}
		// 	registerAllHandlers(eventHandlerStore)

		// 	co(function *() {
		// 		const [errors] = yield introspectHandler(null, eventHandlerStore, { authorization:null })
				
		// 		assert.isOk(errors, '01')
		// 		assert.isOk(errors.some(e => e.message && e.message.indexOf('Missing required \'authorization\'') >= 0), '02')

		// 		done()
		// 	}).catch(done)
		// })
		// it('08 - Should fail when an invalid access_token is passed in the authorization header.', done => {

		// 	const eventHandlerStore = {}
		// 	registerAllHandlers(eventHandlerStore)

		// 	co(function *() {
		// 		const [errors] = yield introspectHandler(null, eventHandlerStore, { authorization:'bearer 123' })
				
		// 		assert.isOk(errors, '01')
		// 		assert.isOk(errors.some(e => e.message && e.message.indexOf('Invalid access_token') >= 0), '02')

		// 		done()
		// 	}).catch(done)
		// })
		// it('09 - Should fail when an non bearer token is passed in the authorization header.', done => {

		// 	const eventHandlerStore = {}
		// 	registerAllHandlers(eventHandlerStore)

		// 	co(function *() {
		// 		const [errors] = yield introspectHandler(null, eventHandlerStore, { authorization:'123' })
				
		// 		assert.isOk(errors, '01')
		// 		assert.isOk(errors.some(e => e.message && e.message.indexOf('The \'authorization\' header must contain a bearer access_token') >= 0), '02')

		// 		done()
		// 	}).catch(done)
		// })
		it('10 - Should show active false when an expired access_token is passed in the authorization header.', done => {

			const eventHandlerStore = {}
			registerAllHandlers(eventHandlerStore)

			co(function *() {
				const { token:access_token } = tokenHelper.createExpired({
					iss: 'https://userin.com',
					sub: 1,
					aud: 'https://unittest.com',
					client_id: 'default',
					scope: 'profile email phone address'
				})
				const [errors, tokenInfo] = yield introspectHandler(
					{ ...payload, token:access_token, token_type_hint:'access_token' }, eventHandlerStore)
				
				assert.isNotOk(errors, '01')
				assert.isOk(tokenInfo, '02')
				assert.isOk(tokenInfo.active === false, '03')

				done()
			}).catch(done)
		})
	})
})



