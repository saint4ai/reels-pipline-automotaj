#!/usr/bin/env python3
# ---------------------------------------------------------------------------
#  face-caption-clearance.py
#  onAI Academy — авторы пайплайна автомонтажа рилсов
#  Автор: Alexander (@saint4ai) · https://instagram.com/saint4ai · https://onai.academy
#  Источник: https://github.com/saint4ai/reels-pipline-automotaj
#  Лицензия MIT. Сохраняйте LICENSE и NOTICE в производных работах.
#  origin=onai-rpa-2026-09  spec=three-laws/v1
# ---------------------------------------------------------------------------
"""Sparse face/head trajectory and caption-clearance QA for vertical video.

This tool never renders a composition. It seeks to sparse source-video timestamps,
detects the primary face, derives conservative head/eye regions, and evaluates the
approved ONai caption lanes. Haar cascades are the zero-model default. An optional
OpenCV YuNet ONNX model can be supplied for DNN-backed detections.
"""

from __future__ import annotations

import argparse
import csv
import importlib.util
import json
import math
import platform
import sys
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Iterable

try:
    import cv2
    import numpy as np
except ImportError as exc:  # pragma: no cover - exercised on dependency-free hosts
    raise SystemExit(
        "OpenCV/NumPy are required. Install with: "
        "python3 -m pip install -r scripts/requirements-face-qa.txt"
    ) from exc


@dataclass(frozen=True)
class Rect:
    x: float
    y: float
    width: float
    height: float

    @property
    def right(self) -> float:
        return self.x + self.width

    @property
    def bottom(self) -> float:
        return self.y + self.height

    @property
    def center_x(self) -> float:
        return self.x + self.width / 2

    @property
    def center_y(self) -> float:
        return self.y + self.height / 2

    def rounded(self) -> dict[str, int]:
        return {
            "x": round(self.x),
            "y": round(self.y),
            "width": round(self.width),
            "height": round(self.height),
            "right": round(self.right),
            "bottom": round(self.bottom),
            "centerX": round(self.center_x),
            "centerY": round(self.center_y),
        }


# Production geometry. Speaker cards keep the 744 px visual width, while all
# critical text stays inside the stricter combined Instagram/TikTok X-safe area.
EXPERT_SPEAKER_PANEL = Rect(120, 260, 744, 900)
TITLE_SPEAKER_PANEL = Rect(120, 540, 744, 620)
EXPERT_CAPTION = Rect(120, 1192, 720, 112)  # centerY=1248
SPLIT_SPEAKER_PANEL = Rect(0, 960, 1080, 960)
SPLIT_CAPTION = Rect(120, 816, 720, 112)  # centerY=872, hard 32 px before speaker
PODCAST_CAPTION = Rect(120, 904, 720, 112)  # separate 50% preset, centerY=960
FULL_GRAPHICS_CAPTION = Rect(120, 480, 720, 112)


def clip_rect(rect: Rect, bounds: Rect) -> Rect | None:
    x1 = max(rect.x, bounds.x)
    y1 = max(rect.y, bounds.y)
    x2 = min(rect.right, bounds.right)
    y2 = min(rect.bottom, bounds.bottom)
    if x2 <= x1 or y2 <= y1:
        return None
    return Rect(x1, y1, x2 - x1, y2 - y1)


def intersection_area(a: Rect | None, b: Rect | None) -> float:
    if a is None or b is None:
        return 0.0
    x1, y1 = max(a.x, b.x), max(a.y, b.y)
    x2, y2 = min(a.right, b.right), min(a.bottom, b.bottom)
    return max(0.0, x2 - x1) * max(0.0, y2 - y1)


def expand_face_to_head(face: Rect, frame_width: int, frame_height: int) -> Rect:
    """Conservative visible-head box derived from the detected face rectangle."""
    head = Rect(
        face.x - face.width * 0.13,
        face.y - face.height * 0.30,
        face.width * 1.26,
        face.height * 1.40,
    )
    return clip_rect(head, Rect(0, 0, frame_width, frame_height)) or face


def estimated_eye_band(face: Rect) -> Rect:
    return Rect(
        face.x + face.width * 0.12,
        face.y + face.height * 0.22,
        face.width * 0.76,
        face.height * 0.32,
    )


def object_fit_cover_rect(
    source_rect: Rect,
    source_width: int,
    source_height: int,
    container: Rect,
) -> Rect | None:
    scale = max(container.width / source_width, container.height / source_height)
    rendered_width = source_width * scale
    rendered_height = source_height * scale
    offset_x = container.x + (container.width - rendered_width) / 2
    offset_y = container.y + (container.height - rendered_height) / 2
    transformed = Rect(
        offset_x + source_rect.x * scale,
        offset_y + source_rect.y * scale,
        source_rect.width * scale,
        source_rect.height * scale,
    )
    return clip_rect(transformed, container)


