# import pandas as pd
# import matplotlib.pyplot as plt
# import seaborn as sns

# # 1. Load Data
# try:
#     df = pd.read_csv('metrics.csv')
# except FileNotFoundError:
#     print("❌ Error: metrics.csv not found. Run the simulation first!")
#     exit()

# # Convert Timestamp to "Seconds from Start" for easier reading
# start_time = df['timestamp'].min()
# df['Seconds'] = (df['timestamp'] - start_time) / 1000

# # Set style
# sns.set_theme(style="whitegrid", palette="deep")
# plt.figure(figsize=(16, 12))
# plt.suptitle('MQTT Security Framework: Performance & Defense Analysis', fontsize=20, weight='bold')

# # ==============================================================================
# # GRAPH 1: Network Latency (Time Series)
# # Shows normal latency vs. Attack Detection spikes
# # ==============================================================================
# plt.subplot(2, 2, 1)
# network_data = df[df['type'] == 'NETWORK'].copy()

# # Cap extreme values for readability (e.g., timeouts > 10s)
# network_data['value'] = network_data['value'].clip(upper=8000)

# # Define Palette for Network
# palette_net = {
#     "Normal": "tab:blue",
#     "Replay_Attack": "tab:red",
#     "Blocked": "tab:red",
#     "Attack_Detected": "tab:red"
# }

# sns.scatterplot(
#     data=network_data,
#     x='Seconds',
#     y='value',
#     hue='details',
#     style='details',
#     s=80,
#     palette=palette_net
# )

# plt.axhline(y=5000, color='orange', linestyle='--', label='Replay Threshold (5s)')
# plt.title('End-to-End Latency & Attack Detection', fontsize=14)
# plt.ylabel('Latency (ms)')
# plt.xlabel('Time (s)')
# plt.legend(title='Traffic Type')


# # ==============================================================================
# # GRAPH 2: Encryption/Decryption Cost (Box Plot)
# # Shows the CPU cost of Speck-128 and Integrity Checks
# # ==============================================================================
# plt.subplot(2, 2, 2)
# crypto_data = df[df['type'] == 'CRYPTO']

# palette_crypto = {
#     "Speck128": "tab:blue",
#     "Normal": "tab:green", 
#     "Integrity_Failure": "tab:red"
# }

# sns.boxplot(
#     data=crypto_data,
#     x='metric',
#     y='value',
#     hue='details',
#     palette=palette_crypto
# )

# plt.title('Cryptographic Overhead (Speck-128)', fontsize=14)
# plt.ylabel('Processing Time (ms)')
# plt.xlabel('Operation')
# plt.legend(title='Outcome', loc='upper right')


# # ==============================================================================
# # GRAPH 3: Auth Performance (Handshake Speed)
# # Shows how fast the 2FA process is for valid devices
# # ==============================================================================
# plt.subplot(2, 2, 3)
# # Filter ONLY for Handshake Time (ignores login counts)
# handshake_data = df[(df['type'] == 'AUTH') & (df['metric'] == 'Handshake_Time')]

# if not handshake_data.empty:
#     sns.barplot(
#         data=handshake_data,
#         x='details',
#         y='value',
#         hue='details',      # Fixes FutureWarning
#         legend=False,       # Fixes FutureWarning
#         palette="viridis"   # Use a generic palette for dynamic Device IDs
#     )
#     plt.title('2FA Handshake Duration', fontsize=14)
#     plt.ylabel('Time (ms)')
#     plt.xlabel('Device ID')
#     plt.xticks(rotation=15) # Rotate labels if device IDs are long
# else:
#     plt.text(0.5, 0.5, "No Handshake Data", ha='center')


# # ==============================================================================
# # GRAPH 4: Auth Security (Brute Force Defense)
# # Shows Counts of Success vs. Blocked Attempts
# # ==============================================================================
# plt.subplot(2, 2, 4)
# # Filter ONLY for Login Attempts (ignores handshake times)
# login_data = df[(df['type'] == 'AUTH') & (df['metric'] == 'Login_Attempt')]

