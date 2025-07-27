from flask import Flask, request, jsonify, session
from flask_cors import CORS
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
import sqlite3
from datetime import datetime
from werkzeug.security import generate_password_hash, check_password_hash

app = Flask(__name__)
app.secret_key = 'supersecretkey'  # for session management
CORS(app, supports_credentials=True)

limiter = Limiter(
    get_remote_address,
    app=app,
    default_limits=["100 per hour"]
)

# Database setup
def init_db():
    conn = sqlite3.connect('weights.db')
    c = conn.cursor()
    c.execute('''CREATE TABLE IF NOT EXISTS users (
                    username TEXT PRIMARY KEY,
                    password_hash TEXT
                 )''')
    c.execute('''CREATE TABLE IF NOT EXISTS weights (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    username TEXT,
                    weight REAL,
                    date TEXT,
                    FOREIGN KEY(username) REFERENCES users(username)
                 )''')
    conn.commit()
    conn.close()

init_db()

@app.route('/api/auth', methods=['POST'])
@limiter.limit("10 per minute")
def auth():
    data = request.json
    username = data.get('username')
    password = data.get('password')
    conn = sqlite3.connect('weights.db')
    c = conn.cursor()
    c.execute('SELECT password_hash FROM users WHERE username=?', (username,))
    row = c.fetchone()
    if row:
        if check_password_hash(row[0], password):
            session['username'] = username
            conn.close()
            return jsonify({'success': True})
        else:
            conn.close()
            return jsonify({'success': False, 'error': 'Invalid password'}), 401
    else:
        password_hash = generate_password_hash(password, method="pbkdf2:sha256")
        c.execute('INSERT INTO users (username, password_hash) VALUES (?, ?)', (username, password_hash))
        conn.commit()
        session['username'] = username
        conn.close()
        return jsonify({'success': True})

@app.route('/api/add_weight', methods=['POST'])
@limiter.limit("10 per minute")
def add_weight():
    data = request.json
    username = data.get('username')
    weight = data.get('weight')
    date = datetime.now().strftime('%Y-%m-%d')
    conn = sqlite3.connect('weights.db')
    c = conn.cursor()
    c.execute('INSERT INTO weights (username, weight, date) VALUES (?, ?, ?)', (username, weight, date))
    conn.commit()
    conn.close()
    return jsonify({'success': True})

@app.route('/api/history', methods=['GET'])
@limiter.limit("10 per minute")
def history():
    username = request.args.get('username')
    conn = sqlite3.connect('weights.db')
    c = conn.cursor()
    c.execute('SELECT date, weight FROM weights WHERE username=? ORDER BY date', (username,))
    rows = c.fetchall()
    conn.close()
    data = [{'date': row[0], 'weight': row[1]} for row in rows]
    return jsonify(data)

if __name__ == '__main__':
    app.run(debug=True)
