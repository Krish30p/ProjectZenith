const fs = require('fs');
const path = require('path');

const cesiumSource = path.join(__dirname, 'node_modules', 'cesium', 'Build', 'Cesium');
const cesiumDest = path.join(__dirname, 'public', 'cesium');

const dirsToCopy = ['Workers', 'ThirdParty', 'Assets', 'Widgets'];

dirsToCopy.forEach(dir => {
  const src = path.join(cesiumSource, dir);
  const dest = path.join(cesiumDest, dir);
  console.log(`Copying ${src} to ${dest}...`);
  fs.cpSync(src, dest, { recursive: true, force: true });
});

console.log('Cesium assets copied successfully.');
