const express = require('express')
const app = express()
const UserIn = require('./src')
const { MockStrategy } = require('./test/mock/handler')

const userIn = new UserIn()
userIn.use(new MockStrategy())

app.use(userIn)

app.listen(3330)