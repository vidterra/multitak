require('dotenv').config()
const moduleAlias = require('module-alias')
moduleAlias.addAlias('@lib', `${__dirname}/lib`)
moduleAlias.addAlias('@routes', `${__dirname}/routes`)

const cors = require('cors')
const express = require('express')
const morgan = require('morgan')

const app = express()
const http = require('http').Server(app)
const io = require('socket.io')(http, {path: '/socket'})

app.use(cors())
app.use(morgan('combined'))
app.disable('x-powered-by')
app.use(require('@routes/messages'))

const EventEmitter = require('events')
global.messageEmitter = new EventEmitter()

require('@lib/tcpServer')
require('@lib/tcpClient')
require('@lib/multicastReceive')
require('@lib/multicastSend')

global.cotHistory = []

messageEmitter.on('cotAdd', (message) => {
	addToHistory(message)
	messageEmitter.emit('cotTcpServerSend', message)
	messageEmitter.emit('cotTcpClientSend', message)
	messageEmitter.emit('cotMulticastSend', message)
})

const messageLimit = process.env.MESSAGE_HISTORY_LIMIT ? parseInt(process.env.MESSAGE_HISTORY_LIMIT) : 1000

const addToHistory = (message) => {
	cotHistory.push(message)
	if(messageLimit > 0 && cotHistory.length > messageLimit) {
		global.cotHistory = cotHistory.slice(-1 * messageLimit)
	}
}

setInterval(() => {
	console.debug(`${cotHistory.length} messages in memory`)
}, 5000)

http.listen(process.env.WEB_API_PORT || 8081, process.env.WEB_API_ADDRESS || '0.0.0.0', () => {
	console.info('Started')
})
