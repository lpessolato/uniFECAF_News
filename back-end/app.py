from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import sqlite3
import os
import requests
from werkzeug.utils import secure_filename
import json
import google.generativeai as genai
from dotenv import load_dotenv
import logging
from datetime import datetime
import time

# Configuração do logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('app.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

load_dotenv()

app = Flask(__name__)
CORS(app, resources={
    r"/*": {
        "origins": "*",
        "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization"]
    }
})
DB_PATH = os.path.join(os.path.dirname(__file__), 'database', 'data.db')
NEWS_API_KEY = 'b863b61d3dbb49989f2cad9d0227846f'

UPLOAD_FOLDER = os.path.join(os.path.dirname(__file__), 'database', 'capas')
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif'}

# Configuração da API Gemini
GEMINI_API_KEY = os.getenv('GEMINI_API_KEY')
print(f"Valor de GEMINI_API_KEY: {GEMINI_API_KEY}") # Log para verificar a chave

try:
    genai.configure(api_key=GEMINI_API_KEY)
    print("Configuração da API Gemini bem-sucedida.") # Log de sucesso na configuração
except Exception as e:
    print(f"Erro na configuração da API Gemini: {str(e)}") # Log de erro na configuração

# Middleware para logging de requisições
@app.before_request
def log_request_info():
    start_time = time.time()
    request.start_time = start_time
    logger.info(f"Requisição recebida: {request.method} {request.url}")
    if request.is_json:
        logger.info(f"Body JSON: {request.get_json()}")
    elif request.form:
        logger.info(f"Form data: {request.form}")
    elif request.files:
        logger.info(f"Files: {[f.filename for f in request.files.values()]}")

@app.after_request
def log_response_info(response):
    if hasattr(request, 'start_time'):
        duration = time.time() - request.start_time
        logger.info(f"Resposta enviada: {response.status} - Duração: {duration:.2f}s")
    return response

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def verificar_conteudo_sensivel(texto):
    logger.info(f"Verificando conteúdo sensível: {texto}")
    try:
        if not GEMINI_API_KEY:
            logger.warning("API do Gemini não configurada. Pulando verificação de conteúdo.")
            return False

        model = genai.GenerativeModel('gemini-1.5-flash-001')
        prompt = f"""Analise cuidadosamente o texto completo abaixo, em português, e determine se ele contém linguagem ofensiva, palavrões, expressões ofensivas compostas (como "filho da puta", "vai se foder"), discurso de ódio, ameaças, ou qualquer outro conteúdo sensível ou inapropriado.

Considere o significado da frase como um todo, incluindo combinações de palavras que possam formar uma ofensa mesmo que isoladamente pareçam neutras.

Responda apenas com 'SIM' se houver qualquer conteúdo inapropriado, ou 'NAO' se o texto for apropriado. Não inclua explicações adicionais.
Exemplos de expressões ofensivas: "filho da puta", "vai se foder", "desgraçado", "puta", "idiota", "corno", etc.


Texto para análise: {texto}"""

        response = model.generate_content(prompt)

        # Verificar se a resposta foi bloqueada por segurança
        if response.prompt_feedback and response.prompt_feedback.safety_ratings:
            for rating in response.prompt_feedback.safety_ratings:
                # Considerar como sensível se a probabilidade for ALTA ou MAIOR
                if rating.probability in ['HIGH', 'VERY_HIGH']:
                    logger.warning(f"Conteúdo bloqueado por segurança: {rating.category}")
                    return True

        # Se não foi bloqueado por segurança, verificar a resposta em texto (se existir)
        if response.text:
            resposta = response.text.strip().upper()
            logger.info(f"Resposta da API Gemini: {resposta}")
            if resposta not in ['SIM', 'NAO']:
                 logger.warning(f"Resposta inesperada da API Gemini: {resposta}. Permitindo conteúdo.")
                 return False # Em caso de resposta inesperada, permite o conteúdo
            return resposta == 'SIM'
        else:
             logger.warning("Resposta da API Gemini sem campo de texto. Permitindo conteúdo.")
             return False # Se não houver campo de texto na resposta, permite o conteúdo


    except Exception as e:
        logger.error(f"Erro ao verificar conteúdo: {str(e)}")
        return False  # Em caso de erro, permite o conteúdo

