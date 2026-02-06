# Lookfor Multi-Agent Studio

Modern Next.js + TypeScript uygulamasi. LangGraph tabanli multi-agent altyapi icin hazir iskelet.

## Kurulum

```bash
npm install
```

## Gelistirme

```bash
npm run dev
```

## Ortam Degiskenleri

`.env.example` dosyasini `.env.local` olarak kopyalayip degerleri doldurun.

## Klasor Yapisi

- `src/app`: Next.js App Router sayfalari ve API route'lari
- `src/lib/langgraph`: LangGraph giris noktasi
- `src/lib/agents`: Ajan registry ve workflow altyapisi
- `src/lib/llm`: LLM istemcisi ve konfigurasyonlar
- `src/lib/config`: Ortam degiskenleri
