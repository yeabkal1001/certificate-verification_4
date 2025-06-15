#!/bin/bash

# Fix project script for Certificate Verification System
# This script helps fix the project to use pnpm

echo "=== Certificate Verification System Project Fixer ==="
echo "Starting project fix at $(date)"
echo "----------------------------------------"

# Check if pnpm is installed
if ! command -v pnpm &> /dev/null; then
    echo "pnpm is not installed. Installing pnpm..."
    npm install -g pnpm
fi

# Clean up existing node_modules and lock files
echo "Cleaning up existing node_modules and lock files..."
rm -rf node_modules
rm -f package-lock.json
rm -f yarn.lock
rm -f pnpm-lock.yaml

# Install dependencies with pnpm
echo "Installing dependencies with pnpm..."
pnpm install

# Generate Prisma client
echo "Generating Prisma client..."
pnpm prisma generate

echo "----------------------------------------"
echo "Project fix completed at $(date)"
echo "----------------------------------------"