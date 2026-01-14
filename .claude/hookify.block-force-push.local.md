---
name: block-force-push-main
enabled: true
event: bash
pattern: git\s+push\s+.*--force.*main|git\s+push\s+.*--force.*master|git\s+push\s+-f.*main
action: block
---

**Force push to main/master blocked!**

Force pushing to protected branches can destroy team history.
Please use a feature branch workflow instead.
