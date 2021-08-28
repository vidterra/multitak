const {cot} = require("@vidterra/tak.js")
const fs = require('fs')
const helper = require('@lib/helper')
const net = require('net')

const url = process.env.REMOTE_TCP_SERVER
const cotFile = fs.createWriteStream('./cot')

const run = () => {
	const urlMatch = url.match(/^tcp:\/\/(.+):([0-9]+)/)
	if (!urlMatch) return

	const cotAddress = urlMatch[1]
	const cotPort = urlMatch[2]

	const client = new net.Socket()
	let intervalConnect = false

	const connect = () => {
		client.connect(cotPort, cotAddress, () => {
			clearIntervalConnect()
			console.debug(`Connected to remote TCP host ${cotAddress}:${cotPort}`)
			client.write(helper.helloPkg())
		})
	}

	const launchIntervalConnect = () => {
		if (intervalConnect) return
		intervalConnect = setInterval(connect, 5000)
	}

	const clearIntervalConnect = () => {
		if (!intervalConnect) return
		clearInterval(intervalConnect)
		intervalConnect = false
	}

	client.pipe(cotFile)

	const processMessage = (input) => {
		switch (true) {
			case input.message.event._attributes.type === 't-x-c-t-r':
				client.write(helper.cotPing())
				break
			default:
				messageEmitter.emit('cotAdd', input)
				break
		}
	}

	let buffer = ''
	client.on('data', (raw) => {
		// this assumes only COT XML will be sent over TCP
		let data = buffer + raw.toString()
		console.debug(`Received TCP message from remote TAK server ${url}`, raw.length, data)
		for (let result; result = helper.findCotTcp(data);) {
			try {
				processMessage({
					date: Date.now(),
					source: {
						type: 'tcpclient',
						ip: url
					},
					raw: result.event,
					message: cot.xml2js(result.event)
				})
			} catch(e) {
				console.error('Error parsing', e, raw.toString())
			}
			data = result.remainder
		}
		buffer = data
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
		if (packet.source.type !== 'tcpclient') { // don't send back to the TAK server this was received from
			console.debug(`Sending COT on TCP client to ${url}`)
			client.write(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n${cot.js2xml(packet.message)}`)
		}
	})

	connect()
}

if (url) {
	run()
}

