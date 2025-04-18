const API_URL = "http://localhost:3000/api/cliente"
let editingId = null


// Função auxiliar para evitar XSS
function escapeHtml(str) {
    return str.replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

async function getCliente() {
    const res = await fetch(API_URL);
    if (!res.ok) throw new Error("Falha ao buscar dados");
    return await res.json();
}

async function fetchCliente() {
    try {
        const list = document.getElementById("listaClientes");
        if (!list) return;

        const res = await fetch(API_URL);
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        const data = await res.json();

        list.innerHTML = "";
        data.forEach(cliente => {
            const li = document.createElement("li");
            li.id = `cliente-${cliente.id_cliente}`;
            li.innerHTML = `
                <div class="dados-texto">
                    <p><strong>Nome:</strong> ${escapeHtml(cliente.nome_cliente)}</p>
                    <p><strong>Sobrenome:</strong> ${escapeHtml(cliente.sobrenome_cliente)}</p>
                    <p><strong>Telefone:</strong> ${escapeHtml(cliente.telefone)}</p>
                    <p><strong>CPF:</strong> ${escapeHtml(cliente.cpf)}</p>
                    <p><strong>Email:</strong> ${escapeHtml(cliente.email)}</p>
                </div>
                
                <div class="botoes-container">
                    <div class="botoes-superiores botoes-conta">
                        <button class="botao-primario btn-editar" onclick="editarCliente('${cliente.id_cliente}', '${escapeHtml(cliente.nome_cliente)}', '${escapeHtml(cliente.sobrenome_cliente)}', '${escapeHtml(cliente.telefone)}', '${escapeHtml(cliente.cpf)}', '${escapeHtml(cliente.email)}')">Editar</button>
                        <button class="botao-primario" onclick="deletarCliente('${cliente.id_cliente}')">Excluir</button>
                    </div>
                    <div class="botoes-inferiores">
                        <button class="botao-primario botao-logout" onclick="logout()">Logout</button>
                        <button class="botao-primario botao-voltar" onclick="window.location.href='index.html'">Voltar</button>
                    </div>
                </div>
            `;
            list.appendChild(li);
        });
    } catch (error) {
        console.error("Erro ao buscar clientes:", error);
        if (document.getElementById("listaClientes")) {
            alert("Falha ao carregar clientes.");
        }
    }
}

function emailValido(email) {
    const regexEmail = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return regexEmail.test(email);
}

function validarCPF(cpf) {
    cpf = cpf.replace(/[^\d]+/g, ''); // remove pontos e traço

    if (cpf.length !== 11 || /^(\d)\1+$/.test(cpf)) {
        return false;
    }

    // Validar 1º dígito
    let soma = 0;
    for (let i = 0; i < 9; i++) {
        soma += parseInt(cpf[i]) * (10 - i);
    }
    let dig1 = 11 - (soma % 11);
    if (dig1 >= 10) dig1 = 0;

    // Validar 2º dígito
    soma = 0;
    for (let i = 0; i < 10; i++) {
        soma += parseInt(cpf[i]) * (11 - i);
    }
    let dig2 = 11 - (soma % 11);
    if (dig2 >= 10) dig2 = 0;

    // Verifica se os dígitos batem
    return cpf[9] == dig1 && cpf[10] == dig2;
}

async function validarDados(validarSenha = true) {
    const nome_cliente = document.getElementById("nome_cliente")?.value;
    const sobrenome_cliente = document.getElementById("sobrenome_cliente")?.value;
    const telefone = document.getElementById("telefone")?.value;
    const cpf = document.getElementById("cpf")?.value;
    const email = document.getElementById("email")?.value;
    const senha = document.getElementById("senha")?.value;

    // Verifica se estamos na página de cadastro
    if (
        nome_cliente === undefined ||
        sobrenome_cliente === undefined ||
        telefone === undefined ||
        cpf === undefined ||
        email === undefined ||
        (validarSenha && senha === undefined) // Só valida a existência da senha se for pra validar mesmo
    ) {
        return;
    }

    // Verificação de e-mail duplicado (só para criação, não para edição)
    if (!editingId) {
        const cliente = await getCliente();
        if (cliente.some(cliente => cliente.email === email)) {
            alert("E-mail já cadastrado.");
            return;
        }
    }

    // --- Validações ANTES da requisição ---
    if (
        !nome_cliente ||
        !sobrenome_cliente ||
        !telefone ||
        !cpf ||
        !email ||
        (validarSenha && !senha)
    ) {
        alert("Por favor, preencha todos os campos solicitados.");
        return;
    }

    if (nome_cliente.length < 3 || nome_cliente.length > 50) {
        alert("O nome de usuário deve ter entre 3 a 50 caracteres.");
        return;
    }

    if (sobrenome_cliente.length < 3 || sobrenome_cliente.length > 50) {
        alert("O sobrenome de usuário deve ter entre 3 a 50 caracteres.");
        return;
    }

    if (telefone.length < 17) {
        alert("Telefone inválido. O telefone deve ser feito no seguinte modelo: +99 (99) 99999-9999.");
        return;
    }

    if (!validarCPF(cpf)) {
        alert("CPF inválido. O CPF deve ser feito no seguinte modelo: 999.999.999-99.");
        return;
    }

    if (email.length < 8 || email.length > 100) {
        alert("E-mail inválido. O e-mail deve ter entre 8 e 100 caracteres.");
        return;
    }

    if (!emailValido(email)) {
        alert("Por favor, insira um e-mail válido.");
        return;
    }

    if (validarSenha && (senha.length < 8 || senha.length > 50 || !senha.match(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^\w\s]).{8,}$/))) {
        alert("Senha inválida. A senha deve ter 8 a 50 caracteres, incluindo pelo menos uma letra maiúscula, uma letra minúscula, um número e um caractere especial.");
        return;
    }
    const resultado = {
        nome_cliente,
        sobrenome_cliente,
        telefone,
        cpf,
        email
    };

    if (validarSenha && senha) {
        resultado.senha = senha;
    } else if (!validarSenha && senha) {
        resultado.senha = senha; // só envia se foi digitada durante edição
    }

    return resultado;
}

