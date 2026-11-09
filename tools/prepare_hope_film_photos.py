from pathlib import Path
from io import BytesIO
from PIL import Image, ImageOps
import json, requests, shutil

out=Path("video-photo-assets")
out.mkdir(exist_ok=True)
sources={
"01_gaza_people":(36637781,"Hosny Salah","Gaza"),
"02_gaza_school":(36450018,"Hosny Salah","Gaza"),
"03_gaza_art":(36450023,"Hosny Salah","Gaza"),
"04_gaza_women":(36193761,"Hosny Salah","Gaza"),
"05_gaza_camp":(36193767,"Hosny Salah","Gaza"),
"06_library":(35545648,"Yusuf Çelik","Illustrative international academic stock"),
"07_library_single":(16420237,"Ludovic Delot","Illustrative international academic stock"),
"08_classroom":(8199165,"Yan Krukau","Illustrative international academic stock"),
"09_laptops":(7777691,"Mikhail Nilov","Illustrative international academic stock"),
"10_home_study":(6001378,"Sam Lion","Illustrative international academic stock"),
"11_gaza_women_2":(36193770,"Hosny Salah","Gaza"),
}
session=requests.Session()
session.headers.update({"User-Agent":"Mozilla/5.0 (compatible; AcademicFilm/1.0)"})
records=[]
for name,(photo_id,credit,context) in sources.items():
    url=f"https://images.pexels.com/photos/{photo_id}/pexels-photo-{photo_id}.jpeg?auto=compress&cs=tinysrgb&w=1550"
    try:
        r=session.get(url,timeout=32)
        r.raise_for_status()
        im=Image.open(BytesIO(r.content))
        im=ImageOps.exif_transpose(im).convert("RGB")
        im.thumbnail((1550,1550),Image.Resampling.LANCZOS)
        target=out/f"{name}.jpg"
        im.save(target,format="JPEG",quality=86,optimize=True)
        records.append({"filename":target.name,"source_url":f"https://www.pexels.com/photo/{photo_id}/","photographer":credit,"context":context,"dimensions":im.size})
        print("DOWNLOADED",name,im.size,len(r.content),flush=True)
    except Exception as ex:
        print("FAILED",name,str(ex)[:200],flush=True)
founder=Path("assets/images/founder.jpg")
if founder.is_file():
    shutil.copy2(founder,out/"founder.jpg")
    print("FOUNDER_PHOTO", (out/"founder.jpg").stat().st_size)
else:
    print("FOUNDER_MISSING")
(out/"photo_sources.json").write_text(json.dumps(records,ensure_ascii=False,indent=2),encoding="utf-8")
print("TOTAL LICENSED STOCK PHOTOS",len(records))
if len(records)<5:raise SystemExit("Insufficient licensed Pexels photo assets")
