#!/bin/bash

# Fix dependencies script for Certificate Verification System
# This script helps identify and fix missing dependencies

echo "=== Certificate Verification System Dependency Fixer ==="
echo "Starting dependency check at $(date)"
echo "----------------------------------------"

# Check if pnpm is installed
if ! command -v pnpm &> /dev/null; then
    echo "pnpm is not installed. Please install pnpm with 'npm install -g pnpm'."
    exit 1
fi

# Check for package.json
if [ ! -f package.json ]; then
    echo "package.json not found. Please run this script from the project root directory."
    exit 1
fi

# Check for node_modules
if [ ! -d node_modules ]; then
    echo "node_modules directory not found. Installing dependencies..."
    pnpm install
else
    echo "node_modules directory found. Checking for missing dependencies..."
fi

# Check for missing dependencies
echo "Running pnpm check..."
pnpm ls --depth=0 2>&1 | grep -i "missing\|invalid\|extraneous" > /tmp/pnpm_check_output

if [ -s /tmp/pnpm_check_output ]; then
    echo "Found dependency issues:"
    cat /tmp/pnpm_check_output
    
    echo "Fixing dependencies..."
    pnpm install
    
    # Check if there are still issues
    pnpm ls --depth=0 2>&1 | grep -i "missing\|invalid\|extraneous" > /tmp/pnpm_check_output
    
    if [ -s /tmp/pnpm_check_output ]; then
        echo "There are still dependency issues. Trying a clean install..."
        rm -rf node_modules pnpm-lock.yaml
        pnpm store prune
        pnpm install
    fi
else
    echo "No dependency issues found."
fi

# Check for TypeScript errors
echo "Checking for TypeScript errors..."
pnpm tsc --noEmit

# Check for Next.js build issues
echo "Checking for Next.js build issues..."
if [ -d .next ]; then
    echo "Clearing Next.js cache..."
    rm -rf .next
fi

# Check for Prisma client
echo "Checking for Prisma client..."
if [ ! -d node_modules/.prisma ]; then
    echo "Prisma client not found. Generating..."
    pnpm prisma generate
else
    echo "Prisma client found."
fi

echo "----------------------------------------"
echo "Dependency check and fix completed!"
echo "If you still have issues, try running the application with Docker:"
echo "./scripts/start-dev.sh"
echo "----------------------------------------"