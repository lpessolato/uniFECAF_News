// Configurações globais
const API_KEY = 'AIzaSyBwFbh9z8n_6Cn9Hl2w8OMZWU_jkF7hWiQ'; // Substitua pela sua chave API do Gemini
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';

// Funções de utilidade
const utils = {
    async checkContent(content) {
        try {
            const response = await fetch(GEMINI_API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${API_KEY}`
                },
                body: JSON.stringify({
                    contents: [{
                        parts: [{
                            text: `Analise o seguinte conteúdo e determine se contém linguagem ofensiva ou sensível: "${content}"`
                        }]
                    }]
                })
            });

            const data = await response.json();
            return data.candidates[0].content.parts[0].text.toLowerCase().includes('ofensivo') ||
                   data.candidates[0].content.parts[0].text.toLowerCase().includes('sensível');
        } catch (error) {
            console.error('Erro ao verificar conteúdo:', error);
            return false;
        }
    },

    showAlert(message, type = 'error') {
        const alertDiv = document.createElement('div');
        alertDiv.className = `alert alert-${type}`;
        alertDiv.textContent = message;
        document.body.insertBefore(alertDiv, document.body.firstChild);
        setTimeout(() => alertDiv.remove(), 5000);
    }
};

// Gerenciamento de autenticação
const auth = {
    isLoggedIn() {
        return localStorage.getItem('user') !== null;
    },

    login(userData) {
        localStorage.setItem('user', JSON.stringify(userData));
    },

    logout() {
        localStorage.removeItem('user');
        window.location.href = 'login.html';
    },

    getCurrentUser() {
        const user = localStorage.getItem('user');
        return user ? JSON.parse(user) : null;
    }
};

// Gerenciamento de posts
const posts = {
    async createPost(postData) {
        const isOffensive = await utils.checkContent(postData.content);
        if (isOffensive) {
            utils.showAlert('O conteúdo contém linguagem ofensiva ou sensível. Por favor, revise seu post.');
            return false;
        }
        // Implementar lógica de criação de post
        return true;
    },

    async createComment(commentData) {
        const isOffensive = await utils.checkContent(commentData.content);
        if (isOffensive) {
            utils.showAlert('O comentário contém linguagem ofensiva ou sensível. Por favor, revise seu comentário.');
            return false;
        }
        // Implementar lógica de criação de comentário
        return true;
    }
};

// Inicialização da página
const page = {
    initBasePage() {
        this.updateNavigation();
        this.setupEventListeners();
        this.checkAuthRequiredPages();
    },

    initLoginPage() {
        this.initBasePage();
        const loginForm = document.querySelector('.login-form');
        if (loginForm) {
            loginForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const email = document.getElementById('email').value;
                const senha = document.getElementById('senha').value;
                
                try {
                    const response = await fetch('http://localhost:8010/login', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({ email, senha })
                    });

                    const data = await response.json();
                    
                    if (response.ok) {
                        auth.login(data);
                        utils.showAlert('Login realizado com sucesso!', 'success');
                        window.location.href = 'index.html';
                    } else {
                        utils.showAlert(data.msg || 'Erro ao fazer login', 'error');
                    }
                } catch (error) {
                    utils.showAlert('Erro ao conectar com o servidor', 'error');
                }
            });
        }
    },

    initCadastroPage() {
        this.initBasePage();
        const cadastroForm = document.querySelector('.cadastro-form');
        if (cadastroForm) {
            cadastroForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const senha = document.getElementById('senha').value;
                const confirmarSenha = document.getElementById('confirmar-senha').value;
                
                if (senha !== confirmarSenha) {
                    utils.showAlert('As senhas não coincidem', 'error');
                    return;
                }

                const formData = new FormData(cadastroForm);
                const userData = {
                    nome: formData.get('nome'),
                    curso: formData.get('curso'),
                    email: formData.get('email'),
                    senha: formData.get('senha')
                };

                try {
                    const response = await fetch('http://localhost:8010/cadastro', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify(userData)
                    });

                    const data = await response.json();
                    
                    if (response.ok) {
                        utils.showAlert('Cadastro realizado com sucesso!', 'success');
                        window.location.href = 'login.html';
                    } else {
                        utils.showAlert(data.msg || 'Erro ao realizar cadastro', 'error');
                    }
                } catch (error) {
                    utils.showAlert('Erro ao conectar com o servidor', 'error');
                }
            });
        }
    },

    initCriarPostPage() {
        this.initBasePage();
        const postForm = document.getElementById('post-form');
        if (postForm) {
            postForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                if (!auth.isLoggedIn()) {
                    utils.showAlert('Você precisa estar logado para criar um post', 'error');
                    window.location.href = 'login.html';
                    return;
                }

                const postText = document.getElementById('post-text').value;
                const postData = {
                    content: postText,
                    userId: auth.getCurrentUser().id
                };

                try {
                    const response = await fetch('http://localhost:8010/posts', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify(postData)
                    });

                    const data = await response.json();
                    
                    if (response.ok) {
                        utils.showAlert('Post criado com sucesso!', 'success');
                        window.location.href = 'comunidade.html';
                    } else {
                        utils.showAlert(data.msg || 'Erro ao criar post', 'error');
                    }
                } catch (error) {
                    utils.showAlert('Erro ao conectar com o servidor', 'error');
                }
            });
        }
    },

    initHomePage() {
        this.initBasePage();

        // Seção de Notícia Destaque
        const destaqueContainer = document.getElementById('noticia-destaque-container');
        if (destaqueContainer) {
            fetch('http://localhost:8010/noticias')
                .then(res => res.json())
                .then(noticias => {
                    if (noticias && noticias.length > 0) {
                        const noticiaDestaque = noticias[0]; // Pegar a primeira notícia como destaque
                        destaqueContainer.innerHTML = `
                            <div class="noticia-capa">
                                <img src="${noticiaDestaque.urlToImage || 'assets/exemplo-capa.png'}" alt="Capa da notícia destaque">
                            </div>
                            <div class="noticia-info">
                                <h3>${noticiaDestaque.title || 'Título da Notícia Destaque'}</h3>
                                <span class="noticia-data">${new Date(noticiaDestaque.publishedAt).toLocaleDateString('pt-BR') || ''}</span>
                                <p>${noticiaDestaque.description ? noticiaDestaque.description.substring(0, 150) : ''}...</p>
                                <a href="${noticiaDestaque.url || '#'}" class="noticia-link" target="_blank">Veja mais</a>
                            </div>
                        `;
                    } else {
                        destaqueContainer.innerHTML = '<p>Nenhuma notícia de destaque encontrada.</p>';
                    }
                })
                .catch(() => {
                    destaqueContainer.innerHTML = '<p>Erro ao carregar notícia destaque.</p>';
                });
        }

        // Seção de Lista de Notícias (já existente)
        const noticiasLista = document.getElementById('noticias-lista');
        if (!noticiasLista) return;

        fetch('http://localhost:8010/allnews') // Mantém a busca das notícias locais
            .then(res => res.json())
            .then(noticias => {
                if (!noticias || noticias.length === 0) {
                    noticiasLista.innerHTML = '<p>Nenhuma notícia encontrada.</p>';
                    return;
                }
                noticiasLista.innerHTML = '';
                noticias.forEach((noticia, idx) => {
                    const capa = noticia.capa && noticia.capa !== ''
                        ? `http://localhost:8010/capas/${noticia.capa.split('/').pop()}`
                        : 'assets/exemplo-capa.png';
                    const card = document.createElement('div');
                    card.className = 'noticia-card'; // Mantém a classe para estilização
                    card.innerHTML = `
                        <div class="noticia-capa">
                            <img src="${capa}" alt="Capa da notícia">
                        </div>
                        <div class="noticia-info">
                            <h3>${noticia.titulo || `NOTÍCIA #${idx + 1}`}</h3>
                            <span class="noticia-data">${noticia.data || ''}</span>
                            <p>${noticia.descricao ? noticia.descricao.substring(0, 150) : ''}...</p>
                        </div>
                    `;
                    noticiasLista.appendChild(card);
                });
            })
            .catch(() => {
                noticiasLista.innerHTML = '<p>Erro ao carregar notícias.</p>';
            });
    },

    initMinhasNoticiasPage() {
        this.initBasePage();
        const noticiasLista = document.getElementById('noticias-lista');
        if (!noticiasLista) return;

        const user = auth.getCurrentUser();
        if (!user) {
            noticiasLista.innerHTML = '<p>Você precisa estar logado para ver suas notícias.</p>';
            return;
        }

        fetch(`http://localhost:8010/mynews?autor_id=${user.id}`)
            .then(res => res.json())
            .then(noticias => {
                if (!noticias || noticias.length === 0) {
                    noticiasLista.innerHTML = '<p>Você ainda não publicou nenhuma notícia.</p>';
                    return;
                }
                noticiasLista.innerHTML = '';
                noticias.forEach((noticia, idx) => {
                    const capa = noticia.capa && noticia.capa !== '' 
                        ? `http://localhost:8010/capas/${noticia.capa.split('/').pop()}`
                        : 'assets/exemplo-capa.png';
                    const card = document.createElement('div');
                    card.className = 'noticia-card';
                    card.innerHTML = `
                        <div class="noticia-capa">
                            <img src="${capa}" alt="Capa da notícia">
                        </div>
                        <div class="noticia-info">
                            <h3>${noticia.titulo || `NOTÍCIA #${idx + 1}`}</h3>
                            <span class="noticia-data">${noticia.data || ''}</span>
                            <p>${noticia.descricao ? noticia.descricao.substring(0, 150) : ''}...</p>
                        </div>
                    `;
                    noticiasLista.appendChild(card);
                });
            })
            .catch(() => {
                noticiasLista.innerHTML = '<p>Erro ao carregar suas notícias.</p>';
            });
    },

    initPublicarPage() {
        this.initBasePage();
        const publicarForm = document.getElementById('publicar-form');
        const capaInput = document.getElementById('capa');
        const capaPreview = document.getElementById('capa-preview');

        if (capaInput && capaPreview) {
            capaInput.addEventListener('change', function(e) {
                const file = e.target.files[0];
                if (file) {
                    const reader = new FileReader();
                    reader.onload = function(e) {
                        // Adiciona estilo para redimensionar a imagem
                        capaPreview.innerHTML = `<img src="${e.target.result}" alt="Preview da capa" style="max-width: 100%; height: auto;">`;
                    };
                    reader.readAsDataURL(file);
                }
            });
        }

        if (publicarForm) {
            publicarForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                if (!auth.isLoggedIn()) {
                    utils.showAlert('Você precisa estar logado para publicar uma notícia', 'error');
                    window.location.href = 'login.html';
                    return;
                }

                const formData = new FormData();
                formData.append('titulo', document.getElementById('titulo').value);
                formData.append('categoria', document.getElementById('categoria').value);
                formData.append('data', document.getElementById('data').value);
                formData.append('descricao', document.getElementById('descricao').value);
                formData.append('capa', document.getElementById('capa').files[0]);
                formData.append('autor_id', auth.getCurrentUser().id);

                try {
                    const response = await fetch('http://localhost:8010/publish', {
                        method: 'POST',
                        body: formData
                    });

                    const data = await response.json();
                    
                    if (response.ok) {
                        utils.showAlert('Notícia publicada com sucesso!', 'success');
                        window.location.href = 'minhas-noticias.html';
                    } else {
                        if (response.status === 400 && data.msg.includes('linguagem ofensiva')) {
                            utils.showAlert('A notícia contém linguagem ofensiva ou sensível. Por favor, revise o texto e tente novamente.', 'error');
                        } else {
                            utils.showAlert(data.msg || 'Erro ao publicar notícia', 'error');
                        }
                    }
                } catch (error) {
                    utils.showAlert('Erro ao conectar com o servidor', 'error');
                }
            });
        }
    },

    initComunidadesPage() {
        this.initBasePage();
        // Adicione aqui lógica específica da página Comunidades
    },

    initComunidadePage() {
        this.initBasePage();
        const comentariosLista = document.getElementById('comentarios-lista');
        const comentarioInput = document.getElementById('comentario-input');
        const btnComentar = document.getElementById('btn-comentar');
        const user = auth.getCurrentUser();

        // Bloquear interação se não estiver logado
        if (!user) {
            document.getElementById('comentario-form-container').innerHTML = '<p style="color:#fff;text-align:center">Faça login para comentar e interagir.</p>';
            comentariosLista.innerHTML = '';
            return;
        }

        // Carregar comentários do backend
        function carregarComentarios() {
            fetch('http://localhost:8010/comentarios')
                .then(res => res.json())
                .then(comentarios => {
                    comentariosLista.innerHTML = '';
                    comentarios.forEach(comentario => {
                        const card = document.createElement('div');
                        card.className = 'comentario-card';
                        const likes = comentario.likes || [];
                        const hasLiked = likes.includes(user.id);
                        
                        card.innerHTML = `
                            <div class="comentario-header">
                                <span class="comentario-nome">${comentario.nome}</span>
                                <span class="comentario-curso">${comentario.curso}</span>
                                <span class="comentario-data">${comentario.data}</span>
                            </div>
                            <div class="comentario-texto">${comentario.texto}</div>
                            <div class="comentario-actions">
                                <button class="comentario-like ${hasLiked ? 'liked' : ''}" data-id="${comentario.id}">
                                    <i class="fas fa-heart"></i>
                                    <span>${likes.length}</span>
                                </button>
                            </div>
                        `;
                        comentariosLista.appendChild(card);
                    });

                    // Adicionar evento de like
                    document.querySelectorAll('.comentario-like').forEach(btn => {
                        btn.onclick = function() {
                            const id = this.getAttribute('data-id');
                            fetch(`http://localhost:8010/comentarios/${id}/like`, {
                                method: 'POST',
                                headers: {'Content-Type': 'application/json'},
                                body: JSON.stringify({ user_id: user.id })
                            }).then(() => carregarComentarios());
                        };
                    });
                });
        }

        carregarComentarios();

        // Adicionar novo comentário
        btnComentar.onclick = function() {
            const texto = comentarioInput.value.trim();
            if (!texto) return;
            
            fetch('http://localhost:8010/comentarios', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    texto,
                    nome: user.nome,
                    curso: user.curso,
                    data: new Date().toLocaleDateString('pt-BR'),
                    user_id: user.id
                })
            })
            .then(response => response.json())
            .then(data => {
                if (data.msg.includes('linguagem ofensiva')) {
                    utils.showAlert('Seu comentário contém linguagem ofensiva ou sensível. Por favor, revise o texto.', 'error');
                } else {
                    comentarioInput.value = '';
                    carregarComentarios();
                    utils.showAlert('Comentário adicionado com sucesso!', 'success');
                }
            })
            .catch(error => {
                utils.showAlert('Erro ao adicionar comentário. Tente novamente.', 'error');
            });
        };
    },

    updateNavigation() {
        const loginLink = document.getElementById('login-link');
        const logoutLink = document.getElementById('logout-link');
        
        if (auth.isLoggedIn()) {
            if (loginLink) loginLink.style.display = 'none';
            if (logoutLink) logoutLink.style.display = 'block';
        } else {
            if (loginLink) loginLink.style.display = 'block';
            if (logoutLink) logoutLink.style.display = 'none';
        }
    },

    checkAuthRequiredPages() {
        // Lista de páginas que requerem autenticação
        const authRequiredPages = [
            'minhas-noticias.html',
            'publicar.html'
        ];

        const currentPage = window.location.pathname.split('/').pop();
        if (authRequiredPages.includes(currentPage) && !auth.isLoggedIn()) {
            utils.showAlert('Você precisa estar logado para acessar esta página.', 'error');
            window.location.href = 'login.html';
        }
    },

    setupEventListeners() {
        const logoutLink = document.getElementById('logout-link');
        if (logoutLink) {
            logoutLink.addEventListener('click', (e) => {
                e.preventDefault();
                auth.logout();
            });
        }

        // Adicionar listeners para formulários de post e comentário
        const postForm = document.querySelector('form[data-type="post"]');
        if (postForm) {
            postForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                if (!auth.isLoggedIn()) {
                    utils.showAlert('Você precisa estar logado para publicar.', 'error');
                    window.location.href = 'login.html';
                    return;
                }
                const formData = new FormData(postForm);
                const postData = {
                    content: formData.get('content'),
                    title: formData.get('title')
                };
                
                if (await posts.createPost(postData)) {
                    postForm.submit();
                }
            });
        }
    }
};

// Exportar funções para uso global
window.auth = auth;
window.posts = posts;
window.utils = utils;
window.page = page; 