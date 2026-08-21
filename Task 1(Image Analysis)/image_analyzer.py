from PIL import Image, ExifTags
import os

image_path = "sample_photo.jpg"

if not os.path.exists(image_path):
    print("Image not found.")
else:
    image = Image.open(image_path)

    print("================================")
    print("IMAGE METADATA REPORT")
    print("================================")
    print()

    # Basic Image Information
    print("File Name       :", os.path.basename(image_path))
    print("File Size       :", round(os.path.getsize(image_path) / 1024, 2), "KB")
    print("File Format     :", image.format)
    print("Width           :", image.width, "pixels")
    print("Height          :", image.height, "pixels")
    print("Resolution      :", image.width, "x", image.height)
    print("Color Mode      :", image.mode)

    print()
    print("EXIF Metadata")
    print("-------------------------------")

    # Read EXIF information
    exif_data = image.getexif()

    if exif_data:
        camera = "Not available"
        date_taken = "Not available"
        orientation = "Not available"

        for tag_id, value in exif_data.items():
            tag_name = ExifTags.TAGS.get(tag_id, tag_id)

            if tag_name == "Model":
                camera = value

            elif tag_name == "DateTimeOriginal":
                date_taken = value

            elif tag_name == "Orientation":
                orientation = value

        print("Camera          :", camera)
        print("Date Taken      :", date_taken)
        print("Orientation     :", orientation)

        print()
        print("Other EXIF Data")
        print("-------------------------------")

        for tag_id, value in exif_data.items():
            tag_name = ExifTags.TAGS.get(tag_id, tag_id)
            print(f"{tag_name:<16}: {value}")

    else:
        print("Camera          : Not available")
        print("Date Taken      : Not available")
        print("Orientation     : Not available")

    image.close()