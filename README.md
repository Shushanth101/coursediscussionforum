# Course Discussion Forum

A modern, full-stack discussion platform for courses and educational environments. This project features a collaborative forum (posts, answers, comments, voting, and tagging), a semantic search backend using vector embeddings, and an AI-powered forum assistant utilizing Google Gemini with Retrieval-Augmented Generation (RAG).

---
# Demo
![App Screenshot](./images/Screenshot%202026-06-27%20132739.png )
![App Screenshot](./images/Screenshot%202026-06-27%20132812.png)
![App Screenshot](./images/Screenshot%202026-06-27%20132836.png)
---

## 🏛 System Architecture

The project is structured as a monorepo containing three main components:

```mermaid
graph TD
    subgraph Client [Client - Frontend]
        React[React 19 / Vite]
        Tailwind[Tailwind CSS v4]
    end

    subgraph NodeBackend [Backend - API Server]
        Express[Node.js / Express]
        Gemini[Google Gemini API]
    end

    subgraph PythonService [Embedding Service]
        Flask[Python / Flask]
        ST[Sentence Transformers]
    end

    subgraph Database [Storage]
        PostgreSQL[(PostgreSQL + pgvector)]
    end

    React <-->|REST API / SSE| Express
    Express <-->|SQL / Vector Search| PostgreSQL
    Express <-->|Fetch Embeddings| Flask
    Flask <-->|Load / Update Vectors| PostgreSQL
    Express <-->|AI / Tool Calling| Gemini
```

### 1. Frontend Client (`/client`)
- **Technology Stack**: React 19, Vite, Tailwind CSS v4, Lucide Icons.
- **Key Features**:
  - **Server-Side Rendering (SSR)** with HTML streaming for fast initial page load and SEO optimization.
  - Interactive markdown-enabled post creation and rendering using `@uiw/react-md-editor` and `react-markdown` (supporting tables, code syntax highlighting, and GFM).
  - Integration with **Mermaid.js** for rendering diagrams from markdown.
  - Responsive layout design for desktop, tablet, and mobile browsers.

### 2. API Backend (`/backend`)
- **Technology Stack**: Node.js, Express, PostgreSQL driver (`pg`).
- **Key Features**:
  - Secure JWT authentication & password hashing (`bcryptjs`).
  - RESTful APIs for managing Users, Posts, Comments, Answers, Votes, Tags, and Follows.
  - Media/image upload support integrated with Cloudinary (via `multer`).
  - **Gemini Chat AI Integration** via the new `@google/genai` SDK:
    - Interactive technical assistant running on `gemini-3-flash-preview` / `gemini-2.0-flash`.
    - Features **Server-Sent Events (SSE)** for streaming responses.
    - Equipped with RAG capabilities utilizing the `search_forum` tool declaration to query similar posts/answers from the database automatically when context is missing.

### 3. Embedding Service (`/embeddingservice`)
- **Technology Stack**: Python 3, Flask, Sentence Transformers (`BAAI/bge-base-en-v1.5`).
- **Key Features**:
  - Exposes local endpoints to generate normalized vector embeddings for posts and queries.
  - Asynchronously updates the PostgreSQL database using a thread pool executor when posts are created or updated.

---

## 🗄 Database Schema

The system uses a PostgreSQL database. Below is the relational structure of the tables:

| Table | Primary Key | Description |
|---|---|---|
| `users` | `user_id` (VARCHAR) | Contains user details, role (e.g. User, Instructor), hashed password, profile content (markdown), and refresh tokens. |
| `posts` | `post_id` (VARCHAR) | Contains forum posts with titles, bodies, author foreign keys, timestamps, and a vector `embedding` column. |
| `answers` | `answer_id` (SERIAL) | Direct replies/answers to posts. |
| `comments` | `comment_id` (VARCHAR) | Threaded replies that can be attached to posts or nested under other comments. |
| `follows` | `(follower_id, following_id)` | Junction table mapping user follow connections. |
| `votes` | `vote_id` (SERIAL) | Tracks upvotes and downvotes on posts (linked to users and posts). |
| `tags` | `tag_id` (SERIAL) | Stores unique post tags. |
| `post_tags` | `(post_id, tag_id)` | Junction table linking posts to tags. |
| `conversations` | `conversation_id` (VARCHAR)| Stores AI chat histories (with `full_history` and `display_history` JSONB fields). |

