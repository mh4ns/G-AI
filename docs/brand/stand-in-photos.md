# Ảnh tạm (stand-in) cần thay

G-AI chưa có ảnh chụp riêng. Các ảnh dưới đây là ảnh Unsplash dùng tạm, tải trực tiếp từ `images.unsplash.com`.
Mỗi dòng ghi rõ nơi ảnh xuất hiện để thay bằng ảnh thật của thương hiệu. Danh sách sinh từ mã nguồn; khi thêm ảnh tạm mới, cập nhật file này.

Quy tắc đang áp dụng:

- Thẻ sản phẩm **không** dùng ảnh tạm: chúng hiện màu thật của sản phẩm (`color_hex`) cho tới khi có ảnh chụp sản phẩm.
- Ảnh tạm chỉ minh họa người tập, không gắn tên hay logo của thương hiệu khác.
- Hero và khối "Tập đúng form tại nhà" trên site dùng ảnh chụp màn hình thật của app, không phải ảnh tạm (xem mục bên dưới).

## Ảnh chụp màn hình app (cần chụp lại khi giao diện đổi)

| File | Nội dung | Cách chụp |
|---|---|---|
| `apps/site/public/images/plan-female.webp` | Trang kết quả kế hoạch, chương trình Pilates | Quiz trên `apps/web`, khổ 390×844 @2x: chọn "Pilates & cơ lõi", 165 cm, 62 kg → 57 kg, bỏ qua ảnh; chụp đầu trang kết quả sau khi pháo giấy tắt |
| `apps/site/public/images/plan-male.webp` | Như trên, chương trình Sức mạnh | Như trên với "Sức mạnh & tăng cơ", 175 cm, 75 kg → 72 kg |
| `apps/site/public/images/live-studio.webp` | Phòng tập với camera, camera tắt | Today → "Bắt đầu tập", khổ 1280×800 @2x |

Ảnh kết quả có **ngày dự kiến cụ thể** (tính từ ngày chụp), nên cần chụp lại định kỳ để ngày không bị cũ.

## Ảnh đang hiển thị

