const express = require('express');
const { engine } = require('express-handlebars');

const app = express();

app.engine('handlebars', engine({
    helpers: {
        eq: (a, b) => a === b
    }
}));

app.set('view engine', 'handlebars');
app.set('views', './views');

app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

const alunos = [
    {
        id: 1,
        nome: 'Pedro',
        email: 'pedro@email.com',
        idade: 17,
        curso: 'Desenvolvimento de Sistemas',
        turma: '2º DS',
        turno: 'Manhã',
        cidade: 'Campo Limpo Paulista',
        status: 'Ativo'
    },
    {
        id: 2,
        nome: 'Maria',
        email: 'maria@email.com',
        idade: 17,
        curso: 'Desenvolvimento de Sistemas',
        turma: '2º DS',
        turno: 'Manhã',
        cidade: 'Jundiaí',
        status: 'Ativo'
    },
    {
        id: 3,
        nome: 'João',
        email: 'joao@email.com',
        idade: 18,
        curso: 'Informática',
        turma: '3º INFO',
        turno: 'Tarde',
        cidade: 'Várzea Paulista',
        status: 'Inativo'
    },
    {
        id: 4,
        nome: 'Ana',
        email: 'ana@email.com',
        idade: 17,
        curso: 'Administração',
        turma: '2º ADM',
        turno: 'Noite',
        cidade: 'Jundiaí',
        status: 'Ativo'
    }
];

function validarAluno(dados, idAtual = null) {
    const erros = [];

    const nome = dados.nome ? dados.nome.trim() : '';
    const email = dados.email ? dados.email.trim().toLowerCase() : '';
    const idade = Number(dados.idade);
    const curso = dados.curso ? dados.curso.trim() : '';
    const turma = dados.turma ? dados.turma.trim() : '';
    const turno = dados.turno ? dados.turno.trim() : '';
    const cidade = dados.cidade ? dados.cidade.trim() : '';
    const status = dados.status ? dados.status.trim() : '';

    if (!nome || nome.length < 3) {
        erros.push('O nome deve ter ao menos 3 caracteres.');
    }

    if (!email || !email.includes('@')) {
        erros.push('Informe um e-mail válido.');
    }

    const emailDuplicado = alunos.some(aluno =>
        aluno.email.toLowerCase() === email &&
        aluno.id !== idAtual
    );

    if (emailDuplicado) {
        erros.push('Este e-mail já está cadastrado.');
    }

    if (!dados.idade || isNaN(idade) || idade < 16 || idade > 100) {
        erros.push('A idade deve estar entre 16 e 100 anos.');
    }

    if (!curso || curso.length < 2) {
        erros.push('Informe o curso.');
    }

    if (!turma || turma.length < 1) {
        erros.push('Informe a turma.');
    }

    if (!turno || !['Manhã', 'Tarde', 'Noite'].includes(turno)) {
        erros.push('Selecione um turno válido.');
    }

    if (!cidade || cidade.length < 2) {
        erros.push('Informe a cidade.');
    }

    if (!status || !['Ativo', 'Inativo'].includes(status)) {
        erros.push('Selecione um status válido.');
    }

    return erros;
}

app.get('/', (req, res) => {
    const totalAlunos = alunos.length;
    const alunosAtivos = alunos.filter(aluno => aluno.status === 'Ativo').length;
    const alunosInativos = alunos.filter(aluno => aluno.status === 'Inativo').length;

    const mediaIdade = totalAlunos > 0
        ? (
            alunos.reduce((total, aluno) => total + aluno.idade, 0) /
            totalAlunos
        ).toFixed(1)
        : 0;

    const ultimosAlunos = [...alunos]
        .sort((a, b) => b.id - a.id)
        .slice(0, 3);

    res.render('home', {
        totalAlunos,
        alunosAtivos,
        alunosInativos,
        mediaIdade,
        ultimosAlunos
    });
});

