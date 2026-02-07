# Lookfor Hackathon Use Cases

## Overview

This document outlines customer support use cases, workflows, and automation opportunities for the hackathon.

---

## Use Case Categories

### 1. Shipping Delay – Neutral Status Check (WISMO)

**Volume:** 4,700 tickets (37%)  
**Sentiment:** Neutral / Mildly Anxious  
**Notes:** Polite; includes order #. Easy to automate with tracking macro + reassurance.

#### Workflow

1. **Check the customer's orders**
   - If no order found, ask for the order ID and check again

2. **Give the current status update**
   - If unfulfilled, say it has not shipped yet
   - If fulfilled and in transit, say it is on the way
   - If delivered, say it is marked delivered

3. **If still in transit, set the wait promise based on contact day**
   - Customer contacts Mon to Wed: ask them to wait until Friday. If not delivered by then, offer a free resend
   - Customer contacts Thu to Sun: ask them to wait until early next week. If not delivered by then, offer a free resend

4. **If customer asks for tracking, share the tracking link**

5. **If they reply after the promised date and it is still not delivered, escalate the ticket** to let the human agent process resend

#### Example Summaries

- "Order #43189 shows 'in transit' for 10 days. Any update?"
- "Hi, just curious when my BuzzPatch will arrive to Toronto."
- "Can you confirm the estimated delivery date? Thanks!"

---

### 2. Wrong / Missing Item in Parcel

**Volume:** 900 tickets (7%)  
**Sentiment:** Negative → Frustrated  
**Notes:** Needs apology, photo request, and re-shipment. Offer freebie for high LTV.

#### Workflow

1. **Check the customer's order, items purchased, and what was fulfilled**

2. **Ask what happened so you can pick the right fix**
   - Missing item
   - Wrong item received

3. **Request photos to confirm and speed things up**
   - "To get this sorted fast, could you send a photo of the items you received?"
   - If there is a packing slip, ask for a photo of that too
   - If possible, ask for a photo of the outside shipping label on the box

4. **Offer the fastest resolution first**
   - Offer a free reship of the missing item or the correct item
   - If they asked for a refund, explain you can resend it immediately, and it's usually faster than a refund

5. **If they do not want a reship, offer store credit first**
   - Offer store credit for the item value, plus a small bonus if your policy allows (e.g., 10%)
   - If they accept, issue the store credit and tag: "Wrong or Missing, Store Credit Issued"

6. **If they decline store credit, refund in cash**
   - Refund to the original payment method
   - Tag: "Wrong or Missing, Cash Refund Issued"

7. **Close the loop**
   - If reship, escalate the ticket to support so support members can resend the order
   - If store credit, confirm the credit amount and that it is available immediately at checkout
   - If cash refund, confirm the amount and the expected processing time

#### Example Summaries

- "Got Zen stickers instead of Focus—kids need them for school, help!"
- "My package arrived with only 2 of the 3 packs I paid for."
- "Received the pet collar but the tick stickers are missing."

---

### 3. Product Issue – "No Effect"

**Volume:** 700 tickets (6%)  
**Sentiment:** Disappointed  
**Notes:** Empathy + usage advice. Refund or upgrade option.

#### Workflow

1. **Check the customer's order, product, and status**

2. **Ask why it felt like "no effect" so you don't apply the wrong fix**
   - Ask the goal: falling asleep, staying asleep, stress, or something else
   - Ask usage: how many, what time, and for how many nights

3. **Route based on what you learn**
   - If usage is off (too late, inconsistent, too short duration), share the correct usage and ask them to try for 3 nights
   - If the product is a mismatch for their goal, offer a better fit product switch

4. **If the customer is still disappointed after guidance:**
   - Offer store credit with a 10% bonus instead of cash refund
   - If they accept, issue credit and tag: "No Effect – Recovered"
   - If they decline, refund in cash to the original payment method and tag: "No Effect – Cash Refund"

#### Example Summaries

- "Kids still getting bitten even with 2 stickers on."
- "Focus patches aren't helping my son concentrate."
- "Itch relief patch did nothing for the sting."

---

### 4. Refund Request – Standard

**Volume:** 1,100 tickets (9%)  
**Sentiment:** Negative but Polite  
**Notes:** Linked to shipping/product issues. Refund flow.

#### Workflow

1. **Check the customer's order details and status**

2. **Ask for the reason for the refund request**

   **A. If the reason is product didn't meet expectations:**
   - Ask one quick follow-up to identify the cause: falling asleep, staying asleep, comfort, taste, or no effect, etc.
   - Share the correct usage tip based on the cause
   - Offer a better fit swap option
   - If the customer still wants a refund, offer store credit with a 10% bonus instead of cash refund
   - If accepted, issue store credit and log the outcome with a tag

   **B. If the reason is shipping delay:**
   - If the customer contacts you on Monday or Tuesday, ask if they are okay waiting until Friday. If not delivered by then, offer a free replacement
   - If the customer contacts you on Wednesday through Friday, ask if they are okay waiting until early next week. If not delivered by then, offer a free replacement
   - If the customer refuses to wait, offer a free replacement immediately, then escalate the ticket so we can review. Tell customers: "Hey, I'm looping Monica, who is our Head of CS, she'll take it from there."

   **C. If the reason is damaged or wrong item:**
   - Offer a free replacement or store credit
   - If the customer chooses replacement, escalate the ticket so we can review
   - If the customer chooses store credit, issue credit with a small bonus if allowed

   **D. If the reason is changed mind:**
   - If unfulfilled, cancel the order and log the action by adding tags
   - If fulfilled, offer store credit with a small bonus before processing a cash refund

