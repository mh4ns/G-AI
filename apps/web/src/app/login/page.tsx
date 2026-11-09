"use client";

import React, { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowRight, Loader2 } from "lucide-react";
import { BrandLogo, hubUrl } from "@g-ai/ui";
import { ApiError, api } from "@/lib/api-client";

/** Only allow same-site relative redirects (blocks `//evil.com` and absolute URLs). */
function safeNext(raw: string | null): string {
  return raw && raw.startsWith("/") && !raw.startsWith("//") && !raw.startsWith("/\\") ? raw : "/today";
}

function errorMessage(err: unknown, mode: "login" | "register"): string {
  if (err instanceof ApiError) {
    if (err.status === 401) return "Email hoặc mật khẩu không đúng.";
    if (err.status === 409) return "Email này đã được đăng ký. Hãy đăng nhập.";
    if (err.status === 422) {
      return mode === "register"
        ? "Vui lòng kiểm tra lại: email hợp lệ, họ tên từ 2 ký tự, mật khẩu từ 8 ký tự."
        : "Vui lòng nhập email hợp lệ và mật khẩu.";
    }
  }
  return "Không kết nối được máy chủ. Vui lòng thử lại.";
}

function LoginForm() {
  const router = useRouter();
  const next = safeNext(useSearchParams().get("next"));
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      if (mode === "login") {
        await api.auth.login(email, password);
      } else {
        await api.auth.register(email, password, fullName);
      }
      router.replace(next);
      router.refresh();
    } catch (err) {
      setError(errorMessage(err, mode));
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputClass =
    "w-full rounded-xl border border-stone-200 bg-white px-4 py-3 text-sm text-stone-900 outline-none transition focus:border-[#FF5A36] focus:ring-2 focus:ring-[#FF5A36]/20";

  return (
    <div className="min-h-screen bg-canvas flex flex-col items-center justify-center px-4 py-12">
      <Link href={hubUrl("/")} className="mb-8">
        <BrandLogo variant="horizontal" isLight size="md" />
      </Link>

      <div className="w-full max-w-sm rounded-3xl border border-stone-200 bg-white p-6 sm:p-8 shadow-sm">
        <h1 className="text-xl font-bold text-stone-900">
          {mode === "login" ? "Đăng nhập" : "Tạo tài khoản"}
        </h1>
        <p className="mt-1 text-sm text-stone-500">
          Lưu lộ trình, nước uống và buổi tập của bạn trên mọi thiết bị.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-3" noValidate>
          {mode === "register" && (
            <div>
              <label htmlFor="fullName" className="mb-1 block text-xs font-semibold text-stone-600">
                Họ và tên
              </label>
              <input
                id="fullName"
                className={inputClass}
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                autoComplete="name"
                minLength={2}
                maxLength={100}
                required
              />
            </div>
          )}
          <div>
            <label htmlFor="email" className="mb-1 block text-xs font-semibold text-stone-600">
              Email
            </label>
            <input
              id="email"
              type="email"
              className={inputClass}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
            />
          </div>
          <div>
            <label htmlFor="password" className="mb-1 block text-xs font-semibold text-stone-600">
              Mật khẩu
            </label>
            <input
              id="password"
              type="password"
              className={inputClass}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete={mode === "login" ? "current-password" : "new-password"}
              minLength={mode === "register" ? 8 : 1}
              maxLength={128}
              required
            />
          </div>

          {error && (
            <p role="alert" className="rounded-xl bg-rose-50 px-3 py-2 text-xs text-rose-700">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-stone-900 px-4 py-3 text-sm font-bold text-white transition hover:bg-black disabled:opacity-60"
          >
            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
            <span>{mode === "login" ? "Đăng nhập" : "Đăng ký"}</span>
          </button>
        </form>

        <button
          type="button"
          onClick={() => {
            setMode(mode === "login" ? "register" : "login");
            setError(null);
          }}
          className="mt-4 w-full text-center text-xs font-semibold text-[#FF5A36] hover:underline"
        >
          {mode === "login" ? "Chưa có tài khoản? Đăng ký" : "Đã có tài khoản? Đăng nhập"}
        </button>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
