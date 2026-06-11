exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
      body: ''
    };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const leadData = JSON.parse(event.body);

    const html = `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px;">
        <h2 style="color:#1a1a2e;">🎉 Ottimo, ${leadData.nome}!</h2>
        <p>Grazie per aver effettuato il tuo ordine!</p>
        <p>Per completare l'attivazione ti chiediamo semplicemente di:</p>
        <ul>
          <li>Registrarti sul portale Wamo;</li>
          <li>Scaricare l'App Wamo sul tuo smartphone.</li>
        </ul>
        <p>Non è necessario fare altro: non dovrai effettuare ulteriori ordini né seguire altre procedure.<br>
        Una volta completata la registrazione, penseremo noi a gestire tutto il resto e ti invieremo il POS.</p>
        <p style="margin:24px 0;">
          <a href="https://business.wamo.io/register?partner=paypos"
             style="background:#4f46e5;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;">
            Registrati su Wamo →
          </a>
        </p>
        <hr style="border:none;border-top:1px solid #eee;margin:24px 0;">
        <h3 style="color:#1a1a2e;">📋 Riepilogo ordine</h3>
        <table style="width:100%;border-collapse:collapse;">
          <tr><td style="padding:8px;color:#666;">POS scelto</td><td style="padding:8px;font-weight:bold;">${leadData.pos_tipo}</td></tr>
          <tr style="background:#f9f9f9;"><td style="padding:8px;color:#666;">Quantità</td><td style="padding:8px;font-weight:bold;">${leadData.pos_quantita}</td></tr>
          <tr><td style="padding:8px;color:#666;">Piano</td><td style="padding:8px;font-weight:bold;">${leadData.piano}</td></tr>
          <tr style="background:#f9f9f9;"><td style="padding:8px;color:#666;">Tipo cliente</td><td style="padding:8px;font-weight:bold;">${leadData.tipo_cliente}</td></tr>
          <tr><td style="padding:8px;color:#666;">Spedizione a</td><td style="padding:8px;font-weight:bold;">${leadData.destinatario_spedizione}<br>${leadData.indirizzo_completo}</td></tr>
        </table>
        <p style="margin-top:24px;color:#666;font-size:14px;">Per qualsiasi necessità, il nostro team è a tua disposizione.</p>
        <p style="color:#666;font-size:14px;">Cordiali saluti,<br><strong>Il Team PayPOS</strong></p>
      </div>
    `;

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`
      },
      body: JSON.stringify({
        from: 'PayPOS <noreply@paypos.store>',
        to: [leadData.email],
        subject: '🎉 Conferma ordine PayPOS',
        html
      })
    });

    if (res.ok) {
      return {
        statusCode: 200,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ success: true })
      };
    } else {
      const err = await res.text();
      console.error('Resend error:', err);
      return {
        statusCode: 500,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ success: false, error: err })
      };
    }
  } catch (err) {
    console.error('Function error:', err);
    return {
      statusCode: 500,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ success: false, error: err.message })
    };
  }
};
