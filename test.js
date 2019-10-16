const Qiu = require('./src/utils/QiniuManager');
const accessKey = '2rRj6bulxCJjM_Ds4Wv9tKYTSJfIqc56I99uv7g2';
const secretKey = 'z5NuBDQlmoLUXcWU4k-PsvyEcr2L4OS8dBxB1pAs';
const publicBucketDomain = 'http://pybpyklmz.bkt.clouddn.com';
const fs = require('fs');
const path = require('path');
const server = require('http').createServer();
const zlib = require('zlib');
var localFile = "/Users/sys_conf.json";
var key = '02.jpg';
const downPath = path.join(__dirname, key)
const qi = new Qiu(accessKey, secretKey, 'cloud-os');

// qi.uploadFile(key, localFile).then(data => {
//     return qi.deleteFile(key)
// }).then(data => console.log(data));
// qi.getBucketDomain().then(data => console.log(data))
// qi.generateDownLoadLink(key).then(data => {
//     console.log(data);
//     return qi.generateDownLoadLink('01.jpg')
// }).then(data => {
//     console.log(data);
// });
qi.downLoadFile(key, downPath).catch(err => console.log(err))