async function criarCliente() {
    const dados = await validarDados(true);
    if (!dados) return;

    try {
        const response = await fetch(API_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(dados)
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || "Falha ao criar cliente");
        }

        alert("Cliente criado com sucesso!");
        alert("Por favor, efetue o login!");
        window.location.href = "Login.html";

    } catch (error) {
        console.error("Erro detalhado:", error);
        alert(error.message);
    }
}

async function deletarCliente(id) {
    if (!id) {
        console.error("ID não fornecido para exclusão.");
        return;
    }

    if (!confirm("Tem certeza que deseja excluir a conta?")) return;

    try {
        const res = await fetch(`${API_URL}/${id}`, {  // Corrigido: usando o parâmetro 'id'
            method: "DELETE"
        });

        if (!res.ok) {
            const errorData = await res.json();
            throw new Error(errorData.error || "Falha ao excluir");
        }

        localStorage.removeItem('token')

        alert("Conta excluida com sucesso!");
        window.location.href = "index.html";
        await fetchCliente();  // Corrigido: chamando fetchCliente() em vez de fetchItems()
    } catch (error) {
        console.error("Erro ao excluir:", error);
        alert(`Não foi possível excluir: ${error.message}`);
    }
}

function editarCliente(id_cliente, nome_cliente, sobrenome_cliente, telefone, cpf, email) {
    console.log("Editando:", { id_cliente, nome_cliente, sobrenome_cliente, telefone, cpf, email }); // Debug

    const formEdicao = document.getElementById("form-edicao");
    if (formEdicao) {
        // Preenche os campos
        document.getElementById("nome_cliente").value = nome_cliente || '';
        document.getElementById("sobrenome_cliente").value = sobrenome_cliente || '';
        document.getElementById("telefone").value = telefone || '';
        document.getElementById("cpf").value = cpf || '';
        document.getElementById("email").value = email || '';

        const btnAtualizar = document.getElementById("btn-atualizar");

        // Limpa qualquer evento anterior
        btnAtualizar.onclick = null;

        // Adiciona novo listener
        btnAtualizar.onclick = function () {
            atualizarCliente(id_cliente);
        };

        // Alterna a visibilidade
        document.getElementById("listaClientes").style.display = "none";
        formEdicao.style.display = "block";
        editingId = id_cliente;
    }
}

