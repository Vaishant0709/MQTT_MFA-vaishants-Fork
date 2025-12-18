import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns

# --- Configuration ---
CSV_FILE = 'experiment_data.csv'
sns.set_theme(style="whitegrid")
plt.rcParams.update({'font.size': 11})

def load_data():
    try:
        df = pd.read_csv(CSV_FILE)
        # Ensure numeric types
        cols = ['Latency_EndToEnd', 'Sequence', 'Encrypt_Time', 'Decrypt_Time']
        for col in cols:
            df[col] = pd.to_numeric(df[col], errors='coerce').fillna(0)
        return df
    except FileNotFoundError:
        print(f"❌ Error: '{CSV_FILE}' not found. Run the simulation first.")
        exit()

def plot_dashboard(df):
    fig = plt.figure(figsize=(18, 12))
    fig.suptitle('Secure MQTT: Comprehensive Security Analysis', fontsize=22, weight='bold')
    
    # Grid Layout: 2x2
    gs = fig.add_gridspec(2, 2)
    plt.subplots_adjust(hspace=0.4, wspace=0.3)

    # --- 1. Attack Timeline (Top Left) ---
    # Visualizes the sequence of events: Green dots for success, Red Xs for attacks
    ax1 = fig.add_subplot(gs[0, 0])
    
    # We map 'Success' to 1 and 'Attack' to 0 for vertical separation
    df['Event_Type'] = df['Status'].apply(lambda x: 1 if x == 'Success' else 0)
    
    sns.scatterplot(ax=ax1, x='Sequence', y='Event_Type', hue='Status', style='Status',
                    data=df, palette={'Success': '#2ecc71', 'Attack': '#e74c3c'}, 
                    markers={'Success': 'o', 'Attack': 'X'}, s=150)
    
    ax1.set_yticks([0, 1])
    ax1.set_yticklabels(['Blocked Attack', 'Valid Message'])
    ax1.set_title('1. Attack Timeline (Traffic Flow)', fontsize=14)
    ax1.set_xlabel('Message Sequence')
    ax1.set_ylabel('Event Status')
    ax1.legend(loc='center right')

    # --- 2. Security Effectiveness (Top Right) ---
    # Pie Chart of Valid vs Blocked
    ax2 = fig.add_subplot(gs[0, 1])
    status_counts = df['Status'].value_counts()
    colors = ['#2ecc71' if idx == 'Success' else '#e74c3c' for idx in status_counts.index]
    
    wedges, texts, autotexts = ax2.pie(status_counts, labels=status_counts.index, autopct='%1.1f%%', 
                                       colors=colors, startangle=140, explode=[0.05] * len(status_counts))
    
    plt.setp(autotexts, size=12, weight="bold", color="white")
    ax2.set_title('2. Security Effectiveness (Blocked Ratio)', fontsize=14)

    # --- 3. Latency Spikes (Bottom Left) ---
    # Shows the massive latency incurred by attacks (like Replay) vs normal low latency
    ax3 = fig.add_subplot(gs[1, 0])
    
    # Plot the line
    sns.lineplot(ax=ax3, x='Sequence', y='Latency_EndToEnd', data=df, 
                 color='#34495e', label='System Latency', linewidth=1)
    
    # Highlight Spikes (High Latency)
    spikes = df[df['Latency_EndToEnd'] > 100] # Threshold for "spike" visualization
    if not spikes.empty:
        sns.scatterplot(ax=ax3, x='Sequence', y='Latency_EndToEnd', data=spikes,
                        color='#e74c3c', s=100, marker='^', label='Latency Spike', zorder=5)

    ax3.set_title('3. Latency Analysis (Visualizing Attack Spikes)', fontsize=14)
    ax3.set_ylabel('Latency (ms)')
    ax3.set_xlabel('Packet Sequence')
    ax3.legend()

    # --- 4. Encryption vs Decryption Latency (Bottom Right) ---
    # Compares CPU cost
    ax4 = fig.add_subplot(gs[1, 1])
    
    # Filter for valid crypto data (attacks have 0 time)
    valid_crypto = df[(df['Encrypt_Time'] > 0) & (df['Decrypt_Time'] > 0)]
    
    if not valid_crypto.empty:
        sns.lineplot(ax=ax4, x='Sequence', y='Encrypt_Time', data=valid_crypto, 
                     label='Encryption', color='#9b59b6', linewidth=2)
        sns.lineplot(ax=ax4, x='Sequence', y='Decrypt_Time', data=valid_crypto, 
                     label='Decryption', color='#3498db', linewidth=2)
    
    ax4.set_title('4. Cryptographic Overhead (AES-GCM)', fontsize=14)
    ax4.set_ylabel('Processing Time (ms)')
    ax4.set_xlabel('Packet Sequence')
    ax4.legend()

    # Save and Show
    plt.savefig('final_report.png', dpi=300)
    print("✅ Graph saved as 'final_report.png'")
    plt.show()

if __name__ == "__main__":
    df = load_data()
    plot_dashboard(df)