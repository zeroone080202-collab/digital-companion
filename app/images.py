"""Validate and re-encode images in memory. Pixel text is NOT de-identified."""
import base64
import binascii
from io import BytesIO
import re
import warnings
from PIL import Image, ImageOps, UnidentifiedImageError

Image.MAX_IMAGE_PIXELS = 12_000_000
ALLOWED = {'image/jpeg':'JPEG','image/png':'PNG','image/webp':'WEBP'}

class ImageValidationError(ValueError): pass

def sanitize_image(data_url: str, max_bytes: int=5*1024*1024) -> tuple[str,dict]:
    match=re.fullmatch(r'data:(image/(?:jpeg|png|webp));base64,([A-Za-z0-9+/=\r\n]+)',data_url)
    if not match: raise ImageValidationError('Only base64 JPEG, PNG, and WebP images are supported.')
    mime,payload=match.groups()
    if len(payload)>(max_bytes*4//3+12): raise ImageValidationError('Image exceeds 5 MB.')
    try: raw=base64.b64decode(payload,validate=True)
    except (binascii.Error,ValueError) as e: raise ImageValidationError('Invalid image encoding.') from e
    if len(raw)>max_bytes: raise ImageValidationError('Image exceeds 5 MB.')
    try:
        with warnings.catch_warnings():
            warnings.simplefilter('error',Image.DecompressionBombWarning)
            with Image.open(BytesIO(raw)) as check:
                if check.format!=ALLOWED[mime]: raise ImageValidationError('MIME and image signature do not match.')
                if check.width*check.height>12_000_000 or min(check.size)<16:
                    raise ImageValidationError('Image must be at least 16 px and at most 12 megapixels.')
                if getattr(check,'n_frames',1)>1: raise ImageValidationError('Animated images are unsupported.')
                check.verify()
            with Image.open(BytesIO(raw)) as im:
                original=im.size
                img=ImageOps.exif_transpose(im).convert('RGB')
                img.thumbnail((2048,2048))
                # A fresh image and fresh encoding omit EXIF/ICC/other metadata.
                clean=Image.new('RGB',img.size); clean.paste(img)
                out=BytesIO(); clean.save(out,format='JPEG',quality=92)
                return 'data:image/jpeg;base64,'+base64.b64encode(out.getvalue()).decode(), {
                    'original_width':original[0],'original_height':original[1],
                    'width':clean.width,'height':clean.height,'metadata_removed':True,
                    'pixel_identifiers_removed':False}
    except (UnidentifiedImageError,OSError,Image.DecompressionBombError,Image.DecompressionBombWarning) as e:
        raise ImageValidationError('Corrupt or oversized image.') from e
