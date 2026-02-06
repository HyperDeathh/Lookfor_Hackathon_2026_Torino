const startTest = async () => {
  const url = 'http://localhost:3000/api/agents'

  // Test Case: Shipping Inquiry
  const payload = {
    message: 'Kargom nerede? Sipariş numaram #1001', // Or English: "Where is my order #1001?"
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
      throw new Error(`HTTP Error: ${response.status} ${response.statusText}`)
    }

    const json = await response.json()
    console.log('\n🟢 Response Received:')
    console.log('--------------------------------------------------')
    console.log('🤖 Assistant:', json.data.response)
    console.log('--------------------------------------------------')
    console.log('🧠 Intent:', json.data.intent)
    console.log('📝 Logs (Hidden Actions):')

    if (json.data.logs && json.data.logs.length > 0) {
      json.data.logs.forEach((log, index) => {
        if (log.type === 'tool_call') {
          console.log(`  [${index + 1}] 🔧 Calling Tool: ${log.calls[0].name}`)
        } else if (log.type === 'tool_output') {
          console.log(`  [${index + 1}] 📥 Tool Output: ${log.name}`)
        }
      })
    } else {
      console.log('  (No tools used)')
    }
    console.log('--------------------------------------------------')
  } catch (error) {
    console.error('🔴 Error:', error.message)
    console.log('➡️ Make sure your Next.js server is running on port 3000!')
  }
}

startTest()
