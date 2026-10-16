from pathlib import Path
import pdfplumber
import re
import json

data_dir = Path(r"C:\Users\gunas\Downloads\interview")
results = []
for pdf in sorted(data_dir.glob("*.pdf"))[:5]:
    try:
        with pdfplumber.open(str(pdf)) as doc:
            for i, page in enumerate(doc.pages[:2]):
                t = page.extract_text()
                if not t: continue
                for m in re.finditer(r'(?m)^\s*\d+\.\s+(.*?)(?:\n\s*(?:Ans|Answer|Solution)[\s:-])', t, re.I | re.S):
                    q = m.group(1)
                    q = re.sub(r'\s+', ' ', q).strip()
                    if 10 < len(q) < 150:
                        results.append({'file': pdf.name, 'q': q[:140]})
                        break
                if any(r['file']==pdf.name for r in results): break
    except Exception:
        continue
print(json.dumps(results, indent=2))