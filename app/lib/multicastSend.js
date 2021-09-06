const dgram = require('dgram')
const helper = require('@lib/helper')

const COT_PORT = 6969
const COT_ADDRESS = '239.2.3.1'

const interfaces = helper.getInterfaces()
const interfaceBlacklist = process.env.INTERFACE_BLACKLIST_SEND ? process.env.INTERFACE_BLACKLIST_SEND.split(',') : []
const serverAddresses = interfaces.map(int => int.address)

const cotSendSockets = {}

const run = () => {
	for (const int of helper.getInterfaces()) {
		if (!interfaceBlacklist.includes(int.name)) {
			start(int)
		}
	}
}

const start = (int) => {
	const cotSendSocket = dgram.createSocket({
		type: 'udp4',
		reuseAddr: true,
	})

	cotSendSocket.bind(COT_PORT, int.address, () => {
		cotSendSocket.setBroadcast(true)
		cotSendSocket.setMulticastTTL(255)
		console.debug(`Connected multicast sending to interface ${int.name} at ${int.address}`)
	})

	cotSendSocket.name = int.name
	cotSendSockets[int.address] = cotSendSocket
}

messageEmitter.on('cotMulticastSend', (message) => {
	if(message.source.type === 'multicast' && serverAddresses.includes(message.source.ip)) return // if the source was multitak IP don't send it back to multicast

	for (const address of Object.keys(cotSendSockets)) {
		const socket = cotSendSockets[address]
		console.debug(`Sending COT on ${socket.name} at ${address}`)
		socket.send(message.raw, 0, message.raw.length, COT_PORT, COT_ADDRESS)
	}
})

run()
