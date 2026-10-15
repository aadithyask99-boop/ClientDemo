# Twenty app: call ingest

Source for the Twenty app that owns the Call object and the signed `ingest-call` route.
This folder holds only the two files we wrote. To run them:

```bash
npx create-twenty-app@latest app-spike --display-name "Inbound Voice"   # scaffolds and starts the twenty-app-dev server on :2020
cp src/objects/call.object.ts app-spike/src/objects/
cp src/logic-functions/ingest-call.ts app-spike/src/logic-functions/
# add an INGEST_SECRET entry to applicationVariables in app-spike/src/application-config.ts (isSecret: false for the spike)
cd app-spike && yarn twenty apply
```

Needs Node 24+. See ../SPIKES.md for what was verified.
