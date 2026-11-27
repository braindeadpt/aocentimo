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
  alias `aocentimo`). Fazer cópia de segurança fora do disco. Com
  Play App Signing ativo, esta passa a ser só a *chave de upload* — se se
  perder, a Play Console deixa repô-la; sem Play App Signing, perdê-la é
  nunca mais poder atualizar a app.
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

Fingerprint SHA-256 do **certificado de assinatura da app da Google**
(Play App Signing — também já está no `assetlinks.json`; copiado de
*Protegido com o Google Play → Gerir a Assinatura de apps do Play* em
2026-11-27):

```
F4:98:5F:6B:C9:DA:52:C0:6A:28:85:35:26:07:C6:E2:1E:2C:C1:D8:9A:65:25:8D:7D:E4:9E:0A:5E:5F:C0:22
```

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
   mkdir -p twa/app && cd twa/app
   bubblewrap init --manifest https://aocentimo.pt/manifest.webmanifest
   # responde: package pt.aocentimo.twa · keystore ../aocentimo.keystore
   #           alias aocentimo · password em ../keystore-password.txt
   bubblewrap build        # → app-release-signed.apk (teste local)
                           # + app-release-bundle.aab (Play Console)
   ```

4. **Testar local com o APK** (`bubblewrap install`, ou `adb install
   app-release-signed.apk`). O APK sai assinado com o keystore local — é
   este fingerprint que já está no `assetlinks.json`, por isso o teste
   local funciona antes de a loja existir. Abrir → tem de aparecer
   **sem barra de URL**.
   Se aparecer barra: `assetlinks` errado ou ainda não publicado — o
   verificador oficial é
   `https://digitalassetlinks.googleapis.com/v1/statements:list?source.web.site=https://aocentimo.pt&relation=delegate_permission/common.handle_all_urls`.

5. **Play Console** (conta dev: 25 $, verificação de identidade):
   - Criar app «AO CÊNTIMO», package `pt.aocentimo.twa` (não muda NUNCA).
   - **Play App Signing**: ao ativar, a Google re-assina. ✅ **FEITO
     (2026-11-27)**: o SHA-256 do certificado de assinatura da app da
     Google já está no array do `assetlinks.json`, ao lado do local (o
     local serve os builds de teste, o da Google serve a produção) —
     ver os dois fingerprints registados acima. O caminho na consola
     mudou: já não é *Setup → App integrity*, é *Protegido com o
     Google Play → Proteção da Play Store → Gerir a Assinatura de apps
     do Play*. O que falta aqui é só **verificação**: depois do
     merge+deploy, confirmar em *Links diretos* que `aocentimo.pt`
     passa a validar, e na primeira instalação da loja confirmar que
     a app abre **sem barra de URL**.
   - Upload do `app-release-bundle.aab` na faixa interna/fechada primeiro.
     ⚠️ No telemóvel de teste: **desinstala o APK local primeiro** — o
     build da loja vai assinado com o certificado da Google, e o Android
     recusa instalar uma assinatura diferente por cima (usa outro
     telemóvel ou desinstala).
     ⚠️ A instalação vinda da loja só fica sem barra **depois** de o
     `assetlinks.json` com o fingerprint da Google estar publicado — por
     isso a ordem é: ativar o signing → acrescentar o fingerprint →
     fundir+deploy → e só então verificar o build da faixa interna.

6. **Ficha da loja:**
   - Ícone de alta resolução 512×512 → `public/icon-512.png`
   - Feature graphic 1024×500 → `twa/listagem/feature-graphic-1024x500.png`
   - Screenshots telemóvel (mín. 2) → `twa/listagem/shot-*.png`
   - Categoria: Finanças ou Educação. Data safety: **tudo "não recolhe"**
     (o site não tem cookies, analytics nem contas).
   - ⚠️ **Privacy policy** — a Play exige duas coisas mesmo sem recolha
     de dados: um URL na consola **e** a política acessível dentro da
     própria app (numa TWA = uma página do site). A política da casa
     vive em **`/sobre#privacidade`** — na consola usa-se
     `https://aocentimo.pt/sobre#privacidade`.

## O que muda no dia a dia

Nada. TWA não é PWA convertido — **é o site**. Cada deploy publica a app.
Só se volta ao Bubblewrap se mudarem: manifest (nome, ícone, cores),
domínio, ou package name.
