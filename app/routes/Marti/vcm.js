const express = require('express')
const fs = require('fs').promises
const fss = require('fs')
const path = require('path')
const router = express.Router()

const videoPath = path.join('./', 'videoFeeds')
try {
	fss.mkdirSync(videoPath)
} catch(e) {}

router.get('/Marti/vcm', async (req, res) => {


	return res.send()
})

router.post('/Marti/vcm', async (req, res) => {
	console.log('11111111111', req.body)
/*
	const file = req.files.file

	if (!file) {
		return res.status(400).send({
			status: 'FAIL',
			message: `File not found`
		})
	}

	console.log(req.files)

	await file.mv(videoPath)
*/
	return res.send({status: 'OK'})
})

module.exports = router
