const { ImageResponse } = require('@vercel/og');

export const config = {
  runtime: 'edge',
};

export default async function handler(req) {
  try {
    // ดึง latest champion จาก Firestore REST API
    const projectId = process.env.VITE_FIREBASE_PROJECT_ID;
    const appId = 'badminton-hall-of-fame';
    
    const firestoreUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/artifacts/${appId}/public/data/champions?orderBy.field.name=date&orderBy.direction=DESCENDING&pageSize=1`;
    
    const firestoreRes = await fetch(firestoreUrl);
    const firestoreData = await firestoreRes.json();
    
    let championTitle = "Badminton Hall of Fame";
    let championDescription = "ทำเนียบแชมป์แบดมินตัน";
    let championImage = "https://images.unsplash.com/photo-1521537634581-0dced2fee2ef?q=80&w=1200&auto=format&fit=crop";
    
    if (firestoreData.documents && firestoreData.documents.length > 0) {
      const doc = firestoreData.documents[0];
      const fields = doc.fields;
      
      const winner = fields.winner?.stringValue || '';
      const tournament = fields.tournament?.stringValue || '';
      const category = fields.category?.stringValue || '';
      const date = fields.date?.stringValue || '';
      const image = fields.image?.stringValue || championImage;
      
      championTitle = `${winner} - ${tournament}`;
      championDescription = `${winner} ชนะเลิศ ${tournament} (${category})`;
      championImage = image || championImage;
    }
    
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
            fontFamily: 'Arial, sans-serif',
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
            <div style={{ fontSize: 50, fontWeight: 'bold' }}>
              {championTitle}
            </div>
            <div style={{ fontSize: 30, color: '#e5e7eb' }}>
              {championDescription}
            </div>
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    );
  } catch (error) {
    console.error('Error:', error);
    return new Response('Failed to generate image', { status: 500 });
  }
}
