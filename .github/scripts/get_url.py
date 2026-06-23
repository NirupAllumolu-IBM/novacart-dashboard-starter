#!/usr/bin/env python3
import json, sys

try:
    with open('/tmp/endpoints.json') as f:
        content = f.read()

    data = json.loads(content)

    # Handle nested arrays (multiple SQL statements in one call)
    # Flatten: find the array that contains endpoint data
    def find_endpoints(obj):
        if isinstance(obj, list):
            for item in obj:
                result = find_endpoints(item)
                if result:
                    return result
        elif isinstance(obj, dict):
            url = obj.get('ingress_url') or obj.get('INGRESS_URL') or ''
            if url and 'provisioning' not in url.lower() and 'check back' not in url.lower():
                print(f"Found URL: {url}", file=sys.stderr)
                return url
        return None

    url = find_endpoints(data)
    if url:
        print(url)
    else:
        print("No ready URL found yet", file=sys.stderr)

except Exception as e:
    print(f"Error: {e}", file=sys.stderr)
