# LangChain Kullanım Kılavuzu: Proje İçi Detaylı Analiz

Bu doküman, projemizde **LangChain** kütüphanesinin neden ve nasıl kullanıldığını, özellikle **Tool (Araç)** tanımlamaları ve **LangGraph** ile iş akışı yönetimi bağlamında teknik detaylarıyla açıklamaktadır.

## 1. LangChain Nedir?

LangChain, Büyük Dil Modelleri (LLM - Large Language Models) ile uygulama geliştirmeyi kolaylaştıran, standartlaştıran ve güçlendiren açık kaynaklı bir framework'tür. 

Temel olarak şu bileşenleri sağlar:
- **Models:** Farklı LLM sağlayıcılarına (OpenAI, Anthropic, vb.) tek bir arayüzden erişim.
- **Prompts:** Dinamik ve yönetilebilir prompt şablonları.
- **Tools:** LLM'lerin dış dünya ile etkileşime girmesini sağlayan fonksiyonlar (API çağrıları, veritabanı sorguları vb.).
- **Chains & Agents:** Birden fazla işlemi veya kararı birbirine bağlayan yapılar.
- **Memory:** Konuşma geçmişini ve durumu yönetme yeteneği.

---

## 2. Neden Kullanıyoruz?

Projemizde LangChain kullanmamızın temel sebepleri şunlardır:

1.  **Soyutlama ve Standartlaştırma:** OpenAI veya başka bir model sağlayıcısının API'si değişse bile, LangChain arayüzü sayesinde kodumuzda minimum değişiklikle uyum sağlayabiliriz.
2.  **Yapılandırılmış Çıktı (Structured Output):** LLM'den sadece metin değil, JSON formatında, belirli bir şemaya (Zod schema) uygun veriler almamızı kolaylaştırır. Bu, özellikle tool kullanımında kritiktir.
3.  **LangGraph ile Akış Kontrolü:** Karmaşık diyalog yönetimini (Router -> Agent -> Tool -> Response döngüsü) bir **State Machine (Durum Makinesi)** mantığıyla yönetmemizi sağlar.
4.  **Tool Entegrasyonu:** Fonksiyonları LLM'in anlayabileceği bir formata çevirmek ve çağırmak için hazır yapılar sunar.

---

## 3. Projede LangChain Nasıl Kullanılıyor?

Projemizdeki LangChain kullanımı üç ana dosyada toplanmıştır:

### A. LLM Bağlantısı (`src/lib/llm/client.ts`)

Burada `ChatOpenAI` sınıfı kullanılarak model yapılandırılır.

```typescript
import { ChatOpenAI } from '@langchain/openai'

export const getLlm = () => {
  return new ChatOpenAI({
    apiKey: OPENAI_API_KEY,
    model: 'gpt-4-turbo', // Model seçimi
    temperature: 0.2      // Yaratıcılık seviyesi (Düşük = Daha tutarlı)
  })
}
```
*   **Neden?** Model parametrelerini tek bir yerden yönetmek ve LangChain ekosistemine dahil etmek için.

---

### B. Tool (Araç) Tanımlamaları (`src/lib/agents/tools.ts`)

