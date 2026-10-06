from PIL import Image, ImageEnhance, ImageFilter
import os

input_file = "input_image.png"
output_file = "enhanced_image.png"

if not os.path.exists(input_file):
    print("Input image not found.")

else:
    image = Image.open(input_file)

    print("================================")
    print("IMAGE ENHANCEMENT")
    print("================================")
    print()

    print("Input Image     :", input_file)
    print("Original Size   :", image.size)

    # Enhance contrast
    enhanced = ImageEnhance.Contrast(image).enhance(1.5)

    # Enhance color
    enhanced = ImageEnhance.Color(enhanced).enhance(1.2)

    # Enhance sharpness
    enhanced = ImageEnhance.Sharpness(enhanced).enhance(3.0)

    # Apply additional sharpening
    enhanced = enhanced.filter(
        ImageFilter.UnsharpMask(
            radius=2,
            percent=150,
            threshold=3
        )
    )

    enhanced.save(output_file)

    print()
    print("Enhancement completed!")
    print("Output Image    :", output_file)
    print("Enhanced Size   :", enhanced.size)