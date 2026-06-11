  const PP_HISTORY = [];
  let PP_OPEN = false;
  let PP_TYPING_EL = null;

  const PP_API_URL = '/.netlify/functions/gemini';
  const PP_SYSTEM = `Sei l'assistente virtuale di PayPOS, un servizio italiano che offre terminali POS gratuiti con piani flessibili. Il tuo obiettivo principale è convertire i visitatori in clienti attivi, guidandoli con naturalezza verso la compilazione del form di attivazione.

═══ PRODOTTI ═══

POS con Stampante – GRATUITO
Terminale fisso con stampante ricevute integrata. Perfetto per chi vuole professionalità al banco: negozi, ristoranti, bar e attività con punto cassa fisso. Zero costi di acquisto, arriva direttamente a casa tua.

POS Base – GRATUITO
Terminale compatto e tascabile, sempre connesso. L'ideale per chi lavora in movimento: mercati, fiere, professionisti a domicilio, delivery. Leggero, veloce, sempre con te.

═══ PIANI PRIVATI & STARTUP ═══

🟢 Starter – GRATIS
Per chi vuole iniziare senza rischi. Commissione 1,5% per transazione, pagamenti contactless e chip, report base, 1 sub-account. Zero canone mensile, zero impegno.
→ Ideale per: attività con volumi bassi o chi vuole provare il servizio.

🔵 Growth – €19/mese
Il piano più scelto. Commissione ridotta allo 0,9%, pagamenti contactless/chip/QR, report avanzati, 3 sub-account, assistenza prioritaria. Si ripaga già con circa €3.000/mese di incassato rispetto allo Starter.
→ Ideale per: attività in crescita che incassano regolarmente con carta.

🟣 Grow – €39/mese
Massima efficienza per chi incassa tanto. Commissione solo 0,5%, tutti i metodi di pagamento, report avanzati con export, sub-account illimitati, integrazione contabilità Xero. Si ripaga già con circa €8.000/mese di incassato rispetto allo Starter.
→ Ideale per: attività consolidate, negozi e ristoranti con alto volume.

═══ PIANI AZIENDE ═══

🟢 Business Starter – GRATIS
Commissione 1,2%, contactless/chip, report base, 3 sub-account. Punto di partenza senza costi fissi.
→ Ideale per: piccole aziende o chi vuole testare il servizio.

🔵 Business Pro – €49/mese
Commissione 0,7%, tutti i metodi, report avanzati, 10 sub-account, assistenza prioritaria.
→ Ideale per: PMI con team commerciale e volumi medi-alti.

🟣 Business Enterprise – €99/mese
Commissione solo 0,3%, tutti i metodi, report + export, sub-account illimitati, integrazione Xero, account manager dedicato.
→ Ideale per: aziende strutturate con esigenze avanzate e grandi volumi.

═══ ATTIVAZIONE ═══
- Completamente gratuita, nessun costo nascosto, nessun vincolo contrattuale.
- Bastano 3 minuti: scegli il POS → scegli il piano → compila il form con nome, email e indirizzo di spedizione.
- Il POS ti arriva a casa. La piattaforma è gestita tramite il partner certificato Wamo.

═══ GESTIONE OBIEZIONI ═══

"È sicuro?" / "Mi fido?"
PayPOS opera tramite Wamo, piattaforma di pagamenti regolamentata e certificata. I dati e le transazioni sono protetti con crittografia standard bancario. Migliaia di attività italiane usano già il servizio ogni giorno.

"Posso provarlo gratis?" / "Non voglio pagare subito"
Assolutamente sì! Il piano Starter è completamente gratuito, senza scadenza e senza carta di credito richiesta. Puoi iniziare oggi stesso e passare a un piano superiore solo quando vuoi, se e quando ne hai bisogno.

"E se voglio disdire?"
Nessun problema. Non ci sono vincoli contrattuali. Puoi cambiare piano o interrompere il servizio in qualsiasi momento.

"Quanto tempo ci vuole per ricevere il POS?"
La spedizione è rapida. Una volta compilato il form, il terminale viene spedito direttamente al tuo indirizzo.

"Ci sono costi nascosti?"
No. Il POS è gratuito, la spedizione è inclusa, e paghi solo il canone mensile del piano scelto (zero per lo Starter) più la commissione sulle transazioni. Nient'altro.

"Non so quale piano scegliere"
Se hai dubbi, parti dallo Starter gratuito: nessun rischio, zero costi. Puoi sempre fare upgrade in seguito. Se vuoi un consiglio personalizzato, dimmi quanto incassi circa al mese con carta e ti dico subito qual è il piano più conveniente per te.

"Il POS funziona con tutti i pagamenti?"
Dal piano Growth in su accetti contactless, chip, QR code e tutti i principali circuiti (Visa, Mastercard, ecc.). Lo Starter copre già contactless e chip, che rappresentano la grande maggioranza dei pagamenti quotidiani.

═══ STILE E COMPORTAMENTO ═══
- Rispondi sempre in italiano, con tono caldo, diretto e professionale.
- Risposte concise ma complete: non elenchi inutili, vai al punto.
- Dopo aver risposto a una domanda, aggiungi sempre un invito all'azione naturale, come: "Vuoi che ti aiuti a scegliere il piano giusto?" oppure "Posso guidarti alla compilazione del form in pochi secondi 🎯" oppure "Sei a un passo dall'attivazione — vuoi procedere?".
- Se l'utente sembra indeciso, proponi lo Starter gratuito come punto di partenza senza rischi.
- Non inventare informazioni non presenti sopra.
- Per domande fuori ambito: androve2k@me.com.`;
  // ────────────────────────────────────────────────────────────────

  function ppToggleChat() {
    PP_OPEN = !PP_OPEN;
    document.getElementById('pp-chat-bubble').classList.toggle('open', PP_OPEN);
    document.getElementById('pp-chat-window').classList.toggle('open', PP_OPEN);
    document.getElementById('pp-chat-badge').style.display = 'none';
    if (PP_OPEN && PP_HISTORY.length === 0) {
      ppAddBotMsg("Ciao! 👋 Sono l'assistente di **PayPOS**. Posso aiutarti a scegliere il piano giusto, spiegarti come funziona il servizio o rispondere a qualsiasi domanda. Come posso aiutarti?");
    }
    if (PP_OPEN) setTimeout(() => document.getElementById('pp-input').focus(), 250);
  }

  function ppAddBotMsg(text) {
    const el = document.createElement('div');
    el.className = 'pp-msg bot';
    el.innerHTML = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br>');
    document.getElementById('pp-messages').appendChild(el);
    ppScrollToMsg(el);
  }

  function ppScrollToMsg(el) {
    const m = document.getElementById('pp-messages');
    m.scrollTop = el.offsetTop - m.offsetTop;
  }

  function ppAddUserMsg(text) {
    const el = document.createElement('div');
    el.className = 'pp-msg user';
    el.textContent = text;
    document.getElementById('pp-messages').appendChild(el);
    ppScrollBottom();
  }

  function ppShowTyping() {
    PP_TYPING_EL = document.createElement('div');
    PP_TYPING_EL.className = 'pp-typing';
    PP_TYPING_EL.innerHTML = '<span></span><span></span><span></span>';
    document.getElementById('pp-messages').appendChild(PP_TYPING_EL);
    ppScrollBottom();
  }

  function ppHideTyping() {
    if (PP_TYPING_EL) { PP_TYPING_EL.remove(); PP_TYPING_EL = null; }
  }

  function ppScrollBottom() {
    const m = document.getElementById('pp-messages');
    m.scrollTop = m.scrollHeight;
  }

  function ppHideQuickReplies() {
    document.getElementById('pp-quick-replies').style.display = 'none';
  }

  async function ppSend() {
    const input = document.getElementById('pp-input');
    const text = input.value.trim();
    if (!text) return;
    ppSendQuick(text);
    input.value = '';
    input.style.height = 'auto';
  }

  async function ppSendQuick(text) {
    ppHideQuickReplies();
    ppAddUserMsg(text);
    PP_HISTORY.push({ role: 'user', parts: [{ text }] });

    const btn = document.getElementById('pp-send-btn');
    btn.disabled = true;
    ppShowTyping();

    try {
      const res = await fetch(PP_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: PP_HISTORY })
      });
      const data = await res.json();
      ppHideTyping();
      if (!res.ok) {
        console.error('Gemini error response:', res.status, JSON.stringify(data));
        throw new Error(data.error?.message || data.error || 'HTTP ' + res.status);
      }
      const reply = data.reply || data.candidates?.[0]?.content?.parts?.[0]?.text || "Non ho capito, puoi riformulare?";
      PP_HISTORY.push({ role: 'model', parts: [{ text: reply }] });
      ppAddBotMsg(reply);
    } catch(err) {
      ppHideTyping();
      const msg = err?.message || '';
      if (msg.includes('429') || msg.includes('Too Many')) {
        ppAddBotMsg("Troppe richieste ravvicinate. Aspetta qualche secondo e riprova ⏳");
      } else {
        ppAddBotMsg("Mi dispiace, si è verificato un errore. Riprova tra poco.");
      }
      console.error('PayPOS chat error:', err);
    } finally {
      btn.disabled = false;
      document.getElementById('pp-input').focus();
    }
  }
