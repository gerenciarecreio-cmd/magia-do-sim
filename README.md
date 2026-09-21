# A Magia do Sim — Área dos Noivos

Versão conectada ao Supabase, preparada para vários usuários.

## O que esta versão faz

- Login real por e-mail e senha com Supabase Auth.
- Sessão persistente.
- Perfil `admin`: vê todos os casamentos e seleciona qual deseja gerenciar.
- Perfil `client`: vê somente o casamento vinculado ao próprio usuário.
- Casamentos, fornecedores, checklist, reuniões, documentos e financeiro usando o banco Supabase.
- RLS continua protegendo os dados no banco.
- Recuperação de senha por e-mail.

## Antes de publicar

1. Abra o Supabase → SQL Editor.
2. Execute o arquivo `supabase-multiusuario.sql` uma vez.
3. Em Authentication → URL Configuration, configure o Site URL para:
   `https://gerenciarecreio-cmd.github.io/magia-do-sim/`
4. Adicione o mesmo endereço em Redirect URLs.
5. No GitHub, substitua `index.html`, `app.js` e `README.md` e adicione `supabase-multiusuario.sql`.

## Como cadastrar um novo cliente

1. Supabase → Authentication → Users → Add user.
2. Crie e-mail e senha do cliente.
3. O trigger cria automaticamente um perfil `client`.
4. Entre no site com a conta administradora.
5. Painel admin → Criar casamento → selecione o cliente → salve.

A partir daí, quando esse cliente fizer login, verá somente o casamento vinculado ao usuário dele.

## Observação sobre documentos

Nesta versão, o cadastro de documento aceita um link de arquivo. O upload direto de PDF/imagem pode ser habilitado depois com Supabase Storage.
