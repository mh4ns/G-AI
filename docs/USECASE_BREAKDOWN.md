# KẾ HOẠCH BẺ NHỎ & PHÂN TÁCH CHI TIẾT TỪNG USE CASE ĐỂ TRIỂN KHAI (ENGINEERING BUILD ROADMAP)
> **Dự án**: BetterMe Next-Gen (G-AI)  
> **Mục tiêu**: Phân tách từng Use Case thành các đầu việc kỹ thuật cụ thể (Tasks), cấu trúc file/module, logic nghiệp vụ, và tiêu chí nghiệm thu (Acceptance Criteria) để lập trình viên có thể bắt tay vào code ngay lập tức.

---

## MỤC LỤC & LỘ TRÌNH TRIỂN KHAI (SPRINT OVERVIEW)

- [GIAI ĐOẠN 0: Khởi tạo Kiến trúc Nền tảng (Sprint 0 - Foundations)](#giai-đoạn-0-khởi-tạo-kiến-trúc-nền-tảng-sprint-0)
- [SPRINT 1: Khảo sát Thể trạng, Tạo Lộ trình & Màn hình Trung tâm (MVP Core)](#sprint-1-khảo-sát-thể-trạng-tạo-lộ-trình--màn-hình-trung-tâm)
  - [UC-1.1: Khảo sát thể trạng đa chiều (Assessment Quiz)](#uc-11-khảo-sát-thể-trạng-đa-chiều-assessment-quiz)
  - [UC-1.2: Khởi tạo lộ trình cá nhân hóa (Personal Program Generator)](#uc-12-khởi-tạo-lộ-trình-cá-nhân-hóa-personal-program-generator)
  - [UC-6.1: Bảng điều khiển Ngày trung tâm (Today Dashboard Hub)](#uc-61-bảng-điều-khiển-ngày-trung-tâm-today-dashboard-hub)
- [SPRINT 2: Huấn luyện Thể chất Cơ bản & Đa phương tiện](#sprint-2-huấn-luyện-thể-chất-cơ-bản--đa-phương-tiện)
  - [UC-2.1: Luyện tập Video có Hướng dẫn viên ảo (Video Player)](#uc-21-luyện-tập-video-có-hướng-dẫn-viên-ảo-video-player)
  - [UC-2.2: Tải bài tập ngoại tuyến (Offline Videos Downloader)](#uc-22-tải-bài-tập-ngoại-tuyến-offline-videos-downloader)
  - [UC-2.3: Theo dõi bài tập cự ly ngoài trời (GPS Distance Workout)](#uc-23-theo-dõi-bài-tập-cự-ly-ngoài-trời-gps-distance-workout)
- [SPRINT 3: Dinh dưỡng Thông minh & Vòng lặp Thói quen](#sprint-3-dinh-dưỡng-thông-minh--vòng-lặp-thói-quen)
  - [UC-3.1: Quét mã vạch thực phẩm (ML Kit Barcode Scanner)](#uc-31-quét-mã-vạch-thực-phẩm-ml-kit-barcode-scanner)
  - [UC-3.2: Ghi nhận bữa ăn & Cân bằng Năng lượng (Calorie In/Out Tracker)](#uc-32-ghi-nhận-bữa-ăn--cân-bằng-năng-lượng-calorie-inout-tracker)
  - [UC-3.3: Quản lý chu kỳ Nhịn ăn Gián đoạn (Intermittent Fasting 16:8)](#uc-33-quản-lý-chu-kỳ-nhịn-ăn-gián-đoạn-intermittent-fasting-168)
  - [UC-6.2: Theo dõi & Nhắc nhở Uống nước (Hydration Tracker)](#uc-62-theo-dõi--nhắc-nhở-uống-nước-hydration-tracker)
- [SPRINT 4: Tích hợp Thiết bị IoT & Sinh trắc học BIA Native](#sprint-4-tích-hợp-thiết-bị-iot--sinh-trắc-học-bia-native)
  - [UC-4.1: Ghép nối & Giải mã Cân thông minh qua Bluetooth LE](#uc-41-ghép-nối--giải-mã-cân-thông-minh-qua-bluetooth-le)
  - [UC-4.2: Động cơ C++ Phân tích 9 Chỉ số BIA (Body Composition)](#uc-42-động-cơ-c-phân-tích-9-chỉ-số-bia-body-composition)
  - [UC-4.3: Đồng bộ Vòng đeo tay Smart Band & Rung Haptic](#uc-43-đồng-bộ-vòng-đeo-tay-smart-band--rung-haptic)
- [SPRINT 5: Sức khỏe Tinh thần & ĐỘT PHÁ AI COMPANION THỜI GIAN THỰC](#sprint-5-sức-khỏe-tinh-thần--đột-phá-ai-companion-thời-gian-thực)
  - [UC-5.1: Bài tập Thở Điều hòa Nhịp tim & Giảm Cortisol](#uc-51-bài-tập-thở-điều-hòa-nhịp-tim--giảm-cortisol)
  - [UC-5.2: Nhật ký Cảm xúc & Trị liệu Nhận thức Hành vi (CBT AI Journal)](#uc-52-nhật-ký-cảm-xúc--trị-liệu-nhận-thức-hành-vi-cbt-ai-journal)
  - [UC-2.4: Trợ lý AI Đồng hành Thời gian thực (AI Live PT - Killer Feature)](#uc-24-trợ-lý-ai-đồng-hành-thời-gian-thực-ai-live-pt---killer-feature)
- [SPRINT 6: Hoàn thiện, Gamification & Mô hình Kinh doanh](#sprint-6-hoàn-thiện-gamification--mô-hình-kinh-doanh)
  - [UC-6.3: Thử thách Nhóm & Giữ chuỗi Thành tích (Streaks)](#uc-63-thử-thách-nhóm--giữ-chuỗi-thành-tích-streaks)
  - [UC-7.1: Mua gói Thuê bao & Thanh toán In-App (Google Play Billing)](#uc-71-mua-gói-thuê-bao--thanh-toán-in-app-google-play-billing)

---

# GIAI ĐOẠN 0: Khởi tạo Kiến trúc Nền tảng (Sprint 0)

Trước khi viết bất kỳ màn hình nào, phải dựng khung xương kỹ thuật theo Clean Architecture & Redux MVI:

### Task 0.1: Khởi tạo Dự án & Cấu trúc Mô-đun (Module Structure)
* **Mục tiêu**: Thiết lập cấu trúc package rõ ràng, tách biệt giữa data, domain, presentation và native.
* **Các thư mục cần tạo**:
  ```text
  core/
  ├── designsystem/       # Theme, Typography, Colors, Shared Components
  ├── redux/              # Store, Action, Reducer, Middleware interfaces
  ├── database/           # Room Database, DAOs, Entities
  └── network/            # HTTP Client, Retrofit, Interceptors
  features/
  ├── onboarding/         # UC-1.1, UC-1.2
  ├── today/              # UC-6.1
  ├── workout/            # UC-2.1, UC-2.2, UC-2.3, UC-2.4
  ├── nutrition/          # UC-3.1, UC-3.2, UC-3.3
  ├── scale/              # UC-4.1, UC-4.2
  ├── mental/             # UC-5.1, UC-5.2
  └── billing/            # UC-7.1
  ```
* **Acceptance Criteria**: Dự án build thành công, cấu hình được Dependency Injection (Hilt/Koin) và Navigation Compose.

### Task 0.2: Khởi tạo CSDL Cục bộ (Room Database Setup)
* **File**: `core/database/AppDatabase.kt`
* **Nội dung**: Khởi tạo Database phiên bản 1 chứa các thực thể: `UserProfileEntity`, `PersonalProgramEntity`, `DailyHabitSummaryEntity`, `WorkoutSessionEntity`, `BodyCompositionEntity`, `MealEntity`.

---

# SPRINT 1: Khảo sát Thể trạng, Tạo Lộ trình & Màn hình Trung tâm

---

## UC-1.1: Khảo sát thể trạng đa chiều (Assessment Quiz)

### 1. Mục tiêu Kỹ thuật
Xây dựng chuỗi màn hình khảo sát mượt mà (Wizard Form) thu thập toàn bộ dữ liệu sinh trắc học và lối sống của người dùng.

### 2. Các thành phần cần build
* **Data Model**:
  ```kotlin
  data class UserProfileDraft(
      val gender: Gender,
      val age: Int,
      val heightCm: Float,
      val currentWeightKg: Float,
      val targetWeightKg: Float,
      val focusAreas: List<BodyArea>,
      val fitnessLevel: FitnessLevel,
      val dietPreference: DietType,
      val injuries: List<InjuryType>
  )
  ```
* **State & Actions**:
  - `QuizAction.SelectGender(gender)`
  - `QuizAction.SetBodyMetrics(age, height, weight, targetWeight)`
  - `QuizAction.ToggleFocusArea(area)`
  - `QuizAction.SubmitQuiz`
* **UI**:
  - `QuizScreen`: Sử dụng `AnimatedContent` hoặc `HorizontalPager` chuyển slide câu hỏi.
  - Các custom component: Thước đo cuộn chọn chiều cao/cân nặng (`RulerPicker`), Body Area Selector (chọn cơ bụng, đùi, lưng).

### 3. Acceptance Criteria
- [ ] Cho phép người dùng chọn đơn vị Metric (kg, cm) hoặc Imperial (lbs, ft).
- [ ] Xác thực dữ liệu hợp lệ (Tuổi từ 12–100, cân nặng > 30kg, mục tiêu cân nặng khả thi).
- [ ] Dữ liệu lưu tạm vào Redux State và không bị mất khi xoay màn hình.

---

## UC-1.2: Khởi tạo lộ trình cá nhân hóa (Personal Program Generator)

### 1. Mục tiêu Kỹ thuật
Xây dựng động cơ tính toán công thức chuyển hóa năng lượng chuẩn y khoa và lập lịch giáo án 28 ngày.

### 2. Các thành phần cần build
* **Domain Interactor**: `GeneratePersonalProgramUseCase.kt`
* **Công thức lõi (Core Formulas)**:
  1. **BMR (Mifflin-St Jeor)**:
     - Nam: $10 \times \text{weight} + 6.25 \times \text{height} - 5 \times \text{age} + 5$
     - Nữ: $10 \times \text{weight} + 6.25 \times \text{height} - 5 \times \text{age} - 161$
  2. **TDEE**: $BMR \times \text{ActivityMultiplier}$ (1.2 đến 1.9)
  3. **Daily Target Calories**:
     - Giảm cân: $\text{TDEE} - 400\text{ kcal}$ (Không thấp hơn 1200 kcal nữ, 1500 kcal nam).
     - Tăng cơ: $\text{TDEE} + 300\text{ kcal}$.
* **Lập lịch 28 ngày**:
  - Phân bổ 4 buổi tập/tuần, 3 ngày nghỉ phục hồi (Rest / Active Recovery).
  - Chọn bài tập tương ứng với `focusAreas` và né các vùng có `injuries`.

### 3. Acceptance Criteria
- [ ] Trả về kết quả sau $\le 1.5$ giây, hiển thị màn hình phân tích tiến độ giả lập ("Analyzing your metabolic profile...").
- [ ] Lưu đối tượng `PersonalProgram` vào Room Database.
- [ ] Chuyển hướng người dùng vào màn hình chính `TodayScreen`.

---

## UC-6.1: Bảng điều khiển Ngày trung tâm (Today Dashboard Hub)

### 1. Mục tiêu Kỹ thuật
Xây dựng màn hình Dashboard tổng hợp trực quan, là trung tâm điều phối mọi hoạt động trong ngày của người dùng.

### 2. Các thành phần cần build
* **UI Screen**: `TodayScreen.kt`
* **Widgets chính**:
  1. **Calorie Balance Ring**: Vòng tròn trung tâm hiển thị (Target, Intake, Burned, Remaining).
  2. **Today's Workout Card**: Hiển thị bài tập hôm nay (Tên, Thời lượng, Mức độ calo, Nút "Bắt đầu").
  3. **Hydration Quick Widget**: Nút bấm nhanh `+250ml` nước kèm thanh phần trăm.
  4. **Fasting Mini Widget**: Trạng thái nhịn ăn hiện tại (Đang nhịn hay đang trong giờ ăn).
  5. **Daily Checklist**: Tích xanh khi xong từng mục tiêu.

### 3. Acceptance Criteria
- [ ] Tự động refresh dữ liệu mỗi khi quay lại màn hình (OnResume / Lifecycle Event).
- [ ] Hiển thị chính xác tiến độ ngày dựa trên dữ liệu từ Redux Store.

---

# SPRINT 2: Huấn luyện Thể chất Cơ bản & Đa phương tiện

---

## UC-2.1: Luyện tập Video có Hướng dẫn viên ảo (Video Player)

### 1. Mục tiêu Kỹ thuật
Tích hợp trình phát video `androidx.media3.exoplayer` có khả năng đếm ngược hiệp tập, quản lý thời gian nghỉ và phát âm thanh đếm nhịp.

### 2. Các thành phần cần build
* **Module**: `features/workout/player`
* **Data Model**:
  ```kotlin
  data class Exercise(
      val id: String,
      val name: String,
      val videoUrl: String,
      val durationSeconds: Int,
      val targetMuscle: String,
      val voiceCueUrl: String?
  )
  ```
* **Player Controller**:
  - Quản lý Playlist gồm danh sách bài tập + các phân đoạn nghỉ 30 giây ("Rest").
  - Xử lý các sự kiện `Play`, `Pause`, `Skip`, `Previous`.
  - Hiển thị bộ đếm đè lên video (Countdown Timer).

### 3. Acceptance Criteria
- [ ] Video phát mượt mà không giật khung hình, tự động chuyển bài khi hết hiệp.
- [ ] Khi hết bài tập, ghi nhận tổng calo đốt cháy vào `WorkoutSessionEntity`.

---

## UC-2.2: Tải bài tập ngoại tuyến (Offline Videos Downloader)

### 1. Mục tiêu Kỹ thuật
Tải và lưu trữ video bài tập an toàn vào bộ nhớ nội bộ, kiểm tra tính toàn vẹn và cho phép xem khi ngắt Internet.

### 2. Các thành phần cần build
* **Service**: `VideosDownloaderService.kt` (Foreground Service kèm Notification tiến trình %)
* **Quản lý Cache**:
  - Lưu vào `context.filesDir/workouts/<exercise_id>.mp4`.
  - Mã hóa hoặc kiểm tra checksum SHA-256 để chống lỗi tải dở dang.

### 3. Acceptance Criteria
- [ ] Cho phép tải nền khi tắt màn hình.
- [ ] Player ưu tiên phát từ file cục bộ nếu tồn tại, fallback sang streaming nếu chưa tải.

---

## UC-2.3: Theo dõi bài tập cự ly ngoài trời (GPS Distance Workout)

### 1. Mục tiêu Kỹ thuật
Theo dõi buổi chạy bộ/đi bộ ngoài trời bằng định vị GPS và cảm biến đếm bước chân.

### 2. Các thành phần cần build
* **Service**: `DistanceWorkoutService.kt`
* **Logic tính toán**:
  - Lắng nghe `FusedLocationProviderClient` với chu kỳ 3 giây hoặc di chuyển tối thiểu 5 mét.
  - Sử dụng công thức Haversine tính cự ly giữa các tọa độ GPS liên tiếp.
  - Tính tốc độ trung bình và Pace (số phút/km).
  - Tích hợp `Sensor.TYPE_STEP_COUNTER` đếm số bước chân.

### 3. Acceptance Criteria
- [ ] Foreground Notification hiển thị liên tục số km và Pace theo thời gian thực.
- [ ] Vẽ được polyline lộ trình chạy lên Google Map khi kết thúc bài tập.

---

# SPRINT 3: Dinh dưỡng Thông minh & Vòng lặp Thói quen

---

## UC-3.1: Quét mã vạch thực phẩm (ML Kit Barcode Scanner)

### 1. Mục tiêu Kỹ thuật
Sử dụng CameraX kết hợp Google ML Kit Barcode (`libbarhopper_v3.so`) để quét mã vạch bao bì thực phẩm trong thời gian dưới 100ms.

### 2. Các thành phần cần build
* **Module**: `features/nutrition/scanner`
* **CameraX Analyzer**:
  ```kotlin
  class BarcodeAnalyzer(private val onBarcodeDetected: (String) -> Unit) : ImageAnalysis.Analyzer {
      // Gọi ML Kit BarcodeScanner.process(image)
  }
  ```
* **API Tra cứu Thực phẩm**:
  - Nhận mã vạch (EAN-13, UPC) $\rightarrow$ Gửi lên cơ sở dữ liệu thực phẩm (OpenFoodFacts hoặc BetterMe API) $\rightarrow$ Trả về Calo, Protein, Carbs, Fat trên 100g.

### 3. Acceptance Criteria
- [ ] Nhận diện mã vạch trong điều kiện đủ sáng và thiếu sáng (tích hợp nút bật Flash).
- [ ] Xử lý trường hợp không tìm thấy mã vạch bằng thông báo cho phép người dùng tự nhập tay.

---

## UC-3.2: Ghi nhận bữa ăn & Cân bằng Năng lượng (Calorie In/Out Tracker)

### 1. Mục tiêu Kỹ thuật
Cho phép người dùng chọn khẩu phần, tính calo thực tế và cập nhật lại ngân sách năng lượng ngày.

### 2. Các thành phần cần build
* **Màn hình**: `FoodDetailScreen.kt` (Điều chỉnh thanh trượt gram/ml, chọn bữa Sáng / Trưa / Tối / Snack).
* **Redux Reducer**:
  - `MealLoggedAction`: Thêm `MealEntity` vào Room DB.
  - `DailyHabitSummary`: Cộng dồn `total_calories_in`.

### 3. Acceptance Criteria
- [ ] Vòng tròn calo trên Today Dashboard tự động cập nhật ngay lập tức sau khi lưu món.

---

## UC-3.3: Quản lý chu kỳ Nhịn ăn Gián đoạn (Intermittent Fasting 16:8)

### 1. Mục tiêu Kỹ thuật
Xây dựng đồng hồ đếm ngược nhịn ăn, hiển thị trực quan các giai đoạn sinh học trong cơ thể.

### 2. Các thành phần cần build
* **Màn hình**: `FastingTimerScreen.kt` (Vòng tròn đếm giờ với đồ họa chỉ báo giai đoạn: Tiêu hóa $\rightarrow$ Đốt mỡ $\rightarrow$ Autophagy).
* **Receiver**: `FastingReminderReceiver.kt` (Báo thức bằng `AlarmManager` khi còn 30 phút hết giờ nhịn hoặc khi bắt đầu nhịn).

### 3. Acceptance Criteria
- [ ] Thời gian đếm giờ chuẩn xác dù ứng dụng bị tắt hoặc khởi động lại máy (`BOOT_COMPLETED`).

---

## UC-6.2: Theo dõi & Nhắc nhở Uống nước (Hydration Tracker)

### 1. Mục tiêu Kỹ thuật
Tạo luồng ghi nhận nước uống nhanh trong 1 chạm và hệ thống nhắc nhở thông minh tránh làm phiền ban đêm.

### 2. Các thành phần cần build
* **Database**: `WaterLogEntity` (timestamp, amount_ml).
* **Receiver**: `WaterReminderReceiver.kt` (Nhắc nhở mỗi 2 tiếng từ 7:00 sáng đến 22:00 tối).

### 3. Acceptance Criteria
- [ ] Bấm nút `+250ml` trên widget màn hình chính sẽ sinh hiệu ứng mực nước dâng lên và lưu DB trong $<50\text{ms}$.

---

# SPRINT 4: Tích hợp Thiết bị IoT & Sinh trắc học BIA Native

---

## UC-4.1: Ghép nối & Giải mã Cân thông minh qua Bluetooth LE

### 1. Mục tiêu Kỹ thuật
Giao tiếp tầng thấp với cân thông minh qua Bluetooth Low Energy và giải mã khung dữ liệu bảo mật AES.

### 2. Các thành phần cần build
* **BLE Scanner & GATT Manager**:
  - Quét thiết bị với UUID của BetterMe Smart Scale.
  - Kết nối GATT Server, lắng nghe Characteristic Notify.
* **JNI Bridge C++**:
  - Nạp thư viện `libRtkAesJni.so`.
  - Khai báo hàm Native:
    ```c
    JNIEXPORT jbyteArray JNICALL
    Java_com_gen_betterme_ble_AesDecryptor_decryptPayload(JNIEnv *env, jobject thiz, jbyteArray encryptedData, jbyteArray key);
    ```

### 3. Acceptance Criteria
- [ ] Tự động kết nối lại khi người dùng bật Bluetooth và bước lên cân.
- [ ] Giải mã thành công gói tin trả về số cân nặng thô và điện trở sinh học.

---

## UC-4.2: Động cơ C++ Phân tích 9 Chỉ số BIA (Body Composition)

### 1. Mục tiêu Kỹ thuật
Tích hợp động cơ thuật toán C++ `libbhBodyComposition.so` để tính toán 9 chỉ số cơ thể chuyên sâu từ điện trở sinh học.

### 2. Các thành phần cần build
* **JNI Wrapper**:
  ```c
  JNIEXPORT jobject JNICALL
  Java_com_gen_betterme_datascales_BiaEngine_calculateMetrics(
      JNIEnv *env, jobject thiz,
      jfloat weight, jfloat resistance, jfloat reactance,
      jfloat heightCm, jint age, jint gender
  );
  ```
* **Kết quả trả về**:
  - `% Mỡ cơ thể`, `Khối lượng cơ bắp (kg)`, `% Nước`, `Mỡ nội tạng (Level 1-20)`, `Khối lượng xương`, `BMR (kcal)`, `Tuổi sinh học`.
* **UI**: `BodyCompositionRadarChart.kt` (Vẽ đồ thị mạng nhện so sánh các chỉ số với ngưỡng chuẩn y khoa).

### 3. Acceptance Criteria
- [ ] Kết quả tính toán khớp với chuẩn phòng khám sai số $\le \pm 2\%$.
- [ ] Đồng bộ chỉ số cân nặng và % mỡ vào **Google Health Connect API**.

---

## UC-4.3: Đồng bộ Vòng đeo tay Smart Band & Rung Haptic

### 1. Mục tiêu Kỹ thuật
Giao tiếp hai chiều với vòng đeo tay để nhận nhịp tim và gửi xung rung cảnh báo.

### 2. Các thành phần cần build
* **Service**: `BandNotificationsService.kt`
* **Luồng giao tiếp**:
  - Lắng nghe sự kiện `HeartRateZoneAlert` từ AI Companion.
  - Gửi lệnh Bluetooth điều khiển motor rung của Band theo mẫu rung cảnh báo (2 nhịp ngắn, 1 nhịp dài).

---

# SPRINT 5: Sức khỏe Tinh thần & ĐỘT PHÁ AI COMPANION THỜI GIAN THỰC

---

## UC-5.1: Bài tập Thở Điều hòa Nhịp tim & Giảm Cortisol

### 1. Mục tiêu Kỹ thuật
Xây dựng giao diện hướng dẫn thở đa giác quan (Thị giác phồng xẹp + Xúc giác rung haptic).

### 2. Các thành phần cần build
* **Giao diện**: `BreatheScreen.kt` sử dụng Jetpack Compose `animateFloatAsState` tạo chuyển động quả cầu nở ra (Hít vào), đứng yên (Giữ hơi), thu nhỏ (Thở ra).
* **Haptic Controller**: Kích hoạt `VibrationEffect` theo nhịp thở để người dùng nhắm mắt vẫn tập được.

---

## UC-5.2: Nhật ký Cảm xúc & Trị liệu Nhận thức Hành vi (CBT AI Journal)

### 1. Mục tiêu Kỹ thuật
Cung cấp khung chat trị liệu tâm lý ngăn ngừa hiện tượng "Ăn uống do stress".

### 2. Các thành phần cần build
* **Màn hình**: `AIJournalChatScreen.kt`
* **Prompt Engineering (CBT Model)**:
  - Thiết lập System Prompt chuyên sâu về Cognitive Behavioral Therapy.
  - Khi người dùng than thở áp lực, AI nhận diện bẫy suy nghĩ (Cognitive Distortion), khuyên người dùng uống nước, làm bài tập thở và ghi lại bài học tâm lý.

---

## UC-2.4: Trợ lý AI Đồng hành Thời gian thực (AI Live PT - Killer Feature)

### 1. Mục tiêu Kỹ thuật
Đây là tính năng đột phá nhất của dự án. Hệ thống phải xử lý song song luồng Camera 30 FPS để bắt lỗi tư thế và điều khiển âm thanh thông minh (Audio Ducking) chỉ dẫn người dùng.

### 2. Các thành phần cần build

#### A. Edge Pose Estimation Engine (Tầng Thị giác)
* **Công nghệ**: MediaPipe Pose On-Device hoặc PoseNet chạy trên nhân C++ JNI (`libsurface_util_jni.so`).
* **Logic nhận diện góc khớp**:
  - *Squat*: Tính góc giữa Hông - Đầu gối - Cổ chân ($\ge 90^\circ$).
  - *Plank/Pushup*: Tính góc Cột sống (Vai - Hông - Mắt cá chân). Nếu lệch võng $> 45^\circ \rightarrow$ Báo lỗi `FORM_DEVIATION_SPINE_SAG`.

#### B. Companion Decision Arbiter (Bộ Điều Phối Quyết Định)
* **Luật Ưu Tiên (Priority Hierarchy)**:
  1. *Khẩn cấp*: Nhịp tim Zone 5 ($>90\%$ Max HR) $\rightarrow$ Lập tức dừng bài tập và cảnh báo.
  2. *Sửa tư thế*: Người dùng sai form liên tục trong 2 giây $\rightarrow$ Phát cảnh báo sửa tư thế.
  3. *Khích lệ*: 5 giây cuối của hiệp tập $\rightarrow$ Cất tiếng động viên bứt phá.
* **Cơ chế Giãn cách (Throttling)**: Khoảng cách giữa 2 câu nói thông thường tối thiểu 15 giây để không làm phiền người dùng.

#### C. Smart Audio Ducking Engine
* **Tương tác ExoPlayer**:
  ```kotlin
  fun triggerVoiceGuidance(voiceCue: AudioTrack) {
      exoPlayer.setVolume(0.2f) // Hạ nhạc nền xuống 20%
      ttsEngine.play(voiceCue) {
          exoPlayer.setVolume(1.0f) // Khôi phục 100% khi nói xong
      }
  }
  ```

### 3. Acceptance Criteria
- [ ] Độ trễ nhận diện khớp xương $\le 35\text{ms}$ (đạt tốc độ 30 FPS mượt mà không nóng máy).
- [ ] Khi gù lưng khi squat, AI lên tiếng đúng thời điểm qua tai nghe và vẽ đường khung xương màu đỏ cảnh báo.
- [ ] Báo cáo Debrief cuối buổi tổng kết chính xác Form Accuracy Score (%).

---

# SPRINT 6: Hoàn thiện, Gamification & Mô hình Kinh doanh

---

## UC-6.3: Thử thách Nhóm & Giữ chuỗi Thành tích (Streaks)

### 1. Mục tiêu Kỹ thuật
Hệ thống cộng dồn chuỗi ngày hoàn thành bài tập, trao huy hiệu và cập nhật bảng xếp hạng nhóm.

### 2. Các thành phần cần build
* **Logic**: Nếu người dùng hoàn thành bài tập và đủ calo mục tiêu trong ngày $\rightarrow$ Tăng Streak $+1$.
* **Streak Freeze**: Cho phép kích hoạt vật phẩm bảo vệ chuỗi ngày nếu có 1 ngày nghỉ ốm.

---

## UC-7.1: Mua gói Thuê bao & Thanh toán In-App (Google Play Billing)

### 1. Mục tiêu Kỹ thuật
Tích hợp Google Play Billing Library V2 xử lý mua hàng và phục hồi giao dịch (Restore Purchases).

### 2. Các thành phần cần build
* **Màn hình**: `PaywallScreen.kt` (Hiển thị gói Tháng, Quý, Năm kèm dùng thử 7 ngày).
* **BillingManager**: Kết nối Google Play Service, khởi chạy `ProxyBillingActivity`, verify purchase token qua Backend và mở khóa cờ `isPremium`.

---

# TỔNG KẾT: THỨ TỰ BẮT ĐẦU CODE NGAY HÔM NAY (QUICK START)

Để bắt tay vào code ngay mà không bị choáng ngợp, hãy thực hiện theo thứ tự 3 bước sau:

1. **Bước 1 (Foundation)**: Thiết lập cấu trúc thư mục package và khởi tạo Room Database (Task 0.1, Task 0.2).
2. **Bước 2 (User Profile & Plan Core)**: Code `UC-1.1` (Quiz Form) và `UC-1.2` (Thuật toán tính TDEE & tạo giáo án 28 ngày).
3. **Bước 3 (Dashboard & Video Player)**: Code `UC-6.1` (Today Hub) để xem thành quả trên màn hình và `UC-2.1` (ExoPlayer phát video bài tập đầu tiên).

Khi 3 bước trên đã chạy mượt mà, chúng ta sẽ lần lượt cắm các mô-đun nâng cao: **Barcode Scanner**, **Cân BLE BIA**, và đỉnh cao là **Real-time AI Companion**!
