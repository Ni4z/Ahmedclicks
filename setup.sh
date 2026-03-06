#!/bin/bash

# Ahmed Photography Portfolio - Setup Script
# This script automates the setup process

set -e

echo "🎨 Ahmed Photography Portfolio - Setup"
echo "========================================"
echo ""

# Check Node.js version
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed"
    echo "Please install Node.js 18+ from https://nodejs.org"
    exit 1
fi

NODE_VERSION=$(node -v)
echo "✓ Node.js $NODE_VERSION detected"

# Navigate to project directory
cd "$(dirname "$0")" || exit

# Install dependencies
echo ""
echo "📦 Installing dependencies..."
npm install

echo ""
echo "✓ Dependencies installed successfully!"

# Create .env.local file if it doesn't exist
if [ ! -f .env.local ]; then
    echo ""
    echo "📝 Creating .env.local file..."
    cp .env.example .env.local
    echo "✓ Created .env.local - update with your values"
fi

# Display next steps
echo ""
echo "✅ Setup Complete!"
echo ""
echo "Next steps:"
echo "1. Update your photos in data/portfolio.ts"
echo "2. Update site info in app/layout.tsx"
echo "3. Start development server:"
echo ""
echo "   npm run dev"
echo ""
echo "4. Visit http://localhost:3000"
echo ""
echo "For more info, see QUICKSTART.md"
echo ""
