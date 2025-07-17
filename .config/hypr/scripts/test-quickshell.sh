#!/bin/bash

echo "🔍 Quickshell Debug Information"
echo "================================"

# Check if quickshell is installed
echo "1. Checking if quickshell is installed..."
if command -v quickshell &> /dev/null; then
    echo "✅ quickshell found: $(which quickshell)"
    echo "   Version: $(quickshell --version 2>/dev/null || echo 'Version info not available')"
else
    echo "❌ quickshell not found in PATH"
    echo "   Please install it with: yay -S quickshell-git"
    exit 1
fi

# Check if config files exist
echo ""
echo "2. Checking configuration files..."
if [ -f ~/.config/quickshell/shell.qml ]; then
    echo "✅ Main config found: ~/.config/quickshell/shell.qml"
else
    echo "❌ Main config not found: ~/.config/quickshell/shell.qml"
fi

if [ -f ~/.config/quickshell/test-shell.qml ]; then
    echo "✅ Test config found: ~/.config/quickshell/test-shell.qml"
else
    echo "❌ Test config not found: ~/.config/quickshell/test-shell.qml"
fi

# Test with simple config
echo ""
echo "3. Testing with simple configuration..."
echo "   Running: quickshell"
echo "   (This should open the panel using the default shell.qml)"
echo "   Press Ctrl+C to stop the test"
echo ""

quickshell
