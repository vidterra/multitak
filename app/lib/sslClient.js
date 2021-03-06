const {cot} = require("@vidterra/tak.js")
const fs = require('fs')
const helper = require('@lib/helper')
const tls = require('tls')

const url = process.env.REMOTE_SSL_SERVER
const sslCert = process.env.REMOTE_SSL_SERVER_CERTIFICATE
const sslKey = process.env.REMOTE_SSL_SERVER_KEY

const run = () => {
	const urlMatch = url.match(/^ssl:\/\/(.+):([0-9]+)/)
	if (!urlMatch) return

	const options = {
		host: urlMatch[1],
		port: urlMatch[2],
		cert: fs.readFileSync(sslCert),
		key: fs.readFileSync(sslKey),
		rejectUnauthorized: false
	}

	const client = tls.connect(options, () => {
		if (client.authorized) {
			console.info("Connection authorized by a Certificate Authority.")
		} else {
			console.info("Connection not authorized: " + client.authorizationError)
		}
	})

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
		console.debug(`Received TCP client message from remote TAK server ${url}`, raw.length)
		for (let result; result = helper.findCotTcp(data);) {
			try {
				processMessage({
					date: Date.now(),
					source: {
						type: 'sslclient',
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
		console.error(`Could not connect to SSL host ${url}`)
	})

	client.on('close', () => {
		console.info(`Connection to SSL host ${url} closed`)
	})

	messageEmitter.on('cotTcpClientSend', (packet) => {
		if (packet.source.type !== 'sslclient') { // don't send back to the TAK server this was received from
			console.debug(`Sending COT on SSL client to ${url}`)
			client.write(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n${cot.js2xml(packet.message)}`)
			//client.write(packet.raw) // todo add try catch
		}
	})
}
if (url && sslCert && sslKey) {
	run()
}