# palette_login = {
#     "Success": "tab:green",
#     "Failed_Credential": "orange",
#     "Blocked_BruteForce": "tab:red"
# }

# if not login_data.empty:
#     ax = sns.countplot(
#         data=login_data,
#         x='details',
#         hue='details',      # Fixes FutureWarning
#         legend=False,       # Fixes FutureWarning
#         palette=palette_login
#     )
#     plt.title('Brute Force Attack Defense', fontsize=14)
#     plt.xlabel('Outcome')
#     plt.ylabel('Count')
    
#     # Add count labels on top of bars
#     for container in ax.containers:
#         ax.bar_label(container)
# else:
#     plt.text(0.5, 0.5, "No Login Attempts Logged", ha='center')


# # Final Layout Adjustments
# plt.tight_layout(rect=[0, 0.03, 1, 0.95])
# plt.savefig('performance_results.png', dpi=300)
# print("✅ Graphs generated: performance_results.png")
# plt.show()

#updated
# import pandas as pd
# import matplotlib.pyplot as plt

# # --------------------------------------------
# # Load CSV
# # --------------------------------------------
# df = pd.read_csv('metrics.csv')

# # Normalize timestamp
# start = df['timestamp'].min()
# df['Seconds'] = (df['timestamp'] - start) / 1000

# # --------------------------------------------
# # Create Figure With 4 Subplots
# # --------------------------------------------
# fig, axs = plt.subplots(2, 2, figsize=(18, 12))
# fig.suptitle("MQTT-MFA: Combined Performance & Security Dashboard", fontsize=18, weight='bold')

# # ------------------------------------------------------
# # 1. Encryption/Decryption Performance (Time Series)
# # ------------------------------------------------------
# crypto = df[df['type'] == 'CRYPTO']
# axs[0, 0].scatter(crypto['Seconds'], crypto['value'], s=8)
# axs[0, 0].set_title("Encryption/Decryption Performance")
# axs[0, 0].set_xlabel("Time (s)")
# axs[0, 0].set_ylabel("Processing Time (ms)")
# axs[0, 0].grid(True)

# # ------------------------------------------------------
# # 2. End-to-End Latency (with Attack Spikes)
# # ------------------------------------------------------
# network = df[df['type'] == 'NETWORK']
# axs[0, 1].scatter(network['Seconds'], network['value'], s=10,
#                   c=(network['details'] != "Normal"))
# axs[0, 1].set_title("End-to-End Latency & Attack Events")
# axs[0, 1].set_xlabel("Time (s)")
# axs[0, 1].set_ylabel("Latency (ms)")
# axs[0, 1].grid(True)

# # ------------------------------------------------------
# # 3. Attack Detection Frequency
# # ------------------------------------------------------
# attack_counts = network['details'].value_counts()
# axs[1, 0].bar(attack_counts.index, attack_counts.values)
# axs[1, 0].set_title("Attack Types Detected")
# axs[1, 0].set_xlabel("Event")
# axs[1, 0].set_ylabel("Count")
# axs[1, 0].grid(axis='y')

# # ------------------------------------------------------
# # 4. Login Success / Fail / Blocked Counts
# # ------------------------------------------------------
# auth = df[(df['type'] == 'AUTH') & (df['metric'] == 'Login_Attempt')]
# login_counts = auth['details'].value_counts()

# axs[1, 1].bar(login_counts.index, login_counts.values)
# axs[1, 1].set_title("Login Success Rates")
# axs[1, 1].set_xlabel("Outcome")
# axs[1, 1].set_ylabel("Count")
# axs[1, 1].grid(axis='y')

# # --------------------------------------------
# # Improve spacing & show window
# # --------------------------------------------
# plt.tight_layout(rect=[0, 0.03, 1, 0.97])
# plt.show()


#new

# import pandas as pd
# import matplotlib.pyplot as plt
# import numpy as np

# # --------------------------------------------
# # Load Data
# # --------------------------------------------
# df = pd.read_csv('metrics.csv')

