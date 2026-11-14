# G-AI — Sprint Development Roadmap (Phương án A: Web-First → Mobile)

> **Ngày lập:** 2026-11-12  
> **Phạm vi:** Lộ trình chia Sprint tiếp nối từ mã nguồn hiện tại trên nhánh `chore/claude-project-plugins` (đã gộp `main`).  
> **Quy ước mặc định:** Mỗi Sprint kéo dài **2 tuần** (phù hợp team 2–3 dev hoặc 1–2 full-stack + AI). Có thể rút về 1 tuần nếu tăng nhân sự hoặc cắt bớt phạm vi từng Sprint.

---

## 1. Mục tiêu, Phi mục tiêu & Ràng buộc

### Mục tiêu (Goals)
- Khép kín vòng lặp sản phẩm Web + Backend (Daily Habit Loop → Body & Mind → Monetization) trước khi nhân bản sang Mobile.
- Giữ `apps/backend` và `packages/shared-types` làm nguồn chân lý duy nhất (Single Source of Truth) về dữ liệu và công thức tính toán.
- Đảm bảo 100% tính năng **Hardware-Free** (Webcam/Camera + thước dây + RPE), không phụ thuộc cân điện tử hay vòng đeo tay BLE.

### Phi mục tiêu (Non-Goals)
- Chưa tích hợp phần cứng BLE (cân BIA, smart band) trong 5 Sprint này (bảo lưu theo định hướng Software-Only của `docs/USECASE_BREAKDOWN.md`).
- Chưa xây dựng các tính năng mạng xã hội phức tạp (feed, chat nhóm) ngoài cơ chế Streak cá nhân.

### Ràng buộc kỹ thuật (Constraints)
- **Backend**: Python FastAPI, async SQLAlchemy 2.0, Alembic migrations (`alembic check` phải pass sau mọi thay đổi model), `pytest`.
- **Web Apps**: Next.js 15 (App Router), React 19, Tailwind CSS, `@g-ai/ui`, proxy `/api/v1/*` cùng origin để giữ session cookie `httpOnly`.
- **Parity**: Mọi thay đổi API contract phải cập nhật `packages/shared-types/openapi/backend-v1.json` và giữ parity với `packages/shared-types/fixtures/plan-vectors.json`.
- **Bảo mật**: Không hardcode secrets; ảnh tiến độ cơ thể phải là private storage có kiểm tra quyền sở hữu; webhook thanh toán phải verify chữ ký và idempotent.

---

## 2. Hiện trạng Baseline (Sprint 0 — Đã hoàn thành)

| Phân hệ | Trạng thái hiện tại | Vị trí trong repo | Khoảng trống còn lại |
| :--- | :--- | :--- | :--- |
| **Auth & Session** | Đã có `register`, `login`, `logout`, `password`, `me`, throttle chống brute-force, trang `/login` | `apps/backend/app/api/v1/endpoints/auth.py`, `apps/web/src/app/login/page.tsx` | Thiếu UI quản lý hồ sơ/đổi mật khẩu, luồng quên mật khẩu |
| **Onboarding & Plan** | Đã có Wizard, tính BMI/BMR/TDEE (Mifflin-St Jeor), test parity Web–Backend | `apps/web/src/app/quiz/`, `apps/backend/app/services/plan_calculator.py` | Thiếu tái hiệu chỉnh lộ trình tự động (`UC-1.3`) |
| **AI Digital Twin** | Đã có pipeline `/prediction` (Gemini + Imagen), timeline scrubber, before/after | `apps/web/src/app/prediction/`, `apps/web/src/app/api/prediction/` | Cần gắn cổng VIP/quota khi bật monetization |
| **AI Live Workout** | Đã có `@mediapipe/tasks-vision` (`PoseLandmarker`), tính góc/đếm rep, `speechSynthesis`, `/workouts/logs` | `apps/web/src/components/workout/`, `apps/backend/app/api/v1/endpoints/workout.py` | Thiếu Video Player bài tập mẫu + Audio Ducking (`UC-2.1`) |
| **Today & Habits** | Đã có `/today` sync `water`, `calories`, `fasting_state`, `habits_completed` | `apps/web/src/app/today/page.tsx`, `apps/backend/app/api/v1/endpoints/today.py` | Calo mới cộng thô; Fasting thiếu timer sinh học; thiếu logic Streak |
| **Hub & Store** | Đã có Landing (`apps/hub`, `apps/site`), Catalog JSON, `/store/products`, `/store/orders` | `apps/hub/`, `apps/site/`, `apps/backend/app/api/v1/endpoints/store.py` | Đơn hàng dừng ở trạng thái chờ thanh toán (chưa có Stripe) |
| **Dinh dưỡng / Body / CBT / Mobile** | Chưa có code (chỉ có spec & `apps/mobile/README.md`) | `docs/USECASE_BREAKDOWN.md`, `apps/mobile/README.md` | Cần triển khai mới từ Sprint 1–5 |

