#!/bin/bash

# Quick Setup Script cho AI Chatbot
echo "🤖 Setting up AI Chatbot..."

# Check if .env exists
if [ ! -f .env ]; then
    echo "📝 Creating .env file..."
    cp .env.example .env
    echo "✅ .env file created!"
    echo ""
    echo "⚠️  IMPORTANT: Edit .env file and add your Gemini API key:"
    echo "   VITE_GEMINI_API_KEY="
    echo ""
    echo "📍 Get API key from: https://makersuite.google.com/app/apikey"
else
    echo "✅ .env file already exists"
fi

echo ""
echo "🎉 Setup complete! Next steps:"
echo "   1. Edit .env and add your VITE_GEMINI_API_KEY"
echo "   2. Run: npm run dev"
echo "   3. Open browser and test chat widget!"
