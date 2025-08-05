# Bazinga! - The Multiplayer Trivia & Deception Game

Bazinga! is a real-time multiplayer trivia game where the objective isn't just to know the right answer, but to fool your friends with your own creative and believable wrong answers. Inspired by games like Jackbox's Fibbage, Bazinga! challenges players to blend in their fake answers with the real one, and then vote on which they think is correct.

This project is a full-stack application built with a modern tech stack, designed to be a fun and engaging social experience. It showcases a robust backend with real-time capabilities and a dynamic, responsive frontend.

## 🚀 Live Demo

**https://d3vo4ljtpenzam.cloudfront.net/**

## ✨ Features

*   **Real-time Multiplayer:** Play with friends in real-time, with updates instantly synced across all players.
*   **Create & Join Rooms:** Easily create a new game room and share the code with friends to join.
*   **Hybrid Question System:** The game uses a hybrid approach for questions. It first serves questions from a pre-cached list to ensure speed and reliability. If the cache is exhausted for a given theme, it dynamically generates new, unique questions using the **Google Gemini API** to ensure the game never gets stale.
*   **Deception is Key:** Invent your own answers to trivia questions to trick other players.
*   **Voting System:** Vote for the answer you think is correct. You get points for guessing the right answer, and for every player you fool with your fake answer.
*   **Live Leaderboard:** Track scores and see who's in the lead after each round.
*   **Host-Controlled Gameplay:** The room's host controls the flow of the game, starting the game and advancing to the next question.

## 🎮 How to Play

1.  **Create a Room:** One player hosts a game and chooses a theme for the questions.
2.  **Join the Room:** Other players join using the unique room code.
3.  **Answer the Question:** A trivia question is displayed. Everyone (except one player, in some rounds) submits a fake answer to fool others. The real answer is automatically added to the pool.
4.  **Vote:** All the answers (the real one and all the fakes) are displayed. Players vote for the one they believe is correct.
5.  **Score:**
    *   You get points if you guess the correct answer.
    *   You get points for every player who votes for your fake answer.
6.  **Rinse and Repeat:** The player with the most points at the end of the game wins!

## 🛠️ Tech Stack

### **Backend**

*   **Framework:** [FastAPI](https://fastapi.tiangolo.com/)
*   **Database:** [MySQL](https://www.mysql.com/)
*   **ORM:** [SQLAlchemy](https://www.sqlalchemy.org/) with Alembic for migrations
*   **Real-time Communication:** [WebSockets](https://fastapi.tiangolo.com/advanced/websockets/)
*   **Real-time State & Connection Management:** [Redis](https://redis.io/) - Manages live game state, tracks active players in rooms, and facilitates pub/sub messaging for game events.
*   **AI-Powered Questions:** [Google Gemini API](https://ai.google.dev/)
*   **Deployment:** [Docker](https://www.docker.com/) & [Docker Compose](https://docs.docker.com/compose/)

### **Frontend**

*   **Framework:** [React](https://reactjs.org/) with [Vite](https://vitejs.dev/)
*   **Language:** [TypeScript](https://www.typescriptlang.org/)
*   **UI:** [Material-UI (MUI)](https://mui.com/)
*   **Styling:** [Emotion](https://emotion.sh/) & [Tailwind CSS](https://tailwindcss.com/)

## 🚀 Getting Started

### Prerequisites

*   [Docker](https://www.docker.com/get-started) and [Docker Compose](https://docs.docker.com/compose/install/)
*   A Google Gemini API Key.

### Installation & Running the App

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/your-username/bazingaa.git
    cd bazingaa
    ```

2.  **Set up your environment variables:**
    Create a `.env` file in the `backend` directory and add your Google Gemini API key:
    ```
    # backend/.env
    GOOGLE_API_KEY=your_google_api_key
    ```

3.  **Build and run the application with Docker Compose:**
    ```bash
    docker-compose up --build
    ```

4.  **Access the application:**
    *   The **Frontend** will be available at `http://localhost:5173` (as configured in `vite.config.ts`).
    *   The **Backend API** will be available at `http://localhost:8000`.
    *   The **API docs** (Swagger UI) will be at `http://localhost:8000/docs`.

## 📁 Project Structure

```
bazingaa/
├── backend/
│   ├── alembic/         # Database migrations
│   ├── routers/         # API endpoint definitions
│   ├── services/        # Business logic (e.g., Gemini API)
│   ├── crud.py          # Database CRUD operations
│   ├── database.py      # Database session management
│   ├── main.py          # FastAPI app entrypoint
│   ├── models.py        # SQLAlchemy models
│   ├── schemas.py       # Pydantic schemas
│   └── websocket.py     # WebSocket connection manager
├── frontend/
│   ├── src/
│   │   ├── components/  # React components
│   │   ├── App.tsx      # Main application component
│   │   └── main.tsx     # React app entrypoint
│   └── vite.config.ts   # Vite configuration
├── docker-compose.yml   # Docker services orchestration
└── README.md
```

## 🔗 API Endpoints

The main API endpoints are defined in `backend/routers/rooms.py`.

*   `POST /rooms/`: Create a new game room.
*   `POST /rooms/{room_code}/join`: Join an existing game room.
*   `POST /rooms/{room_code}/next_question/{user_id}`: (Host only) Advance to the next question.
*   `GET /rooms/themes`: Get the available themes for the game.
*   `WS /rooms/ws/{room_code}/{user_id}`: WebSocket endpoint for real-time communication.

For more details, run the application and visit the auto-generated docs at `http://localhost:8000/docs`.
