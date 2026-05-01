export const AGORA_APP_ID = '87a7dc688c034264894f131e68ad8939';
const BACKEND_URL = 'https://falou-backend.vercel.app/api/agora-token';

export const generateAgoraToken = async (channelName: string, uid: number, role: string = 'publisher') => {
  try {
    const response = await fetch(`${BACKEND_URL}?channel=${channelName}&uid=${uid}&role=${role}`);
    const data = await response.json();
    
    if (data.token) {
      return { success: true, token: data.token, appId: AGORA_APP_ID };
    }
    return { success: false, error: data.error || 'Erro ao gerar token' };
  } catch (error) {
    return { success: false, error: String(error) };
  }
};
