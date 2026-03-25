import { connectToDB } from "@/lib/mongodb";
import User from "@/lib/User";
import bcrypt from "bcryptjs";

export async function POST(req) {
  try {
    const { username, password } = await req.json();
    
    if (!username || !password || username.length < 3) {
      return Response.json({ success: false, message: "Invalid username or password" }, { status: 400 });
    }

    await connectToDB();
    
    const normalizedUsername = username.toLowerCase().trim();
    const existingUser = await User.findOne({ username: normalizedUsername });
    
    if (existingUser) {
      return Response.json({ success: false, message: "Username already exists" }, { status: 409 });
    }
    
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const newUser = await User.create({
      username: normalizedUsername,
      password: hashedPassword
    });
    
    return Response.json({ success: true, username: newUser.username }, { status: 201 });
  } catch (error) {
    console.error("Signup error:", error);
    return Response.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
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
