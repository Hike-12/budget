export async function POST(req) {
  const { username, password } = await req.json();
  if (username === "Aliqyaan" && password === "INCORRECT12") {
    return Response.json({ success: true });
  }
  return Response.json({ success: false }, { status: 401 });
}