# # Normalize timestamps
# start = df['timestamp'].min()
# df['Seconds'] = (df['timestamp'] - start) / 1000


# # --------------------------------------------
# # Split datasets
# # --------------------------------------------
# crypto = df[df['type'] == 'CRYPTO'].copy()
# network = df[df['type'] == 'NETWORK'].copy()
# auth = df[(df['type'] == 'AUTH') & (df['metric'] == 'Login_Attempt')]


# # -----------------------------------------------------
# # COMPUTE STATISTICS
# # -----------------------------------------------------

# # Crypto Stats
# avg_crypto_time = crypto['value'].mean()

# # Network / Latency Stats
# max_latency = network['value'].max()
# attack_rows = network[network['details'] != "Normal"]
# attack_ratio = (len(attack_rows) / len(network)) * 100

# # Auth Login Stats
# login_counts = auth['details'].value_counts()
# total_login = login_counts.sum()

# login_success_pct = (login_counts.get("Success", 0) / total_login) * 100
# login_failed_pct = (login_counts.get("Failed_Credential", 0) / total_login) * 100
# login_blocked_pct = (login_counts.get("Blocked_BruteForce", 0) / total_login) * 100


# # -----------------------------------------------------
# # SET UP PLOTTING WINDOW
# # -----------------------------------------------------
# fig, axs = plt.subplots(2, 2, figsize=(18, 12))
# fig.suptitle("MQTT-MFA SECURITY ANALYSIS DASHBOARD", fontsize=19, weight='bold')

# # ==========================================================
# # 1. Crypto: Encryption / Decryption Performance (with anomalies)
# # ==========================================================
# threshold = avg_crypto_time * 1.8  # Define anomaly threshold

# normal_ops = crypto[crypto['value'] <= threshold]
# anomalies = crypto[crypto['value'] > threshold]

# axs[0, 0].scatter(normal_ops['Seconds'], normal_ops['value'], s=12, color='blue', label='Normal')
# axs[0, 0].scatter(anomalies['Seconds'], anomalies['value'], s=30, color='red', label='Anomaly')

# axs[0, 0].axhline(avg_crypto_time, color='green', linestyle='--', label=f"AVG={avg_crypto_time:.2f}ms")

# axs[0, 0].set_title("Crypto Performance (Speck-128)", fontsize=14)
# axs[0, 0].set_xlabel("Time (s)")
# axs[0, 0].set_ylabel("Processing Time (ms)")
# axs[0, 0].legend()
# axs[0, 0].grid(True)


# # ==========================================================
# # 2. End-to-End Latency (color-coded attack spikes)
# # ==========================================================
# colors = np.where(network['details'] == "Normal", "blue", "red")

# axs[0, 1].scatter(network['Seconds'], network['value'], s=10, c=colors)
# axs[0, 1].axhline(max_latency * 0.8, color='orange', linestyle='--', label="Warning Threshold")

# axs[0, 1].set_title("Network Latency (Attacks Highlighted)", fontsize=14)
# axs[0, 1].set_xlabel("Time (s)")
# axs[0, 1].set_ylabel("Latency (ms)")
# axs[0, 1].legend()
# axs[0, 1].grid(True)

# # Text overlay
# axs[0, 1].text(0.02, 0.95,
#                f"Max Latency: {max_latency:.2f} ms\nAttack Ratio: {attack_ratio:.1f}%",
#                transform=axs[0, 1].transAxes,
#                fontsize=11,
#                bbox=dict(facecolor='white', alpha=0.7))


# # ==========================================================
# # 3. Attack Detection Frequency
# # ==========================================================
# attack_counts = network['details'].value_counts()

# axs[1, 0].bar(attack_counts.index, attack_counts.values, color=['blue', 'red', 'red', 'red'])
# axs[1, 0].set_title("Attack Detection Count", fontsize=14)
# axs[1, 0].set_xlabel("Event Type")
# axs[1, 0].set_ylabel("Count")
# axs[1, 0].grid(axis='y')

