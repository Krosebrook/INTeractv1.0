---
name: block-dangerous-bash
enabled: true
event: bash
pattern: rm\s+-rf|dd\s+if=|mkfs|format\s+|>\s*/dev/|chmod\s+777
action: block
---

**Dangerous command blocked!**

This command could cause data loss or security issues:
- `rm -rf` - Recursive forced deletion
- `dd if=` - Disk imaging (can overwrite drives)
- `mkfs/format` - Filesystem formatting
- `> /dev/` - Writing to devices
- `chmod 777` - Unsafe permissions

Please verify the path and use a safer approach.
