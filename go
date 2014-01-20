#!/bin/bash

gunicorn -k flask_sockets.worker webapp:app