# # Show ratio
# axs[1, 0].text(0.02, 0.92, f"Attack Ratio: {attack_ratio:.2f}%",
#                transform=axs[1, 0].transAxes,
#                fontsize=11,
#                bbox=dict(facecolor='white', alpha=0.7))


# # ==========================================================
# # 4. Login Success / Fail / Blocked (Percentages)
# # ==========================================================
# bars = axs[1, 1].bar(
#     ['Success', 'Failed', 'Blocked'],
#     [login_success_pct, login_failed_pct, login_blocked_pct],
#     color=['green', 'orange', 'red']
# )

# axs[1, 1].bar_label(bars, fmt="%.1f%%")
# axs[1, 1].set_title("Login Outcome Percentages", fontsize=14)
# axs[1, 1].set_ylabel("Percentage (%)")
# axs[1, 1].grid(axis='y')


# # -----------------------------------------------------
# # Display the window
# # -----------------------------------------------------
# plt.tight_layout(rect=[0, 0.03, 1, 0.97])
# plt.show()



# plot_result_enhanced.py
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
from matplotlib import gridspec
from mpl_toolkits.axes_grid1.inset_locator import inset_axes
import os


# ---------------------------
# Config / Paths
# ---------------------------
CSV_PATH = 'metrics.csv'          # change if your CSV is elsewhere
OUT_PATH = 'dashboard_enhanced.png'

# ---------------------------
# Load data
# ---------------------------
if not os.path.exists(CSV_PATH):
    raise FileNotFoundError(f"{CSV_PATH} not found. Put metrics.csv next to this script or update CSV_PATH.")

df = pd.read_csv(CSV_PATH)
start = df['timestamp'].min()
df['Seconds'] = (df['timestamp'] - start) / 1000.0

# Split by type
network = df[df['type'] == 'NETWORK'].copy().sort_values('Seconds').reset_index(drop=True)
crypto  = df[df['type'] == 'CRYPTO'].copy().sort_values('Seconds').reset_index(drop=True)
auth    = df[(df['type'] == 'AUTH') & (df['metric'] == 'Login_Attempt')].copy()

# ---------------------------
# Attack counts (per type)
# ---------------------------
attack_counts = network['details'].value_counts().sort_values(ascending=False)

# ---------------------------
# Network latency stats & rolling mean
# ---------------------------
if len(network) > 0:
    median_latency = network['value'].median()
    p75 = network['value'].quantile(0.75)
    p95 = network['value'].quantile(0.95)
    max_latency = network['value'].max()
else:
    median_latency = p75 = p95 = max_latency = 0.0

# rolling window chosen as a fraction of samples for hybrid smoothing
win_samples = max(3, int(len(network) * 0.03))  # ~3% of points, min 3
if len(network) > 0:
    network['rolling'] = network['value'].rolling(window=win_samples, min_periods=1, center=True).mean()
else:
    network['rolling'] = pd.Series(dtype=float)

# identify contiguous attack windows (details != 'Normal')
if len(network) > 0:
    network['is_attack'] = network['details'] != 'Normal'
    network['attack_grp'] = (network['is_attack'] != network['is_attack'].shift(1)).cumsum()
    attack_windows = []
    for grp, sub in network.groupby('attack_grp'):
        if sub['is_attack'].iloc[0]:
            attack_windows.append((sub['Seconds'].min(), sub['Seconds'].max(), sub['details'].mode().iloc[0]))
else:
    attack_windows = []

# ---------------------------
# Crypto anomalies (robust threshold)
# ---------------------------
if len(crypto) > 0:
    crypto_median = crypto['value'].median()
    crypto_iqr = crypto['value'].quantile(0.75) - crypto['value'].quantile(0.25)
    crypto_threshold = crypto_median + 3 * max(crypto_iqr, 1e-6)
    crypto['is_anom'] = crypto['value'] > crypto_threshold
else:
    crypto_median = crypto_threshold = 0.0
    crypto['is_anom'] = pd.Series(dtype=bool)

