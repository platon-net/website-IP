@echo off
rem cd .\src

@REM Disabled build of Chrome - 2025-06-05 11:35:21 Igor
@REM rem copy manifest.chrome.json manifest.json
@REM for /f "delims=" %%a in ('findstr "\"version\"" manifest.json') do @set versionrow=%%a
@REM set version=%versionrow:~13,6%
@REM tar -a -c -f build\chrome\WebsiteIP.%version%.zip --exclude "*.bat" --exclude "*.psd" --exclude "*.eps" --exclude "manifest.chrome.json" --exclude "manifest.firefox.json" --exclude ".git" --exclude "build" --exclude "test" *

rem copy manifest.firefox.json manifest.json
for /f "delims=" %%a in ('findstr "\"version\"" manifest.json') do @set versionrow=%%a
set version=%versionrow:~13,5%
tar -a -c -f build\firefox\WebsiteIP.%version%.zip --exclude "*.bat" --exclude "*.psd" --exclude "*.eps" --exclude "*.md" --exclude "manifest.chrome.json" --exclude "manifest.firefox.json" --exclude ".git" --exclude ".agents" --exclude "build" --exclude "test" --exclude "lib/openapi-js-simple/tests" *
copy build\firefox\WebsiteIP.%version%.zip build\firefox\WebsiteIP.%version%.xpi
del build\firefox\WebsiteIP.%version%.zip

rem cd ..
pause