LangChain'in en güçlü yanlarındaniri **Tool** sistemidir. LLM'in kendi başına yapamadığı (örn: veritabanına erişmek, Shopify API'sini çağırmak) işlemleri yapmasını sağlar.

**Nasıl Tanımlanır?**
`@langchain/core/tools` paketinden `tool` fonksiyonu ve parametre doğrulama için `zod` kullanılır.

```typescript
import { tool } from '@langchain/core/tools'
import { z } from 'zod'

export const shopify_get_order_details = tool(
  // 1. Gerçekleşecek İşlem (Fonksiyon)
  async input => {
    return await shopifyGetOrderDetails(input)
  },
  {
    // 2. Metadata (LLM'in bu aracı ne zaman kullanacağını anlaması için)
    name: 'shopify_get_order_details',
    description: 'Get details of a specific order by ID',
    
    // 3. Şema (LLM'in hangi parametreleri göndermesi gerektiğini belirtir)
    schema: z.object({
      orderId: z.string()
    })
  }
)
```

**Teknik Detaylar:**
1.  **Schema (Zod):** LLM'e "Bana `orderId` adında bir string vermen zorunlu" der. LLM bu şemaya uymaya zorlanır.
2.  **Description:** LLM, kullanıcının isteği ile bu açıklamayı eşleştirir. "Siparişim nerede?" sorusu geldiğinde, bu açıklamadaki "Get details of order" ifadesiyle eşleşir.
3.  **ToolNode:** Bu tools, `workflow.ts` içinde `ToolNode`'a toplu olarak verilir (`ALL_TOOLS` dizisi).

---

### C. İş Akışı ve LangGraph (`src/lib/agents/workflow.ts`)

Projemizdeki "Agent" mantığı **LangGraph** üzerine kuruludur. LangGraph, LangChain üzerinde çalışan, döngüsel (cyclic) ve durum tabanlı (stateful) iş akışları oluşturmayı sağlayan bir kütüphanedir.

**Yapı:**
Bir `StateGraph` (Durum Grafiği) oluşturulur. Bu grafik **Node (Düğüm)** ve **Edge (Kenar)**'lardan oluşur.

1.  **State (Durum):**
    Grafik boyunca taşınan veri yapısıdır (`GraphState`). Mesaj geçmişini (`messages`), mevcut niyeti (`intent`) ve eskalasyon durumunu (`isEscalated`) tutar.

2.  **Nodes (Düğümler):**
    İşlemlerin yapıldığı duraklardır.
    *   `router`: Kullanıcının ne istediğini anlar (Sipariş mi? İade mi?).
    *   `order_management`, `sales_product` vb.: Özelleşmiş alt ajanlar.
    *   `tools`: LLM bir tool çağırmaya karar verdiyse, bu node o tool'u çalıştırır.

3.  **Edges (Kenarlar):**
    Akışın yönünü belirler.
    *   `routeToAgent`: Router'dan sonra hangi ajana gidileceğine karar verir.
    *   `shouldContinue`: Ajan bir cevap mı üretti yoksa bir tool mu çağırmak istiyor?
        *   Tool çağıracaksa -> `tools` node'una git.
        *   Cevap bittiyse -> `END` (Kullanıcıya yanıt dön).

**Kod Örneği (Akış Mantığı):**

```typescript
const workflow = new StateGraph(GraphState)
    // Node'ları Ekle
    .addNode('router', routerNode)
    .addNode('order_management', orderManagementAgentNodeWithDebug)
    .addNode('tools', toolNodeWithEscalation) // ToolNode entegrasyonu

    // Akışı Tanımla
    .addEdge(START, 'router') // Başlangıç -> Router
    
    // Router Kararına Göre Dallan
    .addConditionalEdges('router', routeToAgent, [
      'order_management',
      'sales_product',
       // ... diğerleri
    ])
    
    // Ajan Kararına Göre (Tool mu? Yanıt mı?)
    .addConditionalEdges('order_management', shouldContinue, ['tools', END])
    
    // Tool Çalıştıktan Sonra
    .addConditionalEdges('tools', routeToolOutput, [/* tekrar ilgili ajana dön */])
```

---

## 4. Kavramsal Analoji: Fabrika Benzetmesi ("Tool Yöneticisi")

Sorunuza istinaden, bu yapıları şu şekilde hayal edebilirsiniz:

**1. LLM (GPT-4)** = **Zeki Mühendis**
   - Ne yapılması gerektiğini bilir, sorunları anlar.
   - Ancak elleri yoktur, fiziksel işlem yapamaz (Veritabanına bakamaz, API çağıramaz).

**2. Tools (Araçlar)** = **Mühendisin Kullandığı Aletler**
   - Çekiç, tornavida, bilgisayar terminali vb.
   - `shopify_get_order_details`, `refund_order` gibi fonksiyonlardır.
   - LLM'e (Mühendise) bu aletleri verirsiniz: *"Al bu aletleri, biriyle sipariş bakarsın, diğeriyle iade yaparsın"* dersiniz.

**3. LangChain** = **Alet Kutusu ve İletişim Protokolü**
   - Aletlerin nasıl tutulacağını, nasıl kullanılacağını standartlaştırır.
   - Mühendisin (LLM'in) aletleri tanımasını sağlar.

**4. LangGraph** = **Saha Şefi / Proje Yöneticisi (Workflow Manager)**
   - Mühendise (LLM'e) *ne zaman* hangi aleti kullanacağını söylemez, ama **iş akışını** yönetir.
   - Şef der ki: *"Önce Router masasına git, müşteriyi dinle. İade istiyorsa İade Bölümü'ne git. Orada alet kullanman gerekirse alet kutusunu (Tools Node) aç. İş bitince bana rapor ver."*
   - LangGraph, bu **dolaşımı** yönetir. Mühendis bir tool kullanmak istediğinde, LangGraph onu alır, tool'u gerçekten çalıştırır ve sonucu mühendise geri getirir.

**Özetle:**
Evet, **LangGraph sizin "Tool Yöneticiniz"dir**. Ajanın (LLM'in) bir tool kullanma isteğini yakalar (`shouldContinue`), o tool'u çalıştırır (`ToolNode`) ve sonucunu alıp tekrar ajanın önüne koyar. Ajan tek başına sadece "Şunu yapmak istiyorum" der, LangGraph onu "Yaptın, işte sonucu" diyerek tamamlar.