# ---------------------------
# Auth login percentages
# ---------------------------
login_counts = auth['details'].value_counts()
total_login = login_counts.sum()
if total_login > 0:
    login_percent = (login_counts / total_login * 100).round(1)
else:
    login_percent = pd.Series(dtype=float)

# ---------------------------
# Plot layout (GridSpec)
# ---------------------------
fig = plt.figure(figsize=(18, 12))
gs = gridspec.GridSpec(2, 2, figure=fig, width_ratios=[1,1], height_ratios=[1,1], wspace=0.28, hspace=0.35)
fig.suptitle("MQTT-MFA — Hybrid Network Latency & Security Dashboard", fontsize=18, fontweight='bold')

# Panel A: Crypto performance + anomalies
ax0 = fig.add_subplot(gs[0,0])
if len(crypto) > 0:
    normal = crypto[~crypto['is_anom']]
    anoms  = crypto[crypto['is_anom']]
    ax0.scatter(normal['Seconds'], normal['value'], s=10, label='Normal', alpha=0.7)
    ax0.scatter(anoms['Seconds'], anoms['value'], s=40, color='red', label='Anomaly', edgecolors='k')
    ax0.axhline(crypto_median, color='green', linestyle='--', label=f"Median={crypto_median:.2f} ms")
    ax0.axhline(crypto_threshold, color='red', linestyle=':', label=f"Anom Threshold={crypto_threshold:.2f} ms")
    ax0.set_ylim(bottom=0)
else:
    ax0.text(0.5, 0.5, "No CRYPTO data", ha='center', va='center', fontsize=12)
ax0.set_title("Cryptography Performance (Encryption/Decryption)")
ax0.set_xlabel("Time (ms)")
ax0.set_ylabel("Processing Time (ms)")
ax0.legend()
ax0.grid(True)


#PLOT B
# Panel B: Ultra-Clean & Insightful Network Latency View

ax1 = fig.add_subplot(gs[0, 1])



if len(network) > 0:



    # 1 — Heavily smoothed rolling average (main signal)

    smooth = network['value'].rolling(30, min_periods=1).mean()

    ax1.plot(

        network['Seconds'], smooth,

        color='tab:blue', lw=2.6,

        label='Latency (smoothed)'  # ensure labeled for external legend

    )



    # 2 — Attack windows (soft red bands but visible)

    for (s, e, typ) in attack_windows:

        ax1.axvspan(

            s, e,

            facecolor='#ffd6d6', edgecolor='#d9534f',

            alpha=0.35, linewidth=0.7

        )



    # 3 — Percentile + median (more distinct, darker)

    ax1.axhline(median_latency, color='darkgreen', linestyle='--', lw=1.6, label='Median')

    ax1.axhline(p95, color='darkred', linestyle='--', lw=1.6, label='95th pct')



    # 4 — Key inference stats

    normal_lat = network[network['value'] < p95]['value'].mean()

    attack_lat = network['value'].mean() if len(attack_windows) > 0 else 0



    stats_text = (

        f"Median: {median_latency:.1f} ms\n"

        f"95th pct: {p95:.1f} ms\n"

        f"Max: {max_latency:.1f} ms\n"

        f"Attack windows: {len(attack_windows)}\n"

        f"Avg(lat normal): {normal_lat:.1f} ms\n"

        f"Avg(lat attacks): {attack_lat:.1f} ms"

    )



    # place stats outside the plot (to the right)

    ax1.text(

        1.02, 0.98,

        stats_text,

        transform=ax1.transAxes,

        fontsize=9,

        va='top', ha='left',

        bbox=dict(facecolor='white', alpha=0.95, edgecolor='none'),

        clip_on=False

    )



else:

    ax1.text(

        0.5, 0.5, "No NETWORK data",

        ha='center', va='center', fontsize=12

    )



# labels (moved slightly outward to avoid overlap)

ax1.set_title("Network Latency (Smoothed) with Attack Windows")

ax1.set_xlabel("Time (ms)", labelpad=10)

ax1.set_ylabel("Latency (ms)", labelpad=10)

