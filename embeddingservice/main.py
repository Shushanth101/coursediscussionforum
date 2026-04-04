from flask import Flask, request, jsonify
from sentence_transformers import SentenceTransformer
from concurrent.futures import ThreadPoolExecutor
from db import get_connection
import numpy as np
import logging


app = Flask(__name__)

logging.basicConfig(level=logging.INFO)

print("Loading embedding model...")
model = SentenceTransformer("BAAI/bge-base-en-v1.5")
print("Model loaded successfully")

executor = ThreadPoolExecutor(max_workers=5)



def embed_text(text: str):
    print("Generating embedding...")
    embedding = model.encode(
        text,
        normalize_embeddings=True
    )
    print("Embedding generated")
    return embedding.tolist()



def embed_post(post_id):
    print("--------------------------------------------------")
    print(f"Embedding task started for post_id: {post_id}")

    conn = None
    cursor = None

    try:
        print("Connecting to database...")
        conn = get_connection()
        cursor = conn.cursor()
        print("Database connected")

        print("Fetching post content...")
        cursor.execute(
            "SELECT title, body FROM posts WHERE post_id = %s",
            (post_id,)
        )

        result = cursor.fetchone()

        if not result:
            print(f"Post {post_id} not found in database")
            return

        print("Post found")

        title, body = result
        combined_text = f"{title} {body}"

        print("Combined text:")
        print(combined_text)

        embedding = embed_text(combined_text)

        print("Updating embedding in database...")

        cursor.execute(
            "UPDATE posts SET embedding = %s WHERE post_id = %s",
            (embedding, post_id)
        )

        conn.commit()

        print(f"Embedding stored successfully for post {post_id}")

    except Exception as e:
        print("ERROR OCCURRED:")
        print(e)

    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()

        print("DB connection closed")
        print("--------------------------------------------------")



@app.route("/")
def home():
    print("Health check endpoint called")
    return jsonify({
        "status": "running",
        "service": "semantic embedding service"
    })


@app.route("/process_post/<post_id>", methods=["POST"])
def process_post(post_id):

    print(f"Received embedding request for post: {post_id}")

    executor.submit(embed_post, post_id)

    print("Task submitted to thread pool")

    return jsonify({
        "message": "embedding task submitted",
        "post_id": post_id
    })


@app.route("/generate_query_embedding", methods=["POST"])
def generate_query_embedding():

    print("Query embedding endpoint called")

    data = request.get_json()

    if not data or "query" not in data:
        print("Invalid query request")
        return jsonify({
            "error": "query field required"
        }), 400

    query = data["query"].strip()

    print("Query received:", query)

    if not query:
        return jsonify({
            "error": "query cannot be empty"
        }), 400

    embedding = embed_text(query)

    print("Query embedding completed")

    return jsonify({
        "query": query,
        "embedding": embedding
    })






if __name__ == "__main__":
    print("Starting Flask embedding server...")
    app.run(debug=True,port=7645)