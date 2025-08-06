# Terminal Portfolio 🚀

A modern, interactive terminal-style portfolio built with React, TypeScript, and Vite. Create your own personalized terminal portfolio with AI-powered features in just a few steps!

## ✨ Features

- **Interactive Terminal Interface** - Navigate through your portfolio using terminal commands
- **AI-Powered Chat** - Built-in AI assistant to answer questions about your experience
- **Modern Tech Stack** - React 18, TypeScript, Tailwind CSS, and Vite
- **Responsive Design** - Works beautifully on desktop and mobile
- **Easy Customization** - Simple JSON-based configuration
- **One-Click Deployment** - Deploy to Vercel with a single click

## 🚀 Quick Start

### Step 1: Fork & Star the Repository

1. **Star this repository** ⭐ (OPTIONAL: But I would really appreciate it!)
2. **Fork this repository** to your GitHub account
3. Clone your forked repository:
   ```bash
   git clone https://github.com/YOUR_USERNAME/portfolio.git
   cd portfolio
   ```

### Step 2: Customize Your Personal Data

Open `src/artifacts/index.tsx` and find the `PERSONAL_DATA` constant (around line 18). Update it with your information:

```typescript
const PERSONAL_DATA = {
  name: "Your Full Name",
  title: "Your Professional Title",
  location: "Your City, State, Country",
  email: "your.email@example.com",
  linkedin: "linkedin.com/in/yourusername",
  blog: "yourblog.com", // optional
  topmate: "topmate.io/yourusername", // optional
  summary: "Your professional summary...",
  skills: ["Skill 1", "Skill 2", "Skill 3", "etc."],
  experience: [
    {
      company: "Company Name",
      role: "Your Role",
      period: "Start Date - End Date",
      location: "Location", // optional
      highlights: ["Achievement 1", "Achievement 2"] // optional
    }
    // Add more experience entries...
  ],
  education: "Your Educational Background",
  awards: ["Award 1", "Award 2"] // optional
};
```

#### 💡 Pro Tip: Use AI to Generate Your Data

Don't want to manually format your information? Here's a smart approach:

1. **Download your LinkedIn profile as PDF**
2. **Upload it to ChatGPT, Claude, or any LLM** with this prompt:
   ```
   Convert this profile (downloaded from linkedin) attached as a pdf to a well structured JSON object matching this exact format:

   {
     name: "Your Full Name",
     title: "Your Professional Title",
     location: "Your City, State, Country",
     email: "your.email@example.com",
     linkedin: "linkedin.com/in/yourusername",
     blog: "yourblog.com",
     topmate: "topmate.io/yourusername",
     summary: "Your professional summary and key achievements...",
     skills: ["Skill 1", "Skill 2", "Skill 3", "etc."],
     experience: [
       {
         company: "Company Name",
         role: "Your Role",
         period: "Start Date - End Date",
         location: "Location",
         highlights: ["Achievement 1", "Achievement 2"]
       }
     ],
     education: "Your Educational Background",
     awards: ["Award 1", "Award 2"]
   }

   Please extract all relevant information from my LinkedIn profile pdf and format it exactly like this structure.
   ```
3. **Copy the generated JSON** and replace the `PERSONAL_DATA` object

### Step 3: Commit Your Changes

```bash
git add .
git commit -m "Update personal information"
git push origin main
```

### Step 4: Set Up OpenAI API Key (Required for AI Features)

The portfolio includes an AI-powered chat feature. You'll need to set up an API key:

#### 🆓 Get a Free API Key from OpenRouter

1. **Visit [OpenRouter](https://openrouter.ai/)** and create a free account
2. **Navigate to the API Keys section** and generate a new key
3. **Copy your API key** - you'll need it for deployment

#### 🔧 Add Environment Variable

When deploying to Vercel (next step), you'll need to add this environment variable:

- **Variable Name:** `VITE_OPENAI_API_KEY`
- **Variable Value:** Your OpenRouter API key

### Step 5: Deploy to Vercel

Click the deploy button below and follow the prompts:

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/shivendrasoni/portfolio)

**Important Steps:**
1. **Update the repository URL** to point to **your forked repository**:
   ```markdown
   [![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/shivendrasoni/portfolio)
   ```

2. **During deployment**, when prompted for environment variables, add:
   - **Name:** `VITE_OPENAI_API_KEY`
   - **Value:** Your OpenRouter API key from Step 4

### Step 6: You're Done! 🎉

Your portfolio is now live! The terminal interface will automatically use your name and information.

## 🛠️ Local Development

Want to customize further or run locally?

```bash
# Install dependencies
npm install

# Create a .env file and add your OpenRouter API key
echo "VITE_OPENAI_API_KEY=your_openrouter_api_key_here" > .env

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

**Note:** The AI chat feature requires the `VITE_OPENAI_API_KEY` environment variable. Get your free API key from [OpenRouter](https://openrouter.ai/).

## 🎮 Terminal Commands

Once deployed, users can interact with your portfolio using these commands:

- `help` - Show available commands
- `about` - Display your summary
- `experience` - Show work experience
- `skills` - List your skills
- `education` - Show educational background
- `contact` - Display contact information
- `awards` - Show achievements and awards
- `clear` - Clear the terminal
- `/portfolio` - Switch to visual portfolio view
- `ask [question]` - Ask AI about your experience

## 🎨 Customization

### Styling
- Edit `src/index.css` for global styles
- Modify Tailwind classes in components
- Update `tailwind.config.mjs` for theme customization

### Adding Features
- The project uses modern React with hooks
- Components are in `src/components/`
- UI components from shadcn/ui are available in `src/components/ui/`

### AI Configuration
- The AI feature requires an OpenAI API key
- Users can add their own API key through the terminal interface
- Modify the AI prompts in the component for different behaviors

## 📁 Project Structure

```
├── src/
│   ├── artifacts/
│   │   └── index.tsx          # Main terminal component & PERSONAL_DATA
│   ├── components/
│   │   ├── ui/                # shadcn/ui components
│   │   └── layout.tsx         # Layout component
│   ├── lib/
│   │   └── utils.ts           # Utility functions
│   └── main.tsx               # App entry point
├── public/                    # Static assets
├── vercel.json               # Vercel deployment config
└── package.json              # Dependencies & scripts
```

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with [Vite](https://vitejs.dev/) and [React](https://reactjs.org/)
- UI components from [shadcn/ui](https://ui.shadcn.com/)
- Styled with [Tailwind CSS](https://tailwindcss.com/)
- AI powered by [OpenAI](https://openai.com/)

---

⭐ **Don't forget to star this repository if you found it helpful!**

Made with ❤️ by developers, for developers.
