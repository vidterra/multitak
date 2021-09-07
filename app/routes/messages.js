const express = require('express')
const router = express.Router()
const xmljs = require('xml-js')
const {cot} = require("@vidterra/tak.js");

router.get('/api/messages', (req, res) => {
	return res.send(cotHistory.map(cot => {
		delete cot.raw
		return cot
	}))
})

router.delete('/api/messages', (req, res) => {
	global.cotHistory.length = 0
	return res.send({status: 'OK'})
})

router.post('/api/messages', (req, res) => {
	const message = req.body.message

	if(!message) {
		return res.status(400).send({
			status: 'FAIL',
			message: `Message missing`
		})
	}

	const packet = {
		date: Date.now(),
		source: {
			type: 'api',
			ip:  req.headers['x-forwarded-for'] || req.socket.remoteAddress
		},
		raw: cot.js2xml(message),
		message
	}

	messageEmitter.emit('cotAdd', packet)
	return res.send('OK')
})

module.exports = router
