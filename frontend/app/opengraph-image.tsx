import { ImageResponse } from 'next/og';

export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #eff6ff 0%, #ffffff 50%, #faf5ff 100%)',
          fontFamily: 'sans-serif',
        }}
      >
        <div style={{ display: 'flex', fontSize: 84, fontWeight: 800, letterSpacing: -2 }}>
          <span style={{ color: '#2563eb' }}>MegaMart</span>
          <span style={{ color: '#111827' }}>.ai</span>
        </div>
        <div style={{ display: 'flex', marginTop: 20, fontSize: 32, color: '#6b7280', fontWeight: 500 }}>
          AI-native shopping — search, recommendations, a tool-using agent
        </div>
      </div>
    ),
    { ...size }
  );
}
