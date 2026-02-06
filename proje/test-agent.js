const startTest = async () => {
  const url = 'http://localhost:3000/api/agents'

  // Test Case: Subscription Retention (More Complex)
  const payload = {
    message:
      'Aboneliğimi iptal etmek istiyorum. Evde o kadar çok ürün birikti ki koyacak yerim kalmadı. Lütfen hemen iptal edin.',
    requestId: 'test-session-' + Date.now(),
    customerInfo: {
      email: 'test@example.com',
      name: 'Test User',
      id: 'cust_123'
    }
  }

  console.log('🔵 Sending request to Agent...')
  console.log('Payload:', JSON.stringify(payload, null, 2))

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })

    if (!response.ok) {
      const errorJson = await response.json().catch(() => ({}))
      console.error(
        'Server Error Response:',
        JSON.stringify(errorJson, null, 2)
      )
      throw new Error(`HTTP Error: ${response.status} ${response.statusText}`)
    }

    const json = await response.json()
    console.log('\n🟢 Response Received (Raw Payload):')
    console.log(JSON.stringify(json, null, 2))
  } catch (error) {
    console.error('🔴 Error:', error.message)
    console.log('➡️ Make sure your Next.js server is running on port 3000!')
  }
}

startTest()
