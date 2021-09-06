const express = require('express')
const path = require("path");
const fs = require('fs').promises
const fss = require('fs')
const multer = require('multer')
const router = express.Router()

router.use(express.raw({type: 'application/xml'}))

const dataPackageStorage = path.join(process.env.WEB_API_STORAGE, 'dataPackages')

const upload = multer({dest: dataPackageStorage})

try {
	fss.mkdirSync(dataPackageStorage)
} catch (e) {
}

router.get('/Marti/sync/content', async (req, res) => {
	const hash = req.query.hash
	return res.download(path.join(dataPackageStorage, hash), hash)
})

router.get('/Marti/sync/missionquery', async (req, res) => {
	const hash = req.query.hash
	const dataPackages = await fs.readdir(dataPackageStorage)
	if (!dataPackages.includes(hash)) {
		return res.status(404).send({
			status: 'FAIL',
			message: `${hash} not found`
		})
	}
	return res.send(`http://${req.hostname}:${process.env.WEB_API_PORT}/Marti/api/sync/metadata/${hash}/tool`)
})

router.post('/Marti/sync/missionupload', upload.single('assetfile'), async (req, res) => {
	console.debug(`Received data package post`, req.file)
	if (!req.file) {
		return res.status(400).send({
			status: 'FAIL',
			message: `Data package missing`
		})
	}
	const hash = req.query.hash
	//const filename = req.query.filename
	//const creatorUid = req.query.creatorUid
	await fs.rename(path.join(dataPackageStorage, req.file.filename), path.join(dataPackageStorage, hash))

	return res.send({status: 'OK'})
})

router.get('/Marti/sync/search', async (req, res) => {
	const keywords = req.query.keywords
	const tool = req.query.tool
	const dataPackages = await fs.readdir(dataPackageStorage)
	const packages = []
	for (let i = 0; i < dataPackages.length; i++) {
		const dataPackage = dataPackages[i]
		const stat = await fs.stat(path.join(dataPackageStorage, dataPackage))
		packages.push({
			UID: dataPackage,
			Name: dataPackage,
			Hash: dataPackage,
			PrimaryKey: i + 1,
			SubmissionDateTime: stat.mtime,
			SubmissionUser: 'server',
			CreatorUid: 'server-uid',
			Keywords: 'datapackage',
			MIMEType: '[application/x-zip-compressed]',
			Size: stat.size
		})
	}
	return res.send({
		resultCount: dataPackages.length,
		results: packages
	})
})

module.exports = router
