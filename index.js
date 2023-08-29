import Utils from 'azheda';
import fse from 'fs-extra';

const tempDir = 'temp';
const host = 'localhost';
const port = 7788;

console.clear();
fse.emptyDirSync(tempDir);

const server = new Utils.WebServer({ host, port });