---

## 3. Lộ trình tổng thể (Sprint 1 → Sprint 5)

```mermaid
gantt
    title Lộ trình Sprint G-AI (Phương án A: Web-First -> Mobile)
    dateFormat  YYYY-MM-DD
    section Baseline (Đã xong)
    Sprint 0: Auth, Quiz, Digital Twin, MediaPipe Pose, Today & Store base :done, s0, 2026-11-01, 2026-11-15
    section Web & Backend Completion
    Sprint 1: Core Daily Loop (Dinh dưỡng, Fasting UI, Streak, Profile) :active, s1, 2026-11-16, 14d
    Sprint 2: Body & Mind (US Navy Fat, Progress Album, Breathe, CBT AI)  :s2, after s1, 14d
    Sprint 3: Monetization & Hardening (Video Ducking, Stripe, VIP, E2E)   :s3, after s2, 14d
    section Cross-Platform Mobile
    Sprint 4: Mobile Foundation (Expo, Auth, Quiz, Today, Push)            :s4, after s3, 14d
    Sprint 5: Mobile Native AI & Store (Camera Pose, Barcode, IAP)         :s5, after s4, 14d
```

---

## 4. Chi tiết từng Sprint

### Sprint 1 (Tuần 1–2): Core Daily Loop — Dinh dưỡng, Fasting Tracker & Streak
- **Mục tiêu Sprint:** Biến `/today` thành công cụ dùng hằng ngày thực thụ với dữ liệu dinh dưỡng chi tiết, đồng hồ nhịn ăn chuẩn chu kỳ và chuỗi ngày thành tích.
- **Use Cases:** `UC-3.1` (Web Smart Search & Meal Log), `UC-3.2` (Fasting Tracker), `UC-6.3` (Streak System), `UC-1.3` (Recalibration cơ bản).
- **Backend (`apps/backend`):**
  - Tạo model & migration `food_items` (seed ~150+ món phổ biến VN/quốc tế) và `meal_logs` (breakfast/lunch/dinner/snack, gram, calo, protein/carbs/fat).
  - API `/api/v1/nutrition/foods` (tìm kiếm) và `/api/v1/nutrition/meals` (CRUD tự đồng bộ `DailyMetric.calories_consumed`).
  - Mở rộng `DailyMetric` với `fasting_started_at`, `fasting_protocol` (`16:8`, `14:10`, `18:6`) để tính thời gian trôi qua chính xác phía server.
  - Service tính `streak_days` liên tục & API `/api/v1/today/summary` (lịch sử 7 ngày + streak).
  - API ghi nhận cân nặng mới & tái hiệu chỉnh TDEE (`UC-1.3`) khi chững cân hoặc thay đổi mục tiêu.
- **Web (`apps/web`):**
  - Giao diện tìm kiếm món ăn, ghi nhận bữa ăn theo gram và hiển thị thanh tiến độ Macro (Protein / Carbs / Fat) trên `/today`.
  - Đồng hồ đếm ngược Fasting trực quan hóa 3 giai đoạn (0–4h Tiêu hóa, 4–12h Đốt mỡ, 12–16h Autophagy) + Web Notification xin quyền nhắc khi kết thúc phiên.
  - Hiển thị huy hiệu Streak và trang `/profile` (đổi mật khẩu, cập nhật cân nặng/mục tiêu).
