# VeAIOps

An open-source AIOps suite from Volcengine that unifies ChatOps Agent, intelligent alerting, and observability, featuring a developer-friendly UI and comprehensive APIs.

## Prerequisites

- A working Kubernetes cluster and Helm v3.
- If you plan to expose services via Ingress, have an NGINX Ingress Controller installed. Prepare a resolvable domain and a TLS Secret if you enable TLS.
- If you use a private image registry, create image pull secrets in the namespace and reference them through `global.imagePullSecrets` or component-level `image.pullSecrets`.
- If you enable OpenTelemetry (OTEL) export, ensure a reachable OTLP endpoint.

> Limitation: the chart currently supports the **nginx** Ingress Class only (`ingress.className: nginx`).

## Install and upgrade

1) Optionally prepare a custom values file `my-values.yaml` (see the example below) to set domain, admin password, external databases, and observability.

2) Install the release (example namespace: `veaiops-system`):

```bash
# install with default values (run from charts/veaiops)
helm install veaiops -n veaiops-system --create-namespace --dependency-update .

# install with custom values
helm install veaiops -n veaiops-system --create-namespace --dependency-update -f my-values.yaml .
```

3) Check status:

```bash
kubectl get pods,svc -n veaiops-system
```

4) Expose access: if you enabled Ingress, configure DNS for `ingress.host` and ensure the `ingress.tlsSecretName` Secret is present when using TLS.

5) Upgrade the release when you change parameters or images:

```bash
# upgrade using the current chart directory
helm upgrade veaiops . --namespace veaiops-system --dependency-update

# upgrade with custom values
helm upgrade veaiops . -n veaiops-system --dependency-update -f my-values.yaml
```

6) Uninstall:

```bash
helm uninstall veaiops -n veaiops-system
```

## Configuration highlights

Below are commonly used and important settings. For the full list, see `values.yaml`.

### Global and exposure
- `global.imageRegistry`: global Docker registry to use.
- `global.imagePullSecrets`: array of image pull secret names (create the secrets in the namespace first).
- `global.security.allowInsecureImages`: allow insecure images; defaults to `false`.
- `ingress.className`: Ingress Class; currently supports `nginx` only; default `nginx`.
- `ingress.host`: external domain; default `veaiops.example-stable.com`.
- `ingress.tlsSecretName`: name of the TLS Secret; default empty (TLS disabled).
- `salt`: encryption salt; auto-generated if empty.
- `timeZone`: container time zone; default `Asia/Shanghai`.

### Environment variables (`env`)
- `INIT_ADMIN_USERNAME`: initial admin username; default `admin`.
- `INIT_ADMIN_EMAIL`: initial admin email; default `admin@veaiops.com`.
- `INIT_ADMIN_PASSWORD`: initial admin password; default `admin123456`. Change it before installation to a strong password.
- `WEBHOOK_SECRET`: secret token for webhook auth.
- `WEBHOOK_URL`: webhook destination Uniform Resource Locator (URL).
- `WEBHOOK_EVENT_CENTER_EXTERNAL_URL`: external URL for the event center webhook.
- `BOT_CHANNEL`: bot channel type (e.g., Lark); default `Lark`.
- `BOT_ID`, `BOT_NAME`, `BOT_SECRET`, `BOT_TEMPLATE_ID`: bot integration parameters.
- `LLM_API_BASE`: base URL for Large Language Model (LLM) API.
- `LLM_API_KEY`: LLM API key.
- `LLM_EMBEDDING_NAME`, `LLM_NAME`: LLM model names (embedding and main inference).
- `LOG_FILE`: log file name; default `veaiops.log`.
- `LOG_LEVEL`: log level (`DEBUG`, `INFO`, `WARNING`, `ERROR`); default `INFO`.
- `OTEL_ENABLED`: enable OpenTelemetry (OTEL) tracing; default `"false"`.
- `OTEL_EXPORTER_OTLP_ENDPOINT`: OTLP exporter endpoint URL.
- `OTEL_MAX_EXPORT_BATCH_SIZE`, `OTEL_MAX_QUEUE_SIZE`, `OTEL_SCHEDULE_DELAY_MILLIS`: OTEL batching and schedule settings.
- `OTEL_SERVICE_ENVIRONMENT`, `OTEL_SERVICE_NAME`, `OTEL_SERVICE_VERSION`, `OTEL_TRACE_ID_RATIO`: OTEL service metadata and sampling ratio.
- `VOLCENGINE_AK`, `VOLCENGINE_SK`: Volcengine Access Key (AK) and Secret Key (SK).
- `VOLCENGINE_TOS_ENDPOINT`, `VOLCENGINE_TOS_REGION`: Volcengine TOS endpoint and region.
- `VOLCENGINE_EXTRA_KB_COLLECTIONS`: extra knowledge base collections as a JSON array string (e.g., `'[]'`).