class SparseFaceDetector:
    def __init__(self, detection_width: int, yunet_model: Path | None = None):
        self.detection_width = detection_width
        cascade_root = Path(cv2.data.haarcascades)
        self.frontal = cv2.CascadeClassifier(
            str(cascade_root / "haarcascade_frontalface_default.xml")
        )
        self.frontal_alt = cv2.CascadeClassifier(
            str(cascade_root / "haarcascade_frontalface_alt2.xml")
        )
        self.profile = cv2.CascadeClassifier(
            str(cascade_root / "haarcascade_profileface.xml")
        )
        self.eyes = cv2.CascadeClassifier(
            str(cascade_root / "haarcascade_eye_tree_eyeglasses.xml")
        )
        self.yunet = None
        self.yunet_model = yunet_model
        if yunet_model:
            if not yunet_model.exists():
                raise FileNotFoundError(f"YuNet model does not exist: {yunet_model}")
            if not hasattr(cv2, "FaceDetectorYN_create"):
                raise RuntimeError("This OpenCV build has no FaceDetectorYN support")
            self.yunet = cv2.FaceDetectorYN_create(
                str(yunet_model), "", (320, 320), 0.75, 0.30, 5000
            )

    def _prepare(self, bgr: np.ndarray) -> tuple[np.ndarray, float]:
        source_height, source_width = bgr.shape[:2]
        scale = min(1.0, self.detection_width / source_width)
        if scale < 1.0:
            small = cv2.resize(
                bgr,
                (round(source_width * scale), round(source_height * scale)),
                interpolation=cv2.INTER_AREA,
            )
        else:
            small = bgr
        return small, scale

    def _detect_yunet(self, small: np.ndarray, scale: float) -> dict[str, Any] | None:
        if self.yunet is None:
            return None
        height, width = small.shape[:2]
        self.yunet.setInputSize((width, height))
        _, detections = self.yunet.detect(small)
        if detections is None or not len(detections):
            return None
        row = max(detections, key=lambda item: float(item[2] * item[3]))
        x, y, w, h = (float(value) / scale for value in row[:4])
        eyes = [
            Rect((float(row[4]) - 8) / scale, (float(row[5]) - 8) / scale, 16 / scale, 16 / scale),
            Rect((float(row[6]) - 8) / scale, (float(row[7]) - 8) / scale, 16 / scale, 16 / scale),
        ]
        return {
            "face": Rect(x, y, w, h),
            "eyes": eyes,
            "detector": "opencv-yunet",
            "confidence": float(row[-1]),
        }

    @staticmethod
    def _largest(detections: Iterable[Iterable[int]]) -> tuple[int, int, int, int] | None:
        rows = list(detections)
        if not rows:
            return None
        x, y, w, h = max(rows, key=lambda item: int(item[2]) * int(item[3]))
        return int(x), int(y), int(w), int(h)

    def _detect_haar(self, small: np.ndarray, scale: float) -> dict[str, Any] | None:
        gray = cv2.cvtColor(small, cv2.COLOR_BGR2GRAY)
        gray = cv2.equalizeHist(gray)
        min_side = max(48, round(min(gray.shape[:2]) * 0.07))
        cascade_specs = [
            ("haar-frontal-default", self.frontal, gray, False),
            ("haar-frontal-alt2", self.frontal_alt, gray, False),
            ("haar-profile", self.profile, gray, False),
            ("haar-profile-mirrored", self.profile, cv2.flip(gray, 1), True),
        ]
        chosen = None
        method = None
        mirrored = False
        for name, cascade, image, is_mirrored in cascade_specs:
            detections = cascade.detectMultiScale(
                image,
                scaleFactor=1.08,
                minNeighbors=5,
                minSize=(min_side, min_side),
            )
            chosen = self._largest(detections)
            if chosen:
                method = name
                mirrored = is_mirrored
                break
        if chosen is None:
            return None
        x, y, w, h = chosen
        if mirrored:
            x = gray.shape[1] - x - w
        face_small = Rect(x, y, w, h)
        face = Rect(x / scale, y / scale, w / scale, h / scale)

        upper_height = max(1, round(face_small.height * 0.65))
        roi = gray[
            round(face_small.y) : round(face_small.y) + upper_height,
            round(face_small.x) : round(face_small.right),
        ]
        detected_eyes: list[Rect] = []
        if roi.size:
            eye_min = max(12, round(face_small.width * 0.07))
            eye_max = max(eye_min + 1, round(face_small.width * 0.28))
            candidates = self.eyes.detectMultiScale(
                roi,
                scaleFactor=1.08,
                minNeighbors=4,
                minSize=(eye_min, eye_min),
                maxSize=(eye_max, eye_max),
            )
            filtered = []
            for ex, ey, ew, eh in candidates:
                center_x = ex + ew / 2
                center_y = ey + eh / 2
                if not (face_small.width * 0.08 <= center_x <= face_small.width * 0.92):
                    continue
                if not (face_small.height * 0.12 <= center_y <= face_small.height * 0.62):
                    continue
                filtered.append((ex, ey, ew, eh))
            filtered.sort(key=lambda item: item[2] * item[3], reverse=True)
            for ex, ey, ew, eh in filtered[:2]:
                detected_eyes.append(
                    Rect(
                        (face_small.x + ex) / scale,
                        (face_small.y + ey) / scale,
                        ew / scale,
                        eh / scale,
                    )
                )
        return {
            "face": face,
            "eyes": detected_eyes,
            "detector": method,
            "confidence": None,
        }

    def detect(self, bgr: np.ndarray) -> dict[str, Any] | None:
        small, scale = self._prepare(bgr)
        result = self._detect_yunet(small, scale)
        if result is not None:
            return result
        return self._detect_haar(small, scale)


