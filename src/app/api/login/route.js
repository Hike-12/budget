import { connectToDB } from "@/lib/mongodb";
import User from "@/lib/User";
import bcrypt from "bcryptjs";
import { getCorsHeaders } from "@/lib/cors";
import { z } from "zod";

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
      // Migration fallback for users defined in LOGIN_CREDENTIALS env var (JSON array).
      // Falls back to comma-separated LOGIN_USERS + LOGIN_PASSWORDS for legacy compat.
      let credentials = [];
      try {
        const raw = process.env.LOGIN_CREDENTIALS;
        if (raw) credentials = JSON.parse(raw);
      } catch {
        // ignore invalid JSON
      }

      // Legacy comma-separated fallback
      if (credentials.length === 0) {
        const legacyUsers = process.env.LOGIN_USERS?.split(",") || [];
        const legacyPasswords = process.env.LOGIN_PASSWORDS?.split(",") || [];
        if (legacyUsers.length === legacyPasswords.length) {
          credentials = legacyUsers.map((u, i) => ({
            username: u.trim().toLowerCase(),
            password: legacyPasswords[i],
          }));
        }
      }

      const match = credentials.find(
        (c) => c.username === normalizedUsername && c.password === password,
      );

      if (match) {
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
