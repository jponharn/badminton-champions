export const config = {
  runtime: 'edge',
};

export default async function handler(req) {
  try {
    const projectId = process.env.VITE_FIREBASE_PROJECT_ID;
    const appId = 'badminton-hall-of-fame';
    
    let championData = {
      winner: 'Badminton Hall of Fame',
      tournament: 'Latest Champion',
      category: '',
      image: 'https://images.unsplash.com/photo-1521537634581-0dced2fee2ef?q=80&w=1200&auto=format&fit=crop'
    };
    
    // Try to fetch latest champion from Firestore REST API
    try {
      const firestoreUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/artifacts/${appId}/public/data/champions?pageSize=1&orderBy.field.name=date&orderBy.direction=DESCENDING`;
      
      const response = await fetch(firestoreUrl, {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Badminton-OG-Generator'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        
        if (data.documents && data.documents.length > 0) {
          const doc = data.documents[0].fields;
          
          championData = {
            winner: doc.winner?.stringValue || championData.winner,
            tournament: doc.tournament?.stringValue || championData.tournament,
            category: doc.category?.stringValue || '',
            image: doc.image?.stringValue || championData.image
          };
        }
      }
    } catch (firebaseError) {
      console.log('Firestore fetch warning (using defaults):', firebaseError.message);
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
  <meta property="og:image" content="${championData.image}" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta property="og:url" content="https://badminton-champions.vercel.app" />
  <meta property="og:type" content="website" />
  <meta property="og:locale" content="th_TH" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${escapeHtml(championTitle)}" />
  <meta name="twitter:description" content="${escapeHtml(championDescription)}" />
  <meta name="twitter:image" content="${championData.image}" />
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
    
    return new Response(html, {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
      },
    });
  } catch (error) {
    console.error('Error:', error);
    return new Response('<!DOCTYPE html><html><head><meta name="robots" content="noindex"></head><body>Error generating preview</body></html>', {
      status: 500,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
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
