"""
Wrapper script to convert analysis_categories.json to JavaScript module.

Creates analysis_categories.js (for browser inclusion) and exports the analysis
structure for use with MapViewWithAnalysis and CategoryAnalysisDashboard.

Usage:
  python build_analysis_js.py
  # Output: analysis_categories.js, raw/analysis_categories.js
"""

import os
import json
import sys

# Repo root from this file's own location, so a clone runs anywhere.
# LOCATOR_X_ROOT overrides it when the data tree sits outside the repo.
R = (os.environ.get('LOCATOR_X_ROOT') or os.path.dirname(os.path.abspath(__file__))).rstrip(os.sep) + os.sep

def build_analysis_js():
    print("=" * 70)
    print("Analysis Categories JS Builder")
    print("=" * 70)
    print()

    try:
        # Load the analysis data
        with open(f'{R}analysis_categories.json', 'r') as f:
            analysis = json.load(f)

        print(f"Loaded analysis with {len(analysis.get('regions', {}))} regions")

        # Create JavaScript wrapper
        js_code = f"""window.ANALYSIS = {json.dumps(analysis, separators=(',', ':'))};"""

        # Write raw version (uncompressed)
        with open(f'{R}raw/analysis_categories.js', 'w') as f:
            f.write(js_code)

        raw_size = len(js_code)
        print(f"raw/analysis_categories.js: {raw_size / 1024:.1f} KB")

        # Optional: Compress (if gzip available)
        try:
            import gzip
            with gzip.open(f'{R}analysis_categories.js.gz', 'wt') as f:
                f.write(js_code)
            gz_size = (len(gzip.compress(js_code.encode()))) / 1024
            print(f"analysis_categories.js.gz: {gz_size:.1f} KB")
        except:
            pass

        # Also create a minified JSON version for faster loading
        with open(f'{R}analysis_categories.js', 'w') as f:
            f.write(js_code)

        print()
        print(f"✓ Created analysis_categories.js ({raw_size / 1024:.1f} KB)")
        print()
        print("Usage in HTML:")
        print('  <script src="analysis_categories.js"></script>')
        print("  <!-- Access via: window.ANALYSIS -->")
        print()

        return True

    except Exception as e:
        print(f"ERROR: {e}")
        return False

if __name__ == '__main__':
    success = build_analysis_js()
    sys.exit(0 if success else 1)
