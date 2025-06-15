#!/bin/bash

# Security scanning script for Certificate Verification System
# This script runs various security scans on the codebase

# Set default environment variables
OUTPUT_DIR=${OUTPUT_DIR:-"./security-scan-results"}
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")

# Create output directory if it doesn't exist
mkdir -p "$OUTPUT_DIR"

echo "=== Certificate Verification System Security Scanning ==="
echo "Starting security scans at $(date)"
echo "----------------------------------------"

# Run pnpm audit
echo "Running pnpm audit..."
pnpm audit --json > "$OUTPUT_DIR/pnpm-audit_${TIMESTAMP}.json"
if [ $? -eq 0 ]; then
    echo "✅ pnpm audit completed successfully"
else
    echo "⚠️ pnpm audit found vulnerabilities"
fi
echo "----------------------------------------"

# Check if Snyk is installed
if command -v snyk &> /dev/null; then
    echo "Running Snyk vulnerability scan..."
    snyk test --json > "$OUTPUT_DIR/snyk_${TIMESTAMP}.json"
    if [ $? -eq 0 ]; then
        echo "✅ Snyk scan completed successfully"
    else
        echo "⚠️ Snyk found vulnerabilities"
    fi
    echo "----------------------------------------"
else
    echo "⚠️ Snyk not installed. Skipping Snyk scan."
    echo "To install Snyk, run: pnpm install -g snyk"
    echo "----------------------------------------"
fi

# Run ESLint security plugin
echo "Running ESLint with security plugins..."
pnpm eslint --ext .js,.jsx,.ts,.tsx --no-eslintrc -c .eslintrc.security.js . -f json > "$OUTPUT_DIR/eslint-security_${TIMESTAMP}.json"
if [ $? -eq 0 ]; then
    echo "✅ ESLint security scan completed successfully"
else
    echo "⚠️ ESLint security scan found issues"
fi
echo "----------------------------------------"

# Run SonarQube scan if available
if command -v sonar-scanner &> /dev/null; then
    echo "Running SonarQube scan..."
    sonar-scanner
    if [ $? -eq 0 ]; then
        echo "✅ SonarQube scan completed successfully"
    else
        echo "⚠️ SonarQube scan encountered issues"
    fi
    echo "----------------------------------------"
else
    echo "ℹ️ SonarQube scanner not installed. Skipping SonarQube scan."
    echo "----------------------------------------"
fi

# Run OWASP Dependency-Check
echo "Running OWASP Dependency-Check..."
if [ ! -d "./dependency-check" ]; then
    echo "Downloading OWASP Dependency-Check..."
    mkdir -p ./dependency-check
    curl -L https://github.com/jeremylong/DependencyCheck/releases/download/v7.4.4/dependency-check-7.4.4-release.zip -o ./dependency-check/dependency-check.zip
    unzip ./dependency-check/dependency-check.zip -d ./dependency-check
    rm ./dependency-check/dependency-check.zip
fi

./dependency-check/bin/dependency-check.sh --scan . --out "$OUTPUT_DIR/dependency-check_${TIMESTAMP}" --format "ALL"
if [ $? -eq 0 ]; then
    echo "✅ OWASP Dependency-Check completed successfully"
else
    echo "⚠️ OWASP Dependency-Check found vulnerabilities"
fi
echo "----------------------------------------"

# Check for secrets in the codebase
echo "Checking for secrets in the codebase..."
if command -v gitleaks &> /dev/null; then
    gitleaks detect --report-path="$OUTPUT_DIR/gitleaks_${TIMESTAMP}.json" --report-format=json
    if [ $? -eq 0 ]; then
        echo "✅ No secrets found in the codebase"
    else
        echo "⚠️ Potential secrets found in the codebase"
    fi
else
    echo "ℹ️ Gitleaks not installed. Using grep for basic secret detection."
    grep -r -E "(api[_-]?key|token|secret|password|credential)" --include="*.{js,ts,jsx,tsx,json,yml,yaml}" . > "$OUTPUT_DIR/secrets-grep_${TIMESTAMP}.txt"
    if [ -s "$OUTPUT_DIR/secrets-grep_${TIMESTAMP}.txt" ]; then
        echo "⚠️ Potential secrets found in the codebase"
    else
        echo "✅ No obvious secrets found in the codebase"
    fi
fi
echo "----------------------------------------"

echo "=== Security Scanning Complete ==="
echo "Results saved to: $OUTPUT_DIR"
echo "Please review the results and address any vulnerabilities found."