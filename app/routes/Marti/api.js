const express = require('express')
const router = express.Router()

router.get('/Marti/api/clientEndPoints', async (req, res) => {
	return res.send()
})

router.get('/Marti/api/version/config', async (req, res) => {
	return res.send()
})

router.get('/Marti/api/version', async (req, res) => {
	return res.send()
})

module.exports = router
