# ADR-0004: Supabase làm Managed PostgreSQL + Private Storage; FastAPI + Alembic làm chủ Schema và Identity

- **Trạng thái:** Proposed (Chờ duyệt Giai đoạn 1)
- **Ngày:** 2026-11-12
- **Liên quan:** [ADR-0001](0001-sessions-and-api-boundary.md), [ADR-0002](0002-prediction-images-privacy.md), [ADR-0003](0003-catalog-login-throttling-token-revocation.md), [Lộ trình Sprint](../../docs/superpowers/specs/2026-11-12-sprint-roadmap-design.md)

---

## Bối cảnh

Dự án G-AI đi theo **Hướng 1**: trình duyệt (`apps/web`, `apps/site`) không bao giờ gọi thẳng tới Supabase. Mọi yêu cầu đi qua Next.js rewrite `/api/v1/*` tới `apps/backend` (FastAPI), xác thực bằng JWT trong cookie `httpOnly` (`Bearer` cho client không phải trình duyệt). Supabase chỉ đóng vai trò **Managed PostgreSQL** và **Private Object Storage** cho ảnh sinh trắc học (ảnh dự đoán Digital Twin theo ADR-0002 và ảnh tiến độ vóc dáng ở Sprint 2).

Hiện tại trong repo có một số điểm cần chuẩn hoá trước khi mở rộng schema cho Sprint 1–3:
1. `apps/backend/.env.example` có thêm `SUPABASE_PUBLISHABLE_KEY` và `SUPABASE_JWKS_URL` nhưng chưa code nào dùng.
2. Mọi bảng hiện có (`10` bảng ứng dụng + `alembic_version`) nằm trong schema `public` và chưa có migration bật RLS / thu hồi quyền `anon`/`authenticated`.
3. `apps/backend` hiện kết nối bằng role `postgres` (full owner + `BYPASSRLS` + DDL), chưa tách quyền runtime tối thiểu theo nguyên tắc least privilege trong `AGENTS.md`.
4. Chưa có quy ước chuẩn hoá cho Supabase Storage private buckets khi đưa ảnh tiến độ và pipeline prediction lên backend.

---

## Quyết định

### 1. Biến môi trường Auth & Supabase của Backend
Hướng 1 **không dùng Supabase Auth (`auth.users` / GoTrue)**; FastAPI vẫn phát hành và thu hồi JWT riêng bằng `SECRET_KEY` và `users.token_version` (ADR-0001, ADR-0003).

- **Giữ / Bổ sung vào `apps/backend/app/core/config.py` và `.env.example`:**
  - `DATABASE_URL`: chuỗi kết nối Postgres (khuyến nghị Session Pooler port `5432`, hoặc Transaction Pooler port `6543`).
  - `MIGRATION_DATABASE_URL` *(tùy chọn, xem Quyết định 3)*: chuỗi kết nối của role chạy Alembic DDL; nếu không đặt sẽ fallback về `DATABASE_URL`.
  - `SUPABASE_URL`: URL project (`https://<project-ref>.supabase.co`), dùng cho backend gọi Supabase Storage API.
  - `SUPABASE_SECRET_KEY`: secret key (`sb_secret_...`, hoặc `service_role` ở project cũ) chỉ nằm ở backend để upload/xóa/tạo signed URL cho private buckets. Tuyệt đối không đặt tiền tố `NEXT_PUBLIC_` hay đưa xuống client.
- **Loại bỏ khỏi `apps/backend/.env.example` (không đưa vào `config.py`):**
  - `SUPABASE_JWKS_URL`: chỉ dùng khi xác thực JWT của Supabase Auth; giữ lại dễ gây hiểu nhầm rằng backend chấp nhận token của GoTrue.
  - `SUPABASE_PUBLISHABLE_KEY`: chỉ dùng khi frontend/mobile gọi thẳng Supabase Data API hoặc Auth; hướng 1 cấm client gọi thẳng Supabase và backend đã dùng `SUPABASE_SECRET_KEY` cho Storage.

### 2. Khoá Data API cho toàn bộ schema `public` (bao gồm `alembic_version`)

