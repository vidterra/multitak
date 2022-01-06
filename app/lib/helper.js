const {cot, proto} = require('@vidterra/tak.js')
const os = require('os')

module.exports.findCotTcp = (text) => {
	let match = text.match(/(<event.*?<\/event>)(.*)/) // find first COT
	if(!match) {
		match = text.match(/(<event[^>]*\/>)(.*)/) // find first COT
		if(!match) return null
	}
	return {
		event: match[1],
		remainder: match[2],
		discard: match[0]
	}
}

module.exports.parseMessage = (message) => {
	if (!message) {
		throw Error('Attempted to parse an empty message')
	}

	const bufferMessage = !Buffer.isBuffer(message) ? Buffer.from(message, 'hex') : message

	if (bufferMessage[0] === 191) { // TAK message format 0xbf
		//console.debug('TAK message received')
		const trimmedBuffer = bufferMessage.slice(3, bufferMessage.length) // remove tak message header from content
		if (bufferMessage[1] === 0) { // is COT XML
			//console.debug('COT XML format')
			return cot.xml2js(trimmedBuffer)
		} else if (bufferMessage[1] === 1) { // is Protobuf
			//console.debug('TAK protobuf format')
			//return proto.proto2js(trimmedBuffer)
			const protoMessage = proto.proto2js(trimmedBuffer)
			const cotMessage = proto.protojs2cotjs(protoMessage)
			return cotMessage
		}
	} else { // not TAK message format
		try {
			//console.debug('COT XML received')
			return cot.xml2js(message) // try parsing raw XML
		} catch (e) {
			console.error('Failed to parse message', e)
			return null
		}
	}
}

module.exports.cotPong = () => {
	const date = Date.now()
	return cot.js2xml({
		"event": {
			"_attributes": {
				"version": "2.0",
				"uid": "multitakPong",
				"type": "t-x-c-t-r",
				"how": "h-g-i-g-o",
				"time": cot.jsDate2cot(date),
				"start": cot.jsDate2cot(date),
				"stale": cot.jsDate2cot(date + 20 * 1000), // 20 sec.
			},
			"point": {
				"_attributes": {
					"lat": "0.000000",
					"lon": "0.000000",
					"hae": "0.0",
					"ce": "9999999.0",
					"le": "9999999.0"
				}
			}
		}
	})
}

module.exports.cotPing = () => {
	const date = Date.now()
	return cot.js2xml({
		"event": {
			"_attributes": {
				"version": "2.0",
				"uid": "multitakPong",
				"type": "t-x-c-t",
				"how": "h-g-i-g-o",
				"time": cot.jsDate2cot(date),
				"start": cot.jsDate2cot(date),
				"stale": cot.jsDate2cot(date + 20 * 1000), // 20 sec.
			},
			"point": {
				"_attributes": {
					"lat": "0.000000",
					"lon": "0.000000",
					"hae": "0.0",
					"ce": "9999999.0",
					"le": "9999999.0"
				}
			}
		}
	})
}

module.exports.getInterfaces = (name = null) => {
	const interfaces = os.networkInterfaces()
	let filteredInterfaces = []

	Object.keys(interfaces).forEach((int) => {
		if (int.match(/(docker|veth|br-)/)) {
			// skip over docker interfaces
			return
		}
		interfaces[int].forEach((address) => {
			if ('IPv4' !== address.family || address.internal !== false) {
				// skip over internal (i.e. 127.0.0.1) and non-ipv4 addresses
				return
			}
			address.name = int
			if (name) { // if only 1 interface is requested
				if (int === name) {
					filteredInterfaces.push(address)
				}
			} else {
				filteredInterfaces.push(address)
			}
		})
	})

	return filteredInterfaces
}

module.exports.getInterfaceAddresses = () => {
	return module.exports.getInterfaces().map(int => int.address)
}

module.exports.helloPkg = () => {
	const dt = Date.now()
	const dtD = new Date(dt).toISOString()
	const dtD5 = new Date(dt + 250000).toISOString()
	const pkg = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><event version="2.0" type="t-x-d-d" uid="tak-web-map" time="'+dtD+'" start="'+dtD+'" stale="'+dtD5+'" how="m-g"/>'
	return pkg
}
