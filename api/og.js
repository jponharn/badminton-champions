import { ImageResponse } from '@vercel/og';

export const config = {
  runtime: 'edge',
};

export default async function handler(req) {
  try {
    // ดึงข้อมูลจาก query parameters หรือ default
    const url = new URL(req.url);
    const winner = url.searchParams.get('winner') || 'Latest Champion';
    const tournament = url.searchParams.get('tournament') || 'Badminton Championship';
    const category = url.searchParams.get('category') || '';
    
    const championTitle = tournament ? `${winner} - ${tournament}` : winner;
    const championDescription = category ? `${winner} ชนะเลิศ ${tournament} (${category})` : `${winner} ชนะเลิศ ${tournament}`;
    
    return new ImageResponse(
      (
        <div
          style={{
            display: 'flex',
            fontSize: 60,
            color: '#ffffff',
            background: 'linear-gradient(135deg, #4f46e5 0%, #312e81 100%)',
            width: '100%',
            height: '100%',
            padding: '50px',
            textAlign: 'center',
            justifyContent: 'center',
            alignItems: 'center',
            fontFamily: '"Noto Sans Thai", system-ui',
          }}
        >
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '20px',
            }}
          >
            <div style={{ fontSize: 40, fontWeight: 'bold', color: '#fbbf24' }}>
              🏆 BADMINTON CHAMPIONS 🏆
            </div>
            <div style={{ fontSize: 48, fontWeight: 'bold', color: '#ffffff', lineHeight: 1.2 }}>
              {championTitle}
            </div>
            <div style={{ fontSize: 28, color: '#e5e7eb', fontWeight: '500' }}>
              {championDescription}
            </div>
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
        fonts: [
          {
            name: 'Noto Sans Thai',
            data: await fetch('https://fonts.gstatic.com/s/notosansthai/v17/iPfuCZEb-fN_EML2NAKj5vvEOOl0n1-XNy-fk0aDfpgf-Ry87xJhARr6JpglCdDvRoRLKb8YcvEVK1HfRe7aZ7VjdvQ.0.woff2').then(res => res.arrayBuffer()),
            style: 'normal',
          }
        ]
      }
    );
  } catch (error) {
    console.error('Error:', error);
    return new Response('Failed to generate image', { status: 500 });
  }
}
