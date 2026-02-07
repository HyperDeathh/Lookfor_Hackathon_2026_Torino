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

      // Handle NDJSON Stream
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let finalResponse = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop(); // Keep incomplete line

        for (const line of lines) {
          if (!line.trim()) continue;
          try {
            const event = JSON.parse(line);

            // Log specific events
            if (event.callbacks && event.callbacks.length > 0) {
              // Ignore for now in console test
            }
            // If it's the final answer chunk (simplified logic)
            // Just accumulating logging
          } catch (e) {
            console.error('Error parsing NDJSON line:', e);
          }
        }
      }

      console.log(`🟢 Stream Complete`);
      return {}; // return empty or accumulated
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
