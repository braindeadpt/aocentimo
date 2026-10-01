import coreWebVitals from "eslint-config-next/core-web-vitals";
import typescript from "eslint-config-next/typescript";

const eslintConfig = [
  ...coreWebVitals,
  ...typescript,
  {
    // design/prototipos/** são as maquetes V5, não código de produção — o
    // próprio README dos protótipos diz que não são código de produção. São
    // JS simples com require(), lido no browser sem compilar, e não devem
    // pagar as regras de TypeScript do site. Sem esta excepção, `npm run lint`
    // falha em montar.cjs e `personagens.js` com avisos que não são de ninguém.
    ignores: [
      "node_modules/**",
      ".next/**",
      "playwright-report/**",
      "test-results/**",
      "design/**",
      ".preview-scratch/**", // chunks minificados de builds de sessões vizinhas (ignorado pelo git)
      // o anexo OCR de docs/ arquiva o script EXATO que produziu a prova
      // (require() CommonJS, byte-idêntico ao original de .preview-scratch/ocr);
      // é documento/prova, não código — ver docs/ANEXO-OCR-IMI-FAMILIAR-PORTO/README.md
      "docs/ANEXO-OCR-IMI-FAMILIAR-PORTO/run-ocr.cjs",
    ],
  },
];

export default eslintConfig;
