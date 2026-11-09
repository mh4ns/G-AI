#!/usr/bin/env python3
"""
Test script for G-AI 28-day prediction image generation pipeline.
Usage:
    python scripts/test_generate.py <image_path> [base_url]

Example:
    python scripts/test_generate.py public/twins/male-day-0.png
"""

import sys
import os
import time
import base64
import json
import urllib.request
import urllib.error

def main():
    if len(sys.argv) < 2:
        print("Usage: python scripts/test_generate.py <image_path> [base_url]")
        print("Example: python scripts/test_generate.py apps/web/public/twins/male-day-0.png")
        sys.exit(1)

    image_path = sys.argv[1]
    base_url = sys.argv[2] if len(sys.argv) > 2 else "http://localhost:3000"

    if not os.path.exists(image_path):
        print(f"[-] Error: Image path '{image_path}' not found.")
        sys.exit(1)

    # Determine MIME type
    ext = os.path.splitext(image_path)[1].lower()
    mime_map = {
        ".jpg": "image/jpeg",
        ".jpeg": "image/jpeg",
        ".png": "image/png",
        ".webp": "image/webp",
    }
    mime_type = mime_map.get(ext, "image/jpeg")

    print(f"[+] Loading image: {image_path} ({mime_type})")
    with open(image_path, "rb") as f:
        file_bytes = f.read()

    b64_str = base64.b64encode(file_bytes).decode("utf-8")
    data_url = f"data:{mime_type};base64,{b64_str}"

    payload = {
        "userPhotoBase64": data_url,
        "archetype": "male_strength",
        "height": 175,
        "weight": 76,
        "targetWeight": 73.5,
        "planSummary": "18 set Calisthenics / tuần · Thâm hụt 350 kcal",
        "consentAccepted": True
    }

    generate_endpoint = f"{base_url.rstrip('/')}/api/prediction/generate"
    print(f"[+] Sending generation request to: {generate_endpoint}")

    req_data = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(
        generate_endpoint,
        data=req_data,
        headers={"Content-Type": "application/json"}
    )

    t0 = time.time()
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            resp_body = json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        err_msg = e.read().decode("utf-8")
        print(f"[-] HTTP Error {e.code}: {err_msg}")
        sys.exit(1)
    except Exception as e:
        print(f"[-] Network Error: {e}")
        sys.exit(1)

    if not resp_body.get("success"):
        print(f"[-] API returned error: {resp_body.get('error')}")
        sys.exit(1)

    job_id = resp_body.get("jobId")
    cached = resp_body.get("cached", False)
    warning = resp_body.get("genderMismatchWarning")
    if warning:
        print(f"[!] Warning: {warning}")

    if cached:
        elapsed = time.time() - t0
        print(f"[+] Result served from DISK CACHE in {elapsed:.2f}s!")
        milestones = resp_body.get("completedMilestones", {})
        print("\n--- KẾT QUẢ ẢNH DỰ ĐOÁN 28 NGÀY ---")
        for day in [7, 14, 28]:
            print(f"  Day {day:2d} (Tuần {day//7}): {milestones.get(str(day)) or milestones.get(day)}")
        sys.exit(0)

    print(f"[+] Job enqueued successfully. Job ID: {job_id}")
    print("[+] Polling job progress every 1.5s...")

    poll_endpoint = f"{base_url.rstrip('/')}/api/prediction/{job_id}"

    while True:
        time.sleep(1.5)
        try:
            with urllib.request.urlopen(poll_endpoint, timeout=10) as poll_resp:
                poll_data = json.loads(poll_resp.read().decode("utf-8"))
        except Exception as e:
            print(f"[!] Polling warning: {e}")
            continue

        status = poll_data.get("status")
        progress = poll_data.get("progress", {})
        curr = progress.get("current", 0)
        total = progress.get("total", 3)
        msg = progress.get("stageMessage", "")
        print(f"  -> [{status.upper()}] ({curr}/{total} ảnh) {msg}")

        if status == "done":
            elapsed = time.time() - t0
            milestones = poll_data.get("completedMilestones", {})
            print(f"\n[+] HOÀN THÀNH trong {elapsed:.2f} giây!")
            print("\n--- LINK 3 ẢNH KẾT QUẢ DỰ ĐOÁN ---")
            for day in [7, 14, 28]:
                url = milestones.get(str(day)) or milestones.get(day)
                print(f"  - Mốc Ngày {day:2d} (Tuần {day//7}): {url}")
            break
        elif status == "failed":
            err = poll_data.get("error", {})
            print(f"\n[-] Tác vụ thất bại: {err.get('message', 'Không rõ nguyên nhân')}")
            sys.exit(1)

if __name__ == "__main__":
    main()
