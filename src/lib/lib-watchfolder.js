/* jshint node: true */
'use strict'
const _module = require('path').basename(__filename)

let chokidar = require('chokidar')
// Initialize watcher.
const watcher = chokidar.watch('file, dir, glob, or array', {
    ignored: /(^|[\/\\])\../,
    persistent: true,
  });
  
  // Something to use when events are received.
  const log = console.log.bind(console);
  // Add event listeners.
  watcher
    .on('add', path => log(`File ${path} has been added`))
    .on('change', path => log(`File ${path} has been changed`))
    .on('unlink', path => log(`File ${path} has been removed`));
  
  // More possible events.
  watcher
    .on('addDir', path => log(`Directory ${path} has been added`))
    .on('unlinkDir', path => log(`Directory ${path} has been removed`))
    .on('error', error => log(`Watcher error: ${error}`))
    .on('ready', () => log('Initial scan complete. Ready for changes'))
    .on('raw', (event, path, details) => { // internal
      log('Raw event info:', event, path, details);
    });
  
  // 'add', 'addDir' and 'change' events also receive stat() results as second
  // argument when available: http://nodejs.org/api/fs.html#fs_class_fs_stats
  watcher.on('change', (path, stats) => {
    if (stats) console.log(`File ${path} changed size to ${stats.size}`);
  });
  
  // Watch new files.
  watcher.add('new-file');
  watcher.add(['new-file-2', 'new-file-3', '**/other-file*',]);
  
  // Get list of actual paths being watched on the filesystem
  var watchedPaths = watcher.getWatched();
  
  // Un-watch some files.
  watcher.unwatch('new-file*');
  
  // Stop watching.
  watcher.close();
  