**Hành vi mặc định hiện tại đã kiểm chứng từ tài liệu Supabase (2026):**
- Trước đây, Supabase tự động `GRANT SELECT, INSERT, UPDATE, DELETE` trên các bảng mới trong schema `public` cho `anon`, `authenticated` và `service_role`.
- Từ năm 2026 (tùy chọn từ 28/04/2026, mặc định cho project mới từ 30/05/2026, áp dụng toàn cầu cho project cũ từ 30/10/2026), bảng **mới tạo** trong `public` không còn được tự động cấp quyền cho Data API (`anon`/`authenticated`) nữa — nhưng các bảng đã tạo trước đợt rollout vẫn giữ nguyên `GRANT` cũ, và Supabase Security Advisor vẫn kiểm tra `rowsecurity = true` trên mọi bảng thuộc `public`.

**So sánh 3 cơ chế khoá:**

| Phương án | Cơ chế | Ưu điểm | Nhược điểm / Giới hạn |
| :--- | :--- | :--- | :--- |
| **A. Bật RLS, không tạo policy** | `ENABLE ROW LEVEL SECURITY` trên mọi bảng, không `CREATE POLICY` cho `anon`/`authenticated` | Default-deny ở tầng hàng; qua bài kiểm tra Security Advisor; versioned trong Alembic | Nếu vẫn còn `GRANT`, PostgREST vẫn liệt kê metadata bảng; dễ quên `alembic_version` vì không nằm trong `Base.metadata` |
| **B. Thu hồi `GRANT` của `anon`/`authenticated`** | `REVOKE ALL ... FROM anon, authenticated` + `ALTER DEFAULT PRIVILEGES ... REVOKE` | Chặn hoàn toàn PostgREST chạm tới bảng (`42501`); bỏ bảng khỏi schema cache API | Không tự bật `rowsecurity = true` (Security Advisor vẫn cảnh báo nếu chỉ `REVOKE`) |
| **C. Schema riêng không expose / Tắt Data API trên Dashboard** | Chuyển toàn bộ bảng sang schema `app` hoặc tắt Data API trong Dashboard | Cô lập hoàn toàn khỏi PostgREST | Chuyển schema phá vỡ 10 bảng + lịch sử Alembic hiện tại ở `public`; tắt ở Dashboard là cấu hình ngoài Git, dễ sót khi dựng môi trường mới |

**Tổ hợp được chọn (A + B trong Alembic, không dùng `FORCE ROW LEVEL SECURITY`):**
1. Giữ các bảng ở schema `public` để không xáo trộn 10 bảng hiện có và các migration đã chạy.
2. Trong migration Alembic (chỉ chạy khi `bind.dialect.name == "postgresql"` và kiểm tra `pg_roles` có `anon`/`authenticated` để tương thích cả Postgres thuần ở `TEST_DATABASE_URL`):
   - `REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon, authenticated;` (kèm `SEQUENCES`, `ROUTINES`) và `ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public REVOKE ALL ... FROM anon, authenticated;`.
   - `ALTER TABLE public.<table_name> ENABLE ROW LEVEL SECURITY;` cho **toàn bộ** bảng ứng dụng **và `public.alembic_version`**, với **0 policy** cho `anon` và `authenticated`.
3. **Không dùng `FORCE ROW LEVEL SECURITY`:** Nếu bật `FORCE`, chính role sở hữu bảng (nếu không có `BYPASSRLS`) cũng bị chặn bởi RLS (0 policy = từ chối toàn bộ). Ngoài ra, khuyến nghị tắt hẳn Data API exposure cho `public` trong Supabase Dashboard như một lớp phòng thủ bổ sung, nhưng an toàn hệ thống không phụ thuộc vào thao tác tay đó.

### 3. Role kết nối & Least Privilege (`postgres` vs tách role Migration / Runtime)

Hiện tại [deploy-render.md](../deploy-render.md) kết nối bằng role `postgres` (sở hữu bảng, có `BYPASSRLS`, `CREATEDB`, `CREATEROLE`). Để đáp ứng yêu cầu least privilege của `AGENTS.md`:

- **Quyết định: Tách 2 role trên production/staging Postgres:**
  1. **Role Migration (`postgres`):** Dùng cho `MIGRATION_DATABASE_URL` khi chạy `alembic upgrade head` (tạo/sửa bảng, index, constraint, sở hữu bảng trong `public`).
  2. **Role Runtime (`g_ai_runtime`):** Dùng cho `DATABASE_URL` của FastAPI khi phục vụ traffic người dùng.
     - Không phải superuser, không `CREATEDB`, không `CREATEROLE`, không sở hữu bảng (không chạy được DDL `ALTER/DROP/TRUNCATE`).
     - Chỉ được cấp `USAGE ON SCHEMA public`, `SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public` (và `ALTER DEFAULT PRIVILEGES ... GRANT SELECT, INSERT, UPDATE, DELETE` cho các bảng mới do `postgres` tạo), `USAGE, SELECT ON ALL SEQUENCES`.
     - **Thu hồi quyền trên `alembic_version`** khỏi `g_ai_runtime` (`REVOKE ALL ON TABLE public.alembic_version FROM g_ai_runtime`).
