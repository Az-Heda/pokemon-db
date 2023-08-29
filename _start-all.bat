@echo off
cls

::----------------------   Variabili   ----------------------::
set surrealUser=root
set surrealPassword=root
set surrealFile=file:anime
set terminalName="AnimeListSDB"
set defaultDir="%cd%"
set waitTime1=10
set waitTime2=20
::-----------------------------------------------------------::



::--------------------   Prima scheda    --------------------::
set command1=surreal start --user %surrealUser% --pass %surrealPassword% %surrealFile%
set color1=#ff80ff
set title1="Surreal"
set dir1=%defaultDir%
::-----------------------------------------------------------::



::-------------------   Seconda scheda   --------------------::
set command2=npm start
set color2=#bb99ff
set title2="Anime list"
set dir2=%defaultDir%
::-----------------------------------------------------------::


::---------------------   Terminale   -----------------------::
wt -w %terminalName% nt -d %dir1% --tabColor %color1% --title %title1% PowerShell -c %command1%
timeout /T %waitTime1% /NOBREAK
wt -w %terminalName% nt -d %dir2% --tabColor %color2% --title %title2% PowerShell -c %command2%

wt -w %terminalName% ft -t 1