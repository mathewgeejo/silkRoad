import psycopg2
from flask import Flask, request, jsonify
from flask_cors import CORS
import os

app = Flask(__name__)
CORS(app)

# Database connection string
CONNECTION_STRING = "postgresql://studentData_owner:npg_MLdTR0HjfmB8@ep-rapid-wildflower-a19kw674.ap-southeast-1.aws.neon.tech/studentData?sslmode=require"

def get_db_connection():
    try:
        conn = psycopg2.connect(CONNECTION_STRING)
        return conn
    except psycopg2.Error as e:
        print(f"Database connection error: {e}")
        return None

# Test database connection on startup
try:
    test_conn = get_db_connection()
    if test_conn:
        print("Connected to the database")
        test_conn.close()
    else:
        print("Failed to connect to database")
except Exception as e:
    print(f"Connection error: {e}")

@app.route('/suggest', methods=['GET'])
def suggest():
    try:
        q = request.args.get('q')
        if not q:
            return jsonify([])
        
        conn = get_db_connection()
        if not conn:
            return jsonify({"error": "Database connection failed"}), 500
        
        cursor = conn.cursor()
        cursor.execute(
            "SELECT id, name, department FROM students WHERE name ILIKE %s ORDER BY name LIMIT 8",
            (f'%{q}%',)
        )
        
        # Convert results to list of dictionaries
        columns = [desc[0] for desc in cursor.description]
        results = [dict(zip(columns, row)) for row in cursor.fetchall()]
        
        cursor.close()
        conn.close()
        
        return jsonify(results)
        
    except Exception as e:
        print(f"Error fetching suggestions: {e}")
        return jsonify({"error": "Internal Server Error"}), 500

@app.route('/student', methods=['GET'])
def student():
    try:
        student_id = request.args.get('id')
        if not student_id:
            return jsonify({"error": "Missing id"}), 400
        
        conn = get_db_connection()
        if not conn:
            return jsonify({"error": "Database connection failed"}), 500
        
        cursor = conn.cursor()
        cursor.execute(
            'SELECT name, date_of_birth, "Instagram_id" FROM students WHERE id = %s',
            (student_id,)
        )
        
        # Convert results to list of dictionaries
        columns = [desc[0] for desc in cursor.description]
        results = [dict(zip(columns, row)) for row in cursor.fetchall()]
        
        cursor.close()
        conn.close()
        
        return jsonify(results)
        
    except Exception as e:
        print(f"Error fetching student by id: {e}")
        return jsonify({"error": "Internal Server Error"}), 500

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5051)