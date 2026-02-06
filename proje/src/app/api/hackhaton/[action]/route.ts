import { NextResponse } from 'next/server'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ action: string }> } // params is a Promise in Next.js 15+
) {
  const { action } = await params

  let body
  try {
    body = await request.json()
  } catch (e) {
    return NextResponse.json({ success: false, error: 'Invalid JSON body' })
  }

  console.log(`[MockAPI] Handling action: ${action}`, body)

  if (action === 'get_order_details') {
    const { orderId } = body
    if (orderId === '1001' || orderId === '#1001') {
      return NextResponse.json({
        success: true,
        data: {
          id: '1001',
          name: '#1001',
          createdAt: new Date(Date.now() - 86400000 * 2).toISOString(), // 2 days ago
          status: 'IN_TRANSIT',
          trackingUrl: 'https://fedex.com/track/123456789'
        }
      })
    }
    return NextResponse.json({
      success: false,
      error: 'Order not found'
    })
  }

  // --- Mock Skio / Subscription Tools ---
  if (action === 'get_subscription_status') {
    return NextResponse.json({
      success: true,
      data: {
        subscriptionId: 'sub_123',
        status: 'ACTIVE',
        nextBillingDate: new Date(Date.now() + 86400000 * 15).toISOString(), // 15 days later
        productTitle: 'Hair Growth Serum (3 Month Supply)',
        interval: '3 Months'
      }
    })
  }

  if (
    action === 'skip_next_order_subscription' ||
    action === 'skip-next-order-subscription'
  ) {
    return NextResponse.json({
      success: true,
      data: {
        newNextBillingDate: new Date(Date.now() + 86400000 * 45).toISOString(),
        skipped: true
      }
    })
  }

  if (action === 'pause_subscription' || action === 'pause-subscription') {
    return NextResponse.json({
      success: true,
      data: {
        status: 'PAUSED',
        pausedUntil: body.pausedUntil
      }
    })
  }

  if (action === 'unpause_subscription' || action === 'unpause-subscription') {
    return NextResponse.json({
      success: true,
      data: {
        status: 'ACTIVE',
        subscriptionId: body.subscriptionId
      }
    })
  }

  if (action === 'cancel_subscription' || action === 'cancel-subscription') {
    return NextResponse.json({
      success: true,
      data: {
        status: 'CANCELLED',
        cancelledAt: new Date().toISOString()
      }
    })
  }

  if (action === 'create_draft_order') {
    return NextResponse.json({
      success: true,
      data: {
        draftOrderId: 'draft_999',
        invoiceUrl: 'https://checkout.shopify.com/draft/999'
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

  if (action === 'create_discount_code') {
    return NextResponse.json({
      success: true,
      data: {
        code: 'RETENTION-SAVE-20',
        value: body.value,
        type: body.type
      }
    })
  }

  if (action === 'get_customer_orders') {
    return NextResponse.json({
      success: true,
      data: {
        orders: [
          {
            id: '1001',
            name: '#1001',
            createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
            status: 'IN_TRANSIT',
            trackingUrl: 'https://fedex.com/track/123456789'
          },
          {
            id: '999',
            name: '#999',
            createdAt: new Date(Date.now() - 86400000 * 30).toISOString(),
            status: 'DELIVERED',
            trackingUrl: 'https://fedex.com/track/987654321'
          }
        ],
        hasNextPage: false,
        endCursor: null
      }
    })
  }

  // fallback for other actions
  return NextResponse.json({
    success: true,
    data: {}
  })
}
