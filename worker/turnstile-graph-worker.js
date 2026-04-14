export default {
  async fetch(request, env) {
    if (request.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 });
    }

    let body;
    try {
      body = await request.json();
    } catch (e) {
      return new Response(JSON.stringify({ error: 'Invalid JSON' }), { status: 400 });
    }

    const token = body['cf_turnstile_response'];
    if (!token) {
      return new Response(JSON.stringify({ error: 'Missing Turnstile token' }), { status: 400 });
    }

    const verifyRes = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `secret=${encodeURIComponent(env.TURNSTILE_SECRET)}&response=${encodeURIComponent(token)}`
    });

    const verifyJson = await verifyRes.json();
    if (!verifyJson.success) {
      return new Response(JSON.stringify({ error: 'Turnstile verification failed' }), { status: 403 });
    }

    const tenant = env.AZ_TENANT_ID;
    const clientId = env.AZ_CLIENT_ID;
    const clientSecret = env.AZ_CLIENT_SECRET;
    const fromEmail = env.FROM_EMAIL;
    const toEmail = env.TO_EMAIL;

    if (!tenant || !clientId || !clientSecret || !fromEmail || !toEmail) {
      return new Response(JSON.stringify({ error: 'Server misconfigured' }), { status: 500 });
    }

    const tokenRes = await fetch(`https://login.microsoftonline.com/${tenant}/oauth2/v2.0/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `client_id=${encodeURIComponent(clientId)}&client_secret=${encodeURIComponent(clientSecret)}&grant_type=client_credentials&scope=${encodeURIComponent('https://graph.microsoft.com/.default')}`
    });

    if (!tokenRes.ok) {
      return new Response(JSON.stringify({ error: 'Failed to obtain access token' }), { status: 502 });
    }

    const tokenJson = await tokenRes.json();
    const accessToken = tokenJson.access_token;
    if (!accessToken) {
      return new Response(JSON.stringify({ error: 'Invalid access token response' }), { status: 502 });
    }

    const subject = `Website contact from ${body.name || 'Anonymous'}`;
    const text = `Name: ${body.name || ''}\nEmail: ${body.email || ''}\n\nMessage:\n${body.message || ''}`;

    const mailPayload = {
      message: {
        subject: subject,
        body: { contentType: 'Text', content: text },
        toRecipients: [{ emailAddress: { address: toEmail } }]
      },
      saveToSentItems: 'false'
    };

    const sendRes = await fetch(`https://graph.microsoft.com/v1.0/users/${encodeURIComponent(fromEmail)}/sendMail`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
      body: JSON.stringify(mailPayload)
    });

    if (!sendRes.ok) {
      const errText = await sendRes.text();
      return new Response(JSON.stringify({ error: 'Failed sending mail', details: errText }), { status: 502 });
    }

    return new Response(JSON.stringify({ ok: true }), { status: 200 });
  }
};
