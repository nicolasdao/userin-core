const express = require('express')
const app = express()
const UserIn = require('./src')

app.use(new UserIn())

app.listen(3000)