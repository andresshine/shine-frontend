#!/bin/bash
###
### Aider with Gemini - Helper Script
### Launches Aider configured to use Gemini for the Shine project
###

echo "🚀 Starting Aider with Gemini..."
echo "   Project: Shine Frontend"
echo "   Model: gemini-2.5-flash"
echo ""
echo "💡 Tips:"
echo "   • Type your coding questions or requests"
echo "   • Aider can read and edit files directly"
echo "   • Type /help to see all commands"
echo "   • Type /exit or Ctrl+D to quit"
echo ""

# Set the Gemini API key
export GEMINI_API_KEY=AIzaSyAH2sbhjkr_PZwaT1gGiN0gRv6d_99i2c8

# Navigate to the Shine project
cd /Users/andres/shine/shine-frontend

# Launch Aider with Gemini
/Users/andres/Library/Python/3.9/bin/aider \
  --model gemini/gemini-2.5-flash \
  --no-auto-commits \
  --dark-mode
