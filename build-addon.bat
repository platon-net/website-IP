@echo off
rem cd .\src

rem copy manifest.chrome.json manifest.json
for /f "delims=" %%a in ('findstr "\"version\"" manifest.json') do @set versionrow=%%a
set version=%versionrow:~13,5%
tar -a -c -f build\chrome\WebsiteIP.%version%.zip --exclude "*.bat" --exclude "*.psd" --exclude "*.eps" --exclude "manifest.chrome.json" --exclude "manifest.firefox.json" --exclude ".git" --exclude "build" --exclude "test" *

rem copy manifest.firefox.json manifest.json
for /f "delims=" %%a in ('findstr "\"version\"" manifest.json') do @set versionrow=%%a
set version=%versionrow:~13,5%
tar -a -c -f build\firefox\WebsiteIP.%version%.zip --exclude "*.bat" --exclude "*.psd" --exclude "*.eps" --exclude "manifest.chrome.json" --exclude "manifest.firefox.json" --exclude ".git" --exclude "build" --exclude "test" *
copy build\firefox\WebsiteIP.%version%.zip build\firefox\WebsiteIP.%version%.xpi
del build\firefox\WebsiteIP.%version%.zip

rem cd ..
pause
