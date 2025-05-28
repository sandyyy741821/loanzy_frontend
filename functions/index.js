export async function onRequestPost({ request }) {
  const formData = await request.formData();
  const token = formData.get('cf-turnstile-response');

  if (!token) {
    return new Response('Captcha missing!', { status: 400 });
  }

  const secret = '0x4AAAAAABet_X5Bz4qcjsrfhEgeEFrrFlA'; 
  const verifyResponse = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      secret: secret,
      response: token
    }),
  });

  const verifyResult = await verifyResponse.json();

  if (verifyResult.success) {
    return new Response(null, {
      status: 302,
      headers: {
        'Location': '/',
      },
    });
  } else {
    return new Response('Captcha Failed!', { status: 400 });
  }
}
