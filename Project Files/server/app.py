from flask import Flask, request, jsonify
from flask_cors import CORS
from pymongo import MongoClient
import datetime

app = Flask(__name__)
CORS(app)  # Allows cross-origin JS requests

client = MongoClient("mongodb+srv://meghnamadhu2004:Meg2402@cluster0.kxegcng.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0")
db = client["quizApp"]
questions_col = db["questions"]
leaderboard_col = db["leaderboard"]
scores_col = db["leaderboard"]
users_col = db["users"]  # Optional for user info

ADMIN_EMAIL = "meghnamadhu24@gmail.com"


@app.route("/register", methods=["POST"])
def register():
    data = request.json
    if users_col.find_one({"email": data["email"]}):
        return jsonify({"error": "User already exists"}), 400

    users_col.insert_one({
        "email": data["email"],
        "password": data["password"]  # Consider hashing later!
    })
    return jsonify({"message": "Registered successfully"}), 201



@app.route("/login", methods=["POST"])
def login():
    data = request.json
    user = users_col.find_one({"email": data["email"], "password": data["password"]})
    if not user:
        return jsonify({"message": "Invalid credentials"}), 401

    # For now, return a dummy token or user ID (or real JWT if needed)
    return jsonify({
        "email": user["email"],
        "is_admin": user["email"] == ADMIN_EMAIL,
        "token": str(user["_id"])  # example token
    }), 200



@app.route("/questions", methods=["GET"])
def get_questions():
    questions = list(questions_col.find({}, {"_id": 0}))
    return jsonify(questions)

@app.route("/question/update", methods=["POST"])
def update_question():
    data = request.json
    if data["email"] != ADMIN_EMAIL:
        return jsonify({"error": "Unauthorized"}), 403

    result = questions_col.update_one(
        {"question": data["original_question"]},
        {"$set": {
            "question": data["question"],
            "options": data["options"],
            "correctAnswer": data["correctAnswer"]
        }}
    )
    return jsonify({"modified": result.modified_count})


@app.route("/question/delete", methods=["POST"])
def delete_question():
    data = request.json
    if data["email"] != ADMIN_EMAIL:
        return jsonify({"error": "Unauthorized"}), 403
    result = questions_col.delete_one({"question": data["question"]})
    return jsonify({"deleted": result.deleted_count})


@app.route("/submit", methods=['POST'])
def submit_score():
    data = request.json
    scores_col.insert_one({
        "name": data["name"],
        "score": data["score"],
        "date": data["date"]
    })
    return jsonify({"message": "Score submitted"})



@app.route("/leaderboard", methods=["GET"])
def get_leaderboard():
    top_scores = leaderboard_col.find().sort("score", -1).limit(5)
    return jsonify([{ "name": entry["name"], "score": entry["score"] } for entry in top_scores])

if __name__ == "__main__":
    app.run(debug=True)
