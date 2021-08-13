const {cot} = require("@vidterra/tak.js")
const helper = require('@lib/helper')
const net = require('net')

const run = () => {
	const url = process.env.REMOTE_TCP_SERVER
	if(!url) return

	const urlMatch = url.match(/^tcp:\/\/(.+):([0-9]+)/)
	if (urlMatch) {
		const cotAddress = urlMatch[1]
		const cotPort = urlMatch[2]

		const client = new net.Socket()
		let intervalConnect = false

		const connect = () => {
			client.connect(cotPort, cotAddress, function () {
				clearIntervalConnect()
				console.debug(`Connected to remote TCP host ${cotAddress}:${cotPort}`)
			})
		}

		const launchIntervalConnect = () => {
			if(intervalConnect) return
			intervalConnect = setInterval(connect, 5000)
		}

		const clearIntervalConnect = ()  =>{
			if(!intervalConnect) return
			clearInterval(intervalConnect)
			intervalConnect = false
		}


		client.on('data', function (raw) {
			// this assumes only COT XML will be sent over TCP
			try {
				const result = helper.findCotTcp(raw)
				for (const message of result) {
					console.debug(`Received TCP message from remote TAK server ${url}`)
					messageEmitter.emit('cotAdd', {
						date: Date.now(),
						source: {
							type: 'tcpclient',
							ip: url
						},
						raw,
						message: cot.xml2js(message)
					})
				}
			} catch(e) {
				console.error('error', e, raw.toString())
			}
		})

		client.on('error', (err) => {
			console.error(`Could not connect to TCP host ${url}`)
			launchIntervalConnect()
		})

		client.on('close', () => {
			console.info(`Connection to TCP host ${url} closed`)
			launchIntervalConnect()
		})

		client.on('end', launchIntervalConnect)

		messageEmitter.on('cotTcpClientSend', (packet) => {
			if(packet.source.type !== 'tcpclient') { // don't send back to the TAK server this was received from
				console.debug(`Sending COT on TCP client to ${url}`)
				client.write(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n${cot.js2xml(packet.message)}`)
				//client.write(packet.raw) // todo add try catch
			}
		})

		connect()
	}
}

run()
