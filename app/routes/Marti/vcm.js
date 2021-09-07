const express = require('express')
const fs = require('fs').promises
const fss = require('fs')
const path = require('path')
const router = express.Router()
const sanitize = require('sanitize-filename')
const xmljs = require('xml-js')

router.use(express.raw({type: 'application/xml'}))

const videoStorage = path.join(process.env.MULTITAK_API_STORAGE, 'video')

try {
	fss.mkdirSync(videoStorage)
} catch (e) {
}

router.get('/Marti/vcm', async (req, res) => {
	const videoFiles = await fs.readdir(videoStorage)
	const videos = {
		videoConnections: {
			feed: []
		}
	}
	for (const videoFile of videoFiles) {
		const video = await fs.readFile(path.join(videoStorage, videoFile))
		const videoJson = JSON.parse(video.toString())
		videos.videoConnections.feed.push(videoJson)
	}
	res.set('Content-Type', 'text/xml')
	const xml = xmljs.js2xml(videos, {compact: true})
	return res.send(xml)
})

router.post('/Marti/vcm', async (req, res) => {
	const videoJs = xmljs.xml2js(req.body, {compact: true})
	const feed = videoJs.videoConnections.feed
	const uid = sanitize(feed.uid._text)
	await fs.writeFile(path.join(videoStorage, uid), JSON.stringify(feed))
	return res.send({status: 'OK'})
})

module.exports = router
