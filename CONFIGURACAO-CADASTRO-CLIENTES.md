# Cadastro administrativo de clientes

Esta versão adiciona um fluxo seguro para o painel ADMIN criar um cliente e o casamento em uma única etapa.

## Como funciona

1. A administradora entra normalmente no site.
2. No painel `#/admin`, usa **+ Novo cliente**.
3. O site chama a Edge Function `admin-create-client`.
4. A função valida se o usuário conectado possui `role = 'admin'`.
5. A função cria o usuário no Supabase Auth.
6. O trigger já existente cria o perfil `client`.
7. A função cria o casamento e vincula `client_user_id` ao novo usuário.
8. O cliente entra com o e-mail e senha provisória e, por RLS, enxerga apenas o próprio casamento.

## Implantar a Edge Function pelo Dashboard do Supabase

No projeto **magia-do-sim**:

1. Abra **Edge Functions**.
2. Clique em **Deploy a new function**.
3. Escolha **Via Editor**.
4. Nome da função: `admin-create-client`.
5. Substitua o conteúdo do editor pelo arquivo:
   `supabase/functions/admin-create-client/index.ts`
6. Clique em **Deploy function**.

Não cole nenhuma Secret Key no GitHub ou no código do navegador. O Supabase injeta automaticamente as variáveis de servidor usadas pela função.

## Segurança

- A Publishable Key continua no `app.js` e pode ficar pública.
- A Secret Key existe apenas no ambiente da Edge Function.
- A função confere no servidor se o chamador é ADMIN.
- Um CLIENT não consegue usar a função para criar outros usuários.
- O RLS continua limitando o cliente ao casamento associado ao seu usuário.

## Depois do deploy

Teste no painel ADMIN:

1. Clique em **+ Novo cliente**.
2. Informe nome, e-mail e uma senha provisória com pelo menos 8 caracteres.
3. Informe os dados principais do casamento.
4. Clique em **Criar acesso**.
5. Confirme em **Authentication > Users** que o usuário foi criado.
6. Entre em uma janela anônima usando o novo cliente e confirme que ele enxerga apenas o próprio casamento.

## Observação

A senha provisória deve ser entregue ao cliente por um canal privado. O fluxo de recuperação de senha já está disponível na tela de login.
