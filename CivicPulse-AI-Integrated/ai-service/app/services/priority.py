def recommend_priority(text: str) -> tuple[str, str]:
    value = text.lower()
    critical = ["fire", "smoke", "live wire", "electrocution", "building collapse",
                "aag lag", "khula manhole", "khula live wire"]
    high = ["fallen pole", "open manhole", "exposed wire", "overflowing sewage",
            "tree branch has fallen", "sparks", "dhuaan", "gir sakta"]
    medium = ["pothole", "garbage", "not working", "leaking", "blocked",
              "band hai", "kachra", "paani nahi"]
    if any(term in value for term in critical):
        return "Critical", "Potential immediate safety threat detected; urgent human verification required."
    if any(term in value for term in high):
        return "High", "Potential public safety or major infrastructure issue detected."
    if any(term in value for term in medium):
        return "Medium", "Service disruption or maintenance issue detected."
    return "Low", "No listed urgency phrase detected; staff must confirm priority."
