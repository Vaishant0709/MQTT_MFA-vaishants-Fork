import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns
import numpy as np

# --- Configuration ---
CSV_FILE = 'experiment_data.csv'
# Set a professional style for the paper
sns.set_theme(style="whitegrid")
plt.rcParams.update({'font.size': 12})

def load_data():
    try:
        df = pd.read_csv(CSV_FILE)
        print(f"✅ Loaded {len(df)} records from {CSV_FILE}")
        return df
    except FileNotFoundError:
        print(f"❌ Error: Could not find '{CSV_FILE}'. Run the simulation first!")
        exit()

def plot_dashboard(df):
    # Create a 2x2 grid of plots
    fig, axes = plt.subplots(2, 2, figsize=(16, 10))
    fig.suptitle('Secure MQTT Performance Analysis', fontsize=20, weight='bold')

    # --- 1. End-to-End Latency Stability (Line Plot) ---
    # Shows network jitter and overall speed
    sns.lineplot(ax=axes[0, 0], x='Sequence', y='Latency_EndToEnd', data=df, 
                 marker='o', color='#2ecc71', linewidth=2)
    
    avg_lat = df['Latency_EndToEnd'].mean()
    axes[0, 0].axhline(avg_lat, color='red', linestyle='--', label=f'Avg: {avg_lat:.2f}ms')
    axes[0, 0].set_title('End-to-End Latency Stability', fontsize=14)
    axes[0, 0].set_ylabel('Latency (ms)')
    axes[0, 0].set_xlabel('Packet Sequence')
    axes[0, 0].legend()

    # --- 2. Encryption vs. Decryption Overhead (Dual Line Plot) ---
    # Compares the computational cost of securing vs. accessing data
    sns.lineplot(ax=axes[0, 1], x='Sequence', y='Encrypt_Time(Prev)', data=df, 
                 label='Encryption Cost', color='#e74c3c')
    sns.lineplot(ax=axes[0, 1], x='Sequence', y='Decrypt_Time', data=df, 
                 label='Decryption Cost', color='#3498db')
    
    axes[0, 1].set_title('Computational Overhead: Encrypt vs Decrypt', fontsize=14)
    axes[0, 1].set_ylabel('Time (ms)')
    axes[0, 1].set_xlabel('Packet Sequence')
    axes[0, 1].legend()

    # --- 3. Authentication Handshake Duration (Bar Chart) ---
    # Compares how long the 2FA process took for Publisher vs Subscriber
    # We take the mean (since it's static per session) or the first value
    pub_auth_avg = df['Pub_2FA_Time'].iloc[0] 
    sub_auth_avg = df['Sub_2FA_Time'].iloc[0]
    
    bars = axes[1, 0].bar(['Publisher Auth', 'Subscriber Auth'], 
                         [pub_auth_avg, sub_auth_avg], 
                         color=['#9b59b6', '#f1c40f'], width=0.5)
    
    axes[1, 0].set_title('2FA Handshake Duration (Initial Connection)', fontsize=14)
    axes[1, 0].set_ylabel('Time (ms)')
    axes[1, 0].bar_label(bars, fmt='%.2f ms') # Label bars with values

    # --- 4. Latency Distribution (Histogram + KDE) ---
    # Shows the consistency of the network (Jitter analysis)
    sns.histplot(ax=axes[1, 1], data=df, x='Latency_EndToEnd', kde=True, 
                 color='#34495e', bins=10)
    
    axes[1, 1].set_title('Latency Distribution (Jitter Analysis)', fontsize=14)
    axes[1, 1].set_xlabel('Latency (ms)')

    # Adjust layout and show
    plt.tight_layout(rect=[0, 0.03, 1, 0.95]) # Make room for suptitle
    
    # Save the plot for your paper
    plt.savefig('research_results_graph.png', dpi=300)
    print("✅ Graph saved as 'research_results_graph.png'")
    
    plt.show()

def print_summary_stats(df):
    print("\n" + "="*40)
    print("📊  PERFORMANCE SUMMARY STATISTICS")
    print("="*40)
    
    print(f"Total Packets:      {len(df)}")
    print(f"Avg Latency:        {df['Latency_EndToEnd'].mean():.2f} ms")
    print(f"Max Latency:        {df['Latency_EndToEnd'].max():.2f} ms")
    print(f"Avg Encryption Cost:{df['Encrypt_Time(Prev)'].mean():.4f} ms")
    print(f"Avg Decryption Cost:{df['Decrypt_Time'].mean():.4f} ms")
    print("-" * 40)
    print(f"Publisher Auth Time:{df['Pub_2FA_Time'].iloc[0]} ms")
    print(f"Subscriber Auth Time:{df['Sub_2FA_Time'].iloc[0]} ms")
    print("="*40 + "\n")

if __name__ == "__main__":
    df = load_data()
    print_summary_stats(df)
    plot_dashboard(df)