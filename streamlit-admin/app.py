import streamlit as st
import pandas as pd
import requests
from io import StringIO
import base64
from datetime import datetime

# Page configuration
st.set_page_config(
    page_title="Price Checker Admin",
    page_icon="💰",
    layout="wide"
)

# GitHub configuration - YOU NEED TO UPDATE THESE
GITHUB_REPO = "your-username/your-repo"  # e.g., "johnsmith/price-data"
GITHUB_TOKEN = ""  # Optional: GitHub Personal Access Token for private repos
GITHUB_FILE_PATH = "products.csv"  # Path to CSV file in your repo
GITHUB_BRANCH = "main"  # or "master"

# Admin password (change this!)
ADMIN_PASSWORD = "admin123"

def check_password():
    """Simple password protection"""
    if "authenticated" not in st.session_state:
        st.session_state.authenticated = False

    if not st.session_state.authenticated:
        st.title("🔒 Admin Login")
        password = st.text_input("Password", type="password")
        if st.button("Login"):
            if password == ADMIN_PASSWORD:
                st.session_state.authenticated = True
                st.rerun()
            else:
                st.error("Incorrect password")
        st.stop()

def get_github_file():
    """Fetch products.csv from GitHub"""
    url = f"https://api.github.com/repos/{GITHUB_REPO}/contents/{GITHUB_FILE_PATH}?ref={GITHUB_BRANCH}"
    headers = {}
    if GITHUB_TOKEN:
        headers["Authorization"] = f"token {GITHUB_TOKEN}"

    try:
        response = requests.get(url, headers=headers)
        if response.status_code == 200:
            content = response.json()
            csv_content = base64.b64decode(content["content"]).decode("utf-8")
            return pd.read_csv(StringIO(csv_content)), content["sha"]
        else:
            return None, None
    except Exception as e:
        st.error(f"Error fetching file from GitHub: {e}")
        return None, None

def update_github_file(df, sha, commit_message):
    """Update products.csv on GitHub"""
    url = f"https://api.github.com/repos/{GITHUB_REPO}/contents/{GITHUB_FILE_PATH}"

    # Convert dataframe to CSV string
    csv_content = df.to_csv(index=False)
    csv_bytes = csv_content.encode("utf-8")
    csv_base64 = base64.b64encode(csv_bytes).decode("utf-8")

    headers = {"Authorization": f"token {GITHUB_TOKEN}"} if GITHUB_TOKEN else {}

    data = {
        "message": commit_message,
        "content": csv_base64,
        "branch": GITHUB_BRANCH,
        "sha": sha
    }

    try:
        response = requests.put(url, json=data, headers=headers)
        if response.status_code in [200, 201]:
            return True
        else:
            st.error(f"GitHub API error: {response.json()}")
            return False
    except Exception as e:
        st.error(f"Error updating GitHub: {e}")
        return False

