import librosa
import numpy as np
import json
import random
import sys
import time

# -------- CONFIG --------
filename = "song.mp3"
output_file = "note_map.json"
difficulty = "extreme"  # easy, medium, hard, extreme, impossible

difficulty_density = {
    "easy": 1,
    "medium": 2,
    "hard": 3,
    "extreme": 4,
    "impossible": 5
}
density = difficulty_density.get(difficulty.lower(), 2)

# Max hold duration in seconds per difficulty
hold_max = {
    "easy": 0,
    "medium": 0.5,
    "hard": 1,
    "extreme": 1.5,
    "impossible": 2
}
max_hold = hold_max.get(difficulty.lower(), 0.5)

min_spacing = 0.15  # minimum seconds between notes
hold_threshold = 3  # only allow hold notes if gap >= 3 sec

lanes = [0, 1]  # only 2 lanes

# -------- LOAD SONG --------
print(f"Loading '{filename}'...")
y, sr = librosa.load(filename)
print("Song loaded successfully.")

# -------- DETECT BEATS & ONSETS --------
tempo, beat_frames = librosa.beat.beat_track(y=y, sr=sr)
beat_times = librosa.frames_to_time(beat_frames, sr=sr)

onset_env = librosa.onset.onset_strength(y=y, sr=sr)
onset_frames = librosa.onset.onset_detect(onset_envelope=onset_env, sr=sr, backtrack=True)
onset_times = librosa.frames_to_time(onset_frames, sr=sr)

# -------- CREATE NOTE MAP --------
note_map = []

def create_note(time, lane, allow_hold=False):
    note = {"time": round(time, 3), "lane": lane}
    if allow_hold and max_hold > 0:
        note["hold"] = round(random.uniform(0.2, max_hold), 3)
    return note

all_times = sorted(list(beat_times) + list(onset_times))
last_time_per_lane = [-np.inf, -np.inf]

for i, t in enumerate(all_times):
    for _ in range(density):
        lane = random.choice(lanes)
        # Ensure minimum spacing per lane
        if t - last_time_per_lane[lane] < min_spacing:
            t += (min_spacing - (t - last_time_per_lane[lane]))
        # Only allow hold notes if gap to next note >= hold_threshold
        allow_hold = False
        if i < len(all_times) - 1:
            gap = all_times[i + 1] - t
            if gap >= hold_threshold:
                allow_hold = True
        note = create_note(t + random.uniform(0, 0.05), lane, allow_hold=allow_hold)
        note_map.append(note)
        last_time_per_lane[lane] = note["time"]

note_map.sort(key=lambda x: x["time"])

# -------- EXPORT --------
with open(output_file, "w") as f:
    json.dump(note_map, f, indent=2)

print(f"Note map saved to '{output_file}' with difficulty '{difficulty}'")
