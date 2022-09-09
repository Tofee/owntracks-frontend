#!/bin/bash

yarn install && yarn build

scp -r dist/* rpi4:/var/www/html/owntracks