- **Definition of Done (DoD):**
  - `alembic check` sạch; unit/integration test cho meal log, fasting state, streak; `npm run build` & `npm run lint` không lỗi.

---

### Sprint 2 (Tuần 3–4): Body & Mind — US Navy Body Fat, Nhật ký Vóc dáng & CBT/Breathe
- **Mục tiêu Sprint:** Hoàn thiện 2 phân hệ tạo khác biệt Hardware-Free: đo % mỡ không cần cân và chăm sóc tinh thần chống Stress Eating.
- **Use Cases:** `UC-4.1`, `UC-4.2`, `UC-5.1`, `UC-5.2`.
- **Backend (`apps/backend`):**
  - Model & API `/api/v1/body/measurements`: lưu số đo cổ, eo, hông, cân nặng; tính % mỡ cơ thể theo công thức **US Navy** (riêng công thức Nam/Nữ) + phân loại thể trạng.
  - Model & API `/api/v1/body/progress-photos`: lưu ảnh tiến độ 3 góc (chính diện, nghiêng, sau lưng) trên private storage (Supabase Storage / S3 signed URL, chặn truy cập chéo user).
  - Model & API `/api/v1/mind/chat`: lưu phiên nhật ký CBT và gọi LLM gateway với system prompt chuyên biệt cho trị liệu hành vi nhận thức (giải tỏa cảm xúc, chống ăn vặt theo stress), có rate limit & xử lý lỗi an toàn.
- **Web (`apps/web`):**
  - Trang `/body`: form nhập số đo thước dây (kèm hướng dẫn vị trí đo), biểu đồ xu hướng % mỡ/vòng eo, gallery ảnh 3 góc + thanh trượt so sánh Trước/Sau theo ngày.
  - Trang `/mind`:
    - **Visual Breathwork:** Đồ họa SVG/Canvas phồng–xẹp theo nhịp `4-4-4-4` (Box Breathing) và `4-7-8`, kèm âm thanh chuông/gió bằng Web Audio API.
    - **CBT AI Companion:** Giao diện chat đồng cảm + gợi ý hành động nhanh (ví dụ chuyển sang bài thở 2 phút hoặc uống 250ml nước).
- **Definition of Done (DoD):**
  - Unit test xác minh công thức US Navy với nhiều biên độ số đo Nam/Nữ; kiểm tra phân quyền ảnh tiến độ (403/404 nếu truy cập ảnh user khác); CBT chat xử lý êm khi thiếu/quá tải LLM key.

---

### Sprint 3 (Tuần 5–6): Monetization, Video Player & Production Hardening
- **Mục tiêu Sprint:** Mở khóa luồng thanh toán thật cho cả Store lẫn gói VIP, hoàn thiện trải nghiệm tập video và sẵn sàng vận hành production.
- **Use Cases:** `UC-2.1` (Video Player + Audio Ducking), `UC-7.1` (Stripe Checkout & VIP Entitlement), Forgot Password.
- **Backend (`apps/backend`):**
  - Tích hợp **Stripe Checkout & Webhook** (`/api/v1/payments/checkout/order`, `/api/v1/payments/checkout/subscription`, `/api/v1/payments/webhook`): verify `Stripe-Signature`, idempotency key, cập nhật `Order.status` và bảng `subscriptions` + cờ `User.is_premium`.
  - Luồng quên/đặt lại mật khẩu (`/auth/forgot-password`, `/auth/reset-password` token hết hạn ngắn).
  - Phân quyền VIP entitlement cho AI Digital Twin quota & giáo án chuyên sâu.
- **Web & Site (`apps/web`, `apps/site`, `apps/hub`):**
  - Nâng cấp `LiveWorkoutStudio`: phát video bài tập mẫu đồng bộ bộ đếm tập/nghỉ (`45s/15s`), dùng Web Audio API hạ âm lượng video/nhạc nền xuống ~20% khi AI cất giọng sửa tư thế (Audio Ducking).
  - Trang nâng cấp gói VIP (`/pricing` hoặc paywall modal) & màn hình thành công/hủy thanh toán Stripe.
  - Hoàn thiện luồng Checkout trên `apps/site` nối trực tiếp Stripe Session + xem lịch sử đơn hàng.
  - Hardening: kiểm thử E2E luồng lõi, kiểm tra CORS/cookie/CSP headers, verify deploy script (Render + Vercel).