### Data stores
- `mongodb.enabled`: enable embedded MongoDB subchart (Bitnami); default `true`. Disable it to use external MongoDB.
- `mongodb.image.registry` / `repository` / `tag`: embedded MongoDB image settings (defaults point to `veaiops-registry-cn-beijing.cr.volces.com` and `veaiops/mongodb:latest`).
- `mongodb.auth.enabled` / `mongodb.auth.rootPassword`: enable auth and set root password; defaults enable auth with `Veaiops_123456`. Change the password for production.
- `mongodb.architecture`: `standalone` by default.
- `mongodb.persistence.enabled`: persistence for the embedded MongoDB; default `false`. For production, enable persistence or use an external MongoDB.
- `mongodb.external.host` / `username` / `password`: external MongoDB host, username, and password.
- `redis.enabled`: enable embedded Redis subchart (Bitnami); default `false`.
- `redis.architecture`: `standalone` by default.
- `redis.auth.enabled`: Redis auth; default `false`.
- `redis.image.*`: embedded Redis image settings (defaults point to `veaiops-registry-cn-beijing.cr.volces.com` and `veaiops/redis:latest`).
- `redis.master.persistence.enabled` / `redis.replica.persistence.enabled`: persistence toggles; default `false`.
- `redis.external.host` / `redis.external.password`: external Redis endpoint and password.

### Components and jobs
All components support image, resources, replica count, node selection, and scheduling strategy.
- `backend`: default image `veaiops/backend:latest`, `pullPolicy: Always`, `replicaCount: 1`, rolling updates with `maxUnavailable: 0`, `maxSurge: 50%`.
- `chatops`: default `veaiops/chatops:latest`, `replicaCount: 1`.
- `frontend`: default `veaiops/frontend:latest`, `replicaCount: 1`.
- `intelligentThreshold`: default `veaiops/intelligent-threshold:latest`, `replicaCount: 1`.
- `intelligentThresholdCron`: cron schedule `"0 0 * * *"`, keep 3 successful/failed jobs by default, image `veaiops/curlimages-curl:8.5.0`.
- `initial`: init job; default image `veaiops/initial:latest`.

## Example custom values.yaml

Save the following as `my-values.yaml` and tailor it to your environment:

```yaml
# Exposure and basics
ingress:
  className: nginx
  host: veaiops.example.com
  tlsSecretName: veaiops-tls

salt: ""            # Auto-generated if empty; set to pin a deterministic encryption salt.
timeZone: "Asia/Shanghai"

global:
  imageRegistry: ""
  imagePullSecrets: []  # Add secret names created in the namespace when using a private registry.
  security:
    allowInsecureImages: false

# Initial admin and optional integrations
env:
  INIT_ADMIN_USERNAME: "admin"
  INIT_ADMIN_EMAIL: "admin@example.com"
  INIT_ADMIN_PASSWORD: "CHANGE-ME"

  WEBHOOK_SECRET: ""
  WEBHOOK_URL: ""
  WEBHOOK_EVENT_CENTER_EXTERNAL_URL: ""

  BOT_CHANNEL: Lark
  BOT_ID: ""
  BOT_NAME: ""
  BOT_SECRET: ""
  BOT_TEMPLATE_ID: ""

  LLM_API_BASE: "https://your-llm-endpoint"
  LLM_API_KEY: "your-llm-key"
  LLM_EMBEDDING_NAME: ""
  LLM_NAME: ""

  LOG_FILE: veaiops.log
  LOG_LEVEL: INFO

  OTEL_ENABLED: "false"
  OTEL_EXPORTER_OTLP_ENDPOINT: ""
  OTEL_SERVICE_ENVIRONMENT: production
  OTEL_SERVICE_NAME: veaiops
  OTEL_SERVICE_VERSION: 0.0.1
  OTEL_TRACE_ID_RATIO: "1.0"

  VOLCENGINE_AK: ""
  VOLCENGINE_SK: ""
  VOLCENGINE_TOS_ENDPOINT: ""
  VOLCENGINE_TOS_REGION: ""
  VOLCENGINE_EXTRA_KB_COLLECTIONS: "[]"

# Prefer external MongoDB for production
mongodb:
  enabled: false  # disable embedded MongoDB subchart
  external:
    host: "mongodb.example.com:27017"
    username: "veaiops"
    password: "your-password"

# Use external Redis or enable embedded Redis as needed
redis:
  enabled: false
  external:
    host: "redis.example.com:6379"
    password: "your-password"

# Replicas and scheduling examples
backend:
  replicaCount: 2
  image:
    pullPolicy: Always
  resources: {}
  nodeSelector: {}
  affinity: {}
  tolerations: []

chatops:
  replicaCount: 1

frontend:
  replicaCount: 1

intelligentThreshold:
  replicaCount: 1

intelligentThresholdCron:
  schedule: "0 0 * * *"
```

## Troubleshooting

### Image pulls fail (ImagePullBackOff)
- Pod cannot start due to image pull errors.
- Verify whether a private registry requires credentials. Create a Secret in the namespace and reference it under `global.imagePullSecrets` or component `image.pullSecrets`.
- Check `image.registry`, `image.repository`, and `image.tag` are correct and available.

### Frontend is not accessible after startup
- The external domain does not load or the certificate is invalid.
- Confirm the Ingress resource is created and DNS for `ingress.host` resolves. Ensure the TLS Secret name matches `ingress.tlsSecretName` and the certificate is valid.
- Use `kubectl get ingress -n veaiops-system` and `kubectl describe ingress` to inspect errors.

### Init job or cron job fails repeatedly
- `initial` Job or `intelligentThresholdCron` fails.
- Check pod logs and events. Verify required `env.*` dependencies (external endpoints, credentials) are configured and reachable.
- If you rely on external MongoDB/Redis, confirm network connectivity and authentication.

---

Tip: list releases with `helm list -n veaiops-system`.
