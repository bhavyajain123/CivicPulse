# Model card — CivicConnect complaint classifier

- Model: TF-IDF word + character features with Logistic Regression.
- Intended use: assist staff in routing incoming civic complaints to a department/category.
- Categories: Roads, Water Supply, Sanitation, Street Lighting, Electricity, Public Safety.
- Languages: English and Romanized Hindi/Hinglish in this starter dataset.
- Not intended for: autonomous emergency dispatch, eligibility decisions, enforcement, or denial of service.
- Dataset: 3,000 synthetic/augmented rows, 60 seed descriptions with five wording variants each.
- Split: variants of a seed remain in one split; train/validation/test groups are separate.
- Limitations: small, authored dataset; narrow vocabulary; Romanized Hindi only; may fail on local dialects, spelling variation, mixed-script Hindi, ambiguous/multi-issue reports and unseen phrasing.
- Human oversight: required for category and priority decisions. Critical/high urgency must follow established emergency procedures.
- Before deployment: evaluate on independently collected, privacy-scrubbed citizen complaints from the target municipality and monitor errors by language and category.
