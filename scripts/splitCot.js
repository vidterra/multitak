const {cot} = require('@vidterra/tak.js')
const helper = require('../app/lib/helper')

const message = `<event version="2.0" type="t-x-d-d" uid="tak-web-map" time="2021-08-24T17:28:42.299Z" start="2021-08-24T17:28:42.299Z" stale="2021-08-24T17:32:52.299Z" how="m-g"/>`
const result = helper.findCotTcp(message)
console.log(result)
cot.xml2js(result.event)