import pandas as pd

# Load the CSV
df = pd.read_csv("course_ratings.csv")

# Find the index of the last column to keep
last_column_to_keep = "rec_score_stdev"
if last_column_to_keep in df.columns:
    keep_up_to_index = df.columns.get_loc(last_column_to_keep) + 1
    df = df.iloc[:, :keep_up_to_index]
else:
    raise ValueError(f"Column '{last_column_to_keep}' not found in the CSV.")

# Overwrite the original CSV
df.to_csv("course_ratings.csv", index=False)

print("Updated course_ratings.csv successfully.")
