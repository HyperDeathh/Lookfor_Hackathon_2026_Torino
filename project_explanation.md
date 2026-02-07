# Lookfor: Proje Tam Kapsamlı Teknik Analiz ve Dokümantasyon

## 1. Proje Özeti ve Vizyonu

**Lookfor**, e-ticaret operasyonlarını otonom hale getirmeyi amaçlayan, yapay zeka tabanlı bir **"Agentic" (Ajan Tabanlı)** asistan projesidir. Geleneksel chatbot'lardan farklı olarak, sadece soruları cevaplamakla kalmaz, entegre olduğu sistemler (Shopify, Skio) üzerinde **gerçek işlemler** (sipariş iptali, iade, abonelik değişikliği vb.) yapabilir.

Bu proje, bir "Hackathon" ürünü olarak tasarlanmış olup, modern yazılım mimarisi ve en güncel AI teknolojilerini bir araya getirmektedir.

---

## 2. Mimari Yapı (Architecture)

Projenin beyni, **LangChain** ve **LangGraph** üzerine kuruludur.

### 2.1. LangGraph ile Durum Yönetimi (State Management)
Sistem, doğrusal bir akış (Zincir/Chain) yerine, döngüsel bir grafik (Graph) üzerinde çalışır. Bu yapı, karmaşık diyalogları yönetmeyi mümkün kılar.

*   **Router (Yönlendirici):** Kullanıcıdan gelen ilk mesajı analiz eder ve hangi "Uzman Ajan"ın devreye girmesi gerektiğine karar verir.
    *   *Örnek:* "Siparişim nerede?" -> `OrderManagementAgent`
    *   *Örnek:* "Aboneliğimi iptal et" -> `SubscriptionAgent`
*   **State (Durum):** Diyalog geçmişi, kullanıcının niyeti ve işlem durumu (`isEscalated` vb.) bir "State" objesinde tutulur ve düğümler (nodes) arasında taşınır.
*   **Human-in-the-loop:** Eğer AI bir işlemi yapamayacağına karar verirse veya riskli bir durum sezerse, `escalate_to_human` aracını kullanarak durumu insan operatöre devreder.

### 2.2. Tool (Araç) Sistemi
LLM (Large Language Model), dış dünyayla "Araçlar" (Tools) aracılığıyla konuşur. Bu araçlar, belirli bir Zod şemasına sahip TypeScript fonksiyonlarıdır.

*   **Dinamik Seçim:** Model, hangi aracı kullanacağına o anki duruma göre kendisi karar verir.
*   **Structured Output:** Araçlardan dönen veriler, LLM tarafından işlenerek kullanıcıya doğal bir dille sunulur.

---

## 3. Entegrasyonlar ve Yetenekler

### 3.1. Shopify Entegrasyonu
E-ticaretin kalbi olan Shopify ile derinlemesine entegrasyon sağlanmıştır.

*   **Veri Okuma:**
    *   `shopify_get_order_details`: Sipariş durumu ve detayları.
    *   `shopify_get_customer_orders`: Müşterinin geçmiş siparişleri.
    *   `shopify_get_product_recommendations`: Ürün önerileri.
*   **İşlem Yapma (Write Actions):**
    *   `shopify_cancel_order`: Sipariş iptali.
    *   `shopify_create_return`: İade süreci başlatma.
    *   `shopify_update_order_shipping_address`: Adres güncelleme.
    *   `shopify_create_discount_code`: Özel indirim kuponu oluşturma.

### 3.2. Skio Entegrasyonu
Abonelik tabanlı e-ticaret modelleri için Skio API'leri kullanılır.

*   **Abonelik Yönetimi:**
    *   `skio_get_subscription`: Mevcut abonelik detaylarını görme.
    *   `skio_update_subscription_date`: Sonraki gönderim tarihini öteleme veya değiştirme.
    *   `skio_cancel_subscription`: Abonelik iptali.

---

## 4. Teknoloji Yığını (Tech Stack)

### Backend & AI
*   **LangChain / LangGraph:** AI orkestrasyonu.
*   **OpenAI GPT-4 Turbo:** Akıl yürütme ve doğal dil işleme motoru.
*   **Node.js / TypeScript:** Güvenli ve tip korumalı backend mantığı.

### Frontend
*   **Next.js 16 (App Router):** Performanslı ve modern React framework'ü.
*   **Tailwind CSS v4:** Hızlı UI geliştirme.
*   **Framer Motion:** Akıcı arayüz animasyonları.
*   **Lucide React:** Modern ikon seti.

### Altyapı
*   **Docker:** Uygulamanın izole ve taşınabilir olmasını sağlar.
*   **Docker Compose:** Servislerin (Web, Database vb.) tek komutla ayağa kaldırılması.

---

## 5. Kurulum ve Çalıştırma

Proje, Docker ile saniyeler içinde ayağa kalkacak şekilde tasarlanmıştır.

1.  `.env.local` dosyasını oluşturun ve API anahtarlarını (OpenAI, Shopify, Skio) girin.
2.  Terminalde şu komutu çalıştırın:
    ```bash
    docker-compose up --build
    ```
3.  Tarayıcıda `http://localhost:3000` adresine gidin.

---

## 6. Sıkça Sorulan Sorular (SSS)

**S: Bu proje gerçek bir mağazada çalışır mı?**
C: Evet, API anahtarları girildiği takdirde gerçek bir Shopify mağazasıyla tam senkronize çalışır. Ancak test aşamasında "Development Store" kullanılması önerilir.

**S: Yeni bir özellik nasıl eklenir?**
C: `src/tools` klasörüne yeni bir fonksiyon ekleyip, bunu `workflow.ts` içindeki araç setine dahil etmeniz yeterlidir. LLM, yeni aracı otomatik olarak tanıyacak ve yeri geldiğinde kullanacaktır.

**S: Neden LangGraph?**
C: Standart zincirler (Chains) tek yönlüdür. Ancak bir müşteri temsilcisi diyaloğu döngüseldir (Soru -> Cevap -> Yeni Soru -> İşlem -> Onay -> Bitiş). LangGraph bu döngüyü yönetmek için en uygun yapıdır.
