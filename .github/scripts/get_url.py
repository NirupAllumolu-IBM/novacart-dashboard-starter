#!/usr/bin/env python3
import json, sys, os

# Print raw content for debugging
try:
    with open('/tmp/endpoints.json') as f:
        content = f.read()
    print(f"Raw content: {repr(content)}", file=sys.stderr)
    
    if not content.strip() or content.strip() == '[]':
        print("Empty response", file=sys.stderr)
        sys.exit(0)
    
    rows = json.loads(content)
    print(f"Rows: {rows}", file=sys.stderr)
    
    if not rows:
        sys.exit(0)
        
    print(f"Keys: {list(rows[0].keys())}", file=sys.stderr)
    
    for row in rows:
        for key, val in row.items():
            print(f"  {key} = {repr(val)}", file=sys.stderr)
            if val and any(x in str(key).lower() for x in ['url', 'ingress', 'host', 'endpoint']):
                print(val)
                sys.exit(0)
except Exception as e:
    print(f"Error: {e}", file=sys.stderr)