#### Example Summaries

- "Please refund order #51234; product arrived too late."
- "Want my money back—stickers don't repel mosquitoes as promised."
- "Returning unused packs for a full refund, thanks."

---

### 5. Order Modification

**Volume:** 400 tickets (3%)  
**Sentiment:** Neutral  
**Notes:** Time-sensitive. Can be automated if <2 hours.

#### Workflow

**Order Cancellation Process:**

1. **Check the customer's orders**

2. **Ask for the reason for the cancellation**
   - **If the reason is a shipping delay:**
     - If the customer contacts you on Monday or Tuesday, ask if they are okay waiting until Friday. If not delivered by then, you can cancel it
     - If the customer contacts you on Wednesday through Friday, ask if they are okay waiting until early next week
   - **If the reason is that the order was placed accidentally:**
     - Cancel the order and add a tag to log the action

**Order Update Shipping Address:**

1. **If a customer wants to update their shipping address:**
   - Check whether they placed the order on the same date, and make sure the order status is unfulfilled
   - If true, update the shipping address and tag the order with "customer verified address"

2. **If you find any error, escalate the ticket to Monica**, saying: "To make sure you get the right response, I'm looping in Monica, who is our Head of CS. She'll take the conversation from there."

#### Example Summaries

- "Accidentally ordered twice—please cancel one."
- "Realised I used wrong address—cancel so I can reorder."
- "Need to cancel order #67890 before it ships, thanks."

---

### 6. Positive Feedback

**Volume:** 700 tickets (6%)  
**Sentiment:** Positive / Enthusiastic  
**Notes:** Tag for marketing. Auto-reply with referral code.

#### Workflow

1. **Initial Response:**

```
Awww {{first_name}},

That is so amazing! Thank you for that epic feedback!

If it's okay with you, would you mind if I send you a feedback request so you can share your thoughts on NATPAT and our response overall?

It's totally fine if you don't have the time, but I thought I'd ask before sending a feedback request email 😊

Caz
```

2. **If they say YES and are happy to leave feedback, send the response below:**

```
Awwww, thank you! 

Here's the link to the review page: https://trustpilot.com/evaluate/naturalpatch.com

Thanks so much! 

Caz xx
```

#### Example Summaries

- "BuzzPatch saved our camping trip—no bites at all!"
- "The kids LOVE choosing their emoji stickers each night."
- "Focus patches actually helped my son finish homework."

---

### 7. Subscription / Billing Issues

**Volume:** 250 tickets (2%)  
**Sentiment:** Negative → Urgent  
**Notes:** Fix fast. Often double-charge or skip fail.

#### Workflow

1. **Check the subscription status on the Subscription Platform**

2. **Ask for the reason**

   **A. If the reason is "too many on hand right now":**
   - Offer to skip the next order instead. If they confirm, skip the next order for 1 month
   - If they don't confirm, offer a 20% discount on their next two orders
   - If they still want to cancel, cancel the subscription

   **B. If the reason is "didn't like the product quality":**
   - Offer to swap to a different product. If they confirm, process the swap
   - If they don't confirm, cancel the subscription

#### Example Summaries

- "I cancelled but still got charged—refund please."
- "Need to pause my monthly BuzzPatch delivery for August."
- "Credit card changed—how do I update details?"

---

### 8. Discount / Promo Code Problems

**Volume:** 350 tickets (3%)  
**Sentiment:** Neutral → Mildly Frustrated  
**Notes:** Quick win via code re-issue.

#### Workflow

1. **If a client wants to reclaim the code or is experiencing that the code is not valid:**
   - Create a one-time discount code for that specific client
   - You can create a one-time 10% discount code with a 48-hour lifespan

2. **After you create the code:**
   - Send it to the customer and let them know it is valid for 48 hours

3. **Only create one discount code for the customer**

#### Example Summaries

- "WELCOME10 code says invalid at checkout."
- "Forgot to apply discount—can you refund the difference?"
- "App won't accept my loyalty points."

---

## Summary Statistics

| Category | Volume (tickets) | Volume (%) | Sentiment |
|----------|------------------|------------|-----------|
| Shipping Delay – Neutral Status Check | 4,700 | 37% | Neutral / Mildly Anxious |
| Wrong / Missing Item in Parcel | 900 | 7% | Negative → Frustrated |
| Product Issue – "No Effect" | 700 | 6% | Disappointed |
| Refund Request – Standard | 1,100 | 9% | Negative but Polite |
| Order Modification | 400 | 3% | Neutral |
| Positive Feedback | 700 | 6% | Positive / Enthusiastic |
| Subscription / Billing Issues | 250 | 2% | Negative → Urgent |
| Discount / Promo Code Problems | 350 | 3% | Neutral → Mildly Frustrated |

**Total Tickets:** 9,100
