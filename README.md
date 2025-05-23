# UniFECAF Notícias

Sistema de gerenciamento de notícias para a UniFECAF.

## Configuração do Ambiente

### Pré-requisitos
- Docker
- Docker Compose

### Instalação

1. Clone o repositório
2. Navegue até a pasta do projeto
3. Execute o comando para iniciar os containers:
```bash
cd back-end
docker-compose up -d
```

## Usuário de Teste

Para facilitar os testes do sistema, foi criado um usuário padrão com as seguintes credenciais:

- **Email**: admin@unifecaf.com
- **Senha**: admin123
- **Nome**: Admin Teste
- **Curso**: ADMINISTRAÇÃO

## Funcionalidades

- Login/Cadastro de usuários
- Publicação de notícias
- Gerenciamento de notícias
- Comunidades
- Comentários

## Tecnologias Utilizadas

- Frontend: HTML, CSS, JavaScript
- Backend: Python (Flask)
- Banco de Dados: SQLite
- Containerização: Docker 