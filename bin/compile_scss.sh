#!/bin/bash

# cd to top of git
cd $(git rev-parse --show-toplevel)

sass --sourcemap=none scss/style.scss css/style.css
sass --sourcemap=none scss/social.scss css/social.css
sass --sourcemap=none scss/projects.scss css/projects.css