def full_screen_clearance(
    face: Rect,
    head: Rect,
    eye_band: Rect,
    caption: Rect,
    chin_gap: int,
    bottom_ui_y: int,
    bottom_ui_gap: int,
    ui_safe_left: int,
    ui_safe_right: int,
) -> dict[str, Any]:
    safe_bottom = bottom_ui_y - bottom_ui_gap
    chin_y = face.bottom
    required_top = chin_y + chin_gap
    max_top = safe_bottom - caption.height
    intersects_face = intersection_area(caption, face) > 0
    intersects_head = intersection_area(caption, head) > 0
    intersects_eyes = intersection_area(caption, eye_band) > 0
    below_chin = caption.y >= required_top
    clears_bottom_ui = caption.bottom <= safe_bottom
    clears_horizontal_ui = caption.x >= ui_safe_left and caption.right <= ui_safe_right
    can_fit_below_chin = required_top <= max_top

    if intersects_eyes or intersects_face or intersects_head or not below_chin:
        verdict = "MOVE_CAPTION" if can_fit_below_chin else "LAYOUT_SWITCH"
    elif not clears_bottom_ui or not clears_horizontal_ui:
        verdict = "LAYOUT_SWITCH"
    else:
        verdict = "PASS"
    return {
        "captionRect": caption.rounded(),
        "faceOutput": face.rounded(),
        "headOutput": head.rounded(),
        "eyeBandOutput": eye_band.rounded(),
        "chinY": round(chin_y),
        "requiredCaptionTop": round(required_top),
        "maximumCaptionTopBeforeBottomUi": round(max_top),
        "recommendedCaptionTop": round(required_top) if can_fit_below_chin else None,
        "availableHeightBelowChin": max(0, round(safe_bottom - required_top)),
        "intersectsFace": intersects_face,
        "intersectsHead": intersects_head,
        "intersectsEyes": intersects_eyes,
        "belowChinWithGap": below_chin,
        "clearsBottomUi": clears_bottom_ui,
        "clearsHorizontalUi": clears_horizontal_ui,
        "horizontalOverflowPx": max(0, round(ui_safe_left - caption.x)) + max(0, round(caption.right - ui_safe_right)),
        "canFitBelowChin": can_fit_below_chin,
        "verdict": verdict,
    }


def split_clearance(
    face: Rect,
    head: Rect,
    eye_band: Rect,
    source_width: int,
    source_height: int,
    caption: Rect,
    panel: Rect,
    separation_gap: int,
) -> dict[str, Any]:
    face_out = object_fit_cover_rect(face, source_width, source_height, panel)
    head_out = object_fit_cover_rect(head, source_width, source_height, panel)
    eyes_out = object_fit_cover_rect(eye_band, source_width, source_height, panel)
    intersects_face = intersection_area(caption, face_out) > 0
    intersects_head = intersection_area(caption, head_out) > 0
    intersects_eyes = intersection_area(caption, eyes_out) > 0
    panel_gap = round(panel.y - caption.bottom)
    clears_panel = panel_gap >= separation_gap
    verdict = "PASS" if not (intersects_face or intersects_head or intersects_eyes) and clears_panel else "LAYOUT_SWITCH"
    return {
        "captionRect": caption.rounded(),
        "speakerPanel": panel.rounded(),
        "faceOutput": face_out.rounded() if face_out else None,
        "headOutput": head_out.rounded() if head_out else None,
        "eyeBandOutput": eyes_out.rounded() if eyes_out else None,
        "intersectsFace": intersects_face,
        "intersectsHead": intersects_head,
        "intersectsEyes": intersects_eyes,
        "requiredSpeakerContentShiftDownPx": 0,
        "captionToSpeakerPanelGapPx": panel_gap,
        "clearsSpeakerPanelGap": clears_panel,
        "verdict": verdict,
    }


