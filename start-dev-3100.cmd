@echo off
cd /d "C:\Users\Windows\Documents\New project"
"C:\Program Files\nodejs\npm.cmd" run dev -- --port 3100 > ".next-dev-restart.log" 2> ".next-dev-restart.err.log"
