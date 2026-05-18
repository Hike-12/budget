import { connectToDB } from "@/lib/mongodb";
import User from "@/lib/User";
import bcrypt from "bcryptjs";
import { getCorsHeaders } from "@/lib/cors";
import { z } from "zod";

const signupSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export async function POST(req) {
  const corsHeaders = getCorsHeaders(req);
  try {
    const body = await req.json();

    // Server-side validation using zod
    const parsedData = signupSchema.safeParse(body);
    if (!parsedData.success) {
      return Response.json(
        {
          success: false,
          message: parsedData.error.errors[0].message,
        },
        { status: 400, headers: corsHeaders },
      );
    }

    const { username, password } = parsedData.data;

    await connectToDB();

    const normalizedUsername = username.toLowerCase().trim();
    const existingUser = await User.findOne({ username: normalizedUsername });

    if (existingUser) {
      return Response.json(
        { success: false, message: "Username already exists" },
        { status: 409, headers: corsHeaders },
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await User.create({
      username: normalizedUsername,
      password: hashedPassword,
    });

    return Response.json(
      { success: true, username: newUser.username },
      { status: 201, headers: corsHeaders },
    );
  } catch (error) {
    console.error("Signup error:", error);
    return Response.json(
      { success: false, message: "Internal server error" },
      { status: 500, headers: corsHeaders },
    );
  }
}

export async function OPTIONS(req) {
  return new Response(null, {
    status: 204,
    headers: getCorsHeaders(req),
  });
}
