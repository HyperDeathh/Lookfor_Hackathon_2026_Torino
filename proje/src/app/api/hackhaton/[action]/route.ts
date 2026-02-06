import { NextResponse } from 'next/server'
import {
  getOrder,
  getOrdersByCustomer,
  updateOrder,
  getCustomer,
  updateCustomerStoreCredit,
  addCustomerTag,
  getSubscription,
  getSubscriptionByEmail,
  updateSubscription
} from '../../../../lib/mockDb'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ action: string }> }
) {
  const { action } = await params

  let body
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid JSON body' })
  }

  console.log(`[MockAPI] Handling action: ${action}`, body)

  // --- Order Tools ---

  if (action === 'get_order_details') {
    const { orderId } = body
    const order = getOrder(orderId)
    if (order) {
      return NextResponse.json({
        success: true,
        data: {
          id: order.id,
          name: order.name,
          createdAt: order.createdAt,
          status: order.status,
          trackingUrl: order.trackingUrl,
          items: order.items
        }
      })
    }
    return NextResponse.json({ success: false, error: 'Order not found' })
  }

  if (action === 'get_customer_orders') {
    const { email } = body
    const orders = getOrdersByCustomer(email || 'jane@example.com')
    return NextResponse.json({
      success: true,
      data: {
        orders: orders.map(o => ({
          id: o.id,
          name: o.name,
          createdAt: o.createdAt,
          status: o.status,
          trackingUrl: o.trackingUrl
        })),
        hasNextPage: false,
        endCursor: null
      }
    })
  }

  if (action === 'cancel_order') {
    const { orderId } = body
    const updated = updateOrder(orderId, { status: 'CANCELLED' })
    if (updated) {
      return NextResponse.json({
        success: true,
        data: {
          id: updated.id,
          name: updated.name,
          status: updated.status,
          cancelledAt: new Date().toISOString()
        }
      })
    }
    return NextResponse.json({ success: false, error: 'Order not found' })
  }

  if (action === 'update_order_shipping_address') {
    const { orderId, shippingAddress } = body
    const order = getOrder(orderId)
    if (!order) {
      return NextResponse.json({ success: false, error: 'Order not found' })
    }
    if (order.status !== 'UNFULFILLED') {
      return NextResponse.json({
        success: false,
        error: 'Cannot modify a fulfilled order'
      })
    }
    // In a real system we'd update the address; here we just confirm
    return NextResponse.json({
      success: true,
      data: {
        id: order.id,
        name: order.name,
        newAddress: shippingAddress
      }
    })
  }

  // --- Subscription Tools ---

  if (action === 'get_subscription_status' || action === 'get-subscription-status') {
    const { email } = body
    const sub = email ? getSubscriptionByEmail(email) : getSubscription('sub_123')
    if (sub) {
      return NextResponse.json({
        success: true,
        data: {
          subscriptionId: sub.id,
          status: sub.status,
          nextBillingDate: sub.nextBillingDate,
          productTitle: sub.productTitle,
          interval: sub.interval
        }
      })
    }
    return NextResponse.json({ success: false, error: 'Subscription not found' })
  }

  if (
    action === 'skip_next_order_subscription' ||
    action === 'skip-next-order-subscription'
  ) {
    const { subscriptionId } = body
    const sub = getSubscription(subscriptionId || 'sub_123')
    if (sub) {
      const newDate = new Date(Date.now() + 86400000 * 45).toISOString()
      updateSubscription(sub.id, { nextBillingDate: newDate })
      return NextResponse.json({
        success: true,
        data: { newNextBillingDate: newDate, skipped: true }
      })
    }
    return NextResponse.json({ success: false, error: 'Subscription not found' })
  }

  if (action === 'pause_subscription' || action === 'pause-subscription') {
    const { subscriptionId, pausedUntil } = body
    const updated = updateSubscription(subscriptionId || 'sub_123', {
      status: 'PAUSED',
      nextBillingDate: pausedUntil
    })
    if (updated) {
      return NextResponse.json({
        success: true,
        data: { status: 'PAUSED', pausedUntil }
      })
    }
    return NextResponse.json({ success: false, error: 'Subscription not found' })
  }

  if (action === 'unpause_subscription' || action === 'unpause-subscription') {
    const { subscriptionId } = body
    const updated = updateSubscription(subscriptionId || 'sub_123', {
      status: 'ACTIVE'
    })
    if (updated) {
      return NextResponse.json({
        success: true,
        data: { status: 'ACTIVE', subscriptionId: updated.id }
      })
    }
    return NextResponse.json({ success: false, error: 'Subscription not found' })
  }

  if (action === 'cancel_subscription' || action === 'cancel-subscription') {
    const { subscriptionId } = body
    const updated = updateSubscription(subscriptionId || 'sub_123', {
      status: 'CANCELLED'
    })
    if (updated) {
      return NextResponse.json({
        success: true,
        data: { status: 'CANCELLED', cancelledAt: new Date().toISOString() }
      })
    }
    return NextResponse.json({ success: false, error: 'Subscription not found' })
  }

  // --- Store Credit & Refund Tools ---

  if (action === 'create_store_credit') {
    const { id, creditAmount } = body
    const email = id || 'jane@example.com' // id is customer email or ID
    const amount = creditAmount?.amount || '0'
    const currency = creditAmount?.currencyCode || 'USD'

    const customer = updateCustomerStoreCredit(email, amount, currency)
    if (customer) {
      return NextResponse.json({
        success: true,
        data: {
          storeCreditAccountId: customer.id,
          credited: { amount, currencyCode: currency },
          newBalance: customer.storeCredit
        }
      })
    }
    return NextResponse.json({ success: false, error: 'Failed to create credit' })
  }

  if (action === 'refund_order') {
    const { orderId, refundMethod } = body
    const order = getOrder(orderId || '1001')
    if (order) {
      // Mark order as refunded (we'll use a tag or status)
      addCustomerTag('jane@example.com', 'Refunded')
      return NextResponse.json({
        success: true,
        data: {
          refundId: `ref_${Date.now()}`,
          orderId: order.id,
          status: 'SUCCESS',
          amount: 'FULL',
          method: refundMethod
        }
      })
    }
    return NextResponse.json({ success: false, error: 'Order not found' })
  }

  if (action === 'create_return') {
    const { orderId } = body
    const order = getOrder(orderId || '1001')
    if (order) {
      return NextResponse.json({
        success: true,
        data: {
          returnId: `ret_${Date.now()}`,
          orderId: order.id,
          status: 'OPEN',
          returnLabelUrl: `https://returns.fedex.com/label/ret_${order.id}.pdf`
        }
      })
    }
    return NextResponse.json({ success: false, error: 'Order not found' })
  }

  if (action === 'add_tags') {
    const { id, tags } = body
    // id could be customer email or order id
    const customer = getCustomer(id)
    if (customer && Array.isArray(tags)) {
      tags.forEach((tag: string) => addCustomerTag(id, tag))
      return NextResponse.json({
        success: true,
        data: { id, tags: customer.tags }
      })
    }
    return NextResponse.json({ success: true, data: { id, tags } })
  }

  // --- Other Tools ---

  if (action === 'create_draft_order') {
    return NextResponse.json({
      success: true,
      data: {
        draftOrderId: `draft_${Date.now()}`,
        invoiceUrl: `https://checkout.shopify.com/draft/${Date.now()}`
      }
    })
  }

  if (action === 'get_collection_recommendations') {
    return NextResponse.json({
      success: true,
      data: [
        { id: 'col_1', title: 'Summer Sale', handle: 'summer-sale' },
        { id: 'col_2', title: 'New Arrivals', handle: 'new-arrivals' }
      ]
    })
  }

  if (action === 'get_product_recommendations') {
    return NextResponse.json({
      success: true,
      data: [
        { id: 'prod_1', title: 'BuzzPatch Mosquito Repellent', handle: 'buzzpatch' },
        { id: 'prod_2', title: 'ZenPatch Calming Stickers', handle: 'zenpatch' }
      ]
    })
  }

  if (action === 'get_product_details') {
    return NextResponse.json({
      success: true,
      data: [
        {
          id: 'prod_1',
          title: 'BuzzPatch Mosquito Repellent (60 Pack)',
          handle: 'buzzpatch-60',
          description: 'All-natural mosquito repellent stickers for kids.'
        }
      ]
    })
  }

  if (action === 'get_related_knowledge_source') {
    return NextResponse.json({
      success: true,
      data: {
        faqs: [
          {
            question: 'How many patches should I use?',
            answer: 'Use 1-2 patches per session for best results.'
          }
        ],
        pdfs: [],
        blogArticles: [],
        pages: []
      }
    })
  }

  if (action === 'create_discount_code') {
    const { type, value, duration } = body
    const code = `SAVE${value}-${Date.now().toString(36).toUpperCase()}`
    return NextResponse.json({
      success: true,
      data: { code, value, type, expiresIn: `${duration}h` }
    })
  }

  // --- Fallback ---
  console.log(`[MockAPI] Unhandled action: ${action}`)
  return NextResponse.json({ success: true, data: {} })
}
