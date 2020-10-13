
class InvalidRequestError extends Error {
	constructor(message, errors) {
		super(message)
		this.code = 400
		this.category = 'invalid_request'
		if (errors && Array.isArray(errors))
			this.errors = errors
	}
}

class UnsupportedGrantTypeError extends Error {
	constructor(message, errors) {
		super(message)
		this.code = 400
		this.category = 'unsupported_grant_type'
		if (errors && Array.isArray(errors))
			this.errors = errors
	}
}

class InvalidGrantError extends Error {
	constructor(message, errors) {
		super(message)
		this.code = 400
		this.category = 'invalid_grant'
		if (errors && Array.isArray(errors))
			this.errors = errors
	}
}

class InvalidScopeError extends Error {
	constructor(message, errors) {
		super(message)
		this.code = 400
		this.category = 'invalid_scope'
		if (errors && Array.isArray(errors))
			this.errors = errors
	}
}

class InvalidClaimError extends Error {
	constructor(message, errors) {
		super(message)
		this.code = 400
		this.category = 'invalid_claim'
		if (errors && Array.isArray(errors))
			this.errors = errors
	}
}

class UnauthorizedClientError extends Error {
	constructor(message, errors) {
		super(message)
		this.code = 400
		this.category = 'unauthorized_client'
		if (errors && Array.isArray(errors))
			this.errors = errors
	}
}

class InvalidClientError extends Error {
	constructor(message, errors) {
		super(message)
		this.code = 401
		this.category = 'invalid_client'
		if (errors && Array.isArray(errors))
			this.errors = errors
	}
}

class InternalServerError extends Error {
	constructor(message, errors) {
		super(message)
		this.code = 400
		this.category = 'internal_server_error'
		if (errors && Array.isArray(errors))
			this.errors = errors
	}
}

class InvalidTokenError extends Error {
	constructor(message, errors) {
		super(message)
		this.code = 403
		this.category = 'invalid_token'
		if (errors && Array.isArray(errors))
			this.errors = errors
	}
}

// Non standard OIDC errors
class InvalidUserError extends Error {
	constructor(message, errors) {
		super(message)
		this.code = 401
		this.category = 'invalid_user'
		if (errors && Array.isArray(errors))
			this.errors = errors
	}
}

// Non standard OIDC errors
class NotFoundError extends Error {
	constructor(message, errors) {
		super(message)
		this.code = 404
		this.category = 'resource_not_found'
		if (errors && Array.isArray(errors))
			this.errors = errors
	}
}

// Non standard OIDC errors
class InvalidCredentialsError extends Error {
	constructor(message, errors) {
		super(message)
		this.code = 401
		this.category = 'invalid_credentials'
		if (errors && Array.isArray(errors))
			this.errors = errors
	}
}

module.exports = {
	InvalidRequestError,
	UnsupportedGrantTypeError,
	InvalidGrantError,
	InvalidScopeError,
	InvalidClaimError,
	UnauthorizedClientError,
	InvalidClientError,
	InternalServerError,
	InvalidTokenError,
	InvalidUserError,
	NotFoundError,
	InvalidCredentialsError
}