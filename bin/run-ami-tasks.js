#!/usr/bin/env node
const { spawn } = require('child_process');
const worker = spawn('bash', [process.argv[2]]);

worker.stdout.on('data', (data) => {
  console.log("\x1b[45m", data.toString());
});

worker.stderr.on('data', (data,e) => {
  if (data.toString().indexOf('+') === 0) {
    console.log('\x1b[36m%s\x1b[0m', data.toString().replace(/(^|\n)[\+]*\s/g, '$1'));
  } else {
    console.log('\x1b[33m%s\x1b[0m', data.toString());
  }
});

worker.on('close', (code) => {
  console.log(`child process exited with code ${code}`);
});
