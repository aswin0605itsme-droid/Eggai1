import AdmZip from "adm-zip";
import fs from "fs";
import path from "path";

const zip = new AdmZip();
const outputFile = "egg-gender-predictor.zip";

function addDirectory(dirPath, zipPath) {
  const files = fs.readdirSync(dirPath);
  for (const file of files) {
    if (file === 'node_modules' || file === '.git' || file === 'dist' || file === '.npm' || file === outputFile || file === '.DS_Store') continue;
    const fullPath = path.join(dirPath, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      zip.addLocalFolder(fullPath, zipPath ? zipPath + "/" + file : file);
    } else {
      zip.addLocalFile(fullPath, zipPath);
    }
  }
}

addDirectory(".", "");
zip.writeZip(outputFile);
console.log(`Created ${outputFile}`);