ax1.xaxis.set_label_coords(0.5, -0.12)

ax1.yaxis.set_label_coords(-0.12, 0.5)



# move legend outside to the right to reduce clutter inside the plot

ax1.legend(

    loc="lower left",

    bbox_to_anchor=(1.02, 1.0),

    fontsize=9,

    frameon=False

)



# lighter grid for a clean look

ax1.grid(True, alpha=0.25)
# plt.figure(figsize=(12, 6))
# ax = plt.gca()

# # ---------------------------
# # Raw + Smoothed Latency
# # ---------------------------
# ax.plot(network['MiliSeconds'], network['value'],
#         color='black', alpha=0.6, label="Raw latency")

# # Heavier smoothing (hybrid model)
# smooth = network['value'].rolling(30, min_periods=1).mean()
# ax.plot(network['MiliSeconds'], smooth,
#         color='tab:blue', lw=2.3, label="Smoothed latency")

# # ---------------------------
# # Attack Windows
# # ---------------------------
# for (s, e, typ) in attack_windows:
#     ax.axvspan(s, e, color='darkred', alpha=0.10)

# # ---------------------------
# # Percentile Lines
# # ---------------------------
# median_latency = network['value'].median()
# p75 = network['value'].quantile(0.75)
# p95 = network['value'].quantile(0.95)

# ax.axhline(median_latency, color='green',
#            linestyle='--', lw=1, label="Median")

# ax.axhline(p75, color='orange',
#            linestyle='--', lw=1, label="75th percentile (warn)")

# ax.axhline(p95, color='red',
#            linestyle='--', lw=1, label="95th percentile (critical)")

# # ---------------------------
# # Stats Box
# # ---------------------------
# max_latency = network['value'].max()

# stats_text = (
#     f"Median: {median_latency:.1f} ms\n"
#     f"75th pct: {p75:.1f} ms\n"
#     f"95th pct: {p95:.1f} ms\n"
#     f"Max spike: {max_latency:.1f} ms\n"
#     f"Attack windows: {len(attack_windows)}"
# )

# ax.text(
#     0.02, 0.98, stats_text,
#     transform=ax.transAxes,
#     fontsize=9,
#     va='top', ha='left',
#     bbox=dict(facecolor='white', alpha=0.9, edgecolor='none')
# )

# # ---------------------------
# # Inset Histogram
# # ---------------------------
# inset = inset_axes(ax, width="28%", height="38%", loc='upper right')
# inset.hist(network['value'], bins=25, alpha=0.85)
# inset.set_title("Latency Frequency", fontsize=9)
# inset.set_xlabel("ms", fontsize=7)
# inset.set_ylabel("Count", fontsize=7)

# # ---------------------------
# # Final Touches
# # ---------------------------
# ax.set_title("Hybrid Network Latency Model (Smoothed + Attack Visibility)", fontsize=14)
# ax.set_xlabel("Time (s)")
# ax.set_ylabel("Latency (ms)")

# ax.legend(fontsize=8, loc="upper left", framealpha=0.75)
# ax.grid(True, alpha=0.2)

# plt.tight_layout()


# # Panel B: Ultra-Clean & Insightful Network Latency View
# ax1 = fig.add_subplot(gs[0, 1])

# if len(network) > 0:

#     # 1 — Heavily smoothed rolling average (main signal)
#     smooth = network['value'].rolling(30, min_periods=1).mean()
#     ax1.plot(
#         network['Seconds'], smooth,
#         color='tab:blue', lw=2.2,
#         label='Smoothed Latency'
#     )

#     # 2 — Attack windows (soft red bands)
#     for (s, e, typ) in attack_windows:
#         ax1.axvspan(s, e, color='red', alpha=0.10)  # very subtle

#     # 3 — Percentile + median (clean, light)
#     ax1.axhline(median_latency, color='green', linestyle='--', lw=1)
#     ax1.axhline(p95, color='red', linestyle='--', lw=1)

#     # 4 — Key inference stats
#     normal_lat = network[network['value'] < p95]['value'].mean()
#     attack_lat = network['value'].mean() if len(attack_windows) > 0 else 0

