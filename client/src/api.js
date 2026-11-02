const API_URL = "http://localhost:5000";

export async function getRoverStatus() {
  const response = await fetch(`${API_URL}/api/status`);
  

  if (!response.ok) {
    throw new Error("Failed to fetch rover status");
  }

  return response.json();
}