def main():
    check_password()

    st.title("💰 Price Checker Admin Portal")
    st.markdown("---")

    # Sidebar
    with st.sidebar:
        st.header("Configuration")
        st.info(f"**Repo:** {GITHUB_REPO}")
        st.info(f"**File:** {GITHUB_FILE_PATH}")

        if st.button("🔄 Refresh from GitHub"):
            st.rerun()

        st.markdown("---")
        st.caption("Update prices here and push to GitHub")

    # Main content tabs
    tab1, tab2, tab3 = st.tabs(["📊 View & Edit", "📤 Upload CSV", "ℹ️ Instructions"])

    # Tab 1: View and Edit
    with tab1:
        st.header("Current Products")

        df, sha = get_github_file()

        if df is not None:
            st.success(f"✅ Loaded {len(df)} products from GitHub")

            # Search functionality
            search = st.text_input("🔍 Search products", "")
            if search:
                mask = df.astype(str).apply(lambda x: x.str.contains(search, case=False, na=False)).any(axis=1)
                df_display = df[mask]
            else:
                df_display = df

            # Display editable dataframe
            st.subheader(f"Products ({len(df_display)} items)")
            edited_df = st.data_editor(
                df_display,
                num_rows="dynamic",
                use_container_width=True,
                column_config={
                    "price": st.column_config.NumberColumn(
                        "Price",
                        format="$%.2f",
                        min_value=0.0
                    ),
                    "cost": st.column_config.NumberColumn(
                        "Cost",
                        format="$%.2f",
                        min_value=0.0
                    ),
                    "stock_quantity": st.column_config.NumberColumn(
                        "Stock",
                        min_value=0
                    )
                }
            )

            # Update button
            col1, col2 = st.columns([3, 1])
            with col1:
                commit_msg = st.text_input("Commit message", f"Updated prices - {datetime.now().strftime('%Y-%m-%d %H:%M')}")
            with col2:
                st.write("")  # Spacing
                st.write("")  # Spacing
                if st.button("💾 Save to GitHub", type="primary", use_container_width=True):
                    if update_github_file(edited_df, sha, commit_msg):
                        st.success("✅ Successfully updated GitHub!")
                        st.balloons()
                    else:
                        st.error("❌ Failed to update GitHub")

            # Statistics
            st.markdown("---")
            col1, col2, col3, col4 = st.columns(4)
            with col1:
                st.metric("Total Products", len(df))
            with col2:
                if "price" in df.columns:
                    st.metric("Avg Price", f"${df['price'].mean():.2f}")
            with col3:
                if "stock_quantity" in df.columns:
                    st.metric("Total Stock", int(df['stock_quantity'].sum()))
            with col4:
                if "category" in df.columns:
                    st.metric("Categories", df['category'].nunique())
        else:
            st.error("❌ Could not load products from GitHub. Check your configuration.")

    # Tab 2: Upload CSV
    with tab2:
        st.header("Upload New Product CSV")
        st.markdown("Upload a CSV file to replace the current products database.")

        uploaded_file = st.file_uploader("Choose a CSV file", type=['csv'])

        if uploaded_file is not None:
            try:
                new_df = pd.read_csv(uploaded_file)
                st.success(f"✅ File loaded: {len(new_df)} products")

                st.subheader("Preview")
                st.dataframe(new_df.head(10), use_container_width=True)

                # Validate required columns
                required_cols = ["barcode", "name", "price"]
                missing_cols = [col for col in required_cols if col not in new_df.columns]

                if missing_cols:
                    st.error(f"❌ Missing required columns: {', '.join(missing_cols)}")
                else:
                    st.success("✅ All required columns present")

                    commit_msg = st.text_input(
                        "Commit message",
                        f"Bulk upload - {len(new_df)} products - {datetime.now().strftime('%Y-%m-%d %H:%M')}",
                        key="upload_commit"
                    )

                    if st.button("📤 Upload to GitHub", type="primary"):
                        _, sha = get_github_file()  # Get current SHA
                        if sha:
                            if update_github_file(new_df, sha, commit_msg):
                                st.success("✅ Successfully uploaded to GitHub!")
                                st.balloons()
                            else:
                                st.error("❌ Failed to upload")
                        else:
                            st.error("❌ Could not get current file SHA from GitHub")

            except Exception as e:
                st.error(f"Error reading CSV: {e}")

    # Tab 3: Instructions
    with tab3:
        st.header("📖 Setup Instructions")

        st.markdown("""
        ### 1. GitHub Setup

        1. Create a new GitHub repository (public or private)
        2. Create a file named `products.csv` with these columns:
           - **barcode** (required)
           - **name** (required)
           - **price** (required)
           - Optional: upc, description, cost, category, brand, stock_quantity, min_stock_level, location

        3. Get your GitHub Personal Access Token:
           - Go to GitHub Settings → Developer Settings → Personal Access Tokens
           - Generate new token with `repo` permissions
           - Copy the token

        ### 2. Configure This App

        Edit the top of `app.py` and set:
        ```python
        GITHUB_REPO = "your-username/your-repo-name"
        GITHUB_TOKEN = "your_github_token_here"
        GITHUB_FILE_PATH = "products.csv"
        ADMIN_PASSWORD = "your_secure_password"
        ```

        ### 3. Deploy to Streamlit Cloud

        1. Push this app to your GitHub repo
        2. Go to [share.streamlit.io](https://share.streamlit.io)
        3. Connect your GitHub repo
        4. Add secrets in Streamlit Cloud settings:
           - `GITHUB_TOKEN = "your_token"`
           - `ADMIN_PASSWORD = "your_password"`

        ### 4. CSV Format Example

        ```csv
        barcode,name,price,category,stock_quantity
        1234567890123,Widget A,19.99,Electronics,50
        9876543210987,Widget B,29.99,Electronics,25
        ```

        ### 5. Update Your Price Checker Devices

        Once this is set up, your price checker devices will automatically
        fetch updated prices from GitHub every 6 hours.
        """)

if __name__ == "__main__":
    main()
