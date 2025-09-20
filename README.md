# AgenticWorldGame

A 2D web-based sandbox game featuring AI-driven NPCs with advanced conversation systems, memory, and relationship tracking. Experience dynamic interactions with intelligent characters in a living world.

## 🎮 Game Features

- **Interactive 2D World**: Explore different zones including the Town Square, Library, and Workshop
- **AI-Driven NPCs**: Three unique characters with distinct personalities and goals
- **Dynamic Conversations**: LLM-powered dialogue system with contextual responses
- **Memory System**: NPCs remember past conversations and develop relationships
- **Persistent State**: Your progress and relationships are automatically saved
- **Real-time Interactions**: Smooth player movement and responsive controls

## 🤖 Meet the Characters

### Tiberius - The Scholar
*Found in the Library*
- Ancient historian seeking lost knowledge
- Passionate about preserving historical artifacts
- Offers wisdom about the world's past and hidden secrets

### Elara - The Merchant
*Found in the Town Square*
- Pragmatic trader with extensive connections
- Always looking for profitable opportunities
- Can provide valuable items and information about commerce

### Milo - The Inventor
*Found in the Workshop*
- Eccentric tinkerer creating revolutionary devices
- Enthusiastic about sharing technical knowledge
- Working on projects that could change the world

## 🎯 Controls

- **WASD** or **Arrow Keys**: Move your character
- **Approach NPCs**: Get close to start conversations
- **Click Chat Button**: Open conversation interface
- **Type Messages**: Interact naturally with AI characters

## 🚀 Quick Start

1. **Launch the Game**:
   ```bash
   npm install
   npm run dev
   ```

2. **Open in Browser**: Navigate to `http://localhost:3000`

3. **Start Playing**: Move around and talk to the NPCs!

## 🔧 AI Configuration

AI credentials and parameters are loaded from environment variables. Copy the sample file and customise it for your setup:

```bash
cp .env.example .env
# then edit .env with your preferred endpoint, key, model, etc.
```

When you run `npm run dev`, the `.env` file is transformed into `env-config.js`, which is automatically loaded by the browser. All agents will then use the provided values (endpoint, key, model, temperature and max tokens) when generating responses. Leaving the endpoint or key blank keeps the game in fallback dialogue mode.

### Example Settings

| Provider | Endpoint | API Key |
| --- | --- | --- |
| OpenAI | `https://api.openai.com/v1/chat/completions` | Your OpenAI API key |
| Local Ollama | `http://localhost:11434/v1/chat/completions` | `not-needed` |
| Custom | Your custom OpenAI-compatible endpoint | As required by your service |

You can continue to experiment by editing agent personalities in the `src/js/agents/` files or by adjusting the defaults in `.env`.

## 📁 Project Structure

```
AgenticWorldGame/
├── index.html              # Main game entry point
├── styles.css              # Game styling and UI
├── main.js                 # Game initialization and AI config
├── src/
│   ├── GameEngine.js       # Core game loop and systems
│   ├── InputManager.js     # Player input handling
│   ├── Renderer.js         # Canvas rendering system
│   ├── World.js           # World and zone management
│   ├── Zone.js            # Individual game zones
│   ├── Entity.js          # Base entity class
│   ├── Player.js          # Player character implementation
│   ├── Agent.js           # Base AI agent class
│   ├── AIAgent.js         # LLM integration layer
│   ├── AgentMemory.js     # Memory and relationship system
│   ├── ChatInterface.js   # Conversation UI system
│   ├── GamePersistence.js # Save/load functionality
│   └── agents/
│       ├── Tiberius.js    # Scholar NPC
│       ├── Elara.js       # Merchant NPC
│       └── Milo.js        # Inventor NPC
└── package.json           # Dependencies and scripts
```

## 🎨 Technical Highlights

- **Modular Architecture**: Clean separation of concerns with ES6 classes
- **Event-Driven System**: Flexible communication between game components
- **Canvas Rendering**: Smooth 2D graphics with efficient draw cycles
- **Memory System**: Sophisticated relationship and conversation tracking
- **Auto-Save**: Persistent game state using localStorage
- **Responsive UI**: Modern chat interface with typing animations

## 🔮 Expansion Possibilities

- **Additional NPCs**: Easy to add new characters with unique personalities
- **Quest System**: Build on the existing goal framework
- **Inventory Management**: Expand item interactions with Elara
- **Crafting System**: Develop Milo's invention mechanics
- **World Events**: Create dynamic storylines and scenarios
- **Multiplayer Support**: Connect multiple players in shared worlds

## 🐛 Troubleshooting

### Game Won't Load
- Check browser console for errors
- Ensure development server is running
- Verify all files are in correct directories

### NPCs Not Responding
- Check AI API configuration in `main.js`
- Verify API keys and endpoints
- Check network connectivity

### Performance Issues
- Close other browser tabs
- Check for JavaScript console errors
- Ensure adequate system memory

## 📝 Development Notes

### Adding New NPCs
1. Create new agent file in `src/agents/`
2. Extend the `Agent` base class
3. Define unique personality and goals
4. Add to zone in `World.js`
5. Register in `GameEngine.js`

### Customizing AI Behavior
- Modify personality traits in agent constructors
- Adjust conversation context in `AIAgent.js`
- Tune memory parameters in `AgentMemory.js`

### Visual Customization
- Update colors and styles in `styles.css`
- Modify rendering in `Renderer.js`
- Add new animations in entity classes

## 🤝 Contributing

This is a proof-of-concept project demonstrating AI-driven game characters. Feel free to:
- Add new NPCs and storylines
- Enhance the memory system
- Improve visual elements
- Optimize performance
- Add new game mechanics

## 📜 License

This project is provided as-is for educational and demonstration purposes. Use the concepts and code to build your own AI-powered games!

---

**Ready to explore a world where every conversation matters?** 🌟

Start the game and discover what Tiberius knows about ancient mysteries, what deals Elara might offer, and what incredible inventions Milo is working on. Your choices and conversations will shape unique relationships with each character.

*The adventure begins with a single step into the Town Square...*