# Inicialização do banco de dados
os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)
conn = sqlite3.connect(DB_PATH)
c = conn.cursor()

# Remover tabelas existentes
# c.execute("DROP TABLE IF EXISTS news")
# c.execute("DROP TABLE IF EXISTS users")

# Criar tabelas novamente
c.execute('''CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    senha TEXT NOT NULL,
    curso TEXT NOT NULL
)''')
c.execute('''CREATE TABLE IF NOT EXISTS news (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    titulo TEXT NOT NULL,
    categoria TEXT NOT NULL,
    data TEXT NOT NULL,
    descricao TEXT NOT NULL,
    capa TEXT,
    autor_id INTEGER,
    FOREIGN KEY(autor_id) REFERENCES users(id)
)''')

# Adicionar criação da tabela de comentários
c.execute('''CREATE TABLE IF NOT EXISTS comentarios (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    texto TEXT NOT NULL,
    nome TEXT NOT NULL,
    curso TEXT NOT NULL,
    data TEXT NOT NULL,
    user_id INTEGER NOT NULL,
    likes TEXT DEFAULT '[]'
)''')

def get_db():
    return sqlite3.connect(DB_PATH)

def garantir_usuario_teste():
    conn = get_db()
    c = conn.cursor()
    try:
        c.execute("SELECT id FROM users WHERE email = ?", ('admin@unifecaf.com',))
        if not c.fetchone():
            c.execute("INSERT INTO users (nome, email, senha, curso) VALUES (?, ?, ?, ?)",
                     ('Admin Teste', 'admin@unifecaf.com', 'admin123', 'ADMINISTRAÇÃO'))
            conn.commit()
            print("Usuário de teste criado com sucesso!")
    except Exception as e:
        print(f"Erro ao criar usuário de teste: {str(e)}")
    finally:
        conn.close()

# Garantir que o usuário de teste existe ao iniciar a aplicação
garantir_usuario_teste()

# Simples armazenamento em memória para comentários (pode ser substituído por banco de dados)
comentarios = []

@app.route('/register', methods=['POST'])
def register():
    data = request.json
    try:
        conn = get_db()
        c = conn.cursor()
        c.execute("INSERT INTO users (nome, email, senha, curso) VALUES (?, ?, ?, ?)",
                  (data['nome'], data['email'], data['senha'], data['curso']))
        conn.commit()
        return jsonify({'msg': 'Usuário cadastrado com sucesso!'}), 201
    except sqlite3.IntegrityError:
        return jsonify({'msg': 'E-mail já cadastrado!'}), 400
    finally:
        conn.close()

@app.route('/cadastro', methods=['POST'])
def cadastro():
    return register()

@app.route('/login', methods=['POST'])
def login():
    data = request.json
    conn = get_db()
    c = conn.cursor()
    c.execute("SELECT id, nome, curso FROM users WHERE email=? AND senha=?", (data['email'], data['senha']))
    user = c.fetchone()
    conn.close()
    if user:
        return jsonify({'id': user[0], 'nome': user[1], 'curso': user[2]}), 200
    else:
        return jsonify({'msg': 'Credenciais inválidas!'}), 401

@app.route('/publish', methods=['POST'])
def publish():
    if 'capa' not in request.files:
        return jsonify({'msg': 'Arquivo de capa não enviado!'}), 400
    file = request.files['capa']
    if file.filename == '' or not allowed_file(file.filename):
        return jsonify({'msg': 'Arquivo de capa inválido!'}), 400
    
    # Verificar conteúdo sensível
    titulo = request.form.get('titulo')
    descricao = request.form.get('descricao')
    
    print(f"Verificando conteúdo para Título: \"{titulo}\" e Descrição: \"{descricao}\"") # Log antes da verificação
    
    if verificar_conteudo_sensivel(titulo) or verificar_conteudo_sensivel(descricao):
        return jsonify({'msg': 'O conteúdo contém linguagem ofensiva ou sensível. Por favor, revise o texto.'}), 400
    
    filename = secure_filename(file.filename)
    filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
    file.save(filepath)
    # Salvar o caminho relativo para uso no frontend
    capa_path = f'database/capas/{filename}'

    # Demais campos
    categoria = request.form.get('categoria')
    data_noticia = request.form.get('data')
    autor_id = request.form.get('autor_id')

    if not all([titulo, categoria, data_noticia, descricao, autor_id]):
        return jsonify({'msg': 'Todos os campos são obrigatórios!'}), 400

    conn = get_db()
    c = conn.cursor()
    c.execute("INSERT INTO news (titulo, categoria, data, descricao, capa, autor_id) VALUES (?, ?, ?, ?, ?, ?)",
              (titulo, categoria, data_noticia, descricao, capa_path, autor_id))
    conn.commit()
    conn.close()
    return jsonify({'msg': 'Notícia publicada com sucesso!'}), 201

