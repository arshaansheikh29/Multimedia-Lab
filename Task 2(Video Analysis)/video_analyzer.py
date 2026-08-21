import cv2
from moviepy import VideoFileClip
import os


video_path = "sample_video.mp4"


if not os.path.exists(video_path):
    print("Video not found.")

else:
    # -------------------------------
    # VIDEO INFORMATION
    # -------------------------------

    video = cv2.VideoCapture(video_path)

    if not video.isOpened():
        print("Unable to open video.")

    else:
        width = int(video.get(cv2.CAP_PROP_FRAME_WIDTH))
        height = int(video.get(cv2.CAP_PROP_FRAME_HEIGHT))
        fps = video.get(cv2.CAP_PROP_FPS)
        frame_count = int(video.get(cv2.CAP_PROP_FRAME_COUNT))

        duration = frame_count / fps if fps > 0 else 0

        file_size = os.path.getsize(video_path)

        # Video codec
        codec_number = int(video.get(cv2.CAP_PROP_FOURCC))

        codec = "".join([
            chr((codec_number >> 0) & 0xFF),
            chr((codec_number >> 8) & 0xFF),
            chr((codec_number >> 16) & 0xFF),
            chr((codec_number >> 24) & 0xFF)
        ])

        # -------------------------------
        # AUDIO INFORMATION
        # -------------------------------

        clip = VideoFileClip(video_path)

        audio = clip.audio

        print("================================")
        print("VIDEO METADATA REPORT")
        print("================================")
        print()

        print("File Name       :", os.path.basename(video_path))
        print("File Size       :", round(file_size / (1024 * 1024), 2), "MB")
        print("File Format     :", os.path.splitext(video_path)[1].upper())
        print("Duration        :", round(duration, 2), "seconds")
        print("Width           :", width, "pixels")
        print("Height          :", height, "pixels")
        print("Resolution      :", str(width) + " x " + str(height))
        print("Frame Rate      :", round(fps, 2), "FPS")
        print("Frame Count     :", frame_count)
        print("Video Codec     :", codec)

        print()
        print("AUDIO INFORMATION")
        print("-------------------------------")

        if audio is not None:

            print("Audio Present   : Yes")
            print("Audio Duration  :", round(audio.duration, 2), "seconds")
            print("Sample Rate     :", audio.fps, "Hz")

            if audio.nchannels:
                print("Audio Channels  :", audio.nchannels)
            else:
                print("Audio Channels  : Not available")

        else:
            print("Audio Present   : No")

        video.release()
        clip.close()