| Nơi xuất hiện | File:dòng | Ảnh (Unsplash) |
|---|---|---|
| Gallery trang chủ site | `apps/site/src/components/home/DualAthleteGallery.tsx:10` | [photo-1518611012118-696072aa579a](https://images.unsplash.com/photo-1518611012118-696072aa579a) |
| Gallery trang chủ site | `apps/site/src/components/home/DualAthleteGallery.tsx:15` | [photo-1534438327276-14e5300c3a48](https://images.unsplash.com/photo-1534438327276-14e5300c3a48) |
| Gallery trang chủ site | `apps/site/src/components/home/DualAthleteGallery.tsx:20` | [photo-1540497077202-7c8a3999166f](https://images.unsplash.com/photo-1540497077202-7c8a3999166f) |
| Gallery trang chủ site | `apps/site/src/components/home/DualAthleteGallery.tsx:25` | [photo-1574680096145-d05b474e2155](https://images.unsplash.com/photo-1574680096145-d05b474e2155) |
| Quiz bước 2: thẻ nhóm tuổi | `apps/web/src/components/quiz/AgeGoalStep.tsx:39` | [photo-1518611012118-696072aa579a](https://images.unsplash.com/photo-1518611012118-696072aa579a) |
| Quiz bước 2: thẻ nhóm tuổi | `apps/web/src/components/quiz/AgeGoalStep.tsx:46` | [photo-1545205597-3d9d02c29597](https://images.unsplash.com/photo-1545205597-3d9d02c29597) |
| Quiz bước 2: thẻ nhóm tuổi | `apps/web/src/components/quiz/AgeGoalStep.tsx:53` | [photo-1506126613408-eca07ce68773](https://images.unsplash.com/photo-1506126613408-eca07ce68773) |
| Quiz bước 2: thẻ nhóm tuổi | `apps/web/src/components/quiz/AgeGoalStep.tsx:60` | [photo-1571019613454-1cb2f99b2d8b](https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b) |
| Quiz bước 2: thẻ nhóm tuổi | `apps/web/src/components/quiz/AgeGoalStep.tsx:70` | [photo-1534438327276-14e5300c3a48](https://images.unsplash.com/photo-1534438327276-14e5300c3a48) |
| Quiz bước 2: thẻ nhóm tuổi | `apps/web/src/components/quiz/AgeGoalStep.tsx:77` | [photo-1583454110551-21f2fa2afe61](https://images.unsplash.com/photo-1583454110551-21f2fa2afe61) |
| Quiz bước 2: thẻ nhóm tuổi | `apps/web/src/components/quiz/AgeGoalStep.tsx:84` | [photo-1581009146145-b5ef050c2e1e](https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e) |
| Quiz bước 2: thẻ nhóm tuổi | `apps/web/src/components/quiz/AgeGoalStep.tsx:91` | [photo-1517838277536-f5f99be501cd](https://images.unsplash.com/photo-1517838277536-f5f99be501cd) |
| Quiz bước 1: thẻ chọn chương trình | `apps/web/src/components/quiz/ArchetypeSelectionStep.tsx:29` | [photo-1518611012118-696072aa579a](https://images.unsplash.com/photo-1518611012118-696072aa579a) |
| Quiz bước 1: thẻ chọn chương trình | `apps/web/src/components/quiz/ArchetypeSelectionStep.tsx:38` | [photo-1534438327276-14e5300c3a48](https://images.unsplash.com/photo-1534438327276-14e5300c3a48) |

## Ảnh sản phẩm trong catalog (không hiển thị)

`apps/backend/app/data/store_catalog.json` và `apps/site/src/data/mockStoreData.ts` vẫn giữ URL ảnh cũ ở `image_front` / `image_hover`. Site hiện không render các ảnh này; thay bằng ảnh chụp sản phẩm thật trước khi bật lại ảnh trên thẻ.

| Sản phẩm | Trường | Ảnh (Unsplash) |
|---|---|---|
| p1 · Áo len dệt kim dáng lửng | `image_front` | photo-1515886657613-9f3515b0c78f |
| p1 · Áo len dệt kim dáng lửng | `image_hover` | photo-1529139574466-a303027c1d8b |
| p2 · Bộ liền thân Pilates dài | `image_front` | photo-1518611012118-696072aa579a |
| p2 · Bộ liền thân Pilates dài | `image_hover` | photo-1506126613408-eca07ce68773 |
| p3 · Bộ dụng cụ Pilates cơ bản | `image_front` | photo-1598971861713-54ad16a7e72e |
| p3 · Bộ dụng cụ Pilates cơ bản | `image_hover` | photo-1540497077202-7c8a3999166f |
| p4 · Quần lửng cạp cao | `image_front` | photo-1506629082955-511b1aa562c8 |
| p4 · Quần lửng cạp cao | `image_hover` | photo-1571019613454-1cb2f99b2d8b |
| p5 · Máy Reformer Pilates mini | `image_front` | photo-1575052814086-f385e2e2ad1b |
| p5 · Máy Reformer Pilates mini | `image_hover` | photo-1518310383802-640c2de311b2 |
| p6 · Vòng Pilates và bóng kháng lực | `image_front` | photo-1594737625785-a6cbdabd333c |
| p6 · Vòng Pilates và bóng kháng lực | `image_hover` | photo-1518611012118-696072aa579a |
| p7 · Áo liền thân gân không đường may | `image_front` | photo-1534528741775-53994a69daeb |
| p7 · Áo liền thân gân không đường may | `image_hover` | photo-1524504388940-b1c1722653e1 |
| p8 · Tạ đeo cổ tay/cổ chân điều chỉnh (đôi) | `image_front` | photo-1583454110551-21f2fa2afe61 |
| p8 · Tạ đeo cổ tay/cổ chân điều chỉnh (đôi) | `image_hover` | photo-1574680096145-d05b474e2155 |

## Ảnh khác chưa rõ nguồn

- `apps/web/public/twins/*.png` (10 ảnh, ảnh mẫu "Ảnh mẫu · chưa phải ảnh thật" ở Prediction): repo không ghi nguồn. Cần xác nhận quyền sử dụng hoặc thay.
- `apps/web/public/images/quiz/`: kiểm tra nguồn cùng lúc.
