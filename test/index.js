/**
 * Copyright (c) 2020, Cloudless Consulting Pty Ltd.
 * All rights reserved.
 * 
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
*/

// To skip a test, either use 'xit' instead of 'it', or 'describe.skip' instead of 'describe'

const { assert } = require('chai')
const { token } = require('../src')

describe('token', () => {
	describe('id_token', () => {
		describe('#addDateClaims', () => {
			it('01 - Should add the OIDC date claims to existing claims.', () => {
				const claims = { iss:'https://example.com' }
				const newClaims = token.id_token.addDateClaims(claims, 1200)
				const iat = Math.floor(Date.now()/1000)
				const exp = iat + 1200
				assert.equal(newClaims.iss, claims.iss, '01')
				assert.isOk(newClaims.iat, '02')
				assert.isOk(iat-2 < newClaims.iat, '03')
				assert.isOk(iat+2 > newClaims.iat, '04')
				assert.isOk(exp-2 < newClaims.exp, '05')
				assert.isOk(exp+2 > newClaims.exp, '06')
			})
		})
	})
})



