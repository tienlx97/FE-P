# Pause automatic GitHub CI

The GitHub Actions verification workflow should stop running on every push and
pull request. Keep manual dispatch available. Local `harness/verify.sh` remains
the required quality gate for changes.
