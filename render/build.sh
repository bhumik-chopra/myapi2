#!/usr/bin/env bash
# Exit on error
set -o errexit

# Create static directory if it doesn't exist
mkdir -p static

# Install dependencies
pip install -r requirements.txt