<#
  Builds the crisp hover-preview thumbnails for the home page services list.

  For every image in public/media/services it writes public/media/services/previews/<name>-<width>.jpg
  at 300, 450 and 600px wide (1x, 1.5x and 2x of the 300px preview card), cropped to exactly the card's
  300:169 frame, plus <name>-800w.jpg: the whole, uncropped image 800px wide for phones and small
  panels. Downscaling happens in halving steps with high-quality bicubic filtering, followed by a
  light unsharp mask, so line art and small text stay sharp.

  Run after adding or replacing a service image:
    powershell -ExecutionPolicy Bypass -File tools/make-service-previews.ps1
#>
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing

$code = @'
using System;
using System.Drawing;
using System.Drawing.Drawing2D;
using System.Drawing.Imaging;
using System.Runtime.InteropServices;

public static class PreviewBuilder
{
    static Bitmap Resample(Image src, Rectangle from, int width, int height)
    {
        Bitmap dst = new Bitmap(width, height, PixelFormat.Format24bppRgb);
        using (Graphics g = Graphics.FromImage(dst))
        using (ImageAttributes attrs = new ImageAttributes())
        {
            g.InterpolationMode = InterpolationMode.HighQualityBicubic;
            g.PixelOffsetMode = PixelOffsetMode.HighQuality;
            g.CompositingQuality = CompositingQuality.HighQuality;
            g.SmoothingMode = SmoothingMode.HighQuality;
            attrs.SetWrapMode(WrapMode.TileFlipXY);
            g.DrawImage(src, new Rectangle(0, 0, width, height), from.X, from.Y, from.Width, from.Height, GraphicsUnit.Pixel, attrs);
        }
        return dst;
    }

    /// Centre-crops to the target aspect, then halves repeatedly before the final resize.
    public static Bitmap Build(Image src, int width, int height)
    {
        double target = (double)width / height;
        double actual = (double)src.Width / src.Height;
        Rectangle crop = actual > target
            ? new Rectangle((int)Math.Round((src.Width - src.Height * target) / 2), 0, (int)Math.Round(src.Height * target), src.Height)
            : new Rectangle(0, (int)Math.Round((src.Height - src.Width / target) / 2), src.Width, (int)Math.Round(src.Width / target));

        Bitmap current = Resample(src, crop, crop.Width, crop.Height);
        while (current.Width / 2 >= width * 1.25)
        {
            Bitmap half = Resample(current, new Rectangle(0, 0, current.Width, current.Height), current.Width / 2, current.Height / 2);
            current.Dispose();
            current = half;
        }
        Bitmap result = Resample(current, new Rectangle(0, 0, current.Width, current.Height), width, height);
        current.Dispose();
        return result;
    }

    /// 3x3 unsharp mask that ignores near-flat areas so gradients and backgrounds stay clean.
    public static void Sharpen(Bitmap bmp, double amount, int threshold)
    {
        int w = bmp.Width, h = bmp.Height;
        Rectangle rect = new Rectangle(0, 0, w, h);
        BitmapData data = bmp.LockBits(rect, ImageLockMode.ReadWrite, PixelFormat.Format24bppRgb);
        int stride = data.Stride;
        byte[] src = new byte[stride * h];
        Marshal.Copy(data.Scan0, src, 0, src.Length);
        byte[] dst = (byte[])src.Clone();
        for (int y = 1; y < h - 1; y++)
            for (int x = 1; x < w - 1; x++)
                for (int c = 0; c < 3; c++)
                {
                    int i = y * stride + x * 3 + c;
                    int sum = 0;
                    for (int ky = -1; ky <= 1; ky++)
                        for (int kx = -1; kx <= 1; kx++) sum += src[(y + ky) * stride + (x + kx) * 3 + c];
                    double diff = src[i] - sum / 9.0;
                    if (Math.Abs(diff) < threshold) continue;
                    dst[i] = (byte)Math.Max(0, Math.Min(255, Math.Round(src[i] + amount * diff)));
                }
        Marshal.Copy(dst, 0, data.Scan0, dst.Length);
        bmp.UnlockBits(data);
    }
}
'@
Add-Type -TypeDefinition $code -ReferencedAssemblies System.Drawing

$root = Split-Path -Parent $PSScriptRoot
$source = Join-Path $root 'public\media\services'
$output = Join-Path $source 'previews'
[IO.Directory]::CreateDirectory($output) | Out-Null

$codec = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() | Where-Object { $_.MimeType -eq 'image/jpeg' }
$quality = New-Object System.Drawing.Imaging.EncoderParameters(1)
$quality.Param[0] = New-Object System.Drawing.Imaging.EncoderParameter([System.Drawing.Imaging.Encoder]::Quality, [long]90)

# Card frame is 300x169; every size keeps that exact ratio.
$sizes = @(@(300, 169), @(450, 254), @(600, 338))

foreach ($file in Get-ChildItem $source -File -Filter *.jpg) {
  $image = [System.Drawing.Image]::FromFile($file.FullName)
  try {
    foreach ($size in $sizes) {
      $thumb = [PreviewBuilder]::Build($image, $size[0], $size[1])
      try {
        [PreviewBuilder]::Sharpen($thumb, 0.35, 4)
        $path = Join-Path $output ('{0}-{1}.jpg' -f $file.BaseName, $size[0])
        $thumb.Save($path, $codec, $quality)
        '{0,-52} {1}x{2}  {3} KB' -f (Split-Path $path -Leaf), $size[0], $size[1], [math]::Round((Get-Item $path).Length / 1KB)
      } finally { $thumb.Dispose() }
    }
    # Uncropped 800px copy: same aspect as the source, so Build does not crop it.
    $h = [int][math]::Round(800 * $image.Height / $image.Width)
    $small = [PreviewBuilder]::Build($image, 800, $h)
    try {
      [PreviewBuilder]::Sharpen($small, 0.25, 4)
      $path = Join-Path $output ('{0}-800w.jpg' -f $file.BaseName)
      $small.Save($path, $codec, $quality)
      '{0,-52} {1}x{2}  {3} KB' -f (Split-Path $path -Leaf), 800, $h, [math]::Round((Get-Item $path).Length / 1KB)
    } finally { $small.Dispose() }
  } finally { $image.Dispose() }
}
