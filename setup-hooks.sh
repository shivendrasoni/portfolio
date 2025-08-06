#!/bin/bash

echo "🔧 Setting up Git hooks for automatic README updates..."

# Check if .git directory exists
if [ ! -d ".git" ]; then
    echo "❌ Error: This is not a Git repository. Please run 'git init' first."
    exit 1
fi

# Create .git/hooks directory if it doesn't exist
mkdir -p .git/hooks

# Copy the pre-commit hook
if [ -f ".githooks/pre-commit" ]; then
    cp .githooks/pre-commit .git/hooks/pre-commit
    chmod +x .git/hooks/pre-commit
    echo "✅ Pre-commit hook installed successfully!"
else
    echo "❌ Error: .githooks/pre-commit not found."
    exit 1
fi

# Test if git remote exists
REMOTE_URL=$(git config --get remote.origin.url 2>/dev/null)
if [ -z "$REMOTE_URL" ]; then
    echo "⚠️  Warning: No remote origin URL found."
    echo "   Add a remote origin with: git remote add origin <your-repo-url>"
else
    echo "✅ Remote origin found: $REMOTE_URL"
fi

echo ""
echo "🎉 Setup complete! The pre-commit hook will now automatically update"
echo "   the Vercel deploy button URL to match your repository."
echo ""
echo "💡 Next time you commit, the README.md will be automatically updated"
echo "   if the deploy button URL doesn't match your current repository."