import sqlite3
import os

# Obtém o caminho absoluto do diretório atual
current_dir = os.path.dirname(os.path.abspath(__file__))
db_path = os.path.join(current_dir, 'database', 'data.db')

def limpar_banco():
    try:
        # Conecta ao banco de dados
        conn = sqlite3.connect(db_path)
        c = conn.cursor()
        
        # Limpa as tabelas
        c.execute('DELETE FROM comentarios;')
        c.execute('DELETE FROM news;')
        
        # Reseta os contadores de ID
        c.execute('DELETE FROM sqlite_sequence WHERE name="comentarios";')
        c.execute('DELETE FROM sqlite_sequence WHERE name="news";')
        
        # Commit das alterações
        conn.commit()
        print('✅ Banco de dados limpo com sucesso!')
        print('   - Tabela de notícias limpa')
        print('   - Tabela de comentários limpa')
        print('   - Contadores de ID resetados')
        
    except sqlite3.Error as e:
        print(f'❌ Erro ao limpar o banco de dados: {str(e)}')
    finally:
        if conn:
            conn.close()

if __name__ == '__main__':
    limpar_banco() 