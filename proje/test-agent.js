const startTest = async () => {
  const url = 'http://localhost:3000/api/agents'
  const sessionId = 'test-session-' + Date.now()

  // Helper to send messages
  const sendMessage = async (message, customerInfo = null) => {
    const payload = {
      message,
      requestId: sessionId,
      customerInfo
    }

    console.log(`\n🔵 Sending: "${message}"`)

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      if (!response.ok) {
        throw new Error(`HTTP Error: ${response.status} ${response.statusText}`)
      }

      const json = await response.json()
      console.log(`🟢 Response: "${json.data.response}"`)
      console.log(`   Intent: ${json.data.intent}`)
      return json
    } catch (error) {
      console.error('🔴 Error:', error.message)
    }
  }

  // Multi-turn Conversation
  console.log('--- Starting Multi-turn Test ---')

  // Turn 1: Introduction
  await sendMessage('Merhaba, benim adım Ahmet.', {
    email: 'test@example.com',
    name: 'Ahmet Yilmaz',
    id: 'cust_123'
  })

  // Turn 2: Memory Check
  await sendMessage('Benim adım neydi?')

  // Turn 3: Intent Check
  await sendMessage('Aboneliğimi iptal etmek istiyorum.')
}

startTest()
