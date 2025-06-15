#!/bin/bash

# Load testing script for Certificate Verification System
# This script runs k6 load tests against the application

# Set default environment variables
API_URL=${API_URL:-"http://localhost:3000"}
OUTPUT_DIR=${OUTPUT_DIR:-"./load-test-results"}
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")

# Create output directory if it doesn't exist
mkdir -p "$OUTPUT_DIR"

# Check if k6 is installed
if ! command -v k6 &> /dev/null; then
    echo "k6 is not installed. Installing k6..."
    
    # Install k6 based on OS
    if [[ "$OSTYPE" == "linux-gnu"* ]]; then
        # Linux
        curl -s https://packagecloud.io/install/repositories/k6/k6/script.deb.sh | sudo bash
        sudo apt-get install k6
    elif [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        brew install k6
    else
        echo "Unsupported OS. Please install k6 manually: https://k6.io/docs/getting-started/installation/"
        exit 1
    fi
fi

# Function to run a load test
run_test() {
    local test_file=$1
    local test_name=$(basename "$test_file" .js)
    local output_file="$OUTPUT_DIR/${test_name}_${TIMESTAMP}.json"
    
    echo "Running load test: $test_name"
    echo "API URL: $API_URL"
    echo "Output file: $output_file"
    
    # Run the test with k6
    API_URL=$API_URL k6 run --out json="$output_file" "$test_file"
    
    # Check if test was successful
    if [ $? -eq 0 ]; then
        echo "✅ Test completed successfully: $test_name"
    else
        echo "❌ Test failed: $test_name"
    fi
    
    echo "----------------------------------------"
}

# Main execution
echo "=== Certificate Verification System Load Testing ==="
echo "Starting load tests at $(date)"
echo "----------------------------------------"

# Run certificate verification test
run_test "$(dirname "$0")/certificate-verification.js"

# Run certificate generation test
run_test "$(dirname "$0")/certificate-generation.js"

echo "=== Load Testing Complete ==="
echo "Results saved to: $OUTPUT_DIR"
echo "Run 'k6 report <result-file.json>' to view detailed HTML reports"