- **Ảnh hưởng tới RLS:** Vì `g_ai_runtime` **không phải** table owner và các bảng đều bật `ENABLE ROW LEVEL SECURITY` với 0 policy, `g_ai_runtime` sẽ bị RLS chặn sạch dữ liệu **trừ khi** được cấp thuộc tính `BYPASSRLS` (`ALTER ROLE g_ai_runtime BYPASSRLS;`). Vì mọi kiểm soát quyền sở hữu (`user_id`) đều do FastAPI thực thi ở tầng ứng dụng (ADR-0001), cấp `BYPASSRLS` cho riêng `g_ai_runtime` (kết hợp thu hồi hoàn toàn quyền của `anon`/`authenticated`) là đúng mô hình.
- **Khả thi vận hành trên Render + Supavisor:** Container Docker hiện chạy `alembic upgrade head` trước `uvicorn` ([deploy-render.md](../deploy-render.md)); chỉ cần `alembic/env.py` ưu tiên `MIGRATION_DATABASE_URL` (fallback `DATABASE_URL`) là chạy được trong cùng một container mà không cần tách service.
- **Điểm cần kiểm chứng thực tế trên Supabase trước khi ép buộc ở production:** Kiểm tra tài khoản `postgres` trên project Supabase cụ thể có tạo được `g_ai_runtime` kèm `BYPASSRLS` và đăng nhập qua Supavisor (`g_ai_runtime.<project-ref>`) hay không (nếu Supavisor free tier chỉ cho phép kết nối pooler qua `postgres.<project-ref>`, ghi nhận tạm dùng `postgres` và lưu ý ở mục Câu hỏi mở).

### 7. Supabase Storage (Private Buckets, Path, Signed URL & Metadata-Only DB)

1. **Private Buckets (`public = false`):**
   - `progress-photos`: ảnh vóc dáng 3 góc (Sprint 2).
   - `predictions`: ảnh đầu vào & kết quả Digital Twin theo ADR-0002 (Sprint 3 hoặc khi chuyển pipeline từ Next.js về Backend).
2. **Quy ước đường dẫn theo user (không chứa PII như email/tên):**
   - `progress-photos`: `users/{user_id}/{photo_uuid}.{ext}` (khuyến nghị `webp` hoặc `jpeg` đã strip EXIF GPS tại backend trước khi upload).
   - `predictions`: `users/{user_id}/jobs/{job_uuid}/{artifact}.{ext}` (ví dụ `day_0_input.jpg`, `day_14.png`, `day_28.png`).
3. **Database chỉ lưu metadata & đường dẫn:** Lưu `storage_bucket`, `storage_path`, `mime_type`, `byte_size`, `sha256` (nếu cần deduplicate/verify). **Không bao giờ lưu signed URL hay public URL trong database.**
4. **Cấp Signed URL ngắn hạn qua FastAPI:**
   - Khi client yêu cầu xem ảnh, FastAPI xác thực `current_user.id == row.user_id`, rồi dùng `SUPABASE_SECRET_KEY` gọi `create_signed_url(path, expires_in=300)` (5 phút) và trả về kèm header `Cache-Control: private, no-store`.
   - Upload ảnh tiến độ đi qua FastAPI để kiểm tra magic bytes, giới hạn dung lượng, và xoá toàn bộ EXIF metadata trước khi đẩy lên Supabase Storage.

---

## Hệ quả

- Schema `public` trên Supabase an toàn trước truy cập trực tiếp bằng `anon`/publishable key ngay cả khi Data API vẫn đang bật, và đạt tiêu chuẩn Security Advisor (`rowsecurity = true`).
- `apps/backend` không kéo thêm dependency Supabase Auth hay trộn mô hình user UUID của GoTrue với `users.id` dạng integer hiện tại.
- Cần chạy bộ test trên `TEST_DATABASE_URL` (Postgres thật) để kiểm chứng migration bật RLS, quyền role và các kiểu Postgres (`JSONB`, `TIMESTAMPTZ`, partial unique index) thay vì chỉ tin cậy SQLite.
