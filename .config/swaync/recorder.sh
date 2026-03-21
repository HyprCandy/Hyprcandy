#!/bin/env bash

if pgrep -x "wf-recorder" > /dev/null; then
  pkill -x wf-recorder 
  sleep 0.1
  notify-send "Recorder" "Stopped " -t 2000
else
  notify-send "Recorder" "Started " -t 2000
  sleep 0.5
  bash -c 'wf-recorder -g -a --audio=bluez_output.78_15_2D_0D_BD_B7.1.monitor -f "$HOME/Videos/Recordings/recording-$(date +%Y%m%d-%H%M%S).mp4" $(slurp)'
fi
