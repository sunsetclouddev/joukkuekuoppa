#! /bin/bash

find . \( -name '*.ts' -o -name '*.vue' \) -not -path "*/node_modules/*" | xargs wc -l | sort -n -r
