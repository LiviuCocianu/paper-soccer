import fs from "fs"

fs.copyFile('./constants.js', '../paper-soccer/src/constants.js', (err) => {
    if (err) throw err;
    console.log('Constants synced with client successfully!');
});