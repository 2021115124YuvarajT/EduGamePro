import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns

# Load your datasets
traditional = pd.read_csv("../rocket_traditional/quiz_metadata.csv")
gamified = pd.read_csv("../rocket_game/rocket_game_data.csv")

# Add Method column
traditional['Method'] = 'Traditional'
gamified['Method'] = 'Gamified'

# Make sure columns are consistent
traditional = traditional.rename(columns={"PSI (questions/sec)": "PSI", "ATI (%)": "ATI"})
gamified = gamified.rename(columns={"PSI (questions/sec)": "PSI", "ATI (%)": "ATI"})

# Combine both datasets
df = pd.concat([traditional, gamified], ignore_index=True)

# Set seaborn style
sns.set(style="whitegrid")

# Calculate average PSI and ATI by method
avg_metrics = df.groupby("Method")[["PSI", "ATI"]].mean().reset_index()

# --- Bar Chart for Average PSI ---
plt.figure(figsize=(6, 5))
sns.barplot(x="Method", y="PSI", data=avg_metrics, palette="pastel")
plt.title("Average PSI by Learning Method")
plt.ylabel("PSI (questions/sec)")
plt.xlabel("Learning Method")
plt.ylim(0, avg_metrics["PSI"].max() * 1.1)
for i, row in avg_metrics.iterrows():
    plt.text(i, row["PSI"] + 0.01, f"{row['PSI']:.2f}", ha='center')
plt.tight_layout()
plt.show()

# --- Bar Chart for Average ATI ---
plt.figure(figsize=(6, 5))
sns.barplot(x="Method", y="ATI", data=avg_metrics, palette="Set2")
plt.title("Average ATI by Learning Method")
plt.ylabel("ATI (%)")
plt.xlabel("Learning Method")
plt.ylim(0, avg_metrics["ATI"].max() * 1.1)
for i, row in avg_metrics.iterrows():
    plt.text(i, row["ATI"] + 0.5, f"{row['ATI']:.2f}", ha='center')
plt.tight_layout()
plt.show()

# --- 2. Box Plot - Distribution Comparison ---
plt.figure(figsize=(12, 5))
plt.subplot(1, 2, 1)
sns.boxplot(x="Method", y="PSI", data=df)
plt.title("PSI Distribution")

plt.subplot(1, 2, 2)
sns.boxplot(x="Method", y="ATI", data=df)
plt.title("ATI Distribution")
plt.tight_layout()
plt.show()

# --- 3. Scatter Plot - PSI vs ATI ---
psi_threshold = df['PSI'].quantile(0.75)   # High PSI = top 25%
ati_threshold = df['ATI'].quantile(0.25)   # Low ATI = bottom 25%

# Identify exceptional points
exceptional = df[(df['PSI'] >= psi_threshold) & (df['ATI'] <= ati_threshold)]
normal = df[~((df['PSI'] >= psi_threshold) & (df['ATI'] <= ati_threshold))]

# Plotting
plt.figure(figsize=(8, 6))

# Normal scatterplot
sns.scatterplot(x="PSI", y="ATI", hue="Method", data=normal, s=100)

# Highlight exceptional points in red with 'X' marker
sns.scatterplot(x="PSI", y="ATI", data=exceptional, color='red', marker='X', s=120, label='High PSI & Low ATI')

# Final plot formatting
plt.title("PSI vs ATI - Traditional vs Gamified")
plt.xlabel("PSI (questions/sec)")
plt.ylabel("ATI (%)")
plt.grid(True)
plt.tight_layout()
plt.legend()
plt.show()

# --- 4. Pie Chart ---
# Define categorization function
def categorize(df):
    high_psi = df['PSI'] >= 0.20
    high_ati = df['ATI'] >= 85.00
    high_both = high_psi & high_ati
    
    count_both = high_both.sum()
    count_psi = (high_psi & ~high_ati).sum()
    count_ati = (high_ati & ~high_psi).sum()
    
    return [count_psi, count_ati, count_both]

# Categorize both methods
traditional_counts = categorize(traditional)
gamified_counts = categorize(gamified)

# Pie chart labels and colors
labels = ['High PSI Only', 'High ATI Only', 'High in Both']
colors = ['#66c2a5', '#fc8d62', '#8da0cb']

# Plot pie charts
fig, axes = plt.subplots(1, 2, figsize=(12, 6))

axes[0].pie(traditional_counts, labels=labels, autopct='%1.1f%%', startangle=90, colors=colors)
axes[0].set_title("Traditional Learning - Student Distribution")

axes[1].pie(gamified_counts, labels=labels, autopct='%1.1f%%', startangle=90, colors=colors)
axes[1].set_title("Gamified Learning - Student Distribution")

plt.tight_layout()
plt.show()
