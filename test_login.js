const fetch = (...args) => import('node-fetch').then(({default: f}) => f(...args));

// Test the login flow
async function testLogin() {
  try {
    const response = await fetch('http://localhost:3000/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'testpassword123'
      })
    });
    
    console.log('Response status:', response.status);
    const data = await response.json();
    console.log('Response data:', data);
  } catch (err) {
    console.error('Error:', err.message);
  }
}

testLogin();
