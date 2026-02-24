import * as admin from 'firebase-admin';

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    projectId: process.env.VITE_FIREBASE_PROJECT_ID,
    // credentials ใช้ Vercel environment หรือ service account JSON
  });
}

const db = admin.firestore();
const appId = 'badminton-hall-of-fame';

export default async function handler(req, res) {
  try {
    // ดึง latest champion จาก Firestore
    const championsRef = db.collection('artifacts').doc(appId).collection('public').doc('data').collection('champions');
    const snapshot = await championsRef.orderBy('date', 'desc').limit(1).get();
    
    if (snapshot.empty) {
      // ถ้าไม่มีข้อมูล ใช้ default
      return res.status(200).setHeader('Content-Type', 'text/html').send(`
        <!DOCTYPE html>
        <html lang="th">
        <head>
          <meta charset="UTF-8" />
          <meta property="og:title" content="Badminton Hall of Fame" />
          <meta property="og:description" content="ทำเนียบแชมป์แบดมินตัน" />
          <meta property="og:image" content="https://images.unsplash.com/photo-1521537634581-0dced2fee2ef?q=80&w=1200&auto=format&fit=crop" />
          <meta property="og:image:width" content="1200" />
          <meta property="og:image:height" content="630" />
          <meta property="og:url" content="https://badminton-champions.vercel.app" />
          <meta property="og:type" content="website" />
          <meta property="og:locale" content="th_TH" />
          <meta name="twitter:card" content="summary_large_image" />
          <meta name="twitter:image" content="https://images.unsplash.com/photo-1521537634581-0dced2fee2ef?q=80&w=1200&auto=format&fit=crop" />
          <title>Badminton Hall of Fame</title>
        </head>
        <body></body>
        </html>
      `);
    }

    const champion = snapshot.docs[0].data();
    const imageUrl = champion.image || "https://images.unsplash.com/photo-1521537634581-0dced2fee2ef?q=80&w=1200&auto=format&fit=crop";
    const championTitle = `${champion.winner} - ${champion.tournament}`;
    const championDescription = `${champion.winner} ชนะเลิศ ${champion.tournament} (${champion.category}) เมื่อวันที่ ${new Date(champion.date).toLocaleDateString('th-TH')}`;
    const pageUrl = "https://badminton-champions.vercel.app";

    const html = `
      <!DOCTYPE html>
      <html lang="th">
      <head>
        <meta charset="UTF-8" />
        <meta property="og:title" content="${escapeHtml(championTitle)}" />
        <meta property="og:description" content="${escapeHtml(championDescription)}" />
        <meta property="og:image" content="${imageUrl}" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:url" content="${pageUrl}" />
        <meta property="og:type" content="website" />
        <meta property="og:locale" content="th_TH" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="${escapeHtml(championTitle)}" />
        <meta name="twitter:description" content="${escapeHtml(championDescription)}" />
        <meta name="twitter:image" content="${imageUrl}" />
        <title>${escapeHtml(championTitle)} | Badminton Hall of Fame</title>
        <script>
          window.location.href = '/';
        </script>
      </head>
      <body></body>
      </html>
    `;

    res.status(200).setHeader('Content-Type', 'text/html').send(html);
  } catch (error) {
    console.error('Error fetching champion:', error);
    res.status(500).json({ error: 'Failed to fetch champion data' });
  }
}

function escapeHtml(text) {
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, m => map[m]);
}
