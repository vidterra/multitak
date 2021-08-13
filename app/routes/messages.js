const express = require('express')
const router = express.Router()

router.get('/api/messages', async (req, res) => {
	return res.send(cotHistory.map(cot => {
		delete cot.raw
		return cot
	}))
})

router.delete('/api/messages', async (req, res) => {
	global.cotHistory.length = 0
	return res.send({ status: 'OK' })
})

module.exports = router
