const express = require('express')
const router = express.Router()

router.get('/Marti/api/clientEndPoints', (req, res) => {
	return res.send(`multitak`)
})

router.get('/Marti/api/version/config', (req, res) => {
	return res.send({
		'data': {
			'api': '2',
			'hostname': '0.0.0.0',
			'version': `multitak`
		},
		'nodeId': 'multitak', // todo allow user configuration of nodeID
		'type': 'ServerConfig',
		'version': '2'
	})
})

router.get('/Marti/api/version', (req, res) => {
	res.set('Content-Type', 'text/plaintext')
	return res.send(`multitak`)
})

router.put('/Marti/api/sync/metadata/:hash/tool', (req, res) => {
	return res.send(`OK`)
})

module.exports = router
