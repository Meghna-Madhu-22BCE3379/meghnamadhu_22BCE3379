from flask import Flask, request, jsonify
from flask_cors import CORS
from bson.objectid import ObjectId
from pymongo import MongoClient
import datetime

app = Flask(__name__)
CORS(app)  

client = MongoClient("mongodb+srv://meghnamadhu2004:Meg2402@cluster0.kxegcng.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0")
db = client["quizApp"]
questions_col = db["questions"]
leaderboard_col = db["leaderboard"]
scores_col = db["leaderboard"]
users_col = db["users"]  

ADMIN_EMAIL = "meghnamadhu24@gmail.com"

#CREATE

@app.route("/register", methods=["POST"])
def register():
    data = request.json
    if users_col.find_one({"email": data["email"]}):
        return jsonify({"error": "User already exists"}), 400

    users_col.insert_one({
        "email": data["email"],
        "password": data["password"]  
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



#READ

@app.route("/questions", methods=["GET"])
def get_questions():
    questions = []
    for q in questions_col.find():
        q["_id"] = str(q["_id"])  # Convert ObjectId to string
        questions.append(q)
    return jsonify(questions)


#UPDATE

@app.route('/question/<id>', methods=['PUT'])
def update_question(id):
    data = request.get_json()
    result = questions_col.update_one(
        {"_id": ObjectId(id)},
        {"$set": {
            "question": data['question'],
            "options": data['options'],
            "correctAnswer": data['correctAnswer']
        }}
    )
    return jsonify({"message": "Question updated!"})



#DELETE

@app.route("/question/<id>", methods=["DELETE"])
def delete_question(id):
    try:
        result = questions_col.delete_one({"_id": ObjectId(id)})
        print("Deleted ID:", id, "Count:", result.deleted_count)
        if result.deleted_count == 1:
            return jsonify({"message": "Question deleted!"}), 200
        else:
            return jsonify({"message": "Question not found"}), 404
    except Exception as e:
        print("Error deleting question:", str(e))
        return jsonify({"message": "Server error"}), 500





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
