require('dotenv').config()
const moduleAlias = require('module-alias')
moduleAlias.addAlias('@lib', `${__dirname}/lib`)
moduleAlias.addAlias('@routes', `${__dirname}/routes`)

const cors = require('cors')
const express = require('express')
const fss = require('fs')
const morgan = require('morgan')
const nocache = require('nocache')

const messageLimit = process.env.MESSAGE_HISTORY_LIMIT ? parseInt(process.env.MESSAGE_HISTORY_LIMIT) : 1000
process.env.MULTITAK_API_ADDRESS = process.env.MULTITAK_API_ADDRESS || '0.0.0.0'
process.env.MULTITAK_API_PORT = process.env.MULTITAK_API_PORT || '8080'
process.env.MULTITAK_API_STORAGE = process.env.MULTITAK_API_STORAGE || './storage'

try {
	fss.mkdirSync(process.env.MULTITAK_API_STORAGE)
} catch (e) {
}

const app = express()
const http = require('http').Server(app)

app.use(cors())
app.use(morgan('combined'))
app.use((req, res, next) => { // content encoding header causes express raw parser to fail
	delete req.headers['content-encoding']
	next()
})
app.use(express.json())
app.disable('x-powered-by')
app.use(nocache())
app.use(require('@routes/Marti/api'))
app.use(require('@routes/Marti/vcm'))
app.use(require('@routes/Marti/sync'))
app.use(require('@routes/messages'))

const EventEmitter = require('events')
global.messageEmitter = new EventEmitter()

require('@lib/tcpServer')
require('@lib/tcpClient')
require('@lib/sslClient')
if (process.env.MULTITAK_MULTICAST_RECEIVE_DISABLE !== 'true') require('@lib/multicastReceive')
if (process.env.MULTITAK_MULTICAST_SEND_DISABLE !== 'true') require('@lib/multicastSend')

global.cotHistory = []

messageEmitter.on('cotAdd', (message) => {
	addToHistory(message)
	messageEmitter.emit('cotTcpServerSend', message)
	messageEmitter.emit('cotTcpClientSend', message)
	messageEmitter.emit('cotMulticastSend', message)
})

const addToHistory = (message) => {
	cotHistory.push(message)
	if (messageLimit > 0 && cotHistory.length > messageLimit) {
		global.cotHistory = cotHistory.slice(-1 * messageLimit)
	}
}

setInterval(() => {
	console.debug(`${cotHistory.length} messages in memory`)
}, 5000)

http.listen(process.env.MULTITAK_API_PORT, process.env.MULTITAK_API_ADDRESS, () => {
	console.info(`Started API on ${process.env.MULTITAK_API_ADDRESS}:${process.env.MULTITAK_API_PORT}`)
})
