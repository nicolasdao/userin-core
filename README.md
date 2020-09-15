# userin-core &middot; [![License](https://img.shields.io/badge/License-BSD%203--Clause-blue.svg)](https://opensource.org/licenses/BSD-3-Clause)
UserIn core component to build an OAuth 2.0 OpenID Connect web API that supports integration with the most popular Federated Identity Providers (e.g., Google, Facebook, GitHub)

```
npm i userin-core
```

# Table of contents

> * [Create a new UserIn Strategy](#create-a-new-userin-strategy)
> * [Utilities](#utilities)
>	- [`token.id_token.addDateClaims(claims: Object[, expiryInSeconds: Number])`](#tokenid_tokenadddateclaimsclaims-object-expiryinseconds-number)

# Create a new UserIn Strategy

```js
const { Strategy } = require('userin-core')

class CustomStrategy extends Strategy {
	constructor() {
		super()
		this.name = 'yourcustomstrategy'
		this.generate_token = (root, { type, claims }) => { /* Implement your logic here */ }
		this.get_end_user = (root, { user }) => { /* Implement your logic here */ }
		this.get_fip_user = (root, { strategy, user }) => { /* Implement your logic here */ }
		this.get_identity_claims = (root, { user_id, scopes }) => { /* Implement your logic here */ }
		this.get_service_account = (root, { client_id, client_secret }) => { /* Implement your logic here */ }
		this.get_token_claims = async (root, { type, token }) => { /* Implement your logic here */ }

	}
}
```

To facilitate custom implementation, we've added a template [here](https://gist.github.com/nicolasdao/a17f575a65ddad166d51aa7e78e41be7).

# Utilities
## `token.id_token.addDateClaims(claims: Object[, expiryInSeconds: Number])`

`expiryInSeconds` is optional. Its default value is `3600` seconds.

```js
const { token } = require('userin-core')

const claims = { iss:'https://example.com', first_name:'Nic', last_name:'Dao' }

console.log(token.id_token.addDateClaims(claims, 3600))

// Prints:
// {
// 		iss:'https://example.com', 
// 		first_name:'Nic', 
// 		last_name:'Dao',
// 		iat: 1600148277,
// 		exp: 1600151877
// }
```
