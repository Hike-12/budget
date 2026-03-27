import { connectToDB } from "@/lib/mongodb";
import User from "@/lib/User";
import bcrypt from "bcryptjs";
import { z } from "zod";

const allowedOrigins = [
  "http://localhost:8081",
  "http://localhost:19006",
  "https://budget-tracker-hike.vercel.app",
  "https://budget-tracker-aliqyaan.vercel.app",
  process.env.WEB_ORIGIN,
].filter(Boolean);

function getCorsHeaders(req) {
  const origin = req.headers.get("origin") || "";
  const allowOrigin = allowedOrigins.includes(origin) ? origin : "*";
  return {
    "Access-Control-Allow-Origin": allowOrigin,
    "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS,PATCH",
    "Access-Control-Allow-Headers":
      "Content-Type, Authorization, X-Idempotency-Key",
    Vary: "Origin",
  };
}

const loginSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(1, "Password is required"),
});

export async function POST(req) {
  const corsHeaders = getCorsHeaders(req);
  try {
    const body = await req.json();

    // Server-side validation using zod
    const parsedData = loginSchema.safeParse(body);
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

    let normalizedUsername = username.toLowerCase().trim();
    const user = await User.findOne({ username: normalizedUsername });

    if (!user) {
      // Automatic migration fallback for users defined in environment variables
      const LOGIN_USERS = process.env.LOGIN_USERS?.split(",") || [];
      const LOGIN_PASSWORDS = process.env.LOGIN_PASSWORDS?.split(",") || [];
      const userIndex = LOGIN_USERS.findIndex(
        (u) => u.trim().toLowerCase() === normalizedUsername,
      );

      if (userIndex !== -1 && LOGIN_PASSWORDS[userIndex].trim() === password) {
        // Migrate user to the DB
        const hashedPassword = await bcrypt.hash(password, 10);
        await User.create({
          username: normalizedUsername,
          password: hashedPassword,
        });
        return Response.json(
          { success: true, username: normalizedUsername },
          { headers: corsHeaders },
        );
      }

      return Response.json(
        { success: false, message: "User not found" },
        { status: 401, headers: corsHeaders },
      );
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (isPasswordValid) {
      return Response.json(
        { success: true, username: user.username },
        { headers: corsHeaders },
      );
    } else {
      return Response.json(
        { success: false, message: "Invalid password" },
        { status: 401, headers: corsHeaders },
      );
    }
  } catch (error) {
    console.error("Login error:", error);
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
