import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://swappanini.com'
const FROM = "SWAP'WC26 <no-reply@mail.swappanini.com>"

// ── Shared layout ─────────────────────────────────────────────

function layout(content: string) {
  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>SWAP'WC26</title>
</head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:32px 16px;">
    <tr>
      <td align="center">
        <table width="480" cellpadding="0" cellspacing="0" style="max-width:480px;width:100%;">
          <!-- Logo -->
          <tr>
            <td style="padding-bottom:24px;text-align:center;">
              <span style="font-size:22px;font-weight:900;letter-spacing:-0.5px;color:#1B3B1A;">
                <span style="color:#AAFF00;">SWAP</span><span style="color:#00C241;">'WC26</span>
              </span>
            </td>
          </tr>
          <!-- Card -->
          <tr>
            <td style="background:white;border-radius:16px;border:1px solid #e5e7eb;padding:32px;">
              ${content}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding-top:20px;text-align:center;font-size:11px;color:#9ca3af;">
              Tu reçois cet email car tu es inscrit sur SWAP'WC26.<br/>
              <a href="${APP_URL}" style="color:#00C241;text-decoration:none;">swap26.com</a>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

function btn(label: string, href: string) {
  return `<a href="${href}"
    style="display:inline-block;margin-top:20px;padding:13px 28px;
    background:#00C241;color:white;font-weight:900;font-size:14px;
    border-radius:999px;text-decoration:none;letter-spacing:0.2px;">
    ${label}
  </a>`
}

// ── 1. Nouvelle proposition d'échange ─────────────────────────

export async function sendSwapProposalEmail({
  toEmail,
  toName,
  fromPseudo,
  swapId,
}: {
  toEmail: string
  toName: string
  fromPseudo: string
  swapId: string
}) {
  const link = `${APP_URL}/fr/inbox/${swapId}`

  const html = layout(`
    <h1 style="margin:0 0 8px;font-size:20px;font-weight:900;color:#1B3B1A;">
      Nouvelle proposition d'échange 🤝
    </h1>
    <p style="margin:0 0 16px;font-size:14px;color:#6b7280;line-height:1.6;">
      Salut <strong style="color:#1B3B1A;">${toName}</strong>,<br/><br/>
      <strong style="color:#1B3B1A;">${fromPseudo}</strong> veut échanger des stickers avec toi sur SWAP'WC26 !
      Connecte-toi pour voir les stickers proposés et accepter ou refuser l'échange.
    </p>
    <div style="background:#f0fdf4;border-radius:12px;padding:16px;margin:16px 0;">
      <p style="margin:0;font-size:13px;color:#1B3B1A;font-weight:700;">
        💡 Plus tu réponds vite, plus tu as de chances de compléter ton album !
      </p>
    </div>
    ${btn('Voir la proposition →', link)}
  `)

  return resend.emails.send({
    from: FROM,
    to: toEmail,
    subject: `${fromPseudo} veut échanger avec toi ! 🔄`,
    html,
  })
}

// ── 2. Échange accepté ────────────────────────────────────────

export async function sendSwapAcceptedEmail({
  toEmail,
  toName,
  acceptorPseudo,
  swapId,
}: {
  toEmail: string
  toName: string
  acceptorPseudo: string
  swapId: string
}) {
  const link = `${APP_URL}/fr/inbox/${swapId}`

  const html = layout(`
    <h1 style="margin:0 0 8px;font-size:20px;font-weight:900;color:#1B3B1A;">
      Échange accepté ! 🎉
    </h1>
    <p style="margin:0 0 16px;font-size:14px;color:#6b7280;line-height:1.6;">
      Super nouvelle <strong style="color:#1B3B1A;">${toName}</strong> !<br/><br/>
      <strong style="color:#1B3B1A;">${acceptorPseudo}</strong> a accepté ton échange.
      Coordonnez-vous dans la boîte de messages pour organiser l'envoi des stickers.
    </p>
    <div style="background:#f0fdf4;border-radius:12px;padding:16px;margin:16px 0;">
      <p style="margin:0;font-size:13px;color:#1B3B1A;font-weight:700;">
        📦 Prépare tes stickers en double et conviens d'une adresse d'envoi !
      </p>
    </div>
    ${btn('Ouvrir la conversation →', link)}
  `)

  return resend.emails.send({
    from: FROM,
    to: toEmail,
    subject: `${acceptorPseudo} a accepté ton échange ! ✅`,
    html,
  })
}

// ── 3. Échange refusé ─────────────────────────────────────────

export async function sendSwapRefusedEmail({
  toEmail,
  toName,
  refuserPseudo,
}: {
  toEmail: string
  toName: string
  refuserPseudo: string
}) {
  const html = layout(`
    <h1 style="margin:0 0 8px;font-size:20px;font-weight:900;color:#1B3B1A;">
      Échange refusé
    </h1>
    <p style="margin:0 0 16px;font-size:14px;color:#6b7280;line-height:1.6;">
      Salut <strong style="color:#1B3B1A;">${toName}</strong>,<br/><br/>
      <strong style="color:#1B3B1A;">${refuserPseudo}</strong> n'a pas pu donner suite à ta proposition d'échange cette fois-ci.
      Pas de panique — d'autres collectionneurs attendent sur le Playground !
    </p>
    ${btn('Trouver d\'autres échanges →', `${APP_URL}/fr/playground`)}
  `)

  return resend.emails.send({
    from: FROM,
    to: toEmail,
    subject: `Proposition d'échange non retenue`,
    html,
  })
}

// ── 4. Échange complété ───────────────────────────────────────

export async function sendSwapCompletedEmail({
  toEmail,
  toName,
  otherPseudo,
}: {
  toEmail: string
  toName: string
  otherPseudo: string
}) {
  const html = layout(`
    <h1 style="margin:0 0 8px;font-size:20px;font-weight:900;color:#1B3B1A;">
      Échange terminé ! 🏆
    </h1>
    <p style="margin:0 0 16px;font-size:14px;color:#6b7280;line-height:1.6;">
      Félicitations <strong style="color:#1B3B1A;">${toName}</strong> !<br/><br/>
      Ton échange avec <strong style="color:#1B3B1A;">${otherPseudo}</strong> est désormais terminé.
      Pense à mettre à jour ta collection si ce n'est pas déjà fait.
    </p>
    <div style="background:#f0fdf4;border-radius:12px;padding:16px;margin:16px 0;">
      <p style="margin:0;font-size:13px;color:#1B3B1A;font-weight:700;">
        ⭐ Chaque échange complété te rapproche du badge "Grand Collectionneur" !
      </p>
    </div>
    ${btn('Voir mon album →', `${APP_URL}/fr/collection`)}
  `)

  return resend.emails.send({
    from: FROM,
    to: toEmail,
    subject: `Échange complété avec ${otherPseudo} 🎊`,
    html,
  })
}

// ── 5. Demande d'ami reçue ────────────────────────────────────

export async function sendFriendRequestEmail({
  toEmail,
  toName,
  fromPseudo,
}: {
  toEmail: string
  toName: string
  fromPseudo: string
}) {
  const link = `${APP_URL}/fr/profile/community`

  const html = layout(`
    <h1 style="margin:0 0 8px;font-size:20px;font-weight:900;color:#1B3B1A;">
      Nouvelle demande d'ami 👥
    </h1>
    <p style="margin:0 0 16px;font-size:14px;color:#6b7280;line-height:1.6;">
      Salut <strong style="color:#1B3B1A;">${toName}</strong>,<br/><br/>
      <strong style="color:#1B3B1A;">${fromPseudo}</strong> souhaite t'ajouter à sa liste d'amis sur SWAP'WC26.
      Les amis remontent en priorité dans les suggestions d'échange — c'est une bonne nouvelle !
    </p>
    ${btn('Accepter la demande →', link)}
  `)

  return resend.emails.send({
    from: FROM,
    to: toEmail,
    subject: `${fromPseudo} veut être ton ami sur SWAP'WC26 👋`,
    html,
  })
}
