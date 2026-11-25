import { createHash, randomBytes } from "node:crypto";
import mongoose from "mongoose";
import { NextResponse } from "next/server";
import { connectToDB } from "@/lib/mongodb";

const cookieName = "budgetly_session";
const lifetime = 60 * 60 * 24 * 90;
const hash = (token) => createHash("sha256").update(token).digest("hex");
const sessionSchema = new mongoose.Schema({
  _id: String,
  user: { type: String, required: true },
  expiresAt: { type: Date, required: true, expires: 0 },
});
const Session =
  mongoose.models.AccountSession ||
  mongoose.model("AccountSession", sessionSchema);

function requestToken(req) {
  const token =
    req.headers.get("authorization")?.match(/^Bearer (\S+)$/i)?.[1] ??
    req.cookies.get(cookieName)?.value;
  return /^[0-9a-f]{64}$/.test(token ?? "") ? token : null;
}

function setSessionCookie(response, token, maxAge) {
  response.cookies.set(cookieName, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge,
  });
  return response;
}

export async function startAccountSession(username, headers, status = 200) {
  const token = randomBytes(32).toString("hex");
  await Session.create({
    _id: hash(token),
    user: username,
    expiresAt: new Date(Date.now() + lifetime * 1000),
  });
  const response = NextResponse.json(
    { success: true, username, sessionToken: token },
    { headers, status },
  );
  response.headers.set("Cache-Control", "no-store");
  return setSessionCookie(response, token, lifetime);
}

export async function accountForRequest(req) {
  const token = requestToken(req);
  if (!token) return null;
  await connectToDB();
  const session = await Session.findOne({
    _id: hash(token),
    expiresAt: { $gt: new Date() },
  }).lean();
  return session?.user ?? null;
}

export async function endAccountSession(req, headers) {
  const token = requestToken(req);
  if (token) {
    await connectToDB();
    await Session.deleteOne({ _id: hash(token) });
  }
  return setSessionCookie(
    new NextResponse(null, { status: 204, headers }),
    "",
    0,
  );
}
