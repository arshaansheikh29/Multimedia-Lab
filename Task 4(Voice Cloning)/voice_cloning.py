import os

from dotenv import load_dotenv
from elevenlabs.client import ElevenLabs

load_dotenv()

api_key = os.getenv("ELEVENLABS_API_KEY")

if not api_key:
    print("API key not found.")
    exit()

client = ElevenLabs(api_key=api_key)

input_file = "my_voice.mp3"
output_file = "converted_voice.mp3"

# ElevenLabs library voice used for the first test
voice_id = "JBFqnCBsd6RMkjVDRZzb"

if not os.path.exists(input_file):
    print("Input audio file not found.")
    exit()

print("Converting voice...")
print("Please wait...")

with open(input_file, "rb") as audio_file:

    audio_stream = client.speech_to_speech.convert(
        voice_id=voice_id,
        audio=audio_file,
        model_id="eleven_multilingual_sts_v2",
        output_format="mp3_44100_128"
    )

    with open(output_file, "wb") as output:
        for chunk in audio_stream:
            if chunk:
                output.write(chunk)

print()
print("Voice conversion completed!")
print("Output file:", output_file)