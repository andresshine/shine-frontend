# Aider + Gemini Setup Guide

✅ **Aider is installed and ready to use!**

## 🚀 How to Launch

### Option 1: Using the alias (Recommended)

Open a **NEW terminal** and run:

```bash
# Reload your shell config
source ~/.zshrc

# Navigate to Shine
cd ~/shine/shine-frontend

# Launch Aider with Gemini
aider-gemini
```

### Option 2: Using the script directly

```bash
cd ~/shine/shine-frontend
./start-aider-gemini.sh
```

### Option 3: Manual command

```bash
cd ~/shine/shine-frontend
GEMINI_API_KEY=AIzaSyAH2sbhjkr_PZwaT1gGiN0gRv6d_99i2c8 \
/Users/andres/Library/Python/3.9/bin/aider \
  --model gemini/gemini-2.5-flash \
  --no-auto-commits \
  --dark-mode
```

---

## 💡 What to Try First

Once Aider starts, try these commands:

### 1. Get an overview
```
Explain what this codebase does at a high level
```

### 2. Ask about specific components
```
How does the video recording work in this app?
Explain the interview flow
What does the RecordingControls component do?
```

### 3. Request code changes
```
Add better error handling to the Mux upload
Refactor the Gemini client to use async/await
Add TypeScript types to all API routes
```

### 4. Debug issues
```
Why might I get CORS errors in production?
How can I improve the video quality?
```

---

## 📋 Useful Aider Commands

| Command | Description |
|---------|-------------|
| `/help` | Show all available commands |
| `/add <file>` | Add a file to the conversation context |
| `/drop <file>` | Remove a file from context |
| `/ls` | List files currently in context |
| `/diff` | Show pending changes before applying |
| `/undo` | Undo the last change |
| `/commit` | Commit changes to git |
| `/clear` | Clear conversation history |
| `/exit` or `Ctrl+D` | Quit Aider |

---

## 🎯 Your Dual AI Setup

You now have **TWO AI coding assistants**:

### Claude Code (Terminal where you started)
- ✅ Full codebase access
- ✅ Can read, write, edit files
- ✅ Conversation memory across the project
- ✅ Best for: Interactive development, planning, debugging

### Aider + Gemini (New Terminal)
- ✅ Full codebase access
- ✅ Can read, write, edit files
- ✅ Git integration
- ✅ Best for: Second opinions, different approaches, when stuck

### Quick Gemini (Any Terminal)
```bash
gemini "your question"
```
- ✅ Quick terminal questions
- ✅ No file context needed
- ✅ Best for: Syntax help, concept explanations

---

## ✨ Example Workflow

**Terminal 1: Claude Code** (this one)
```
You: "I need to add pagination to the questions list"
Claude: [Plans, implements, tests the feature]
```

**Terminal 2: Aider + Gemini**
```bash
aider-gemini

You: Review the pagination code and suggest improvements
Gemini: [Analyzes the code, suggests optimizations]
```

**Terminal 3: Quick Questions**
```bash
gemini "Best practices for React pagination?"
```

---

## 🔧 Troubleshooting

### If `aider-gemini` command not found:
```bash
source ~/.zshrc
```

### If you get SSL warnings:
These are safe to ignore - they don't affect functionality.

### If Gemini API fails:
Check that the API key is set in the script at:
`/Users/andres/shine/shine-frontend/start-aider-gemini.sh`

---

## 🎉 You're Ready!

Open a new terminal and type:
```bash
aider-gemini
```

Then ask: **"Give me an overview of this Shine codebase"**

Happy coding! 🚀