async function atualizarCliente(id) {
    const dados = await validarDados(false);
    console.log("Dados para atualizar:", dados);
    if (!dados) return;

    try {
        const response = await fetch(`${API_URL}/${id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(dados)
        });

        if (!response.ok) throw new Error("Falha na atualização");

        const infos = await response.json();
        console.log("Resposta da API:", infos);

        if (response.ok) {
            // Atualiza o token APENAS se existir na resposta
            if (infos.token) {
                localStorage.setItem('token', JSON.stringify(infos.token));
            }
            alert("Dados atualizados com sucesso!");
        }

        cancelarEdicao();
        fetchCliente();
    } catch (error) {
        console.error("Erro ao atualizar:", error);
        alert("Erro ao atualizar dados");
    }
}

function cancelarEdicao() {
    document.getElementById("listaClientes").style.display = "block";
    document.getElementById("form-edicao").style.display = "none";
    editingId = null;
}

async function login() {
    const email = document.getElementById("login-email").value;
    const senha = document.getElementById("login-senha").value;

    if (!email || !senha) {
        return alert("Por favor, preencha todos os campos.");
    }

    try {
        const res = await fetch(`${API_URL}/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, senha })
        });

        if (!res.ok) throw new Error(`Erro HTTP! status: ${res.status}`);

        const data = await res.json();

        if (data.success) {
            alert("Login bem-sucedido!");
            localStorage.setItem('token', JSON.stringify(data.token));
            // Armazena o usuário no localStorage
            window.location.href = "index.html";
        } else {
            alert(data.message || "E-mail ou senha incorretos.");
        }
    } catch (error) {
        console.error("Erro ao fazer login:", error);
        alert("Erro ao fazer login. Tente novamente.");
    }
}

function logout() {
    if (confirm('Deseja realmente sair da sua conta?')) {
        localStorage.removeItem('token');
        window.location.href = 'index.html';
    }
}

async function verificarLogin() {
    // Verifica se há dados de usuário no localStorage
    const userData = localStorage.getItem('token');

    if (userData) {
        // Usuário está logado - redireciona para a página de conta
        window.location.href = 'Conta.html';
    } else {
        // Usuário não está logado - mostra alerta e redireciona para login
        alert("Para ver os dados de sua conta, você precisa efetuar o login!");
        window.location.href = 'Login.html';
    }
}
document.addEventListener('DOMContentLoaded', () => {
    // --- Configuração do Botão de Conta (funciona em todas as páginas) ---
    const accountButton = document.getElementById('accountButton');
    if (accountButton) {
        accountButton.removeEventListener('click', verificarLogin); // Limpeza preventiva
        accountButton.addEventListener('click', verificarLogin);
    }

    // --- Verificação de Página Específica ---
    const isCadastroPage = window.location.pathname.includes('Cadastro.html');
    const isLoginPage = window.location.pathname.includes('Login.html');

    // Página de Cadastro: Carrega dados do cliente
    if (isCadastroPage) {
        fetchCliente();
    }

    // Página de Login: Configura o botão de login
    if (isLoginPage) {
        const loginButton = document.getElementById('loginButton');
        if (loginButton) {
            loginButton.addEventListener('click', login);
        }
    }
});


fetchCliente()