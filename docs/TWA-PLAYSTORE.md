# TWA — AO CÊNTIMO na Play Store

O site passa a app Android por **Trusted Web Activity** (TWA): a Play Store
distribui uma casca que abre `aocentimo.pt` em ecrã inteiro, sem barra de
browser. O conteúdo é sempre o site — uma atualização ao site atualiza a app
sem publicação nova na loja.

## O que já está no repo

| Peça | Onde |
|---|---|
| Web App Manifest conforme TWA (`id`, `start_url`, `scope`, `display`, ícones 96–512 + maskable) | `src/app/manifest.ts` → `/manifest.webmanifest` |
| **Digital Asset Links** — prova ao Android que a app `pt.aocentimo.twa` pode abrir o domínio | `public/.well-known/assetlinks.json` → `https://aocentimo.pt/.well-known/assetlinks.json` |
| Ícones extra (192/144/96) | `public/icon-*.png` |
| `.nojekyll` (o Pages serviria `.well-known/` sem ele? — já existia; garante que a pasta chega) | `public/.nojekyll` |

## O que é local e NUNCA vai para o git (`twa/`, gitignored)

- `twa/aocentimo.keystore` — **keystore de assinatura** (RSA 2048, 30 anos,
  alias `aocentimo`). Perdê-lo = nunca mais atualizar a app na Play Store.
  Fazer cópia de segurança fora do disco.
- `twa/keystore-password.txt` — a password do keystore.
- `twa/listagem/` — artefactos da ficha da loja:
  `feature-graphic-1024x500.png` (obrigatória) + screenshots
  `shot-1-mapa.png`, `shot-2-bomba.png`, `shot-3-salario.png` (1080×2340).
- (opcional) `twa/app/` — o projeto Bubblewrap, se for gerado aqui.

Fingerprint SHA-256 da chave local (já está no `assetlinks.json`):

```
13:A0:D2:C5:84:F4:F6:C0:63:07:21:BA:6A:99:7E:D6:8B:9D:95:92:8A:EF:0A:60:39:12:A9:0B:89:59:19:36
```

Re-obter: `keytool -list -v -keystore twa/aocentimo.keystore -alias aocentimo`

## Passos (na ordem)

1. **Fundir + publicar este PR.** O `assetlinks.json` tem de estar no ar
   **antes** de a app ser testada — o Chrome verifica-o ao arrancar e cai
   para "Custom Tab com barra" se não o encontrar.
   Confirmar: `curl https://aocentimo.pt/.well-known/assetlinks.json`.

2. **Pré-requisitos locais:** JDK 17 ✓ (Temurin instalado). Falta o Android
   SDK — instalar `cmdline-tools` ou Android Studio. Alternativa sem SDK:
   <https://www.pwabuilder.com> gera o pacote na cloud (pede manifest + ícone).

3. **Gerar a app com Bubblewrap:**

   ```bash
   npm install -g @bubblewrap/cli
   mkdir twa\app && cd twa\app
   bubblewrap init --manifest https://aocentimo.pt/manifest.webmanifest
   # responde: package pt.aocentimo.twa · keystore ../aocentimo.keystore
   #           alias aocentimo · password em ../keystore-password.txt
   bubblewrap build        # → app-release-signed.aab
   ```

4. **Testar o AAB/APK** num telemóvel (`bubblewrap install` ou upload
   interno na Play Console). Abrir → tem de aparecer **sem barra de URL**.
   Se aparecer barra: `assetlinks` errado ou ainda não publicado — o
   verificador oficial é
   `https://digitalassetlinks.googleapis.com/v1/statements:list?source.web.site=https://aocentimo.pt&relation=delegate_permission/common.handle_all_urls`.

5. **Play Console** (conta dev: 25 $, verificação de identidade):
   - Criar app «AO CÊNTIMO», package `pt.aocentimo.twa` (não muda NUNCA).
   - **Play App Signing**: ao ativar, a Google re-assina — ir a
     *Setup → App integrity*, copiar o **SHA-256 do certificado de assinatura
     da app** e **acrescentá-lo ao array** em
     `public/.well-known/assetlinks.json` (os dois fingerprints vivem juntos:
     o local para builds de teste, o da Google para a produção). Sem este
     passo a app da loja abre com barra de URL.
   - Upload do `.aab` na faixa interna/fechada primeiro.

6. **Ficha da loja:**
   - Ícone de alta resolução 512×512 → `public/icon-512.png`
   - Feature graphic 1024×500 → `twa/listagem/feature-graphic-1024x500.png`
   - Screenshots telemóvel (mín. 2) → `twa/listagem/shot-*.png`
   - Categoria: Finanças ou Educação. Data safety: **tudo "não recolhe"**
     (o site não tem cookies, analytics nem contas).
   - ⚠️ **Privacy policy URL é obrigatória** mesmo sem recolha de dados —
     apontar para uma página do site que diga isso. A casa não tem página
     de privacidade; ou se usa `/sobre`, ou se cria uma nota curta
     (decisão de copy do dono).

## O que muda no dia a dia

Nada. TWA não é PWA convertido — **é o site**. Cada deploy publica a app.
Só se volta ao Bubblewrap se mudarem: manifest (nome, ícone, cores),
domínio, ou package name.
