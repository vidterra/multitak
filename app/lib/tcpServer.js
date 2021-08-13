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


	client.on('data', (raw) => {
		console.debug(`Received TCP server message`)
		// this assumes only COT XML will be sent over TCP
		try {
			for (const message of helper.findCotTcp(raw)) {
				processMessage({
					date: Date.now(),
					source: {
						type: 'tcpserver',
						ip: client.remoteAddress,
						id: client.id
					},
					raw,
					message: cot.xml2js(message)
				})
			}
		} catch(e) {
			console.error('error', e, raw.toString())
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

const processMessage = (input) => {
	//const type = cot.decodeType(input.message.event._attributes.type)
	switch (true) {
		case input.message.event._attributes.type === 't-x-c-t':
			tcpConnections[input.id].write(helper.cotPong())
			break
		/*case type.atom === 'a':
			console.debug('ATOM')
			//tcpConnections[id].atom = message
			sendAll(raw)
			break*/
		default:
			messageEmitter.emit('cotAdd', input)
			break
	}
}

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
