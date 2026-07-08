# Tech Store — Web Client (React)

Versão em React da aplicação Tech Store, migrada do projeto original em
HTML/CSS/JS puro (`tech-store-web-client`). Todo o visual (paleta escura,
tokens de design, layout do sidebar, tabelas, modais, badges etc.) foi
preservado — apenas a implementação passou a usar React + React Router.

## Stack

- [Vite](https://vitejs.dev/) + React 18
- [react-router-dom](https://reactrouter.com/) para as rotas (`/login`,
  `/dashboard`, `/produtos`, `/clientes`, `/vendas`, `/funcionarios`,
  `/empresas`, `/fornecedores`, `/categorias`)
- CSS puro (mesmos arquivos de `css/*.css` do projeto original, organizados
  em `src/styles/`)
- `fetch` puro para comunicação com a API (nenhuma dependência extra de
  HTTP client)

## Como rodar

```bash
npm install
npm run dev
```

A aplicação sobe em `http://localhost:5173`.

Para gerar a build de produção:

```bash
npm run build
npm run preview
```

## Configuração da API

A URL base do backend é configurável em tempo de execução, tanto na tela
de login quanto pelo botão "⚙️ API" na barra superior. Ela fica salva em
`localStorage` (`ts_api_url`), assim como no projeto original. Por padrão
aponta para `http://localhost:8080`.

## Estrutura de pastas

```
src/
  api/api.js              → todas as chamadas HTTP (mesmos endpoints do projeto original)
  context/
    AuthContext.jsx       → sessão do funcionário logado (substitui sessionStorage direto)
    ToastContext.jsx      → notificações toast (substitui window.Toast)
  components/
    AppLayout.jsx          → shell (sidebar + topbar + <Outlet/>)
    Sidebar.jsx / Topbar.jsx
    Modal.jsx / ConfirmModal.jsx / ApiSettingsModal.jsx
    AddressFields.jsx      → campos de endereço reaproveitados entre páginas
    TableHelpers.jsx       → Spinner / EmptyRow / LoadingRow / StatusBadge
    useConfirm.js          → hook que reproduz o confirmDelete() da versão vanilla
    ProtectedRoute.jsx     → guarda de rota (equivalente ao "auth guard" do index.html)
  pages/
    Login.jsx
    Dashboard.jsx
    Produtos.jsx
    Clientes.jsx
    Vendas.jsx
    Funcionarios.jsx
    Empresas.jsx
    Fornecedores.jsx
    Categorias.jsx
  styles/                  → variables.css, base.css, layout.css,
                             components.css, modal.css, login.css (idênticos
                             ao projeto original) + index.css que os importa
```

## O que mudou em relação à versão vanilla

- Navegação por rota real (`react-router-dom`) em vez do roteador manual
  baseado em `data-page` + `display:none/block`.
- Estado dos formulários e listas gerenciado com `useState`/`useEffect` em
  vez de manipulação direta do DOM.
- Toasts e modal de confirmação de exclusão viraram componentes/contextos
  React, mas o HTML/CSS renderizado é o mesmo.
- A sessão do usuário (login) usa `AuthContext`, guardando os mesmos dados
  em `sessionStorage` (chave única `ts_session`).
- Toda a lógica de negócio (validações do login, montagem de payloads,
  formatação de datas/moeda, cálculo de total da venda) foi mantida igual.

Nenhum endpoint de API foi alterado — o backend original continua
compatível sem nenhuma mudança.
