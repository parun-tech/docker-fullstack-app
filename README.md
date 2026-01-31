# ATS Resume Matcher (Dockerized)

A production-ready full-stack application that analyzes resumes against job descriptions to check for ATS keyword optimization. Built with a microservices architecture using Docker.

 Features

- **Resume Analysis**: Compares resume text vs job description.
- **Scoring System**: Calculates a match percentage.
- **Keyword Gap Analysis**: Identifies missing keywords.
- **History Tracking**: Saves analysis results to MongoDB.

 Architecture

- **Frontend**: React (Vite) - Interactive Text Analysis UI
- **Backend**: Node.js/Express - Keyword Processing Logic
- **Database**: MongoDB - Stores analysis history
- **Orchestration**: Docker Compose + Nginx Reverse Proxy

 How to Run

1.  Start the application:
    ```bash
    docker compose up --build
    ```

2.  Open **http://localhost**

 Tech Stack

- **Docker & Compose**: Containerization
- **React**: UI
- **Node.js**: API & Logic
- **Nginx**: Routing
- **MongoDB**: Persistence
