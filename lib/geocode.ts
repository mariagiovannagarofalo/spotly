export async function geocode(location: string): Promise<{ latitude: number; longitude: number } | null> {
  try {
    const query = encodeURIComponent(location)
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${query}&format=json&limit=1`,
      { headers: { 'User-Agent': 'Spotly/1.0' } }
    )
    const data = await res.json()
    if (!data || data.length === 0) return null
    return {
      latitude: parseFloat(data[0].lat),
      longitude: parseFloat(data[0].lon),
    }
  } catch {
    return null
  }
}