- **Definition of Done (DoD):**
  - Test webhook Stripe với payload ký giả lập (test suite); test Audio Ducking & Workout logging; toàn bộ CI (`pytest`, `typecheck`, `lint`, `build`) xanh.

---

### Sprint 4 (Tuần 7–8): Mobile App Foundation & Core Sync (`apps/mobile`)
- **Mục tiêu Sprint:** Xây dựng ứng dụng di động chạy thực tế trên iOS/Android, đồng bộ 100% dữ liệu với tài khoản Web qua cùng Backend.
- **Quyết định kiến trúc (đề xuất):** Dùng **React Native + Expo (TypeScript)** để tái sử dụng `packages/shared-types` và logic `plan_calculator` parity. *(Lưu ý: cần bổ sung hỗ trợ `Authorization: Bearer <token>` ổn định cho mobile song song với cookie của Web ở `apps/backend/app/api/deps.py` — hiện backend đã nhận Bearer hoặc cookie, cần xác nhận flow refresh/expiry).*
- **Hạng mục:**
  - Khởi tạo workspace `apps/mobile` trong monorepo, cấu hình Expo Router, SecureStore lưu JWT.
  - Màn hình Auth (Đăng nhập/Đăng ký), Onboarding Quiz, Today Dashboard, Hydration `+250ml`, Meal Log (Smart Search), Fasting Timer.
  - Expo Push Notifications nhắc uống nước và kết thúc chu kỳ Fasting.
- **Definition of Done (DoD):**
  - Build chạy trên Android & iOS simulator; thay đổi nước uống/bữa ăn trên Mobile hiện ngay khi mở Web và ngược lại.

---

### Sprint 5 (Tuần 9–10): Mobile AI Camera, Barcode Scanner & Store IAP
- **Mục tiêu Sprint:** Hoàn tất các tính năng native của Mobile và phát hành bản Beta lên TestFlight / Play Internal Testing.
- **Use Cases:** `UC-2.4` (Mobile Camera Pose + Audio Ducking), `UC-3.1` (Mobile Barcode Scanner), `UC-7.1` (Mobile IAP).
- **Hạng mục:**
  - Tích hợp Camera trước + Pose Detection on-device trên Mobile + Audio Manager ducking khi AI nhắc lỗi tư thế.
  - Tích hợp quét mã vạch bao bì thực phẩm (Expo Camera / ML Kit) tra cứu và điền nhanh vào `meal_logs`.
  - Tích hợp In-App Purchase (RevenueCat hoặc trực tiếp Google Play Billing / StoreKit) + endpoint xác thực biên lai về `apps/backend` để dùng chung trạng thái `is_premium` giữa Web và Mobile.
- **Definition of Done (DoD):**
  - Quét mã vạch mẫu ghi nhận thành công vào `meal_logs`; workout camera trên thiết bị thật đếm rep & log lên `/workouts/logs`; sandbox IAP mở khóa VIP đồng bộ sang Web.

---

## 5. Rủi ro chính & Cách kiểm soát
1. **Rủi ro Mobile Pose Detection trên thiết bị cấu hình thấp:** Cần giới hạn FPS xử lý (15–20 FPS) và fallback sang chế độ tập Video chuẩn nếu thiết bị không đủ hiệu năng.
2. **Rủi ro dữ liệu món ăn Việt Nam:** Kho thực phẩm quốc tế thường thiếu món Việt; nên chuẩn bị sẵn file seed JSON (~150–200 món Việt phổ biến + nguyên liệu cơ bản) ở Sprint 1.
3. **Rủi ro đồng bộ Entitlement (Stripe Web vs Apple/Google IAP):** Tập trung toàn bộ trạng thái `is_premium` về bảng `subscriptions` ở `apps/backend` làm nguồn chân lý duy nhất.
