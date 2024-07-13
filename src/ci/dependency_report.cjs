/* eslint-disable */
const fs = require('fs');

const bundle = process.argv[2];
const dir = bundle + "/assets/";
const extension = ".map";
const mapFiles = fs.readdirSync(dir).filter(fn => fn.endsWith(extension));

report = [];
for (const mapFile of mapFiles) {
    var mapFileData = JSON.parse(fs.readFileSync(dir + mapFile, 'utf8'));
    assetFile = mapFile.replace(extension, "");
    report.push({ "asset": assetFile, "size": fs.statSync(dir + assetFile).size, "sources": mapFileData.sources});
    fs.unlinkSync(dir + mapFile);
}
report.sort((b, a) => a.size - b.size).forEach(entry => {
    console.log(entry.asset + " " + (entry.size / 1024).toFixed(2) + "KB");
    for (const source of entry.sources) {
        console.log("  " + source);
    }
});