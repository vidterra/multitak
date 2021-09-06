const dgram = require('dgram')
const helper = require('@lib/helper')

const COT_PORT = 6969
const COT_ADDRESS = '239.2.3.1'

const cotReceiveSockets = {}
const interfaces = helper.getInterfaces()
const serverAddresses = interfaces.map(int => int.address)
const interfaceBlacklist = process.env.INTERFACE_BLACKLIST_RECEIVE ? process.env.INTERFACE_BLACKLIST_RECEIVE.split(',') : []

const run = (int) => {
	const cotReceiveSocket = dgram.createSocket({
		type: 'udp4',
		reuseAddr: true,
	})

	cotReceiveSocket.bind(COT_PORT, () => {
		const addMembership = () => {
			try {
				for (const int of interfaces) {
					if(!interfaceBlacklist.includes(int.name)) {
						cotReceiveSocket.addMembership(COT_ADDRESS, int.address)
						console.debug(`Connected multicast receive to interface ${int.name} at ${int.address}`)
					}
				}
			} catch (e) {
				setTimeout(() => {
					addMembership()
				}, 2000)
			}
		}
		addMembership()
	})

	cotReceiveSocket.on('error', (err) => {
		console.error(`Socket error:\n${err.stack}`)
	})

	cotReceiveSocket.on('message', (raw, rdata) => {
		//if (rdata.address === int.address) return // do not process multicast messages sent by this server
		//todo uncomment this if(serverAddresses.includes(rdata.address)) return // do not process multicast messages sent by this server
		const message = helper.parseMessage(raw)

		// todo improve by detecting which interface this packet was received on and not sending the packet back to the same interface
		// this can waste bandwidth because it duplicates every multicast packet
		if (message) {
			console.debug(`Received multicast TAK message on interface from ${rdata.address}`)
			messageEmitter.emit('cotAdd', {
				source: {
					type: 'multicast',
					ip: rdata.address
				},
				date: Date.now(),
				raw,
				message
			})
		}
	})

	cotReceiveSockets[int] = cotReceiveSocket
}

run()
