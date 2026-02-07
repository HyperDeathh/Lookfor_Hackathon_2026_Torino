# Lookfor: Yeni Nesil E-Ticaret AI Asistanı

![Next.js](https://img.shields.io/badge/Next.js-16.0-black)
![LangChain](https://img.shields.io/badge/LangChain-Integration-blue)
![Docker](https://img.shields.io/badge/Docker-Ready-2496ED)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6)

**Lookfor**, Shopify ve Skio altyapılarını kullanan e-ticaret işletmeleri için geliştirilmiş, otonom yeteneklere sahip akıllı bir müşteri hizmetleri asistanıdır. Klasik chatbot'ların ötesine geçerek, **LangGraph** mimarisi sayesinde karmaşık diyalogları yönetir ve **Tool** kullanımı ile gerçek zamanlı işlemler (sipariş iptali, abonelik yönetimi vb.) gerçekleştirir.

---

## Öne Çıkan Özellikler

- **Ajan Tabanlı Mimari (Agentic AI):** `LangGraph` kullanarak durum tabanlı (stateful) ve döngüsel iş akışlarını yönetir. Kullanıcının niyetini anlar ve ilgili alt ajana yönlendirir.
- **Derin E-Ticaret Entegrasyonu:**
  - **Shopify:** Sipariş sorgulama, iade oluşturma, adres güncelleme, ürün önerileri.
  - **Skio:** Abonelik dondurma, iptal etme, tarih değişiklikleri.
- **İnsan Gözetimi (Human-in-the-Loop):** AI'ın çözemediği veya riskli gördüğü durumlarda konuyu insan operatöre eskalasyon (`escalate_to_human`) mekanizması ile devreder.
- **Modern Teknoloji Yığını:** Next.js 16 App Router ve React 19 ile en güncel web standartlarında geliştirilmiştir.

##Teknolojiler

Bu proje aşağıdaki modern teknolojiler üzerine inşa edilmiştir:

- **Frontend & Core:** [Next.js 16](https://nextjs.org/), [React 19](https://react.dev/), [TypeScript](https://www.typescriptlang.org/)
- **Styling:** [Tailwind CSS v4](https://tailwindcss.com/), [Lucide React](https://lucide.dev/), [Framer Motion](https://www.framer.com/motion/)
- **AI & Logic:** [LangChain](https://js.langchain.com/), [LangGraph](https://langchain-ai.github.io/langgraph/), [OpenAI GPT-4](https://openai.com/)
- **DevOps:** Docker, Docker Compose

## Proje Yapısı

```
src/
├── app/            # Next.js App Router sayfaları ve API rotaları
├── components/     # UI bileşenleri (Button, ChatInterface vb.)
├── lib/
│   ├── agents/     # Ajan tanımları ve Router mantığı
│   ├── langgraph/  # State Graph ve Workflow konfigürasyonu
│   ├── llm/        # OpenAI istemci ayarları
│   └── config/     # Ortam değişkenleri
└── tools/          # LangChain Tool tanımları (Shopify/Skio fonksiyonları)
```

## Kurulum ve Çalıştırma

Projeyi yerel ortamınızda çalıştırmak için aşağıdaki adımları izleyin.

### Gereksinimler

- Node.js 18+ veya Docker Desktop
- OpenAI API Anahtarı
- Shopify / Skio API Erişimleri

### 1. Repoyu Klonlayın

```bash
git clone https://github.com/HyperDeathh/Lookfor_Hackathon_2026_Torino
cd lookfor
```

### 2. Ortam Değişkenlerini Ayarlayın

`.env.example` dosyasını `.env.local` olarak kopyalayın ve gerekli anahtarları girin:

```bash
cp .env.example .env.local
```

### 3. Bağımlılıkları Yükleyin ve Çalıştırın

```bash
npm install
npm run dev
```
Uygulama `http://localhost:3000` adresinde çalışacaktır.

---

## Docker ile Çalıştırma

Projeyi konteynerize edilmiş bir ortamda çalıştırmak için Docker Compose kullanabilirsiniz.

```bash
# Servisi ayağa kaldır
docker-compose up --build

# Arka planda çalıştırmak için
docker-compose up -d
```

## Ajan Yetenekleri (Tools)

Ajan, `src/tools/` altında tanımlı aşağıdaki araçları kullanabilir:

- `shopify_get_order_details`: Sipariş durumu sorgulama.
- `shopify_cancel_order`: Sipariş iptali.
- `shopify_create_return`: İade talebi oluşturma.
- `skio_get_subscription`: Abonelik bilgilerini getirme.
- `skio_update_subscription_date`: Abonelik tarihini değiştirme.
- Ve daha fazlası...
