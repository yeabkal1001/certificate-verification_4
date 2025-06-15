#!/bin/bash

# Bundle analysis script for Certificate Verification System
# This script analyzes the bundle size and generates reports

echo "=== Certificate Verification System Bundle Analysis ==="
echo "Starting bundle analysis at $(date)"
echo "----------------------------------------"

# Check if Next.js is installed
if ! command -v next &> /dev/null; then
    echo "Next.js CLI not found. Make sure you're in the project directory and Next.js is installed."
    exit 1
fi

# Set environment variables for bundle analysis
export ANALYZE=true

# Build the application with bundle analyzer
echo "Building application with bundle analyzer..."
next build

echo "----------------------------------------"
echo "Bundle analysis complete!"
echo "Open the browser to view the bundle analysis report."
echo "Server-side bundles: http://localhost:8888"
echo "Client-side bundles: http://localhost:8889"
echo "----------------------------------------"

# Keep the analysis server running
echo "Press Ctrl+C to stop the analysis server."
sleep infinity