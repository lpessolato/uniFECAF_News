# UniFECAF Notícias

Sistema de gerenciamento de notícias para a UniFECAF, desenvolvido com Flask e React.

## 📋 Índice

- [Visão Geral](#visão-geral)
- [Arquitetura](#arquitetura)
- [Configuração do Ambiente](#configuração-do-ambiente)
- [API Documentation](#api-documentation)
- [Funcionalidades](#funcionalidades)
- [Tecnologias Utilizadas](#tecnologias-utilizadas)
- [Estrutura do Projeto](#estrutura-do-projeto)
- [Segurança](#segurança)

## 🎯 Visão Geral

O UniFECAF Notícias é uma plataforma completa para gerenciamento e compartilhamento de notícias dentro da comunidade acadêmica da UniFECAF. O sistema permite que usuários cadastrados publiquem, gerenciem e interajam com notícias através de comentários e likes.

## 🏗️ Arquitetura

O projeto segue uma arquitetura cliente-servidor:
- **Frontend**: Aplicação React com interface moderna e responsiva
- **Backend**: API RESTful desenvolvida em Flask
- **Banco de Dados**: SQLite para armazenamento persistente
- **Containerização**: Docker para ambiente de desenvolvimento e produção

## ⚙️ Configuração do Ambiente

### Pré-requisitos
- Docker
- Docker Compose
- Node.js (para desenvolvimento frontend)
- Python 3.8+ (para desenvolvimento backend)

### Instalação

1. Clone o repositório:
```bash
git clone [URL_DO_REPOSITÓRIO]
cd uniFECAF_News
```

2. Configure as variáveis de ambiente:
```bash
cp back-end/.env.example back-end/.env
# Edite o arquivo .env com suas configurações
```

3. Inicie os containers:
```bash
cd back-end
docker-compose up -d
```

4. Para desenvolvimento frontend:
```bash
cd Front-end
npm install
npm start
```

## 📚 API Documentation

A documentação completa da API está disponível em dois formatos:

- **Swagger UI**: http://localhost:8010/swagger
- **ReDoc**: http://localhost:8010/redoc

### Principais Endpoints

#### Autenticação
- `POST /register` - Cadastro de usuário
- `POST /login` - Login de usuário

#### Notícias
- `POST /publish` - Publicar nova notícia
- `GET /noticias` - Listar notícias
- `GET /mynews` - Listar notícias do usuário
- `GET /allnews` - Listar todas as notícias

#### Comentários
- `GET /comentarios` - Listar comentários
- `POST /comentarios` - Adicionar comentário
- `POST /comentarios/{id}/like` - Curtir comentário

## ✨ Funcionalidades

- **Autenticação**
  - Login/Cadastro de usuários
  - Perfis personalizados por curso

- **Gerenciamento de Notícias**
  - Publicação com imagem de capa
  - Categorização
  - Moderação de conteúdo (usando IA)

- **Interação**
  - Sistema de comentários
  - Likes em comentários
  - Comunidades por curso

## 🛠️ Tecnologias Utilizadas

### Frontend
- React
- HTML5
- CSS3
- JavaScript (ES6+)

### Backend
- Python 3.8+
- Flask
- SQLite
- Gunicorn

### DevOps
- Docker
- Docker Compose
- Gunicorn

### Segurança
- CORS
- Validação de conteúdo
- Sanitização de inputs

## 📁 Estrutura do Projeto

```
uniFECAF_News/
├── back-end/
│   ├── app.py
│   ├── Dockerfile
│   ├── docker-compose.yml
│   ├── requirements.txt
│   └── database/
├── Front-end/
│   ├── src/
│   ├── public/
│   └── package.json
└── README.md
```

## 🔒 Segurança

- Validação de conteúdo usando IA (Gemini API)
- Sanitização de inputs
- Proteção contra XSS
- CORS configurado
- Validação de arquivos de upload

## 👥 Usuário de Teste

Para facilitar os testes do sistema, foi criado um usuário padrão:

- **Email**: admin@unifecaf.com
- **Senha**: admin123
- **Nome**: Admin Teste
- **Curso**: ADMINISTRAÇÃO

## 📝 Licença
