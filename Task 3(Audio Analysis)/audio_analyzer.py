from mutagen import File
import os

# Get the folder where this Python file is located
folder = os.path.dirname(os.path.abspath(__file__))
audio_path = os.path.join(folder, "sample_audio.mp3")

if not os.path.exists(audio_path):
    print("Audio file not found.")
    print("Looking for:", audio_path)

else:
    audio = File(audio_path)

    if audio is None:
        print("Unable to read audio file.")

    else:
        print("================================")
        print("AUDIO METADATA REPORT")
        print("================================")
        print()

        print("File Name       :", os.path.basename(audio_path))
        print("File Size       :", round(os.path.getsize(audio_path) / 1024, 2), "KB")
        print("File Format     :", os.path.splitext(audio_path)[1].upper())

        print()
        print("AUDIO INFORMATION")
        print("-------------------------------")

        if hasattr(audio.info, "length"):
            print("Duration        :", round(audio.info.length, 2), "seconds")
        else:
            print("Duration        : Not available")

        if hasattr(audio.info, "bitrate"):
            print("Bitrate         :", round(audio.info.bitrate / 1000, 2), "kbps")
        else:
            print("Bitrate         : Not available")

        if hasattr(audio.info, "sample_rate"):
            print("Sample Rate     :", audio.info.sample_rate, "Hz")
        else:
            print("Sample Rate     : Not available")

        if hasattr(audio.info, "channels"):
            print("Channels        :", audio.info.channels)
        else:
            print("Channels        : Not available")

        if hasattr(audio.info, "bits_per_sample"):
            print("Bits Per Sample :", audio.info.bits_per_sample)
        else:
            print("Bits Per Sample : Not available")

        print()
        print("METADATA")
        print("-------------------------------")

        if audio.tags:
            for key, value in audio.tags.items():
                print(f"{key:<20}: {value}")
        else:
            print("No metadata tags available.")