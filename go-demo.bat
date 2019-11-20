@echo off
rem @module go-demo.bat
rem
rem start the server and redirect the output to the logs folder
rem
rem MAKE SURE config.log_options.prettyPrint is OFF
rem
node src\start_local.js > logs\all-logs-win.log