@app.route('/mynews', methods=['GET'])
def mynews():
    autor_id = request.args.get('autor_id')
    conn = get_db()
    c = conn.cursor()
    c.execute("SELECT titulo, categoria, data, descricao, capa FROM news WHERE autor_id=?", (autor_id,))
    noticias = [dict(zip(['titulo', 'categoria', 'data', 'descricao', 'capa'], row)) for row in c.fetchall()]
    conn.close()
    return jsonify(noticias)

@app.route('/noticias', methods=['GET'])
def noticias():
    url = f'https://newsapi.org/v2/top-headlines?sources=google-news-br&apiKey={NEWS_API_KEY}'
    try:
        r = requests.get(url)
        data = r.json()
        if 'articles' in data:
            return jsonify(data['articles'][:6])
        else:
            return jsonify([])
    except Exception as e:
        return jsonify([])

@app.route('/capas/<filename>')
def get_capa(filename):
    return send_from_directory(app.config['UPLOAD_FOLDER'], filename)

@app.route('/allnews', methods=['GET'])
def allnews():
    conn = get_db()
    c = conn.cursor()
    c.execute("SELECT titulo, categoria, data, descricao, capa FROM news")
    noticias = [dict(zip(['titulo', 'categoria', 'data', 'descricao', 'capa'], row)) for row in c.fetchall()]
    conn.close()
    return jsonify(noticias)

@app.route('/comentarios', methods=['GET'])
def get_comentarios():
    conn = get_db()
    c = conn.cursor()
    c.execute("SELECT id, texto, nome, curso, data, user_id, likes FROM comentarios")
    rows = c.fetchall()
    comentarios = []
    for row in rows:
        comentarios.append({
            'id': row[0],
            'texto': row[1],
            'nome': row[2],
            'curso': row[3],
            'data': row[4],
            'user_id': row[5],
            'likes': json.loads(row[6]) if row[6] else []
        })
    conn.close()
    return jsonify(comentarios)

@app.route('/comentarios', methods=['POST'])
def add_comentario():
    data = request.json
    texto = data.get('texto')
    
    # Verificar conteúdo sensível
    logger.info(f"Verificando conteúdo do comentário: {texto}")
    if verificar_conteudo_sensivel(texto):
        return jsonify({'msg': 'O comentário contém linguagem ofensiva ou sensível. Por favor, revise o texto.'}), 400
    
    conn = get_db()
    c = conn.cursor()
    c.execute(
        "INSERT INTO comentarios (texto, nome, curso, data, user_id, likes) VALUES (?, ?, ?, ?, ?, ?)",
        (texto, data.get('nome'), data.get('curso'), data.get('data'), data.get('user_id'), '[]')
    )
    conn.commit()
    conn.close()
    return jsonify({'msg': 'Comentário adicionado!'}), 201

@app.route('/comentarios/<int:comentario_id>/like', methods=['POST'])
def like_comentario(comentario_id):
    data = request.json
    user_id = data.get('user_id')
    conn = get_db()
    c = conn.cursor()
    c.execute("SELECT likes FROM comentarios WHERE id=?", (comentario_id,))
    row = c.fetchone()
    if not row:
        conn.close()
        return jsonify({'msg': 'Comentário não encontrado!'}), 404
    likes = json.loads(row[0]) if row[0] else []
    if user_id not in likes:
        likes.append(user_id)
        c.execute("UPDATE comentarios SET likes=? WHERE id=?", (json.dumps(likes), comentario_id))
        conn.commit()
    conn.close()
    return jsonify({'msg': 'Like registrado!'}), 200

@app.route('/health')
def health_check():
    return jsonify({'status': 'healthy'}), 200

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8010, debug=True) 