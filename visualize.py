import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns
import numpy as np
import os

# --- Configuration ---
CSV_FILE = 'experiment_data.csv'
sns.set_theme(style="whitegrid")
plt.rcParams.update({
    'font.size': 12,
    'axes.labelsize': 14,
    'axes.titlesize': 16,
    'xtick.labelsize': 11,
    'ytick.labelsize': 11,
    'legend.fontsize': 12
})


def load_data():
    if not os.path.exists(CSV_FILE):
        print(f"❌ Error: '{CSV_FILE}' not found. Please run the simulation first.")
        exit()
    try:
        df = pd.read_csv(CSV_FILE)
        # Convert numeric columns
        cols = ['Latency_EndToEnd', 'Sequence', 'Encrypt_Time', 'Decrypt_Time', 'Timestamp']
        for col in cols:
            df[col] = pd.to_numeric(df[col], errors='coerce').fillna(0)
        return df
    except Exception as e:
        print(f"❌ Error reading CSV: {e}")
        exit()

# --- FIGURE 1: ATTACK TIMELINE ---
def plot_attack_timeline(df):
    plt.figure(figsize=(10, 6))
    
    # Map 'Success' to 1 and 'Attack' to 0 for vertical separation
    df['Event_Type'] = df['Status'].apply(lambda x: 1 if x == 'Success' else 0)
    
    # Create scatter plot
    sns.scatterplot(
        x='Sequence', 
        y='Event_Type', 
        hue='Status', 
        style='Status',
        data=df, 
        palette={'Success': '#2ecc71', 'Attack': '#e74c3c'}, 
        markers={'Success': 'o', 'Attack': 'X'}, 
        s=150
    )
    
    # Formatting
    plt.yticks([0, 1], ['Blocked Attack', 'Valid Message'])
    plt.title('Attack Mitigation Timeline')
    plt.xlabel('Message Sequence Number')
    plt.ylabel('System Status')
    plt.legend(title='Event Status', loc='center right')
    plt.tight_layout()
    
    filename = 'Fig1_AttackTimeline.png'
    plt.savefig(filename, dpi=300)
    print(f"✅ Generated {filename}")
    plt.close()

# --- FIGURE 2: END-TO-END LATENCY ---
def plot_latency_analysis(df):
    plt.figure(figsize=(10, 6))
    
    # Plot the main latency line (Standard Traffic)
    sns.lineplot(
        x='Sequence', 
        y='Latency_EndToEnd', 
        data=df, 
        color='#34495e', 
        label='End-to-End Latency', 
        linewidth=1.5
    )
    
    # Highlight Spikes (High Latency Attacks like Replay)
    # Threshold > 100ms indicates anomaly/attack processing or timeout
    spikes = df[df['Latency_EndToEnd'] > 100] 
    
    if not spikes.empty:
        sns.scatterplot(
            x='Sequence', 
            y='Latency_EndToEnd', 
            data=spikes,
            color='#e74c3c', 
            s=100, 
            marker='^', 
            label='Attack Detected (Latency Spike)', 
            zorder=5
        )

    # Formatting
    plt.title('End-to-End Latency Analysis')
    plt.ylabel('Latency (ms)')
    plt.xlabel('Message Sequence Number')
    plt.legend()
    plt.tight_layout()
    
    filename = 'Fig2_LatencyAnalysis.png'
    plt.savefig(filename, dpi=300)
    print(f"✅ Generated {filename}")
    plt.close()

# --- FIGURE 3: CRYPTOGRAPHIC OVERHEAD ---
def plot_crypto_overhead(df):
    plt.figure(figsize=(10, 6))
    
    # Filter for valid crypto data (attacks have 0 time)
    valid_crypto = df[(df['Encrypt_Time'] > 0) & (df['Decrypt_Time'] > 0)]
    
    if valid_crypto.empty:
        print("⚠️ No valid crypto metrics found. Skipping Fig 3.")
        return

    # Plot Encryption
    sns.lineplot(
        x='Sequence', 
        y='Encrypt_Time', 
        data=valid_crypto, 
        label='AES-GCM Encryption', 
        color='#9b59b6', 
        linewidth=2
    )
    
    # Plot Decryption
    sns.lineplot(
        x='Sequence', 
        y='Decrypt_Time', 
        data=valid_crypto, 
        label='AES-GCM Decryption', 
        color='#3498db', 
        linewidth=2,
        linestyle='--'
    )
    
    # Formatting
    plt.title('Cryptographic Processing Overhead')
    plt.ylabel('CPU Time (ms)')
    plt.xlabel('Message Sequence Number')
    plt.legend()
    plt.tight_layout()
    
    filename = 'Fig3_CryptoOverhead.png'
    plt.savefig(filename, dpi=300)
    print(f"✅ Generated {filename}")
    plt.close()


