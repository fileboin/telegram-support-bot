'use strict';

const fs = require('fs');
const path = require('path');

const compiledEntrypoint = path.join(__dirname, 'build', 'index.js');

if (!fs.existsSync(compiledEntrypoint)) {
  throw new Error(
    'Compiled entrypoint build/index.js was not found. Run the build step before starting the app.'
  );
}

require(compiledEntrypoint);
