const LOGIN_USERNAME = process.env.LOGIN_USERNAME;
const LOGIN_PASSWORD = process.env.LOGIN_PASSWORD;
const LOGIN_USERNAME2 = process.env.LOGIN_USERNAME2;
const LOGIN_PASSWORD2 = process.env.LOGIN_PASSWORD2;

export async function POST(req) {
  const { username, password } = await req.json();
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
  };
  if (username === LOGIN_USERNAME && password === LOGIN_PASSWORD) {
    return Response.json({ success: true });
  }
  if (username === LOGIN_USERNAME2 && password === LOGIN_PASSWORD2) {
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