def collapse_intervals(records: list[dict[str, Any]], key_path: tuple[str, ...], sample_every: float) -> list[dict[str, Any]]:
    selected: list[tuple[float, str]] = []
    for record in records:
        value: Any = record
        for key in key_path:
            value = value[key]
        if value != "PASS":
            selected.append((record["timeSec"], value))
    if not selected:
        return []
    intervals = []
    start = previous = selected[0][0]
    verdict = selected[0][1]
    for timestamp, current_verdict in selected[1:]:
        contiguous = timestamp - previous <= sample_every * 1.55
        if current_verdict != verdict or not contiguous:
            intervals.append({"startSec": start, "endSec": min(previous + sample_every, records[-1]["timeSec"]), "verdict": verdict})
            start, verdict = timestamp, current_verdict
        previous = timestamp
    intervals.append({"startSec": start, "endSec": min(previous + sample_every, records[-1]["timeSec"]), "verdict": verdict})
    return intervals


def annotate_frame(
    frame: np.ndarray,
    record: dict[str, Any],
    bottom_ui_y: int,
) -> np.ndarray:
    # Recreate only the inexpensive portrait crop needed for QA. This is not a
    # composition render: one decoded source frame is resized into the approved
    # speaker card on a neutral canvas.
    canvas = np.full_like(frame, (238, 238, 236))
    check = record.get("titlePortrait") or record["expertTalkingHead"]
    panel = TITLE_SPEAKER_PANEL if record.get("titlePortrait") else EXPERT_SPEAKER_PANEL
    source_h, source_w = frame.shape[:2]
    scale = max(panel.width / source_w, panel.height / source_h)
    resized = cv2.resize(
        frame,
        (round(source_w * scale), round(source_h * scale)),
        interpolation=cv2.INTER_AREA,
    )
    crop_x = max(0, round((resized.shape[1] - panel.width) / 2))
    crop_y = max(0, round((resized.shape[0] - panel.height) / 2))
    crop = resized[crop_y : crop_y + round(panel.height), crop_x : crop_x + round(panel.width)]
    px, py = round(panel.x), round(panel.y)
    canvas[py : py + crop.shape[0], px : px + crop.shape[1]] = crop

    def draw(rect_data: dict[str, int] | None, color: tuple[int, int, int], thickness: int = 4):
        if not rect_data:
            return
        cv2.rectangle(
            canvas,
            (rect_data["x"], rect_data["y"]),
            (rect_data["right"], rect_data["bottom"]),
            color,
            thickness,
        )

    verdict = check["verdict"]
    caption_color = (0, 190, 0) if verdict == "PASS" else (20, 20, 235)
    draw(check["faceOutput"], (0, 220, 0), 5)
    draw(check["headOutput"], (255, 180, 0), 3)
    draw(check["eyeBandOutput"], (0, 220, 255), 3)
    draw(check["captionRect"], caption_color, 5)
    cv2.line(canvas, (0, bottom_ui_y), (canvas.shape[1], bottom_ui_y), (255, 0, 220), 4)
    cv2.line(canvas, (120, 0), (120, canvas.shape[0]), (180, 80, 255), 3)
    cv2.line(canvas, (840, 0), (840, canvas.shape[0]), (180, 80, 255), 3)
    mode = "TITLE PORTRAIT" if record.get("titlePortrait") else "EXPERT PORTRAIT"
    label = f"{record['timeSec']:.1f}s  {mode}  {verdict}"
    cv2.rectangle(canvas, (24, 24), (760, 92), (10, 10, 10), -1)
    cv2.putText(canvas, label, (44, 72), cv2.FONT_HERSHEY_SIMPLEX, 1.25, (255, 255, 255), 3, cv2.LINE_AA)
    return canvas