app.get('/alunos', (req, res) => {
    const busca = req.query.busca ? req.query.busca.trim() : '';
    const cursoSelecionado = req.query.curso || '';
    const statusSelecionado = req.query.status || '';

    let lista = [...alunos];

    if (busca) {
        const termo = busca.toLowerCase();

        lista = lista.filter(aluno =>
            aluno.nome.toLowerCase().includes(termo) ||
            aluno.email.toLowerCase().includes(termo) ||
            aluno.curso.toLowerCase().includes(termo)
        );
    }

    if (cursoSelecionado) {
        lista = lista.filter(aluno =>
            aluno.curso === cursoSelecionado
        );
    }

    if (statusSelecionado) {
        lista = lista.filter(aluno =>
            aluno.status === statusSelecionado
        );
    }

    lista.sort((a, b) =>
        a.nome.localeCompare(b.nome)
    );

    const cursos = [...new Set(
        alunos.map(aluno => aluno.curso)
    )]
        .sort()
        .map(curso => ({
            nome: curso,
            selecionado: curso === cursoSelecionado
        }));

    const status = [
        {
            nome: 'Ativo',
            selecionado: statusSelecionado === 'Ativo'
        },
        {
            nome: 'Inativo',
            selecionado: statusSelecionado === 'Inativo'
        }
    ];

    let sucesso = '';

    if (req.query.sucesso === 'cadastro') {
        sucesso = 'Aluno cadastrado com sucesso.';
    }

    if (req.query.sucesso === 'edicao') {
        sucesso = 'Aluno atualizado com sucesso.';
    }

    if (req.query.sucesso === 'exclusao') {
        sucesso = 'Aluno excluído com sucesso.';
    }

    res.render('alunos', {
        lista,
        busca,
        cursos,
        status,
        sucesso,
        totalFiltrado: lista.length
    });
});

app.get('/alunos/:id', (req, res) => {
    const id = Number(req.params.id);

    const aluno = alunos.find(aluno =>
        aluno.id === id
    );

    if (!aluno) {
        return res.status(404).send('Aluno não encontrado.');
    }

    res.render('detalhes', {
        aluno
    });
});

app.get('/cadastro', (req, res) => {
    res.render('cadastro');
});

app.post('/cadastro', (req, res) => {
    const dados = req.body;

    const erros = validarAluno(dados);

    if (erros.length > 0) {
        return res.render('cadastro', {
            erros,
            aluno: dados
        });
    }

    const novoId = alunos.length > 0
        ? Math.max(...alunos.map(aluno => aluno.id)) + 1
        : 1;

    alunos.push({
        id: novoId,
        nome: dados.nome.trim(),
        email: dados.email.trim().toLowerCase(),
        idade: Number(dados.idade),
        curso: dados.curso.trim(),
        turma: dados.turma.trim(),
        turno: dados.turno,
        cidade: dados.cidade.trim(),
        status: dados.status
    });

    res.redirect('/alunos?sucesso=cadastro');
});

app.get('/editar/:id', (req, res) => {
    const id = Number(req.params.id);

    const aluno = alunos.find(aluno =>
        aluno.id === id
    );

    if (!aluno) {
        return res.status(404).send('Aluno não encontrado.');
    }

    res.render('editar', {
        aluno
    });
});

app.post('/editar/:id', (req, res) => {
    const id = Number(req.params.id);

    const aluno = alunos.find(aluno =>
        aluno.id === id
    );

    if (!aluno) {
        return res.status(404).send('Aluno não encontrado.');
    }

    const erros = validarAluno(req.body, id);

    if (erros.length > 0) {
        return res.render('editar', {
            erros,
            aluno: {
                id,
                ...req.body
            }
        });
    }

    aluno.nome = req.body.nome.trim();
    aluno.email = req.body.email.trim().toLowerCase();
    aluno.idade = Number(req.body.idade);
    aluno.curso = req.body.curso.trim();
    aluno.turma = req.body.turma.trim();
    aluno.turno = req.body.turno;
    aluno.cidade = req.body.cidade.trim();
    aluno.status = req.body.status;

    res.redirect('/alunos?sucesso=edicao');
});

app.post('/excluir/:id', (req, res) => {
    const id = Number(req.params.id);

    const indice = alunos.findIndex(aluno =>
        aluno.id === id
    );

    if (indice === -1) {
        return res.status(404).send('Aluno não encontrado.');
    }

    alunos.splice(indice, 1);

    res.redirect('/alunos?sucesso=exclusao');
});

app.listen(3000, () => {
    console.log('Servidor rodando em:');
    console.log('http://localhost:3000');
});