# 🚀 FastAPI Practice Projects

A collection of hands-on mini-projects built while learning **FastAPI**, progressing from basic data modeling to full CRUD apps with authentication and databases.

---

## 🌐 Overview

This repository documents a step-by-step journey through FastAPI — starting with core concepts (Pydantic data modeling, typing) and building up to complete, real-world style applications (templated web apps, authenticated feeds, database-backed to-do lists).

### 🎯 Goals
- **Learn FastAPI fundamentals** — request/response models, routing, typing.
- **Practice Pydantic** — data validation, nested models, optional fields.
- **Build real apps** — from static templating to full authentication and SQL persistence.
- **Track progress** — one mini-project per concept, growing in complexity.

---

## 📁 Projects

### ✅ Completed

| Project | Description | Tools |
|---|---|---|
| **Project 1: Social Media Post** | Data models for a social media post system — posts with authors, co-authors, likes, and a nested list of comments. Demonstrates `pydantic.BaseModel`, nested models, and `typing` (`Optional`, `List`, `Dict`). | Pydantic, Typing |

<details>
<summary>Preview: core models (<code>Post</code> / <code>Comment</code>)</summary>

```python
class Comment(BaseModel):
    author: str
    comment: str
    likes: int

class Post(BaseModel):
    author: str
    co_author: Optional[str] = None
    date: str
    title: str
    content: str
    id: int
    likes: List[str]
    comments: List[Comment]
```
</details>

> This project focuses on data modeling only — the full CRUD API and user authentication for the social feed are built out in **App 2** below.

### 🔜 Upcoming

| Section | App | Focus | Tools |
|---|---|---|---|
| **Section 3** | App 1: Car Information Viewer | Basic FastAPI + server-side templating | FastAPI, Jinja2, Bootstrap |
| **Section 4** | App 2: Social Media Feed w/ User Login | Extends Project 1's models into a full feed with authentication | OAuth2, JWT, Security |
| **Section 5** | App 3: Todo List | Persistent storage and unique IDs | SQL, UUID |

---

## 🏗️ Tech Stack

| Category | Tools | Description |
|---|---|---|
| **Framework** | FastAPI | API routing, request/response handling |
| **Data Modeling** | Pydantic, Typing | Schema definition and validation |
| **Templating / UI** | Jinja2, Bootstrap | Server-rendered pages for the Car Information Viewer |
| **Auth / Security** | OAuth2, JWT | Login and protected routes for the Social Media Feed |
| **Persistence** | SQL, UUID | Database storage for the Todo List |

---

## 📦 Project Structure

```
fastapi-practice/
├── project1_social_media_post/
│   └── models.py            # Post & Comment Pydantic models
├── section3_car_info_viewer/    # App 1 (upcoming)
├── section4_social_media_feed/  # App 2 (upcoming) — builds on project1 models
├── section5_todo_list/          # App 3 (upcoming)
└── README.md
```

*(Folder names are placeholders — adjust to match your actual layout.)*

---

## ▶️ How to Run

```bash
pip install fastapi uvicorn pydantic
uvicorn main:app --reload
```

Each sub-project will include its own entry point once built; this section will be updated as apps are added.
