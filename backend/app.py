import psycopg2
from flask import Flask, request, jsonify, session, redirect, send_from_directory
from flask_cors import CORS
from authlib.integrations.flask_client import OAuth
from functools import wraps
import logging
from psycopg2 import pool
from dotenv import load_dotenv
import os
import re

load_dotenv(os.path.join(os.path.dirname(__file__), '..', '.env'))

app = Flask(__name__)
app.secret_key = os.getenv('SECRET_KEY', 'your-secret-key-change-this')

CORS(app, supports_credentials=True, origins="*")

# Database pool
connection_pool = pool.SimpleConnectionPool(
    minconn=1, maxconn=5,
    dsn=os.getenv('DATABASE_URL')
)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# OAuth setup
oauth = OAuth(app)
google = oauth.register(
    name='google',
    client_id=os.getenv('GOOGLE_CLIENT_ID'),
    client_secret=os.getenv('GOOGLE_CLIENT_SECRET'),
    server_metadata_url=os.getenv('GOOGLE_DISCOVERY_URL'),
    client_kwargs={'scope': 'openid email profile'}
)

def database_connection(f):
    @wraps(f)
    def wrapper(*args, **kwargs):
        conn = connection_pool.getconn()
        try:
            return f(conn, *args, **kwargs)
        except Exception as e:
            logger.error(f"Error: {e}")
            return jsonify({"error": str(e)}), 500
        finally:
            connection_pool.putconn(conn)
    return wrapper

@app.route('/login')
def login():
    return google.authorize_redirect(redirect_uri='http://127.0.0.1:3000/auth/google')

@app.route('/auth/google')
def auth():
    token = google.authorize_access_token()  # Changed from authorize_redirect_token
    userinfo = google.parse_id_token(token, None)
    
    if not userinfo or not userinfo.get('email', '').endswith('@sahrdaya.ac.in'):
        return jsonify({'error': 'Authentication failed or invalid email'}), 403
        
    session['user'] = {
        'name': userinfo.get('name'),
        'email': userinfo.get('email'),
        'picture': userinfo.get('picture')
    }
    
    return redirect('http://127.0.0.1:3000/webpage/search/search.html')

@app.route('/auth/status')
def auth_status():
    if 'user' in session:
        return jsonify({
            'authenticated': True,
            'user': session['user']
        })
    return jsonify({
        'authenticated': False,
        'user': None
    })

@app.route('/suggest')
@database_connection
def suggest(conn):
    query = request.args.get('q', '')
    if not query:
        return jsonify([])
    
    with conn.cursor() as cursor:
        cursor.execute(
            """SELECT id, name, department, opt_out FROM students 
               WHERE name ILIKE %s ORDER BY name LIMIT 8""",
            (f'%{query}%',)
        )
        results = [{
            'id': row[0], 
            'name': row[1], 
            'department': row[2],
            'opt_out': row[3]
        } for row in cursor.fetchall()]
    
    return jsonify(results)

@app.route('/student')
@database_connection
def student(conn):
    student_id = request.args.get('id')
    if not student_id:
        return jsonify({"error": "Student ID required"}), 400
    
    with conn.cursor() as cursor:
        cursor.execute(
                'SELECT name, date_of_birth, "Instagram_id", father_mobile, opt_out, sr_no FROM students WHERE id = %s',
            (student_id,)
        )
        result = cursor.fetchone()
        
        if not result:
            return jsonify({"error": "Student not found"}), 404
            
        if result[4]:  
            return jsonify({
                "error": "Student has opted out",
                "name": result[0]  
            }), 403
            
        return jsonify({
            'name': result[0],
            'date_of_birth': result[1],
            'Instagram_id': result[2],
            'father_mobile': result[3],
            'sr_no': result[5]
        })

@app.route('/logout', methods=['POST','GET'])
def logout():
    session.clear()
    return jsonify({'message': 'Successfully logged out'})

# New route handlers
@app.route('/')
def serve_homepage():
    return send_from_directory('../webpage/landing', 'index.html')

@app.route('/<path:path>')
def serve_static_files(path):
    return send_from_directory('../webpage', path)

# This route specifically handles static assets in the landing directory
@app.route('/landing/<path:path>')
def serve_landing_files(path):
    return send_from_directory('../webpage/landing', path)


@app.route('/opt_out', methods=['POST'])
@database_connection
def opt_out(conn):
    if 'user' not in session:
        return jsonify({"error": "Authentication required"}), 401
    
    sr_no = request.args.get('sr_no')
    if not sr_no:
        return jsonify({"error": "Student registration number required"}), 400
    
    # Extract SR number from email (assuming format: mishal224791@sahrdaya.ac.in where 224791 is the sr no)
    user_email = session['user']['email']
    email_sr_no = None
    try:
        # Extract the part before '@', then extract digits from it
        local_part = user_email.split('@')[0]
        match = re.search(r'(\d+)$', local_part)
        if match:
            email_sr_no = match.group(1)
        else:
            return jsonify({"error": "Could not extract SR number from email"}), 400
    except Exception:
        return jsonify({"error": "Invalid email format"}), 400
    
    # Compare SR numbers
    if email_sr_no.lower() != str(sr_no).lower():
        return jsonify({
            "error": "Unauthorized - Student registration number does not match your email"
        }), 403
            
    with conn.cursor() as cursor:
        # Verify SR number exists in database
        cursor.execute(
            "SELECT id FROM students WHERE sr_no = %s",
            (sr_no,)
        )
        if not cursor.fetchone():
            return jsonify({"error": "Student registration number not found"}), 404
            
        # Update opt_out status
        cursor.execute(
            "UPDATE students SET opt_out = TRUE WHERE sr_no = %s",
            (sr_no,)
        )
        conn.commit()
        
        return jsonify({
            "message": "Successfully opted out",
            "sr_no": sr_no
        })
if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=3000)