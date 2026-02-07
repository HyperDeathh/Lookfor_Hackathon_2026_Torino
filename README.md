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


## Docker ile Calistirma

### Gereksinimler
- Docker Desktop yüklü olmalıdır.

### Calistirma
```bash
docker-compose up --build
```
Uygulama `http://localhost:3000` adresinde çalışacaktır.

## Klasor Yapisi

- `src/app`: Next.js App Router sayfalari ve API route'lari
- `src/lib/langgraph`: LangGraph giris noktasi
- `src/lib/agents`: Ajan registry ve workflow altyapisi
- `src/lib/llm`: LLM istemcisi ve konfigurasyonlar
- `src/lib/config`: Ortam degiskenleri

