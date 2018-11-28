
var https = require('https');
var fs = require('fs');
var _ = require('underscore');

var productId = 12078;
var jobId = 318538;

var tocUrl = `https://api.municode.com/codesToc?jobId=${jobId}&productId=${productId}`;


var allData = [];
async function main() {
	var toc = await getToc();
	var chapters = toc.Children;
	var chapterIds = _.pluck(chapters, 'Id');
	console.log(JSON.stringify(chapterIds));
	
	var promises = {};
	for(var x in chapterIds){
		var chapterData = await getChapter(chapterIds[x]);
		allData.push(chapterData);
		await getChapterContents(chapterData)
		await sleep(300);
	}
	
	var text = '';
	var html = '';
	var linkPrefix = "https://library.municode.com/va/charlottesville/codes/code_of_ordinances?nodeId=";
	_.forEach(allData,function(chapterData){
		_.forEach(chapterData.Docs,function(doc){
			text += doc.TitleHtml;
			
			if(doc.Content){
				html += `<h4><a href="${linkPrefix}${doc.Id}">`+doc.Title+'</a></h4>';
				html += doc.Content;
			}
		})
	});
	await writeFile("/data/out.json", JSON.stringify(allData));
	await writeFile("/data/out.txt", text);
	await writeFile("/data/out.html", html);
	console.log('allData',allData.length);
}

async function getChapterContents(chapterData){
	var chunks = _.pluck(chapterData.Docs, 'ChunkGroupStartingNodeId');
	chunks = _.uniq(chunks, true);
	console.log('chunks',chunks.length);
	if(chunks.length > 1){
		for(var i in chunks){
			if(chunks[i] == "[SHOW_TOC]")
				continue;
			var chapterData = await getChapter(chunks[i]);
			await getChapterContents(chapterData)
			await sleep(200);
		}
	}else{
		allData.push(chapterData);
	}
}
async function getToc(){
    return new Promise((resolve, reject) => {
		https.get(tocUrl, (res) => {
			// console.log(res);
			const statusCode = res.statusCode;

			var error;
			if (statusCode !== 200) {
				error = new Error('Request Failed.\n' +
							  `Status Code: ${statusCode}`);
			}
			if (error) {
				console.error(error.message);
				// consume response data to free up memory
				res.resume();
				return;
			}


			res.setEncoding('utf8');
			var rawData = '';
			res.on('data', (chunk) => { rawData += chunk; });
			res.on('end', () => {
				try {
					var tocObject = JSON.parse(rawData);
					// console.log(tocObject);
					resolve(tocObject);
				} catch (e) {
					console.error(e.message);
				}
			});
		}).on('error', (e) => {
			console.error(`Got error: ${e.message}`);
		});
    });
}

async function getChapter(nodeId){
	var contentUrl = `https://api.municode.com/CodesContent?jobId=${jobId}&nodeId=${nodeId}&productId=${productId}`

    return new Promise((resolve, reject) => {
		https.get(contentUrl, (res) => {
			// console.log(res);
			const statusCode = res.statusCode;

			var error;
			if (statusCode !== 200) {
				error = new Error('Request Failed.\n' +
							  `Status Code: ${statusCode}`);
			}
			if (error) {
				console.error(error.message);
				// consume response data to free up memory
				res.resume();
				return;
			}


			res.setEncoding('utf8');
			var rawData = '';
			res.on('data', (chunk) => { rawData += chunk; });
			res.on('end', () => {
				try {
					var chapterData = JSON.parse(rawData);
					console.log('chapter ',nodeId,chapterData.Docs[0].Title);
					resolve(chapterData);
				} catch (e) {
					console.error(e.message);
				}
			});
		}).on('error', (e) => {
			console.error(`Got error: ${e.message}`);
		});
    });
}

//https://stackoverflow.com/questions/40593875/using-filesystem-in-node-js-with-async-await
const readFile = (path, opts = 'utf8') =>
    new Promise((res, rej) => {
        fs.readFile(path, opts, (err, data) => {
            if (err) rej(err)
            else res(data)
        })
    })
const writeFile = (path, data, opts = 'utf8') =>
    new Promise((res, rej) => {
        fs.writeFile(path, data, opts, (err) => {
            if (err) rej(err)
            else res()
        })
    })

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

main();