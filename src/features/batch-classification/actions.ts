"use server";

export async function checkOpenAILimits() {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
  const apiKey = process.env.API_SECRET_KEY || '';

  try {
    const res = await fetch(`${apiUrl}/system/openai-limits`, {
      method: 'GET',
      headers: { 'X-API-Key': apiKey },
      cache: 'no-store'
    });
    if (!res.ok) {
      return { error: true, code: res.status, details: `API returned ${res.status}` };
    }
    return await res.json();
  } catch (error: any) {
    console.error('checkOpenAILimits error:', error);
    return { error: true, code: 500, details: error.message };
  }
}

export async function startBatchJob(formData: FormData) {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
  const apiKey = process.env.API_SECRET_KEY || '';

  try {
    // fetch will automatically set the correct multipart/form-data boundary when body is FormData
    const res = await fetch(`${apiUrl}/classify/batch`, {
      method: 'POST',
      headers: { 'X-API-Key': apiKey },
      body: formData,
    });
    
    if (!res.ok) {
       const text = await res.text();
       throw new Error(text || `API Error: ${res.status}`);
    }
    
    return await res.json();
  } catch (error: any) {
    console.error('startBatchJob error:', error);
    return { error: true, message: error.message };
  }
}

export async function checkBatchStatus(jobId: string) {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
  const apiKey = process.env.API_SECRET_KEY || '';

  try {
    const res = await fetch(`${apiUrl}/classify/batch/${jobId}`, {
      method: 'GET',
      headers: { 'X-API-Key': apiKey },
      cache: 'no-store'
    });
    
    if (!res.ok) throw new Error(`API Error: ${res.status}`);
    
    return await res.json();
  } catch (error: any) {
    console.error('checkBatchStatus error:', error);
    return { error: true, message: error.message };
  }
}
