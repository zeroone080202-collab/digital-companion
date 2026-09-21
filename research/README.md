# Imaging research boundary

The supplied fracture archive is registered in `reports/imaging_audit.json` and `reports/imaging_manifest.jsonl`. No trained image model or diagnostic weights are shipped. Do not substitute a generic vision response for a validated fracture detector.

Before a separate research model is connected: confirm licensing (the supplied YAML says `Private`); obtain original, non-augmented images and patient/source grouping keys; inspect labels with a qualified reviewer; partition by patient/source before augmentation; keep a final test set untouched; evaluate errors and calibration on the intended population; document intended use and limitations. This checklist is not a clinical or regulatory approval.

`python tools/audit_imaging.py archive.zip --out reports` reproduces the structural audit. The archive is read without unpacking arbitrary paths. Neither raw images nor unreviewed user uploads enter the live knowledge index.
