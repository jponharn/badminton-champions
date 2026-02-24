import * as admin from 'firebase-admin';

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  });
}

export default async function handler(req, res) {
  try {
    const db = admin.firestore();
    const appId = 'badminton-hall-of-fame';
    
    let championData = {
      winner: 'Badminton Hall of Fame',
      tournament: 'Latest Champion',
      category: '',
      image: 'https://images.unsplash.com/photo-1521537634581-0dced2fee2ef?q=80&w=1200&auto=format&fit=crop'
    };
    
    // ดึง latest champion จาก Firestore (Server-side)
    try {
      const championsRef = db
        .collection('artifacts')
        .doc(appId)
        .collection('public')
        .doc('data')
        .collection('champions');
      
      const snapshot = await championsRef
        .orderBy('date', 'desc')
        .limit(1)
        .get();
      
      if (!snapshot.empty) {
        const doc = snapshot.docs[0].data();
        
        championData = {
          winner: doc.winner || championData.winner,
          tournament: doc.tournament || championData.tournament,
          category: doc.category || '',
          image: doc.image || championData.image
        };
        
        console.log('Champion data fetched:', championData);
      }
    } catch (firebaseError) {
      console.log('Firestore fetch error (using defaults):', firebaseError.message);
    }
    
    const championTitle = `${championData.winner} - ${championData.tournament}`;
    const championDescription = championData.category 
      ? `${championData.winner} ชนะเลิศ ${championData.tournament} (${championData.category})`
      : `${championData.winner} ชนะเลิศ ${championData.tournament}`;
    
    const html = `<!DOCTYPE html>
<html lang="th">
<head>
  <meta charset="UTF-8" />
  <meta property="og:title" content="${escapeHtml(championTitle)}" />
  <meta property="og:description" content="${escapeHtml(championDescription)}" />
  <meta property="og:image" content="${escapeHtml(championData.image)}" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta property="og:url" content="https://badminton-champions.vercel.app" />
  <meta property="og:type" content="website" />
  <meta property="og:locale" content="th_TH" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${escapeHtml(championTitle)}" />
  <meta name="twitter:description" content="${escapeHtml(championDescription)}" />
  <meta name="twitter:image" content="${escapeHtml(championData.image)}" />
  <title>${escapeHtml(championTitle)}</title>
  <meta http-equiv="refresh" content="0;url=/" />
</head>
<body>
  <p>Redirecting to home page...</p>
  <script>
    window.location.href = '/';
  </script>
</body>
</html>`;
    
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=3600');
    res.status(200).send(html);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).send('<!DOCTYPE html><html><head><meta name="robots" content="noindex"></head><body>Error generating preview</body></html>');
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
  return String(text).replace(/[&<>"']/g, m => map[m]);
}