def make_contact_sheet(
    video_path: Path,
    records: list[dict[str, Any]],
    output_path: Path,
    bottom_ui_y: int,
    columns: int = 4,
    max_frames: int = 12,
) -> None:
    if not records:
        return
    count = min(max_frames, len(records))
    indices = sorted({round(i * (len(records) - 1) / max(1, count - 1)) for i in range(count)})
    cap = cv2.VideoCapture(str(video_path))
    tiles = []
    for index in indices:
        record = records[index]
        cap.set(cv2.CAP_PROP_POS_MSEC, record["timeSec"] * 1000)
        ok, frame = cap.read()
        if not ok:
            continue
        annotated = annotate_frame(frame, record, bottom_ui_y)
        tile = cv2.resize(annotated, (270, 480), interpolation=cv2.INTER_AREA)
        tiles.append(tile)
    cap.release()
    if not tiles:
        return
    rows = math.ceil(len(tiles) / columns)
    blank = np.zeros_like(tiles[0])
    while len(tiles) < rows * columns:
        tiles.append(blank.copy())
    sheet_rows = [np.hstack(tiles[row * columns : (row + 1) * columns]) for row in range(rows)]
    sheet = np.vstack(sheet_rows)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    cv2.imwrite(str(output_path), sheet, [cv2.IMWRITE_JPEG_QUALITY, 90])


def write_csv(records: list[dict[str, Any]], output_path: Path) -> None:
    fieldnames = [
        "sample_index", "time_sec", "frame_index", "detection_status", "detector",
        "face_x", "face_y", "face_width", "face_height", "chin_y",
        "head_x", "head_y", "head_width", "head_height",
        "portrait_face_x", "portrait_face_y", "portrait_face_width", "portrait_face_height",
        "expert_intersects_face", "expert_intersects_head", "expert_intersects_eyes",
        "expert_horizontal_ui_safe",
        "expert_below_chin_with_gap", "expert_can_fit_below_chin", "expert_verdict",
        "title_portrait_verdict",
        "split_intersects_face", "split_intersects_head", "split_intersects_eyes",
        "split_required_shift_down_px", "split_verdict",
    ]
    output_path.parent.mkdir(parents=True, exist_ok=True)
    with output_path.open("w", encoding="utf-8", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=fieldnames)
        writer.writeheader()
        for record in records:
            face = record.get("faceSource") or {}
            head = record.get("headSource") or {}
            expert = record.get("expertTalkingHead") or {}
            portrait_face = expert.get("faceOutput") or {}
            title = record.get("titlePortrait") or {}
            split = record.get("split") or {}
            writer.writerow({
                "sample_index": record["sampleIndex"],
                "time_sec": record["timeSec"],
                "frame_index": record["frameIndex"],
                "detection_status": record["detectionStatus"],
                "detector": record.get("detector"),
                "face_x": face.get("x"), "face_y": face.get("y"),
                "face_width": face.get("width"), "face_height": face.get("height"),
                "chin_y": expert.get("chinY"),
                "head_x": head.get("x"), "head_y": head.get("y"),
                "head_width": head.get("width"), "head_height": head.get("height"),
                "portrait_face_x": portrait_face.get("x"),
                "portrait_face_y": portrait_face.get("y"),
                "portrait_face_width": portrait_face.get("width"),
                "portrait_face_height": portrait_face.get("height"),
                "expert_intersects_face": expert.get("intersectsFace"),
                "expert_intersects_head": expert.get("intersectsHead"),
                "expert_intersects_eyes": expert.get("intersectsEyes"),
                "expert_horizontal_ui_safe": expert.get("clearsHorizontalUi"),
                "expert_below_chin_with_gap": expert.get("belowChinWithGap"),
                "expert_can_fit_below_chin": expert.get("canFitBelowChin"),
                "expert_verdict": expert.get("verdict", "MANUAL_REVIEW"),
                "title_portrait_verdict": title.get("verdict"),
                "split_intersects_face": split.get("intersectsFace"),
                "split_intersects_head": split.get("intersectsHead"),
                "split_intersects_eyes": split.get("intersectsEyes"),
                "split_required_shift_down_px": split.get("requiredSpeakerContentShiftDownPx"),
                "split_verdict": split.get("verdict", "MANUAL_REVIEW"),
            })


