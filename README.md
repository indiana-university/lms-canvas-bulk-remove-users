# ess-lms-canvas-bulk-remove-users

To Debug w/ Intellij, forward 5005 (in kube-forwarder, or k9s) to any desired port and then hook intellij up to that

```
helm upgrade bulk-remove-users harbor-prd/k8s-boot -f helm-common.yaml -f helm-dev.yaml --install
```

```
helm upgrade bulk-remove-users harbor-prd/k8s-boot -f helm-common.yaml -f helm-snd.yaml --install
```