import psycopg2
from flask import Flask, request, jsonify, session, redirect
from flask_cors import CORS
from authlib.integrations.flask_client import OAuth
from functools import wraps
import logging
from psycopg2 import pool
from dotenv import load_dotenv
import os

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
    token = google.authorize_access_token()
    userinfo = google.parse_id_token(token, None)
    
    if not userinfo or not userinfo.get('email', '').endswith('@sahrdaya.ac.in'):
        return jsonify({'error': 'Authentication failed or invalid email'}), 403
        
    session['user'] = {
        'name': userinfo.get('name'),
        'email': userinfo.get('email'),
        'picture': userinfo.get('picture')
    }
    
    return redirect('http://127.0.0.1:3001/webpage/search/search.html#')

@app.route('/suggest')
@database_connection
def suggest(conn):
    query = request.args.get('q', '')
    if not query:
        return jsonify([])
    
    with conn.cursor() as cursor:
        cursor.execute(
            """SELECT id, name, department FROM students 
               WHERE name ILIKE %s ORDER BY name LIMIT 8""",
            (f'%{query}%',)
        )
        results = [{'id': row[0], 'name': row[1], 'department': row[2]} 
                  for row in cursor.fetchall()]
    
    return jsonify(results)

@app.route('/student')
@database_connection
def student(conn):
    student_id = request.args.get('id')
    if not student_id:
        return jsonify({"error": "Student ID required"}), 400
    
    with conn.cursor() as cursor:
        cursor.execute(
            'SELECT name, date_of_birth, "Instagram_id", father_mobile FROM students WHERE id = %s',
            (student_id,)
        )
        result = cursor.fetchone()
        
    if not result:
        return jsonify({"error": "Student not found"}), 404
        
    return jsonify({
        'name': result[0],
        'date_of_birth': result[1],
        'Instagram_id': result[2],
        'father_mobile': result[3]
    })

@app.route('/logout', methods=['POST'])
def logout():
    session.clear()
    return jsonify({'message': 'Successfully logged out'})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=3000, debug=True)