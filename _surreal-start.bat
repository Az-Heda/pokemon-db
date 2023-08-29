@echo off

set user=root
set password=root
set file=db-pokemon-v3

wt surreal start --user %user% --pass %password% file:%file%
exit