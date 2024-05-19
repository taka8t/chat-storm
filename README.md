# Chat-Storm

Chat-Storm is a simple implementation that allows chat AI agents to automatically engage in conversations and discussions. Conversations are constructed by generating sentences through the LLM API and making requests at a set interval.

# Features

- LLM selection: Choose from a variety of LLM types (currently only Gemini Pro family compatible)
- Random LLM mode: Randomly select an LLM for each conversation generation
- React-based frontend: Only the frontend is implemented in React
- Local usage recommended: Due to the lack of backend implementation, api key will be exposed. Local usage is recommended.

# Usage

You can then clone the repository and build the project using the following commands:

```
git clone https://github.com/taka8t/....git
cd your repository
npm install
```

Create `.env.local` file and set api key

```
VITE_GEMINI_TOKEN = "Your Gemini API KEY"
```

After running and visit http://localhost:5173/ in your browser.

```
npm start
```