# @module go-demo
#
# bash script to launch server under linux
#  - run pino and the logger in different  processes to get the best performance from node's single thread
#  - output warnings and errors into a separate log
#
#  MAKE SURE config.log_options.prettyPrint is OFF
#
#
# first make sure that the log folder exists
if [ ! -d "./logs" ]; then  mkdir "./logs"; fi

node src/start_local.js | node node_modules/pino-tee/tee.js warn ./logs/warning.log > ./logs/all.log