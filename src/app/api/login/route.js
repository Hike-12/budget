export async function POST(req) {
  const { username, password } = await req.json();
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
  };
  if (username === "Aliqyaan" && password === "INCORRECT12") {
    return Response.json({ success: true });
  }
  return Response.json({ success: false }, { status: 401 });
}

export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}