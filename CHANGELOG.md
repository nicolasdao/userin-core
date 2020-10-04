# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

## [1.12.0](https://github.com/nicolasdao/userin-core/compare/v1.11.0...v1.12.0) (2020-10-04)


### Features

* Add support for setting up a baseUrl ([2574bed](https://github.com/nicolasdao/userin-core/commit/2574bedf62c44e59467479f1f6672be097249c35))

## [1.11.0](https://github.com/nicolasdao/userin-core/compare/v1.10.0...v1.11.0) (2020-10-02)


### Features

* Add support for get_access_token_claims in the loginsignup mode ([f4c1e92](https://github.com/nicolasdao/userin-core/commit/f4c1e92bfc1a3499ea581e259aa6d58179d329ed))

## [1.10.0](https://github.com/nicolasdao/userin-core/compare/v1.9.3...v1.10.0) (2020-10-02)


### Features

* Add support for deleting refresh_token ([d728866](https://github.com/nicolasdao/userin-core/commit/d72886618cb97606cb87b5b341ae07c67e9b8757))

### [1.9.3](https://github.com/nicolasdao/userin-core/compare/v1.9.2...v1.9.3) (2020-09-30)


### Bug Fixes

* The getEvents method contains an array element rather than containing only strings ([a689d16](https://github.com/nicolasdao/userin-core/commit/a689d16e0b4358517169c9a645ce8b68eace9dd9))

### [1.9.2](https://github.com/nicolasdao/userin-core/compare/v1.9.1...v1.9.2) (2020-09-30)


### Bug Fixes

* Remove the redundant concept of 'get_id_token_signing_alg_values_supported' ([a839bd4](https://github.com/nicolasdao/userin-core/commit/a839bd4904b4e45d820a3165501920f64feeb2f8))

### [1.9.1](https://github.com/nicolasdao/userin-core/compare/v1.9.0...v1.9.1) (2020-09-30)


### Bug Fixes

* The 'get_id_token_signing_alg_values_supported' should be optional and only required when the optional 'get_jwks' is defined ([1606d13](https://github.com/nicolasdao/userin-core/commit/1606d131ec1327ffee4488a7cfbaab5480a58042))

## [1.9.0](https://github.com/nicolasdao/userin-core/compare/v1.8.0...v1.9.0) (2020-09-30)


### Features

* Add support for distinguishing between required OpenID event handlers and non-required ([1144353](https://github.com/nicolasdao/userin-core/commit/1144353b558dfbdca41e3a57a3cb82c3c0bf932c))

## [1.8.0](https://github.com/nicolasdao/userin-core/compare/v1.7.0...v1.8.0) (2020-09-30)


### Features

* Add support for configuring the supported grant types ([7669a70](https://github.com/nicolasdao/userin-core/commit/7669a70a52c2857c3e22ea44835b0d0285dfb5de))

## [1.7.0](https://github.com/nicolasdao/userin-core/compare/v1.6.2...v1.7.0) (2020-09-29)


### Features

* Add new event handlers to support the missing OpenID data needed in the discovery endpoint ([512216f](https://github.com/nicolasdao/userin-core/commit/512216f9c1bbde105d38ba5643303bd0b65bc44e))

### [1.6.2](https://github.com/nicolasdao/userin-core/compare/v1.6.1...v1.6.2) (2020-09-21)


### Features

* Add support for new custom error InvalidCredentialsError ([7a1a0b6](https://github.com/nicolasdao/userin-core/commit/7a1a0b633c963440b5ecf5047e8281ef1193953a))

### [1.6.1](https://github.com/nicolasdao/userin-core/compare/v1.6.0...v1.6.1) (2020-09-21)


### Bug Fixes

* The strategy config is ignoring non-standard fields ([038f6d9](https://github.com/nicolasdao/userin-core/commit/038f6d9953adfacf773802338feabb10ca40c241))

## [1.6.0](https://github.com/nicolasdao/userin-core/compare/v1.5.1...v1.6.0) (2020-09-20)


### Features

* Add support for a new required 'create_fip_user' event handler ([5292b8b](https://github.com/nicolasdao/userin-core/commit/5292b8ba666f96126fe09420d947530fcc5e6d9c))

### [1.5.1](https://github.com/nicolasdao/userin-core/compare/v1.5.0...v1.5.1) (2020-09-19)

## [1.5.0](https://github.com/nicolasdao/userin-core/compare/v1.4.0...v1.5.0) (2020-09-19)

## [1.4.0](https://github.com/nicolasdao/userin-core/compare/v1.3.2...v1.4.0) (2020-09-18)


### Features

* Add support for loginsignupfip mode ([20de65d](https://github.com/nicolasdao/userin-core/commit/20de65db9c3e50962f9194fb3d0ffbeef6b3e353))

### [1.3.2](https://github.com/nicolasdao/userin-core/compare/v1.3.1...v1.3.2) (2020-09-17)


### Features

* Add new Error type NotFoundError ([f731319](https://github.com/nicolasdao/userin-core/commit/f731319eb3df595f44f5ec9da66f9e7afbd74f1c))

### [1.3.1](https://github.com/nicolasdao/userin-core/compare/v1.3.0...v1.3.1) (2020-09-17)


### Features

* Add support for grouping all the token expiry time under a single property ([472c650](https://github.com/nicolasdao/userin-core/commit/472c6503740865db1284f26996c81458d8368914))

## [1.3.0](https://github.com/nicolasdao/userin-core/compare/v1.2.3...v1.3.0) (2020-09-17)


### Features

* Add a required configuration object to the Strategy constructor ([fc201a5](https://github.com/nicolasdao/userin-core/commit/fc201a5cdcf9ca8f6a85a93054878f1f81e5da27))

### [1.2.3](https://github.com/nicolasdao/userin-core/compare/v1.2.2...v1.2.3) (2020-09-17)


### Features

* Add APIs to list supported events ([ae2a9ee](https://github.com/nicolasdao/userin-core/commit/ae2a9ee054f7141cf1906b8f59f24b4958d8e7db))

### [1.2.2](https://github.com/nicolasdao/userin-core/compare/v1.2.1...v1.2.2) (2020-09-17)


### Features

* Remove non required OIDC event 'get_config' ([be570f9](https://github.com/nicolasdao/userin-core/commit/be570f963238bae864557f41ab5ad65670659248))

### [1.2.1](https://github.com/nicolasdao/userin-core/compare/v1.2.0...v1.2.1) (2020-09-17)


### Features

* Add support for non OIDC events ([43bf567](https://github.com/nicolasdao/userin-core/commit/43bf567063604d9daa04f8b10192e17cf6eac3ad))

## [1.2.0](https://github.com/nicolasdao/userin-core/compare/v1.1.0...v1.2.0) (2020-09-17)

## [1.1.0](https://github.com/nicolasdao/userin-core/compare/v1.0.3...v1.1.0) (2020-09-16)

### [1.0.3](https://github.com/nicolasdao/userin-core/compare/v1.0.2...v1.0.3) (2020-09-15)


### Features

* Add new handler type 'get_token_expiry' ([fd5870e](https://github.com/nicolasdao/userin-core/commit/fd5870e4cdd8fac751235653d6e4b66b945d2c52))

### [1.0.2](https://github.com/nicolasdao/userin-core/compare/v1.0.1...v1.0.2) (2020-09-15)


### Features

* Add support for adding OIDC dates on claims for id_token ([bf9c7f1](https://github.com/nicolasdao/userin-core/commit/bf9c7f15b5d8c348ea9a319e8dde7b077e1746d5))

### [1.0.1](https://github.com/nicolasdao/userin-core/compare/v1.0.0...v1.0.1) (2020-09-14)

## 1.0.0 (2020-09-14)


### Features

* Add support for authorize endpoint + add all unit tests ([f8f66f9](https://github.com/nicolasdao/userin-core/commit/f8f66f9d7ec39f8b7165aba66652981b983a8642))
* Add support for introspect endpoint + add some unit tests ([d4e65e5](https://github.com/nicolasdao/userin-core/commit/d4e65e5be2d5c92e6f0b4a17a78451c02d8c7b21))
* Add support for Passport Strategy as plugins ([595160a](https://github.com/nicolasdao/userin-core/commit/595160a9dc35947a0165bc1d60b1c1c01d8233c0))
* Add support for plugins ([ffdf252](https://github.com/nicolasdao/userin-core/commit/ffdf252d7d0cd2ae93660d3d3c7fc98dfdb8894c))
* Add support for the userinfo endpoint + add all unit tests ([f9c7a1f](https://github.com/nicolasdao/userin-core/commit/f9c7a1f64b39361313cbcd191801271c40965cea))
