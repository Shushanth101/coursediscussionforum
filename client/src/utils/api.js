export const apiFetch = async (url, options = {}, triggerSessionExpired) => {
  let accessToken = localStorage.getItem('accessToken');
  
  const headers = {
    'Content-Type': 'application/json',
    ...(accessToken && { 'Authorization': `Bearer ${accessToken}` }),
    ...options.headers,
  };

  try {
    let response = await fetch(url, { ...options, headers });

    if (response.status === 401) {
      try {
        const refreshResponse = await fetch('http://localhost:5000/api/users/refresh', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include' // needed to send the HttpOnly refreshToken cookie
        });

        if (refreshResponse.ok) {
          const data = await refreshResponse.json();
          accessToken = data.accessToken;
          localStorage.setItem('accessToken', accessToken);
          
          // Retry original request
          headers['Authorization'] = `Bearer ${accessToken}`;
          response = await fetch(url, { ...options, headers });
        }
      } catch (refreshErr) {
        console.error('Token refresh failed:', refreshErr);
      }

      if (response.status === 401) {
        if (triggerSessionExpired) {
          triggerSessionExpired();
        }
        return response;
      }
    }

    return response;
  } catch (error) {
    console.error('API call error:', error);
    throw error;
  }
};