#     stats_text = (
#         f"Median: {median_latency:.1f} ms\n"
#         f"95th pct: {p95:.1f} ms\n"
#         f"Max: {max_latency:.1f} ms\n"
#         f"Attack windows: {len(attack_windows)}\n"
#         f"Avg(lat normal): {normal_lat:.1f} ms\n"
#         f"Avg(lat attacks): {attack_lat:.1f} ms"
#     )

#     ax1.text(
#         0.02, 0.98,
#         stats_text,
#         transform=ax1.transAxes,
#         fontsize=9,
#         va='top', ha='left',
#         bbox=dict(facecolor='white', alpha=0.85, edgecolor='none')
#     )

# else:
#     ax1.text(
#         0.5, 0.5, "No NETWORK data",
#         ha='center', va='center', fontsize=12
#     )

# # labels
# ax1.set_title("Network Latency (Smoothed) with Attack Windows")
# ax1.set_xlabel("Time (s)")
# ax1.set_ylabel("Latency (ms)")

# ax1.legend(["Latency (smoothed)", "Median", "95th percentile"],
#            fontsize=8, loc=0, framealpha=0.5)

# ax1.grid(True, alpha=0.2)


# Panel C: Attack type counts (bar) + percent overlay
ax2 = fig.add_subplot(gs[1,0])
if len(network) > 0:
    colors = ['tab:blue' if idx=='Normal' else 'tab:red' for idx in attack_counts.index]
    attack_counts.plot(kind='bar', ax=ax2, color=colors, alpha=0.85)
    ax2.set_title("Attack Type Breakdown (counts)")
    ax2.set_xlabel("Event Type")
    ax2.set_ylabel("Count")
    ax2.grid(axis='y')
    for p in ax2.patches:
        ax2.annotate(int(p.get_height()), (p.get_x()+p.get_width()/2., p.get_height()), ha='center', va='bottom')
    pct = (attack_counts / attack_counts.sum() * 100).round(1).astype(str) + '%'
    tb_lines = [f"{t}: {c} ({pct.loc[t]})" for t,c in attack_counts.items()]
    # Put stats box in CLEAN upper-right corner
    ax2.text(
        0.98, 0.98, "\n".join(tb_lines),
        transform=ax2.transAxes,
        fontsize=9,
        va='top', ha='right',
        bbox=dict(facecolor='white', alpha=0.85)
    )

else:
    ax2.text(0.5, 0.5, "No NETWORK data", ha='center', va='center', fontsize=12)

# Panel D: Login outcomes (%) with counts
ax3 = fig.add_subplot(gs[1,1])
if total_login > 0:
    labels = login_percent.index.tolist()
    values = login_percent.values.tolist()
    # color heuristic
    colors = ['green' if lab.lower().startswith('s') else ('red' if 'Blocked' in lab else 'orange') for lab in labels]
    bars = ax3.bar(labels, values, color=colors, alpha=0.85)
    ax3.set_ylim(0, 100)
    ax3.set_title("Login Outcomes (%)")
    ax3.set_ylabel("Percent (%)")
    for bar, val in zip(bars, values):
        ax3.text(bar.get_x() + bar.get_width()/2, val + 1.5, f"{val:.1f}%", ha='center')
    bottom_text = "\n".join([f"{lab}: {int(login_counts.get(lab,0))}" for lab in labels])
    # Put login stats in upper-right corner
    ax3.text(
        0.98, 0.98, bottom_text,
        transform=ax3.transAxes,
        fontsize=9,
        va='top', ha='right',
        bbox=dict(facecolor='white', alpha=0.85)
    )

else:
    ax3.text(0.5, 0.5, "No Login attempts recorded", ha='center', va='center', fontsize=12)

# Save and show
plt.tight_layout(rect=[0, 0.03, 1, 0.97])
fig.savefig(OUT_PATH, dpi=200, bbox_inches='tight')
print(f"Saved dashboard to {OUT_PATH}")
plt.show()

