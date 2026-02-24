export const config = {
  runtime: 'edge',
};

export default async function handler(req) {
  try {
    const url = new URL(req.url);
    
    // ดึงข้อมูล champion จาก query parameters
    const winner = url.searchParams.get('winner') || 'Badminton Hall of Fame';
    const tournament = url.searchParams.get('tournament') || 'Latest Champion';
    const category = url.searchParams.get('category') || '';
    const image = url.searchParams.get('image') || 'https://images.unsplash.com/photo-1521537634581-0dced2fee2ef?q=80&w=1200&auto=format&fit=crop';
    
    const championTitle = `${winner} - ${tournament}`;
    const championDescription = category 
      ? `${winner} ชนะเลิศ ${tournament} (${category})`
      : `${winner} ชนะเลิศ ${tournament}`;
    
    const html = `<!DOCTYPE html>
<html lang="th">
<head>
  <meta charset="UTF-8" />
  <meta property="og:title" content="${escapeHtml(championTitle)}" />
  <meta property="og:description" content="${escapeHtml(championDescription)}" />
  <meta property="og:image" content="${escapeHtml(image)}" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta property="og:url" content="https://badminton-champions.vercel.app" />
  <meta property="og:type" content="website" />
  <meta property="og:locale" content="th_TH" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${escapeHtml(championTitle)}" />
  <meta name="twitter:description" content="${escapeHtml(championDescription)}" />
  <meta name="twitter:image" content="${escapeHtml(image)}" />
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
        'Cache-Control': 'public, max-age=3600',
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
