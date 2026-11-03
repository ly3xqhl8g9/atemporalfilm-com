# Production delivery

GitHub (`ly3xqhl8g9/atemporalfilm-com`, branch `main`) is the source of truth. The private pull mirror at <https://git.piatra.center/ly3xqhl8g9/atemporalfilm-com> has Actions enabled and pulls every ten minutes. Push changes to GitHub; Gitea builds the exact mirrored commit, pushes its short-SHA image tag to Hypod, and updates the existing Deployment `atemporalfilm` in namespace `craft-atemporalfilm`. Documentation-only pushes are skipped. Run the workflow manually for the first deployment, or to redeploy an existing commit.

The workflow follows CTDentar's pinned checkout, registry login, and Kubernetes setup actions. The container build installs the committed npm lockfile and runs the production Next.js build, including its type and lint checks. The runtime contains the standalone server, static assets, and private equipment PDF. Local environment files, Regie annotations, and equipment request logs are excluded from the image.

## Credentials

Configure these repository-level Actions secrets:

| Name | Source |
| --- | --- |
| `HYPOD_IDENTONYM` | Piatra CI registry credentials |
| `HYPOD_TOKEN` | Piatra CI registry credentials |
| `KUBE_CONFIG` | Kubeconfig for ServiceAccount `craft-atemporalfilm/atemporalfilm-ci` |

An administrator bootstraps `piatra/premises/edges/active/craft-atemporalfilm/ci-rbac.yaml` once. Premises owns this ServiceAccount, Role, RoleBinding, and token Secret. The token secret supplies the CI kubeconfig; the role can update only Deployment `atemporalfilm` and read rollout diagnostics in this namespace. It cannot read application secrets, change RBAC, or deploy to another tenant. Preserve this scoped kubeconfig when rotating CI secrets; the platform's shared kubeconfig has broader permissions.

Application credentials remain in the existing Kubernetes Secret `plurid-app-apps-atemporalfilm-com`: `IN_PRODUCTION`, `MJ_API_KEY`, `MJ_API_SECRET`, and `EMAILER_TO`. Registry pulls use the existing `hypod-cloud-registry` secret. Builds need no application credentials. The existing Service selector is `app: atemporalfilm`, with port 8080; TLS and public ingress stay owned by `piatra/premises/edges/active/craft-atemporalfilm/`.

## Verification and rollback

The job checks cluster permissions before applying, waits for the applied generation and every updated replica to become ready, then requires both public hostnames to report `ok <short-sha>` from `/api/health`. It also requests the homepage and About page. The health endpoint is dynamic, uncached, and does no rendering or external I/O. A new pod must pass its probes before the old pod is removed.

To roll back, run `kubectl -n craft-atemporalfilm rollout undo deployment/atemporalfilm`, then check readiness and the public health response. The Deployment retains five revisions. Revert the corresponding GitHub change to make the rollback persist through future builds.

The application keeps equipment request addresses in `/app/.gear` and sends Mailjet notifications. That file is pod-local and is lost when the pod is replaced; durable request storage requires an application/storage change. Image caches and temporary files are also ephemeral.
