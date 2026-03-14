const LOGIN_USERS = process.env.LOGIN_USERS?.split(',') || [];
const LOGIN_PASSWORDS = process.env.LOGIN_PASSWORDS?.split(',') || [];

export async function POST(req) {
  const { username, password } = await req.json();
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
  };
  // Check if username and password match any pair
  const userIndex = LOGIN_USERS.indexOf(username);
  if (userIndex !== -1 && LOGIN_PASSWORDS[userIndex] === password) {
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
