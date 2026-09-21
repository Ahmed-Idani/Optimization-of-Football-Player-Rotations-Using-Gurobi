

# ⚽ Optimization of Football Player Rotations Using Gurobi

**[Open the app](https://football-rotation-planner.netlify.app)** &nbsp;·&nbsp;
[Solver API](https://rotation-api-s3m9.onrender.com/api/teams/) &nbsp;·&nbsp;
[The model write-up (PDF)](https://football-rotation-planner.netlify.app/FootballRotationModel.pdf)

The interface is served from Netlify's CDN; the solver runs on Render. The API
is on a free instance, so the first request after an idle period takes a moment
to wake.


## 📋 Table of Contents

- [About the Project](#about-the-project)
- [Features](#features)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
- [Usage](#usage)
  - [Backend API](#backend-api)
  - [Frontend Interface](#frontend-interface)
- [Directory Structure](#directory-structure)
- [Technologies Used](#technologies-used)
- [Future Improvements](#future-improvements)

---

## 🏗️ About the Project

This project demonstrates how to **optimize football player rotations** across multiple matches using **Gurobi**, a mathematical optimization solver. Coaches must consider factors such as:

- Player fatigue and physicality.
- Match difficulty.
- Goals per game.

The app ensures optimal performance over a season by using **mathematical modeling** to generate the best possible team lineup for each game.

---

## ✨ Features

- **Frontend:**
  - Choose your favorite team from a visually appealing UI.
  - Setup matches with opponent names and difficulty levels.
  - View optimized results for player rotations.

- **Backend:**
  - Solve optimization problems using Gurobi.
  - APIs to manage teams, players, and match setups.
  - Scalable architecture for advanced features.

---

## 🚀 Getting Started

### Prerequisites

Before running the project, ensure you have the following installed:

- Python 3.8+
- Node.js (v16+ recommended)
- Gurobi Optimizer
- A modern web browser

---

### Installation

1. **Clone the Repository**:
   ```bash
   git clone https://github.com/HIJOdelIDANII/Optimization-of-Football-Player-Rotations-Using-Gurobi.git
   cd Optimization-of-Football-Player-Rotations-Using-Gurobi
   ```

2. **Backend Setup**:
   - Navigate to the backend folder:
     ```bash
     cd backend
     ```
   - Install dependencies:
     ```bash
     pip install -r requirements.txt
     ```
   - Run the backend server:
     ```bash
     python main.py
     ```

3. **Frontend Setup**:
   - Navigate to the frontend folder:
     ```bash
     cd ../frontend
     ```
   - Install dependencies:
     ```bash
     npm install
     ```
   - Start the development server:
     ```bash
     npm run dev
     ```

---

## 🛠️ Usage

### Backend API

#### **Available Routes**

| Route                                 | Method | Description                                      |
|--------------------------------------|--------|--------------------------------------------------|
| `/api/teams/`                        | GET    | Fetch all teams.                                |
| `/api/teams/<team_name>/players/`    | GET    | Fetch players of a specific team.               |
| `/api/optimise/<team_name>/`         | POST   | Get optimized player rotations for matches.     |

#### Example `POST` to `/api/optimise/<team_name>/`

Request Body:

```json
{
  "numberMatches": 5,
  "matchesChosen": {
    "1": {"opponent": "Everton", "difficulty": 1.0},
    "2": {"opponent": "Chelsea", "difficulty": 1.5},
    "3": {"opponent": "Arsenal", "difficulty": 0.5}
  }
}
```

Response:

```json
{
  "lineups": [
    {"match": 1, "players": ["Player A", "Player B", "Player C"], "goals": 2.7, "opponent": "Everton"},
    {"match": 2, "players": ["Player A", "Player D", "Player E"], "goals": 1.8, "opponent": "Chelsea"}
  ],
  "player_statistics": [
    {"player": "Player A", "matches_played": 2},
    {"player": "Player B", "matches_played": 1}
  ],
  "total_goals": 4.5
}
```

---

### Frontend Interface

1. **Choose Your Favorite Team**:
   - Select a team from the home page.

2. **Set Up Matches**:
   - Add matches by specifying the opponent and difficulty level.

3. **View Results**:
   - See the optimal player rotations and statistics.

---

## 📁 Directory Structure

```plaintext
📦 Optimization-of-Football-Player-Rotations-Using-Gurobi
├── backend
│   ├── instance/
│   ├── __pycache__/
│   ├── BackendLogic.py
│   ├── config.py
│   ├── main.py
│   ├── models.py
│   ├── requirements.txt
├── frontend
│   ├── node_modules/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   └── App.jsx
│   ├── package.json
│   ├── vite.config.js
└── .gitignore
```

---

## 💻 Technologies Used

- **Backend**: Python, Flask, Gurobi
- **Frontend**: React, Vite
- **Database**: SQLite
- **Styling**: CSS

---

## 🔮 Future Improvements

- Integrate player injury data into the optimization model.
- Visualize player statistics with interactive charts.
- Expand support to more leagues and teams.


---

## 👨‍💻 Author

**HIJOdelIDANII**  
- GitHub: [HIJOdelIDANII](https://github.com/HIJOdelIDANII)



