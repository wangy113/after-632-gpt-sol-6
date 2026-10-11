"""Denoise a Cycles PNG and save a local web asset. Requires ImageMagick and OIDN 2.5.1.
Usage: python3 scripts/process-render.py work/renders/hero-632.png public/assets/courtyard-hero.webp --oidn /path/to/oidnDenoise
The linear-light PFM conversion keeps the photographed color transform intact.
"""
from pathlib import Path
import argparse, subprocess
p=argparse.ArgumentParser();p.add_argument('source',type=Path);p.add_argument('destination',type=Path);p.add_argument('--oidn',required=True);args=p.parse_args()
linear=args.source.with_suffix('.linear.pfm');clean=args.source.with_suffix('.clean.pfm')
subprocess.run(['magick',str(args.source),'-colorspace','RGB','-endian','LSB',str(linear)],check=True)
subprocess.run([args.oidn,'--ldr',str(linear),'-o',str(clean),'--threads','5'],check=True)
args.destination.parent.mkdir(parents=True,exist_ok=True)
subprocess.run(['magick',str(clean),'-set','colorspace','RGB','-colorspace','sRGB','-quality','89',str(args.destination)],check=True)
linear.unlink();clean.unlink()
print(args.destination,args.destination.stat().st_size)
