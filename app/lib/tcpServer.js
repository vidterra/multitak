const {cot} = require('@vidterra/tak.js')
const helper = require('@lib/helper')
const net = require('net')
const {v4: uuidv4} = require('uuid')

const int = process.env.TCP_SERVER_ADDRESS || '0.0.0.0'
const port = parseInt(process.env.TCP_SERVER_PORT) || 8087

global.tcpConnections = {}

// wintak and atak appear to only use XML COT when talking to a TAK server

const server = net.createServer((client) => {
	client.id = uuidv4()

	tcpConnections[client.id] = client

	const processMessage = (input) => {
		switch (true) {
			case input.message.event._attributes.type === 't-x-c-t':
				tcpConnections[client.id].write(helper.cotPong())
				break
			default:
				messageEmitter.emit('cotAdd', input)
				break
		}
	}

	let buffer = ''
	client.on('data', (raw) => {
		console.debug(`Received TCP server message`)
		let data = buffer + raw.toString()
		// this assumes only COT XML will be sent over TCP
		for (let result; result = helper.findCotTcp(data);) {
			processMessage({
				date: Date.now(),
				source: {
					type: 'tcpserver',
					ip: client.remoteAddress,
					id: client.id
				},
				raw: result.event,
				message: cot.xml2js(result.event)
			})
			data = result.remainder
		}
	})

	client.on('error', () => {
		console.debug(`${client.id} error`)
		delete tcpConnections[client.id]
	})

	client.on('end', () => {
		console.debug(`${client.id} disconnected`)
		delete tcpConnections[client.id]
	})
})

messageEmitter.on('cotTcpServerSend', (packet) => {
	console.debug(`Sending COT on TCP server`)
	for (const connectionID of Object.keys(tcpConnections)) {
		if (connectionID !== packet.source.id) { // send to all TCP connections except originator
			tcpConnections[connectionID].write(packet.raw)
		}
	}
})

server.listen(port, int, () => {
	console.info(`TCP server started on ${int}:${port}`)
})

setInterval(() => {
	console.debug(`${Object.keys(tcpConnections).length} clients connected to this TAK server`)
}, 30000)