def write_report(payload: dict[str, Any], output_path: Path) -> None:
    summary = payload["summary"]
    config = payload["config"]
    lines = [
        "# Face/head tracking and caption-clearance QA",
        "",
        f"Video: `{payload['video']['path']}`.",
        f"Sparse sampling: `{config['sampleEverySec']} s`; processed `{summary['samples']}` frames "
        f"from `{payload['video']['frameCount']}` source frames.",
        f"Detector: `{summary['detectors']}`; detection rate: `{summary['detectionRatePercent']}%`.",
        "",
        "## Contract",
        "",
        f"- Expert portrait caption must start at least `{config['chinGapPx']} px` below the transformed chin; `{config['preferredChinGapPx']} px` is preferred.",
        f"- Caption must end by `Y={config['bottomUiY'] - config['bottomUiGapPx']}` "
        f"(`bottom UI Y={config['bottomUiY']}`, reserve `{config['bottomUiGapPx']} px`).",
        "- Caption may never intersect conservative head, face or eye regions.",
        "- If no legal vertical slot remains, switch layout instead of covering the speaker.",
        "",
        "## Measured result",
        "",
        f"- Expert portrait (`x120…864`, caption `y1192…1304`): `{summary['expertTalkingHeadVerdicts']}`.",
        f"- Short title portrait (`y540…1160`, active only in hook/title intervals): `{summary['titlePortraitVerdicts']}`.",
        f"- Expert split fallback (caption `y816…928`, speaker from `y960`): `{summary['splitVerdicts']}`.",
        f"- Current caption right edge: `X={config['expertCaption']['right']}`; combined UI-safe right edge: `X={config['uiSafeRight']}`.",
        f"- Transformed portrait chin range: `Y={summary['chinYRange']['min']}…{summary['chinYRange']['max']}`.",
        f"- Available full-screen top is at most `Y={config['bottomUiY'] - config['bottomUiGapPx'] - config['captionHeightPx']}`.",
        "",
        "## Decision",
        "",
        summary["decision"],
        "",
        "## Non-pass intervals",
        "",
        "### Expert talking head",
        "",
    ]
    for interval in summary["expertNonPassIntervals"]:
        lines.append(f"- `{interval['startSec']:.1f}–{interval['endSec']:.1f}s`: `{interval['verdict']}`")
    lines.extend(["", "### Short title portrait", ""])
    for interval in summary["titleNonPassIntervals"]:
        lines.append(f"- `{interval['startSec']:.1f}–{interval['endSec']:.1f}s`: `{interval['verdict']}`")
    lines.extend(["", "### Split", ""])
    for interval in summary["splitNonPassIntervals"]:
        lines.append(f"- `{interval['startSec']:.1f}–{interval['endSec']:.1f}s`: `{interval['verdict']}`")
    lines.extend([
        "",
        f"Approved presets: podcast `centerY={config['podcastCaption']['centerY']}` (separate format), "
        f"expert portrait `centerY={config['expertCaption']['centerY']}`, expert split `centerY={config['splitCaption']['centerY']}`, "
        f"full graphics `top={config['fullGraphicsCaption']['y']}`.",
        "",
        "This is sparse detector QA, not biometric identification. A missing or uncertain detection is",
        "fail-safe and requires manual keyframe review. The contact sheet remains mandatory.",
        "",
    ])
    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text("\n".join(lines), encoding="utf-8")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--video", type=Path, required=True)
    parser.add_argument("--output-json", type=Path, required=True)
    parser.add_argument("--output-csv", type=Path, required=True)
    parser.add_argument("--report-md", type=Path)
    parser.add_argument("--contact-sheet", type=Path)
    parser.add_argument("--sample-every", type=float, default=1.0)
    parser.add_argument("--detection-width", type=int, default=540)
    parser.add_argument("--chin-gap", type=int, default=32)
    parser.add_argument("--preferred-chin-gap", type=int, default=48)
    parser.add_argument("--split-separation-gap", type=int, default=32)
    parser.add_argument("--bottom-ui-y", type=int, default=1360)
    parser.add_argument("--bottom-ui-gap", type=int, default=24)
    parser.add_argument("--ui-safe-left", type=int, default=120)
    parser.add_argument("--ui-safe-right", type=int, default=840)
    parser.add_argument("--yunet-model", type=Path)
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    if args.sample_every <= 0:
        raise SystemExit("--sample-every must be positive")
    video_path = args.video.resolve()
    if not video_path.exists():
        raise SystemExit(f"Video does not exist: {video_path}")
    cap = cv2.VideoCapture(str(video_path))
    if not cap.isOpened():
        raise SystemExit(f"OpenCV could not open: {video_path}")
    width = round(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    height = round(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
    fps = float(cap.get(cv2.CAP_PROP_FPS))
    frame_count = round(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    duration = frame_count / fps if fps else float(cap.get(cv2.CAP_PROP_POS_MSEC)) / 1000
    if (width, height) != (1080, 1920):
        raise SystemExit(f"Expected 1080x1920 input, found {width}x{height}")
    try:
        portable_video_path = str(video_path.relative_to(Path.cwd().resolve()))
    except ValueError:
        portable_video_path = str(video_path)

    detector = SparseFaceDetector(args.detection_width, args.yunet_model)
    sample_times = []
    timestamp = 0.0
    while timestamp < duration - 1e-6:
        sample_times.append(round(timestamp, 3))
        timestamp += args.sample_every
    if not sample_times or duration - sample_times[-1] > args.sample_every * 0.45:
        sample_times.append(round(max(0.0, duration - 1 / max(fps, 1)), 3))

    records: list[dict[str, Any]] = []
    split_panel = SPLIT_SPEAKER_PANEL
    for sample_index, timestamp in enumerate(sample_times):
        cap.set(cv2.CAP_PROP_POS_MSEC, timestamp * 1000)
        ok, frame = cap.read()
        frame_index = round(cap.get(cv2.CAP_PROP_POS_FRAMES)) - 1
        base = {
            "sampleIndex": sample_index,
            "timeSec": timestamp,
            "frameIndex": frame_index,
        }
        if not ok:
            records.append({
                **base,
                "detectionStatus": "frame-read-failed",
                "detector": None,
                "faceSource": None,
                "headSource": None,
                "estimatedEyeBandSource": None,
                "detectedEyesSource": [],
                "expertTalkingHead": {"verdict": "MANUAL_REVIEW"},
                "split": {"verdict": "MANUAL_REVIEW"},
            })
            continue
        detection = detector.detect(frame)
        if detection is None:
            records.append({
                **base,
                "detectionStatus": "face-not-detected",
                "detector": None,
                "faceSource": None,
                "headSource": None,
                "estimatedEyeBandSource": None,
                "detectedEyesSource": [],
                "expertTalkingHead": {"verdict": "MANUAL_REVIEW"},
                "split": {"verdict": "MANUAL_REVIEW"},
            })
            continue
        face: Rect = detection["face"]
        face = clip_rect(face, Rect(0, 0, width, height)) or face
        head = expand_face_to_head(face, width, height)
        eye_band = estimated_eye_band(face)
        expert_face = object_fit_cover_rect(face, width, height, EXPERT_SPEAKER_PANEL)
        expert_head = object_fit_cover_rect(head, width, height, EXPERT_SPEAKER_PANEL)
        expert_eyes = object_fit_cover_rect(eye_band, width, height, EXPERT_SPEAKER_PANEL)
        if not expert_face or not expert_head or not expert_eyes:
            expert = {"verdict": "MANUAL_REVIEW"}
        else:
            expert = full_screen_clearance(
            expert_face, expert_head, expert_eyes, EXPERT_CAPTION,
            args.chin_gap, args.bottom_ui_y, args.bottom_ui_gap,
            args.ui_safe_left, args.ui_safe_right,
            )
            expert["preferredChinGapPx"] = args.preferred_chin_gap
            expert["preferredChinGapMet"] = EXPERT_CAPTION.y >= expert_face.bottom + args.preferred_chin_gap
        title = None
        if timestamp < 4.56 or 23.22 <= timestamp < 25.44:
            title_face = object_fit_cover_rect(face, width, height, TITLE_SPEAKER_PANEL)
            title_head = object_fit_cover_rect(head, width, height, TITLE_SPEAKER_PANEL)
            title_eyes = object_fit_cover_rect(eye_band, width, height, TITLE_SPEAKER_PANEL)
            if title_face and title_head and title_eyes:
                title = full_screen_clearance(
                    title_face, title_head, title_eyes, EXPERT_CAPTION,
                    args.chin_gap, args.bottom_ui_y, args.bottom_ui_gap,
                    args.ui_safe_left, args.ui_safe_right,
                )
                title["preferredChinGapPx"] = args.preferred_chin_gap
                title["preferredChinGapMet"] = EXPERT_CAPTION.y >= title_face.bottom + args.preferred_chin_gap
            else:
                title = {"verdict": "MANUAL_REVIEW"}
        split = split_clearance(
            face, head, eye_band, width, height, SPLIT_CAPTION, split_panel,
            args.split_separation_gap,
        )
        records.append({
            **base,
            "detectionStatus": "detected",
            "detector": detection["detector"],
            "confidence": detection["confidence"],
            "faceSource": face.rounded(),
            "headSource": head.rounded(),
            "estimatedEyeBandSource": eye_band.rounded(),
            "detectedEyesSource": [eye.rounded() for eye in detection["eyes"]],
            "expertTalkingHead": expert,
            "titlePortrait": title,
            "split": split,
        })
    cap.release()

    detected = [record for record in records if record["detectionStatus"] == "detected"]
    expert_counts: dict[str, int] = {}
    split_counts: dict[str, int] = {}
    title_counts: dict[str, int] = {}
    for record in records:
        expert_verdict = record["expertTalkingHead"]["verdict"]
        split_verdict = record["split"]["verdict"]
        expert_counts[expert_verdict] = expert_counts.get(expert_verdict, 0) + 1
        split_counts[split_verdict] = split_counts.get(split_verdict, 0) + 1
        if record.get("titlePortrait"):
            title_verdict = record["titlePortrait"]["verdict"]
            title_counts[title_verdict] = title_counts.get(title_verdict, 0) + 1
    chin_values = [record["expertTalkingHead"]["chinY"] for record in detected]
    detectors = sorted({record["detector"] for record in detected})
    full_pass = expert_counts.get("PASS", 0) == len(records)
    title_pass = title_counts.get("PASS", 0) == sum(title_counts.values())
    decision = (
        "Full-screen expert caption passes the sparse trajectory. Keep the fixed lane and still "
        "review the contact sheet."
        if full_pass and title_pass
        else "Do not keep the expert portrait caption on failing samples. Switch that interval "
        "to the approved expert split preset (compact centerY=872) or full graphics; never cover "
        "the transformed face/eyes merely to preserve a fixed caption anchor."
    )
    summary = {
        "samples": len(records),
        "detectedSamples": len(detected),
        "missingSamples": len(records) - len(detected),
        "detectionRatePercent": round(100 * len(detected) / max(1, len(records)), 1),
        "detectors": detectors,
        "chinYRange": {
            "min": min(chin_values) if chin_values else None,
            "max": max(chin_values) if chin_values else None,
        },
        "expertTalkingHeadVerdicts": expert_counts,
        "titlePortraitVerdicts": title_counts,
        "splitVerdicts": split_counts,
        "expertNonPassIntervals": collapse_intervals(records, ("expertTalkingHead", "verdict"), args.sample_every),
        "titleNonPassIntervals": collapse_intervals(
            [record for record in records if record.get("titlePortrait")],
            ("titlePortrait", "verdict"),
            args.sample_every,
        ),
        "splitNonPassIntervals": collapse_intervals(records, ("split", "verdict"), args.sample_every),
        "decision": decision,
    }
    payload = {
        "schemaVersion": 1,
        "tool": "face-caption-clearance.py",
        "video": {
            "path": portable_video_path,
            "width": width,
            "height": height,
            "fps": fps,
            "frameCount": frame_count,
            "durationSec": round(duration, 3),
        },
        "config": {
            "sampleEverySec": args.sample_every,
            "detectionWidthPx": args.detection_width,
            "chinGapPx": args.chin_gap,
            "preferredChinGapPx": args.preferred_chin_gap,
            "splitSeparationGapPx": args.split_separation_gap,
            "captionHeightPx": round(EXPERT_CAPTION.height),
            "bottomUiY": args.bottom_ui_y,
            "bottomUiGapPx": args.bottom_ui_gap,
            "uiSafeLeft": args.ui_safe_left,
            "uiSafeRight": args.ui_safe_right,
            "expertCaption": EXPERT_CAPTION.rounded(),
            "expertSpeakerPanel": EXPERT_SPEAKER_PANEL.rounded(),
            "titleSpeakerPanel": TITLE_SPEAKER_PANEL.rounded(),
            "splitCaption": SPLIT_CAPTION.rounded(),
            "podcastCaption": PODCAST_CAPTION.rounded(),
            "fullGraphicsCaption": FULL_GRAPHICS_CAPTION.rounded(),
            "splitSpeakerPanel": split_panel.rounded(),
        },
        "runtime": {
            "python": sys.version.split()[0],
            "platform": platform.platform(),
            "opencv": cv2.__version__,
            "numpy": np.__version__,
            "opencvDnnModuleAvailable": hasattr(cv2, "dnn"),
            "opencvYuNetApiAvailable": hasattr(cv2, "FaceDetectorYN_create"),
            "yunetModelProvided": bool(args.yunet_model),
            "mediapipeInstalled": importlib.util.find_spec("mediapipe") is not None,
            "onnxruntimeInstalled": importlib.util.find_spec("onnxruntime") is not None,
            "dlibInstalled": importlib.util.find_spec("dlib") is not None,
        },
        "summary": summary,
        "samples": records,
    }
    args.output_json.parent.mkdir(parents=True, exist_ok=True)
    args.output_json.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    write_csv(records, args.output_csv)
    if args.report_md:
        write_report(payload, args.report_md)
    if args.contact_sheet:
        make_contact_sheet(video_path, records, args.contact_sheet, args.bottom_ui_y)
    print(json.dumps(summary, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