---

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (v18+ recommended)
- [Python](https://www.python.org/) (v3.9+ recommended)
- [PostgreSQL](https://www.postgresql.org/) (v12+ with the `pgvector` extension installed)

---

### Step 1: Database Setup
1. Create a PostgreSQL database (e.g., `course_forum`).
2. Make sure the `pgvector` extension is enabled:
   ```sql
   CREATE EXTENSION IF NOT EXISTS vector;
   ```
3. Initialize the schema and run migrations from the `/backend` folder:
   ```bash
   cd backend
   npm run dev  # nodemon will start the app and test connections
   ```
4. Run the tag migration to create the tags and tag junction tables:
   ```bash
   node scripts/migrate-tags.js
   ```

---

### Step 2: Embedding Service Setup
The Python Flask service generates vector embeddings for posts and queries.

1. Navigate to `/embeddingservice`:
   ```bash
   cd embeddingservice
   ```
2. Create and activate a Python virtual environment:
   ```bash
   python -m venv venv
   # On Windows:
   venv\Scripts\activate
   # On macOS/Linux:
   source venv/bin/activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Create a `.env` file inside the `embeddingservice` folder (encoded in UTF-8):
   ```env
   HF_HUB_DISABLE_SYMLINKS_WARNING=1
   ```
5. Run the Flask server:
   ```bash
   python main.py
   ```
   *The service runs locally at `http://127.0.0.1:7645`.*

---

### Step 3: API Backend Setup
1. Navigate to `/backend`:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file in the `/backend` directory:
   ```env
   PORT=5000
   DATABASE_URL=postgresql://postgres:password@localhost:5432/course_forum
   GOOGLE_API_KEY=your_gemini_api_key_here
   EMBEDDINGSERVICE_ENDPOINT=http://127.0.0.1:7645
   JWT_SECRET=your_jwt_secret_key
   CLOUDINARY_CLOUD_NAME=your_cloudinary_name
   CLOUDINARY_API_KEY=your_cloudinary_key
   CLOUDINARY_API_SECRET=your_cloudinary_secret
   # Nodemailer configurations
   SMTP_HOST=your_smtp_host
   SMTP_PORT=your_smtp_port
   SMTP_USER=your_smtp_email
   SMTP_PASSWORD=your_smtp_password
   ```
4. Start the development server:
   ```bash
   npm run dev
   ```
   *The API backend will start on port `5000`.*

---

### Step 4: Frontend Client Setup
1. Navigate to `/client`:
   ```bash
   cd client
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run the development server (configured for SSR):
   ```bash
   npm run dev
   ```
   *The client server will start and serve the React app at `http://localhost:5173`.*

---

## 📡 API Endpoints Summary

### Express API Gateway (Port `5000`)
- **Authentication**: `/api/users/register`, `/api/users/login`, `/api/users/logout`, `/api/users/me`
- **Posts**: `/api/posts/create`, `/api/posts/all`, `/api/posts/:id`, `/api/posts/:id/vote`
- **Answers**: `/api/answers/create`, `/api/answers/post/:post_id`
- **Comments**: `/api/comments/create`, `/api/comments/post/:post_id`
- **Tags**: `/api/tags/all`, `/api/tags/create`
- **AI Chat**: `/api/chat/init` (Create a chat room), `/api/chat/stream` (Send a message & stream RAG results)

### Embedding Service API (Port `7645`)
- `GET /` - Health check status.
- `POST /process_post/<post_id>` - Submits a background worker task to query post text, compute its embedding, and save it in the database.
- `POST /generate_query_embedding` - Expects JSON `{"query": "your text"}` and returns the 768-dimensional normalized embedding vector.
