from pathlib import Path
import json
import joblib
import pandas as pd
from sklearn.pipeline import Pipeline, FeatureUnion
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score, classification_report, confusion_matrix

ROOT = Path(__file__).resolve().parents[1]
DATA_PATH = ROOT / "training" / "complaints.csv"
df = pd.read_csv(DATA_PATH)
required = {"text", "category", "group_id", "split"}
if not required.issubset(df.columns) or df[list(required)].isnull().any().any():
    raise ValueError("Dataset must contain non-empty text, category, group_id and split columns.")
train=df[df.split=="train"].copy(); valid=df[df.split=="validation"].copy(); test=df[df.split=="test"].copy()
assert set(train.group_id).isdisjoint(valid.group_id) and set(train.group_id).isdisjoint(test.group_id) and set(valid.group_id).isdisjoint(test.group_id), "Group leakage detected"

def build_model(c):
    features=FeatureUnion([
      ("word",TfidfVectorizer(analyzer="word",ngram_range=(1,2),sublinear_tf=True,min_df=1,strip_accents="unicode")),
      ("char",TfidfVectorizer(analyzer="char_wb",ngram_range=(2,6),sublinear_tf=True,min_df=1,strip_accents="unicode"))
    ])
    return Pipeline([("features",features),("classifier",LogisticRegression(C=c,max_iter=5000,class_weight="balanced",solver="lbfgs"))])

best_model=None; best_c=None; best_score=-1
print("========== VALIDATION TUNING ==========")
for c in [0.01,0.03,0.1,0.3,1.0,3.0,10.0]:
    candidate=build_model(c); candidate.fit(train.text,train.category)
    score=accuracy_score(valid.category,candidate.predict(valid.text))
    print(f"C={c:<5} validation_accuracy={score:.4f}")
    if score>best_score: best_model,best_c,best_score=candidate,c,score
print(f"Selected C: {best_c}")
# Refit only on train+validation; the test split remains untouched.
development=pd.concat([train,valid],ignore_index=True); best_model.fit(development.text,development.category)
pred=best_model.predict(test.text); acc=accuracy_score(test.category,pred)
labels=sorted(df.category.unique()); report=classification_report(test.category,pred,zero_division=0,output_dict=True)
print("\n========== HELD-OUT TEST RESULTS ==========")
print(f"Test accuracy: {acc:.4f}"); print(classification_report(test.category,pred,zero_division=0))
matrix=confusion_matrix(test.category,pred,labels=labels); print("Labels:",labels); print(matrix)
artifacts=ROOT/"artifacts"; artifacts.mkdir(exist_ok=True)
joblib.dump(best_model,artifacts/"category_model.joblib")
metrics={"model_version":"3.0.0","selected_C":best_c,"validation_accuracy":best_score,"test_accuracy":acc,"train_rows":len(train),"validation_rows":len(valid),"test_rows":len(test),"categories":labels,"classification_report":report,"confusion_matrix":matrix.tolist(),"dataset_note":"Synthetic/curated demonstration data; not production validation."}
(artifacts/"training_metrics.json").write_text(json.dumps(metrics,indent=2),encoding="utf-8")
print(f"\nSaved model: {artifacts/'category_model.joblib'}"); print(f"Saved metrics: {artifacts/'training_metrics.json'}")
print("NOTE: 3,000 synthetic/curated rows do not establish real-world accuracy. Evaluate on independently collected, privacy-scrubbed complaints before deployment.")
