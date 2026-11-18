from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from app.core.config import DUPLICATE_THRESHOLD

def find_similar(text: str, existing: list[dict]) -> list[dict]:
    if not existing:
        return []
    corpus = [text] + [item["text"] for item in existing]
    matrix = TfidfVectorizer(
        analyzer="char_wb", ngram_range=(2, 5), strip_accents="unicode"
    ).fit_transform(corpus)
    scores = cosine_similarity(matrix[0:1], matrix[1:]).ravel()
    matches = []
    for item, score in zip(existing, scores):
        if float(score) >= DUPLICATE_THRESHOLD:
            matches.append({
                "complaint_id": item["complaint_id"],
                "similarity": round(float(score), 4)
            })
    return sorted(matches, key=lambda item: item["similarity"], reverse=True)