# --- FIGURE 4: CDF OF LATENCY (Reliability) ---
def plot_latency_cdf(df):
    plt.figure(figsize=(10, 6))
    
    # Filter for only successful packets (we don't care about attack latency for QoS)
    valid_data = df[df['Status'] == 'Success']
    
    if valid_data.empty:
        print("⚠️ No valid data for CDF. Skipping Fig 5.")
        return

    # Plot CDF
    sns.ecdfplot(data=valid_data, x='Latency_EndToEnd', linewidth=2.5, color='#2980b9')
    
    # Mark the 95th percentile
    p95 = np.percentile(valid_data['Latency_EndToEnd'], 95)
    plt.axvline(p95, color='#e74c3c', linestyle='--', alpha=0.7)
    plt.text(p95 + 1, 0.5, f' 95th Percentile: {p95:.1f}ms', color='#c0392b', fontsize=12)

    plt.title('CDF of End-to-End Latency (System Reliability)')
    plt.xlabel('Latency (ms)')
    plt.ylabel('Cumulative Probability')
    plt.grid(True, which='both', linestyle='--', alpha=0.7)
    plt.tight_layout()
    
    filename = 'Fig4_LatencyCDF.png'
    plt.savefig(filename, dpi=300)
    print(f"✅ Generated {filename}")
    plt.close()

# --- FIGURE 5: CRYPTO PROCESSING DISTRIBUTION (Box Plot) ---
def plot_processing_distribution(df):
    plt.figure(figsize=(8, 6))
    
    # Filter valid data
    valid_data = df[df['Status'] == 'Success'].copy()
    
    # Melt data for side-by-side boxplot
    melted_df = valid_data.melt(
        value_vars=['Encrypt_Time', 'Decrypt_Time'], 
        var_name='Operation', 
        value_name='Time_ms'
    )
    
    # Rename for cleaner labels
    melted_df['Operation'] = melted_df['Operation'].replace({
        'Encrypt_Time': 'Encryption',
        'Decrypt_Time': 'Decryption'
    })

    # Create Box Plot
    sns.boxplot(
        x='Operation', 
        y='Time_ms', 
        data=melted_df, 
        palette=['#9b59b6', '#3498db'],
        width=0.5,
        linewidth=1.5
    )
    
    plt.title('Distribution of Cryptographic Overhead')
    plt.ylabel('Processing Time (ms)')
    plt.xlabel('') # No x-label needed
    plt.tight_layout()
    
    filename = 'Fig5_CryptoBoxPlot.png'
    plt.savefig(filename, dpi=300)
    print(f"✅ Generated {filename}")
    plt.close()

# --- FIGURE 6: THROUGHPUT UNDER ATTACK (Load Analysis) ---
def plot_throughput(df):
    plt.figure(figsize=(10, 6))
    
    # Normalize timestamp to start at 0 seconds
    start_time = df['Timestamp'].min()
    df['Time_Sec'] = ((df['Timestamp'] - start_time) / 1000).astype(int)
    
    # Group by Second and Status
    throughput = df.groupby(['Time_Sec', 'Status']).size().unstack(fill_value=0)
    
    # Fill missing seconds with 0 (for continuous lines)
    full_range = np.arange(df['Time_Sec'].min(), df['Time_Sec'].max() + 1)
    throughput = throughput.reindex(full_range, fill_value=0)

    # Plot Lines
    if 'Success' in throughput.columns:
        plt.plot(throughput.index, throughput['Success'], label='Valid Throughput', color='#2ecc71', linewidth=2)
    
    if 'Attack' in throughput.columns:
        plt.plot(throughput.index, throughput['Attack'], label='Attack Traffic', color='#e74c3c', linestyle='--', linewidth=2)
        # Highlight attack zones
        plt.fill_between(throughput.index, throughput['Attack'], color='#e74c3c', alpha=0.1)

    plt.title('System Throughput vs. Attack Load')
    plt.xlabel('Time (Seconds)')
    plt.ylabel('Messages Per Second (MPS)')
    plt.legend(loc='upper right')
    plt.tight_layout()
    
    filename = 'Fig6_ThroughputAnalysis.png'
    plt.savefig(filename, dpi=300)
    print(f"✅ Generated {filename}")
    plt.close()

if __name__ == "__main__":
    print("📊 Generating Result Figures...")
    df = load_data()
    
    plot_attack_timeline(df)
    plot_latency_analysis(df)
    plot_crypto_overhead(df)
    plot_latency_cdf(df)
    plot_processing_distribution(df)
    plot_throughput(df)
    
    print("\n🎉 All figures generated successfully in the current directory.")